# Voxy API — Frontend Contract Reference

**Base URL:** `/api/v1`
**Auth:** All protected routes require `Authorization: Bearer <token>` in headers.
Token is obtained from `POST /auth/login` or `POST /auth/signup`.

---

## Response Envelope

```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": { "code": "ERROR_CODE", "message": "Human-readable message" } }
```

---

## Error Codes

| Code | HTTP | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Request body failed schema validation |
| `UNAUTHORIZED` | 401 | Missing or invalid bearer token |
| `FORBIDDEN` | 403 | Token valid but not authorized for this resource |
| `NOT_FOUND` | 404 | Resource does not exist |
| `INVALID_ITEM` | 400 | Product invalid or does not belong to business |
| `PRODUCT_UNAVAILABLE` | 400 | Product is marked unavailable |
| `ORDER_NOT_EDITABLE` | 400 | Order is not in draft status |
| `ORDER_NOT_CANCELLABLE` | 400 | Order is paid or already cancelled |
| `INVALID_TRANSITION` | 400 | Invalid order status transition |
| `SERVER_ERROR` | 500 | Internal server error |

---

## Authentication

### POST /api/v1/auth/signup

Register a new business account. Auth: None.

Request:
```json
{ "name": "Mama Put Kitchen", "email": "hello@mamput.com", "password": "SecurePass123" }
```

Response 201:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGci...",
    "business": { "id": "uuid", "name": "Mama Put Kitchen", "email": "hello@mamput.com", "slug": "mama-put-kitchen", "isVerified": false }
  }
}
```

---

### POST /api/v1/auth/login

Log in as a business. Auth: None.

Request:
```json
{ "email": "hello@mamput.com", "password": "SecurePass123" }
```

Response 200: Same shape as signup.

---

### GET /api/v1/auth/me

Get authenticated business profile. Auth: Required.

Response 200:
```json
{
  "success": true,
  "data": {
    "id": "uuid", "email": "hello@mamput.com", "name": "Mama Put Kitchen",
    "slug": "mama-put-kitchen", "isVerified": false, "logoUrl": null,
    "description": null, "category": null, "contactPhone": null,
    "address": null, "socialLinks": null, "hours": null,
    "policies": null, "deliveryInfo": null, "supportedLanguages": ["en"],
    "aiConfig": null, "createdAt": "...", "updatedAt": "..."
  }
}
```

---

## Business Profile (T4)

### GET /api/v1/businesses/:id

Full business profile including aiConfig and email. Auth: Required (owner only).
Response 200: Same shape as GET /auth/me.

---

### PATCH /api/v1/businesses/:id

Update business profile — any combination of fields, all optional. Auth: Required (owner only).

Request body:
```json
{
  "name": "Mama Put Kitchen",
  "logoUrl": "https://cdn.example.com/logo.png",
  "description": "The best local food in Lagos.",
  "category": "Food & Beverage",
  "contactPhone": "+2348012345678",
  "address": { "street": "12 Eko Street", "city": "Lagos", "state": "Lagos", "country": "Nigeria", "postalCode": "100001" },
  "socialLinks": { "whatsapp": "+2348012345678", "instagram": "@mamaputkitchen", "twitter": "@mamaputkitchen", "facebook": "mamaputkitchen", "website": "https://mamaputkitchen.com" },
  "hours": {
    "mon": { "open": "08:00", "close": "20:00", "closed": false },
    "sun": { "closed": true }
  },
  "policies": "No refunds after order is confirmed.",
  "deliveryInfo": "We deliver within a 10km radius.",
  "supportedLanguages": ["en", "yo"],
  "aiConfig": {
    "persona": "Friendly assistant named Voxy",
    "tone": "casual",
    "greeting": "Hi! Welcome to Mama Put Kitchen.",
    "fallbackMessage": "Let me connect you with our team.",
    "rules": ["Never share pricing without confirming availability"],
    "permittedActions": ["browse_menu", "place_order", "check_order_status"],
    "escalationTriggers": ["complaint", "refund", "speak to human"]
  }
}
```

Response 200: Updated business object (passwordHash never returned).

---

### DELETE /api/v1/businesses/:id

Permanently delete business account and all data. Auth: Required (owner only).

Response 200: `{ "success": true, "data": { "deleted": true, "id": "uuid" } }`

---

### GET /api/v1/businesses/by-slug/:slug

Public profile lookup by slug. Auth: None.
aiConfig and email are NOT returned.

Response 200:
```json
{
  "success": true,
  "data": {
    "id": "uuid", "name": "Mama Put Kitchen", "slug": "mama-put-kitchen",
    "logoUrl": "...", "description": "...", "category": "Food & Beverage",
    "contactPhone": "...", "address": { ... }, "socialLinks": { ... },
    "hours": { "mon": { "open": "08:00", "close": "20:00", "closed": false } },
    "policies": "...", "deliveryInfo": "...", "supportedLanguages": ["en"]
  }
}
```

---

## Products (T5)

### GET /api/v1/businesses/:id/products

List/search products. Auth: None (public).

Query params:
- `q` (string) — search name and description
- `tag` (string) — filter by exact tag
- `available` (boolean, default true) — set false to include unavailable
- `limit` (number, default 50, max 100)
- `offset` (number, default 0)

Response 200:
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "uuid", "businessId": "uuid", "name": "Jollof Rice",
        "description": "Party jollof with chicken",
        "priceKobo": 250000, "discountKobo": 25000, "currency": "NGN",
        "imageUrl": "...", "isAvailable": true, "stockQuantity": 50,
        "tags": ["rice", "main"], "createdAt": "...", "updatedAt": "..."
      }
    ],
    "total": 24, "limit": 50, "offset": 0
  }
}
```

