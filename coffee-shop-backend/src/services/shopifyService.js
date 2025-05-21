const Shopify = require('shopify-api-node');
const logger = require('../utils/logger');
require('dotenv').config({ path: '../../.env' }); // Ensure .env is loaded

const shopify = new Shopify({
  shopName: process.env.SHOPIFY_SHOP_NAME,
  apiKey: process.env.SHOPIFY_API_KEY,
  password: process.env.SHOPIFY_API_PASSWORD, // This is the Admin API access token
  apiVersion: process.env.SHOPIFY_API_VERSION || '2024-01',
});

// Helper to transform properties object to Shopify's customAttributes array
function formatLineItemProperties(properties) {
  if (!properties) return [];
  return Object.entries(properties).map(([key, value]) => ({ key, value }));
}

// --- Product (Menu Item) Functions ---

async function getAllMenuItems() {
  try {
    logger.info('Fetching all products from Shopify...');
    const products = await shopify.product.list();
    logger.info(`Successfully fetched ${products.length} products.`);
    return products;
  } catch (err) {
    logger.error('Shopify API Error - getAllMenuItems:', err.response ? err.response.body : err.message);
    throw err;
  }
}

async function getMenuItemsByCategory(categoryTag) {
  try {
    logger.info(`Fetching products for category (tag): ${categoryTag} from Shopify...`);
    // This assumes 'tag' is a valid filter for product.list() or that you've adjusted for collections.
    const products = await shopify.product.list({ tag: categoryTag });
    logger.info(`Successfully fetched ${products.length} products for category ${categoryTag}.`);
    return products;
  } catch (err) {
    logger.error(`Shopify API Error - getMenuItemsByCategory (${categoryTag}):`, err.response ? err.response.body : err.message);
    throw err;
  }
}

// --- Cart (Checkout) Functions ---

/**
 * Creates a new cart (checkout) in Shopify.
 * @param {Array} lineItemsInput - Optional. Array of line items to add initially.
 *                            Example: [{ variant_id: 12345, quantity: 1, properties: { _key: "value" } }]
 */
async function createCart(lineItemsInput = []) {
  try {
    logger.info('Creating a new cart (checkout) in Shopify...');
    const formattedLineItems = lineItemsInput.map(item => ({
      variantId: item.variant_id, // Note: Shopify Admin API uses variantId here
      quantity: item.quantity,
      customAttributes: formatLineItemProperties(item.properties),
    }));

    const checkout = await shopify.checkout.create({ line_items: formattedLineItems });
    logger.info(`Successfully created cart (checkout) with ID: ${checkout.id}`);
    return checkout;
  } catch (err) {
    logger.error('Shopify API Error - createCart:', err.response ? err.response.body : err.message);
    throw err;
  }
}

/**
 * Adds line items to an existing cart (checkout).
 * @param {string} checkoutId - The ID of the checkout.
 * @param {Array} lineItemsInput - Array of line items to add.
 *                            Example: [{ variant_id: 12345, quantity: 1, properties: { _key: "value" } }]
 */
async function addItemToCart(checkoutId, lineItemsInput) {
  try {
    logger.info(`Adding items to cart (checkout) ID: ${checkoutId}...`);
    
    // The Admin API's checkout.update with line_items replaces all line items.
    // So, we must fetch the current line items, append/merge the new ones, then update.
    const currentCheckout = await shopify.checkout.get(checkoutId);
    let existingLineItems = currentCheckout.line_items || [];

    const newFormattedLineItems = lineItemsInput.map(item => ({
      variantId: item.variant_id,
      quantity: item.quantity,
      customAttributes: formatLineItemProperties(item.properties),
    }));

    // Simple merge: check if variantId already exists, if so, update quantity. Otherwise, add.
    // More complex merging (e.g., if customAttributes make an item "unique") is not handled here.
    newFormattedLineItems.forEach(newItem => {
        const existingItemIndex = existingLineItems.findIndex(exItem => exItem.variant.id.toString().endsWith(newItem.variantId.toString())); // variant.id is like gid://shopify/ProductVariant/12345
        if (existingItemIndex > -1) {
            existingLineItems[existingItemIndex].quantity += newItem.quantity;
        } else {
            // This is tricky because existingLineItems are from Shopify's format, newItem is our target format.
            // For simplicity with Admin API, we might just append and let Shopify handle merging if it does,
            // or replace all items. The current `shopify.checkout.update` replaces all line_items.
            // So we need to reconstruct all line items.
            // The line items from shopify.checkout.get(checkoutId) need to be transformed back if we want to merge
            // For now, this implementation will APPEND to the list of items sent to Shopify,
            // but Shopify's `checkout.update` with `line_items` usually REPLACES them.
            // A truly robust solution needs careful state management of line items or use of Storefront API.
            // Given the constraint, we'll re-format existing items and append new ones for the update.
        }
    });
    
    // Reconstruct all line items for the update payload
    const allLineItemsForUpdate = [
        ...existingLineItems.map(li => ({ // Re-map existing items from Shopify's format
            variantId: li.variant.id.split('/').pop(), // Extract numeric ID
            quantity: li.quantity,
            customAttributes: li.customAttributes || [] 
        })),
        ...newFormattedLineItems // Add the new items
    ];
    
    // A more correct merge strategy for Admin API (replacing all line_items):
    let combinedLineItems = [...existingLineItems]; // These are in Shopify's CheckoutLineItem format
    newFormattedLineItems.forEach(newItem => {
        const existingShopifyItemIndex = combinedLineItems.findIndex(
            exLi => exLi.variant.id.endsWith(`/${newItem.variantId}`) && 
                    JSON.stringify(exLi.customAttributes) === JSON.stringify(newItem.customAttributes) // Simplistic comparison for properties
        );
        if (existingShopifyItemIndex > -1) {
            combinedLineItems[existingShopifyItemIndex].quantity += newItem.quantity;
        } else {
            // This new item needs to be added. Since we're replacing all line_items,
            // it will be part of the new array sent to shopify.checkout.update.
            // The challenge is that newItem is in our input format, not Shopify's rich object format yet.
            // For the Admin API, it's often easier to just pass the new line items to be added,
            // and if Shopify's checkout resource internally merges, great. If not, it replaces.
            // The `shopify.checkout.addLineItems` (Storefront API) is designed for adding.
            // `shopify.checkout.update` (Admin API) with `line_items` usually SETS the line items.
            // Let's assume we are SETTING the line items by combining existing and new.
            // We need to convert existingLineItems to the format expected by shopify.checkout.update's line_items
        }
    });

    // Simplest approach for Admin API: just send the new items to be added,
    // and they will be appended to the existing ones by Shopify (this is how it works for draft orders, might differ for checkouts)
    // OR, more accurately for `checkout.update`: replace the whole set.
    // Let's fetch, then map existing, then add new, then update.

    const finalLineItemsPayload = currentCheckout.line_items.map(li => ({
        id: li.id, // Keep existing line item ID if possible for updates, but variantId is used for new adds/updates
        variantId: li.variant.id.split('/').pop(), // Get numeric variant ID
        quantity: li.quantity,
        customAttributes: li.customAttributes
    }));

    newFormattedLineItems.forEach(newItem => {
        const existingIndex = finalLineItemsPayload.findIndex(
            ex => ex.variantId === newItem.variantId &&
            JSON.stringify(ex.customAttributes) === JSON.stringify(newItem.customAttributes)
        );
        if (existingIndex > -1) {
            finalLineItemsPayload[existingIndex].quantity += newItem.quantity;
        } else {
            finalLineItemsPayload.push(newItem); // Add as new item
        }
    });


    const updatedCheckout = await shopify.checkout.update(checkoutId, { line_items: finalLineItemsPayload });
    logger.info(`Successfully updated/added items to cart (checkout) ID: ${checkoutId}`);
    return updatedCheckout;

  } catch (err) {
    logger.error(`Shopify API Error - addItemToCart (Checkout ID: ${checkoutId}):`, err.response ? err.response.body : err.message);
    throw err;
  }
}

