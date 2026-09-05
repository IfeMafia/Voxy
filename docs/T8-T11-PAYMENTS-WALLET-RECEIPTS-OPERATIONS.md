# Voxy V2 T8–T11 Complete Technical Documentation

## T8 — Payment Integration
- Server-side total calculation: Order totals are calculated from database product prices and active discounts.
- Unique payment reference (`PAY_...`).
- Paystack REST API initialization & verification.
- HMAC-SHA512 Webhook signature validation.
- Safe idempotent event handling (`PaymentEvent`).

## T9 — Business Balance & Internal Ledger
- Business wallet with `availableBalanceKobo` and `pendingBalanceKobo`.
- Immutable double-entry financial ledger (`CREDIT`, `DEBIT`, `FEE`, `WITHDRAWAL`, `REVERSAL`).
- Withdrawal request processing with Paystack transfer recipient integration.
- Atomic balance reservation and failure reversal handling.

## T10 — Receipt System
- Automated, unique receipt generation on verified payment success (`REC-YYYYMMDD-HEX`).
- Complete snapshot of order line items, customer, business, and payment metadata.
- Authenticated retrieval endpoints.

## T11 — Business Operations
- Aggregated dashboard overview metrics endpoint.
- AI Agent activity logging (`AgentActivity`).
- System audit logging (`AuditLog`).
- Operational notification alerts (`Alert`).

## Webhook & Callback Routes
- Webhook Route: `/api/v1/payments/webhook`
- Callback Route: `/api/v1/payments/callback`
