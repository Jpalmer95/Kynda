import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  createNewCart,
  getCartContents,
  addItemToCart as apiAddItemToCart,
  updateCartItemQuantity as apiUpdateCartItemQuantity,
  removeItemFromCart as apiRemoveItemFromCart,
} from '../services/apiService';

const CART_STORAGE_KEY = 'coffee-shop-cart';

const useCartStore = create(
  persist(
    (set, get) => ({
      checkoutId: null,
      cart: null, // Will store the full cart object from Shopify { id, lineItems, webUrl, ... }
      loading: false,
      error: null,

      // Helper to handle loading and error states for API calls
      handleApiCall: async (apiCallPromise) => {
        set({ loading: true, error: null });
        try {
          const result = await apiCallPromise;
          set({ loading: false });
          return result.data; // Assuming API service returns { data: ... } from axios response
        } catch (err) {
          const errorMessage = err.response?.data?.message || err.message || 'An unexpected error occurred';
          console.error('Cart Store API Error:', err.response || err);
          set({ loading: false, error: errorMessage });
          throw err; // Re-throw for components to handle if needed
        }
      },

      // Action to initialize cart: either load from storage or create new
      initializeCart: async ().toUpperCase() => {
        const existingCheckoutId = get().checkoutId;
        if (existingCheckoutId) {
          try {
            const cartData = await get().handleApiCall(getCartContents(existingCheckoutId));
            set({ cart: cartData, checkoutId: cartData.id }); // cartData.id is the checkoutId
            console.log('Cart initialized from storage:', cartData);
            return;
          } catch (error) {
            console.warn('Failed to fetch existing cart, creating a new one.', error);
            // Clear invalid checkoutId from state and storage if fetch fails (e.g. 404)
            set({ checkoutId: null, cart: null }); 
            // The persist middleware will also clear it from localStorage
          }
        }
        // If no valid existing cart, create a new one
        try {
          const newCart = await get().handleApiCall(createNewCart([])); // Create with empty items
          set({ cart: newCart, checkoutId: newCart.id });
          console.log('New cart created:', newCart);
        } catch (error) {
           console.error('Failed to create a new cart:', error);
           // Error state is already set by handleApiCall
        }
      },
      
      // Action to add item(s) to cart
      addItem: async (lineItem) => { // Expects a single line item: { variant_id, quantity }
        let currentCheckoutId = get().checkoutId;
        if (!currentCheckoutId) {
          // If no cart, initialize one first (which also creates it if needed)
          await get().initializeCart();
          currentCheckoutId = get().checkoutId;
          // If still no checkoutId after init, something went wrong
          if (!currentCheckoutId) {
            set({ error: "Failed to create or retrieve cart before adding item."});
            return;
          }
        }
        
        try {
          // The backend addItemToCart expects an array of line_items
          const updatedCart = await get().handleApiCall(apiAddItemToCart(currentCheckoutId, [lineItem]));
          set({ cart: updatedCart });
        } catch (error) {
          console.error('Failed to add item to cart:', error);
        }
      },

      // Action to update item quantity
      updateItemQuantity: async (lineItemId, quantity) => {
        const { checkoutId } = get();
        if (!checkoutId) {
          set({ error: "No active cart to update."});
          return;
        }
        if (quantity < 0) {
            set({ error: "Quantity cannot be negative."});
            return;
        }
        // If quantity is 0, it should effectively remove the item.
        // The backend service handles quantity > 0 check for Shopify.
        try {
          const updatedCart = await get().handleApiCall(apiUpdateCartItemQuantity(checkoutId, lineItemId, quantity));
          set({ cart: updatedCart });
        } catch (error) {
          console.error('Failed to update item quantity:', error);
        }
      },

      // Action to remove item from cart
      removeItem: async (lineItemId) => {
        const { checkoutId } = get();
        if (!checkoutId) {
          set({ error: "No active cart to remove items from."});
          return;
        }
        try {
          const updatedCart = await get().handleApiCall(apiRemoveItemFromCart(checkoutId, lineItemId));
          set({ cart: updatedCart });
        } catch (error) {
          console.error('Failed to remove item from cart:', error);
        }
      },

      // Action to clear cart from state and storage (e.g., after successful checkout or explicit clear)
      clearCartLocal: () => {
        set({ checkoutId: null, cart: null, error: null, loading: false });
        // This will also clear from localStorage due to the persist middleware
      },

    }),
    {
      name: CART_STORAGE_KEY, // Name of the item in storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default uses localStorage
      partialize: (state) => ({ checkoutId: state.checkoutId }), // Only persist checkoutId
    }
  )
);

// Initialize cart on load if checkoutId exists in storage
// This is a common pattern: try to load cart as soon as the store is initialized.
const initialCheckoutId = useCartStore.getState().checkoutId;
if (initialCheckoutId) {
  useCartStore.getState().initializeCart();
}


export default useCartStore;
