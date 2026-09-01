# VOXY — PRODUCT REQUIREMENTS DOCUMENT (V2)

> **This is the single source of truth for Voxy.** If any other doc, comment, or prior conversation disagrees with this file, this file wins. This replaces the old PRD.md, UI.md, and Documentation.md — those described Voxy V1 (a support-reply assistant) and are now superseded by the scope below.

---

## 1. What Voxy Is

Voxy is an **AI employee for businesses** — not a chatbot that answers questions, an agent that can actually talk to a customer, recommend the right product, take the order, get paid, and keep the business owner informed, in text or in voice, in English, Nigerian Pidgin, Yoruba, Hausa, or Igbo.

A traditional chatbot answers. Voxy acts. That is the entire difference between what already exists (V1) and what we are building now (V2).

## 2. Where We're Starting From (V1 Reality)

V1 is already built and partially working. Do not rebuild these from scratch — extend, fix, or replace only where V2 requires it.

**Already built and working:**
- Landing page
- Authentication (login/register)
- Basic dashboards (business + customer)
- Business profile creation
- Basic chat system (customer ↔ AI, thread-based, stored per customer-business pair)
- Slug-based routing (`/business-name`) instead of a complex ID system — keep this

**Known V1 issues to fix regardless of V2 scope:**
- Business profile update is broken
- Role-based routing flickers (bad UX)
- Conversation persistence has edge cases

**V1 scope that V2 is deliberately moving past:**
V1 was a support-reply assistant: customer messages in, Voxy interprets and replies. It had no product catalogue, no orders, no payments, and no sales behavior. V2 adds all of that — see Section 3.

## 3. What's New in V2 — The Agentic Rebuild

V2 turns Voxy from "answers questions" into "closes the sale and keeps the books straight." It adds a business side and a real transaction loop, and it adds voice as a new channel.

Two connected sides:
- **Customer Side** — the AI employee that talks, recommends, sells, confirms orders, and supports payment.
- **Business Side** — the dashboard where the owner manages products, prices, policies, orders, customers, payments, and agent settings.

### 3.1 Core capabilities (V2 scope)
- Answer inbound customer questions using only the business's real, approved information
- Recommend products/services based on stated customer needs and budget
- Take and confirm orders (explicit confirmation before anything financial happens — non-negotiable)
- Generate a payment request through one connected payment provider, verify payment before confirming to the customer
- Voice channel: customer can call and speak naturally instead of typing (YarnGPT as the text-to-speech layer)
- Multilingual: English, Nigerian Pidgin, Yoruba, Hausa, Igbo — consistent product names, prices, and rules across all languages
- Human handoff for anything unsupported, ambiguous, sensitive, or complex
- Every important agent action logged, so "why did this happen" always has a real, queryable answer

### 3.2 Explicitly out of scope for V2 MVP
- Multiple payment providers (one provider is enough for the hackathon build)
- Full voice personality/multilingual polish (S10/S11-equivalent work) — a basic working voice demo is enough
- Automated inventory management, advanced CRM, automated follow-up campaigns, delivery integrations, advanced analytics — all later-stage

## 4. Non-Negotiable Architecture Rules

These rules apply regardless of which stream (frontend/AI/backend) implements a given piece. Any agent working on this codebase must follow all of them:

1. **Voxy must act only on approved business information.** Never invent products, prices, stock, discounts, delivery times, or policies.
2. **Confirmation before commitment.** Any financially significant or otherwise important action requires explicit customer confirmation before it executes. This is the single most important rule in the product — it is the last thing to cut under time pressure, never the first.
3. **Explicit tool permissions.** The AI does not automatically get access to sensitive actions like refunds or price changes just because it's "an agent."
4. **One business brain.** Text and voice must share the same business brain, business data, order tools, and payment workflow. Voice is a different interface into the same agent, not a separate implementation.
5. **YarnGPT is voice/TTS only** — it is not the core reasoning layer.
6. **Payments go through a trusted provider.** Voxy must never handle raw payment details directly, and must never tell a customer a payment succeeded until the provider actually confirms it.
7. **Every important agent action is logged.**
8. **Human handoff must always be available** for unsupported, ambiguous, sensitive, or complex situations.

