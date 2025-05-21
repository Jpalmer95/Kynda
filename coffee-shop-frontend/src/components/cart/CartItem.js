import React from 'react';

const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
  // item is expected to be a Shopify line_item object from the checkout
  // It typically includes: id (line item ID), title, quantity, variant (with title, price, image)

  const handleQuantityChange = (event) => {
    const newQuantity = parseInt(event.target.value, 10);
    if (!isNaN(newQuantity) && newQuantity >= 0) { // Quantity 0 will be handled by store/service to remove
      onUpdateQuantity(item.id, newQuantity);
    }
  };

  const handleRemove = () => {
    onRemove(item.id);
  };

  // Extracting details, Shopify's structure can be nested
  const variantTitle = item.variant?.title === 'Default Title' ? '' : item.variant?.title;
  const pricePerItem = item.variant?.price?.amount;
  const itemImage = item.variant?.image;

  return (
    <div style={{ borderBottom: '1px solid #eee', padding: '10px 0', display: 'flex', alignItems: 'center' }}>
      {itemImage && (
        <img 
          src={itemImage.src} 
          alt={itemImage.altText || item.title} 
          style={{ width: '80px', height: '80px', objectFit: 'cover', marginRight: '15px', borderRadius: '4px' }} 
        />
      )}
      <div style={{ flexGrow: 1 }}>
        <h5 style={{ margin: '0 0 5px 0' }}>{item.title}</h5>
        {variantTitle && <p style={{ fontSize: '0.9em', color: '#666', margin: '0 0 5px 0' }}>{variantTitle}</p>}
        <p style={{ fontSize: '0.9em', color: '#666', margin: '0' }}>
          Price: ${pricePerItem ? parseFloat(pricePerItem).toFixed(2) : 'N/A'}
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', marginRight: '15px' }}>
        <label htmlFor={`quantity-${item.id}`} style={{ marginRight: '5px' }}>Qty:</label>
        <input
          id={`quantity-${item.id}`}
          type="number"
          value={item.quantity}
          onChange={handleQuantityChange}
          min="0" // Store logic will handle removal if 0
          style={{ width: '60px', padding: '5px', textAlign: 'center', borderRadius: '4px', border: '1px solid #ddd' }}
        />
      </div>
      <div style={{ marginRight: '15px' }}>
        <p style={{ fontWeight: 'bold', margin: 0 }}>
          Total: ${pricePerItem ? (parseFloat(pricePerItem) * item.quantity).toFixed(2) : 'N/A'}
        </p>
      </div>
      <button 
        onClick={handleRemove} 
        style={{ background: 'red', color: 'white', border: 'none', padding: '8px 12px', cursor: 'pointer', borderRadius: '4px' }}
      >
        Remove
      </button>
    </div>
  );
};

export default CartItem;
