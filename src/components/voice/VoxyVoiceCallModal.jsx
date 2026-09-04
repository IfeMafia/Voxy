"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import {
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Bot,
  MessageSquare,
  ShieldCheck,
  Loader2
} from "lucide-react";

export default function VoxyVoiceCallModal({
  isOpen,
  onClose,
  business,
  employeeName = "Voxy",
  customerName = "Customer",
  conversationId,
  onNewMessage
}) {
  const [callStatus, setCallStatus] = useState("connecting"); // "connecting" | "speaking" | "listening" | "thinking" | "ended"
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [lastAgentMessage, setLastAgentMessage] = useState("");
  const [activeVoiceWave, setActiveVoiceWave] = useState([12, 24, 18, 32, 20, 16, 28, 14]);

  const recognitionRef = useRef(null);
  const audioPlayerRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const isCallActiveRef = useRef(false);
  const isMutedRef = useRef(false);
  const isSpeakerMutedRef = useRef(false);
  const handleUserSpeechRef = useRef(null);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    isSpeakerMutedRef.current = isSpeakerMuted;
  }, [isSpeakerMuted]);

  // Fallback client-side speech synthesis
  const playFallbackSpeech = useCallback((text, onFinish) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      if (onFinish) onFinish();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const clean = text.replace(/[*_#`[\]]/g, "").slice(0, 300);
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.lang = "en-NG";

      utterance.onend = () => {
        if (onFinish) onFinish();
      };
      utterance.onerror = () => {
        if (onFinish) onFinish();
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      if (onFinish) onFinish();
    }
  }, []);

  // Listen for user speech
  const listenForSpeech = useCallback((onResult) => {
    if (isMutedRef.current || isSpeakingRef.current || !isCallActiveRef.current) return;

    const SpeechRecognition =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (!SpeechRecognition) {
      setLiveTranscript("Speech recognition not supported in this browser.");
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-NG";

      let finalTranscript = "";

      recognition.onstart = () => {
        if (!isSpeakingRef.current && isCallActiveRef.current) {
          setCallStatus("listening");
        }
      };

      recognition.onresult = (event) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTranscript += item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }
        setLiveTranscript(finalTranscript || interim);
      };

      recognition.onend = () => {
        if (finalTranscript && finalTranscript.trim()) {
          onResult(finalTranscript);
        } else if (isCallActiveRef.current && !isSpeakingRef.current && !isMutedRef.current) {
          setTimeout(() => {
            if (isCallActiveRef.current && !isSpeakingRef.current && !isMutedRef.current) {
              try { recognition.start(); } catch {}
            }
          }, 400);
        }
      };

      recognition.onerror = () => {
        // Ignore normal no-speech timeouts
      };

      recognition.start();
    } catch (e) {
      console.warn("[VoiceCall] Recognition start warning:", e);
    }
  }, []);

  // Speak text via TTS
  const playAgentResponse = useCallback(async (text, onFinishedSpeaking) => {
    if (!text || isSpeakerMutedRef.current) {
      if (onFinishedSpeaking) onFinishedSpeaking();
      return;
    }

    isSpeakingRef.current = true;
    setCallStatus("speaking");
    setLastAgentMessage(text);

    const finish = () => {
      isSpeakingRef.current = false;
      if (onFinishedSpeaking && isCallActiveRef.current) {
        onFinishedSpeaking();
      }
    };

    try {
      const res = await fetch("/api/assistant/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          voice: business?.voice || business?.aiConfig?.voice || "Chinenye",
          language: business?.supportedLanguages?.[0] || "english"
        }),
      });
      const data = await res.json();

      if (data.success && data.audioUrl) {
        if (!audioPlayerRef.current) {
          audioPlayerRef.current = new Audio();
        }
        const audio = audioPlayerRef.current;
        audio.src = data.audioUrl;
        audio.onended = finish;
        audio.onerror = () => playFallbackSpeech(text, finish);
        await audio.play();
        return;
      }
    } catch {
      // Fallback
    }

    playFallbackSpeech(text, finish);
  }, [playFallbackSpeech]);

  // Process user speech via assistant
  const handleUserSpeech = useCallback(async (speechText) => {
    if (!speechText || !speechText.trim()) return;

    setCallStatus("thinking");
    setLiveTranscript(speechText);

    if (onNewMessage) {
      onNewMessage({ role: "user", content: speechText });
    }

    try {
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business?.id,
          conversationId,
          customerName: customerName !== "Customer" ? customerName : undefined,
          message: speechText,
          stream: false,
        }),
      });

      const data = await res.json();
      const reply =
        data.message?.content ||
        data.reply ||
        "I understand. How else can I assist you with our store?";

      if (onNewMessage) {
        onNewMessage({ role: "assistant", content: reply, intent: data.intent });
      }

      await playAgentResponse(reply, () => {
        if (isCallActiveRef.current) {
          setCallStatus("listening");
          listenForSpeech((speech) => handleUserSpeechRef.current?.(speech));
        }
      });
    } catch (err) {
      console.error("[VoiceCall] Assistant reply error:", err);
      const errReply = "I had a brief glitch reaching our store. Could you please repeat that?";
      await playAgentResponse(errReply, () => {
        if (isCallActiveRef.current) {
          setCallStatus("listening");
          listenForSpeech((speech) => handleUserSpeechRef.current?.(speech));
        }
      });
    }
  }, [business, conversationId, customerName, listenForSpeech, onNewMessage, playAgentResponse]);

  useEffect(() => {
    handleUserSpeechRef.current = handleUserSpeech;
  }, [handleUserSpeech]);

  // Call lifecycle
  useEffect(() => {
    if (!isOpen) return;

    isCallActiveRef.current = true;

    // Start timer & wave in timeout to prevent cascading renders
    const setupTimer = setTimeout(() => {
      setCallDuration(0);
      setCallStatus("connecting");
      setLiveTranscript("");
      setLastAgentMessage("");
    }, 0);

    const timerInterval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    const waveInterval = setInterval(() => {
      setActiveVoiceWave([
        Math.floor(Math.random() * 28) + 8,
        Math.floor(Math.random() * 40) + 12,
        Math.floor(Math.random() * 32) + 10,
        Math.floor(Math.random() * 48) + 16,
        Math.floor(Math.random() * 36) + 12,
        Math.floor(Math.random() * 44) + 14,
        Math.floor(Math.random() * 24) + 8,
        Math.floor(Math.random() * 30) + 10,
      ]);
    }, 120);

    // Initial greeting chime & voice
    const greetingTimer = setTimeout(() => {
      if (!isCallActiveRef.current) return;
      const greeting =
        business?.aiConfig?.voiceGreeting ||
        `Good day! Welcome to ${business?.name || "our store"}. I am ${employeeName}, your AI sales assistant. What can I get for you today?`;

      playAgentResponse(greeting, () => {
        if (isCallActiveRef.current) {
          setCallStatus("listening");
          listenForSpeech((speech) => handleUserSpeechRef.current?.(speech));
        }
      });
    }, 1100);

    return () => {
      clearTimeout(setupTimer);
      clearTimeout(greetingTimer);
      clearInterval(timerInterval);
      clearInterval(waveInterval);
      isCallActiveRef.current = false;
      if (recognitionRef.current) recognitionRef.current.abort();
      if (audioPlayerRef.current) audioPlayerRef.current.pause();
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isOpen, business?.name, business?.aiConfig?.voiceGreeting, employeeName, handleUserSpeech, listenForSpeech, playAgentResponse]);

  const handleEndCall = () => {
    isCallActiveRef.current = false;
    setCallStatus("ended");
    if (recognitionRef.current) recognitionRef.current.abort();
    if (audioPlayerRef.current) audioPlayerRef.current.pause();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setTimeout(() => {
      onClose();
    }, 400);
  };

  if (!isOpen) return null;

  const minutes = Math.floor(callDuration / 60);
  const seconds = callDuration % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0C0E14] border border-white/[0.12] rounded-3xl shadow-2xl overflow-hidden flex flex-col items-center text-center p-8">
        {/* Subtle glow backdrop */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#00D18F]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Business Bar */}
        <div className="relative z-10 space-y-1 mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs text-zinc-300 mb-2">
            <ShieldCheck className="size-3.5 text-[#00D18F]" />
            <span>Voxy Voice Direct Line</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {business?.name || "Business Storefront"}
          </h2>
          <p className="text-xs text-zinc-400">
            Speaking with <strong className="text-zinc-200">{employeeName}</strong> (AI Employee)
          </p>
        </div>

        {/* Central Visualizer & Avatar */}
        <div className="relative my-6 flex items-center justify-center">
          {(callStatus === "speaking" || callStatus === "listening") && (
            <div className="absolute inset-0 size-40 -translate-x-4 -translate-y-4 rounded-full border border-[#00D18F]/30 animate-ping opacity-25" />
          )}

          <div className="relative size-32 rounded-3xl bg-[#141822] border-2 border-[#00D18F]/40 flex items-center justify-center shadow-2xl overflow-hidden group">
            {business?.logoUrl ? (
              <Image
                src={business.logoUrl}
                alt={business.name || "Business Logo"}
                width={128}
                height={128}
                unoptimized
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="size-full bg-gradient-to-br from-[#00D18F]/25 to-zinc-900 flex items-center justify-center">
                <Bot className="size-12 text-[#00D18F]" />
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Voice Waveform Bars */}
        <div className="h-12 flex items-center justify-center gap-1.5 my-2">
          {activeVoiceWave.map((h, idx) => (
            <div
              key={idx}
              style={{
                height:
                  callStatus === "speaking" || callStatus === "listening"
                    ? `${h}px`
                    : "6px",
              }}
              className={`w-1.5 rounded-full transition-all duration-150 ${
                callStatus === "speaking"
                  ? "bg-[#00D18F]"
                  : callStatus === "listening"
                  ? "bg-emerald-400"
                  : "bg-zinc-700"
              }`}
            />
          ))}
        </div>

        {/* Status Callout & Duration */}
        <div className="space-y-1.5 my-4">
          <div className="flex items-center justify-center gap-2">
            <span
              className={`size-2 rounded-full ${
                callStatus === "speaking" || callStatus === "listening"
                  ? "bg-[#00D18F] animate-pulse"
                  : callStatus === "thinking"
                  ? "bg-amber-400 animate-spin"
                  : "bg-zinc-500"
              }`}
            />
            <span className="text-sm font-semibold text-white tracking-tight capitalize">
              {callStatus === "connecting" && "Connecting to Voxy Voice..."}
              {callStatus === "speaking" && `${employeeName} is speaking...`}
              {callStatus === "listening" && "Listening to you speak..."}
              {callStatus === "thinking" && "Processing request..."}
              {callStatus === "ended" && "Call Ended"}
            </span>
          </div>

          <div className="text-xs text-zinc-400 font-mono tracking-wider tabular-nums">
            {formattedTime}
          </div>
        </div>

        {/* Live Speech Captions */}
        <div className="w-full max-h-20 overflow-y-auto p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-xs text-zinc-300 text-left my-2 custom-scrollbar">
          {callStatus === "speaking" && lastAgentMessage && (
            <p className="line-clamp-2 italic text-zinc-300">
              <strong className="text-[#00D18F] not-italic">{employeeName}: </strong>
              &ldquo;{lastAgentMessage}&rdquo;
            </p>
          )}
          {callStatus === "listening" && (
            <p className="line-clamp-2 text-zinc-200">
              <strong className="text-zinc-400">You: </strong>
              {liveTranscript || "Speak naturally, Voxy is listening..."}
            </p>
          )}
          {callStatus === "thinking" && (
            <p className="flex items-center gap-1.5 text-zinc-400">
              <Loader2 className="size-3 animate-spin text-[#00D18F]" />
              <span>Consulting catalogue & pricing...</span>
            </p>
          )}
        </div>

        {/* Call Action Controls */}
        <div className="w-full pt-6 flex items-center justify-around">
          {/* Mute Mic */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`size-12 rounded-2xl flex items-center justify-center transition-all border ${
              isMuted
                ? "bg-red-500/20 border-red-500/30 text-red-400"
                : "bg-white/[0.06] border-white/[0.1] text-zinc-300 hover:text-white hover:bg-white/[0.1]"
            }`}
            title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
          >
            {isMuted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
          </button>

          {/* End Call Button (Big Red) */}
          <button
            onClick={handleEndCall}
            className="size-16 rounded-3xl bg-red-600 hover:bg-red-500 active:scale-95 text-white flex items-center justify-center shadow-xl shadow-red-600/30 transition-all"
            title="End Call"
          >
            <PhoneOff className="size-7" />
          </button>

          {/* Speaker Mute */}
          <button
            onClick={() => setIsSpeakerMuted(!isSpeakerMuted)}
            className={`size-12 rounded-2xl flex items-center justify-center transition-all border ${
              isSpeakerMuted
                ? "bg-amber-500/20 border-amber-500/30 text-amber-400"
                : "bg-white/[0.06] border-white/[0.1] text-zinc-300 hover:text-white hover:bg-white/[0.1]"
            }`}
            title={isSpeakerMuted ? "Unmute Speaker" : "Mute Speaker"}
          >
            {isSpeakerMuted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
          </button>
        </div>

        {/* Switch to Chat link */}
        <button
          onClick={handleEndCall}
          className="mt-6 inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <MessageSquare className="size-3.5" />
          <span>Switch to text chat</span>
        </button>
      </div>
    </div>
  );
}
