# Kynda Coffee E-Commerce - Backend System

This backend system, built with Node.js and Express.js, serves as the integration layer and custom logic provider for the Kynda Coffee e-commerce platform. It primarily interacts with Shopify for core e-commerce functionality and Printful for drop-shipping merchandise.

## Core Functionalities

*   **Shopify Integration:**
    *   Fetches product data (menu items, merchandise) from Shopify.
    *   Manages cart state via Shopify's Checkout resources (creation, adding/updating/removing items).
    *   Receives and processes Shopify webhooks, initially for order creation.
*   **Printful Integration (Drop-Shipping):**
    *   Receives Shopify order creation webhooks.
    *   Identifies items designated for Printful fulfillment (based on Shopify product vendor and SKU).
    *   Formats order data and forwards it to the Printful API for order creation and fulfillment. This includes handling custom designs specified as line item properties.
*   **API Endpoints:**
    *   `/api/menu`: Serves menu items (products) from Shopify.
    *   `/api/cart`: Manages shopping cart operations via Shopify checkouts.
    *   `/api/webhooks/shopify/orders`: Handles incoming order creation webhooks from Shopify for Printful and potential POS integration.

## Project Structure

```
/coffee-shop-backend
|-- /docs
|   |-- authentication_strategy.md  <-- User authentication approach
|   |-- database_usage.md           <-- PostgreSQL usage definition
|   |-- pos_abstraction_layer.md    <-- POS integration design
|   |-- printful_integration_strategy.md <-- Printful setup/flow
|-- /src
|   |-- /controllers               <-- Request handlers (Express controllers)
|   |-- /routes                    <-- Express route definitions
|   |-- /services                  <-- Business logic, external API interactions (Shopify, Printful)
|   |-- /pos                       <-- POS abstraction layer interfaces (conceptual)
|   |-- /utils                     <-- Utility modules (e.g., logger)
|   |-- /logs                      <-- Log files (gitignored)
|   |-- server.js                  <-- Main Express application setup
|-- .env                           <-- Environment variables (gitignored)
|-- .gitignore
|-- package.json
|-- package-lock.json
|-- README.md                      <-- This file
|-- SECURITY.md                    <-- Security practices and recommendations
```

## Key Technologies

*   **Node.js:** JavaScript runtime environment.
*   **Express.js:** Web application framework for Node.js.
*   **Shopify API (`shopify-api-node`):** For interacting with the Shopify store.
*   **Printful API (via `axios`):** For drop-shipping order fulfillment.
*   **Dotenv:** For managing environment variables.
*   **Winston:** For application logging.
*   **Morgan:** HTTP request logger middleware.
*   **Helmet:** For setting various HTTP security headers.
*   **Express-validator:** For input validation.

## Setup and Running

1.  **Prerequisites:**
    *   Node.js (preferably LTS version, e.g., v18.x or later)
    *   npm (comes with Node.js)
    *   Access to a Shopify store and its API credentials.
    *   A Printful account and API key.

2.  **Installation:**
    ```bash
    cd coffee-shop-backend
    npm install
    ```

3.  **Environment Configuration:**
    *   Create a `.env` file in the `coffee-shop-backend` root directory.
    *   Copy the contents of `.env.example` (if provided, otherwise create from scratch) into `.env`.
    *   Fill in the required environment variables:
        ```
        SHOPIFY_SHOP_NAME="your-shop-name"
        SHOPIFY_API_KEY="your-shopify-admin-api-access-token" # Usually starts with 'shpat_'
        SHOPIFY_API_PASSWORD="your-shopify-admin-api-password-or-app-secret" # If using a custom app, this is the API secret key
        SHOPIFY_API_VERSION="2024-01" # Or your desired API version
        
        LOG_LEVEL="info" # (e.g., error, warn, info, http, verbose, debug, silly)
        PORT=3000
        
        # Shopify Webhook Secret (generate a random string, use in Shopify webhook config)
        SHOPIFY_WEBHOOK_SECRET="your-shopify-webhook-shared-secret"
        
        # Printful API Key (generate from your Printful dashboard)
        PRINTFUL_API_KEY="your-printful-api-key"

        # Optional: POS System Configuration (example for a hypothetical Toast setup)
        # ACTIVE_POS_SYSTEM="toast" 
        # TOAST_API_KEY="your_toast_api_key"
        # TOAST_API_ENDPOINT="https://api.toasttab.com"
        # TOAST_RESTAURANT_GUID="your_restaurant_guid"
        ```

4.  **Running the Application:**
    *   **Development Mode (with Nodemon for auto-restarts):**
        ```bash
        npm run dev
        ```
    *   **Production Mode:**
        ```bash
        npm start
        ```
    The server will typically start on `http://localhost:3000`.

## API Endpoints

Refer to the route definitions in `src/routes/` for details on available endpoints. Key groups include:
*   `/api/menu/*`
*   `/api/cart/*`
*   `/api/webhooks/shopify/*`

## Security

Security practices are crucial. This application implements several measures such as using `helmet` for security headers, validating Shopify webhooks, managing secrets via environment variables, and includes an initial setup for input validation. For a comprehensive overview of security measures and recommendations, please refer to [SECURITY.md](./SECURITY.md).

## User Authentication

Customer authentication is primarily handled by Shopify's native customer accounts system. For details on this strategy, see [docs/authentication_strategy.md](./docs/authentication_strategy.md).

## Database Usage (PostgreSQL)

The current architecture relies heavily on Shopify and Printful as the primary data stores. The direct use of PostgreSQL by this custom backend is minimal. For more details, refer to [docs/database_usage.md](./docs/database_usage.md).

## POS Abstraction Layer

A design for a POS Abstraction Layer has been conceptualized to allow integration with various Point of Sale systems for in-store order management. Details can be found in [docs/pos_abstraction_layer.md](./docs/pos_abstraction_layer.md).

## Printful Drop-Shipping Integration

The system is designed to forward relevant orders to Printful for merchandise drop-shipping. The strategy and Shopify product setup guidance are documented in [docs/printful_integration_strategy.md](./docs/printful_integration_strategy.md).
---
