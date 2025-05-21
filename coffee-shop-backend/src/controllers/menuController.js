const shopifyService = require('../services/shopifyService');
const logger = require('../utils/logger');

async function getAllMenuItems(req, res) {
  try {
    const menuItems = await shopifyService.getAllMenuItems();
    res.json(menuItems);
  } catch (error) {
    logger.error('Error in getAllMenuItems controller:', error);
    // Check if the error is from Shopify or a general server error
    if (error.response && error.response.body && error.response.body.errors) {
      // Shopify API specific error
      res.status(error.response.statusCode || 500).json({ message: "Error fetching menu items from Shopify.", details: error.response.body.errors });
    } else {
      res.status(500).json({ message: "Internal Server Error while fetching menu items." });
    }
  }
}

async function getMenuItemsByCategory(req, res) {
  try {
    const { category } = req.params;
    if (!category) {
      return res.status(400).json({ message: "Category parameter is required." });
    }
    const menuItems = await shopifyService.getMenuItemsByCategory(category);
    if (menuItems.length === 0) {
      // It's not an error if a category has no items, but good to inform the client.
      return res.status(404).json({ message: `No menu items found for category: ${category}` });
    }
    res.json(menuItems);
  } catch (error) {
    logger.error(`Error in getMenuItemsByCategory controller (category: ${req.params.category}):`, error);
    if (error.response && error.response.body && error.response.body.errors) {
      res.status(error.response.statusCode || 500).json({ message: `Error fetching menu items for category ${req.params.category} from Shopify.`, details: error.response.body.errors });
    } else {
      res.status(500).json({ message: `Internal Server Error while fetching menu items for category ${req.params.category}.` });
    }
  }
}

module.exports = {
  getAllMenuItems,
  getMenuItemsByCategory,
};
