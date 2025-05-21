# Backend Testing Strategy (Node.js/Express.js)

This document outlines the strategy for unit and integration testing of the Kynda Coffee backend system.

## 1. Recommended Testing Frameworks and Tools

*   **Primary Testing Framework: [Jest](https://jestjs.io/)**
    *   **Reasoning:** Jest is a widely adopted, "batteries-included" JavaScript testing framework. It offers an integrated test runner, assertion library, mocking support, code coverage analysis, and parallel test execution out-of-the-box. Its ease of use and comprehensive features make it suitable for both unit and integration tests.
*   **API Integration Testing: [Supertest](https://github.com/ladjs/supertest)**
    *   **Reasoning:** Supertest is designed for testing HTTP assertions. It allows you to programmatically send requests to your Express.js application, inspect responses (headers, status codes, body), and assert their correctness without needing to run the server on a specific port during tests. It works well with Jest.
*   **Mocking:**
    *   **Jest's Built-in Mocking (`jest.mock`, `jest.fn`, `jest.spyOn`):** Jest provides powerful capabilities to mock modules, functions, and even specific implementations within modules. This is crucial for isolating units of code and simulating external dependencies (like Shopify API, Printful API, POS APIs).
*   **Assertions:**
    *   **Jest's Expect API:** Jest comes with a rich set of assertion matchers (`expect(value).toBe(expected)`, `.toEqual()`, `.toHaveBeenCalledWith()`, etc.).

## 2. Test Structure and Organization

Tests will be organized to be easily discoverable and maintainable.

*   **Root Test Directory:** A top-level `__tests__` directory can be created in `coffee-shop-backend/` for global test setup/configuration if needed, but primary tests will live closer to the code they test.
*   **Unit Tests:**
    *   Files will be co-located with the modules they are testing, within a `__tests__` subdirectory or using a `.test.js` (or `.spec.js`) suffix.
    *   Example:
        ```
        /src
        |-- /services
        |   |-- shopifyService.js
        |   |-- __tests__
        |       |-- shopifyService.test.js
        |-- /controllers
        |   |-- cartController.js
        |   |-- __tests__
        |       |-- cartController.test.js
        ```
    *   Alternatively, for simpler structures, just `moduleName.test.js` alongside `moduleName.js`.
*   **Integration Tests (API Level):**
    *   A dedicated directory for API integration tests: `coffee-shop-backend/src/__tests__/integration` or `coffee-shop-backend/integration-tests/`.
    *   Test files should be named descriptively based on the API resource they target.
    *   Example:
        ```
        /src
        |-- /__tests__
            |-- /integration
                |-- menu.integration.test.js
                |-- cart.integration.test.js
                |-- webhooks.integration.test.js
        ```
*   **Mock Data:**
    *   A `__mocks__` directory at the same level as the module being mocked (for manual mocks) or within `__tests__` for test-specific mock data/factories.
    *   Example: `src/services/__mocks__/shopify-api-node.js` to mock the `shopify-api-node` library.

*   **Naming Conventions:**
    *   Test files: `*.test.js` or `*.spec.js`.
    *   Test descriptions: Use clear, descriptive language (e.g., `describe('shopifyService.getAllMenuItems', () => { ... });`, `it('should return all products when Shopify API call is successful', () => { ... });`).

## 3. Unit Test Cases

Unit tests will focus on individual functions or modules, with external dependencies mocked.

### 3.1. `shopifyService.js`

*   **Dependency to Mock:** `shopify-api-node` library instance (`shopify`).
*   **Functions to Test & Scenarios:**
    *   `getAllMenuItems()`:
        *   **Scenario 1:** Successful API call.
            *   Mock `shopify.product.list` to resolve with sample product data.
            *   **Expected:** Returns the sample product data.
        *   **Scenario 2:** Shopify API returns an error.
            *   Mock `shopify.product.list` to reject with a simulated Shopify API error.
            *   **Expected:** Throws the error or a custom error wrapping it. Logged error.
        *   **Scenario 3 (Future):** Implement filtering logic (e.g., by `product_type` or `tag`).
            *   Mock `shopify.product.list` with diverse data.
            *   **Expected:** Returns correctly filtered products.
    *   `getMenuItemsByCategory(categoryTag)`:
        *   **Scenario 1:** Valid `categoryTag`, successful API call.
            *   Mock `shopify.product.list({ tag: categoryTag })` to resolve with relevant products.
            *   **Expected:** Returns products for the specified category.
        *   **Scenario 2:** Valid `categoryTag`, API returns no products.
            *   Mock `shopify.product.list` to resolve with an empty array.
            *   **Expected:** Returns an empty array.
        *   **Scenario 3:** Shopify API returns an error.
            *   Mock `shopify.product.list` to reject.
            *   **Expected:** Throws error. Logged error.
    *   `createCart(lineItemsInput)`:
        *   **Scenario 1:** Called with empty `lineItemsInput`.
            *   Mock `shopify.checkout.create` to resolve with a mock checkout object.
            *   **Expected:** Calls `shopify.checkout.create` with `line_items: []`. Returns mock checkout.
        *   **Scenario 2:** Called with valid `lineItemsInput` (including `properties` for custom attributes).
            *   Mock `shopify.checkout.create`.
            *   **Expected:** Calls `shopify.checkout.create` with correctly formatted `line_items` (including `customAttributes` mapped from `properties`). Returns mock checkout.
        *   **Scenario 3:** Shopify API returns an error.
            *   Mock `shopify.checkout.create` to reject.
            *   **Expected:** Throws error. Logged error.
    *   `addItemToCart(checkoutId, lineItemsInput)`:
        *   **Scenario 1:** Valid `checkoutId` and `lineItemsInput` (with/without `properties`).
            *   Mock `shopify.checkout.get` to return a checkout with some existing items.
            *   Mock `shopify.checkout.update` to resolve with an updated checkout.
            *   **Expected:** Correctly merges/formats line items (new items added, existing quantities updated, `customAttributes` mapped) and calls `shopify.checkout.update`. Returns updated checkout.
        *   **Scenario 2:** Shopify API `get` or `update` returns an error.
            *   Mock accordingly.
            *   **Expected:** Throws error. Logged error.
    *   `getCart(checkoutId)`:
        *   **Scenario 1:** Valid `checkoutId`, successful API call.
            *   Mock `shopify.checkout.get` to resolve with a mock cart.
            *   **Expected:** Returns the mock cart.
        *   **Scenario 2:** Shopify API returns a 404 (cart not found).
            *   Mock `shopify.checkout.get` to reject with a 404 error.
            *   **Expected:** Throws error. Logged error.
    *   `updateCartItem(checkoutId, lineItemId, quantity)`:
        *   **Scenario 1:** Valid inputs, quantity > 0.
            *   Mock `shopify.checkout.get` and `shopify.checkout.update`.
            *   **Expected:** Correctly updates the quantity of the specified line item. Returns updated checkout.
        *   **Scenario 2:** Valid inputs, quantity = 0.
            *   Mock `shopify.checkout.get` and `shopify.checkout.update`.
            *   **Expected:** Removes the specified line item. Returns updated checkout.
        *   **Scenario 3:** `lineItemId` not found in cart.
            *   Mock `shopify.checkout.get` with items not matching `lineItemId`.
            *   **Expected:** Handles gracefully (e.g., no change or specific error). Logged.
        *   **Scenario 4:** Shopify API error.
            *   **Expected:** Throws error. Logged.
    *   `removeCartItem(checkoutId, lineItemId)`:
        *   **Scenario 1:** Valid inputs, item exists.
            *   Mock `shopify.checkout.get` and `shopify.checkout.update`.
            *   **Expected:** Removes the item. Returns updated checkout.
        *   **Scenario 2:** `lineItemId` not found.
            *   **Expected:** Handles gracefully. Logged.
        *   **Scenario 3:** Shopify API error.
            *   **Expected:** Throws error. Logged.

### 3.2. `printfulService.js`

*   **Dependency to Mock:** `axios` (or the `printfulApiClient` instance).
*   **Functions to Test & Scenarios:**
    *   `createPrintfulOrder(orderPayload)`:
        *   **Scenario 1:** Valid `orderPayload` (with and without `customArtUrl` for items).
            *   Mock `printfulApiClient.post` to resolve with a mock Printful order confirmation.
            *   **Expected:** Calls Printful API with correctly formatted payload (items, recipient, files array populated if `customArtUrl` present). Returns mock confirmation.
        *   **Scenario 2:** `PRINTFUL_API_KEY` is missing.
            *   **Expected:** Throws an error before making an API call. Logged error.
        *   **Scenario 3:** Printful API returns an error (e.g., 400, 401, 500).
            *   Mock `printfulApiClient.post` to reject with a simulated error response.
            *   **Expected:** Throws a structured error. Detailed error logged.
        *   **Scenario 4:** Printful API request fails (network error).
            *   Mock `printfulApiClient.post` to reject without a `response` object.
            *   **Expected:** Throws an error indicating no response. Logged error.

### 3.3. `shopifyWebhookController.js`

*   **Dependencies to Mock:** `crypto` (for HMAC verification, though Jest might auto-mock parts or allow spying), `logger`, `printfulService`.
*   **Functions to Test & Scenarios:**
    *   `verifyShopifyWebhook(req, res, next)`:
        *   **Scenario 1:** Valid HMAC signature.
            *   Mock `req.get('X-Shopify-Hmac-Sha256')` and `req.rawBody`.
            *   **Expected:** Calls `next()` and `req.body` is populated by parsing `req.rawBody`.
        *   **Scenario 2:** Invalid HMAC signature.
            *   **Expected:** Responds with 403. `next()` not called. Logged warning.
        *   **Scenario 3:** Missing HMAC header.
            *   **Expected:** Responds with 401. `next()` not called. Logged warning.
        *   **Scenario 4:** Missing `SHOPIFY_WEBHOOK_SECRET`.
            *   **Expected:** Responds with 500. `next()` not called. Logged error.
        *   **Scenario 5:** `req.rawBody` is missing.
            *   **Expected:** Responds with 500. `next()` not called. Logged error.
    *   `handleOrderCreateWebhook(req, res)`:
        *   **Scenario 1:** Valid Shopify order payload with Printful items (including custom art properties).
            *   Mock `req.body` with a sample Shopify order.
            *   Mock `printfulService.createPrintfulOrder` to resolve successfully.
            *   **Expected:** `printfulService.createPrintfulOrder` is called with correctly transformed data (Printful variant IDs extracted from SKUs, `customArtUrl` mapped to files). Responds with 200.
        *   **Scenario 2:** Shopify order with no Printful items (vendor mismatch).
            *   **Expected:** `printfulService.createPrintfulOrder` is not called. Responds with 200. Logged info.
        *   **Scenario 3:** Shopify order with Printful items but missing SKUs or invalid SKU format.
            *   **Expected:** Logs warning for specific items, `printfulService.createPrintfulOrder` might be called with fewer items or not at all if all items are problematic. Responds with 200.
        *   **Scenario 4:** Missing shipping address in Shopify order.
            *   **Expected:** `printfulService.createPrintfulOrder` not called. Responds with 200. Logged warning.
        *   **Scenario 5:** `printfulService.createPrintfulOrder` throws an error.
            *   Mock `printfulService.createPrintfulOrder` to reject.
            *   **Expected:** Responds with 200 (to acknowledge webhook to Shopify), but logs the internal error.

### 3.4. POS Abstraction Components (Conceptual)

*   `ShopifyToPosAdapter.js` (Conceptual):
    *   **Function:** `transform(shopifyOrder)`
    *   **Scenarios:**
        *   Valid Shopify order for pickup.
            *   **Expected:** Returns a correctly populated `GenericOrderSchema` (fulfillment type "pickup", items mapped, etc.).
        *   Shopify order with line item properties (modifiers).
            *   **Expected:** Modifiers correctly mapped in `GenericOrderItemDetail.modifiers`.
        *   Shopify order with notes.
            *   **Expected:** Notes mapped.
*   `PosIntegrationService.js` (Conceptual):
    *   **Function:** `forwardOrderToPos(genericOrder)`
    *   **Scenarios:**
        *   Active POS system configured (e.g., 'toast').
            *   Mock the specific connector (e.g., `ToastConnector.sendOrder`).
            *   **Expected:** Correct connector is instantiated and `sendOrder` is called.
        *   No active POS system configured or unsupported system.
            *   **Expected:** Throws error or logs gracefully.
*   `HypotheticalPosConnector.js` (Conceptual):
    *   **Function:** `sendOrder(genericOrderData)`
        *   Mock the POS API client (`this.posApiClient.post`).
        *   **Scenario 1:** Successful transformation and API call.
            *   **Expected:** Returns `{ success: true, posOrderId: '...' }`.
        *   **Scenario 2:** POS API returns an error.
            *   **Expected:** Returns `{ success: false, error: ... }`.
    *   **Function:** `_transformToPosFormat(genericOrderData)`
        *   **Scenario 1:** Valid `GenericOrderSchema`.
            *   **Expected:** Returns a payload correctly formatted for the hypothetical POS API.

## 4. Integration Test Cases (API Level)

These tests use Supertest to make HTTP requests to the running Express app (in a test environment), mocking external service calls within the service layer.

### 4.1. Menu API (`/api/menu`)

*   `GET /api/menu`
    *   **Scenario 1:** `shopifyService.getAllMenuItems` returns products.
        *   **Mock:** `shopifyService.getAllMenuItems` to resolve with an array of product objects.
        *   **Expected:** `200 OK`, response body is the array of products.
    *   **Scenario 2:** `shopifyService.getAllMenuItems` returns empty array.
        *   **Expected:** `200 OK`, response body is an empty array.
    *   **Scenario 3:** `shopifyService.getAllMenuItems` throws an error.
        *   **Expected:** `500 Internal Server Error` (or specific error from controller), error message in body.
*   `GET /api/menu/:category`
    *   **Scenario 1:** Valid category, `shopifyService.getMenuItemsByCategory` returns products.
        *   **Expected:** `200 OK`, response body is array of products for that category.
    *   **Scenario 2:** Valid category, no products found.
        *   **Expected:** `404 Not Found`, message indicating no items for category.
    *   **Scenario 3:** `shopifyService.getMenuItemsByCategory` throws an error.
        *   **Expected:** `500 Internal Server Error`.

### 4.2. Cart API (`/api/cart`)

*   `POST /api/cart` (Create Cart)
    *   **Scenario 1:** Valid request body (empty or with line items).
        *   **Mock:** `shopifyService.createCart` to resolve with a mock checkout object.
        *   **Expected:** `201 Created`, response body is the mock checkout object.
    *   **Scenario 2:** Invalid request body (e.g., `line_items` not an array).
        *   **Expected:** `400 Bad Request` with validation errors.
    *   **Scenario 3:** `shopifyService.createCart` throws an error.
        *   **Expected:** `500 Internal Server Error`.
*   `GET /api/cart?checkoutId=:checkoutId` (Get Cart)
    *   **Scenario 1:** Valid `checkoutId` present, `shopifyService.getCart` returns cart.
        *   **Expected:** `200 OK`, response body is the cart object.
    *   **Scenario 2:** Missing `checkoutId` query parameter.
        *   **Expected:** `400 Bad Request` due to validation.
    *   **Scenario 3:** `checkoutId` not found by `shopifyService.getCart`.
        *   **Mock:** `shopifyService.getCart` to simulate not found (e.g., throw a specific error or return null, controller handles this).
        *   **Expected:** `404 Not Found`.
*   `POST /api/cart/items` (Add Items)
    *   **Scenario 1:** Valid `checkoutId` and `line_items` in body.
        *   **Mock:** `shopifyService.addItemToCart` to resolve.
        *   **Expected:** `200 OK`, response body is updated cart.
    *   **Scenario 2:** Missing `checkoutId` or invalid `line_items`.
        *   **Expected:** `400 Bad Request` with validation errors.
*   `PUT /api/cart/:checkoutId/items/:lineItemId` (Update Item)
    *   **Scenario 1:** Valid path params and body (`quantity`).
        *   **Mock:** `shopifyService.updateCartItem` to resolve.
        *   **Expected:** `200 OK`, response body is updated cart.
    *   **Scenario 2:** Invalid path params or body.
        *   **Expected:** `400 Bad Request` with validation errors.
*   `DELETE /api/cart/:checkoutId/items/:lineItemId` (Remove Item)
    *   **Scenario 1:** Valid path params.
        *   **Mock:** `shopifyService.removeCartItem` to resolve.
        *   **Expected:** `200 OK`, response body is updated cart.
    *   **Scenario 2:** Invalid path params.
        *   **Expected:** `400 Bad Request` with validation errors.

### 4.3. Webhook API (`/api/webhooks/shopify/orders`)

*   `POST /api/webhooks/shopify/orders`
    *   **Scenario 1:** Valid Shopify webhook with valid signature, containing Printful items.
        *   **Mock:** `req.rawBody` and `X-Shopify-Hmac-Sha256` header. Mock `printfulService.createPrintfulOrder` to resolve.
        *   **Expected:** `200 OK`. `printfulService.createPrintfulOrder` called.
    *   **Scenario 2:** Valid Shopify webhook, no Printful items.
        *   **Expected:** `200 OK`. `printfulService.createPrintfulOrder` NOT called.
    *   **Scenario 3:** Invalid HMAC signature.
        *   **Expected:** `403 Forbidden`.
    *   **Scenario 4:** Missing HMAC signature.
        *   **Expected:** `401 Unauthorized`.
    *   **Scenario 5:** Payload parsing error after verification (if `verifyShopifyWebhook` fails to parse).
        *   **Expected:** `400 Bad Request`.
    *   **Scenario 6:** `printfulService.createPrintfulOrder` throws an error.
        *   **Expected:** `200 OK` (to acknowledge webhook), but internal error logged.

## 5. Running Tests

*   Tests can be run using npm scripts defined in `package.json`:
    ```json
    "scripts": {
      "test": "jest",
      "test:watch": "jest --watchAll",
      "test:coverage": "jest --coverage"
    }
    ```

This strategy provides a good foundation for ensuring the backend system's reliability and correctness.
---
