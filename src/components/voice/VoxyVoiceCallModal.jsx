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
  Loader2,
  AlertCircle,
  Square,
  Send,
  CreditCard,
  ExternalLink,
  Globe,
  Check
} from "lucide-react";
import { extractPaymentUrl } from "@/lib/renderMessageContent";
import { openPaymentPopup } from "@/lib/checkoutPopup";

export default function VoxyVoiceCallModal({
  isOpen,
  onClose,
  business,
  employeeName = "Voxy",
  customerName = "Customer",
  conversationId: initialConvId,
  onNewMessage,
  onConversationCreated,
}) {
  const NIGERIAN_LANGUAGES = [
    {
      code: "pcm",
      name: "Nigerian Pidgin",
      label: "Pidgin",
      flag: "🇳🇬",
      subtitle: "How far! Wetin you wan buy?",
      greeting: (store, name) => `How far! Welcome to ${store}. My name na ${name}, your AI sales assistant. Wetin you wan buy today?`
    },
    {
      code: "yo",
      name: "Yoruba",
      label: "Yoruba",
      flag: "🇳🇬",
      subtitle: "Ẹ kàásán! Kí ni ẹ fẹ́ rà?",
      greeting: (store, name) => `Ẹ kàásán o! Ẹ ku abọ̀ sí ${store}. Emi ni ${name}, aṣoju AI yín. Kí ni ẹ fẹ́ rà lónìí?`
    },
    {
      code: "ig",
      name: "Igbo",
      label: "Igbo",
      flag: "🇳🇬",
      subtitle: "Ndeewo! Gịnị ka ị chọrọ ịzụ?",
      greeting: (store, name) => `Ndeewo! Ịnọọ na ${store}. M bụ ${name}, onye nnyemaka AI gị. Gịnị ka ị chọrọ ịzụ taa?`
    },
    {
      code: "ha",
      name: "Hausa",
      label: "Hausa",
      flag: "🇳🇬",
      subtitle: "Sannu! Menene kuke so ku saya?",
      greeting: (store, name) => `Sannu barka da zuwa ${store}. Ni ne ${name}, mataimakin AI naku. Menene kuke so ku saya a yau?`
    },
    {
      code: "en",
      name: "English",
      label: "English",
      flag: "🇬🇧",
      subtitle: "Hello! How can I help you today?",
      greeting: (store, name) => `Good day! Welcome to ${store}. I am ${name}, your AI sales assistant. What can I get for you today?`
    },
  ];

  const [callStep, setCallStep] = useState("select-language"); // "select-language" | "calling"
  const [selectedLanguage, setSelectedLanguage] = useState("pcm"); // default to Pidgin
  const selectedLanguageRef = useRef("pcm");

  useEffect(() => {
    selectedLanguageRef.current = selectedLanguage;
  }, [selectedLanguage]);

  const [callStatus, setCallStatus] = useState("connecting"); // "connecting" | "speaking" | "listening" | "thinking" | "interrupted" | "error" | "ended"
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [lastAgentMessage, setLastAgentMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [activeVoiceWave, setActiveVoiceWave] = useState([12, 24, 18, 32, 20, 16, 28, 14]);
  const [paymentUrl, setPaymentUrl] = useState(null); // Detected payment link from AI

  const conversationIdRef = useRef(initialConvId);
  const recognitionRef = useRef(null);
  const audioPlayerRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const isCallActiveRef = useRef(false);
  const isMutedRef = useRef(false);
  const isSpeakerMutedRef = useRef(false);
  const abortControllerRef = useRef(null);
  const hasGreetedRef = useRef(false);
  const turnProcessingRef = useRef(false);

  // Callback Refs to prevent Temporal Dead Zone (TDZ) hoisting errors
  const listenForSpeechRef = useRef(null);
  const handleUserTurnRef = useRef(null);
  const startMediaRecordingRef = useRef(null);
  const playFallbackSpeechRef = useRef(null);

  // Audio Recording & Voice Activity Detection (VAD) Refs
  const micStreamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const animFrameRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const silenceTimerRef = useRef(null);
  const isUserSpeakingRef = useRef(false);
  const lastSpeakTimeRef = useRef(0);

  // Direct DOM Refs for 60fps Hardware-Accelerated Waveform Animation
  const barRefs = useRef([]);
  const micAnalyserRef = useRef(null);
  const aiAnalyserRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Only inherit the parent conversationId when explicitly starting a new call
      // with a pre-existing conversation (e.g. resuming chat). For a fresh call,
      // initialConvId should be null so we create a new server-side conversation.
      conversationIdRef.current = initialConvId || null;
      setCallStep("select-language"); // Always show language selection screen first
    } else {
      // Always wipe the ref when modal closes so the NEXT call starts clean
      conversationIdRef.current = null;
    }
  }, [isOpen, initialConvId]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const liveTranscriptRef = useRef(liveTranscript);

  useEffect(() => {
    liveTranscriptRef.current = liveTranscript;
  }, [liveTranscript]);

  useEffect(() => {
    isSpeakerMutedRef.current = isSpeakerMuted;
  }, [isSpeakerMuted]);

  // Instant Barge-In / Interruption Handler
  const handleInterruptSpeech = useCallback(() => {
    if (audioPlayerRef.current) {
      try {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.currentTime = 0;
      } catch {}
    }

    if (typeof window !== "undefined" && window.speechSynthesis) {
      try { window.speechSynthesis.cancel(); } catch {}
    }

    if (abortControllerRef.current) {
      try { abortControllerRef.current.abort(); } catch {}
      abortControllerRef.current = null;
    }

    const wasBusy = isSpeakingRef.current || turnProcessingRef.current;
    isSpeakingRef.current = false;
    turnProcessingRef.current = false;

    if (wasBusy) {
      setCallStatus("interrupted");
      setTimeout(() => {
        if (isCallActiveRef.current) {
          setCallStatus("listening");
          startMediaRecordingRef.current?.();
        }
      }, 300);
    }
  }, []);

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

      const langLocales = { en: "en-NG", pcm: "en-NG", yo: "yo-NG", ha: "ha-NG", ig: "ig-NG" };
      utterance.lang = langLocales[selectedLanguageRef.current] || "en-NG";

      utterance.onend = () => { if (onFinish) onFinish(); };
      utterance.onerror = () => { if (onFinish) onFinish(); };

      window.speechSynthesis.speak(utterance);
    } catch {
      if (onFinish) onFinish();
    }
  }, []);

  useEffect(() => {
    playFallbackSpeechRef.current = playFallbackSpeech;
  }, [playFallbackSpeech]);

  // Start MediaRecorder chunk recording for VAD
  const startMediaRecording = useCallback(() => {
    if (!micStreamRef.current || isMutedRef.current || isSpeakingRef.current || !isCallActiveRef.current) return;

    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }

      audioChunksRef.current = [];
      const options = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? { mimeType: 'audio/webm;codecs=opus' }
        : MediaRecorder.isTypeSupported('audio/webm')
        ? { mimeType: 'audio/webm' }
        : {};

      const recorder = new MediaRecorder(micStreamRef.current, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.start(100); // Collect 100ms slices
    } catch (err) {
      console.warn("[VoiceCall] MediaRecorder start warning:", err);
    }
  }, []);

  useEffect(() => {
    startMediaRecordingRef.current = startMediaRecording;
  }, [startMediaRecording]);

  // Stop MediaRecorder and return audio blob safely with fallback timeout
  const stopMediaRecording = useCallback(() => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") {
        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        audioChunksRef.current = [];
        resolve(blob.size > 0 ? blob : null);
        return;
      }

      let timeoutId = null;
      let hasResolved = false;

      const finish = () => {
        if (hasResolved) return;
        hasResolved = true;
        if (timeoutId) clearTimeout(timeoutId);
        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        audioChunksRef.current = [];
        resolve(blob.size > 0 ? blob : null);
      };

      timeoutId = setTimeout(finish, 800);
      mediaRecorderRef.current.onstop = finish;

      try {
        mediaRecorderRef.current.stop();
      } catch {
        finish();
      }
    });
  }, []);

  // Listen for user speech using Web Speech API captions
  const listenForSpeech = useCallback((onResult) => {
    if (isMutedRef.current || !isCallActiveRef.current) return;

    const SpeechRecognition =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (!SpeechRecognition) return;

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      
      const langLocales = { en: "en-NG", pcm: "en-NG", yo: "yo-NG", ha: "ha-NG", ig: "ig-NG" };
      recognition.lang = langLocales[selectedLanguageRef.current] || "en-NG";

      let finalTranscript = "";

      recognition.onstart = () => {
        if (!isSpeakingRef.current && isCallActiveRef.current) {
          setCallStatus("listening");
        }
      };

      recognition.onresult = (event) => {
        let interim = "";
        let hasRealContent = false;
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTranscript += item[0].transcript;
            if (item[0].confidence > 0.5) hasRealContent = true;
          } else {
            interim += item[0].transcript;
          }
        }

        if (isSpeakingRef.current && hasRealContent) {
          handleInterruptSpeech();
        }

        setLiveTranscript(finalTranscript || interim);
      };

      recognition.onend = () => {
        if (finalTranscript && finalTranscript.trim()) {
          onResult(finalTranscript);
        } else if (isCallActiveRef.current && !isSpeakingRef.current && !turnProcessingRef.current && !isMutedRef.current) {
          // IMPORTANT: Always create a NEW SpeechRecognition instance — restarting a closed one silently fails
          setTimeout(() => {
            if (isCallActiveRef.current && !isSpeakingRef.current && !turnProcessingRef.current && !isMutedRef.current) {
              listenForSpeechRef.current?.(onResult);
            }
          }, 150);
        }
      };

      recognition.onerror = (event) => {
        // Suppress benign "no-speech" errors — just restart
        if (event.error === 'no-speech' || event.error === 'audio-capture') {
          // handled by onend
          return;
        }
        if (isCallActiveRef.current && !isSpeakingRef.current && !turnProcessingRef.current && !isMutedRef.current) {
          setTimeout(() => {
            if (isCallActiveRef.current && !isSpeakingRef.current && !turnProcessingRef.current && !isMutedRef.current) {
              listenForSpeechRef.current?.(onResult);
            }
          }, 400);
        }
      };
      recognition.start();
    } catch (e) {
      console.warn("[VoiceCall] Recognition warning:", e);
    }
  }, [handleInterruptSpeech]);

  useEffect(() => {
    listenForSpeechRef.current = listenForSpeech;
  }, [listenForSpeech]);

  // Speak text via YarnGPT or Hybrid TTS
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
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const res = await fetch("/api/assistant/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          voice: business?.voice || business?.aiConfig?.voice || "Chinenye",
          language: selectedLanguageRef.current || "pcm"
        }),
        signal: controller.signal
      });

      const data = await res.json();

      if (data.success && data.audioUrl && isSpeakingRef.current) {
        if (!audioPlayerRef.current) {
          audioPlayerRef.current = new Audio();
        }
        const audio = audioPlayerRef.current;
        audio.src = data.audioUrl;
        audio.onended = finish;
        audio.onerror = () => playFallbackSpeechRef.current?.(text, finish);
        await audio.play();
        return;
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
    }

    if (isSpeakingRef.current) {
      playFallbackSpeechRef.current?.(text, finish);
    }
  }, [business]);

  // Execute Voice Turn (Audio Blob OR Text -> STT -> AI Agent -> YarnGPT TTS)
  const handleUserTurn = useCallback(async ({ speechText, audioBlob }) => {
    if (turnProcessingRef.current || !isCallActiveRef.current) return;
    if (!speechText && (!audioBlob || audioBlob.size < 100)) return;

    turnProcessingRef.current = true;

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }

    isUserSpeakingRef.current = false;
    setLiveTranscript("");
    liveTranscriptRef.current = "";
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    const watchdogTimer = setTimeout(() => {
      if (turnProcessingRef.current && isCallActiveRef.current) {
        console.warn("[VoiceCall] Watchdog timeout after 25s. Force-resetting state...");
        turnProcessingRef.current = false;
        isSpeakingRef.current = false;
        setCallStatus("listening");
        startMediaRecordingRef.current?.();
      }
    }, 25000);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try { mediaRecorderRef.current.stop(); } catch {}
    }

    setCallStatus("thinking");
    if (speechText) setLiveTranscript(speechText);

    try {
      const formData = new FormData();
      if (business?.id) formData.append("businessId", business.id);
      if (conversationIdRef.current) formData.append("conversationId", conversationIdRef.current);
      formData.append("voice", business?.voice || business?.aiConfig?.voice || "Chinenye");
      formData.append("language", selectedLanguageRef.current || "pcm");

      if (audioBlob) {
        formData.append("audio", audioBlob, "user_speech.webm");
      }
      if (speechText) {
        formData.append("message", speechText);
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const res = await fetch("/api/v1/voice/chat", {
        method: "POST",
        body: formData,
        signal: controller.signal
      });

      const data = await res.json();
      clearTimeout(watchdogTimer);

      if (!data.success) {
        throw new Error(data.error || "Voice processing error");
      }

      if (data.conversationId) {
        conversationIdRef.current = data.conversationId;
        if (onConversationCreated) onConversationCreated(data.conversationId);
      }

      if (data.userTranscript) {
        setLiveTranscript(data.userTranscript);
        if (onNewMessage) {
          onNewMessage({ role: "user", content: data.userTranscript });
        }
      } else if (speechText && onNewMessage) {
        onNewMessage({ role: "user", content: speechText });
      }

      const reply = data.message?.content || "I understand. How else can I assist you with our store?";

      const detectedPayUrl = data.paymentUrl || extractPaymentUrl(reply);
      if (detectedPayUrl) setPaymentUrl(detectedPayUrl);

      if (onNewMessage) {
        onNewMessage({ role: "assistant", content: reply, intent: data.intent });
      }

      if (data.audioUrl && !isSpeakerMutedRef.current) {
        isSpeakingRef.current = true;
        setCallStatus("speaking");
        setLastAgentMessage(reply);

        if (!audioPlayerRef.current) {
          audioPlayerRef.current = new Audio();
        }
        const audio = audioPlayerRef.current;
        audio.src = data.audioUrl;
        audio.onended = () => {
          isSpeakingRef.current = false;
          turnProcessingRef.current = false;
          isUserSpeakingRef.current = false;
          if (isCallActiveRef.current) {
            setCallStatus("listening");
            startMediaRecordingRef.current?.();
            setTimeout(() => {
              if (isCallActiveRef.current && !turnProcessingRef.current && !isSpeakingRef.current) {
                listenForSpeechRef.current?.((text) => handleUserTurnRef.current?.({ speechText: text }));
              }
            }, 400);
          }
        };
        audio.onerror = () => {
          playFallbackSpeechRef.current?.(reply, () => {
            isSpeakingRef.current = false;
            turnProcessingRef.current = false;
            if (isCallActiveRef.current) {
              setCallStatus("listening");
              startMediaRecordingRef.current?.();
              listenForSpeechRef.current?.((text) => handleUserTurnRef.current?.({ speechText: text }));
            }
          });
        };
        try {
          await audio.play();
        } catch (playErr) {
          console.warn("[VoiceCall] audio.play() exception:", playErr?.message);
          audio.onerror();
        }
      } else {
        await playAgentResponse(reply, () => {
          isSpeakingRef.current = false;
          turnProcessingRef.current = false;
          if (isCallActiveRef.current) {
            setCallStatus("listening");
            startMediaRecordingRef.current?.();
            listenForSpeechRef.current?.((text) => handleUserTurnRef.current?.({ speechText: text }));
          }
        });
      }
    } catch (err) {
      clearTimeout(watchdogTimer);
      if (err.name === 'AbortError') {
        turnProcessingRef.current = false;
        return;
      }
      console.error("[VoiceCall] Turn error:", err);
      turnProcessingRef.current = false;
      const fallbacks = [
        "I didn't quite catch that clearly. Could you please say that once more?",
        "My line broke up for a quick second. What were you saying?",
        "Sorry about that, I missed your last phrase. Could you repeat that for me?",
        "I had a tiny audio hiccup on my end. Please go ahead and repeat what you said.",
        "Network was a bit shaky just now. What item were you asking about?"
      ];
      const errReply = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      await playAgentResponse(errReply, () => {
        isSpeakingRef.current = false;
        turnProcessingRef.current = false;
        if (isCallActiveRef.current) {
          setCallStatus("listening");
          startMediaRecordingRef.current?.();
          listenForSpeechRef.current?.((text) => handleUserTurnRef.current?.({ speechText: text }));
        }
      });
    }
  }, [business, onNewMessage, playAgentResponse]);

  useEffect(() => {
    handleUserTurnRef.current = handleUserTurn;
  }, [handleUserTurn]);

  // Trigger manual speech submit (e.g. clicking mic orb)
  const handleManualSubmitSpeech = useCallback(async () => {
    if (isSpeakingRef.current) {
      handleInterruptSpeech();
      return;
    }

    if (turnProcessingRef.current) return;

    const currentText = liveTranscriptRef.current || liveTranscript;
    const audioBlob = await stopMediaRecording();
    if (audioBlob || currentText.trim()) {
      handleUserTurn({ speechText: currentText, audioBlob });
    } else {
      if (isCallActiveRef.current && !turnProcessingRef.current && !isSpeakingRef.current) {
        startMediaRecordingRef.current?.();
      }
    }
  }, [handleInterruptSpeech, handleUserTurn, liveTranscript, stopMediaRecording]);

  // Call lifecycle, Session Registration & Web Audio Pitch Analyzer with VAD
  useEffect(() => {
    if (!isOpen || callStep !== "calling") return;

    isCallActiveRef.current = true;
    hasGreetedRef.current = false;
    turnProcessingRef.current = false;
    setPaymentUrl(null);

    // Start session via /api/v1/voice/sessions
    const initVoiceSession = async () => {
      try {
        const res = await fetch("/api/v1/voice/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessId: business?.id,
            conversationId: conversationIdRef.current,
            customerName,
            voice: business?.voice || business?.aiConfig?.voice || "Chinenye",
            language: selectedLanguageRef.current || "pcm"
          })
        });
        const data = await res.json();
        if (data.success && data.session) {
          setSessionId(data.session.id);
          if (data.session.conversationId) {
            conversationIdRef.current = data.session.conversationId;
            if (onConversationCreated) onConversationCreated(data.session.conversationId);
          }
        }
      } catch (e) {
        console.warn("[VoiceCall] Session creation fallback:", e);
      }
    };

    initVoiceSession();

    setCallDuration(0);
    setCallStatus("connecting");
    setLiveTranscript("");
    setLastAgentMessage("");
    setErrorMessage("");

    const timerInterval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    const initAudioPitchAnalyzer = async () => {
      try {
        const AudioContextClass = typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);
        if (!AudioContextClass || !navigator.mediaDevices?.getUserMedia) {
          setCallStatus("error");
          setErrorMessage("Microphone access is not supported in this browser.");
          return;
        }

        const micStream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
        });
        micStreamRef.current = micStream;

        const audioCtx = new AudioContextClass();
        audioCtxRef.current = audioCtx;
        if (audioCtx.state === "suspended") {
          await audioCtx.resume();
        }

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.55;

        const source = audioCtx.createMediaStreamSource(micStream);
        source.connect(analyser);
        micAnalyserRef.current = analyser;

        const frequencyData = new Uint8Array(analyser.frequencyBinCount);

        const renderPitchWave = () => {
          if (!isCallActiveRef.current) return;

          let heights = [6, 6, 6, 6, 6, 6, 6, 6];
          const now = Date.now();

          if (isSpeakingRef.current) {
            const phase = now * 0.012;
            heights = Array.from({ length: 8 }, (_, i) => {
              const val = Math.sin(phase + i * 0.7) * 16 + Math.cos(phase * 0.8 + i * 0.4) * 10 + 22;
              return Math.min(Math.max(Math.floor(val), 8), 44);
            });
          } else if (!isMutedRef.current && micAnalyserRef.current) {
            micAnalyserRef.current.getByteFrequencyData(frequencyData);
            const bands = [
              (frequencyData[1] + frequencyData[2]) / 2,
              (frequencyData[3] + frequencyData[4]) / 2,
              (frequencyData[5] + frequencyData[6]) / 2,
              (frequencyData[7] + frequencyData[8] + frequencyData[9]) / 3,
              (frequencyData[10] + frequencyData[11] + frequencyData[12]) / 3,
              (frequencyData[13] + frequencyData[14] + frequencyData[15] + frequencyData[16]) / 4,
              (frequencyData[17] + frequencyData[18] + frequencyData[19] + frequencyData[20]) / 4,
              (frequencyData[21] + frequencyData[22] + frequencyData[23] + frequencyData[24]) / 4,
            ];

            const avgVolume = bands.reduce((a, b) => a + b, 0) / bands.length;

            if (avgVolume > 10) {
              heights = bands.map((val) => {
                const scaled = Math.floor((val / 255) * 40) + 6;
                return Math.min(Math.max(scaled, 6), 46);
              });
            } else {
              const pulse = Math.sin(now * 0.005) * 3 + 8;
              heights = Array.from({ length: 8 }, (_, i) => Math.floor(pulse + Math.sin(now * 0.007 + i) * 3));
            }

            if (avgVolume > 14 && !turnProcessingRef.current) {
              if (isSpeakingRef.current) {
                handleInterruptSpeech();
              }
              isUserSpeakingRef.current = true;
              lastSpeakTimeRef.current = now;

              if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current);
                silenceTimerRef.current = null;
              }
            } else if (isUserSpeakingRef.current && now - lastSpeakTimeRef.current > 1100 && !turnProcessingRef.current) {
              isUserSpeakingRef.current = false;
              if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

              silenceTimerRef.current = setTimeout(async () => {
                const currentText = liveTranscriptRef.current || '';
                const audioBlob = await stopMediaRecording();
                if (audioBlob || currentText.trim()) {
                  handleUserTurnRef.current?.({ speechText: currentText, audioBlob });
                } else {
                  if (isCallActiveRef.current && !turnProcessingRef.current && !isSpeakingRef.current) {
                    startMediaRecordingRef.current?.();
                    listenForSpeechRef.current?.((text) => handleUserTurnRef.current?.({ speechText: text }));
                  }
                }
              }, 100);
            }
          } else {
            const pulse = Math.sin(now * 0.003) * 2 + 6;
            heights = Array.from({ length: 8 }, () => Math.floor(pulse));
          }

          for (let i = 0; i < 8; i++) {
            if (barRefs.current[i]) {
              barRefs.current[i].style.height = `${heights[i]}px`;
            }
          }

          animFrameRef.current = requestAnimationFrame(renderPitchWave);
        };

        renderPitchWave();
      } catch (err) {
        console.warn("[VoiceCall] Microphone error:", err);
        setCallStatus("error");
        setErrorMessage(
          err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
            ? "Microphone permission was denied. Please allow microphone access to talk."
            : "Could not connect to microphone device."
        );
      }
    };

    initAudioPitchAnalyzer();

    // Initial greeting in chosen language
    const greetingTimer = setTimeout(() => {
      if (!isCallActiveRef.current || hasGreetedRef.current) return;
      hasGreetedRef.current = true;

      const activeLangObj = NIGERIAN_LANGUAGES.find((l) => l.code === selectedLanguageRef.current) || NIGERIAN_LANGUAGES[0];
      const greeting =
        business?.aiConfig?.voiceGreeting ||
        activeLangObj.greeting(business?.name || "our store", employeeName);

      playAgentResponse(greeting, () => {
        if (isCallActiveRef.current) {
          setCallStatus("listening");
          startMediaRecordingRef.current?.();
          listenForSpeechRef.current?.((text) => handleUserTurnRef.current?.({ speechText: text }));
        }
      });
    }, 1000);

    return () => {
      clearTimeout(greetingTimer);
      clearInterval(timerInterval);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
        micStreamRef.current = null;
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try { mediaRecorderRef.current.stop(); } catch {}
      }
      isCallActiveRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
      if (audioPlayerRef.current) {
        try { audioPlayerRef.current.pause(); } catch {}
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        try { window.speechSynthesis.cancel(); } catch {}
      }
    };
  }, [isOpen, callStep]); // Only run on isOpen toggle to prevent re-greeting!

  const handleEndCall = () => {
    isCallActiveRef.current = false;
    setCallStatus("ended");

    // Capture and clear sessionId/conversationId atomically before async ops
    const endingSessionId = sessionId;
    const endingConvId = conversationIdRef.current;
    conversationIdRef.current = null;
    setSessionId(null);

    // Close session on server
    if (endingSessionId) {
      fetch(`/api/v1/voice/sessions/${endingSessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "end", conversationId: endingConvId })
      }).catch(() => {});
    }

    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try { mediaRecorderRef.current.stop(); } catch {}
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
    }
    if (audioPlayerRef.current) {
      try { audioPlayerRef.current.pause(); } catch {}
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      try { window.speechSynthesis.cancel(); } catch {}
    }
    setTimeout(() => {
      onClose();
    }, 400);
  };

  if (!isOpen) return null;

  const minutes = Math.floor(callDuration / 60);
  const seconds = callDuration % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const activeLangConfig = NIGERIAN_LANGUAGES.find((l) => l.code === selectedLanguage) || NIGERIAN_LANGUAGES[0];

  // STEP 1: Pre-Call Language Selection Modal Screen
  if (callStep === "select-language") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
        <div className="relative w-full max-w-md max-h-[92dvh] overflow-y-auto bg-[#090A0D] border border-white/[0.08] rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col items-center text-center p-4 sm:p-7 custom-scrollbar">
          
          {/* Header */}
          <div className="relative z-10 space-y-1.5 mb-4 sm:mb-5 w-full">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00D18F]/10 border border-[#00D18F]/30 text-[11px] font-semibold text-[#00D18F]">
              <Globe className="size-3.5" />
              <span>Select Call Language</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Choose Language for {employeeName}
            </h2>
            <p className="text-[11px] sm:text-xs text-zinc-400 max-w-xs mx-auto">
              Select the language you want the AI sales representative to speak on this call.
            </p>
          </div>

          {/* Grid of Nigerian Language Options */}
          <div className="w-full space-y-2 my-1">
            {NIGERIAN_LANGUAGES.map((lang) => {
              const isSelected = selectedLanguage === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setSelectedLanguage(lang.code);
                    selectedLanguageRef.current = lang.code;
                  }}
                  className={`w-full text-left p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 flex items-center justify-between group cursor-pointer ${
                    isSelected
                      ? "bg-[#00D18F]/10 border-[#00D18F] shadow-lg shadow-[#00D18F]/10 scale-[1.01]"
                      : "bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl shrink-0">{lang.flag}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs sm:text-sm font-bold tracking-tight ${isSelected ? "text-white" : "text-zinc-200"}`}>
                          {lang.name}
                        </span>
                        {isSelected && (
                          <span className="px-2 py-0.5 rounded-full bg-[#00D18F] text-black text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] sm:text-xs text-zinc-400 truncate mt-0.5 italic">
                        &ldquo;{lang.subtitle}&rdquo;
                      </p>
                    </div>
                  </div>

                  <div className={`size-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                    isSelected ? "border-[#00D18F] bg-[#00D18F] text-black" : "border-zinc-600 group-hover:border-zinc-400"
                  }`}>
                    {isSelected && <Check className="size-3 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Connect Call CTA */}
          <div className="w-full pt-4 space-y-2.5">
            <button
              type="button"
              onClick={() => {
                setCallStep("calling");
              }}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#00D18F] hover:bg-[#00b87d] active:scale-[0.98] text-black font-bold text-xs sm:text-sm shadow-xl shadow-[#00D18F]/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Start Call in {activeLangConfig.name} {activeLangConfig.flag}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Cancel call
            </button>
          </div>

        </div>
      </div>
    );
  }

  // STEP 2: Live Active Voice Call Screen
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md max-h-[92dvh] overflow-y-auto bg-[#090A0D] border border-white/[0.08] rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col items-center text-center p-4 sm:p-8 custom-scrollbar">
        
        {/* Top Header */}
        <div className="relative z-10 space-y-1 mb-3 sm:mb-6 w-full">
          <div className="flex items-center justify-center gap-2 mb-1 sm:mb-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-medium text-zinc-300">
              <ShieldCheck className="size-3.5 text-[#00D18F]" />
              <span>Voxy Voice Direct Line</span>
            </div>

            {/* Language Mode Badge / Quick Switcher */}
            <button
              type="button"
              onClick={() => {
                isCallActiveRef.current = false;
                setCallStep("select-language");
              }}
              title="Click to switch call language"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00D18F]/10 border border-[#00D18F]/30 text-[11px] font-semibold text-[#00D18F] hover:bg-[#00D18F]/20 transition-all cursor-pointer"
            >
              <span>{activeLangConfig.flag} {activeLangConfig.label} Mode</span>
            </button>
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            {business?.name || "Business Storefront"}
          </h2>
          <p className="text-[11px] sm:text-xs text-zinc-400">
            Speaking with <strong className="text-zinc-200">{employeeName}</strong> ({activeLangConfig.name} AI Agent)
          </p>
        </div>

        {/* Central Avatar & Interactive Voice Orb */}
        <div
          onClick={handleManualSubmitSpeech}
          className="relative my-2 sm:my-4 flex items-center justify-center cursor-pointer group"
          title={callStatus === "speaking" ? "Tap to interrupt Voxy" : "Tap to submit speech"}
        >
          <div className={`size-24 sm:size-32 rounded-2xl bg-white/[0.03] border flex items-center justify-center shadow-lg overflow-hidden transition-all duration-300 ${
            callStatus === "listening"
              ? "border-[#00D18F]/50 shadow-[#00D18F]/20 shadow-xl scale-105"
              : callStatus === "speaking"
              ? "border-emerald-400/40 shadow-emerald-500/10 shadow-lg"
              : "border-white/[0.08]"
          }`}>
            {business?.logoUrl ? (
              <Image
                src={business.logoUrl}
                alt={business.name || "Business"}
                width={128}
                height={128}
                unoptimized
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="size-full bg-white/[0.02] flex items-center justify-center">
                <Bot className={`size-10 sm:size-12 transition-colors ${
                  callStatus === "listening" ? "text-[#00D18F]" : "text-zinc-400"
                }`} />
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Voice Waveform Bars */}
        <div className="h-8 sm:h-10 flex items-center justify-center gap-1.5 my-2 sm:my-3">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((idx) => (
            <div
              key={idx}
              ref={(el) => (barRefs.current[idx] = el)}
              style={{ height: "8px" }}
              className={`w-1.5 rounded-full transition-all duration-75 ${
                callStatus === "speaking"
                  ? "bg-[#00D18F]"
                  : callStatus === "listening"
                  ? "bg-emerald-400"
                  : callStatus === "interrupted"
                  ? "bg-amber-400"
                  : "bg-zinc-700/60"
              }`}
            />
          ))}
        </div>

        {/* Status Callout & Duration */}
        <div className="space-y-1 my-2 sm:my-3">
          <div className="flex items-center justify-center gap-2">
            <span
              className={`size-2 rounded-full ${
                callStatus === "speaking" || callStatus === "listening"
                  ? "bg-[#00D18F]"
                  : callStatus === "thinking" || callStatus === "interrupted"
                  ? "bg-amber-400"
                  : callStatus === "error"
                  ? "bg-red-500"
                  : "bg-zinc-500"
              }`}
            />
            <span className="text-xs font-semibold text-white tracking-tight capitalize">
              {callStatus === "connecting" && `Connecting in ${activeLangConfig.name}...`}
              {callStatus === "speaking" && `${employeeName} is speaking (${activeLangConfig.label})...`}
              {callStatus === "listening" && "Listening... Speak naturally"}
              {callStatus === "thinking" && "Thinking & Processing..."}
              {callStatus === "interrupted" && "Interrupted — Listening..."}
              {callStatus === "error" && "Microphone Issue"}
              {callStatus === "ended" && "Call Ended"}
            </span>
          </div>

          <div className="text-[11px] text-zinc-500 font-mono tracking-wider tabular-nums">
            {formattedTime}
          </div>
        </div>

        {/* Payment Link Card — appears when AI shares a payment link during call */}
        {paymentUrl && (
          <div className="w-full mt-2 mb-1 p-3 rounded-xl sm:rounded-2xl bg-[#00D18F]/10 border border-[#00D18F]/30 flex items-center gap-2.5 sm:gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="size-8 sm:size-9 rounded-xl bg-[#00D18F]/20 flex items-center justify-center shrink-0">
              <CreditCard className="size-4 text-[#00D18F]" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[10px] sm:text-[11px] font-semibold text-[#00D18F] uppercase tracking-wider mb-0.5">Payment Link Ready</p>
              <p className="text-[10px] sm:text-[11px] text-zinc-400 truncate">{paymentUrl}</p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openPaymentPopup(paymentUrl);
              }}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00D18F] text-black text-[11px] sm:text-[12px] font-bold hover:bg-[#00b87d] active:scale-95 transition-all cursor-pointer"
            >
              <span>Pay Now</span>
              <ExternalLink className="size-3" />
            </button>
          </div>
        )}

        {/* Live Speech Captions & Error Banner */}
        <div className="w-full max-h-24 overflow-y-auto p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.07] text-xs text-zinc-300 text-left my-2 custom-scrollbar">
          {callStatus === "error" ? (
            <p className="flex items-center gap-1.5 text-red-400">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMessage || "Microphone access error."}</span>
            </p>
          ) : callStatus === "speaking" && lastAgentMessage ? (
            <p className="line-clamp-3 text-zinc-300">
              <strong className="text-[#00D18F]">{employeeName}: </strong>
              &ldquo;{lastAgentMessage}&rdquo;
            </p>
          ) : callStatus === "listening" ? (
            <p className="line-clamp-3 text-zinc-200">
              <strong className="text-zinc-400">You: </strong>
              {liveTranscript || `Speak in ${activeLangConfig.name} or English. Voxy will respond in ${activeLangConfig.name}...`}
            </p>
          ) : callStatus === "thinking" ? (
            <p className="flex items-center gap-1.5 text-zinc-400">
              <Loader2 className="size-3.5 animate-spin text-[#00D18F]" />
              <span>Processing turn in {activeLangConfig.name}...</span>
            </p>
          ) : callStatus === "interrupted" ? (
            <p className="text-amber-300 italic">Interrupted playback — listening...</p>
          ) : (
            <p className="text-zinc-500 italic">Initializing line in {activeLangConfig.name}...</p>
          )}
        </div>

        {/* Call Action Controls */}
        <div className="w-full pt-5 flex items-center justify-around">
          {/* Mute Mic / Interrupt */}
          <button
            onClick={() => {
              if (callStatus === "speaking") {
                handleInterruptSpeech();
              } else {
                setIsMuted(!isMuted);
              }
            }}
            className={`size-12 rounded-full flex items-center justify-center transition-all border ${
              callStatus === "speaking"
                ? "bg-amber-500/20 border-amber-500/30 text-amber-400 hover:bg-amber-500/30"
                : isMuted
                ? "bg-red-500/20 border-red-500/30 text-red-400"
                : "bg-white/[0.04] border-white/[0.08] text-zinc-300 hover:text-white hover:bg-white/[0.08]"
            }`}
            title={callStatus === "speaking" ? "Interrupt AI Speech" : isMuted ? "Unmute Microphone" : "Mute Microphone"}
          >
            {callStatus === "speaking" ? <Square className="size-4 fill-amber-400" /> : isMuted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
          </button>

          {/* End Call Button (Big Red Circle) */}
          <button
            onClick={handleEndCall}
            className="size-16 rounded-full bg-red-600 hover:bg-red-500 active:scale-95 text-white flex items-center justify-center shadow-lg transition-all"
            title="End Call"
          >
            <PhoneOff className="size-6" />
          </button>

          {/* Send / Speaker Control */}
          <button
            onClick={handleManualSubmitSpeech}
            className="size-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/30 transition-all"
            title="Submit Speech Turn"
          >
            <Send className="size-5" />
          </button>
        </div>

        {/* Switch to Chat link */}
        <button
          onClick={handleEndCall}
          className="mt-5 inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <MessageSquare className="size-3.5" />
          <span>Switch to text chat</span>
        </button>
      </div>
    </div>
  );
}
