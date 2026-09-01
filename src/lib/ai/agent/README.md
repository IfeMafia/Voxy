# Voxy Agent Layer (`src/lib/ai/agent`)

> Introduced in **S1**. Additive scaffolding for the V2 agentic rebuild. With one
> exception (the reasoning pass-through), nothing here is wired into the live
> request path yet — the existing chat (`/api/assistant/chat`) and voice
> (`/api/voice`) routes keep working untouched. S2–S7 fill these boundaries in
> behind a stable surface.

## Why this layer exists

V1 was a support-reply assistant: it answered questions. V2 is an agent: it looks
things up, drafts orders, and requests payment — on behalf of a real business,
about real money. That raises the stakes, so the architecture is built around the
PRD's non-negotiables (`public/docs/PRD.md` §4) as **structural** guarantees, not
as things we remember to check:

| PRD rule | Where it lives in this layer |
|---|---|
| §4.1 Never invent business data | `BusinessDataGateway` is the only way to read facts; tools must go through it |
| §4.2 Confirm before commitment | `paymentTool.execute` hard-stops with `ConfirmationRequiredError` unless confirmed |
| §4.3 Explicit tool permissions | `ToolRegistry.resolve` refuses a tool whose permission wasn't granted this turn |
| §4.4 One business brain | Same `runReasoning` / tools serve text and voice |
| §4.6 Payments via trusted provider | `paymentTool` only *requests*; it can never report a charge as successful |

## The three boundaries

```
customer input
      │
      ▼
┌─────────────────┐     ┌──────────────────────────────┐
│  reasoning.js   │────▶│ tools/ (registry + 3 tools)  │
│  runReasoning() │     │  product · order · payment   │
└────────┬────────┘     └───────────────┬──────────────┘
         │                              │
         │  both read facts ONLY through │
         ▼                              ▼
              ┌──────────────────────────┐
              │     businessData.js      │
              │  BusinessDataGateway     │  ──▶ Tobi's backend (T1/T2/T6)
              └──────────────────────────┘
```

1. **Reasoning layer** (`reasoning.js`) — the model boundary. Turns a grounded
   request (`ReasoningRequest`) into a normalised answer (`ReasoningResponse`).
   In S1 it delegates to the existing `generateAIResponse` → `generateAI`
   resilient chain (Cencori → Groq → Gemini). **S2** formalises the
   system-instruction builder, the conversation-context input, and structured
   fallback, and locks the model choice in PRD §8.

2. **Tool interfaces** (`tools/`) — the *only* side-effecting surface.
   - `product_lookup` (read catalogue) · `order_builder` (draft order) ·
     `payment_request` (request payment).
   - Each declares one permission from `ToolPermission`. `ToolRegistry` enforces
     that permission at resolve time.
   - All three are interface-complete but throw `NotImplementedError` (except the
     payment confirmation gate, which is real now) until their backend contracts
     land. **S4/S5** implement them.

3. **Business-data access** (`businessData.js`) — `BusinessDataGateway`, the
   single approved-data read seam. Profile grounding currently lives in
   `src/lib/ai-context.js`; **S3** consolidates it here and wires catalogue reads
   to the real endpoints documented in `AI_AGENT_BACKEND_CONTRACTS.md`.

## What S1 delivered vs. deferred

- **Delivered:** the boundaries above, the shared type surface (`types.js`), typed
  errors (`errors.js`), the permissioned registry, and the documented backend
  contracts. The confirmation and permission guardrails are live logic today.
- **Deferred (by design):** real catalogue/order/payment behaviour (needs T1/T2/T6),
  the S2 model wiring, and the S6 orchestration loop that ties reasoning + tools
  together per turn. These fail loudly (`NOT_IMPLEMENTED` with a contract pointer)
  rather than silently returning fake data.

## Using it

```js
import {
  runReasoning,
  createDefaultToolRegistry,
  createBusinessDataGateway,
  ToolPermission,
} from '@/lib/ai/agent';

const registry = createDefaultToolRegistry();      // 3 tools registered, none callable without a grant
const data = createBusinessDataGateway({ businessId, db });

// resolve() throws PermissionDeniedError unless the permission was granted this turn
const tool = registry.resolve('product_lookup', [ToolPermission.READ_CATALOGUE]);
```

See `public/docs/AI_AGENT_BACKEND_CONTRACTS.md` for the backend endpoints this
layer expects from Tobi's stream.
