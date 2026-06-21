"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { journalsApi, type Journal } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const EMOTION_COLOR_MAP: Record<string, string> = {
  suicidal: "#be123dcc",             // Deep Rose Red
  depression: "#2564ebb1",           // Cool Deep Blue
  normal: "#10b981b3",               // Calming Emerald Green
  "personality disorder": "#8b5cf6b8", // Royal Violet
  "personality_disorder": "#8b5cf6b8", // Fallback underscore
  stress: "#ef4444b1",               // Alert Red
  anxiety: "#f97316b8",              // Electric Orange
  bipolar: "#ec4899b9",              // Dualistic Hot Pink
};

function emotionColor(emotion: string): string {
  return EMOTION_COLOR_MAP[emotion?.toLowerCase()] ?? "#3d5a5a";
}


export default function HistoryPage() {
  const { user } = useAuth();
  const [journals, setJournals] = useState<Journal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterEmotion, setFilterEmotion] = useState("all");
  const [filterStress, setFilterStress] = useState("all");
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printStartDate, setPrintStartDate] = useState("");
  const [printEndDate, setPrintEndDate] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("registered") === "success") {
        setShowSuccessAlert(true);
        // Hapus query parameter dari URL agar history tetap bersih
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);
      }
    }
  }, []);

  const loadJournals = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await journalsApi.getAll();
      const all = res.data?.journals || [];
      const sorted = [...all].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setJournals(sorted);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJournals();
  }, [loadJournals]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterEmotion, filterStress]);

  const uniqueEmotions = Array.from(
    new Set(journals.map((j) => j.emotion).filter(Boolean))
  ) as string[];

  const filtered = journals.filter((j) => {
    const matchSearch =
      search === "" ||
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.content.toLowerCase().includes(search.toLowerCase());
    const matchEmotion = filterEmotion === "all" || j.emotion === filterEmotion;
    
    let matchStress = true;
    if (filterStress !== "all") {
      const score = j.stress_score;
      if (score == null) {
        matchStress = false;
      } else {
        if (filterStress === "rendah") matchStress = score < 4;
        else if (filterStress === "sedang") matchStress = score >= 4 && score < 7;
        else if (filterStress === "tinggi") matchStress = score >= 7;
      }
    }
    
    return matchSearch && matchEmotion && matchStress;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginatedFiltered = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Group by month
  const grouped = paginatedFiltered.reduce<Record<string, Journal[]>>((acc, j) => {
    const key = new Date(j.created_at).toLocaleDateString("id-ID", {
      month: "long",
      year: "numeric",
    });
    if (!acc[key]) acc[key] = [];
    acc[key].push(j);
    return acc;
  }, {});

  // Stress score: skala raw 0–1 dari ML model, tampil ×10
  const stressColor = (score?: number | null) => {
    if (score == null) return "#64748b";
    if (score < 4) return "#22c55e";
    if (score < 7) return "#f97316";
    return "#ef4444";
  };

  const getStressLabel = (score: number | null | undefined) => {
    if (score == null) return "-";
    if (score < 4) return "Rendah";
    if (score < 7) return "Sedang";
    return "Tinggi";
  };

  const handlePrint = () => {
    const start = printStartDate ? new Date(printStartDate) : null;
    const end = printEndDate ? new Date(printEndDate) : null;
    if (end) end.setHours(23, 59, 59, 999);

    const reportJournals = journals.filter((j) => {
      const date = new Date(j.created_at);
      if (start && date < start) return false;
      if (end && date > end) return false;
      return true;
    });

    if (reportJournals.length === 0) {
      alert("Tidak ada jurnal dalam rentang tanggal tersebut.");
      return;
    }

    const total = reportJournals.length;
    const scores = reportJournals.map(j => j.stress_score).filter(s => s != null) as number[];
    const avgStress = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : "-";
    
    const emotionsCount: Record<string, number> = {};
    reportJournals.forEach(j => {
      if (j.emotion) {
        emotionsCount[j.emotion] = (emotionsCount[j.emotion] || 0) + 1;
      }
    });

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.bottom = "0";
    iframe.style.right = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) return;

    const formattedStart = start ? start.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "Awal";
    const formattedEnd = end ? end.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "Sekarang";

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Jurnal CortiSoul</title>
        <style>
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: #1e293b;
            line-height: 1.5;
            padding: 40px;
            background: #ffffff;
          }
          .header {
            border-bottom: 2px solid #3d5a5a;
            padding-bottom: 20px;
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .title {
            font-size: 24px;
            font-weight: 700;
            color: #3d5a5a;
          }
          .subtitle {
            font-size: 14px;
            color: #64748b;
            margin-top: 4px;
          }
          .meta {
            text-align: right;
            font-size: 12px;
            color: #64748b;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin-bottom: 30px;
          }
          .stat-card {
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 16px;
            text-align: center;
            background: #f8fafc;
          }
          .stat-value {
            font-size: 24px;
            font-weight: 700;
            color: #3d5a5a;
            margin-bottom: 4px;
          }
          .stat-label {
            font-size: 12px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .table-title {
            font-size: 16px;
            font-weight: 600;
            color: #0f172a;
            margin-bottom: 12px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          th {
            background: #f1f5f9;
            color: #475569;
            font-weight: 600;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            text-align: left;
            padding: 12px 16px;
            border-bottom: 1.5px solid #cbd5e1;
          }
          td {
            padding: 12px 16px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 13px;
          }
          .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 99px;
            font-size: 11px;
            font-weight: 600;
            text-transform: capitalize;
          }
          .badge-emotion {
            background: #e0f2fe;
            color: #0369a1;
          }
          .badge-stress-low {
            background: #dcfce7;
            color: #15803d;
          }
          .badge-stress-medium {
            background: #ffedd5;
            color: #c2410c;
          }
          .badge-stress-high {
            background: #fee2e2;
            color: #b91c1c;
          }
          .badge-stress-none {
            background: #f1f5f9;
            color: #475569;
          }
          .journal-content {
            color: #475569;
            font-size: 12.5px;
            margin-top: 6px;
            line-height: 1.6;
          }
          @media print {
            body {
              padding: 0;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">CortiSoul Journal Report</div>
            <div class="subtitle">Rentang Laporan: ${formattedStart} - ${formattedEnd}</div>
          </div>
          <div class="meta">
            <div>Dicetak oleh: ${user?.fullname || user?.username || "Pengguna"}</div>
            <div>Tanggal Cetak: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${total}</div>
            <div class="stat-label">Total Entri Jurnal</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${avgStress}</div>
            <div class="stat-label">Rata-rata Skor Stres</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="font-size: 14px; padding-top: 6px; display: flex; justify-content: center; gap: 8px; flex-wrap: wrap;">
              ${Object.entries(emotionsCount).slice(0, 3).map(([emotion, count]) => `
                <span class="badge badge-emotion">${emotion}: ${count}</span>
              `).join("") || "-"}
            </div>
            <div class="stat-label">Distribusi Kondisi Mental Utama</div>
          </div>
        </div>

        <div class="table-title">Daftar Entri Jurnal</div>
        <table>
          <thead>
            <tr>
              <th style="width: 120px;">Tanggal</th>
              <th>Judul & Catatan</th>
              <th style="width: 100px;">Kondisi Mental</th>
              <th style="width: 120px;">Tingkat Stres</th>
            </tr>
          </thead>
          <tbody>
            ${reportJournals.map((j) => {
              const dateStr = new Date(j.created_at).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric"
              });
              let stressBadge = '<span class="badge badge-stress-none">-</span>';
              if (j.stress_score != null) {
                if (j.stress_score < 4) {
                  stressBadge = `<span class="badge badge-stress-low">Stres Rendah (${j.stress_score})</span>`;
                } else if (j.stress_score < 7) {
                  stressBadge = `<span class="badge badge-stress-medium">Stres Sedang (${j.stress_score})</span>`;
                } else {
                  stressBadge = `<span class="badge badge-stress-high">Stres Tinggi (${j.stress_score})</span>`;
                }
              }
              return `
                <tr>
                  <td style="vertical-align: top; font-weight: 500; color: #475569;">${dateStr}</td>
                  <td style="vertical-align: top;">
                    <div style="font-weight: 700; color: #0f172a; font-size: 14px;">${j.title}</div>
                    <div class="journal-content">${j.content}</div>
                  </td>
                  <td style="vertical-align: top;">
                    ${j.emotion ? `<span class="badge badge-emotion">${j.emotion.toLowerCase() =="personality_disorder"? "Personality Disorder" : j.emotion}</span>` : "-"}
                  </td>
                  <td style="vertical-align: top;">
                    ${stressBadge}
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </body>
      </html>
    `;

    doc.open();
    doc.write(htmlContent);
    doc.close();

    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 500);
    };
  };

  return (
    <div className="app-page animate-fadeIn">
      {/* Header */}
      <div className="page-header-row" style={{ marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>
            Riwayat Jurnal
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            {journals.length} jurnal tersimpan
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <button
            onClick={() => setShowPrintModal(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              marginTop: 10,
              flexShrink: 0,
              background: "transparent",
              color: "var(--text-primary)",
              border: "1.5px solid var(--border-medium)",
              padding: "12px 24px",
              borderRadius: "9999px",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
              whiteSpace: "nowrap",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-card-hover)";
              e.currentTarget.style.borderColor = "var(--accent-teal)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "var(--border-medium)";
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            Cetak Laporan
          </button>
          
          <Link
            href="/journal/new"
            className="btn-primary-inline"
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
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Tulis Jurnal
          </Link>
        </div>
      </div>

      {showSuccessAlert && (
        <div
          style={{
            background: "rgba(34, 197, 94, 0.08)",
            border: "1.5px solid rgba(34, 197, 94, 0.3)",
            borderRadius: "16px",
            padding: "14px 20px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            animation: "fadeIn 0.25s ease-out forwards",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              background: "rgba(34, 197, 94, 0.2)",
              color: "#22c55e",
              flexShrink: 0,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                Pendaftaran Berhasil!
              </span>
              <span style={{ fontSize: "12.5px", color: "var(--text-secondary)", marginTop: "2px" }}>
                Selamat datang di CortiSoul. Akun Anda berhasil terdaftar dan Anda kini telah masuk.
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowSuccessAlert(false)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              padding: "4px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* Filters */}
      <div
        style={{
          background: "var(--bg-card)",
          borderRadius: "16px",
          padding: "16px",
          boxShadow: "0 4px 24px rgba(61, 90, 90, 0.08)",
          marginBottom: "20px",
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        {/* Search */}
        <div style={{ flex: 1, minWidth: "200px", position: "relative" }}>
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--text-muted)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari jurnal..."
            style={{ paddingLeft: "36px" }}
          />
        </div>

        {/* Emotion filter */}
        <select
          value={filterEmotion}
          onChange={(e) => setFilterEmotion(e.target.value)}
          style={{ width: "auto", minWidth: "140px", flex: "1 1 140px" }}
        >
          <option value="all">Semua Kondisi Mental</option>
          {uniqueEmotions.map((e) => (
            <option key={e} value={e} style={{ textTransform: "capitalize" }}>
              {e.toLowerCase() =="personality_disorder"? "Personality Disorder" : e.charAt(0).toUpperCase() + e.slice(1)}
            </option>
          ))}
        </select>

        {/* Stress level filter */}
        <select
          value={filterStress}
          onChange={(e) => setFilterStress(e.target.value)}
          style={{ width: "auto", minWidth: "140px", flex: "1 1 140px" }}
        >
          <option value="all">Semua Tingkat Stres</option>
          <option value="rendah">Stres Rendah</option>
          <option value="sedang">Stres Sedang</option>
          <option value="tinggi">Stres Tinggi</option>
        </select>
      </div>

      {/* Journal List */}
      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                height: "90px",
                background: "var(--bg-card)",
                borderRadius: "16px",
                boxShadow: "0 4px 24px rgba(61, 90, 90, 0.08)",
              }}
              className="animate-pulse-soft"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          {/* <div style={{ fontSize: "48px", marginBottom: "12px" }}>🔍</div> */}
          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px" }}>
            {journals.length === 0 ? "Belum Ada Jurnal" : "Tidak Ada Hasil"}
          </h3>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "20px" }}>
            {journals.length === 0
              ? "Mulai perjalanan jurnalmu sekarang!"
              : "Coba ubah kata kunci atau filter pencarian"}
          </p>
          {journals.length === 0 && (
            <Link
              href="/journal/new"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                marginTop:10,
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
              Tulis Jurnal Pertama
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {Object.entries(grouped).map(([month, monthJournals]) => (
            <div key={month}>
              <h2
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "10px",
                }}
              >
                {month}
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {monthJournals.map((j) => (
                  <Link key={j.id} href={`/journal/${j.id}`} style={{ textDecoration: "none" }}>
                    <div
                      className="history-journal-card"
                      style={{
                        background: "var(--bg-card)",
                        borderRadius: "16px",
                        padding: "16px 18px",
                        boxShadow: "0 4px 24px rgba(61, 90, 90, 0.08)",
                        display: "flex",
                        gap: "14px",
                        alignItems: "flex-start",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = "0 8px 30px rgba(61, 90, 90, 0.15)";
                        e.currentTarget.style.background = "var(--bg-card-hover)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = "0 4px 24px rgba(61, 90, 90, 0.08)";
                        e.currentTarget.style.background = "var(--bg-card)";
                      }}
                    >
                      {/* Date badge */}
                      <div
                        style={{
                          flexShrink: 0,
                          width: "44px",
                          textAlign: "center",
                        }}
                      >
                        <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--accent-blue)", lineHeight: 1 }}>
                          {new Date(j.created_at).getDate()}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500 }}>
                          {new Date(j.created_at).toLocaleDateString("id-ID", { weekday: "short" })}
                        </div>
                      </div>

                      {/* Divider */}
                      <div style={{ width: "1px", background: "var(--border-light)", alignSelf: "stretch" }} />

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="history-journal-title-row">
                          <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {j.title}
                          </h3>
                          <div className="history-journal-badges">
                            {j.emotion && (
                              <span
                                style={{
                                  background: `${emotionColor(j.emotion).slice(0, 7)}15`,
                                  color: emotionColor(j.emotion),
                                  padding: "2px 8px",
                                  borderRadius: "99px",
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  textTransform: "capitalize",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {j.emotion === "personality_disorder" ? "Personality Disorder" : j.emotion.charAt(0).toUpperCase() + j.emotion.slice(1)}
                              </span>
                            )}
                            {j.stress_score != null && (
                              <span
                                style={{
                                  background: `${stressColor(j.stress_score)}15`,
                                  color: stressColor(j.stress_score),
                                  padding: "2px 8px",
                                  borderRadius: "99px",
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                Stres {getStressLabel(j.stress_score)}
                              </span>
                            )}
                          </div>
                        </div>
                        <p style={{ fontSize: "13px", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {j.content.slice(0, 120)}
                          {j.content.length > 120 ? "..." : ""}
                        </p>
                      </div>

                      {/* Arrow */}
                      <div className="history-journal-arrow" style={{ flexShrink: 0, color: "var(--text-muted)" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination UI */}
      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "8px",
            marginTop: "32px",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            style={{
              padding: "10px 16px",
              background: "var(--bg-card)",
              color: currentPage === 1 ? "var(--text-muted)" : "var(--text-primary)",
              border: "1.5px solid var(--border-medium)",
              borderRadius: "12px",
              cursor: currentPage === 1 ? "not-allowed" : "pointer",
              fontSize: "13px",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Sebelumnya
          </button>
          
          {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              style={{
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: currentPage === page ? "var(--accent-teal)" : "var(--bg-card)",
                color: currentPage === page ? "#ffffff" : "var(--text-primary)",
                border: currentPage === page ? "1.5px solid var(--accent-teal)" : "1.5px solid var(--border-medium)",
                borderRadius: "12px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 600,
                boxShadow: currentPage === page ? "var(--shadow-teal)" : "none",
              }}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            style={{
              padding: "10px 16px",
              background: "var(--bg-card)",
              color: currentPage === totalPages ? "var(--text-muted)" : "var(--text-primary)",
              border: "1.5px solid var(--border-medium)",
              borderRadius: "12px",
              cursor: currentPage === totalPages ? "not-allowed" : "pointer",
              fontSize: "13px",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            Berikutnya
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      )}

      {/* Print Modal */}
      {showPrintModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "var(--bg-card)",
              border: "1.5px solid var(--border-medium)",
              borderRadius: "24px",
              width: "100%",
              maxWidth: "480px",
              padding: "28px",
              boxShadow: "var(--shadow-xl)",
              animation: "fadeIn 0.25s ease-out forwards",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>
                Cetak Laporan Jurnal
              </h3>
              <button
                onClick={() => setShowPrintModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  padding: "4px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "20px" }}>
              Pilih rentang tanggal jurnal yang ingin Anda cetak dalam bentuk PDF atau print langsung.
            </p>

            {/* Quick selectors */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
              {[
                { label: "7 Hari Terakhir", days: 7 },
                { label: "30 Hari Terakhir", days: 30 },
                { label: "Bulan Ini", type: "this-month" },
                { label: "Semua", type: "all" }
              ].map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    const today = new Date();
                    const todayStr = today.toISOString().split("T")[0];
                    if (item.days) {
                      const start = new Date();
                      start.setDate(today.getDate() - item.days);
                      setPrintStartDate(start.toISOString().split("T")[0]);
                      setPrintEndDate(todayStr);
                    } else if (item.type === "this-month") {
                      const start = new Date(today.getFullYear(), today.getMonth(), 1);
                      const offset = start.getTimezoneOffset();
                      const localStart = new Date(start.getTime() - (offset*60*1000));
                      setPrintStartDate(localStart.toISOString().split("T")[0]);
                      setPrintEndDate(todayStr);
                    } else {
                      setPrintStartDate("");
                      setPrintEndDate("");
                    }
                  }}
                  style={{
                    padding: "6px 12px",
                    background: "rgba(61, 90, 90, 0.08)",
                    border: "1px solid var(--border-teal)",
                    borderRadius: "9999px",
                    color: "var(--teal-badge)",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(61, 90, 90, 0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(61, 90, 90, 0.08)";
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Date Inputs */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  value={printStartDate}
                  onChange={(e) => setPrintStartDate(e.target.value)}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Tanggal Akhir
                </label>
                <input
                  type="date"
                  value={printEndDate}
                  onChange={(e) => setPrintEndDate(e.target.value)}
                  style={{ width: "100%" }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowPrintModal(false)}
                style={{
                  padding: "10px 18px",
                  background: "transparent",
                  border: "1.5px solid var(--border-medium)",
                  borderRadius: "12px",
                  color: "var(--text-secondary)",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Batal
              </button>
              <button
                onClick={() => {
                  handlePrint();
                  setShowPrintModal(false);
                }}
                style={{
                  padding: "10px 20px",
                  background: "#3d5a5a",
                  border: "none",
                  borderRadius: "12px",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 600,
                  boxShadow: "0 4px 12px rgba(61, 90, 90, 0.28)",
                  cursor: "pointer",
                }}
              >
                Cetak & Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


