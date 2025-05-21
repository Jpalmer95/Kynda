import React from 'react';
import { Link } from 'react-router-dom';
import useCartStore from '../../store/cartStore'; // To add simple products directly

const ProductCard = ({ product }) => {
  const addItemToCart = useCartStore((state) => state.addItem);

  // Use the first variant for price display and direct "Add to Cart" if simple
  const defaultVariant = product.variants && product.variants.length > 0 ? product.variants[0] : null;
  const price = defaultVariant?.price?.amount ? parseFloat(defaultVariant.price.amount).toFixed(2) : 'N/A';
  const productLink = `/products/${product.id}`;
  
  const itemImage = product.images?.edges[0]?.node || product.featuredImage;


  // Simplified direct add to cart for products with only one variant or no selectable options from grid
  const handleQuickAddToCart = (e) => {
    e.preventDefault(); // Prevent navigation if card is wrapped in Link
    if (defaultVariant && product.variants.length === 1) {
      addItemToCart({
        variant_id: defaultVariant.id,
        quantity: 1,
      });
    } else {
      // If multiple variants, typically navigate to product page
      // Or open a quick view modal (not implemented here)
      // For now, this button might be hidden or disabled if variants require selection
      alert('Please view product details to select options.');
    }
  };

  return (
    <div style={{ border: '1px solid #ddd', padding: '15px', margin: '10px', width: '220px', borderRadius: '8px', textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
      <Link to={productLink} style={{ textDecoration: 'none', color: 'inherit', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {itemImage && (
          <img 
            src={itemImage.url || itemImage.src} 
            alt={itemImage.altText || product.title} 
            style={{ width: '100%', height: '180px', objectFit: 'cover', marginBottom: '10px', borderRadius: '4px' }} 
          />
        )}
        <h4 style={{ fontSize: '1.1em', margin: '5px 0', minHeight: '44px' /* Approx 2 lines */ }}>{product.title}</h4>
        <p style={{ fontSize: '1em', fontWeight: 'bold', color: '#333', margin: '5px 0' }}>${price}</p>
      </Link>
      
      {/* Button to view details (always useful) */}
      <Link to={productLink} style={{ marginTop: 'auto' }}>
        <button style={{ width: '100%', padding: '10px', background: '#5bc0de', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '5px' }}>
          View Details
        </button>
      </Link>

      {/* Optional: Quick Add to Cart for single-variant products */}
      {/* {product.variants && product.variants.length === 1 && defaultVariant && (
        <button 
          onClick={handleQuickAddToCart}
          style={{ width: '100%', padding: '10px', background: '#5cb85c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Add to Cart
        </button>
      )} */}
    </div>
  );
};

export default ProductCard;
