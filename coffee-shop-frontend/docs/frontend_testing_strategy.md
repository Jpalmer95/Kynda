# Frontend Testing Strategy (React)

This document outlines the strategy for unit and integration testing of the Kynda Coffee frontend React application.

## 1. Recommended Testing Frameworks and Tools

*   **Primary Testing Framework: [Jest](https://jestjs.io/)**
    *   **Reasoning:** Jest is typically included with `create-react-app` (though CRA is now deprecated, Jest remains a standard for React). It provides a test runner, assertion library, and built-in mocking capabilities.
*   **Component Testing: [React Testing Library (RTL)](https://testing-library.com/docs/react-testing-library/intro/)**
    *   **Reasoning:** RTL encourages writing tests that resemble how users interact with the application. It focuses on testing component behavior from a user's perspective rather than implementation details, leading to more resilient tests. It works seamlessly with Jest.
*   **User Event Simulation: [`@testing-library/user-event`](https://testing-library.com/docs/user-event/intro)**
    *   **Reasoning:** A companion library for RTL that provides more realistic simulation of user interactions (typing, clicking, hovering) than firing raw DOM events.
*   **API Mocking (for Integration/Component Tests):**
    *   **[Mock Service Worker (MSW)](https://mswjs.io/):**
        *   **Reasoning:** MSW intercepts actual network requests using a service worker, allowing you to provide mocked API responses without changing your application code. This is excellent for integration tests where components make real API calls.
    *   **Jest's Built-in Mocking (`jest.mock`, `jest.fn`):**
        *   **Reasoning:** Useful for mocking `axios` or specific functions within `apiService.js` for unit tests of components or services that consume them, especially when you want to avoid actual network interception.
*   **State Management Testing (Zustand):**
    *   Testing Zustand stores is generally straightforward. Actions can be called directly, and state changes can be asserted. RTL can be used to test components that consume the store.
*   **Assertions:**
    *   **Jest's Expect API (`expect`) with `@testing-library/jest-dom` matchers:** `@testing-library/jest-dom` provides custom Jest matchers for asserting on DOM elements (e.g., `toBeInTheDocument()`, `toHaveTextContent()`, `toBeVisible()`).

## 2. Test Structure and Organization

Tests will be organized to be easily discoverable and maintainable, following common React project conventions.

*   **Unit Tests for Components, Hooks, Utils:**
    *   Files will be co-located with the source files they are testing, within a `__tests__` subdirectory or using a `*.test.js` or `*.spec.js` suffix.
    *   Example:
        ```
        /src
        |-- /components
        |   |-- /menu
        |       |-- MenuItem.js
        |       |-- __tests__
        |           |-- MenuItem.test.js
        |-- /pages
        |   |-- ProductDetailPage.js
        |   |-- __tests__
        |       |-- ProductDetailPage.test.js
        |-- /store
        |   |-- cartStore.js
        |   |-- __tests__
        |       |-- cartStore.test.js
        |-- /services
        |   |-- apiService.js
        |   |-- __tests__
        |       |-- apiService.test.js
        ```
*   **Integration Tests (User Flows / Multiple Components):**
    *   A dedicated directory for integration tests: `src/__tests__/integration/` or `src/integration-tests/`.
    *   Test files should be named descriptively based on the user flow or feature they target.
    *   Example:
        ```
        /src
        |-- /__tests__  (or /src/integration-tests)
            |-- /integration
                |-- addToCart.integration.test.js
                |-- productFiltering.integration.test.js
                |-- navigation.integration.test.js
        ```
*   **Mock Data & Setup:**
    *   A `src/mocks` or `src/__tests__/mocks` directory can store shared mock data, MSW handlers, or Jest manual mocks.
    *   Example: `src/mocks/handlers.js` for MSW request handlers.
    *   Test setup files (e.g., `src/setupTests.js` automatically run by Jest) can import `@testing-library/jest-dom`.

*   **Naming Conventions:**
    *   Test files: `ComponentName.test.js`, `hookName.test.js`, `feature.integration.test.js`.
    *   Test descriptions: Use clear, BDD-style language (e.g., `describe('MenuItem component', () => { ... });`, `it('should display product title and price', () => { ... });`, `it('should call onAddToCart with correct parameters when button is clicked', () => { ... });`).

## 3. Unit Test Cases

### 3.1. Components

Focus on rendering, user interactions, and conditional logic. API calls within components will typically be mocked at the `apiService.js` level or via MSW for tests involving data display.

*   **`src/components/menu/MenuItem.js` & `src/components/products/ProductCard.js`**
    *   **Scenario 1:** Renders correctly with basic product data (title, price, image).
        *   **Expected:** Title, price, and image are displayed.
    *   **Scenario 2:** (MenuItem) Renders variant options if `product.variants` has multiple entries.
        *   **Expected:** Select dropdown is visible with correct options.
    *   **Scenario 3:** (MenuItem) Handles variant selection change.
        *   **Expected:** Internal state for `selectedVariantId` updates; displayed price might change.
    *   **Scenario 4:** (MenuItem) Handles quantity input change.
        *   **Expected:** Internal state for `quantity` updates.
    *   **Scenario 5:** (MenuItem) "Add to Cart" button click.
        *   Mock `onAddToCart` prop.
        *   Simulate variant/quantity selection and click.
        *   **Expected:** `onAddToCart` is called with the correct item, variant ID, and quantity.
    *   **Scenario 6:** (ProductCard) Renders a link to the product detail page.
        *   **Expected:** `<Link>` component points to `/products/:productId`.
    *   **Scenario 7:** (ProductCard) "View Details" button navigates correctly (tested via link presence).

*   **`src/pages/ProductDetailPage.js`**
    *   **Scenario 1:** Renders product details (title, description, price, images) when data is successfully fetched.
        *   Mock `fetchProductById` to return sample product data.
        *   **Expected:** Product information is displayed. Image gallery shows first image.
    *   **Scenario 2:** Handles loading state while fetching product.
        *   **Expected:** Loading indicator is shown.
    *   **Scenario 3:** Handles error state if fetching fails.
        *   Mock `fetchProductById` to reject.
        *   **Expected:** Error message is displayed.
    *   **Scenario 4:** Variant selection updates displayed price and internal state.
        *   Simulate selecting a different variant.
        *   **Expected:** Price updates; `selectedVariantId` state changes.
    *   **Scenario 5:** Quantity input updates internal state.
    *   **Scenario 6 (Customization UI):**
        *   If product is customizable (mock product data with `customizable-printful` tag):
            *   **Expected:** Design selection UI is visible. Pre-made designs are listed.
            *   Simulate selecting a design.
            *   **Expected:** `selectedDesign` state updates. Preview overlay image source changes.
            *   "Add to Cart" button passes `properties: { _customArtUrl, _customArtName }` to `addItemToCart` action.
        *   If product is NOT customizable:
            *   **Expected:** Design selection UI is NOT visible.
    *   **Scenario 7:** "Add to Cart" button click.
        *   Mock `useCartStore`'s `addItem` action.
        *   **Expected:** `addItem` is called with the correct line item (variant ID, quantity, and customization properties if applicable).
    *   **Scenario 8:** Image gallery navigation (next/prev image clicks).
        *   **Expected:** `currentImageIndex` updates, displayed image changes.

*   **`src/pages/CartPage.js` & `src/components/cart/CartItem.js`**
    *   **Scenario 1 (CartPage):** Displays "Your cart is currently empty" when cart is empty.
        *   Mock `useCartStore` to return an empty/null cart.
        *   **Expected:** Empty cart message shown.
    *   **Scenario 2 (CartPage):** Renders a list of `CartItem` components when cart has items.
        *   Mock `useCartStore` with sample cart data (including line items with `customAttributes` for customized items).
        *   **Expected:** Correct number of `CartItem`s rendered. Order summary (subtotal, total from store) is displayed.
    *   **Scenario 3 (CartItem):** Renders item details correctly (name, variant, quantity, price, image, custom art name if present in `customAttributes`).
    *   **Scenario 4 (CartItem):** Quantity change input calls `onUpdateQuantity` prop.
        *   Mock `onUpdateQuantity`. Simulate input change.
        *   **Expected:** `onUpdateQuantity` called with correct line item ID and new quantity.
    *   **Scenario 5 (CartItem):** "Remove" button click calls `onRemove` prop.
        *   Mock `onRemove`. Simulate click.
        *   **Expected:** `onRemove` called with correct line item ID.
    *   **Scenario 6 (CartPage):** "Proceed to Checkout" button.
        *   Mock `useCartStore` with a cart object containing `webUrl`.
        *   Simulate click.
        *   **Expected:** `window.location.href` is set to the `webUrl` (mock `window.location.href`).
        *   If `webUrl` is missing, button might be disabled or show an alert (test this state).
    *   **Scenario 7 (CartPage):** Displays loading/error states from `cartStore`.

*   **`src/pages/MerchandisePage.js` & `src/pages/MenuPage.js`**
    *   **Scenario 1:** Fetches and displays products/menu items on load.
        *   Mock `fetchProducts` / `fetchAllMenuItems` to return sample data.
        *   **Expected:** `ProductGrid` (for MerchandisePage) or `MenuItem` list (for MenuPage) is populated.
    *   **Scenario 2 (MenuPage):** Category buttons render and filter items (client-side or by calling mocked `fetchMenuItemsByCategory`).
    *   **Scenario 3 (MerchandisePage):** Category dropdown and sort dropdown update product listing.
        *   Mock `fetchProducts` to return a diverse set of products.
        *   Simulate changing category/sort.
        *   **Expected:** `ProductGrid` updates with correctly filtered/sorted items.
    *   **Scenario 4:** Handles loading and error states during product fetching.
    *   **Scenario 5 (MenuPage):** Reads and logs `?table=X` URL parameter.
        *   Use `MemoryRouter` from `react-router-dom` to set initial entries.

*   **`src/components/home/FeaturedItems.js`**
    *   **Scenario 1:** Fetches products and filters for "featured-item" tag.
        *   Mock `fetchProducts` to return products with and without the tag.
        *   **Expected:** Only featured products are passed to `ProductGrid`.
    *   **Scenario 2:** Displays "No featured items" if none are found.
    *   **Scenario 3:** Handles loading/error states.

### 3.2. Services (`apiService.js`)

*   **Dependency to Mock:** `axios` (or `apiClient` instance).
*   For each exported function (e.g., `fetchAllMenuItems`, `createNewCart`, `addItemToCart`, `fetchProducts`):
    *   **Scenario 1:** Successful API call.
        *   Mock `apiClient.get/post/put/delete` to resolve with a mock response.
        *   **Expected:** The function returns the `response.data`. Correct endpoint and parameters are used.
    *   **Scenario 2:** API call results in an error.
        *   Mock `apiClient.get/post/put/delete` to reject with an Axios-like error object.
        *   **Expected:** The function throws the error or handles it as designed.

### 3.3. State Management (`cartStore.js` - Zustand)

*   **Testing Actions:**
    *   For each action (e.g., `initializeCart`, `addItem`, `updateItemQuantity`, `removeItem`):
        *   Mock the `apiService` functions it calls.
        *   Call the action.
        *   **Expected:**
            *   `apiService` functions are called with correct parameters.
            *   Store state (`checkoutId`, `cart`, `loading`, `error`) is updated correctly based on the mocked API response (success or failure).
            *   Test persistence: After actions that modify `checkoutId`, check if `localStorage.getItem(CART_STORAGE_KEY)` reflects the change (or use a mock for `localStorage`).
    *   `initializeCart()`:
        *   **Scenario 1:** `checkoutId` exists in `localStorage`, `getCartContents` is successful.
            *   **Expected:** Cart is populated from API.
        *   **Scenario 2:** `checkoutId` exists, `getCartContents` fails (e.g., 404).
            *   **Expected:** `checkoutId` is cleared, `createNewCart` is called.
        *   **Scenario 3:** No `checkoutId` in `localStorage`.
            *   **Expected:** `createNewCart` is called.
    *   `addItem()`:
        *   **Scenario 1:** No `checkoutId` initially.
            *   **Expected:** `initializeCart` is called first, then `apiAddItemToCart`.
*   **Testing Selectors (if any complex ones are added):**
    *   Set up initial store state.
    *   Call the selector.
    *   **Expected:** Selector returns the correctly derived/selected part of the state.
    *   (Currently, selectors are simple `state => state.cart`, etc., which are implicitly tested by action tests).

## 4. Integration Test Cases (Component Interactions / User Flows)

These tests involve rendering multiple components and simulating user flows. MSW can be very useful here to mock API responses for the entire flow.

*   **Full Add-to-Cart Flow:**
    1.  Render `MenuPage` or `ProductDetailPage`.
    2.  Mock API responses for product fetching (e.g., using MSW).
    3.  User selects variant/quantity (and design if customizable).
    4.  User clicks "Add to Cart".
    5.  Mock API responses for cart creation/update.
    6.  **Expected:**
        *   Cart indicator in `App.js` updates.
        *   Navigating to `CartPage` shows the added item with correct details and customization.
*   **Cart Update and Checkout:**
    1.  Render `CartPage` with mock cart data (including `webUrl`).
    2.  User changes quantity of an item or removes an item.
    3.  Mock API responses for cart updates.
    4.  **Expected:** Cart display updates correctly.
    5.  User clicks "Proceed to Checkout".
    6.  **Expected:** `window.location.href` is changed to the cart's `webUrl` (mock this interaction).
*   **Product Filtering and Sorting on `MerchandisePage`:**
    1.  Render `MerchandisePage`.
    2.  Mock `fetchProducts` to return a diverse set of products.
    3.  User selects a category filter.
    4.  **Expected:** Product grid updates to show only products matching the category (client-side filtering for now).
    5.  User selects a sort option.
    6.  **Expected:** Product grid re-orders according to the sort option.
*   **Navigation Flow:**
    1.  Render `App.js` (which includes `AppRouter`).
    2.  User clicks navigation links (e.g., "Menu", "Shop", "Cart", "Home" logo).
    3.  **Expected:** The correct page component (`MenuPage`, `MerchandisePage`, `CartPage`, `HomePage`) is rendered. URL updates accordingly.

## 5. Running Tests

*   Tests can be run using npm scripts provided by `create-react-app` (or its modern equivalents if migrated):
    ```json
    "scripts": {
      "test": "react-scripts test", // Or equivalent for Vite/Next.js
      "test:coverage": "react-scripts test --coverage --watchAll=false"
    }
    ```
    (Adjust script if not using CRA's `react-scripts`).

This testing strategy aims to provide comprehensive coverage, focusing on user behavior and ensuring individual units and integrated parts of the application work as expected.
---
