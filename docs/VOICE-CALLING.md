# VoxyVoice Voice Calling & YarnGPT Integration Architecture

This document provides complete technical documentation for the **VoxyVoice ChatGPT-Style Voice Calling** implementation powered by **YarnGPT** for authentic Nigerian voice synthesis and integrated with the existing VoxyVoice AI Agent.

---

## 1. Overview & Architecture

VoxyVoice provides an interactive, hands-free voice conversation mode allowing storefront customers and business users to speak naturally with their AI representative.

### Voice Flow (Option B Pipeline)

```
                       USER MICROPHONE
                             │
                             ▼
              [Client MediaRecorder / SpeechRecognition]
                             │
                             ▼
               [POST /api/v1/voice/chat]
                             │
             ┌───────────────┴───────────────┐
             │                               │
             ▼                               ▼
    1. Speech-to-Text               User Text Message
  (Groq Whisper / Gemini)                    │
             │                               │
             └───────────────┬───────────────┘
                             │
                             ▼
                  2. Existing Voxy AI Agent
          (Grounded Catalog, Tools, Order Drafts)
                             │
                             ▼
                    Agent Text Response
                             │
                             ▼
                   3. YarnGPT Nigerian TTS
               (Fallback to EdgeTTS / Google)
                             │
                             ▼
                       AUDIO PLAYBACK
            (Client Web Audio Pitch Visualizer)
```

---

## 2. YarnGPT Integration Details

- **Provider File**: [`src/lib/ai/providers/voiceProvider.js`](file:///c:/Users/HP/Documents/voxyvoice/src/lib/ai/providers/voiceProvider.js)
- **API Endpoint**: `POST https://yarngpt.ai/api/v1/tts`
- **Supported Voices**: 13 authentic Nigerian voices:
  - `Chinenye` (Default), `Idera`, `Emma`, `Zainab`, `Osagie`, `Wura`, `Jude`, `Tayo`, `Regina`, `Femi`, `Adaora`, `Umar`, `Mary`
- **Authentication**: Bearer token using `process.env.YARNGPT_API_KEY` (kept strictly on server side).
- **Fallback**: If YarnGPT fails, key is omitted, or timeout (12s) occurs, the system automatically falls back to `HybridTtsProvider` (MsEdgeTTS / Google TTS).

---

## 3. Realtime Capabilities & Interruption (Barge-In)

- **Realtime Status**: **NOT SUPPORTED natively by YarnGPT API**. YarnGPT offers REST TTS synthesis rather than bidirectional WebRTC streams.
- **Client-Side Barge-in Interruption**:
  - When the user starts speaking while Voxy is speaking, or taps the interrupt control, the client immediately pauses audio playback (`audioPlayerRef.current.pause()`), aborts pending HTTP requests (`AbortController.abort()`), and sets status to `LISTENING`.

---

## 4. API Endpoints

### 1. Create Voice Session
```http
POST /api/v1/voice/sessions
Content-Type: application/json

{
  "businessId": "biz_uuid",
  "customerName": "John Doe",
  "voice": "Chinenye"
}
```

### 2. Voice Turn (Audio / Text -> STT -> Agent -> TTS)
```http
POST /api/v1/voice/chat
Content-Type: multipart/form-data (or application/json)

Form fields:
- businessId: string
- conversationId: string
- message: string (optional if audio is supplied)
- audio: File (WebM/WAV audio blob)
- voice: string
```

### 3. End Session
```http
POST /api/v1/voice/sessions/:id
Content-Type: application/json

{
  "action": "end"
}
```

---

## 5. Environment Variables

Add the following to `.env`:

```env
# YarnGPT Nigerian Voice Provider
YARNGPT_API_KEY=your_yarngpt_api_key_here
YARNGPT_BASE_URL=https://yarngpt.ai/api/v1/tts
YARNGPT_VOICE=Chinenye
```

Updated `.env.example` includes placeholders.

---

## 6. Verification & Automated Tests

To run the automated voice calling test suite:

```bash
node tests/voice/voiceCalling.test.js
```

To run the full project test suite:

```bash
npm test
```
