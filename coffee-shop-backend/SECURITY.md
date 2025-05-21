# Security Policy and Practices

This document outlines the security measures implemented in the Kynda Coffee E-commerce backend and provides recommendations for maintaining a secure application.

## 1. Implemented Security Measures

### 1.1. HTTPS Enforcement
*   **External API Communication:** All communication with external services (Shopify API, Printful API) is conducted over HTTPS, ensuring data in transit is encrypted. This is handled by default by the `shopify-api-node` library and `axios` when connecting to standard API endpoints.
*   **Backend Deployment:** When deploying the backend application, it **must** be hosted behind a reverse proxy (e.g., Nginx, Caddy, or a cloud provider's load balancer) that terminates SSL/TLS and enforces HTTPS for all client-server communication. The Node.js/Express.js application itself does not handle SSL termination.

### 1.2. Secret Management
*   All sensitive information, including API keys (Shopify, Printful), webhook secrets (Shopify), and any other credentials, are managed strictly through environment variables (`.env` file for local development, platform-specific environment variable management for production).
*   No secrets are hardcoded into the application source code.
*   The `.env` file is included in `.gitignore` to prevent accidental commits of sensitive data.

### 1.3. Security Headers
*   The `helmet` middleware is used in `server.js` to set various HTTP security headers. These headers help protect against common web vulnerabilities such as Cross-Site Scripting (XSS), clickjacking, and other attacks by:
    *   Setting `X-Content-Type-Options: nosniff`
    *   Setting `X-DNS-Prefetch-Control: off`
    *   Setting `X-Download-Options: noopen`
    *   Setting `X-Frame-Options: SAMEORIGIN`
    *   Setting `X-XSS-Protection: 0` (as modern browsers have their own XSS protection, and this header can sometimes create vulnerabilities)
    *   Setting `Strict-Transport-Security` (HSTS) - Note: HSTS requires careful deployment and understanding that once enabled, browsers will refuse to connect via HTTP for the specified duration.
    *   Removing the `X-Powered-By` header.
    *   Setting appropriate `Content-Security-Policy` (CSP), `Cross-Origin-Embedder-Policy` (COEP), `Cross-Origin-Opener-Policy` (COOP), and `Cross-Origin-Resource-Policy` (CORP) headers (Helmet provides defaults which can be customized).

### 1.4. Input Validation
*   The `express-validator` library has been introduced to validate and sanitize incoming data for API endpoints.
*   **Example Implementation:** The cart routes (`src/routes/cartRoutes.js`) demonstrate validation for path parameters and request body fields (e.g., checking for required fields, data types, ranges).
*   **Scope:** While implemented for cart routes, this practice should be extended to all routes that accept user/client input to prevent common vulnerabilities like injection attacks, unexpected data types, or missing required fields.
*   A centralized `handleValidationErrors` middleware is used in route definitions to check for validation errors and return a 400 response if any are found.

### 1.5. Error Handling
*   The global error handler in `server.js` is configured to prevent leaking sensitive information, such as stack traces, in production environments.
*   Specific error details from external APIs (like Shopify or Printful) are logged internally for debugging but are not exposed directly to the client in production. Clients receive a generic error message.

### 1.6. Webhook Verification
*   Shopify webhooks are verified using HMAC SHA256 signatures. The `verifyShopifyWebhook` middleware in `src/controllers/shopifyWebhookController.js` compares the signature provided by Shopify in the `X-Shopify-Hmac-Sha256` header against a hash generated using the shared secret (`SHOPIFY_WEBHOOK_SECRET`).
*   Raw request bodies are used for this verification, as required by Shopify.

### 1.7. Dependency Management
*   Dependencies are managed via `package.json` and `package-lock.json`.
*   Regularly update dependencies and audit for known vulnerabilities using `npm audit`. While some vulnerabilities were noted during `create-react-app` setup (frontend), backend dependencies are currently clean. This process should be part of ongoing maintenance.

## 2. User Authentication
*   User authentication for customers is primarily handled by **Shopify's customer accounts system**. The custom backend does not manage user credentials or sessions for e-commerce customers.
*   Refer to `docs/authentication_strategy.md` for more details.

## 3. Database Security
*   Currently, the backend does not directly use a PostgreSQL database for core operations, minimizing database-related security concerns for the custom backend itself.
*   If a database were to be introduced (e.g., for enhanced logging, admin sessions), standard security practices would apply:
    *   Strong, unique credentials for database access, managed via environment variables.
    *   Network restrictions (e.g., firewall rules, private networks) to limit database accessibility.
    *   Regular backups.
    *   Use of parameterized queries or ORMs to prevent SQL injection if raw SQL is ever used (though an ORM like Sequelize or TypeORM would be preferred).
    *   Encryption at rest and in transit for sensitive data.
*   Refer to `docs/database_usage.md` for the current stance on database usage.

## 4. Further Security Recommendations

### 4.1. Rate Limiting
*   Implement rate limiting on API endpoints to protect against brute-force attacks and denial-of-service (DoS). Libraries like `express-rate-limit` can be used.
    ```javascript
    // Example for server.js
    // const rateLimit = require('express-rate-limit');
    // const limiter = rateLimit({
    //   windowMs: 15 * 60 * 1000, // 15 minutes
    //   max: 100, // limit each IP to 100 requests per windowMs
    //   standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    //   legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    // });
    // app.use('/api/', limiter); // Apply to all API routes or specific ones
    ```

### 4.2. Comprehensive Input Validation
*   Extend the use of `express-validator` to cover **all** input fields on **all** API endpoints. This includes query parameters, path parameters, and request bodies.
*   Define strict validation rules (e.g., expected data types, lengths, formats, allowed values).

### 4.3. Logging and Monitoring
*   Ensure comprehensive logging of security-relevant events (e.g., failed login attempts if an admin panel is added, webhook verification failures, significant errors).
*   Integrate with a centralized logging and monitoring solution (e.g., ELK stack, Datadog, Sentry) for production environments to enable proactive threat detection and incident response.

### 4.4. Secure Deployment Practices
*   Run the Node.js application with the least privileges necessary.
*   Keep the underlying server and Node.js runtime patched and up-to-date.
*   Use a process manager (like PM2) to ensure the application restarts if it crashes.
*   Implement regular security audits and penetration testing.

### 4.5. CORS Configuration
*   While currently `app.use(cors())` allows all origins, for production, configure CORS more restrictively to only allow requests from known frontend domains.
    ```javascript
    // Example for server.js
    // const corsOptions = {
    //   origin: 'https://your-frontend-domain.com', // Replace with your actual frontend domain
    //   optionsSuccessStatus: 200 
    // };
    // app.use(cors(corsOptions));
    ```

### 4.6. Printful API Key Security
*   Ensure the Printful API key (`PRINTFUL_API_KEY`) has the minimum necessary permissions (scopes) required for its operations (primarily order creation and potentially product/catalog access if needed in the future). Review Printful's API key settings.

By implementing these measures and following these recommendations, the Kynda Coffee backend can maintain a strong security posture.
---
