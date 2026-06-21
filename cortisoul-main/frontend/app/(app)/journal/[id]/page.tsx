"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { journalsApi, reflectionsApi, type Journal, type Reflection } from "@/lib/api";

const EMOTION_COLOR_MAP: Record<string, string> = {
  suicidal: "#be123dcc",             // Deep Rose Red
  depression: "#2564ebb1",           // Cool Deep Blue
  normal: "#10b981b3",               // Calming Emerald Green
  "personality disorder": "#8b5cf6b8", // Royal Violet
  personality_disorder: "#8b5cf6b8", // Fallback underscore
  stress: "#ef4444b1",               // Alert Red
  anxiety: "#f97316b8",              // Electric Orange
  bipolar: "#ec4899b9",              // Dualistic Hot Pink
};

function emotionColor(emotion: string): string {
  return EMOTION_COLOR_MAP[emotion?.toLowerCase()] ?? "#3d5a5a";
}


export default function JournalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [journal, setJournal] = useState<Journal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reflectionText, setReflectionText] = useState<string | null>(null);
  const [isLoadingReflection, setIsLoadingReflection] = useState(false);
  const [reflectionError, setReflectionError] = useState("");

  const loadJournal = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await journalsApi.getById(id);
      const j = res.data?.journal;
      if (j) {
        setJournal(j);
        setEditTitle(j.title);
        setEditContent(j.content);
      }
    } catch {
      setError("Jurnal tidak ditemukan");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const loadReflection = useCallback(async () => {
    try {
      const getRes = await reflectionsApi.get(id);
      const reflection = getRes.data?.reflection;
      if (reflection) {
        const text = reflection.reflection_text || reflection.teks_refleksi;
        if (text && text.trim()) {
          setReflectionText(text.trim());
        }
      }
    } catch {
      // Reflection belum ada di database, abaikan saja
    }
  }, [id]);

  useEffect(() => {
    loadJournal();
    loadReflection();
  }, [loadJournal, loadReflection]);

  const handleSave = async () => {
    if (!editTitle.trim() || !editContent.trim()) {
      setError("Judul dan isi tidak boleh kosong");
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      const res = await journalsApi.update(id, {
        title: editTitle,
        content: editContent,
      });
      if (res.data?.journal) {
        setJournal(res.data.journal);
      } else {
        await loadJournal();
      }
      setIsEditing(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan perubahan");
    } finally {
      setIsSaving(false);
    }
  };

  const handleShowReflection = async () => {
    setIsLoadingReflection(true);
    setReflectionError("");
    try {
      // Coba GET reflection yang sudah ada terlebih dahulu
      let reflection: Reflection | null = null;
      try {
        const getRes = await reflectionsApi.get(id);
        reflection = getRes.data?.reflection ?? null;
      } catch {
        // Reflection belum ada, lanjut ke POST
      }

      if (!reflection) {
        // Generate reflection baru via POST
        let postRes;
        try {
          postRes = await reflectionsApi.generate(id);
          console.log('[DEBUG] POST response:', JSON.stringify(postRes));
        } catch (postErr: unknown) {
          console.error('[DEBUG] POST error:', postErr instanceof Error ? postErr.message : postErr);
          throw postErr;
        }
        reflection = postRes.data?.reflection ?? null;
      }

      if (!reflection) {
        setReflectionError("Tidak ada hasil refleksi dari AI");
        return;
      }

      console.log('[DEBUG] reflection object:', JSON.stringify(reflection));

      const text =
        reflection.reflection_text ||
        reflection.teks_refleksi ||
        "";

      if (!text.trim()) {
        setReflectionError("Teks refleksi tidak tersedia dalam respons AI");
        return;
      }

      setReflectionText(text);
    } catch (err: unknown) {
      setReflectionError(
        err instanceof Error ? err.message : "Gagal memuat teks refleksi"
      );
    } finally {
      setIsLoadingReflection(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError("");
    try {
      await journalsApi.delete(id);
      router.push("/history");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menghapus jurnal");
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="app-page">
        <div
          style={{
            height: "400px",
            background: "var(--bg-card)",
            borderRadius: "16px",
            border: "1px solid var(--border-light)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          className="animate-pulse-soft"
        >
          <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" strokeWidth="2.5" strokeLinecap="round">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        </div>
      </div>
    );
  }

  if (error && !journal) {
    return (
      <div className="app-page">
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>❌</div>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
            {error}
          </h2>
          <Link href="/history" style={{ color: "var(--accent-blue)", textDecoration: "none", fontSize: "14px" }}>
            ← Kembali ke Riwayat
          </Link>
        </div>
      </div>
    );
  }

  if (!journal) return null;

  const createdAt = new Date(journal.created_at);
  const formattedDate = createdAt.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const formattedTime = createdAt.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const stressColor = getStressColor(journal.stress_score);
  const stressLabel = getStressLabel(journal.stress_score);
  // console.log(journal);
  console.log('refleksi: ', reflectionText);
  return (
    <div className="app-page animate-fadeIn">
      {/* Breadcrumb */}
      <div className="breadcrumb-nav" style={{ marginBottom: "20px" }}>
        <Link href="/history" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "13px", flexShrink: 0 }}>
          Riwayat Jurnal
        </Link>
        <span style={{ color: "var(--text-muted)", fontSize: "13px", flexShrink: 0 }}>›</span>
        <span className="breadcrumb-nav__title" style={{ color: "var(--text-primary)", fontSize: "13px", fontWeight: 500 }}>
          {journal.title}
        </span>
      </div>

      {/* Journal Card */}
      <div
        style={{
          background: "var(--bg-card)",
          borderRadius: "16px",
          boxShadow: "0 4px 24px rgba(61, 90, 90, 0.08)",
          overflow: "hidden",
          marginBottom: "20px",
        }}
      >
        {/* Header */}
        <div className="journal-card-header" style={{
            background: "linear-gradient(135deg, rgba(61,90,90,0.08) 0%, rgba(129,140,248,0.06) 100%)",
            borderBottom: "1px solid var(--border-light)",
            padding: "24px 28px",
          }}
        >
          <div className="journal-detail-header">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                {journal.emotion && (
                  <span
                    style={{
                      background: `${emotionColor(journal.emotion).slice(0, 7)}15`,
                      color: emotionColor(journal.emotion),
                      padding: "3px 10px",
                      borderRadius: "99px",
                      fontSize: "12px",
                      fontWeight: 600,
                      textTransform: "capitalize",
                    }}
                  >
                    {journal.emotion === "personality_disorder" ? "Personality Disorder" : journal.emotion.charAt(0).toUpperCase() + journal.emotion.slice(1)}
                  </span>
                )}
                {journal.stress_score !== undefined && journal.stress_score !== null && (
                  <span
                    style={{
                      background: `${stressColor}15`,
                      color: stressColor,
                      padding: "3px 10px",
                      borderRadius: "99px",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    Stres {stressLabel}
                  </span>
                )}
              </div>

              {isEditing ? (
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  maxLength={50}
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    border: "2px solid var(--accent-teal)",
                    borderRadius: "8px",
                    padding: "6px 10px",
                    width: "100%",
                    background: "var(--bg-card-hover)",
                  }}
                />
              ) : (
                <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>
                  {journal.title}
                </h1>
              )}

              <p style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>
                {formattedDate} · {formattedTime}
              </p>
            </div>

            {/* Action buttons */}
            {!isEditing && (
              <div className="journal-detail-actions">
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    padding: "8px 14px",
                    background: "var(--bg-card-hover)",
                    border: "1.5px solid var(--border-medium)",
                    borderRadius: "10px",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={() => {
                    setError("");
                    setShowDeleteConfirm(true);
                  }}
                  style={{
                    padding: "8px 14px",
                    background: "rgba(220,38,38,0.1)",
                    border: "1.5px solid rgba(220,38,38,0.25)",
                    borderRadius: "10px",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#f87171",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                  Hapus
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="journal-card-body" style={{ padding: "24px 28px" }}>
          {isEditing ? (
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={12}
              style={{
                width: "100%",
                border: "2px solid var(--accent-teal)",
                borderRadius: "10px",
                resize: "vertical",
                fontSize: "15px",
                lineHeight: "1.8",
                padding: "14px",
                minHeight: "200px",
              }}
            />
          ) : (
            <div
              style={{
                fontSize: "15px",
                lineHeight: "1.8",
                color: "var(--text-primary)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {journal.content}
            </div>
          )}

          {/* Edit actions */}
          {isEditing && (
            <div className="edit-actions-row">
              {error && (
                <p style={{ color: "#dc2626", fontSize: "13px", flex: 1 }}>{error}</p>
              )}
              <button
                onClick={() => { setIsEditing(false); setError(""); }}
                style={{
                  padding: "10px 18px",
                  background: "var(--bg-card-hover)",
                  border: "1.5px solid var(--border-medium)",
                  borderRadius: "10px",
                  fontSize: "14px",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                style={{
                  padding: "10px 20px",
                  background: "linear-gradient(135deg, #3d5a5a 0%, #2b3f3f 100%)",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "14px",
                  color: "#fff",
                  cursor: isSaving ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: isSaving ? "none" : "0 4px 12px rgba(61,90,90,0.3)",
                }}
              >
                {isSaving && (
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                )}
                Simpan Perubahan
              </button>
            </div>
          )}
        </div>
      </div>

      

      {/* AI Analysis Panel */}
      {(journal.emotion || journal.stress_score !== undefined || journal.suggestion) && (
        <div
          style={{
            background: "var(--bg-card)",
            borderRadius: "16px",
            boxShadow: "0 4px 24px rgba(61, 90, 90, 0.08)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "18px 24px",
              borderBottom: "1px solid var(--border-light)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div>
              <h2 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                Hasil Analisis AI
              </h2>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                Berdasarkan isi jurnalmu
              </p>
            </div>
          </div>

          <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Emotion */}
            {journal.emotion && (
              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>Kondisi Mental Anda</p>
                  <span
                    style={{
                      background: `${emotionColor(journal.emotion).slice(0, 7)}15`,
                      color: emotionColor(journal.emotion),
                      padding: "4px 12px",
                      borderRadius: "99px",
                      fontSize: "14px",
                      fontWeight: 700,
                      textTransform: "capitalize",
                      display: "inline-block",
                    }}
                  >
                    {journal.emotion === "personality_disorder" ? "Personality Disorder" : journal.emotion.charAt(0).toUpperCase() + journal.emotion.slice(1)}
                  </span>
                </div>
              </div>
            )}

            {/* Stress level */}
            {journal.stress_score !== undefined && journal.stress_score !== null && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Tingkat Stres</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "15px", fontWeight: 700, color: stressColor }}>
                      {journal.stress_score!}
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>/10</span>
                    <span
                      style={{
                        background: `${stressColor}15`,
                        color: stressColor,
                        padding: "2px 8px",
                        borderRadius: "99px",
                        fontSize: "11px",
                        fontWeight: 600,
                      }}
                    >
                      {stressLabel}
                    </span>
                  </div>
                </div>
                <div style={{ height: "8px", background: "rgba(255,255,255,0.06)", borderRadius: "99px" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${journal.stress_score!*10}%`,
                      background: `linear-gradient(90deg, #22c55e, ${stressColor})`,
                      borderRadius: "99px",
                    }}
                  />
                </div>
              </div>
            )}

            {/* Suggestion */}
            {journal.suggestion && (
              <div
                style={{
                  background: "linear-gradient(135deg, rgba(61,90,90,0.08) 0%, rgba(129,140,248,0.06) 100%)",
                  borderRadius: "12px",
                  padding: "16px",
                  border: "1px solid var(--border-teal)",
                }}
              >
                <div style={{ display: "flex", gap: "10px" }}>
                  <div style={{
                    width: "32px", height: "32px",
                    background: "rgba(61,90,90,0.15)",
                    borderRadius: "8px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                  <div>
                    <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--accent-teal)", marginBottom: "6px" }}>
                      Saran untuk Kamu
                    </p>
                    <p style={{ fontSize: "13.5px", color: "var(--text-primary)", lineHeight: "1.7" }}>
                      {journal.suggestion}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Teks Refleksi AI */}
      {!isEditing && (
        <div style={{ marginTop: "20px" }}>
          {!reflectionText && (
            <>
              <button
                type="button"
                onClick={handleShowReflection}
                disabled={isLoadingReflection}
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    marginTop: 10,
                    flexShrink: 0,
                    background: "#3d5a5a",
                    color: "#ffffff",
                    padding: "12px 24px",
                    borderRadius: "9999px",
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textDecoration: "none",
                    textTransform: "uppercase",
                    boxShadow: "0 4px 12px rgba(61, 90, 90, 0.28)",
                    whiteSpace: "nowrap",
                  }}
              >
                {isLoadingReflection ? (
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                )}
                {isLoadingReflection ? "Memuat Refleksi..." : "Tampilkan Teks Refleksi"}
              </button>

              {reflectionError && (
                <p style={{ color: "#dc2626", fontSize: "13px", marginTop: "10px" }}>
                  {reflectionError}
                </p>
              )}
            </>
          )}

          {reflectionText && (
            <div
              style={{
                marginTop: "16px",
                background: "var(--bg-card)",
                borderRadius: "16px",
                boxShadow: "0 4px 24px rgba(61, 90, 90, 0.08)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "18px 24px",
                  borderBottom: "1px solid var(--border-light)",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  background: "linear-gradient(135deg, rgba(61,90,90,0.08) 0%, rgba(129,140,248,0.06) 100%)",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    background: "linear-gradient(135deg, #3d5a5a 0%, #2b3f3f 100%)",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                    Teks Refleksi
                  </h2>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    Dihasilkan oleh Cortisoul AI dari isi jurnalmu
                  </p>
                </div>
              </div>
              <div style={{ padding: "20px 24px" }}>
                <p
                  style={{
                    fontSize: "14.5px",
                    color: "var(--text-primary)",
                    lineHeight: "1.8",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {reflectionText}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: "20px",
          }}
          onClick={() => {
            setError("");
            setShowDeleteConfirm(false);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="animate-fadeIn"
            style={{
              background: "var(--bg-card)",
              borderRadius: "20px",
              padding: "32px",
              maxWidth: "380px",
              width: "100%",
              textAlign: "center",
              border: "1px solid var(--border-light)",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🗑️</div>
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
              Hapus Jurnal?
            </h3>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "24px" }}>
              Jurnal &ldquo;<strong>{journal.title}</strong>&rdquo; akan dihapus permanen dan tidak bisa dikembalikan.
            </p>
            {error && (
              <div
                className="animate-fadeIn"
                style={{
                  background: "rgba(220, 38, 38, 0.08)",
                  border: "1.5px solid rgba(220, 38, 38, 0.25)",
                  borderRadius: "12px",
                  padding: "12px 14px",
                  color: "#f87171",
                  fontSize: "13px",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                  marginBottom: "20px",
                  lineHeight: "1.5",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0, marginTop: "2px" }}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => {
                  setError("");
                  setShowDeleteConfirm(false);
                }}
                style={{
                  flex: 1,
                  padding: "11px",
                  background: "var(--bg-card-hover)",
                  border: "1.5px solid var(--border-medium)",
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                }}
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                style={{
                  flex: 1,
                  padding: "11px",
                  background: "#dc2626",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#fff",
                  cursor: isDeleting ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                {isDeleting ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function getStressColor(score?: number | null): string {
  if (score === null || score === undefined) return "#64748b";
  // Skala raw 0–1 dari ML model
  if (score < 4) return "#22c55e";
  if (score < 7) return "#f97316";
  return "#ef4444";
}

function getStressLabel(score?: number | null): string {
  if (score === null || score === undefined) return "-";
  if (score < 4) return "Rendah";
  if (score < 7) return "Sedang";
  return "Tinggi";
}

