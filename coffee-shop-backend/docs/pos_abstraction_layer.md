# POS (Point of Sale) Abstraction Layer Design

This document outlines the design for a POS Abstraction Layer within the Kynda Coffee backend system. The goal is to create a standardized way to integrate with various POS systems, allowing for flexibility and easier addition of new POS integrations in the future.

## 1. Overview

The POS Abstraction Layer will decouple the core order processing logic from the specifics of any particular POS system. When an order is received (e.g., from a Shopify webhook for an in-store pickup order), it will be transformed into a `GenericOrderSchema`. This standardized order will then be passed to a specific POS connector (e.g., `ToastConnector`, `SquareConnector`) which implements a common `IPosConnector` interface. The connector will be responsible for translating the generic order into the format required by the target POS system's API and sending it.

## 2. Core Components

### 2.1. Generic Order Schema (`GenericOrderSchema`)

This schema defines a standardized representation of an order, containing all necessary information that might be relevant to a POS system.

```javascript
/**
 * @typedef {Object} GenericOrderItemDetail
 * @property {string} id - Unique identifier for the item (e.g., Shopify Product Variant GID or SKU).
 * @property {string} name - Name of the item (e.g., "Latte", "Blueberry Muffin").
 * @property {number} quantity - Quantity of the item.
 * @property {number} unitPrice - Price of a single unit of the item (excluding tax).
 * @property {number} totalPrice - Total price for this line item (quantity * unitPrice, excluding tax).
 * @property {Array<Object>} [modifiers] - Optional array of selected modifiers (e.g., { name: "Almond Milk", price: 0.50, id: "POS_MODIFIER_ID_123" }).
 * @property {string} [notes] - Optional notes for this item (e.g., "extra hot").
 * @property {string} [sku] - Stock Keeping Unit, if available.
 * @property {Array<Object>} [customAttributes] - Array of custom attributes from Shopify (e.g., [{key: "_customArtUrl", value: "..."}]).
 */

/**
 * @typedef {Object} GenericOrderCustomer
 * @property {string} [id] - Customer ID from Shopify, if available.
 * @property {string} name - Customer's full name.
 * @property {string} [email] - Customer's email address.
 * @property {string} [phone] - Customer's phone number.
 */

/**
 * @typedef {Object} GenericOrderTotals
 * @property {number} subtotal - Total price of items before tax and discounts.
 * @property {number} tax - Total tax amount.
 * @property {number} discount - Total discount amount (if any).
 * @property {number} shipping - Total shipping cost (should be 0 for POS in-store/pickup orders).
 * @property {number} grandTotal - The final amount to be paid.
 * @property {string} currency - Currency code (e.g., "USD").
 */

/**
 * @typedef {Object} GenericOrderPayment
 * @property {string} method - Payment method used (e.g., "shopify_payments", "crypto_coinbase", "cash_on_pickup", "pos_card_reader").
 * @property {string} status - Payment status (e.g., "paid", "pending", "unpaid_at_pos").
 * @property {string} [transactionId] - Transaction ID from the payment gateway if paid online.
 */

/**
 * @typedef {Object} GenericOrderFulfillmentDetails
 * @property {string} type - "pickup", "delivery" (for POS that handle local delivery), or "dine-in".
 * @property {Date} [requestedAt] - Requested pickup/delivery/service time (ISO string).
 * @property {string} [notes] - Special instructions for fulfillment.
 * @property {Object} [pickupLocationDetails] - Details about the coffee shop location for pickup.
 * @property {string} [pickupLocationDetails.id] - Internal ID for the pickup location.
 * @property {string} [pickupLocationDetails.name] - Name of the pickup location (e.g., "Main Street Cafe").
 * @property {string} [tableNumber] - For "dine-in" orders.
 */

/**
 * @typedef {Object} GenericOrderSchema
 * @description Represents a standardized order structure for sending to various POS systems.
 * @property {string} orderId - Unique display identifier for the order (e.g., Shopify Order Name like #1001).
 * @property {string} externalOrderId - The original numeric order ID from the source system (e.g., Shopify's order.id).
 * @property {Date} createdAt - Timestamp of when the order was created (ISO string).
 * @property {GenericOrderCustomer} customer - Customer information.
 * @property {Array<GenericOrderItemDetail>} items - List of items in the order.
 * @property {GenericOrderTotals} totals - Order total amounts.
 * @property {GenericOrderPayment} payment - Payment details.
 * @property {GenericOrderFulfillmentDetails} fulfillment - Fulfillment details.
 * @property {string} [orderNotes] - General notes for the entire order.
 * @property {string} targetPosSystem - Identifier for the POS system this order is intended for (e.g., "toast", "square", "hypothetical_pos"). Used by the factory/selector.
 * @property {Object} [rawSourceOrder] - Optional: The original order object from the source (e.g., Shopify order payload) for reference or complex mappings.
 */
```
*(This schema is conceptually defined in `src/pos/posInterfaces.js` using JSDoc.)*