## 5. Roles & Users

- **Customer** — discovers/opens a business's Voxy link (or calls, for voice), converses with the AI, gets recommendations, places and confirms orders, pays.
- **Business** — manages their profile, catalogue, policies, agent configuration; views conversations, orders, payments, and operational data on their dashboard.
- **Admin** — platform-level oversight (carried over from V1 roles; scope of admin capabilities not yet finalized for V2 — flag as open item if implementing).

## 6. End-to-End Flow (What "Done" Looks Like)

1. Business signs up, builds their profile (name, logo, hours, delivery areas, policies) and adds their catalogue (products, prices, variants, images, availability).
2. Customer opens the business's shareable Voxy link, or calls (voice).
3. Voxy understands intent — question, recommendation request, order, complaint — using only real business data.
4. If it's a sales moment: Voxy asks one relevant question at a time, recommends based on stated needs/budget, explains value, handles objections, suggests a relevant add-on — without being pushy.

### 6.4 Sales Employee Behavior & Objection Handling (S5 / AI-105)
Voxy operates as a high-performing, consultative sales representative for the business:
- **Need Discovery (Single-Question Rule):** Ask exactly one targeted clarifying question at a time (e.g., budget range, specific variant/flavor, or delivery destination) rather than firing a barrage of questions that overwhelms the customer.
- **Value Articulation:** Emphasize business-approved selling points, craftsmanship, and verified customer benefits instead of merely listing dry technical specifications.
- **Objection Handling:**
  - *Price concerns:* Acknowledge budget considerations respectfully. Suggest an approved budget-friendly alternative from the verified catalogue. **STRICT RULE:** Never fabricate unauthorized discounts, concessions, or promo codes.
  - *Delivery time concerns:* Truthfully cite approved delivery policies and dispatch timelines without inventing rush delivery guarantees.
  - *Sizing and Fit:* Cite return/exchange policies and guide customer on measurements.
  - *Authenticity/Trust:* Reassure customers with verified provenance, warranty, and formal transaction receipts.
- **Non-Pushy Upselling & Cross-Selling:** Suggest at most one complementary add-on item (e.g. screen protector or protective case for a phone) only after core customer interest has been established.
- **Tone:** Professional, consultative, culturally relevant, polite, and strictly aligned with verified business policies.

5. Before anything financial happens, Voxy summarizes exactly what was understood (items, quantities, total) and waits for explicit confirmation.
6. Once confirmed, Voxy requests a payment link through the connected provider. It never touches card details directly, and never confirms payment until the provider does.
7. Order is marked paid, a receipt is generated, the dashboard updates, and the business owner can see the whole thing without reading the raw chat log.

## 7. Voice (New in V2)

Voice is not a separate brain — same Voxy, different mouth and ears. Four real-time parts: phone/voice connection → speech-to-text → the Voxy reasoning layer → text-to-speech (YarnGPT). Business knowledge and tools sit around all of it exactly as they do for text.

Voice-specific behavioral rules:
- One or two sentences per turn
- One question at a time
- No long menus read aloud
- Repeat the final order and total before confirming — a caller can't scroll back up to reread what Voxy said

## 8. Tech Stack

**Frontend**
- Next.js
- TailwindCSS + shadcn/ui
- Zustand for state management (carried over from V1)

**Backend & Database**
- Node.js backend
- PostgreSQL, hosted on **Neon** (V2 target — V1 used a more general Postgres setup; Neon is the direction going forward)

**AI Layer**
- **Reasoning model: `gemini-2.5`, served through the Cencori gateway** (locked in S2), with an automatic fallback ladder of Groq `llama-3.3-70b-versatile` → Google `gemini-2.0-flash`. Chosen because it gives strong multilingual coverage for the five target Nigerian languages at the sub-2s latency voice needs, and it is the path the resilient provider chain (`src/lib/ai/aiProvider.js`) already exercises — so S2 is additive, not a rewrite. The choice lives as a code constant in `src/lib/ai/agent/model.js` (`REASONING_MODEL`) as the single source of truth.
- YarnGPT for voice/TTS output specifically (not the reasoning layer)

