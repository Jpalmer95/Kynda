import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Menu Endpoints ---
export const fetchAllMenuItems = () => apiClient.get('/menu'); // Could be used for food/drink menu
export const fetchMenuItemsByCategory = (categoryTag) => apiClient.get(`/menu/${categoryTag}`); // For menu items by tag

// --- Product/Merchandise Endpoints ---
/**
 * Fetches products from the backend.
 * The backend /api/products endpoint might support filtering by collection, type, tags.
 * For now, this might point to a generic endpoint or be an alias for /menu if products are mixed.
 * @param {object} params - Optional query parameters (e.g., { collection_id: '123', product_type: 'Apparel' })
 */
export const fetchProducts = (params) => {
  // If backend has a dedicated /api/products endpoint that supports query params:
  // return apiClient.get('/products', { params });

  // Using existing /menu endpoint as a stand-in if no dedicated /products backend endpoint yet.
  // This implies all products (menu items + merchandise) are fetched from /menu.
  // Client-side filtering will be more important in this case.
  // Or, if a specific "merchandise" category tag exists for menu items:
  if (params && params.categoryTag) {
    return apiClient.get(`/menu/${params.categoryTag}`);
  }
  // Default to fetching all products if no specific params handled by /menu
  return apiClient.get('/menu', { params }); // Pass params anyway, backend might support some
};


// --- Cart Endpoints ---
/**
 * Creates a new cart (checkout) on Shopify.
 * @param {Array} lineItems - Optional. Array of line items to add initially.
 *                            Example: [{ variant_id: 12345, quantity: 1 }]
 */
export const createNewCart = (lineItems = []) => {
  return apiClient.post('/cart', { line_items: lineItems });
};

/**
 * Retrieves the contents of a specific cart.
 * @param {string} checkoutId - The ID of the checkout.
 */
export const getCartContents = (checkoutId) => {
  return apiClient.get(`/cart?checkoutId=${checkoutId}`);
};

/**
 * Adds line items to an existing cart.
 * @param {string} checkoutId - The ID of the checkout.
 *  @param {Array} lineItems - Array of line items to add. Example: [{ variant_id: 12345, quantity: 1 }]
 */
export const addItemToCart = (checkoutId, lineItems) => {
  return apiClient.post('/cart/items', { checkoutId, line_items: lineItems });
};

/**
 * Updates the quantity of a specific line item in a cart.
 * @param {string} checkoutId - The ID of the checkout.
 * @param {string} lineItemId - The ID of the line item to update.
 * @param {number} quantity - The new quantity.
 */
export const updateCartItemQuantity = (checkoutId, lineItemId, quantity) => {
  return apiClient.put(`/cart/${checkoutId}/items/${lineItemId}`, { quantity });
};

/**
 * Removes a line item from a cart.
 * @param {string} checkoutId - The ID of the checkout.
 * @param {string} lineItemId - The ID of the line item to remove.
 */
export const removeItemFromCart = (checkoutId, lineItemId) => {
  return apiClient.delete(`/cart/${checkoutId}/items/${lineItemId}`);
};

/**
 * Fetches a single product by its ID.
 * This usually requires a specific backend endpoint like /api/products/:id or /api/menu/product/:id
 * For now, we'll assume client-side filtering after fetching all if no such endpoint exists.
 * A more robust solution would be a dedicated backend endpoint.
 * @param {string} productId - The ID of the product.
 */
export const fetchProductById = async (productId) => {
    // Ideal: return apiClient.get(`/products/${productId}`);
    // Fallback: Fetch all and filter. This is inefficient for many products.
    console.warn(`fetchProductById: Using inefficient client-side filtering for product ${productId}. Consider a dedicated backend endpoint.`);
    const response = await fetchAllMenuItems(); // Assuming all products are here
    const product = response.data.find(p => p.id.toString() === productId.toString());
    if (product) {
        return { data: product }; // Mimic axios response structure
    }
    throw new Error(`Product with ID ${productId} not found.`);
};


export default apiClient;