### 2.2. POS Connector Interface (`IPosConnector`)

This interface defines the contract that all specific POS connectors must adhere to.

```javascript
/**
 * @interface IPosConnector
 * @description Interface that all POS system connectors must implement.
 */
class IPosConnector {
    /**
     * Initializes the connector with specific configuration.
     * @param {Object} config - POS-specific configuration (API keys, endpoint URLs, store ID, etc.).
     */
    constructor(config) {
        if (this.constructor === IPosConnector) {
            throw new Error("IPosConnector is an interface and cannot be instantiated directly.");
        }
        this.config = config;
    }

    /**
     * Sends an order to the POS system.
     * @param {GenericOrderSchema} orderData - The standardized order data.
     * @returns {Promise<{success: boolean, posOrderId?: string, message?: string, error?: any}>} Result of the operation.
     *           `posOrderId` is the ID of the order as created in the POS system.
     */
    async sendOrder(orderData) {
        throw new Error("Method 'sendOrder()' must be implemented by the connector.");
    }

    /**
     * Retrieves the status of an order from the POS system.
     * @param {string} posOrderId - The order ID in the POS system.
     * @param {string} [externalOrderId] - Optional: The original external order ID (e.g., Shopify Order ID).
     * @returns {Promise<{success: boolean, status?: string, details?: any, message?: string, error?: any}>} Order status.
     */
    async getOrderStatus(posOrderId, externalOrderId) {
        throw new Error("Method 'getOrderStatus()' must be implemented by the connector.");
    }

    /**
     * Cancels an order in the POS system (if supported).
     * @param {string} posOrderId - The order ID in the POS system.
     * @param {string} [externalOrderId] - Optional: The original external order ID.
     * @returns {Promise<{success: boolean, message?: string, error?: any}>} Result of the cancellation.
     */
    async cancelOrder(posOrderId, externalOrderId) {
        throw new Error("Method 'cancelOrder()' must be implemented by the connector.");
    }

    /**
     * Checks the health/connectivity of the POS system API.
     * @returns {Promise<{success: boolean, status?: string, message?: string, error?: any}>} Connectivity status.
     */
    async checkHealth() {
        throw new Error("Method 'checkHealth()' must be implemented by the connector.");
    }
}
```
*(This interface is conceptually defined in `src/pos/posInterfaces.js` using JSDoc and a base class for demonstration.)*

## 3. Order Processing Flow

The primary flow for handling orders intended for a POS system (e.g., in-store pickup orders originating from online sales) will be as follows:

1.  **Order Received by Backend:**
    *   An order is created in Shopify (e.g., customer orders online for "in-store pickup").
    *   Shopify sends an "Order Creation" webhook to a dedicated endpoint on our backend (e.g., `/api/webhooks/shopify/orders-pos`). This endpoint might be different from the drop-shipping one, or the same webhook handler could route based on order properties.