**Storage**
- Audio, assets, and business images: storage layer TBD — confirm before A6/T5 implementation whether this stays on the V1 storage approach or moves.

> **Open item:** the exact storage provider is not locked as of this doc (the AI reasoning model is now locked above, in S2). Whoever picks up the storage-dependent tasks should update this section with the final decision — don't leave it undocumented once chosen.

## 9. Team & Ownership

Three developers, three parallel streams, each a sequential linear chain of small tasks rather than one massive "build the AI" or "build the backend" task:

- **Abraham — Frontend / UX** (A1 → A11): rebrand, onboarding, catalogue UI, dashboard, customer chat, orders, payments UI, voice UI.
- **Samkiel — AI / Agent / Customer Experience** (S1 → S11): model integration, business knowledge grounding, conversation engine, sales behavior, product tools, order agent, confirmation/payment agent, voice AI (YarnGPT), voice personality, Nigerian language support.
- **Tobi — Backend / Business Systems** (T1 → T11): Neon setup, auth, business backend, product backend, customer backend, order backend, payment integration, virtual account/wallet, receipts, business operations.

Each stream runs independently but interlocks at specific integration points (e.g. A4 needs T3's auth contract; A5 needs T4 and S3; A8 needs S4–S6). The full task breakdown and dependency map lives in Linear (`VOXY` project, IFEMAFIA team) — issues IFE-21 through IFE-53 — not duplicated here to avoid drift between two sources of truth.

Rule: move to the next task in your stream as soon as the current one is finished and testable. Don't wait to "finish AI" before frontend starts using it.

## 10. MVP Priority Order

1. Business onboarding
2. Business profile and product catalogue
3. Business knowledge and AI configuration
4. Shareable customer chat
5. AI sales/customer-service agent
6. Product recommendations
7. Order creation and confirmation
8. One payment integration
9. Business operations dashboard
10. Basic customer/order history
11. Human handoff
12. Basic voice interaction (if feasible — stretch, not baseline)

## 11. Why This Approach (Not Just "Add AI to a Chat Widget")

The lazy version of this product is a chatbot with a nice UI. Voxy is worth building this way because a business doesn't need something that can discuss its products — it needs something that can actually close the sale and keep the books straight. That only works if every claim is grounded in real data, every financial action is confirmed, every action is logged, and the AI's tool permissions are explicit and limited. That's the actual product; the chat window is just the visible surface of it.

## 12. Target Events / Traction Goals

Building toward: **Startup Abuja** and **Tobams Group** hackathons.

Minimum traction signal needed: one working end-to-end flow (chat/call → recommendation → order confirmation → payment → business notification), demoed cleanly, beats a wide feature set that's half-working on stage.

## 13. Metrics That Matter

- Number of conversations
- Active businesses
- Order completion / response success rate
- User retention (even if small)

## 14. Definition of Done (Every Task)

- Implementation committed to the shared repository
- Tested locally
- Expected success and error states handled
- No known broken path introduced from the previous task
- API/interface assumptions documented when another developer depends on them
- The next developer can continue without reconstructing the previous developer's work
- Integration points identified before marking complete

---

## Appendix: Source Documents

This PRD consolidates and supersedes:
- The original `PRD.md`, `UI.md`, and `Documentation.md` (V1 — support-reply assistant scope, Express/Gemini-Mistral stack, Tobi-full-stack/Abraham-UI-only role split)
- `Voxy — AI Employee for Businesses` product documentation (V2 target scope)
- `Voxy Voice — AI Employee for Businesses` voice-specific documentation (V2 target scope)
- `VOXY_V2_Linear_Developer_Task_Document` (V2 task breakdown, now mirrored in Linear)

Where these sources conflicted, this document resolved the conflict in favor of the **V2 agentic scope** as the current target, while preserving V1's working implementation and stack choices (Next.js, TailwindCSS/shadcn, Zustand, PostgreSQL) where V2 docs didn't specify otherwise.