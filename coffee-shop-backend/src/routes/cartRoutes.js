const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { body, param, query, validationResult } = require('express-validator'); // Added query

// Middleware to handle validation results
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// POST /api/cart - Creates a new cart (Shopify checkout)
router.post(
  '/',
  [
    body('line_items').optional().isArray().withMessage('line_items must be an array if provided'),
    body('line_items.*.variant_id').if(body('line_items').exists()).notEmpty().withMessage('Each line item must have a variant_id'),
    body('line_items.*.quantity').if(body('line_items').exists()).isInt({ gt: 0 }).withMessage('Each line item quantity must be a positive integer'),
    body('line_items.*.properties').optional().isObject().withMessage('Line item properties must be an object if provided'),
  ],
  handleValidationErrors,
  cartController.createNewCart
);

// GET /api/cart - Retrieves the contents of a specific cart
router.get(
  '/', 
  [
    query('checkoutId').notEmpty().isString().withMessage('checkoutId query parameter is required and must be a string.')
  ],
  handleValidationErrors, 
  cartController.getCartContents
);


// POST /api/cart/items - Adds item(s) to a specified cart
router.post(
  '/items',
  [
    body('checkoutId').notEmpty().isString().withMessage('checkoutId is required and must be a string.'),
    body('line_items').isArray({ min: 1 }).withMessage('line_items must be a non-empty array.'),
    body('line_items.*.variant_id').notEmpty().withMessage('Each line item must have a variant_id.'),
    body('line_items.*.quantity').isInt({ gt: 0 }).withMessage('Each line item quantity must be a positive integer.'),
    body('line_items.*.properties').optional().isObject().withMessage('Line item properties must be an object if provided'),
  ],
  handleValidationErrors,
  cartController.addItemToCart
);

// PUT /api/cart/:checkoutId/items/:lineItemId - Updates a specific item's quantity in a cart
router.put(
  '/:checkoutId/items/:lineItemId',
  [
    param('checkoutId').notEmpty().isString().withMessage('checkoutId path parameter is required.'),
    param('lineItemId').notEmpty().isString().withMessage('lineItemId path parameter is required.'),
    body('quantity').isInt({ gt: -1 }).withMessage('Quantity must be a non-negative integer (0 to remove).') 
  ],
  handleValidationErrors,
  cartController.updateCartItem
);

// DELETE /api/cart/:checkoutId/items/:lineItemId - Removes a specific item from a cart
router.delete(
  '/:checkoutId/items/:lineItemId',
  [
    param('checkoutId').notEmpty().isString().withMessage('checkoutId path parameter is required.'),
    param('lineItemId').notEmpty().isString().withMessage('lineItemId path parameter is required.'),
  ],
  handleValidationErrors,
  cartController.removeCartItem
);

module.exports = router;
