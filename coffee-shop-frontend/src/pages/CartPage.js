import React from 'react';
import useCartStore from '../store/cartStore';
import CartItem from '../components/cart/CartItem'; // Will create this component later

const CartPage = () => {
  const { cart, updateItemQuantity, removeItem, loading, error, checkoutId } = useCartStore((state) => ({
    cart: state.cart,
    updateItemQuantity: state.updateItemQuantity,
    removeItem: state.removeItem,
    loading: state.loading,
    error: state.error,
    checkoutId: state.checkoutId,
  }));

  const handleProceedToCheckout = () => {
    if (cart && cart.webUrl) {
      window.location.href = cart.webUrl; // Redirect to Shopify checkout
    } else {
      alert('Checkout URL is not available. Please try again.');
      console.error('Checkout webUrl is missing from cart object:', cart);
    }
  };

  if (!checkoutId || !cart || !cart.lineItems || cart.lineItems.length === 0) {
    return (
      <div>
        <h2>Your Cart</h2>
        <p>Your cart is currently empty.</p>
        {loading && <p>Loading...</p>}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      </div>
    );
  }
  
  // Calculate subtotal (Shopify usually provides this, but good to have client-side too)
  // Note: Shopify's checkout object (cart) has `subtotalPrice`, `totalTax`, `totalPrice`
  const subtotal = cart.lineItems.reduce((acc, item) => {
    // item.variant.price.amount is what we expect from Shopify checkout line_items
    // item.quantity
    // However, the structure might vary slightly based on what the Admin API's checkout resource returns.
    // For this example, let's assume a simple price property on the line item.
    // The `cart.subtotalPriceV2.amount` is the definitive subtotal from Shopify.
    return acc + (parseFloat(item.variant?.price?.amount || item.customAttributes?.find(attr => attr.key === '_MS_PRICE')?.value || 0) * item.quantity);
  }, 0);


  return (
    <div>
      <h2>Your Cart</h2>
      {loading && <p>Updating cart...</p>}
      {error && <p style={{ color: 'red' }}>Cart Error: {error}</p>}
      
      {cart.lineItems.map(item => (
        <CartItem 
          key={item.id} 
          item={item} 
          onUpdateQuantity={updateItemQuantity} 
          onRemove={removeItem} 
        />
      ))}

      <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
        <h3>Order Summary</h3>
        <p>Subtotal: ${cart.subtotalPriceV2 ? parseFloat(cart.subtotalPriceV2.amount).toFixed(2) : subtotal.toFixed(2)}</p>
        {cart.totalTaxV2 && <p>Taxes: ${parseFloat(cart.totalTaxV2.amount).toFixed(2)}</p>}
        {cart.totalPriceV2 && <p><strong>Total: ${parseFloat(cart.totalPriceV2.amount).toFixed(2)}</strong></p>}
        {!cart.totalPriceV2 && <p><strong>Total (Calculated): ${subtotal.toFixed(2)}</strong> (Excludes taxes/shipping if any)</p>}

        <button 
          onClick={handleProceedToCheckout} 
          disabled={!cart.webUrl || loading}
          style={{ padding: '10px 20px', background: 'green', color: 'white', border: 'none', cursor: 'pointer' }}
        >
          Proceed to Checkout
        </button>
        {(!cart.webUrl && !loading) && <p style={{color: 'orange', fontSize: '0.9em'}}>Checkout link not yet available. Cart might be syncing.</p>}
      </div>
    </div>
  );
};

export default CartPage;
