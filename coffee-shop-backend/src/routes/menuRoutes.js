const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');

// GET /api/menu - Fetches all restaurant menu items
router.get('/', menuController.getAllMenuItems);

// GET /api/menu/:category - Fetches menu items by category
// Assumes 'category' is a product tag or similar identifier used in Shopify
router.get('/:category', menuController.getMenuItemsByCategory);

module.exports = router;
