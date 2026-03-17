# 🔥 VOXY — PRODUCT REQUIREMENTS DOCUMENT (PRD)

## 1. Overview

**Product Name:** VOXY  
**Category:** AI Voice Assistant for Local Businesses  
**Core Idea:**  
VOXY enables local businesses to interact with customers using AI-powered chat + voice, acting like a smart assistant that understands business context and responds instantly.

## 2. Problem

**Local businesses:**
- Miss customer messages
- Respond late or inconsistently
- Can’t scale conversations
- Don’t have structured digital presence

**Customers:**
- Don’t get fast answers
- Have poor interaction experience
- Drop off quickly

## 3. Solution

**VOXY provides:**
- A dedicated AI assistant per business
- Chat interface for customers
- Business-controlled knowledge + responses
- Voice + text interaction (core differentiator)

## 4. Core Features (Current Scope)

### 🔹 Authentication & Roles
**Roles:**
- Customer
- Business
- Admin
- Role-based routing (fix already identified)

### 🔹 Business Dashboard
- Create & manage business profile
- Update business info (currently broken → MUST FIX)
- Configure assistant behavior
- View conversations

### 🔹 Customer Experience
- Discover/search businesses
- Access via slug URL: `/business-name`
- Chat instantly with AI assistant
- Persistent conversations

### 🔹 AI Assistant
- Context-aware responses
- Uses business data
- **Future:**
  - Voice input/output
  - Multi-language (important for local markets)

### 🔹 Conversations System
- Thread-based chats
- Stored per customer-business pair
- Resume previous chats

## 5. What You’ve Built (Reality Check)

From your current state:
- ✅ Landing page
- ✅ Authentication (login/register)
- ✅ Basic dashboards (business + customer)
- ✅ Business profile creation
- ✅ Chat system working (basic)

⚠️ **Issues:**
- Business profile update not working
- Routing flicker (bad UX)
- Conversation persistence edge cases

## 6. What You REMOVED / SIMPLIFIED (Good Move)

- No complex ID system → replaced with slug-based routing
- Focused on core interaction first, not overbuilding admin
- Prioritized chat before voice (correct sequencing)

## 7. Immediate Next Milestones (This is where you win)

### Week 2 (Current)
- Fix profile update
- Fix role-based routing (no flicker)
- Clean conversation persistence
- Polish UI (minimum viable clean)

### Week 3
- Add Voice input (basic)
- Assistant customization (prompt control)
- Deploy stable version
- Get first real users

### Traction Goals (MANDATORY)
*You need at least ONE of these for points:*
- First user ✅
- 10 users (better)
- Working AI feature (you already have this → document it!)

## 8. Metrics That Matter

Forget vanity. Track:
- Number of conversations
- Active businesses
- Response success rate
- User retention (even if small)

## 9. Tech Direction

- **Frontend:** Next.js, TailwindCSS + shadcn/ui
- **Backend:** Supabase (migrating from Neon — good move)
- **Storage:** Supabase buckets (audio, assets)
- **AI Layer:**
  - Start simple
  - Later integrate multi-LLM (fits hackathon partner advantage)
