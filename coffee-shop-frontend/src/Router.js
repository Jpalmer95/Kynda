import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Pages
import HomePage from './pages/HomePage'; // New
import MenuPage from './pages/MenuPage';
import CartPage from './pages/CartPage';
import MerchandisePage from './pages/MerchandisePage'; 
import ProductDetailPage from './pages/ProductDetailPage'; 

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} /> {/* Default to HomePage */}
        <Route path="/menu" element={<MenuPage />} />
        
        {/* Merchandise Routes */}
        <Route path="/shop" element={<MerchandisePage />} />
        <Route path="/shop/:categoryHandle" element={<MerchandisePage />} /> 
        <Route path="/products/:productId" element={<ProductDetailPage />} />

        {/* Cart Route */}
        <Route path="/cart" element={<CartPage />} />
        
      </Routes>
    </Router>
  );
};

export default AppRouter;
