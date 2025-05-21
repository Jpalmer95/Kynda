const express = require('express');
const router = express.Router();
const shopifyWebhookController = require('../controllers/shopifyWebhookController');

// Route for Shopify order creation webhooks
// The verifyShopifyWebhook middleware will be applied before this route in server.js
// The actual handler will parse the rawBody to JSON after verification.
router.post('/orders', shopifyWebhookController.handleOrderCreateWebhook);

module.exports = router;
