# Voxy V2 — Backend Gaps & Contract Recommendations

This document outlines backend capabilities identified during the frontend implementation that are missing or incomplete in `API.md` (contract reference).

---

### 1. Product Image Storage & Direct File Upload
- **Current Contract (`API.md` T5):** `POST /api/v1/businesses/:id/products` accepts an `imageUrl` string.
- **Gap:** There is no endpoint for uploading raw image files (JPEG, PNG, WebP) to cloud storage (e.g. S3 / Cloudinary / Supabase Storage). The frontend is currently constrained to accepting pre-hosted image URLs.
- **Recommendation:** Provide `POST /api/v1/uploads` or pre-signed URL generation endpoints for direct image uploading.

---

### 2. Business-Level Aggregated Conversations Endpoint
- **Current Contract (`API.md` T6):** Conversations are only queryable per customer via `GET /api/v1/customers/:id/conversations`.
- **Gap:** The business owner's Inbox needs to list all recent conversations across the entire business with pagination and filtering by status (`active`, `handed_off`, `closed`). Querying all customers first and fetching each customer's conversations individually is inefficient.
- **Recommendation:** Add `GET /api/v1/businesses/:id/conversations?status=&limit=&offset=`.

---

### 3. Order Checkout Link Generation & Customer Payment Webhook
- **Current Contract (`API.md` T7):** Orders can be created via `POST /api/v1/orders` with status transitions `draft -> confirmed -> paid`.
- **Gap:** There is no endpoint to generate a Paystack/Flutterwave checkout link for customer orders, or automatically mark orders as `paid` via webhook upon successful payment.
- **Recommendation:** Add `POST /api/v1/orders/:id/checkout` (returns payment gateway URL) and implement the webhook handler for payment verification.

---

### 4. Dashboard Metrics & Analytics Summary
- **Current Contract:** Metrics must be calculated on the client by querying multiple endpoints (`/customers`, `/orders`, `/products`).
- **Gap:** As data volume grows, client-side aggregation is inefficient for order volume, revenue totals, and conversation counts.
- **Recommendation:** Provide `GET /api/v1/businesses/:id/analytics` returning summary counts and trends.

---

### 5. Multi-User / Merchant Message Role Attribute
- **Current Contract (`API.md` T6):** `POST /api/v1/conversations/:id/messages` only allows `role: "user" | "assistant" | "system"`.
- **Gap:** When a human business owner takes over a conversation and sends a message, it is marked as `assistant`. The UI cannot distinguish between automated AI replies and human agent responses.
- **Recommendation:** Add optional `senderName` or support `role: "agent"`.
