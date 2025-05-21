import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchAllMenuItems, fetchMenuItemsByCategory } from '../services/apiService';
import useCartStore from '../store/cartStore';
import MenuItem from '../components/menu/MenuItem'; // Will create this component later

const MenuPage = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]); // Or derive from items
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();

  const addItemToCart = useCartStore((state) => state.addItem);
  const cartLoading = useCartStore((state) => state.loading);
  const cartError = useCartStore((state) => state.error);

  useEffect(() => {
    const tableNumber = searchParams.get('table');
    if (tableNumber) {
      console.log(`Accessed via QR code for table: ${tableNumber}`);
      // Potentially store this table number in state or context if needed for ordering
    }

    const loadMenu = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchAllMenuItems();
        setMenuItems(response.data);
        // Derive categories (simple example: based on product_type or tags)
        const uniqueCategories = [...new Set(response.data.map(item => item.product_type).filter(Boolean))];
        setCategories(uniqueCategories);
      } catch (err) {
        setError(err.message || 'Failed to fetch menu items.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadMenu();
  }, [searchParams]);

  const handleSelectCategory = async (category) => {
    setSelectedCategory(category);
    setLoading(true);
    setError(null);
    try {
      if (category === null || category === "All") { // Assuming "All" shows everything
        const response = await fetchAllMenuItems();
        setMenuItems(response.data);
      } else {
        // Assuming backend handles filtering by product_type as category for this example
        // Or if categories are tags, then fetchMenuItemsByCategory(category)
        const response = await fetchAllMenuItems(); // Fetch all then filter client-side for simplicity
        setMenuItems(response.data.filter(item => item.product_type === category));
      }
    } catch (err) {
      setError(err.message || `Failed to fetch items for ${category}.`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Simple Add to Cart Handler (variant selection would be in MenuItem component)
  // This is a placeholder; actual variant details come from MenuItem component
  const handleAddToCart = (item, variantId, quantity) => {
    // In a real scenario, variantId would be selected within the MenuItem component
    // For now, let's assume the first variant if available, or the product ID itself if no variants.
    const defaultVariant = item.variants && item.variants.length > 0 ? item.variants[0] : null;
    if (!defaultVariant && !variantId) {
        console.error("No variant available or selected for item:", item.title);
        // Display error to user e.g. using a toast notification
        return;
    }
    const selectedVariantId = variantId || defaultVariant.id;

    addItemToCart({
      variant_id: selectedVariantId, // This needs to be the specific Shopify Variant ID
      quantity: quantity || 1,       // Quantity, defaulting to 1
    });
  };


  if (loading) return <p>Loading menu...</p>;
  if (error) return <p>Error loading menu: {error}</p>;

  return (
    <div>
      <h2>Menu</h2>
      {cartLoading && <p style={{ color: 'blue' }}>Updating cart...</p>}
      {cartError && <p style={{ color: 'red' }}>Cart Error: {cartError}</p>}

      <div>
        <button onClick={() => handleSelectCategory(null)} style={{ margin: '5px' }}>All</button>
        {categories.map(category => (
          <button key={category} onClick={() => handleSelectCategory(category)} style={{ margin: '5px' }}>
            {category}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '20px' }}>
        {menuItems.length > 0 ? (
          menuItems.map(item => (
            // Pass handleAddToCart to MenuItem. MenuItem will handle variant selection.
            <MenuItem key={item.id} item={item} onAddToCart={handleAddToCart} />
          ))
        ) : (
          <p>No menu items available for {selectedCategory || 'this selection'}.</p>
        )}
      </div>
    </div>
  );
};

export default MenuPage;
