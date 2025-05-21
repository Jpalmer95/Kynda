# End-to-End (E2E) and User Acceptance Testing (UAT) Plan

This document outlines the End-to-End (E2E) testing strategy and the User Acceptance Testing (UAT) plan for the Kynda Coffee e-commerce website.

## 1. End-to-End (E2E) Testing Strategy

E2E tests simulate real user scenarios by testing the application flow from the frontend through the backend and interactions with integrated services (like Shopify and Printful, up to a certain point).

### 1.1. Recommended E2E Testing Tools

*   **[Cypress](https://www.cypress.io/)** or **[Playwright](https://playwright.dev/)**
    *   **Reasoning:** Both are modern, powerful E2E testing frameworks that offer:
        *   Reliable test execution directly in the browser.
        *   Automatic waiting for elements and commands, reducing flakiness.
        *   Rich debugging capabilities (time-travel, screenshots, videos).
        *   Support for JavaScript/TypeScript.
        *   Good community support and documentation.
    *   **Choice:** The specific choice between Cypress and Playwright can depend on team preference or specific needs (e.g., Playwright has broader multi-browser support out-of-the-box, while Cypress has a very interactive test runner). For this plan, either would be suitable. We will proceed with **Cypress** as an example due to its popularity and ease of getting started for many teams.

### 1.2. Key E2E User Flows to Automate

The following critical user flows should be prioritized for E2E test automation:

1.  **Ordering a Restaurant Menu Item for Pickup:**
    *   **Steps:**
        1.  Navigate to the Menu page (`/menu`).
        2.  Browse different menu categories.
        3.  Select a menu item (e.g., a specific coffee or pastry).
        4.  If applicable, select variants/customizations (e.g., size, milk type).
        5.  Add the item to the cart.
        6.  Verify the cart updates correctly (item, quantity, price).
        7.  Navigate to the Cart page (`/cart`).
        8.  Review cart contents.
        9.  Click "Proceed to Checkout."
    *   **Expected Outcome:** User is successfully redirected to the Shopify checkout page with the correct items and quantities in the Shopify cart summary.

2.  **Ordering a Standard Merchandise Item for Shipping:**
    *   **Steps:**
        1.  Navigate to the Shop page (`/shop`).
        2.  Browse merchandise categories (e.g., "Apparel," "Drinkware").
        3.  Filter or sort products (if UI elements exist for this).
        4.  Click on a product to go to its Product Detail Page (`/products/:productId`).
        5.  Select variants if available (e.g., size, color).
        6.  Add the item to the cart.
        7.  Verify the cart updates.
        8.  Navigate to the Cart page.
        9.  Review cart contents.
        10. Click "Proceed to Checkout."
    *   **Expected Outcome:** User is successfully redirected to the Shopify checkout page with the correct merchandise items in the cart.

3.  **Ordering a Customizable Drop-Shipped Product:**
    *   **Steps:**
        1.  Navigate to a customizable product's detail page (identified by the `customizable-printful` tag).
        2.  Verify that design selection options are visible.
        3.  Select a pre-made design from the available options.
        4.  Verify the product preview updates to show the selected design.
        5.  Select product variants (e.g., size, color) if applicable.
        6.  Add the item to the cart.
        7.  Verify the cart updates, ensuring the customized item (and potentially some identifier of the chosen design, even if not directly visible to the user in the cart summary) is added.
        8.  Navigate to the Cart page.
        9.  Review cart contents.
        10. Click "Proceed to Checkout."
    *   **Expected Outcome:** User is successfully redirected to the Shopify checkout page. The line item in Shopify should have custom attributes (`_customArtUrl`, `_customArtName`) associated with it, which will be verified by backend/UAT processes.

4.  **Basic Page Navigation and Content Display:**
    *   **Steps:**
        1.  Navigate to the Homepage (`/`). Verify key elements like featured items (if any), welcome text, and navigation links are present.
        2.  Navigate to the "About Us" page (if a static page exists). Verify content loads.
        3.  Navigate to the "Contact Us" page (if a static page exists). Verify content loads.
        4.  Navigate to the Menu page (`/menu`). Verify categories and items load.
        5.  Navigate to the Shop page (`/shop`). Verify product categories/grid loads.
    *   **Expected Outcome:** Pages load without errors, and essential static content or product listings are visible.

5.  **QR Code Menu Access (Simulated):**
    *   **Steps:**
        1.  Navigate directly to the Menu page with a QR code parameter (e.g., `/menu?table=5` or `/menu?location=main_street`).
        2.  Verify the Menu page loads correctly.
        3.  (Optional) If any UI element is supposed to change based on the QR parameter (e.g., displaying "Ordering for Table 5"), verify this.
    *   **Expected Outcome:** Menu page loads and functions as expected when accessed with URL parameters typically used by QR codes.

### 1.3. Handling External Dependencies (Shopify Checkout)

*   **Scope of E2E Tests:** E2E tests for the custom application will cover the user journey **up to the point of handoff** to the Shopify checkout.
*   **Verification Point:** The tests will assert that the user is correctly redirected to `checkout.shopify.com` (or the store's custom checkout domain if applicable) and that the cart contents *before* redirection (as managed by our frontend/backend) are accurate.
*   **No Testing of Shopify's Checkout UI:** Automating Shopify's checkout process itself is generally not recommended or feasible for third-party applications due to:
    *   The complexity and variability of Shopify's checkout DOM.
    *   Security measures like CAPTCHAs.
    *   The risk of creating real orders or incurring payment gateway test fees.
*   Shopify's checkout reliability is assumed to be Shopify's responsibility.

### 1.4. Test Data Management

*   **Prerequisites:** E2E tests rely on specific products, variants, tags, and potentially customer data existing in the connected Shopify development/staging store.
*   **Setup Scripts/Fixtures:**
    *   Develop scripts (e.g., using Shopify API directly or a tool like [Shopify CLI](https://shopify.dev/docs/themes/tools/cli)) to set up required products (menu items, merchandise, customizable items with correct tags like `customizable-printful` and `featured-item`, and SKUs like `PFUL-{PrintfulVariantID}`).
    *   These scripts should be run before E2E test suites to ensure the store is in a known state.
*   **Test Accounts:**
    *   Use dedicated test customer accounts in Shopify if user-specific flows are tested (though current E2E flows focus on guest checkout up to Shopify handoff).
*   **Data Isolation:** If tests modify data (e.g., by creating carts that then become abandoned checkouts in Shopify), this should be done in a dedicated Shopify development store, not a production or shared staging store used by other teams.
*   **Cleanup:** Consider cleanup scripts or strategies for test-generated data if it accumulates significantly (e.g., periodically clearing abandoned checkouts in the dev store).

## 2. User Acceptance Testing (UAT) Plan

UAT is the final phase of testing before going live, where the intended users (Kynda Coffee stakeholders) validate that the application meets their requirements and is fit for purpose.

### 2.1. Objectives of UAT

*   **Validate Requirements:** Confirm that all specified business requirements and user stories have been met by the developed system.
*   **Confirm Usability:** Ensure the website is intuitive, user-friendly, and easy to navigate for the target audience.
*   **Verify Real-World Scenarios:** Test the system using realistic data and scenarios that reflect actual day-to-day operations.
*   **Build Confidence:** Provide stakeholders with confidence that the system is ready for production launch.
*   **Identify Issues:** Catch any bugs, design flaws, or usability issues missed during earlier testing phases.

### 2.2. Key User Roles for UAT

*   **Regular Customer (Simulated or Actual Testers):**
    *   Represents the typical online shopper.
    *   Focuses on browsing, ordering, customization, and overall site experience.
*   **Kynda Coffee Admin/Staff (e.g., Store Manager, Marketing Personnel):**
    *   Focuses on how online orders translate into Shopify admin.
    *   Verifies integration with Printful (e.g., orders appearing in Printful dashboard).
    *   Checks product setup in Shopify for new features (customizable, featured).
    *   Manages content if a Headless CMS were integrated (future).

### 2.3. UAT Scenarios / Test Cases

These are high-level scenarios. Detailed test steps would be provided to UAT testers.

**Frontend User Experience (Regular Customer Role):**

1.  **Homepage & Navigation:**
    *   Access the homepage. Verify featured items are displayed correctly.
    *   Navigate to Menu, Shop, Cart, About Us, Contact Us pages. Verify pages load with correct content.
2.  **Menu Ordering (Pickup):**
    *   Browse menu categories.
    *   Select a coffee (e.g., Latte), choose size (e.g., Large), add to cart.
    *   Select a pastry (e.g., Croissant), add to cart.
    *   View cart, verify items and prices.
    *   Proceed to Shopify checkout (confirm handoff).
3.  **Merchandise Ordering (Shipping):**
    *   Browse the "Shop" section (e.g., Apparel).
    *   Filter/sort items (if functionality exists and is testable).
    *   Select a T-shirt, choose size and color, add to cart.
    *   Select a bag of coffee beans, choose grind type, add to cart.
    *   View cart, verify items and prices.
    *   Proceed to Shopify checkout (confirm handoff).
4.  **Customizable Product Ordering (Drop-Shipping):**
    *   Navigate to a product designated as "customizable" (e.g., a specific mug or t-shirt).
    *   Select a pre-made design from the available options.
    *   Verify the product preview updates with the selected design.
    *   Choose product variants (e.g., color, size).
    *   Add to cart.
    *   View cart, verify the item is present (visual confirmation of customization might be limited in the cart summary itself, but will be checked in Shopify order details).
    *   Proceed to Shopify checkout (confirm handoff).
5.  **QR Code Menu Access:**
    *   Use a provided test QR code (or a URL simulating one, e.g., `your-staging-site.com/menu?table=10`).
    *   Verify the menu page loads correctly.
    *   Place an order starting from this QR-accessed menu.
6.  **Static Page Content Review:**
    *   Review content on pages like "About Us," "Contact Us" for accuracy and clarity.
7.  **Mobile Responsiveness:**
    *   Perform key user flows (menu browsing, ordering, shop browsing) on various mobile device emulators or actual devices. Verify layout and usability.

**Backend & Integration Verification (Kynda Coffee Admin/Staff Role):**

8.  **Shopify Order Verification:**
    *   After a test order is placed and taken to Shopify checkout (and potentially completed in a Shopify test environment if set up with a test payment gateway):
        *   Log in to Shopify Admin.
        *   Verify the order details are accurate (customer info, items, quantities, prices).
        *   For customizable items, check if line item properties (`_customArtUrl`, `_customArtName`) are correctly saved with the order.
        *   Verify that items designated for Printful fulfillment have the vendor "Printful_DS".
9.  **Printful Order Verification (for Drop-Shipped Items):**
    *   After a Shopify order containing "Printful_DS" items is processed by the backend webhook:
        *   Log in to the Printful dashboard (ideally a sandbox/test account linked to the backend).
        *   Verify that a corresponding order has been created in Printful.
        *   Check that the Printful order contains the correct products, variants, quantities, recipient details, and critically, the correct design files (linked from `_customArtUrl`).
        *   (Note: Since the backend's Printful API call is currently mocked to create orders as drafts, this step would involve checking the logs for the mocked successful submission, and in a real scenario, checking Printful drafts.)
10. **Product Setup Verification (Shopify Admin):**
    *   Verify that products tagged `customizable-printful` show customization options on the frontend.
    *   Verify that products tagged `featured-item` appear in the "Featured Items" section on the homepage.
    *   Verify that Printful-fulfilled items are correctly configured with the `Printful_DS` vendor and appropriate SKUs (`PFUL-{PrintfulVariantID}`).

### 2.4. UAT Feedback Process

1.  **UAT Environment:** Provide testers with access to a stable staging environment that mirrors production as closely as possible, connected to a Shopify development store and a Printful test/sandbox account.
2.  **Test Cases/Checklist:** Provide UAT testers with a list of scenarios to execute (derived from section 2.3).
3.  **Feedback Collection:**
    *   Use a designated tool or method for collecting feedback (e.g., a shared spreadsheet, a dedicated Slack channel, a simple bug tracking tool like Trello or Jira, or even a Google Form).
    *   Testers should record:
        *   Test case/scenario ID.
        *   Steps taken.
        *   Expected result.
        *   Actual result.
        *   Severity (e.g., critical, high, medium, low).
        *   Screenshots or video recordings for bugs.
        *   Browser/device information if relevant.
4.  **Triage Meetings:**
    *   Regularly (e.g., daily or every other day during the UAT period) hold triage meetings with stakeholders (product owner, developers, QA if available) to review reported issues.
    *   Categorize issues (bug, change request, misunderstanding, etc.).
    *   Prioritize bugs for fixing.
    *   Assign issues to developers.
5.  **Resolution and Re-testing:**
    *   Developers fix prioritized bugs in the UAT environment.
    *   Testers re-test fixed issues.
6.  **Sign-off:** Once all critical and high-priority issues are resolved and stakeholders are satisfied, UAT sign-off is obtained.

This E2E and UAT plan provides a structured approach to ensure the Kynda Coffee website is well-tested from both technical and user perspectives before launch.
---
