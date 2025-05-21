// Pre-made generative art/design options
const placeholderBaseUrl = 'https://via.placeholder.com/400x400.png';
const placeholderThumbBaseUrl = 'https://via.placeholder.com/100x100.png';

export const preMadeDesigns = [
  {
    id: 'design-001',
    name: 'Abstract Swirls',
    thumbnailUrl: `${placeholderThumbBaseUrl}?text=Design+1+Thumb`,
    fullImageUrl: `${placeholderBaseUrl}?text=Design+1+Full`,
    description: 'Dynamic and colorful abstract swirls.',
  },
  {
    id: 'design-002',
    name: 'Geometric Harmony',
    thumbnailUrl: `${placeholderThumbBaseUrl}?text=Design+2+Thumb`,
    fullImageUrl: `${placeholderBaseUrl}?text=Design+2+Full`,
    description: 'Balanced and intricate geometric patterns.',
  },
  {
    id: 'design-003',
    name: 'Cosmic Flow',
    thumbnailUrl: `${placeholderThumbBaseUrl}?text=Design+3+Thumb`,
    fullImageUrl: `${placeholderBaseUrl}?text=Design+3+Full`,
    description: 'Nebula-inspired flowing colors and shapes.',
  },
  {
    id: 'design-004',
    name: 'Retro Waves',
    thumbnailUrl: `${placeholderThumbBaseUrl}?text=Design+4+Thumb`,
    fullImageUrl: `${placeholderBaseUrl}?text=Design+4+Full`,
    description: 'Vintage 80s style wave patterns.',
  },
  {
    id: 'design-005',
    name: 'Nature\'s Symmetry',
    thumbnailUrl: `${placeholderThumbBaseUrl}?text=Design+5+Thumb`,
    fullImageUrl: `${placeholderBaseUrl}?text=Design+5+Full`,
    description: 'Symmetrical patterns inspired by natural forms.',
  },
];

// --- Constants for Identifying Special Products ---
export const CUSTOMIZABLE_PRODUCT_TAG = 'customizable-printful';
export const FEATURED_PRODUCT_TAG = 'featured-item';

/**
 * Checks if a product is customizable based on its tags.
 * @param {Object} product - The Shopify product object. Expected to have a `tags` property (string, comma-separated).
 * @returns {boolean} - True if the product is customizable, false otherwise.
 */
export const isProductCustomizable = (product) => {
  if (!product || !product.tags) {
    return false;
  }
  // Shopify tags are a comma-separated string.
  const tagsArray = product.tags.split(',').map(tag => tag.trim().toLowerCase());
  return tagsArray.includes(CUSTOMIZABLE_PRODUCT_TAG.toLowerCase());
};

/**
 * Checks if a product is featured based on its tags.
 * @param {Object} product - The Shopify product object. Expected to have a `tags` property.
 * @returns {boolean} - True if the product is featured, false otherwise.
 */
export const isProductFeatured = (product) => {
  if (!product || !product.tags) {
    return false;
  }
  const tagsArray = product.tags.split(',').map(tag => tag.trim().toLowerCase());
  return tagsArray.includes(FEATURED_PRODUCT_TAG.toLowerCase());
};
