# AI Agent — Required Backend Contracts

> **Audience:** the backend stream (Tobi — T1/T2/T6) and whoever wires the agent
> tools in S3–S5.
> **Status:** these are the contracts the S1 agent scaffolding is written
> against. They are **explicit assumptions**, not yet-built endpoints. Where a
> contract here differs from what backend actually ships, the *backend shape
> wins* and this doc + the affected gateway/tool get updated (and a note is left
> on the relevant Linear issue).

This document exists because PRD §14 (Definition of Done) requires interface
assumptions to be written down so the next developer can continue. The agent
layer (`src/lib/ai/agent/`) reads **all** business facts through one seam —
`BusinessDataGateway` — and every method below maps to a gateway method or a tool
that currently throws `NotImplementedError` with a pointer back to this file.

## Conventions

- **Scope:** every read/write is scoped to a `businessId`. No cross-business access.
- **Money:** amounts are in Nigerian Naira (₦). The **open decision** is whether
  the wire format is whole Naira (`number`) or integer kobo/minor units
  (`integer`). The gateway normalises to a single `price`/`amount` number; backend
  should state which it returns. Until locked, treat `price` as whole Naira.
- **Honesty:** "not found" / "empty" are first-class, valid responses. The agent
  surfaces them truthfully; it must never receive a fabricated placeholder to
  avoid an empty result (PRD §4.1).
- **Auth:** endpoints are server-to-server (called from Next.js route handlers /
  the agent layer), not from the browser.

---

## T1 — Business Profile & Policies

Consumed by `BusinessDataGateway.getBusinessProfile()` and `.getPolicies()`.
Profile grounding **already exists** today in `src/lib/ai-context.js` (reads the
`businesses` row → `ai_summary`); S3 moves that read behind the gateway. This
contract formalises what the gateway needs.

### §Business Profile Read
- **Input:** `businessId`
- **Returns:** 
  ```jsonc
  {
    "id": "string",
    "name": "string",
    "description": "string",
    "hours": "string | structured",     // opening hours
    "deliveryAreas": ["string"],         // where they deliver
    "contact": { "phone": "string", "email": "string" },
    "assistantConfig": {                 // optional per-business assistant tuning
      "tone": "string",
      "languages": ["english", "pidgin", "yoruba", "hausa", "igbo"]
    }
  }
  ```
- **Errors:** unknown `businessId` → `null` (not an exception).

### §Policies Read
- **Input:** `businessId`
- **Returns:** structured, citable policy text:
  ```jsonc
  {
    "returns": "string | null",
    "delivery": "string | null",
    "refunds": "string | null",
    "payment": "string | null"
  }
  ```
- The agent may quote these verbatim; it must not paraphrase them into new promises.

---

## T2 — Product Catalogue & Payment

### §Product Catalogue Query
Consumed by `BusinessDataGateway.findProducts(query)` → `product_lookup` tool.
- **Input:** `businessId`, `{ text?, maxPrice?, category? }`
- **Returns:** `ProductRef[]` — **only** real, listed products:
  ```jsonc
  [
    { "id": "string", "name": "string", "price": 0, "variant": "string | null", "available": true }
  ]
  ```
- **Empty match:** return `[]`. Never a placeholder.
- **Availability:** `available:false` products may be returned so the agent can say
  "that's out of stock" rather than "that doesn't exist" — backend's call, but the
  flag must be accurate.

### §Product Read By Id
Consumed by `BusinessDataGateway.getProductById(id)` → `order_builder` tool
(resolving each line to a real price).
- **Input:** `businessId`, `productId`
- **Returns:** one `ProductRef`, or `null` if it doesn't belong to the business.
- **Critical:** the **price returned here is authoritative** for order totals. The
  model never sets prices; the order builder multiplies this `price` by quantity.

### §Payment Request (Paystack init/verify)
Consumed by the `payment_request` tool. This is the §4.6 boundary: Voxy requests,
the provider verifies.
- **Init input:** `{ businessId, orderId, amount, currency: "NGN", customerEmail? }`
- **Init returns:** 
  ```jsonc
  {
    "reference": "string",        // provider payment reference
    "checkoutUrl": "string",      // where the customer completes payment
    "status": "pending"           // NEVER "paid" at init time
  }
  ```
- **Verify input:** `{ businessId, reference }`
- **Verify returns:** `{ "reference": "string", "status": "success | failed | pending", "paidAt": "ISO | null" }`
- **Non-negotiable:** payment success is asserted **only** by a provider-verified
  `status:"success"`. The agent must never tell a customer they've paid before this
  returns success. Voxy never receives or stores raw card details.

---

## T6 — Orders

Consumed by `BusinessDataGateway.getOrder(orderId)` and the `order_builder` tool.

### §Order Draft
- **Input:** `{ businessId, customerId?, lines: [{ productId, quantity }] }`
- **Behaviour:** server resolves each `productId` to its authoritative price,
  computes line + order totals, persists as a **draft** (uncommitted).
- **Returns:** `DraftOrder`:
  ```jsonc
  {
    "id": "string",
    "businessId": "string",
    "customerId": "string | null",
    "lines": [
      { "productId": "string", "name": "string", "quantity": 1, "unitPrice": 0, "lineTotal": 0 }
    ],
    "total": 0,
    "currency": "NGN",
    "status": "draft"
  }
  ```
- **Reject** (don't silently drop) any line whose `productId` doesn't resolve.

### §Order Read
- **Input:** `businessId`, `orderId`
- **Returns:** the persisted order (same shape, `status` ∈ `draft | confirmed | paid | cancelled`), or `null`.

### §Order Confirm (transition)
- **Input:** `{ businessId, orderId, confirmation: { confirmed: true, summary, confirmedAt } }`
- **Behaviour:** moves `draft → confirmed`, recording exactly what the customer
  agreed to. Only a `confirmed` order may be handed to §Payment Request.

---

## Mapping summary

| Agent seam (S1) | Backend contract | Implemented in |
|---|---|---|
| `getBusinessProfile()` | T1 §Business Profile Read | S3 |
| `getPolicies()` | T1 §Policies Read | S3 |
| `findProducts()` / `product_lookup` | T2 §Product Catalogue Query | S3 / S4 |
| `getProductById()` | T2 §Product Read By Id | S3 / S4 |
| `order_builder` | T6 §Order Draft (+ §Product Read By Id) | S4 |
| `payment_request` | T2 §Payment Request | S5 |
| `getOrder()` | T6 §Order Read | S3 |

Until each row's backend lands, the corresponding seam throws
`NotImplementedError('<seam>', '<contract ref>')` — searchable, self-documenting,
and safe (no fabricated data reaches a customer).
