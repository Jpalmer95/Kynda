import React, { useEffect, useState } from 'react';
import { fetchProducts } from '../../services/apiService'; // Using generic fetchProducts
import { isProductFeatured } from '../../constants/designs'; // Import the helper
import ProductGrid from '../products/ProductGrid';
import { Link } from 'react-router-dom';

const FeaturedItems = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadFeatured = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch all products (or a relevant subset if backend supports better filtering)
        // The current `fetchProducts` in apiService points to /api/menu (all products)
        const response = await fetchProducts(); 
        const allProducts = response.data;
        
        // Client-side filtering for featured items
        const filtered = allProducts.filter(product => isProductFeatured(product));
        setFeaturedProducts(filtered);

      } catch (err) {
        setError(err.message || 'Failed to fetch featured products.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadFeatured();
  }, []);

  if (loading) return <p>Loading featured items...</p>;
  if (error) return <p>Error: {error}</p>;
  if (featuredProducts.length === 0) return <p>No featured items at the moment.</p>;

  return (
    <section style={{ padding: '20px 0' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Featured Items</h2>
      <ProductGrid products={featuredProducts} />
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <Link to="/shop">
          <button style={{padding: '10px 20px', fontSize: '1em'}}>View All Products</button>
        </Link>
      </div>
    </section>
  );
};

export default FeaturedItems;
