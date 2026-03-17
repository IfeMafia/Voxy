# Voxy 🌍🎙️

> Speak the Language of Your People. Empower your business with an AI voice assistant that understands local dialects and nuances.

An AI voice assistant built for small businesses in Africa, helping them respond to customer voice or text queries in multiple native languages (Pidgin, Yoruba, Swahili, and 10+ more). 


## 🚀 Building in Public

We are proudly building VOXY as part of the African Tech Journal Hackathon.

[![Building with African Tech Journal](https://img.shields.io/badge/Building%20with-African%20Tech%20Journal-black?style=for-the-badge)](#)

Follow our journey as we ship, learn, and grow in public.

#BuildInPublicATJ

---

## 🚀 The Problem
Small businesses in emerging markets often struggle to manage customer inquiries, orders, and support during peak hours. Furthermore, standard AI solutions struggle with local accents, dialects, and code-switching (e.g., blending English with Pidgin or local languages), leading to frustrating customer experiences.

## 💡 Our Solution
**Voxy** is an intelligent voice and text assistant tailored specifically for African businesses. It deeply understands native accents—not just translating, but truly comprehending local context. It seamlessly handles inquiries, takes orders, and provides support, ensuring no customer is left waiting.

## ✨ Key Features
- **Native Accents & Dialects:** Deeply trained to understand and speak Pidgin, Yoruba, Swahili, and more.
- **Lightning Fast:** Optimized response times (< 1s) to keep customers engaged without awkward pauses.
- **Privacy First:** Local processing options available for sensitive business data.
- **Omnichannel Support:** Handles both voice notes and text messages.
- **Business Dashboard:** Track conversations, manage business settings, and view AI performance analytics.

---

## 🛠️ Tech Stack

**Frontend:**
- Next.js (React 19)
- Tailwind CSS v4
- Framer Motion (Implicit/Tailwind Animations)

**Backend:**
- Node.js & Express.js
- PostgreSQL (pg)
- RESTful API Architecture

---

## ⚙️ How it Works
1. **Customer Interaction:** A customer sends a voice note or text in their local dialect.
2. **Processing:** The audio/text is sent to our backend where the AI transcribes and understands the intent, accounting for local slang and context.
3. **Action:** The AI queries the business's specific knowledge base or inventory.
4. **Response:** A natural, culturally-aware response is generated and sent back via text or synthesized localized voice.

---

## 💻 Getting Started (Local Development)

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database
- NPM or Yarn

### 1. Clone the repository
```bash
git clone https://github.com/your-username/voxy.git
cd voxy
```

### 2. Setup the Backend
```bash
cd server
npm install
```
Create a `.env` file in the `server` directory and add your environment variables:
```env
PORT=5000
DATABASE_URL=your_postgres_connection_string
# Add other necessary API keys (OpenAI, ElevenLabs, etc.)
```
Start the backend server:
```bash
npm run dev
```

### 3. Setup the Frontend
Open a new terminal and navigate to the root directory:
```bash
# from the root 'voxy' directory
npm install
```
Start the Next.js development server:
```bash
npm run dev
```
Visit `http://localhost:3000` to view the application.

---

## 🔮 What's Next?
- Integration with WhatsApp Business API to handle messages directly in-app.
- Expanding language support to 20+ African languages.
- Voice cloning options for business owners to use their own voice.
- Automated inventory management syncing based on customer orders.

---

## 👥 Team
- **[Tobi](https://github.com/luponetn)** - Full Stack Developer
- **[Abraham](https://github.com/abraham123-dev)** - Frontend Developer
- **[SAMKIEL](https://github.com/samkiell)** - Full Stack Developer

*Built with ❤️ for the African Tech Journal Hackathon.*
