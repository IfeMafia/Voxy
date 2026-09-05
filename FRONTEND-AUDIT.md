# Voxy V2 — Frontend Audit

**Date:** September 4, 2026
**Auditor:** Antigravity AI
**Scope:** Full frontend codebase audit against API.md, codebase state, and V2 product requirements.

---

## IMPLEMENTED

- Auth system — useAuth hook, JWT in localStorage, session via GET /auth/me. Login, register, logout all working.
- Zustand store — useUserStore with persist hydration.
- API layer — src/lib/api/ with typed helpers for business, products, orders, customers, conversations. Central apiFetch wrapper with auth injection.
- DashboardLayout — Sidebar + Header composition, auth guard, loading state.
- Sidebar — All main nav links, Settings link, logout, user avatar at bottom. Dark theme, active state indicators.
- Overview/Dashboard — Greeting, stat cards, setup checklist with progress bar, Voxy share link, recent orders list, empty state.
- Products page — Grid view, add/edit/delete modal, availability toggle, price/discount, stock, tags, image URL. Good empty state.
- Orders page — Tab filters (all/draft/confirmed/paid/cancelled), order list table, order detail drawer with status machine actions. Status pills.
- Customers page — Customer list table, customer detail drawer with orders + conversations summary.
- Inbox page — Two-panel layout, status tabs, human takeover flow, reply composer, hand-back-to-Voxy action.
- Settings page — Full two-tab layout (Business Profile + AI Employee). All API fields mapped. Persists via PATCH /businesses/:id.
- AI Employee page — Standalone /business/ai with aiConfig fields. Saves to same backend endpoint.
- Wallet/Finance page — Balance cards, ledger transaction stream, withdrawal form.
- Public storefront route — /business/[businessSlug] renders BusinessStorefront component.
- Error handling — Most pages have try/catch with toast.error. Loading spinners are consistent.
- Backend Gaps documented — BACKEND-GAPS.md correctly documents 5 missing backend capabilities.

---

## INCOMPLETE

### 1. Dashboard — Wrong metrics and broken link
- StatCard for "Conversations" uses customers.length (wrong — should be conversation count).
- No revenue figure on dashboard despite orders having totalKobo available.
- getDashboardMetrics() is defined in src/lib/api/business.js but never called anywhere.
- The "Test Voxy" link points to /chat/${slug} but the public route is /business/${slug} — broken for all users.

### 2. AI Employee page — Duplicates Settings AI tab
- /business/ai and /business/settings (AI tab) have identical form state and save logic (~400 lines duplicated).
- /business/ai is missing the employeeName field that Settings has. They are out of sync.

### 3. Inbox — Inefficient and incomplete
- No GET /businesses/:id/conversations endpoint. Inbox works around this by fetching all customers (capped at 25) then each customer's conversations.
- Orange warning banner about missing backend is visible to real users in production.
- No search in conversation list.
- No unread indicator on conversation items.

### 4. Public storefront — Legacy V1 database query (CRITICAL)
- src/app/business/[businessSlug]/page.jsx uses raw db.query() against V1 schema columns: logo_url, is_live, use_ai_reply, business_hours, assistant_tone, lga, street_address, social_links.
- V2 uses getBusinessBySlug() from the API layer (GET /businesses/by-slug/:slug). This page was never migrated.
- Business owners update settings via V2 API but customers see V1 data. This is a critical bug.

### 5. Wallet — Finance endpoints not in API.md
- getWalletBalance() calls /api/v1/business/balance
- getLedgerTransactions() calls /api/v1/business/ledger
- requestWithdrawal() calls /api/v1/business/withdrawals
- None of these endpoints appear in API.md. Either undocumented or non-existent.

### 6. Customers — No search or filter
- No search input. Unusable with 100+ customers.
- No order count or revenue per customer shown in the list.

### 7. Orders — Revenue total computed but not rendered
- totalValueKobo is calculated on line 278 of orders/page.jsx but never rendered anywhere.

---

## BROKEN

### 1. Public storefront reads V1 schema — CRITICAL
src/app/business/[businessSlug]/page.jsx queries the database directly using V1 column names that do not exist in the V2 Prisma schema. Customers visiting the public Voxy link see stale or empty data.

### 2. Dashboard "Test Voxy" link wrong route
Hardcoded as /chat/${slug}. The public route is /business/${slug}. Broken for every user.

### 3. Dev warning banner visible in production Inbox
```
MISSING BACKEND: No /businesses/:id/conversations endpoint — conversations loaded by iterating customers (max 25).
```
This orange alert is rendered inside InboxPage with no environment check. Every user sees it.

### 4. Public storefront shows marketing Navbar
/business/[businessSlug] imports Navbar from /landing/sections/Navbar. Customers talking to a business AI see the SaaS marketing navigation bar.

### 5. Wallet endpoints may return 404
/api/v1/business/balance, /api/v1/business/ledger, /api/v1/business/withdrawals are not in API.md. If they do not exist, the Wallet page silently shows empty state with no error.

---

## MISSING — SUPPORTED BY API

### 1. getDashboardMetrics() — defined but never used
src/lib/api/business.js exports getDashboardMetrics() calling GET /api/v1/business/dashboard. Never called. Dashboard makes 4 parallel requests instead.

