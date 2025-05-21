const shopifyService = require('../services/shopifyService');
const logger = require('../utils/logger');

// In a real application, checkoutId might be stored in a user's session or JWT.
// For this backend-focused setup, we'll assume checkoutId is provided by the client
// for existing carts, or a new one is created by POST /api/cart.

async function createNewCart(req, res) {
  try {
    // req.body might contain initial line items
    const lineItems = req.body.line_items || [];
    const cart = await shopifyService.createCart(lineItems);
    res.status(201).json(cart);
  } catch (error) {
    logger.error('Error in createNewCart controller:', error);
    if (error.response && error.response.body && error.response.body.errors) {
      res.status(error.response.statusCode || 500).json({ message: "Error creating cart with Shopify.", details: error.response.body.errors });
    } else {
      res.status(500).json({ message: "Internal Server Error while creating cart." });
    }
  }
}

async function addItemToCart(req, res) {
  try {
    const { checkoutId, line_items } = req.body; // checkoutId identifies the cart
    if (!checkoutId || !line_items || !Array.isArray(line_items) || line_items.length === 0) {
      return res.status(400).json({ message: "checkoutId and line_items (array, non-empty) are required in the request body." });
    }
    // Basic validation for line_items structure
    for (const item of line_items) {
        if (item.variant_id == null || item.quantity == null || typeof item.quantity !== 'number' || item.quantity <= 0) {
            return res.status(400).json({ message: "Each line item must include a valid variant_id and a positive quantity."});
        }
    }

    const cart = await shopifyService.addItemToCart(checkoutId, line_items);
    res.json(cart);
  } catch (error) {
    logger.error('Error in addItemToCart controller:', error);
    if (error.response && error.response.body && error.response.body.errors) {
      res.status(error.response.statusCode || 500).json({ message: "Error adding item to cart with Shopify.", details: error.response.body.errors });
    } else {
      res.status(500).json({ message: "Internal Server Error while adding item to cart." });
    }
  }
}

async function getCartContents(req, res) {
  try {
    // In a real app, checkoutId might come from session or a path parameter if preferred
    const { checkoutId } = req.query; // Or req.params if you change the route
    if (!checkoutId) {
      return res.status(400).json({ message: "checkoutId query parameter is required to retrieve a cart." });
    }
    const cart = await shopifyService.getCart(checkoutId);
    res.json(cart);
  } catch (error) {
    logger.error('Error in getCartContents controller:', error);
    if (error.response && error.response.body && error.response.body.errors) {
        // Handle cases where the checkout ID might not be found or is invalid
        if (error.response.statusCode === 404) {
             return res.status(404).json({ message: `Cart with checkoutId ${req.query.checkoutId} not found.`, details: error.response.body.errors });
        }
      res.status(error.response.statusCode || 500).json({ message: "Error retrieving cart from Shopify.", details: error.response.body.errors });
    } else {
      res.status(500).json({ message: "Internal Server Error while retrieving cart." });
    }
  }
}

async function updateCartItem(req, res) {
  try {
    const { checkoutId, lineItemId } = req.params; // lineItemId is Shopify's line_item ID
    const { quantity } = req.body;

    if (!checkoutId || !lineItemId) {
        return res.status(400).json({ message: "checkoutId and lineItemId path parameters are required." });
    }
    if (quantity == null || typeof quantity !== 'number' || quantity < 0) {
      return res.status(400).json({ message: "A valid quantity (number, >= 0) is required in the request body. Quantity 0 will remove the item." });
    }

    const cart = await shopifyService.updateCartItem(checkoutId, lineItemId, quantity);
    res.json(cart);
  } catch (error) {
    logger.error('Error in updateCartItem controller:', error);
    if (error.response && error.response.body && error.response.body.errors) {
      res.status(error.response.statusCode || 500).json({ message: "Error updating item in cart with Shopify.", details: error.response.body.errors });
    } else {
      res.status(500).json({ message: "Internal Server Error while updating item in cart." });
    }
  }
}

async function removeCartItem(req, res) {
  try {
    const { checkoutId, lineItemId } = req.params; // lineItemId is Shopify's line_item ID
     if (!checkoutId || !lineItemId) {
        return res.status(400).json({ message: "checkoutId and lineItemId path parameters are required." });
    }
    const cart = await shopifyService.removeCartItem(checkoutId, lineItemId);
    res.json(cart);
  } catch (error) {
    logger.error('Error in removeCartItem controller:', error);
    if (error.response && error.response.body && error.response.body.errors) {
      res.status(error.response.statusCode || 500).json({ message: "Error removing item from cart with Shopify.", details: error.response.body.errors });
    } else {
      res.status(500).json({ message: "Internal Server Error while removing item from cart." });
    }
  }
}

module.exports = {
  createNewCart,
  addItemToCart,
  getCartContents,
  updateCartItem,
  removeCartItem,
};
