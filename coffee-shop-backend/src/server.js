require('dotenv').config({ path: '../.env' }); 
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet'); // Import helmet
const logger = require('./utils/logger');

const menuRoutes = require('./routes/menuRoutes');
const cartRoutes = require('./routes/cartRoutes');
const shopifyWebhookRoutes = require('./routes/shopifyWebhookRoutes'); 

const { verifyShopifyWebhook } = require('./controllers/shopifyWebhookController');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Use helmet to set various security headers
app.use(cors()); 

app.use('/api/webhooks/shopify/orders', express.raw({ type: 'application/json', verify: (req, res, buf) => {
  req.rawBody = buf; 
}}));

app.use(express.json()); 

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
  stream: {
    write: (message) => logger.http(message.trim()),
  },
}));

// Mount Routers
app.use('/api/menu', menuRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/webhooks/shopify/orders', verifyShopifyWebhook, shopifyWebhookRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'Server is healthy' });
});

app.use((req, res, next) => {
  res.status(404).json({ message: "Sorry, can't find that!" });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.error('Global Error Handler:', err);
  
  const isProduction = process.env.NODE_ENV === 'production';
  let responseError = {
    message: "An unexpected error occurred.",
  };

  if (err.response && err.response.body && err.response.body.errors) { // External API error (e.g. Shopify, Printful)
    responseError.message = "An error occurred with an external API.";
    responseError.details = err.response.body.errors;
    if (!isProduction) {
      responseError.stack = err.stack;
    }
    return res.status(err.response.statusCode || 500).json(responseError);
  }
  
  // General server error
  responseError.message = err.message || "An unexpected error occurred.";
  if (!isProduction) {
    responseError.stack = err.stack;
  }
  
  res.status(err.status || 500).json(responseError);
});

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  // Startup checks for essential env vars
  const essentialVars = ['SHOPIFY_SHOP_NAME', 'SHOPIFY_API_KEY', 'SHOPIFY_API_PASSWORD', 'SHOPIFY_WEBHOOK_SECRET', 'PRINTFUL_API_KEY'];
  essentialVars.forEach(v => {
    if (!process.env[v]) {
      logger.warn(`CRITICAL: Environment variable ${v} is not set. Functionality may be impaired.`);
    }
  });
  if (essentialVars.every(v => process.env[v])) {
    logger.info('All essential environment variables appear to be loaded.');
  }
});

module.exports = app;
