import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchProductById } from '../services/apiService';
import useCartStore from '../store/cartStore';
import { preMadeDesigns, isProductCustomizable } from '../constants/designs'; // Updated import

const ProductDetailPage = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [isCustomizableState, setIsCustomizableState] = useState(false); // Renamed to avoid conflict
  const [selectedDesign, setSelectedDesign] = useState(null);

  const addItemToCart = useCartStore((state) => state.addItem);
  const cartLoading = useCartStore((state) => state.loading);
  const cartError = useCartStore((state) => state.error);

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchProductById(productId); // Assumes product object includes 'tags'
        setProduct(response.data);
        if (response.data.variants && response.data.variants.length > 0) {
          setSelectedVariantId(response.data.variants[0].id);
        }
        
        const customizable = isProductCustomizable(response.data); // Use the helper
        setIsCustomizableState(customizable);

        if (customizable && preMadeDesigns.length > 0) {
            setSelectedDesign(preMadeDesigns[0]); // Pre-select first design if customizable
        }

      } catch (err) {
        setError(err.message || `Failed to fetch product with ID ${productId}.`);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (productId) {
      loadProduct();
    }
  }, [productId]);

  const handleVariantChange = (event) => {
    setSelectedVariantId(event.target.value);
  };

  const handleQuantityChange = (event) => {
    const newQuantity = parseInt(event.target.value, 10);
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  const handleDesignSelect = (design) => {
    setSelectedDesign(design);
  };

  const handleAddToCart = () => {
    if (!product) return;

    const variantIdForCart = selectedVariantId || (product.variants && product.variants.length > 0 ? product.variants[0].id : product.id);
    
    if (!variantIdForCart) {
        console.error("ProductDetailPage: Variant ID is missing for cart operation.", product);
        alert("Error: Product variant information is missing or not selected.");
        return;
    }
    
    const lineItemToAdd = {
      variant_id: variantIdForCart,
      quantity: quantity,
    };

    if (isCustomizableState && selectedDesign) {
      lineItemToAdd.properties = {
        _customArtUrl: selectedDesign.fullImageUrl,
        _customArtName: selectedDesign.name,
      };
    }
    
    addItemToCart(lineItemToAdd);
  };
  
  const productImages = product?.images?.edges?.map(edge => edge.node) || (product?.featuredImage ? [product.featuredImage] : []);
  const selectedVariant = product?.variants?.find(v => v.id.toString() === selectedVariantId.toString());
  const currentProductImage = productImages[currentImageIndex]?.url || productImages[currentImageIndex]?.src || 'https://via.placeholder.com/400?text=No+Image';

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % productImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + productImages.length) % productImages.length);
  };

  if (loading) return <p>Loading product details...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!product) return <p>Product not found.</p>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      {cartLoading && <p style={{ color: 'blue', textAlign: 'center' }}>Updating cart...</p>}
      {cartError && <p style={{ color: 'red', textAlign: 'center' }}>Cart Error: {cartError}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
        <div>
          <h3 style={{ textAlign: 'center' }}>Product Preview</h3>
          <div style={{ position: 'relative', width: '100%', maxWidth: '400px', margin: '0 auto', border: '1px solid #eee' }}>
            <img 
              src={currentProductImage}
              alt={productImages[currentImageIndex]?.altText || `${product.title} - image ${currentImageIndex + 1}`} 
              style={{ width: '100%', display: 'block', borderRadius: '8px' }} 
            />
            {isCustomizableState && selectedDesign && (
              <img
                src={selectedDesign.fullImageUrl}
                alt={`Preview of ${selectedDesign.name}`}
                style={{
                  position: 'absolute',
                  top: '25%', 
                  left: '25%', 
                  width: '50%', 
                  height: '50%', 
                  objectFit: 'contain', 
                  pointerEvents: 'none', 
                }}
              />
            )}
          </div>
          {productImages.length > 1 && (
            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              <button onClick={prevImage} style={{marginRight: '10px'}}>&lt; Prev</button>
              <span>{currentImageIndex + 1} / {productImages.length}</span>
              <button onClick={nextImage} style={{marginLeft: '10px'}}>Next &gt;</button>
            </div>
          )}
        </div>

        <div>
          <h2 style={{ marginBottom: '10px' }}>{product.title}</h2>
          {product.tags && <p style={{fontSize: '0.8em', color: '#777'}}>Tags: {product.tags}</p>}
          <p style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#d9534f', marginBottom: '15px' }}>
            ${selectedVariant ? parseFloat(selectedVariant.price.amount).toFixed(2) : (product.priceRange?.minVariantPrice?.amount ? parseFloat(product.priceRange.minVariantPrice.amount).toFixed(2) : 'N/A')}
          </p>
          <div dangerouslySetInnerHTML={{ __html: product.descriptionHtml || product.description }} style={{ marginBottom: '20px', lineHeight: '1.6' }} />

          {product.variants && product.variants.length > 1 && (
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor={`variant-select-${product.id}`} style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                {product.options?.find(opt => opt.name !== 'Title')?.name || 'Options'}:
              </label>
              <select
                id={`variant-select-${product.id}`}
                value={selectedVariantId}
                onChange={handleVariantChange}
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                {product.variants.map(variant => (
                  <option key={variant.id} value={variant.id}>
                    {variant.title} (${parseFloat(variant.price.amount).toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
          )}

          {isCustomizableState && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '10px' }}>Choose Your Design:</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', maxHeight: '250px', overflowY: 'auto', padding: '5px', border: '1px solid #eee' }}>
                {preMadeDesigns.map(design => (
                  <div 
                    key={design.id} 
                    onClick={() => handleDesignSelect(design)}
                    style={{ 
                      border: selectedDesign?.id === design.id ? '2px solid #007bff' : '2px solid transparent', 
                      padding: '5px', 
                      cursor: 'pointer',
                      borderRadius: '4px',
                      textAlign: 'center',
                      width: '100px' // Fixed width for design options
                    }}
                  >
                    <img src={design.thumbnailUrl} alt={design.name} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
                    <p style={{ fontSize: '0.8em', margin: '5px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{design.name}</p>
                  </div>
                ))}
              </div>
              {selectedDesign && <p style={{marginTop: '5px', fontSize: '0.9em'}}>Selected: <strong>{selectedDesign.name}</strong></p>}
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor={`quantity-input-${product.id}`} style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Quantity:</label>
            <input
              id={`quantity-input-${product.id}`}
              type="number"
              value={quantity}
              onChange={handleQuantityChange}
              min="1"
              style={{ width: '80px', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', textAlign: 'center' }}
            />
          </div>

          <button
            onClick={handleAddToCart}
            disabled={cartLoading || (isCustomizableState && !selectedDesign)}
            style={{ 
              display: 'block', 
              width: '100%', 
              padding: '12px', 
              background: (isCustomizableState && !selectedDesign) ? '#ccc' : '#5cb85c', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              fontSize: '1.1em', 
              cursor: (isCustomizableState && !selectedDesign) ? 'not-allowed' : 'pointer' 
            }}
          >
            {cartLoading ? 'Adding...' : 'Add to Cart'}
          </button>
           {(isCustomizableState && !selectedDesign && !cartLoading) && <p style={{color: 'orange', fontSize: '0.9em', marginTop: '5px'}}>Please select a design for this customizable product.</p>}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