NOTE: effectivePrice = priceKobo - discountKobo. All prices in kobo (1 NGN = 100 kobo).

---

### POST /api/v1/businesses/:id/products

Create a product. Auth: Required (owner only).

Request:
```json
{
  "name": "Jollof Rice",
  "priceKobo": 250000,
  "discountKobo": 25000,
  "description": "Party jollof with chicken",
  "currency": "NGN",
  "imageUrl": "https://cdn.example.com/jollof.jpg",
  "isAvailable": true,
  "stockQuantity": 50,
  "tags": ["rice", "main", "party"]
}
```

Required: name, priceKobo. Response 201: Full product object.

---

### GET /api/v1/products/:id

Get single product. Auth: None. Response 200: Full product object.

---

### PATCH /api/v1/products/:id

Update product. Auth: Required (owner only). All fields optional.

Request:
```json
{ "name": "Jollof Rice (Large)", "priceKobo": 350000, "discountKobo": 0, "isAvailable": true, "stockQuantity": null, "tags": ["rice", "large"] }
```

Response 200: Updated product object.

---

### DELETE /api/v1/products/:id

Soft-delete product (sets isAvailable = false). Auth: Required (owner only).
Products are NEVER hard-deleted (they are referenced in order history).
Response 200: Product with isAvailable: false.

---

## Customers (T6)

### GET /api/v1/businesses/:id/customers

List all customers. Auth: Required (owner only).

Response 200:
```json
{
  "success": true,
  "data": [
    { "id": "uuid", "businessId": "uuid", "name": "Adeola Bello", "phone": "+2348098765432", "email": "adeola@email.com", "channel": "web_chat", "createdAt": "...", "updatedAt": "..." }
  ]
}
```

---

### POST /api/v1/businesses/:id/customers

Create or upsert customer by email/phone match. Auth: Required (owner only).

Request:
```json
{ "name": "Adeola Bello", "phone": "+2348098765432", "email": "adeola@email.com", "channel": "web_chat" }
```

channel: "web_chat" | "voice" (default: "web_chat")
Response: 201 on create, 200 on upsert.

---

### GET /api/v1/customers/:id

Get customer with conversation and order summaries. Auth: Required (owner only).

Response 200:
```json
{
  "success": true,
  "data": {
    "id": "uuid", "name": "Adeola Bello", "phone": "...", "email": "...", "channel": "web_chat",
    "conversations": [ { "id": "uuid", "status": "closed", "createdAt": "...", "updatedAt": "..." } ],
    "orders": [ { "id": "uuid", "status": "paid", "totalKobo": 250000, "currency": "NGN", "createdAt": "..." } ]
  }
}
```

---

### PATCH /api/v1/customers/:id

Update customer. Auth: Required (owner only). All fields optional.

