import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { fetchProducts } from '../services/apiService'; // Using the new fetchProducts
import ProductGrid from '../components/products/ProductGrid'; // Will create this
// import ProductFilters from '../components/products/ProductFilters'; // Optional: for advanced filters

const MerchandisePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { categoryHandle } = useParams(); // To get category from URL path e.g., /shop/apparel
  const [searchParams] = useSearchParams(); // To get query params e.g., ?sort=price_asc

  // Example categories - in a real app, these might come from an API or be hardcoded
  const merchandiseCategories = [
    { name: 'All Products', handle: null }, // Or a specific tag/type for "all merchandise"
    { name: 'Coffee Beans', handle: 'coffee-beans' }, // Assuming 'coffee-beans' is a product_type or tag
    { name: 'Apparel', handle: 'apparel' },
    { name: 'Drinkware', handle: 'drinkware' },
    { name: 'Accessories', handle: 'accessories' },
  ];
  const [currentCategory, setCurrentCategory] = useState(categoryHandle || 'All Products');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'default');


  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        // Determine query parameters for the API based on category and sorting
        const apiParams = {};
        if (categoryHandle && categoryHandle !== 'all-products') {
          // This assumes the backend can filter by a 'categoryTag' or 'product_type'
          // For Shopify, 'product_type' or 'tags' are common.
          // 'collection_handle' could also be used if backend supports it.
          apiParams.categoryTag = categoryHandle; // Or product_type: categoryHandle
        }
        
        // The fetchProducts function in apiService currently points to /api/menu
        // It would need to be adapted if the backend has a specific /api/products endpoint
        // or if /api/menu can filter by product_type or tags effectively for merchandise.
        const response = await fetchProducts(apiParams);
        let fetchedProducts = response.data;

        // Client-side filtering if backend doesn't fully support it:
        if (categoryHandle && categoryHandle !== 'all-products') {
            fetchedProducts = fetchedProducts.filter(p => 
                (p.product_type && p.product_type.toLowerCase() === categoryHandle.toLowerCase()) ||
                (p.tags && p.tags.some(tag => tag.toLowerCase() === categoryHandle.toLowerCase()))
            );
        } else {
            // If "All Products", filter out typical "menu" items if possible, e.g., by product_type
            // This is a placeholder for better merchandise/menu item separation logic
             fetchedProducts = fetchedProducts.filter(p => 
                p.product_type?.toLowerCase() !== 'food' && 
                p.product_type?.toLowerCase() !== 'beverage' &&
                // Add more specific food/drink types if necessary
                !p.tags?.some(tag => tag.toLowerCase() === 'menu-item') // Example tag
            );
        }


        // Implement client-side sorting (backend sorting is preferred for large datasets)
        if (sortBy === 'price_asc') {
          fetchedProducts.sort((a, b) => (parseFloat(a.variants[0]?.price.amount) || 0) - (parseFloat(b.variants[0]?.price.amount) || 0));
        } else if (sortBy === 'price_desc') {
          fetchedProducts.sort((a, b) => (parseFloat(b.variants[0]?.price.amount) || 0) - (parseFloat(a.variants[0]?.price.amount) || 0));
        } else if (sortBy === 'name_asc') {
          fetchedProducts.sort((a, b) => a.title.localeCompare(b.title));
        } else if (sortBy === 'name_desc') {
          fetchedProducts.sort((a, b) => b.title.localeCompare(a.title));
        }

        setProducts(fetchedProducts);
      } catch (err) {
        setError(err.message || 'Failed to fetch products.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [categoryHandle, sortBy]);

  const handleCategoryChange = (event) => {
    const newCategoryHandle = event.target.value;
    setCurrentCategory(newCategoryHandle);
    // Update URL without full page reload, or use Link components for navigation
    // For simplicity, a real app would use <Link> or navigate from react-router-dom
    if (newCategoryHandle && newCategoryHandle !== 'All Products') {
      window.history.pushState(null, '', `/shop/${newCategoryHandle}`);
    } else {
      window.history.pushState(null, '', `/shop`);
    }
    // Trigger useEffect by changing categoryHandle state if not using direct URL navigation for re-fetch
    // This is simplified; typically, you'd navigate using react-router-dom's navigate function.
    // For this example, changing categoryHandle via URL (simulated by window.history) and letting useEffect catch it.
    // A better way: navigate(`/shop/${newCategoryHandle}`)
  };

  const handleSortChange = (event) => {
    setSortBy(event.target.value);
    // Update URL search params if desired
  };

  if (loading) return <p>Loading merchandise...</p>;
  if (error) return <p>Error loading merchandise: {error}</p>;

  return (
    <div>
      <h2>Shop Our Merchandise</h2>
      {/* Basic Filters Placeholder */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <label htmlFor="category-filter" style={{ marginRight: '10px' }}>Category:</label>
          <select id="category-filter" value={categoryHandle || 'all-products'} onChange={handleCategoryChange}>
            {merchandiseCategories.map(cat => (
              <option key={cat.handle || 'all'} value={cat.handle || 'all-products'}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="sort-by" style={{ marginRight: '10px' }}>Sort by:</label>
          <select id="sort-by" value={sortBy} onChange={handleSortChange}>
            <option value="default">Default</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name_asc">Name: A to Z</option>
            <option value="name_desc">Name: Z to A</option>
          </select>
        </div>
      </div>

      {products.length > 0 ? (
        <ProductGrid products={products} />
      ) : (
        <p>No products found for this selection.</p>
      )}
    </div>
  );
};

export default MerchandisePage;
