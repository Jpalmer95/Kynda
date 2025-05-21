# Shopify Product Setup Guide

This guide explains how to configure products in your Shopify store so they are correctly recognized and displayed by the frontend application, specifically for "customizable Printful products" and "featured items."

## 1. Identifying Products in the Frontend

The frontend application uses Shopify product **tags** to identify special product types. Ensure tags are entered exactly as specified (case-insensitive, but consistency is good).

*   **Customizable Printful Products Tag:** `customizable-printful`
*   **Featured Items Tag:** `featured-item`

## 2. Setting Up a Customizable Printful Product

These are products (e.g., t-shirts, mugs) that will be fulfilled by Printful and allow customers to choose a pre-made design on the frontend.

**Steps:**

1.  **Find Your Base Product in Printful:**
    *   Log in to your Printful account.
    *   Navigate to their product catalog and select the base product you want to offer for customization (e.g., "Unisex Staple T-Shirt | Bella + Canvas 3001").
    *   For each variant (e.g., size S White, size M Black) you plan to offer, note down its **Printful Variant ID**. This is a numeric ID. You can usually find this when viewing product details or through Printful's API/dashboard when setting up products.

2.  **Create the Product in Shopify:**
    *   Go to `Products > Add product` in your Shopify admin.
    *   **Title:** Give your product a clear name, e.g., "Custom Design T-Shirt" or "Personalized Coffee Mug."
    *   **Description:** Describe the base product and mention that it can be customized with a design.
    *   **Images:**
        *   Upload mockups of the base product (e.g., blank t-shirt in different colors).
        *   The frontend will overlay the selected pre-made design onto these base images for a simple preview.
    *   **Pricing:** Set your retail price for the final customized product.
    *   **Inventory:**
        *   **SKU (Stock Keeping Unit):** This is **critical** for integration with Printful via our backend. For each Shopify variant:
            *   The SKU must be in the format: `PFUL-{PrintfulVariantID}`.
            *   Replace `{PrintfulVariantID}` with the actual numeric ID from Printful for that specific base product variant (e.g., size, color).
            *   Example: If the Printful Variant ID for a "White / S" t-shirt is `12345`, the Shopify SKU for your "White / S" variant should be `PFUL-12345`.
        *   **Track quantity:** It's generally recommended to **uncheck** "Track quantity" for Printful drop-shipped items, as Printful manages the stock. If you must track, set a high placeholder quantity.
    *   **Variants:**
        *   If your base Printful product has options like size and color, create these variants in Shopify.
        *   Ensure each Shopify variant has the correctly formatted SKU as described above.
    *   **Vendor:** In the "Organization" section on the right, set the `Vendor` field to exactly **`Printful_DS`**. This tells our backend that this product's fulfillment is handled by Printful.
    *   **Tags:** In the "Organization" section, add the tag **`customizable-printful`**. This exact tag tells the frontend to display the design selection UI on the product detail page. You can add other relevant tags as well (e.g., "Apparel", "T-Shirt").
    *   **Product Type (Optional but Recommended):** Set a relevant product type (e.g., "Custom Apparel", "Personalized Mug"). This can also be used for filtering or organization.

3.  **Save the Product.**

**How it Works:**

*   The `customizable-printful` tag makes the design selection UI appear on the frontend's product detail page.
*   The `Vendor: Printful_DS` field and the `PFUL-{PrintfulVariantID}` SKU format allow the backend to correctly identify the item during order processing and forward it to Printful with the correct base variant ID.
*   The selected design URL (from the frontend) is added as a line item property (custom attribute) to the Shopify order, which the backend then includes in the data sent to Printful.

## 3. Setting Up a Featured Item

Featured items are existing products (either self-fulfilled or drop-shipped) that you want to highlight, typically on the homepage.

**Steps:**

1.  **Navigate to the Product in Shopify:**
    *   Go to `Products` and select the product you want to feature.
2.  **Add the Tag:**
    *   In the "Organization" section on the right, find the **Tags** field.
    *   Add the tag **`featured-item`**.
    *   You can have multiple tags; just ensure `featured-item` is one of them.
3.  **Save the Product.**

**How it Works:**

*   The `FeaturedItems.js` component on the frontend fetches products and filters them to find any that include the `featured-item` tag.
*   These tagged products are then displayed in the "Featured Items" section.

By following these conventions, you can effectively manage which products are customizable via Printful and which ones are showcased as featured items on your e-commerce site. Remember that tag accuracy and the SKU format for customizable items are crucial for the integration to work correctly.