Request:
```json
{ "name": "Adeola Bello", "phone": "...", "email": "...", "channel": "voice" }
```

Response 200: Updated customer object.

---

### GET /api/v1/customers/:id/conversations

List all conversations for a customer with linked orders. Auth: Required (owner only).

Response 200:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid", "status": "closed",
      "messages": [ { "role": "user", "content": "...", "createdAt": "..." } ],
      "orders": [ { "id": "uuid", "status": "paid", "totalKobo": 250000 } ],
      "createdAt": "...", "updatedAt": "..."
    }
  ]
}
```

---

### POST /api/v1/customers/:id/conversations

Start a conversation session. Auth: None (AI-facing).

Request (all optional):
```json
{ "status": "active", "initialMessages": [ { "role": "assistant", "content": "Hi! Welcome to Mama Put Kitchen." } ] }
```

Response 201: Conversation object.

---

### GET /api/v1/conversations/:id

Get full conversation with messages, customer, orders, items.
Auth: Business owner (bearer token) OR customer via ?customerId=<id>.

Response 200:
```json
{
  "success": true,
  "data": {
    "id": "uuid", "status": "active",
    "messages": [
      { "role": "user", "content": "I want jollof rice", "createdAt": "..." },
      { "role": "assistant", "content": "Sure! One plate?", "createdAt": "..." }
    ],
    "customer": { "id": "uuid", "name": "Adeola", "phone": "...", "email": "...", "channel": "web_chat" },
    "business": { "id": "uuid", "name": "Mama Put Kitchen", "slug": "mama-put-kitchen" },
    "orders": [
      { "id": "uuid", "status": "confirmed", "totalKobo": 250000, "currency": "NGN",
        "items": [ { "id": "uuid", "productId": "uuid", "quantity": 1, "unitPriceKobo": 250000 } ] }
    ]
  }
}
```

---

### PATCH /api/v1/conversations/:id

Update conversation status. Auth: Required (owner only).

Request: `{ "status": "closed" }`
status: "active" | "handed_off" | "closed"
Response 200: Updated conversation.

---

### POST /api/v1/conversations/:id/messages

Append a message to conversation. Auth: None (AI-facing).

Request: `{ "role": "user", "content": "I want to order jollof rice" }`
role: "user" | "assistant" | "system"
Response 200: Updated conversation with all messages.

---

## Orders (T7)

### POST /api/v1/orders

Create an order. Idempotent via idempotencyKey. Auth: Required (businessId in body must match token).

Request:
```json
{
  "businessId": "uuid",
  "customerId": "uuid",
  "conversationId": "uuid",
  "idempotencyKey": "conv-uuid-attempt-1",
  "currency": "NGN",
  "items": [
    { "productId": "uuid", "quantity": 2 },
    { "productId": "uuid", "quantity": 1 }
  ]
}
```

Rules:
- conversationId is optional
- If idempotencyKey was already used, existing order is returned (no duplicate). Recommended pattern: <conversationId>-attempt-<n>
- unitPriceKobo is snapshotted at creation: effectivePrice = priceKobo - discountKobo
- All products must be isAvailable = true

Response 201 (or 200 if idempotent replay):
```json
{
  "success": true,
  "data": {
    "id": "uuid", "businessId": "uuid", "customerId": "uuid",
    "conversationId": "uuid", "status": "draft",
    "totalKobo": 500000, "currency": "NGN",
    "idempotencyKey": "conv-uuid-attempt-1",
    "items": [
      { "id": "uuid", "productId": "uuid", "quantity": 2, "unitPriceKobo": 225000,
        "product": { "id": "uuid", "name": "Jollof Rice", "imageUrl": "...", "currency": "NGN" } }
    ],
    "customer": { "id": "uuid", "name": "Adeola Bello", "phone": "...", "email": "...", "channel": "web_chat" },
    "business": { "id": "uuid", "name": "Mama Put Kitchen", "slug": "mama-put-kitchen" },
    "createdAt": "...", "updatedAt": "..."
  }
}
```

---

### GET /api/v1/businesses/:id/orders

List business orders with optional filters. Auth: Required (owner only).

Query params:
- `status` — draft | confirmed | paid | cancelled
- `customerId` — filter by customer
- `limit` — default 50, max 100
- `offset` — default 0

Response 200:
```json
{ "success": true, "data": { "orders": [ ... ], "total": 85, "limit": 50, "offset": 0 } }
```

---

### GET /api/v1/orders/:id

Get single order with items, customer, conversation.
Auth: Business owner (bearer token) OR customer via ?customerId=<id>.
Response 200: Full order object (same shape as POST response).

---

### PATCH /api/v1/orders/:id

Replace order items. ONLY allowed when status = draft. Prices re-snapshotted.
Auth: Required (owner only).

Request: `{ "items": [ { "productId": "uuid", "quantity": 3 } ] }`
Response 200: Updated order with recalculated totalKobo.

---

### PATCH /api/v1/orders/:id/status

Transition order through state machine. Auth: Required (owner only).

State machine:
```
draft --> confirmed --> paid (terminal)
draft --> cancelled (terminal)
confirmed --> cancelled (terminal)
```

Request: `{ "status": "confirmed" }`
Response 200: Updated order object.

---

### DELETE /api/v1/orders/:id

Cancel an order. Sets status to cancelled.
Allowed: draft or confirmed.
Blocked: paid or already cancelled.
Auth: Required (owner only).
Response 200: Order with status: "cancelled".

---

## Health Check

### GET /api/v1/health

Auth: None.
Response 200: `{ "success": true, "data": { "status": "ok" } }`

---

## Data Types

### Price Convention (Kobo)

All monetary values in kobo. 1 NGN = 100 kobo.

| Display | Kobo value |
|---|---|
| NGN 2,500 | 250000 |
| NGN 1,000 | 100000 |

effectivePrice = priceKobo - discountKobo

Frontend display helper:
```js
const formatNGN = (kobo) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(kobo / 100);
```

---

### aiConfig Object

```ts
{
  persona?: string;              // Who the AI presents as
  tone?: string;                 // "casual" | "formal" | "friendly"
  greeting?: string;             // First message to customers
  fallbackMessage?: string;      // When AI cannot answer
  rules?: string[];              // Business-specific AI rules
  permittedActions?: string[];   // Actions AI is allowed to take
  escalationTriggers?: string[]; // Keywords triggering human handoff
}
```

---

### hours Object

```ts
{
  mon?: { open: string; close: string; closed?: boolean };
  tue?: { open: string; close: string; closed?: boolean };
  // ... same for wed, thu, fri, sat, sun
}
// Times in 24hr format: "09:00", "17:30"
```

---

### Order Status Flow

```
[draft] --> [confirmed] --> [paid]
   |              |
   +------+-------+
          |
       [cancelled]