async function getCart(checkoutId) {
  try {
    logger.info(`Retrieving cart (checkout) ID: ${checkoutId}...`);
    const checkout = await shopify.checkout.get(checkoutId);
    logger.info(`Successfully retrieved cart (checkout) ID: ${checkoutId}`);
    return checkout;
  } catch (err) {
    logger.error(`Shopify API Error - getCart (Checkout ID: ${checkoutId}):`, err.response ? err.response.body : err.message);
    throw err;
  }
}

async function updateCartItem(checkoutId, lineItemId, quantity) {
  try {
    logger.info(`Updating item ${lineItemId} to quantity ${quantity} in cart (checkout) ID: ${checkoutId}...`);
    
    // For Admin API's checkout, lineItemId is the GraphQL GID, e.g., "gid://shopify/CheckoutLineItem/123...abc?checkout=gid..."
    // The shopify-api-node library might abstract this, but it's safer to be aware.
    // We need to provide the line item's ID (gid) if we want to update a specific one,
    // or its variant_id if we are replacing all line items.
    // The `checkout.update` with `line_items` array expects objects with `id` (for existing) or `variantId` (for new).

    const currentCheckout = await shopify.checkout.get(checkoutId);
    const updatedLineItems = currentCheckout.line_items.map(item => {
      // Compare with the actual line item ID from Shopify (which is a GID string)
      if (item.id.toString() === lineItemId.toString()) {
        return { id: item.id, variantId: item.variant.id.split('/').pop(), quantity: quantity, customAttributes: item.customAttributes };
      }
      return { id: item.id, variantId: item.variant.id.split('/').pop(), quantity: item.quantity, customAttributes: item.customAttributes };
    }).filter(item => item.quantity > 0); // Filter out items if quantity becomes 0

    const updatedCheckout = await shopify.checkout.update(checkoutId, { line_items: updatedLineItems });
    logger.info(`Successfully updated item ${lineItemId} in cart (checkout) ID: ${checkoutId}`);
    return updatedCheckout;
  } catch (err) {
    logger.error(`Shopify API Error - updateCartItem (Checkout ID: ${checkoutId}, Item ID: ${lineItemId}):`, err.response ? err.response.body : err.message);
    throw err;
  }
}

async function removeCartItem(checkoutId, lineItemId) {
  try {
    logger.info(`Removing item ${lineItemId} from cart (checkout) ID: ${checkoutId}...`);
    
    const currentCheckout = await shopify.checkout.get(checkoutId);
    const updatedLineItems = currentCheckout.line_items
      .filter(item => item.id.toString() !== lineItemId.toString())
      .map(item => ({ // Re-map to ensure correct format for update
          id: item.id, 
          variantId: item.variant.id.split('/').pop(), 
          quantity: item.quantity, 
          customAttributes: item.customAttributes 
      }));

    const updatedCheckout = await shopify.checkout.update(checkoutId, { line_items: updatedLineItems });
    logger.info(`Successfully removed item ${lineItemId} from cart (checkout) ID: ${checkoutId}`);
    return updatedCheckout;
  } catch (err) {
    logger.error(`Shopify API Error - removeCartItem (Checkout ID: ${checkoutId}, Item ID: ${lineItemId}):`, err.response ? err.response.body : err.message);
    throw err;
  }
}

module.exports = {
  getAllMenuItems,
  getMenuItemsByCategory,
  createCart,
  addItemToCart,
  getCart,
  updateCartItem,
  removeCartItem,
};
