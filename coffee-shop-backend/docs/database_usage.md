# Database Usage (PostgreSQL)

This document outlines the intended use of PostgreSQL within the Kynda Coffee E-commerce backend architecture.

## 1. Overview

Given the current architecture's strong reliance on:
*   **Shopify** for core e-commerce data (products, customer accounts, orders, online payments, cart/checkout state).
*   **Printful** for drop-shipping product templates and order fulfillment.
*   **Stateless nature** of many backend API endpoints (acting as a passthrough or service integration layer).

The direct need for a persistent relational database like PostgreSQL by the custom backend itself is **minimal**.

## 2. Current and Potential Use Cases

As of the current design phase, there are **no immediate, critical functions that require PostgreSQL integration for core application logic.** The primary data sources and "single source of truth" for e-commerce operations reside within Shopify and Printful.

However, PostgreSQL *could* be considered for the following auxiliary or future functions:

1.  **Application-Level Logging/Audit Trails (Optional Enhancement):**
    *   While basic logging is handled by Winston (to console and files), a more robust solution for production might involve storing structured logs (especially for critical errors, security events, or detailed audit trails of integrations like POS forwarding or Printful order submissions) in a database. PostgreSQL could serve this purpose.
    *   **Status:** Not implemented. Current logging is file/console-based.

2.  **Session Management for Backend Admin UI (Future Scope):**
    *   If a dedicated backend administrative interface/dashboard is developed (separate from Shopify admin), and it requires user sessions, PostgreSQL could be used as a session store for Express.js sessions (e.g., via `connect-pg-simple`).
    *   **Status:** Not in current scope. Admin interactions are primarily via Shopify and Printful dashboards.

3.  **Storing Non-Shopify/Non-Printful Specific Configuration or Data (Future Scope):**
    *   If the application evolves to include features or data that do not naturally fit within Shopify's data model (e.g., complex internal analytics, non-product related content not suitable for a headless CMS, specific integration linkage data not storable as metafields), PostgreSQL could be used.
    *   Example: Storing mappings between Shopify order IDs and Printful order IDs if this isn't adequately handled by Shopify order notes/tags, especially if complex reconciliation is needed. (Currently, the plan is to use Shopify notes for this).
    *   Example: Storing logs of POS order submission attempts and their outcomes if file-based logs are insufficient for querying/auditing.
    *   **Status:** No specific requirement identified in the current scope. Configuration is primarily via `.env` files.

4.  **Caching Layer (Future Scope - Advanced):**
    *   For very high-traffic scenarios, frequently accessed data from Shopify or Printful (e.g., product catalogs) could potentially be cached in PostgreSQL to reduce API load and improve response times for the custom backend. This would introduce complexity related to cache invalidation.
    *   **Status:** Not in current scope. Direct API calls are used.

## 3. Current Implementation Status

**No PostgreSQL database is currently implemented or integrated into the backend application.**

The backend operates primarily by:
*   Responding to API requests from the frontend.
*   Interacting with the Shopify API (via `shopify-api-node`).
*   Interacting with the Printful API (via `axios` client, conceptually).
*   Processing webhooks from Shopify.

All critical data related to products, orders, customers, and fulfillment is stored and managed by Shopify and Printful.

## 4. Recommendation

*   **Defer PostgreSQL Integration:** Given the current scope and reliance on Shopify/Printful, direct PostgreSQL integration is not immediately necessary and would add deployment and maintenance overhead.
*   **Re-evaluate if Needed:** The need for PostgreSQL should be re-evaluated if:
    *   Advanced audit logging or queryable logging becomes a firm requirement.
    *   A custom backend admin UI with session management is built.
    *   Specific data storage needs arise that cannot be met by Shopify's metafields/tags or environment variables.
*   **Stateless Design:** Continue to favor a stateless design for backend services where possible, relying on external platforms (Shopify, Printful) as the source of truth for their respective data domains.

By deferring direct database integration, the backend remains lightweight and focused on its core role as an integration and service layer between the frontend, Shopify, and Printful.
---
