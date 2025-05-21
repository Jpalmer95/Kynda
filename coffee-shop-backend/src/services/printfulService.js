const axios = require('axios'); // Using axios directly for Printful API for clarity
const logger = require('../utils/logger');
require('dotenv').config({ path: '../../.env' }); // Ensure .env is loaded

const PRINTFUL_API_BASE_URL = 'https://api.printful.com';
const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY;

const printfulApiClient = axios.create({
  baseURL: PRINTFUL_API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${PRINTFUL_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

/**
 * Creates an order with Printful.
 * 
 * @param {Object} orderPayload - The order data formatted for Printful API.
 * Expected structure for orderPayload.items:
 * [
 *   {
 *     variant_id: printfulVariantId, // Numeric Printful Variant ID
 *     quantity: item.quantity,
 *     retail_price: item.price, // Price customer paid
 *     name: item.title, // Product name as it should appear on packing slip
 *     customArtUrl: 'url_to_design_image', // Optional: URL of the custom art
 *     customArtName: 'Design Name' // Optional: Name of the design
 *   }
 * ]
 * Expected structure for orderPayload.recipient: standard address object
 * Expected structure for orderPayload.external_id: string (e.g., shopify-order-id-timestamp)
 * Expected structure for orderPayload.retail_costs: object for customs
 * 
 * @returns {Promise<Object>} - The response from Printful API.
 */
async function createPrintfulOrder(orderPayload) {
  if (!PRINTFUL_API_KEY) {
    logger.error('Printful API key is not set. Cannot create Printful order.');
    // In a real app, this might trigger an alert to admins.
    throw new Error('Printful API key missing. Order fulfillment will fail.');
  }

  // Transform items for Printful API payload
  const printfulApiItems = orderPayload.items.map(item => {
    const printfulItem = {
      variant_id: item.variant_id, // This is the numeric ID of the Printful variant
      quantity: item.quantity,
      retail_price: item.retail_price, // Retail price of the item
      name: item.name, // Name of the item
      files: [],
    };

    // If customArtUrl is provided, add it as the default print file
    if (item.customArtUrl) {
      printfulItem.files.push({
        type: 'default', // Common type for main print file
        url: item.customArtUrl,
        // options: {} // Add options here if needed, e.g., for specific print settings
      });
      // Potentially add a preview mockup if a separate one is generated/available
      // printfulItem.files.push({ type: 'preview', url: item.customArtMockupUrl });
    } else {
      // If no customArtUrl, it implies this is a pre-designed product in Printful.
      // Printful will use the artwork associated with the variant_id in their system.
      // No 'files' array might be needed, or an empty one, depending on Printful's strictness.
      // For safety, an empty files array or omitting it might be fine.
      // However, if it's a product that *always* requires a file, this would be an issue.
      // For this project, we assume items passed here for Printful are either:
      // 1. Fully pre-defined in Printful (no file needed in API call).
      // 2. Custom, in which case customArtUrl MUST be present.
      // This example assumes if customArtUrl is not present, it's type 1.
      // If Printful requires files even for pre-defined items via API, this needs adjustment.
      logger.info(`No customArtUrl for Printful item ${item.name} (Variant ID: ${item.variant_id}). Assuming it's a pre-designed product on Printful.`);
    }
    return printfulItem;
  });

  const printfulApiPayload = {
    external_id: orderPayload.external_id,
    shipping: orderPayload.shipping || 'STANDARD', // Default to standard if not specified
    recipient: orderPayload.recipient,
    items: printfulApiItems,
    retail_costs: orderPayload.retail_costs, // Optional: for customs, packing slip
    // confirm: true, // Automatically confirm the order for fulfillment. Default is false (draft).
                      // For testing, it's often better to create as draft.
                      // For production, 'true' is common.
  };

  logger.info('Submitting order to Printful. Payload:', JSON.stringify(printfulApiPayload, null, 2));

  try {
    // Using the printfulApiClient instance
    const response = await printfulApiClient.post('/orders', printfulApiPayload, {
        params: {
            confirm: false // Create as draft initially. Set to true for auto-confirmation.
        }
    });
    logger.info('Printful order submitted successfully. Response:', response.data);
    return response.data; // This will be { code: 200, result: { order_object }, ... }
  } catch (error) {
    logger.error('Error creating Printful order:');
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      logger.error('Data:', error.response.data);
      logger.error('Status:', error.response.status);
      logger.error('Headers:', error.response.headers);
      // Rethrow a more structured error or the original Axios error
      const errData = error.response.data || { message: 'Unknown Printful API error' };
      throw new Error(`Printful API Error (${error.response.status}): ${errData.result || errData.error?.message || JSON.stringify(errData)}`);
    } else if (error.request) {
      // The request was made but no response was received
      logger.error('Request:', error.request);
      throw new Error('Printful API Error: No response received from Printful.');
    } else {
      // Something happened in setting up the request that triggered an Error
      logger.error('Error Message:', error.message);
      throw new Error(`Printful API Error: ${error.message}`);
    }
  }
}

module.exports = {
  createPrintfulOrder,
  printfulApiClient, // Exporting for potential direct use or testing
};