```

---

## Full Route Summary

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | /auth/signup | None | Register business |
| POST | /auth/login | None | Login |
| GET | /auth/me | Required | Own profile |
| GET | /businesses/:id | Required | Full profile (with aiConfig) |
| PATCH | /businesses/:id | Required | Update profile / hours / AI |
| DELETE | /businesses/:id | Required | Delete account |
| GET | /businesses/by-slug/:slug | None | Public profile lookup |
| GET | /businesses/:id/products | None | List / search products |
| POST | /businesses/:id/products | Required | Create product |
| GET | /products/:id | None | Get product |
| PATCH | /products/:id | Required | Update product |
| DELETE | /products/:id | Required | Soft-delete product |
| GET | /businesses/:id/customers | Required | List customers |
| POST | /businesses/:id/customers | Required | Create / upsert customer |
| GET | /customers/:id | Required | Get customer detail |
| PATCH | /customers/:id | Required | Update customer |
| GET | /customers/:id/conversations | Required | List conversations |
| POST | /customers/:id/conversations | None | Start conversation (AI) |
| GET | /conversations/:id | Owner or ?customerId= | Get conversation |
| PATCH | /conversations/:id | Required | Update status |
| POST | /conversations/:id/messages | None | Append message (AI) |
| POST | /orders | Required | Create order |
| GET | /businesses/:id/orders | Required | List business orders |
| GET | /orders/:id | Owner or ?customerId= | Get order |
| PATCH | /orders/:id | Required | Edit draft order items |
| PATCH | /orders/:id/status | Required | Transition order status |
| DELETE | /orders/:id | Required | Cancel order |
| GET | /health | None | Health check |