### 2. Product search — API supports ?q= param
GET /businesses/:id/products?q=... is documented. Products page has no search/filter input.

### 3. Product tag filter — API supports ?tag= param
GET /businesses/:id/products?tag=... is documented. Not exposed in UI.

### 4. Order conversation link — conversationId exists but not shown
Orders have a conversationId field. The order detail drawer does not link to the originating conversation.

### 5. Customer PATCH — endpoint exists but UI is read-only
PATCH /customers/:id is in the API contract. Customer drawer shows data only — no editing.

### 6. Customer conversations link — not shown in Customer drawer
GET /customers/:id/conversations is available. The Customer drawer shows a count but no link to conversation threads.

### 7. Pagination — nowhere implemented
Orders, Products, Customers all support limit/offset but no pagination controls exist in the frontend.

### 8. Revenue stat card on Dashboard
The orders returned by listOrders() have totalKobo. A revenue total can be computed client-side and shown without any new endpoint.

---

## MISSING FROM API / BACKEND GAPS

1. GET /businesses/:id/conversations — Inbox needs this. Currently a 25-customer workaround.
2. Image upload endpoint — Products only accept imageUrl string. No file upload.
3. Payment checkout link — POST /orders/:id/checkout does not exist. Customers cannot self-pay.
4. Role "agent" in messages — Human takeover messages are indistinguishable from AI replies.
5. Wallet/finance endpoints — /business/balance, /business/ledger, /business/withdrawals not in API.md.

---

## UI/UX ISSUES

High Priority:
1. Dashboard conversations stat shows wrong number (customers.length vs conversations).
2. "Test Voxy" link is broken (/chat/ vs /business/).
3. No revenue stat on dashboard — key business metric missing.
4. Production-visible dev warning banner in Inbox.
5. Products page has no search with 20+ products becomes unusable.

Medium Priority:
6. /business/ai duplicates Settings AI tab — confusing navigation.
7. Order list computes total revenue but never displays it.
8. Customer drawer is read-only — no inline editing.
9. Inbox has no unread indicator — all conversations look identical.
10. Settings "Save changes" saves all tabs simultaneously with no per-section saves.
11. Product delete uses window.confirm() — not accessible or styleable.
12. Wallet withdrawal form is inline — collapses poorly on mobile.

Low Priority:
13. Sidebar has no collapse/expand to icon-only mode.
14. No breadcrumbs on deep pages (order detail, customer drawer).
15. All loading states use centered spinner — skeletons would feel faster.
16. Page titles inconsistent with sidebar labels.

---

## RESPONSIVE ISSUES

1. Orders table (grid-cols-[1fr_auto_auto_auto]) breaks on screens under 400px.
2. Customers table has the same 4-column grid problem on mobile.
3. Inbox two-panel layout is side-by-side on all screen sizes — mobile needs single-panel toggle.
4. Settings Operating Hours row overflows on 375px with inputs + toggle button.
5. Wallet withdrawal form grid-cols-1 md:grid-cols-3 has no visual grouping on mobile stacked layout.

---

## TECHNICAL DEBT

1. /business/[businessSlug]/page.jsx uses raw SQL against V1 schema — must use V2 API.
2. /business/ai is a ~400 line duplicate of the Settings AI tab.
3. getDashboardMetrics() defined but unused.
4. supabase.js still in src/lib/ — legacy V1 client still referenced in NotificationsPopover.
5. window.confirm() for product deletion — replace with accessible inline confirm.
6. toast imported from two packages — react-hot-toast in most files, @/components/ui/toast in useAuth. Should be unified.
7. src/app/chat/ route directory still exists — legacy V1 chat that should be removed or redirected.
8. totalValueKobo computed but unused in Orders page (line 278).
9. Only 8 banks hardcoded in Wallet withdrawal form.
10. Inbox message list uses array index as React key — use message ID or timestamp.

---

## PRIORITY FIX LIST

| Priority | Fix | Impact | Effort |
|----------|-----|--------|--------|
| 1 | Fix /business/[businessSlug] to use V2 API (getBusinessBySlug) | Critical | Medium |
| 2 | Fix "Test Voxy" link /chat/ to /business/ | Critical | Trivial |
| 3 | Remove dev warning banner from Inbox | High | Trivial |
| 4 | Fix Dashboard conversations stat (wrong count) | High | Low |
| 5 | Add revenue stat card to Dashboard | High | Low |
| 6 | Add product search (q= param) to Products page | High | Low |
| 7 | Add customer search to Customers page | High | Low |
| 8 | Render totalValueKobo in Orders page header | Medium | Trivial |
| 9 | Link order to conversation in Order detail drawer | Medium | Low |
| 10 | Fix Orders + Customers table responsive on mobile | Medium | Medium |
| 11 | Fix Inbox single-panel mobile toggle | Medium | Medium |
| 12 | Remove or redirect /business/ai (duplicate of Settings) | Medium | Low |
| 13 | Verify Wallet finance endpoints exist on backend | Medium | Investigate |
| 14 | Remove marketing Navbar from public /business/[slug] page | High | Trivial |
| 15 | Add pagination to Orders and Products | Low | Medium |
| 16 | Sidebar collapse to icon-only | Low | High |