2.  **Data Transformation (`ShopifyToPosAdapter.js` or similar):**
    *   The webhook handler (e.g., in `shopifyWebhookController.js`) receives the raw Shopify order payload.
    *   A dedicated adapter/transformer module (e.g., `ShopifyToPosAdapter.js`) is responsible for converting the Shopify order object into the `GenericOrderSchema`. This involves:
        *   Mapping Shopify customer details to `GenericOrderCustomer`.
        *   Mapping Shopify line items to `GenericOrderItemDetail[]`. This includes:
            *   Extracting SKUs, names, quantities, prices.
            *   Identifying modifiers (e.g., "Large", "Almond Milk") from Shopify line item properties or variant titles and mapping them to the `modifiers` array. This might require a lookup table or naming convention if POS modifier IDs are needed.
            *   Extracting any custom attributes (like `_customArtUrl`) and placing them in `GenericOrderItemDetail.customAttributes`.
        *   Mapping Shopify totals, payment status (e.g., if paid online or "pay at pickup"), and currency to `GenericOrderTotals` and `GenericOrderPayment`.
        *   Determining fulfillment type. For an "in-store pickup" Shopify order, `fulfillment.type` would be "pickup". `fulfillment.requestedAt` might come from Shopify order attributes or be set to "ASAP".
        *   Setting `targetPosSystem` based on configuration (e.g., a default POS, or based on the Shopify order's location if multiple coffee shop locations use different POS systems).
        *   Storing the original Shopify order ID in `externalOrderId` and the display name (e.g., #1001) in `orderId`.
        *   Optionally including the full Shopify order payload in `rawSourceOrder`.

3.  **POS Connector Selection & Invocation (`PosIntegrationService.js`):**
    *   This logic will reside in a new service, e.g., `PosIntegrationService.js`.
    *   **Configuration:** The backend will have a configuration (e.g., in `.env` or a dedicated config file) specifying the active POS system(s) and their credentials/API endpoints. Example:
        ```
        ACTIVE_POS_SYSTEM=toast
        TOAST_API_KEY=your_toast_api_key
        TOAST_API_ENDPOINT=https://api.toasttab.com
        TOAST_RESTAURANT_GUID=your_restaurant_guid
        ```
    *   **Connector Factory/Selector:** The `PosIntegrationService` will use a factory pattern or a simple selector to instantiate the appropriate POS connector based on the `ACTIVE_POS_SYSTEM` configuration or the `targetPosSystem` field in the `GenericOrderSchema`.
        ```javascript
        // Inside PosIntegrationService.js (conceptual)
        // const activePosSystem = process.env.ACTIVE_POS_SYSTEM;
        // let connector;
        // if (activePosSystem === 'toast') {
        //   connector = new ToastConnector({ apiKey: process.env.TOAST_API_KEY, ... });
        // } else if (activePosSystem === 'square') {
        //   connector = new SquareConnector({ ... });
        // } else {
        //   throw new Error(`Unsupported POS system: ${activePosSystem}`);
        // }
        ```
    *   **Invocation:** The service then calls `connector.sendOrder(genericOrderData)`.

4.  **POS Connector Execution:**
    *   The specific connector (e.g., `ToastConnector.js`) receives the `GenericOrderSchema`.
    *   It maps the fields from `GenericOrderSchema` to the format required by the target POS system's API. This is the core responsibility of each connector.
    *   It makes the API call(s) to the POS system to create the order.
    *   It handles the POS API's response, translating it back into the standardized `Promise<{success: boolean, posOrderId?: string, ...}>` format.

5.  **Post-Processing and Response:**
    *   The `PosIntegrationService` receives the result from the connector.
    *   It logs the outcome.
    *   If successful, it might update the Shopify order with a note or tag indicating the POS order ID (e.g., `pos_order_id: toast-12345`). This requires Shopify API write access.
    *   The webhook handler responds to Shopify (typically with a `200 OK` to acknowledge receipt, even if POS submission fails, to prevent retries for that specific failure). Internal alerting/retry mechanisms should handle POS submission failures.

**Location of Logic:**

*   **Webhook Handler:** `src/controllers/shopifyWebhookController.js` (or a new POS-specific controller).
*   **Data Transformer (Shopify to Generic):** A new module, e.g., `src/adapters/shopifyToPosAdapter.js`.
*   **POS Integration Service & Connector Factory:** A new service, `src/services/PosIntegrationService.js`.
*   **Specific POS Connectors:** In a new directory, e.g., `src/pos/connectors/ToastConnector.js`, `src/pos/connectors/SquareConnector.js`.
*   **Interfaces/Schemas:** `src/pos/posInterfaces.js`.

## 4. Example Connector Structure (`HypotheticalPosConnector.js`)

This is a conceptual pseudo-code example of what a specific POS connector might look like.

```javascript
// src/pos/connectors/HypotheticalPosConnector.js
// const axios = require('axios'); // Or a specific SDK for the POS
// const logger = require('../../utils/logger');
// const { IPosConnector } // Conceptually imported for type hinting / structure

class HypotheticalPosConnector /* extends IPosConnector */ { // Conceptually implements
    constructor(config) {
        // super(config); // If extending a base class that takes config
        this.apiKey = config.apiKey;
        this.apiEndpoint = config.apiEndpoint;
        this.storeId = config.storeId;
        // Initialize HTTP client for this POS API
        // this.posApiClient = axios.create({ baseURL: this.apiEndpoint, headers: {'Authorization': `Bearer ${this.apiKey}`} });
        logger.info(`HypotheticalPosConnector initialized for store ID: ${this.storeId}`);
    }

    async sendOrder(genericOrderData) {
        logger.info(`[HypotheticalPOS] Received order ${genericOrderData.orderId} for processing.`);
        try {
            // 1. Transform GenericOrderSchema to HypotheticalPOS's expected format
            const posOrderPayload = this._transformToPosFormat(genericOrderData);
            logger.debug(`[HypotheticalPOS] Transformed payload: ${JSON.stringify(posOrderPayload)}`);

            // 2. Make the API call to HypotheticalPOS
            // const response = await this.posApiClient.post('/orders', posOrderPayload);
            // logger.info(`[HypotheticalPOS] Order submitted. Response status: ${response.status}, POS Order ID: ${response.data.id}`);

            // MOCK RESPONSE:
            const mockPosOrderId = `hypo-${Date.now()}`;
            logger.info(`[HypotheticalPOS] MOCK Order submitted. POS Order ID: ${mockPosOrderId}`);
            
            // 3. Handle response and return standardized result
            // if (response.data && response.data.id) {
            return {
                success: true,
                posOrderId: mockPosOrderId, // response.data.id,
                message: `Order ${genericOrderData.orderId} successfully sent to HypotheticalPOS.`,
            };
            // } else {
            //   logger.error('[HypotheticalPOS] Order submission failed or ID missing in response.', response.data);
            //   return { success: false, message: 'POS order submission failed.', error: response.data };
            // }

        } catch (error) {
            logger.error(`[HypotheticalPOS] Error sending order ${genericOrderData.orderId}:`, error.message);
            // if (error.response) {
            //     logger.error('[HypotheticalPOS] API Error Data:', error.response.data);
            // }
            return {
                success: false,
                message: `Failed to send order to HypotheticalPOS: ${error.message}`,
                error: error.response ? error.response.data : error.message,
            };
        }
    }

    _transformToPosFormat(genericOrderData) {
        // Transformation logic:
        // - Map genericOrderData.items to POS-specific item structure
        //   - This includes mapping product IDs/SKUs if the POS has its own catalog.
        //   - Convert modifiers to POS modifier IDs/codes.
        // - Map customer details.
        // - Map payment details (e.g., "paid_online", "pay_at_counter").
        // - Map fulfillment details (e.g., "pickup", "dine-in", pickup time).
        // - Map totals.
        const posPayload = {
            externalReferenceId: genericOrderData.externalOrderId,
            displayId: genericOrderData.orderId,
            customerName: genericOrderData.customer.name,
            customerContact: genericOrderData.customer.phone || genericOrderData.customer.email,
            orderType: genericOrderData.fulfillment.type.toUpperCase(), // e.g., "PICKUP"
            requestedTime: genericOrderData.fulfillment.requestedAt,
            notes: genericOrderData.orderNotes,
            paymentStatus: genericOrderData.payment.status === 'paid' ? 'PAID' : 'UNPAID',
            items: genericOrderData.items.map(item => ({
                sku: item.sku || item.id, // Prefer SKU, fallback to generic ID
                name: item.name,
                quantity: item.quantity,
                unitPrice: item.unitPrice, // Ensure this is in the format POS expects (e.g., cents or float)
                // modifiers: item.modifiers?.map(m => ({ posModifierId: m.id, name: m.name, price: m.price })) || [],
                notes: item.notes,
                // customAttributes: item.customAttributes // Decide if/how these are sent
            })),
            totalAmount: genericOrderData.totals.grandTotal,
            taxAmount: genericOrderData.totals.tax,
            subtotalAmount: genericOrderData.totals.subtotal,
            // ... any other fields required by HypotheticalPOS
        };
        return posPayload;
    }

    async getOrderStatus(posOrderId, externalOrderId) {
        logger.info(`[HypotheticalPOS] Getting status for order: ${posOrderId || externalOrderId}`);
        // Implementation to fetch order status from HypotheticalPOS API
        // MOCK:
        return Promise.resolve({ success: true, status: 'pending_acceptance', details: { message: "Mock status" } });
    }

    async cancelOrder(posOrderId, externalOrderId) {
        logger.info(`[HypotheticalPOS] Cancelling order: ${posOrderId || externalOrderId}`);
        // Implementation to cancel order in HypotheticalPOS API
        // MOCK:
        return Promise.resolve({ success: true, message: "Mock cancellation successful" });
    }

    async checkHealth() {
        logger.info(`[HypotheticalPOS] Checking health...`);
        // Implementation to check HypotheticalPOS API health (e.g., ping endpoint)
        // MOCK:
        return Promise.resolve({ success: true, status: 'online', message: "Mock POS is healthy" });
    }
}

// module.exports = HypotheticalPosConnector;
```

## 5. Configuration and Scalability

*   **Environment Variables:** API keys, POS system identifiers, and other sensitive configurations will be managed via environment variables.
*   **Multiple POS Systems:** The factory/selector pattern in `PosIntegrationService.js` allows for easy extension. To add a new POS:
    1.  Implement a new connector class adhering to `IPosConnector`.
    2.  Update the factory/selector to recognize and instantiate the new connector.
    3.  Add necessary configuration (API keys, etc.) to environment variables.
*   **Error Handling & Retries:** Robust error logging is essential. For `sendOrder` failures, a retry mechanism (e.g., using a queue like BullMQ or RabbitMQ) should be considered for production to handle transient POS API issues.

This abstraction layer provides a clear separation of concerns and a scalable architecture for integrating with various POS systems.
---
