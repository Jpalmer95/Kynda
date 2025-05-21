# Printful Integration Strategy for Drop-Shipping

This document outlines the strategy for integrating Printful with the existing Shopify-based e-commerce platform to handle drop-shipping of customizable merchandise.

## 1. Drop-Shipping Provider

**Printful** is the recommended provider due to its comprehensive API, robust mockup generation capabilities, and flexible product management options.

## 2. Product Representation in Shopify

*   **Standard Products:** Drop-shipped items (e.g., t-shirts, mugs with pre-set designs, or customizable templates) will be created as standard products in Shopify.
*   **Vendor Field:** The `vendor` field for these Shopify products will be set to a specific identifier, e.g., "**Printful_DS**". This will be the primary way our backend identifies items to be fulfilled by Printful.
*   **SKU Mapping:**
    *   Each Shopify product variant SKU will correspond to a Printful **Sync Variant ID** or a combination of a **Printful Catalog Variant ID** and any necessary customization identifiers (e.g., design file ID, placement).
    *   For initial non-customized items, the Shopify SKU could directly store the Printful Sync Variant ID (if products are pre-synced in Printful) or the Printful Catalog Variant ID (if ordering directly from catalog items).
    *   Example SKU format: `PFUL-{PrintfulVariantID}` or `PFUL-SYNC-{PrintfulSyncVariantID}`.
*   **Product Information:** Product titles, descriptions, images (mockups), and pricing will be managed in Shopify. Mockups can be generated using Printful's API and uploaded to Shopify.
*   **Inventory:** Inventory will not be tracked in Shopify for these items, as fulfillment is handled by Printful. Alternatively, a high placeholder inventory can be set, or if Printful webhooks for stock updates are used, inventory could be partially synced. For simplicity initially, we'll assume inventory is effectively infinite from Shopify's perspective for Printful items.

## 3. Order Flow and Data Synchronization

1.  **Customer Places Order (Shopify):** A customer purchases items, including one or more items to be drop-shipped via Printful.
2.  **Shopify Order Creation Webhook:** Shopify triggers an "Order Creation" webhook.
    *   This webhook is configured in the Shopify store admin to point to an endpoint on our backend (e.g., `/api/webhooks/shopify/orders`).
