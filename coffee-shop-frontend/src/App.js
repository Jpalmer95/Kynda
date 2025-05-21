import React, { useEffect } from 'react';
import AppRouter from './Router';
import useCartStore from './store/cartStore';
import './App.css'; 
import { Link, BrowserRouter } from 'react-router-dom'; // BrowserRouter might not be needed here if AppRouter handles it.
                                                 // Let's assume AppRouter is self-contained with BrowserRouter.

function App() {
  const initializeCart = useCartStore((state) => state.initializeCart);

  useEffect(() => {
    initializeCart();
  }, [initializeCart]);

  const cartItemCount = useCartStore((state) => state.cart?.lineItems?.reduce((sum, item) => sum + item.quantity, 0) || 0);

  return (
    // If AppRouter doesn't have its own BrowserRouter, wrap with it here.
    // Assuming AppRouter includes BrowserRouter as per standard CRA setup with react-router-dom v6.
    <div className="App">
      <nav style={{ padding: '1rem', background: '#f0f0f0', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          {/* Changed <a> to <Link> for client-side navigation */}
          <Link to="/" style={{ margin: '0 15px', fontWeight: 'bold', fontSize: '1.2em', color: '#333' }}>Coffee Shop</Link>
        </div>
        <div>
          <Link to="/menu" style={{ margin: '0 10px' }}>Menu</Link>
          <Link to="/shop" style={{ margin: '0 10px' }}>Shop</Link>
          <Link to="/cart" style={{ margin: '0 10px' }}>
            Cart ({cartItemCount})
          </Link>
        </div>
      </nav>
      
      <main style={{ padding: '0 20px' }}>
        <AppRouter />
      </main>
      
      <footer style={{ padding: '1rem', background: '#333', color: 'white', marginTop: '2rem', textAlign: 'center' }}>
        <p>&copy; 2024 Coffee Shop</p>
      </footer>
    </div>
  );
}

export default App;
