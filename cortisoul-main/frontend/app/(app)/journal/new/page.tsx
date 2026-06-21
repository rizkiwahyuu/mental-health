"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { journalsApi } from "@/lib/api";

// ─── Voice-to-Text Hook ────────────────────────────────────────────────────────

type VoiceStatus = "idle" | "listening" | "unsupported";

function useVoiceToText(onResult: (text: string) => void) {
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>("idle");
  const onResultRef = useRef(onResult);

  // Selalu perbarui ref dengan callback terbaru dari parent component
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionAPI: any =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setVoiceStatus("unsupported");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "id-ID";
    recognition.continuous = true;
    recognition.interimResults = false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let newText = "";
      // Mulai meloop HANYA dari indeks hasil baru yang belum di-proses (event.resultIndex)
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          newText += event.results[i][0].transcript;
        }
      }
      if (newText) {
        onResultRef.current(newText);
      }
    };

    recognition.onend = () => {
      setVoiceStatus("idle");
    };

    recognition.onerror = () => {
      setVoiceStatus("idle");
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, []); // Hanya jalankan sekali saat mount agar recognition tidak terputus-putus

  const startListening = useCallback(() => {
    if (!recognitionRef.current || voiceStatus === "unsupported") return;
    try {
      recognitionRef.current.start();
      setVoiceStatus("listening");
    } catch (err) {
      console.error("Gagal memulai perekaman suara:", err);
    }
  }, [voiceStatus]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
      setVoiceStatus("idle");
    } catch (err) {
      console.error("Gagal menghentikan perekaman suara:", err);
    }
  }, []);

  const toggle = useCallback(() => {
    if (voiceStatus === "listening") stopListening();
    else startListening();
  }, [voiceStatus, startListening, stopListening]);

  return { voiceStatus, toggle, stopListening };
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NewJournalPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Voice-to-text: append transcript ke content yang sudah ada
  const handleVoiceResult = useCallback((transcript: string) => {
    setContent((prev) => {
      const separator = prev && !prev.endsWith(" ") ? " " : "";
      return prev + separator + transcript;
    });
  }, []);

  const { voiceStatus, toggle: toggleVoice } = useVoiceToText(handleVoiceResult);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.max(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("Judul dan isi jurnal harus diisi");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const res = await journalsApi.create({ title, content });
      const journalId = res.data?.journalId;
      if (journalId) {
        router.push(`/journal/${journalId}`);
      } else {
        router.push("/history");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan jurnal");
      setIsSubmitting(false);
    }
  };

  const todayDate = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).toUpperCase();

  const isListening = voiceStatus === "listening";

  return (
    <div className="app-page app-page--narrow animate-fadeIn" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* Header – centered */}
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <p
          style={{
            fontSize: "13px",
            color: "var(--text-secondary)",
            letterSpacing: "0.04em",
            marginBottom: "10px",
            fontWeight: 500,
          }}
        >
          {todayDate}
        </p>
        <h1
          style={{
            fontSize: "clamp(28px, 5vw, 40px)",
            fontWeight: 700,
            color: "var(--text-primary)",
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          Bagaimana harimu?
        </h1>
      </div>

      {/* Card */}
      <form
        onSubmit={handleSubmit}
        className="journal-form-card"
      >
        {/* Title input */}
        <input
          type="text"
          id="journal-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Masukkan judul jurnal mu"
          maxLength={80}
          required
          style={{
            width: "100%",
            border: "none",
            background: "transparent",
            outline: "none",
            fontSize: "18px",
            fontWeight: 600,
            color: "var(--text-primary)",
            padding: "0 0 12px 0",
            borderBottom: "none",
            marginBottom: "16px",
            borderRadius: 0,
            boxShadow: "none",
          }}
        />

        {/* Content textarea */}
        <textarea
          ref={textareaRef}
          id="journal-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={
            isListening
              ? "🎙️ Sedang mendengarkan... Bicara sekarang..."
              : "Masukkan detail keseharian mu disini!"
          }
          required
          style={{
            width: "100%",
            border: "none",
            background: "transparent",
            outline: "none",
            fontSize: "14.5px",
            color: "var(--text-primary)",
            resize: "none",
            minHeight: "180px",
            lineHeight: "1.75",
            padding: "0",
            marginBottom: "24px",
            boxShadow: "none",
            borderRadius: 0,
            borderColor: isListening ? "#ef4444" : "transparent",
            transition: "border-color 0.2s",
          }}
        />

        {/* Error */}
        {error && (
          <div
            className="animate-fadeIn"
            style={{
              background: "rgba(220, 38, 38, 0.1)",
              border: "1px solid rgba(220, 38, 38, 0.25)",
              borderRadius: "10px",
              padding: "10px 14px",
              color: "#dc2626",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "16px",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        {/* Divider Line */}
        <div
          style={{
            height: "1px",
            background: "var(--border-light)",
            width: "100%",
            marginBottom: "20px",
          }}
        />

        {/* Bottom action row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
            width: "100%",
          }}
        >
          {/* Voice Journaling button */}
          {voiceStatus !== "unsupported" ? (
            <button
              type="button"
              onClick={toggleVoice}
              title={isListening ? "Hentikan perekaman suara" : "Mulai rekam suara (Bahasa Indonesia)"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                background: isListening
                  ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                  : "var(--bg-primary)",
                border: isListening
                  ? "1.5px solid #dc2626"
                  : "1.5px solid var(--border-medium)",
                borderRadius: "99px",
                fontSize: "14px",
                fontWeight: 500,
                color: isListening ? "#fff" : "var(--text-primary)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: isListening
                  ? "0 0 0 3px rgba(239,68,68,0.2)"
                  : "var(--shadow-sm)",
                flexShrink: 0,
              }}
            >
              {isListening ? (
                // Stop / recording icon
                <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              ) : (
                // Mic icon
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              )}
              {isListening ? "Hentikan" : "Voice Journaling"}
            </button>
          ) : (
            <div />
          )}

          {/* Save Entry button */}
          <button
            type="submit"
            id="submit-journal"
            disabled={isSubmitting}
            style={{
              padding: "10px 24px",
              background: isSubmitting
                ? "rgba(61, 90, 90, 0.5)"
                : "linear-gradient(135deg, #3d5a5a 0%, #2b3f3f 100%)",
              color: "#fff",
              border: "none",
              borderRadius: "99px",
              fontWeight: 600,
              fontSize: "14px",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: isSubmitting ? "none" : "0 4px 14px rgba(61, 90, 90, 0.35)",
              transition: "all 0.2s ease",
              flexShrink: 0,
            }}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Menyimpan...
              </>
            ) : (
              "Simpan dan Analisis"
            )}
          </button>
        </div>

        {/* Listening badge */}
        {isListening && (
          <div
            className="animate-fadeIn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              marginTop: "12px",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: "99px",
              padding: "5px 14px",
              fontSize: "12px",
              fontWeight: 600,
              color: "#dc2626",
              alignSelf: "flex-start",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                background: "#ef4444",
                borderRadius: "50%",
                display: "inline-block",
                animation: "pulse-soft 1s ease-in-out infinite",
              }}
            />
            Mendengarkan... Bicara sekarang
          </div>
        )}
      </form>
    </div>
  );
}