3.  **Backend Receives Webhook:**
    *   Our Node.js/Express.js backend receives the order data from Shopify.
    *   The webhook payload is validated (e.g., using Shopify's webhook signature).
4.  **Identify Drop-Shipped Items:**
    *   The backend parses the `line_items` in the Shopify order.
    *   It checks the `vendor` field of each line item. If `vendor === "Printful_DS"`, the item is identified as a drop-shipped item.
5.  **Prepare Order Data for Printful:**
    *   For each identified Printful line item:
        *   Extract the Printful Variant ID from the Shopify SKU (e.g., parse `PFUL-{PrintfulVariantID}`).
        *   Extract the quantity.
        *   Extract the design/print file details. For standard, non-customized items, this might be pre-associated with the Printful product/variant. For customized items (future), this would involve retrieving the generated design URL associated with the Shopify line item (e.g., from line item properties or a separate data store).
        *   Recipient details (name, address, email, phone) are taken from the Shopify order's `shipping_address`.
        *   Retail prices (for packing slip/customs) can be taken from the Shopify order.
6.  **Submit Order to Printful API:**
    *   The backend constructs an order creation request for the Printful API.
    *   This request includes recipient details, item details (Printful variant ID, quantity, print files, options), and any other necessary parameters (e.g., external ID linking to Shopify order ID, retail costs).
    *   The backend makes a POST request to Printful's `/orders` endpoint.
7.  **Handle Printful API Response:**
    *   **Success:** Printful returns an order confirmation. Our backend should log this, and potentially update the Shopify order with a note or tag indicating the Printful order ID (e.g., `printful_order_id: 12345`).
    *   **Failure:** Log the error. Implement a retry mechanism or a system for manual review of failed Printful orders. Notify administrators.
8.  **Shopify Order Fulfillment (Manual/Partial initially):**
    *   The portion of the order fulfilled by Printful will be marked as fulfilled in Shopify once Printful ships the items. This can be automated via Printful's `package_shipped` webhook.
    *   If an order contains both self-fulfilled and Printful-fulfilled items, it will be a partial fulfillment initially from the coffee shop's side.
9.  **Printful Webhooks (Future Enhancements):**
    *   **`package_shipped`:** When Printful ships an item, our backend can receive this webhook. It would then update the Shopify order by adding tracking information and marking the relevant line items as fulfilled.
    *   **`order_failed` / `order_canceled`:** For monitoring and alerting.
    *   **`stock_updated`:** Could be used to update Shopify inventory for Printful products if desired, though this adds complexity.

## 4. Product Setup in Shopify (Guidance for a Standard T-Shirt)

This outlines how a standard, non-customized drop-shipped t-shirt from Printful would be set up in Shopify to work with the proposed backend logic.

1.  **Find Product in Printful Catalog:**
    *   Identify the desired t-shirt in Printful's catalog (e.g., "Unisex Staple T-Shirt | Bella + Canvas 3001").
    *   Note down the **Variant IDs** for each size/color combination you want to offer (e.g., White/S, White/M, Black/S, Black/M). These are numeric IDs (e.g., `4012`).

2.  **Create Product in Shopify:**
    *   Go to `Products > Add product` in Shopify admin.
    *   **Title:** E.g., "Coffee Shop Logo Tee"
    *   **Description:** Add product details.
    *   **Images:** Upload mockups. These can be generated using Printful's mockup generator by uploading your design (e.g., coffee shop logo) onto the chosen t-shirt.
    *   **Pricing:** Set your retail price.
    *   **Inventory:**
        *   **SKU (Stock Keeping Unit):** This is crucial for integration. For each variant (size/color):
            *   Use the format: `PFUL-{PrintfulVariantID}`.
            *   Example: If Printful Variant ID for "White / S" is `4012`, the Shopify SKU should be `PFUL-4012`.
            *   Example: If Printful Variant ID for "Black / M" is `4018`, the Shopify SKU should be `PFUL-4018`.
        *   **Track quantity:** Uncheck this, or set a high placeholder quantity.
    *   **Shipping:** Mark as a physical product. Shipping costs will effectively be determined by Printful's rates but charged to the customer based on your Shopify shipping profiles. You'll need to factor Printful's shipping costs into your retail price or shipping rules.
    *   **Variants:**
        *   Add options like "Size" (S, M, L, XL) and "Color" (White, Black).
        *   For each combination, ensure the SKU is set correctly as described above.
    *   **Vendor:** Set this field to "**Printful_DS**". This is the key identifier for our backend.
    *   **Tags (Optional but Recommended):** Add relevant tags like "T-Shirt", "Apparel", "Merchandise". This can help with organization and frontend filtering.
    *   **Product Type (Optional but Recommended):** E.g., "Apparel".

3.  **Design File Association (Implicit for Standard Items):**
    *   For a standard logo tee, the design file is typically uploaded to Printful and associated with a "Product Template" or directly when creating a "Sync Product" in Printful's dashboard for your store.
    *   When an order for `PFUL-4012` comes in, Printful already knows which design to print on that specific Bella + Canvas 3001 (White/S) variant because this association is pre-established in your Printful account (either via their UI or their Sync Products API if you were to automate product creation in Printful).
    *   Our backend, when forwarding the order, just needs to tell Printful to fulfill `variant_id: 4012` with quantity `X`. Printful handles the rest based on your setup on their platform.

By following this setup, when an order webhook arrives at the backend, the system can:
1.  Identify line items with `vendor: "Printful_DS"`.
2.  Extract the Printful Variant ID from the SKU (e.g., `4012` from `PFUL-4012`).
3.  Forward this Variant ID and quantity to the Printful API for fulfillment.

This strategy ensures that Shopify remains the primary interface for product and order management from the customer's perspective, while Printful handles the fulfillment of designated drop-shipped items.
---
