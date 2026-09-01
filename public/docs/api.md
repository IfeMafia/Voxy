# Voxy V2 — Backend API Reference

> **Base URL:** `/api/v1`  
> **Version:** 2.0  
> **Format:** JSON — all requests with a body must send `Content-Type: application/json`.

---

## Table of Contents

1. [Response Envelope](#response-envelope)
2. [Authentication](#authentication)
3. [Error Codes](#error-codes)
4. [Endpoints](#endpoints)
   - [Health](#health)
   - [Auth — Signup](#post-authsignup)
   - [Auth — Login](#post-authlogin)
   - [Businesses — Create](#post-businesses)
   - [Businesses — Get](#get-businessesid)
   - [Businesses — Update](#patch-businessesid)
   - [Products — Create](#post-businessesidproducts)
   - [Products — List](#get-businessesidproducts)
   - [Products — Get](#get-productsid)
   - [Products — Update](#patch-productsid)
   - [Products — Delete (soft)](#delete-productsid)
   - [Product Variants — Create](#post-productsidvariants)
   - [Customers — Upsert](#post-businessesidcustomers)
   - [Customers — List](#get-businessesidcustomers)
   - [Customers — Get](#get-customersid)
   - [Conversations — Create](#post-customersidconversations)
   - [Conversations — Get](#get-conversationsid)
   - [Conversations — Append Message](#post-conversationsidmessages)
   - [Orders — Create](#post-orders)
   - [Orders — List](#get-businessesidorders)
   - [Orders — Update Status](#patch-ordersidstatus)

---

## Response Envelope

Every response — success or error — shares this shape:

```json
{
  "data": <object | array | null>,
  "error": {
    "code": "SNAKE_CASE_CODE",
    "message": "Human-readable message",
    "details": {}   // optional, validation errors
  } | null
}
```

On **success**: `data` is populated, `error` is `null`.  
On **error**: `data` is `null`, `error` is populated.

---

## Authentication

Protected endpoints require a bearer token obtained from `/auth/login` or `/auth/signup`.

```http
Authorization: Bearer <jwt_token>
```

- Tokens are **HS256 JWTs** signed with the server's `JWT_SECRET`.
- Tokens **expire in 24 hours**.
- Payload contains `{ userId, email }`.
- Sending an invalid or expired token returns `401 UNAUTHORIZED`.
- Routes that state **"bearer required"** return `401` if the header is absent or invalid.
- Routes that state **"public"** do not need a bearer token.

---

## Error Codes

| Code | HTTP Status | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Invalid or missing required fields |
| `INVALID_ITEM` | 400 | An order item references a non-existent or cross-business product/variant |
| `INVALID_TRANSITION` | 400 | Attempted order status transition that is not allowed |
| `UNAUTHORIZED` | 401 | Missing or invalid bearer token |
| `INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `FORBIDDEN` | 403 | Authenticated user does not own this resource |
| `NOT_FOUND` | 404 | Requested resource does not exist |
| `USER_EXISTS` | 409 | Email is already registered |
| `DATABASE_ERROR` | 500 | Database is unreachable (health check only) |
| `SERVER_ERROR` | 500 | Unexpected internal error |

---

## Endpoints

---

### Health

#### `GET /health`

**Auth:** Public — no token required.  
**Purpose:** Database connectivity check. Use this for your uptime monitor.

**Success `200`**
```json
{ "data": { "status": "ok" }, "error": null }
```

**Error `500`**
```json
{ "data": null, "error": { "code": "DATABASE_ERROR", "message": "Database health check failed" } }
```

---

### `POST /auth/signup`

**Auth:** Public.  
**Purpose:** Create a new user account. Returns a JWT immediately — no separate login step needed.

**Request Body**
| Field | Type | Required | Notes |
|---|---|---|---|
| `email` | string | ✅ | Stored lowercase |
| `password` | string | ✅ | Min 6 characters |
| `fullName` | string | ❌ | Display name |

**Success `201`**
```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "cuid",
      "email": "user@example.com",
      "fullName": "Jane Doe",
      "isVerified": false,
      "createdAt": "2026-08-31T00:00:00.000Z",
      "updatedAt": "2026-08-31T00:00:00.000Z"
    }
  },
  "error": null
}
```

**Errors**
| Status | Code | Condition |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Invalid email or password too short |
| 409 | `USER_EXISTS` | Email already registered |

> **Note:** `passwordHash` is never returned in any response.

---

### `POST /auth/login`

**Auth:** Public.  
**Purpose:** Authenticate an existing user. Returns a fresh JWT.

**Request Body**
| Field | Type | Required |
|---|---|---|
| `email` | string | ✅ |
| `password` | string | ✅ |

**Success `200`**
```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "cuid",
      "email": "user@example.com",
      "fullName": null,
      "isVerified": false,
      "createdAt": "2026-08-31T00:00:00.000Z",
      "updatedAt": "2026-08-31T00:00:00.000Z"
    }
  },
  "error": null
}
```

**Errors**
| Status | Code | Condition |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Email missing or malformed |
| 401 | `INVALID_CREDENTIALS` | Email not found or password mismatch |

> **Security:** Both "user not found" and "wrong password" return the same `INVALID_CREDENTIALS` error — this prevents user enumeration.

---

### `POST /businesses`

**Auth:** Bearer required.  
**Purpose:** Create a new business owned by the authenticated user.

**Request Body**
| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | ✅ | |
| `slug` | string | ❌ | Auto-generated from `name` if omitted; uniqueness is enforced |
| `description` | string | ❌ | |
| `hours` | object | ❌ | Free-form JSON |
| `policies` | string | ❌ | |
| `deliveryInfo` | string | ❌ | |
| `supportedLanguages` | string[] | ❌ | Default: `["en"]` |
| `aiConfig` | object | ❌ | Free-form JSON for AI engine |

**Success `201`** — Returns the full `Business` object.

```json
{
  "data": {
    "id": "cuid",
    "ownerUserId": "cuid",
    "name": "Mama's Kitchen",
    "slug": "mamas-kitchen",
    "description": null,
    "hours": null,
    "policies": null,
    "deliveryInfo": null,
    "supportedLanguages": ["en"],
    "aiConfig": null,
    "createdAt": "2026-08-31T00:00:00.000Z",
    "updatedAt": "2026-08-31T00:00:00.000Z"
  },
  "error": null
}
```

**Errors**
| Status | Code | Condition |
|---|---|---|
| 400 | `VALIDATION_ERROR` | `name` missing |
| 401 | `UNAUTHORIZED` | No/bad token |

---

### `GET /businesses/:id`

**Auth:** Bearer required.  
**Purpose:** Fetch a single business by its ID.

**Path Params:** `id` — business CUID.

**Success `200`** — Returns the `Business` object (same shape as create).

**Errors**
| Status | Code | Condition |
|---|---|---|
| 401 | `UNAUTHORIZED` | No/bad token |
| 404 | `NOT_FOUND` | Business doesn't exist |

---

### `PATCH /businesses/:id`

**Auth:** Bearer required. **Caller must be the business owner** — returns `403` otherwise.  
**Purpose:** Update business settings. Partial updates are supported; only send the fields you want to change.

**Request Body** (all fields optional)
| Field | Type | Notes |
|---|---|---|
| `name` | string | Min 1 char |
| `description` | string \| null | |
| `hours` | any | |
| `policies` | string \| null | |
| `deliveryInfo` | string \| null | |
| `supportedLanguages` | string[] | |
| `aiConfig` | any | |

> **Note:** `slug` cannot be changed after creation.

**Success `200`** — Returns the updated `Business` object.

**Errors**
| Status | Code | Condition |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Invalid field values |
| 401 | `UNAUTHORIZED` | No/bad token |
| 403 | `FORBIDDEN` | Caller is not the business owner |
| 404 | `NOT_FOUND` | Business doesn't exist |

---

### `POST /businesses/:id/products`

**Auth:** Bearer required. Caller must own the business.  
**Purpose:** Add a product to a business catalogue.

**Request Body**
| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | ✅ | |
| `priceCents` | integer | ✅ | Non-negative. Price in smallest currency unit (e.g., kobo for NGN) |
| `currency` | string | ❌ | Default `"NGN"` |
| `description` | string \| null | ❌ | |
| `imageUrl` | string \| null | ❌ | |
| `isAvailable` | boolean | ❌ | Default `true` |
| `stockQuantity` | integer \| null | ❌ | `null` means unlimited |
| `tags` | string[] | ❌ | Default `[]` |

**Success `201`** — Returns the `Product` object including an empty `variants: []` array.

```json
{
  "data": {
    "id": "cuid",
    "businessId": "cuid",
    "name": "Jollof Rice",
    "description": "Party jollof with chicken",
    "priceCents": 150000,
    "currency": "NGN",
    "imageUrl": null,
    "isAvailable": true,
    "stockQuantity": null,
    "tags": ["rice", "party"],
    "variants": [],
    "createdAt": "2026-08-31T00:00:00.000Z",
    "updatedAt": "2026-08-31T00:00:00.000Z"
  },
  "error": null
}
```

**Errors**
| Status | Code | Condition |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Missing `name` or `priceCents` |
| 401 | `UNAUTHORIZED` | |
| 403 | `FORBIDDEN` | Caller doesn't own this business |
| 404 | `NOT_FOUND` | Business not found |

---

### `GET /businesses/:id/products`

**Auth:** Optional (bearer or anonymous).  
**Purpose:** List all products for a business.

**Behaviour:**
- If the caller is the **business owner** (valid bearer token + matching `ownerUserId`): returns **all** products including unavailable ones.
- Otherwise (anonymous or other users): returns only products where `isAvailable = true`.

**Response `200`** — Array of `Product` objects (each includes `variants`), ordered newest first.

```json
{
  "data": [ { ...product }, ... ],
  "error": null
}
```

---

### `GET /products/:id`

**Auth:** Public.  
**Purpose:** Fetch a single product by ID. Used by the AI engine to get the latest price before quoting.

**Success `200`** — Returns the `Product` object including `variants`.

**Errors**
| Status | Code | Condition |
|---|---|---|
| 404 | `NOT_FOUND` | Product doesn't exist |

---

### `PATCH /products/:id`

**Auth:** Bearer required. Caller must be the business owner.  
**Purpose:** Update any product field. Partial updates supported.

**Request Body** (all optional)
| Field | Type |
|---|---|
| `name` | string |
| `description` | string \| null |
| `priceCents` | integer ≥ 0 |
| `currency` | string |
| `imageUrl` | string \| null |
| `isAvailable` | boolean |
| `stockQuantity` | integer \| null |
| `tags` | string[] |

**Success `200`** — Returns updated `Product` with `variants`.

**Errors**
| Status | Code | Condition |
|---|---|---|
| 400 | `VALIDATION_ERROR` | |
| 401 | `UNAUTHORIZED` | |
| 403 | `FORBIDDEN` | |
| 404 | `NOT_FOUND` | |

---

### `DELETE /products/:id`

**Auth:** Bearer required. Caller must be the business owner.  
**Purpose:** Soft-delete a product by setting `isAvailable = false`. **Records are never hard-deleted** — order history is preserved.

**Success `200`** — Returns the updated `Product` with `isAvailable: false`.

**Errors**
| Status | Code | Condition |
|---|---|---|
| 401 | `UNAUTHORIZED` | |
| 403 | `FORBIDDEN` | |
| 404 | `NOT_FOUND` | |

> ⚠️ Soft-deleted products are filtered out of anonymous `GET /businesses/:id/products` calls automatically.

---

### `POST /products/:id/variants`

**Auth:** Bearer required. Caller must be the business owner.  
**Purpose:** Add a variant (e.g., size, flavour) to an existing product. Variant price overrides the parent product's price when set.

**Request Body**
| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | ✅ | e.g., "Large", "Extra Spicy" |
| `priceCents` | integer \| null | ❌ | If `null`, parent product price is used |
| `stockQuantity` | integer \| null | ❌ | `null` = unlimited |

**Success `201`**
```json
{
  "data": {
    "id": "cuid",
    "productId": "cuid",
    "name": "Large",
    "priceCents": 200000,
    "stockQuantity": null,
    "createdAt": "2026-08-31T00:00:00.000Z",
    "updatedAt": "2026-08-31T00:00:00.000Z"
  },
  "error": null
}
```

**Errors**
| Status | Code | Condition |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Missing `name` |
| 401 | `UNAUTHORIZED` | |
| 403 | `FORBIDDEN` | |
| 404 | `NOT_FOUND` | Product not found |

---

### `POST /businesses/:id/customers`

**Auth:** Public — no bearer required.  
**Purpose:** Upsert a customer profile for a business. Designed for the AI engine to call when a chat session starts. If a customer with the same email **or** phone already exists for this business, their record is updated; otherwise a new customer is created.

**Matching logic (priority order):**
1. Match on `email` first (if provided)
2. Then match on `phone` (if provided and email didn't match)
3. Otherwise create a new customer

**Request Body**
| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string \| null | ❌ | |
| `phone` | string \| null | ❌ | |
| `email` | string \| null | ❌ | Stored lowercase |
| `channel` | `"web_chat"` \| `"voice"` | ❌ | Default `"web_chat"` |

**Response**
- `201` — new customer created
- `200` — existing customer updated

```json
{
  "data": {
    "id": "cuid",
    "businessId": "cuid",
    "name": "Chisom Eze",
    "phone": "+2348012345678",
    "email": null,
    "channel": "web_chat",
    "createdAt": "2026-08-31T00:00:00.000Z",
    "updatedAt": "2026-08-31T00:00:00.000Z"
  },
  "error": null
}
```

**Errors**
| Status | Code | Condition |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Invalid email format |
| 404 | `NOT_FOUND` | Business not found |

---

### `GET /businesses/:id/customers`

**Auth:** Bearer required. Caller must own the business.  
**Purpose:** List all customers for a business (dashboard use).

**Response `200`** — Array of `Customer` objects, ordered newest first.

**Errors**
| Status | Code | Condition |
|---|---|---|
| 401 | `UNAUTHORIZED` | |
| 403 | `FORBIDDEN` | |
| 404 | `NOT_FOUND` | Business not found |

---

### `GET /customers/:id`

**Auth:** Bearer required. Caller must own the business this customer belongs to.  
**Purpose:** Get full customer profile including their conversation history and orders.

**Success `200`**
```json
{
  "data": {
    "id": "cuid",
    "businessId": "cuid",
    "name": "Chisom Eze",
    "phone": "+2348012345678",
    "email": null,
    "channel": "web_chat",
    "business": { ...businessObject },
    "conversations": [ ...conversationObjects ],
    "orders": [ ...orderObjects ],
    "createdAt": "...",
    "updatedAt": "..."
  },
  "error": null
}
```

**Errors**
| Status | Code | Condition |
|---|---|---|
| 401 | `UNAUTHORIZED` | |
| 403 | `FORBIDDEN` | |
| 404 | `NOT_FOUND` | Customer not found |

---

### `POST /customers/:id/conversations`

**Auth:** Public — no bearer required.  
**Purpose:** Open a new conversation for a customer. Called by the AI engine at the start of a chat session.

**Request Body**
| Field | Type | Required | Notes |
|---|---|---|---|
| `status` | `"active"` \| `"handed_off"` \| `"closed"` | ❌ | Default `"active"` |
| `initialMessages` | `{ role: string; content: string }[]` | ❌ | Default `[]`. Seed the message history here. |

**Success `201`**
```json
{
  "data": {
    "id": "cuid",
    "businessId": "cuid",
    "customerId": "cuid",
    "status": "active",
    "messages": [],
    "createdAt": "...",
    "updatedAt": "..."
  },
  "error": null
}
```

**Errors**
| Status | Code | Condition |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Invalid `status` value |
| 404 | `NOT_FOUND` | Customer not found |

---

### `GET /conversations/:id`

**Auth:** Dual-mode access — either the **business owner** (bearer token) or the **customer themselves** (query param).  
**Purpose:** Retrieve a full conversation with its messages, customer record, and associated orders.

**Query Params**
| Param | Required | Notes |
|---|---|---|
| `customerId` | Situational | Required if caller has no valid bearer token. Must match the conversation's `customerId`. |

**Access rules:**
- Valid bearer token where `userId === conversation.business.ownerUserId` → **allowed**
- No bearer token but `?customerId=<matching-id>` → **allowed**
- Neither → `403 FORBIDDEN`

**Success `200`**
```json
{
  "data": {
    "id": "cuid",
    "businessId": "cuid",
    "customerId": "cuid",
    "status": "active",
    "messages": [
      { "role": "user", "content": "Hello", "createdAt": "..." },
      { "role": "assistant", "content": "Hi! How can I help?", "createdAt": "..." }
    ],
    "customer": { ...customerObject },
    "business": { "id": "...", "name": "...", "slug": "...", "ownerUserId": "..." },
    "orders": [ { ...orderWithItems } ],
    "createdAt": "...",
    "updatedAt": "..."
  },
  "error": null
}
```

**Errors**
| Status | Code | Condition |
|---|---|---|
| 403 | `FORBIDDEN` | Neither owner nor matching customerId |
| 404 | `NOT_FOUND` | Conversation not found |

---

### `POST /conversations/:id/messages`

**Auth:** Public — no bearer required.  
**Purpose:** Append a single message to a conversation's message log. Called by the AI engine after each turn.

**Request Body**
| Field | Type | Required | Notes |
|---|---|---|---|
| `role` | string | ✅ | e.g., `"user"`, `"assistant"`, `"system"` |
| `content` | string | ✅ | |

**How messages are stored:** Messages are stored as a JSON array on the `Conversation` row. Each call appends one new entry with a server-generated `createdAt` timestamp.

**Success `200`** — Returns the full updated `Conversation` object (including the new message at the end of the `messages` array).

**Errors**
| Status | Code | Condition |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Missing `role` or `content` |
| 404 | `NOT_FOUND` | Conversation not found |

---

### `POST /orders`

**Auth:** Public — no bearer required.  
**Purpose:** Create an order. Designed for the AI engine to call when a customer confirms their cart. Supports **idempotency** — sending the same `idempotencyKey` twice returns the existing order instead of creating a duplicate.

**Request Body**
| Field | Type | Required | Notes |
|---|---|---|---|
| `businessId` | string | ✅ | |
| `customerId` | string | ✅ | Must belong to this business |
| `idempotencyKey` | string | ✅ | Unique per intent. Use a UUID. If a matching key already exists the existing order is returned. |
| `items` | array | ✅ | Min 1 item |
| `items[].productId` | string | ✅ | Must belong to `businessId` |
| `items[].quantity` | integer | ✅ | ≥ 1 |
| `items[].variantId` | string \| null | ❌ | If provided, variant's `priceCents` overrides product price |
| `conversationId` | string \| null | ❌ | Links the order to a conversation |
| `currency` | string | ❌ | Default `"NGN"` |

**Price snapshot:** Unit prices are captured at order-creation time from the product/variant. Future price changes don't affect existing orders.

**`totalCents`** is automatically computed server-side as `sum(unitPriceCents × quantity)`.

**Success `201`** — Returns the full `Order` object with items, products, and variants embedded.

```json
{
  "data": {
    "id": "cuid",
    "businessId": "cuid",
    "customerId": "cuid",
    "conversationId": null,
    "idempotencyKey": "uuid-here",
    "status": "draft",
    "totalCents": 300000,
    "currency": "NGN",
    "items": [
      {
        "id": "cuid",
        "orderId": "cuid",
        "productId": "cuid",
        "variantId": null,
        "quantity": 2,
        "unitPriceCents": 150000,
        "product": { ...productObject },
        "variant": null
      }
    ],
    "createdAt": "...",
    "updatedAt": "..."
  },
  "error": null
}
```

**Idempotency:** `200` is returned (not `201`) when an existing order is found for the `idempotencyKey`.

**Errors**
| Status | Code | Condition |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Missing required fields |
| 400 | `INVALID_ITEM` | Product not found or belongs to different business; or variant not found on product |
| 404 | `NOT_FOUND` | `businessId` or `customerId` doesn't exist |

---

### `GET /businesses/:id/orders`

**Auth:** Bearer required. Caller must own the business.  
**Purpose:** List all orders for a business. Supports filtering by status.

**Query Params**
| Param | Required | Notes |
|---|---|---|
| `status` | ❌ | Filter by: `draft`, `confirmed`, `paid`, `cancelled` |

**Response `200`** — Array of `Order` objects (with `customer`, `items`, `product`, `variant` embedded), ordered newest first.

**Errors**
| Status | Code | Condition |
|---|---|---|
| 401 | `UNAUTHORIZED` | |
| 403 | `FORBIDDEN` | |
| 404 | `NOT_FOUND` | Business not found |

---

### `PATCH /orders/:id/status`

**Auth:** Bearer required. Caller must be the business owner.  
**Purpose:** Advance an order through its lifecycle. The AI engine calls this after payment is confirmed.

**Allowed status transitions:**

```
draft → confirmed | paid | cancelled
confirmed → paid | cancelled
paid → (terminal — no further transitions)
cancelled → (terminal — no further transitions)
```

**Request Body**
| Field | Type | Required | Values |
|---|---|---|---|
| `status` | string | ✅ | `"draft"`, `"confirmed"`, `"paid"`, `"cancelled"` |

**Success `200`** — Returns the updated `Order` object with items embedded.

**Errors**
| Status | Code | Condition |
|---|---|---|
| 400 | `VALIDATION_ERROR` | `status` not one of the four allowed values |
| 400 | `INVALID_TRANSITION` | Attempted a transition the state machine doesn't allow |
| 401 | `UNAUTHORIZED` | No/bad token |
| 403 | `FORBIDDEN` | Caller is not the business owner |
| 404 | `NOT_FOUND` | Order not found |

> **Note:** Sending the **same** status the order already has is a no-op — returns `200` with the current order unchanged.

---

## Data Types Reference

### User
| Field | Type |
|---|---|
| `id` | string (CUID) |
| `email` | string |
| `fullName` | string \| null |
| `isVerified` | boolean |
| `createdAt` | ISO 8601 datetime |
| `updatedAt` | ISO 8601 datetime |

> `passwordHash` is **never** returned in any API response.

### Business
| Field | Type |
|---|---|
| `id` | string (CUID) |
| `ownerUserId` | string |
| `name` | string |
| `slug` | string (unique, URL-safe) |
| `description` | string \| null |
| `hours` | JSON \| null |
| `policies` | string \| null |
| `deliveryInfo` | string \| null |
| `supportedLanguages` | string[] |
| `aiConfig` | JSON \| null |
| `createdAt` | ISO 8601 |
| `updatedAt` | ISO 8601 |

### Product
| Field | Type |
|---|---|
| `id` | string |
| `businessId` | string |
| `name` | string |
| `description` | string \| null |
| `priceCents` | integer |
| `currency` | string |
| `imageUrl` | string \| null |
| `isAvailable` | boolean |
| `stockQuantity` | integer \| null |
| `tags` | string[] |
| `variants` | ProductVariant[] |
| `createdAt` | ISO 8601 |
| `updatedAt` | ISO 8601 |

### ProductVariant
| Field | Type |
|---|---|
| `id` | string |
| `productId` | string |
| `name` | string |
| `priceCents` | integer \| null (null → inherit from parent) |
| `stockQuantity` | integer \| null |
| `createdAt` | ISO 8601 |
| `updatedAt` | ISO 8601 |

### Customer
| Field | Type |
|---|---|
| `id` | string |
| `businessId` | string |
| `name` | string \| null |
| `phone` | string \| null |
| `email` | string \| null |
| `channel` | `"web_chat"` \| `"voice"` |
| `createdAt` | ISO 8601 |
| `updatedAt` | ISO 8601 |

### Conversation
| Field | Type |
|---|---|
| `id` | string |
| `businessId` | string |
| `customerId` | string |
| `status` | `"active"` \| `"handed_off"` \| `"closed"` |
| `messages` | `{ role: string; content: string; createdAt: string }[]` |
| `createdAt` | ISO 8601 |
| `updatedAt` | ISO 8601 |

### Order
| Field | Type |
|---|---|
| `id` | string |
| `businessId` | string |
| `customerId` | string |
| `conversationId` | string \| null |
| `idempotencyKey` | string |
| `status` | `"draft"` \| `"confirmed"` \| `"paid"` \| `"cancelled"` |
| `totalCents` | integer |
| `currency` | string |
| `items` | OrderItem[] |
| `createdAt` | ISO 8601 |
| `updatedAt` | ISO 8601 |

### OrderItem
| Field | Type |
|---|---|
| `id` | string |
| `orderId` | string |
| `productId` | string |
| `variantId` | string \| null |
| `quantity` | integer |
| `unitPriceCents` | integer (snapshot at order time) |

---

## AI Engine Integration Notes

The following endpoints are called by the Voxy AI engine (no human bearer token):

| Endpoint | When to call |
|---|---|
| `POST /businesses/:id/customers` | Session start — identify or register the customer |
| `POST /customers/:id/conversations` | Session start — open a conversation session |
| `POST /conversations/:id/messages` | After every turn — persist user and AI messages |
| `GET /businesses/:id/products` | When customer asks about menu/catalogue |
| `GET /products/:id` | Before quoting a price to confirm current value |
| `POST /orders` | When customer confirms cart — use a stable UUID as `idempotencyKey` |
| `PATCH /orders/:id/status` | After payment confirmation (requires bearer token of business owner) |
| `GET /conversations/:id` | To resume or inspect a session |

---

## Frontend Dashboard Integration Notes

The following endpoints are called by the business owner dashboard (requires bearer token):

| Endpoint | Purpose |
|---|---|
| `POST /auth/signup` | Owner registration |
| `POST /auth/login` | Owner login |
| `POST /businesses` | Create business |
| `GET /businesses/:id` | Load business settings |
| `PATCH /businesses/:id` | Edit settings / AI config |
| `POST /businesses/:id/products` | Add product |
| `GET /businesses/:id/products` | View full catalogue (includes unavailable) |
| `PATCH /products/:id` | Edit product |
| `DELETE /products/:id` | Remove product (soft delete) |
| `POST /products/:id/variants` | Add variant |
| `GET /businesses/:id/customers` | View CRM |
| `GET /customers/:id` | Customer detail with order history |
| `GET /businesses/:id/orders` | Order management |
| `GET /businesses/:id/orders?status=paid` | Filter paid orders |
| `PATCH /orders/:id/status` | Manually confirm or cancel an order |
