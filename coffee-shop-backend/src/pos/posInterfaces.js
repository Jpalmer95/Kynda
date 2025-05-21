/**
 * @file posInterfaces.js
 * @description Defines the generic order schema and POS connector interface for POS integration.
 */

/**
 * @typedef {Object} GenericOrderItemDetail
 * @property {string} id - Unique identifier for the item (e.g., Shopify Product Variant GID or SKU).
 * @property {string} name - Name of the item (e.g., "Latte", "Blueberry Muffin").
 * @property {number} quantity - Quantity of the item.
 * @property {number} unitPrice - Price of a single unit of the item (excluding tax).
 * @property {number} totalPrice - Total price for this line item (quantity * unitPrice, excluding tax).
 * @property {Array<Object>} [modifiers] - Optional array of selected modifiers (e.g., { name: "Almond Milk", price: 0.50 }).
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
 * @property {number} shipping - Total shipping cost (0 if pickup).
 * @property {number} grandTotal - The final amount to be paid.
 * @property {string} currency - Currency code (e.g., "USD").
 */

/**
 * @typedef {Object} GenericOrderPayment
 * @property {string} method - Payment method used (e.g., "shopify_payments", "crypto_coinbase", "cash_on_pickup").
 * @property {string} status - Payment status (e.g., "paid", "pending", "unpaid").
 * @property {string} [transactionId] - Transaction ID from the payment gateway.
 */

/**
 * @typedef {Object} GenericOrderPickupDetails
 * @property {string} type - "pickup" or "delivery" or "dine-in".
 * @property {Date} [pickupTime] - Requested pickup time (ISO string).
 * @property {string} [notes] - Special instructions for pickup/delivery.
 * @property {Object} [address] - Shipping address for delivery type.
 * @property {string} [address.address1]
 * @property {string} [address.address2]
 * @property {string} [address.city]
 * @property {string} [address.provinceCode] - State/Province code.
 * @property {string} [address.countryCode] - Country code.
 * @property {string} [address.zip]
 */

/**
 * @typedef {Object} GenericOrderSchema
 * @description Represents a standardized order structure for sending to various POS systems.
 * @property {string} orderId - Unique identifier for the order (e.g., Shopify Order ID or name like #1001).
 * @property {string} externalOrderId - The original order ID from the source system (e.g., Shopify's numeric ID).
 * @property {Date} createdAt - Timestamp of when the order was created (ISO string).
 * @property {GenericOrderCustomer} customer - Customer information.
 * @property {Array<GenericOrderItemDetail>} items - List of items in the order.
 * @property {GenericOrderTotals} totals - Order total amounts.
 * @property {GenericOrderPayment} payment - Payment details.
 * @property {GenericOrderPickupDetails} fulfillment - Fulfillment details (pickup, delivery, dine-in).
 * @property {string} [notes] - General notes for the order.
 * @property {string} posSource - Identifier for the POS system this order is intended for (e.g., "toast", "square").
 * @property {Object} [rawSourceOrder] - Optional: The original order object from the source (e.g., Shopify order payload) for reference or complex mappings.
 */


/**
 * @interface IPosConnector
 * @description Interface that all POS system connectors must implement.
 */
class IPosConnector {
    /**
     * Sends an order to the POS system.
     * @param {GenericOrderSchema} orderData - The standardized order data.
     * @returns {Promise<{success: boolean, posOrderId?: string, message?: string, error?: any}>} Result of the operation.
     *           `posOrderId` is the ID of the order in the POS system.
     */
    async sendOrder(orderData) {
        throw new Error("Method 'sendOrder()' must be implemented.");
    }

    /**
     * Retrieves the status of an order from the POS system.
     * @param {string} posOrderId - The order ID in the POS system.
     * @param {string} [externalOrderId] - Optional: The original external order ID.
     * @returns {Promise<{success: boolean, status?: string, details?: any, message?: string, error?: any}>} Order status.
     */
    async getOrderStatus(posOrderId, externalOrderId) {
        throw new Error("Method 'getOrderStatus()' must be implemented.");
    }

    /**
     * Cancels an order in the POS system.
     * @param {string} posOrderId - The order ID in the POS system.
     * @param {string} [externalOrderId] - Optional: The original external order ID.
     * @returns {Promise<{success: boolean, message?: string, error?: any}>} Result of the cancellation.
     */
    async cancelOrder(posOrderId, externalOrderId) {
        throw new Error("Method 'cancelOrder()' must be implemented.");
    }

    /**
     * Checks the health/connectivity of the POS system.
     * @returns {Promise<{success: boolean, status?: string, message?: string, error?: any}>} Connectivity status.
     */
    async checkHealth() {
        throw new Error("Method 'checkHealth()' must be implemented.");
    }
}

module.exports = {
    // The actual GenericOrderSchema and IPosConnector are conceptual definitions for documentation.
    // In a real JS project without TypeScript, these would serve as JSDoc types.
    // For actual runtime validation, a library like Joi or Zod would be used with these schemas.
};
