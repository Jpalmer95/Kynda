import React, { useState } from 'react';

const MenuItem = ({ item, onAddToCart }) => {
  // Assuming item.variants is an array of Shopify variant objects
  // Each variant has id, title (e.g., "Small", "Large"), price
  const [selectedVariantId, setSelectedVariantId] = useState(
    item.variants && item.variants.length > 0 ? item.variants[0].id : null
  );
  const [quantity, setQuantity] = useState(1);

  const handleVariantChange = (event) => {
    setSelectedVariantId(event.target.value);
  };

  const handleQuantityChange = (event) => {
    const newQuantity = parseInt(event.target.value, 10);
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCartClick = () => {
    if (!selectedVariantId && item.variants && item.variants.length > 0) {
      alert('Please select an option.'); // Or more sophisticated UI feedback
      return;
    }
    // If there are no variants, the product itself is the variant.
    // The onAddToCart function in MenuPage handles finding the correct ID if selectedVariantId is null.
    // However, for products with actual variants, selectedVariantId MUST be set.
    const variantIdForCart = selectedVariantId || (item.variants && item.variants.length === 1 ? item.variants[0].id : item.id);


    if (!variantIdForCart) {
        console.error("MenuItem: Cannot add to cart, variant ID is missing.", item);
        alert("Error: Product variant information is missing.");
        return;
    }
    
    onAddToCart(item, variantIdForCart, quantity);
  };

  const displayPrice = () => {
    if (item.variants && item.variants.length > 0) {
      const selectedVariant = item.variants.find(v => v.id.toString() === selectedVariantId.toString());
      return selectedVariant ? parseFloat(selectedVariant.price.amount).toFixed(2) : 'N/A';
    }
    // Fallback for items without variants (though Shopify products usually have at least one default variant)
    return item.priceRange?.minVariantPrice?.amount ? parseFloat(item.priceRange.minVariantPrice.amount).toFixed(2) : 'Price not available';
  };
  
  const itemImage = item.images?.edges[0]?.node || item.featuredImage;


  return (
    <div style={{ border: '1px solid #ccc', padding: '15px', margin: '10px', width: '200px', borderRadius: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      {itemImage && (
        <img 
          src={itemImage.url || itemImage.src} 
          alt={itemImage.altText || item.title} 
          style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '4px' }} 
        />
      )}
      <h4 style={{ marginTop: '10px', marginBottom: '5px', fontSize: '1.1em' }}>{item.title}</h4>
      <p style={{ fontSize: '0.9em', color: '#555', flexGrow: 1 }}>{item.description || item.descriptionHtml?.replace(/<[^>]+>/g, '') || 'No description available.'}</p>
      
      {item.variants && item.variants.length > 1 && (
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor={`variant-select-${item.id}`} style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em' }}>Options:</label>
          <select 
            id={`variant-select-${item.id}`} 
            value={selectedVariantId} 
            onChange={handleVariantChange}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            {item.variants.map(variant => (
              <option key={variant.id} value={variant.id}>
                {variant.title} (${parseFloat(variant.price.amount).toFixed(2)})
              </option>
            ))}
          </select>
        </div>
      )}

      <div style={{ marginBottom: '10px' }}>
        <label htmlFor={`quantity-input-${item.id}`} style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em' }}>Quantity:</label>
        <input
          id={`quantity-input-${item.id}`}
          type="number"
          value={quantity}
          onChange={handleQuantityChange}
          min="1"
          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        />
      </div>
      
      <p style={{ fontWeight: 'bold', fontSize: '1.1em', marginBottom: '10px' }}>Price: ${displayPrice()}</p>
      
      <button 
        onClick={handleAddToCartClick}
        style={{ padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', width: '100%' }}
      >
        Add to Cart
      </button>
    </div>
  );
};

export default MenuItem;
