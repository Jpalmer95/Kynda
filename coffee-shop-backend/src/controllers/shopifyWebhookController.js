const crypto = require('crypto');
const logger = require('../utils/logger');
const printfulService = require('../services/printfulService');
require('dotenv').config({ path: '../../.env' }); // Adjust path if controller is moved

const SHOPIFY_WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET;

// Middleware to verify Shopify webhook signature
function verifyShopifyWebhook(req, res, next) {
  if (!SHOPIFY_WEBHOOK_SECRET) {
    logger.error('Shopify webhook secret is not configured. Denying webhook request.');
    return res.status(500).send('Webhook secret not configured.');
  }

  const hmacHeader = req.get('X-Shopify-Hmac-Sha256');
  if (!hmacHeader) {
    logger.warn('Received Shopify webhook without X-Shopify-Hmac-Sha256 header.');
    return res.status(401).send('Missing Shopify HMAC signature.');
  }

  if (!req.rawBody) {
    logger.error('Raw body not available for webhook verification. Ensure rawBodyMiddleware is used before this middleware.');
    return res.status(500).send('Internal server error: Raw body not available.');
  }

  try {
    const generatedHash = crypto
      .createHmac('sha256', SHOPIFY_WEBHOOK_SECRET)
      .update(req.rawBody) // req.rawBody is a Buffer
      .digest('base64');

    if (generatedHash === hmacHeader) {
      // HMAC is valid. Now, parse the rawBody into req.body for subsequent handlers.
      // This makes req.body available as if express.json() had run.
      req.body = JSON.parse(req.rawBody.toString('utf8'));
      next();
    } else {
      logger.warn('Invalid Shopify HMAC signature.');
      res.status(403).send('Invalid HMAC signature.');
    }
  } catch (error) {
    logger.error('Error during webhook verification or body parsing:', error);
    res.status(400).send('Invalid payload format or signature error.');
  }
}


async function handleOrderCreateWebhook(req, res) {
  try {
    // req.body is now populated by the verifyShopifyWebhook middleware after successful verification
    const shopifyOrder = req.body; 
    logger.info(`Received and verified Shopify order creation webhook for order ID: ${shopifyOrder.id} (External: ${shopifyOrder.name})`);

    const printfulItems = [];
    const customerDetails = shopifyOrder.customer;
    const shippingAddress = shopifyOrder.shipping_address;

    if (!shippingAddress) {
      logger.warn(`Order ${shopifyOrder.id} has no shipping address. Cannot forward to Printful.`);
      return res.status(200).send('Order has no shipping address, not forwarding to Printful.');
    }
    
    const customerEmail = customerDetails?.email || shippingAddress?.email || 'no-reply@example.com';
    if (customerEmail === 'no-reply@example.com') {
        logger.warn(`Order ${shopifyOrder.id} has no customer or shipping address email. Using placeholder for Printful.`);
    }

    for (const item of shopifyOrder.line_items) {
      if (item.vendor === 'Printful_DS') {
        logger.info(`Identified Printful item: ${item.name} (SKU: ${item.sku})`);
        
        const skuParts = item.sku ? item.sku.split('PFUL-') : [];
        const printfulVariantId = skuParts.length > 1 ? parseInt(skuParts[1], 10) : null;

        if (!printfulVariantId || isNaN(printfulVariantId)) {
          logger.warn(`Could not extract valid Printful Variant ID from SKU: ${item.sku} for item: ${item.name}. Skipping this item.`);
          continue; 
        }

        printfulItems.push({
          variant_id: printfulVariantId,
          quantity: item.quantity,
          retail_price: item.price,
          name: item.title,
          files: [], // Assuming pre-associated designs on Printful for now
        });
      }
    }

    if (printfulItems.length > 0) {
      const printfulOrderData = {
        external_id: `shopify-${shopifyOrder.id}-${Date.now()}`,
        shipping: 'STANDARD', 
        recipient: {
          name: `${shippingAddress.first_name || ''} ${shippingAddress.last_name || ''}`.trim() || customerDetails?.default_address?.name || 'Valued Customer',
          address1: shippingAddress.address1,
          address2: shippingAddress.address2 || null,
          city: shippingAddress.city,
          state_code: shippingAddress.province_code || null,
          country_code: shippingAddress.country_code,
          zip: shippingAddress.zip,
          email: customerEmail,
          phone: shippingAddress.phone || customerDetails?.phone || null,
        },
        items: printfulItems,
        retail_costs: {
          currency: shopifyOrder.currency,
          subtotal: shopifyOrder.subtotal_price,
          shipping: shopifyOrder.shipping_lines && shopifyOrder.shipping_lines.length > 0 ? shopifyOrder.shipping_lines[0].price : '0.00',
          tax: shopifyOrder.total_tax,
        }
      };

      logger.info(`Forwarding ${printfulItems.length} items from Shopify order ${shopifyOrder.id} to Printful.`);
      const printfulResponse = await printfulService.createPrintfulOrder(printfulOrderData);
      logger.info(`Printful order submission response. Printful ID (mocked/real): ${printfulResponse.result?.id}`);
      
      // TODO: Optionally update Shopify order with Printful order ID (requires Shopify API scope for orders)
      // e.g., using shopifyService.addNoteToOrder(shopifyOrder.id, `Printful Order ID: ${printfulResponse.result?.id}`);
    } else {
      logger.info(`No Printful items found in Shopify order ${shopifyOrder.id}.`);
    }

    res.status(200).send('Webhook received and processed.');
  } catch (error) {
    logger.error('Error handling Shopify order creation webhook:', error.message, error.stack);
    if (error.response && error.response.data) {
        logger.error('External API Error details:', error.response.data);
    }
    res.status(200).send('Webhook received but encountered an internal error during processing.');
  }
}

module.exports = {
  handleOrderCreateWebhook,
  verifyShopifyWebhook,
};
