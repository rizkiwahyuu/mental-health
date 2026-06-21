"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { journalsApi, type Journal, type StressLevel, type EmotionSummary } from "@/lib/api";
import NotificationSetup from "@/components/NotificationSetup";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Warna unik per nama emosi (dari data backend) */
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

/** Kembalikan warna untuk emosi, fallback ke accent-blue */
function emotionColor(emotion: string): string {
  return EMOTION_COLOR_MAP[emotion?.toLowerCase()] ?? "#3d5a5a";
}

/**
 * Kapitalisasi huruf pertama — tampilkan nama emosi apa adanya dari backend.
 * Tidak dilakukan penerjemahan; nama yang tersimpan di DB langsung ditampilkan.
 */
function formatEmotion(emotion: string): string {
  if (!emotion) return "";
  return emotion.charAt(0).toUpperCase() + emotion.slice(1);
}

// ─── Stress score (skala tampilan 0–10) ───────────────────────────────────────
// Backend weekly AVG bisa 0–10 (hasil ROUND di DB); jurnal lama bisa 0–1.

function isStressScoreDefined(
  score: number | null | undefined
): score is number {
  return typeof score === "number" && !Number.isNaN(score);
}

/** Normalisasi skor ke skala tampilan 0–10 */
function stressToDisplay(raw: number): number {
  return raw;
}

function displayStress(raw: number): string {
  return raw.toFixed(1);
}

function getStressColor(raw: number | null | undefined): string {
  if (raw == null) return "#94a3b8";
  if (raw < 4) return "#22c55e";   // Rendah
  if (raw < 7) return "#f97316";   // Sedang
  return "#ef4444";                    // Tinggi
}

function getStressLabel(raw: number | null | undefined): string {
  if (raw == null) return "-";
  if (raw < 4) return "Rendah";
  if (raw < 7) return "Sedang";
  return "Tinggi";
}

function normalizeStressLevels(levels: StressLevel[]): StressLevel[] {
  return levels.map((s) => ({
    ...s,
    averageScore: isStressScoreDefined(s.averageScore) ? s.averageScore : null,
  }));
}

/** Backend mengembalikan `label`; frontend mengharapkan `emotion` */
function normalizeEmotionSummary(
  items: Array<{ emotion?: string; label?: string; count: number }>
): EmotionSummary[] {
  return items
    .map((e) => ({
      emotion: (e.emotion ?? e.label ?? "").trim(),
      count: e.count,
    }))
    .filter((e) => e.emotion.length > 0);
}

// ─── Client-side weekly computation (fallback) ────────────────────────────────
// Digunakan sebagai fallback ketika endpoint /stress-levels dan /emotions
// mengembalikan data kosong (misal: bug filter tanggal di backend SQL).

const CLIENT_WEEK_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

/** Dapatkan awal minggu (Senin 00:00:00) berdasarkan waktu lokal browser */
function getClientWeekStart(): Date {
  const now = new Date();
  const day = now.getDay(); // 0=Min, 1=Sen, ...
  const delta = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + delta);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Hitung rata-rata stress per hari minggu ini dari data jurnal lokal.
 * Digunakan sebagai fallback ketika API weekly-stress mengembalikan kosong.
 */
function computeWeeklyStressFromJournals(journals: Journal[]): StressLevel[] {
  const monday = getClientWeekStart();
  const sundayEnd = new Date(monday);
  sundayEnd.setDate(monday.getDate() + 7); // exclusive upper bound

  // Kelompokkan skor per tanggal (YYYY-MM-DD lokal)
  const scoresByDate = new Map<string, number[]>();
  journals.forEach((j) => {
    if (j.stress_score == null || isNaN(j.stress_score)) return;
    const d = new Date(j.created_at);
    if (d < monday || d >= sundayEnd) return;
    // toLocaleDateString("en-CA") menghasilkan format YYYY-MM-DD
    const dateStr = d.toLocaleDateString("en-CA");
    if (!scoresByDate.has(dateStr)) scoresByDate.set(dateStr, []);
    scoresByDate.get(dateStr)!.push(j.stress_score);
  });

  return CLIENT_WEEK_DAYS.map((day, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const dateStr = date.toLocaleDateString("en-CA");
    const scores = scoresByDate.get(dateStr) || [];
    const avg =
      scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : null;
    return { date: dateStr, day, averageScore: avg };
  });
}

/**
 * Hitung ringkasan emosi minggu ini dari data jurnal lokal.
 * Digunakan sebagai fallback ketika API weekly-emotion mengembalikan kosong.
 */
function computeWeeklyEmotionFromJournals(journals: Journal[]): EmotionSummary[] {
  const monday = getClientWeekStart();
  const sundayEnd = new Date(monday);
  sundayEnd.setDate(monday.getDate() + 7);

  const counts = new Map<string, number>();
  journals.forEach((j) => {
    const d = new Date(j.created_at);
    if (d < monday || d >= sundayEnd || !j.emotion) return;
    counts.set(j.emotion, (counts.get(j.emotion) || 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([emotion, count]) => ({ emotion, count }))
    .sort((a, b) => b.count - a.count);
}

// ─── Stress Chart ─────────────────────────────────────────────────────────────

function StressChart({ stressLevels }: { stressLevels: StressLevel[] }) {
  const [tooltip, setTooltip] = useState<{
    x: number; y: number; score: number; day: string;
  } | null>(null);

  // Chart dimensi
  const W = 560;
  const H = 130;
  const PAD = { top: 16, right: 20, bottom: 32, left: 38 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  // Skala Y: tampilan 0–10
  const maxScore = 10;

  const baselineY = PAD.top + innerH;

  const points = stressLevels.map((s, i) => ({
    x: PAD.left + (i / Math.max(stressLevels.length - 1, 1)) * innerW,
    y: isStressScoreDefined(s.averageScore)
      ? PAD.top + innerH - (stressToDisplay(s.averageScore) / maxScore) * innerH
      : null,
    score: isStressScoreDefined(s.averageScore) ? s.averageScore : null,
    day: s.day,
  }));

  const validPoints = points.filter((p) => p.y !== null) as Array<{
    x: number; y: number; score: number; day: string;
  }>;

  // Smooth bezier
  const linePath = validPoints.length > 1
    ? validPoints.map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = validPoints[i - 1];
      const cpx = (prev.x + p.x) / 2;
      return `C ${cpx} ${prev.y} ${cpx} ${p.y} ${p.x} ${p.y}`;
    }).join(" ")
    : "";

  const areaPath = linePath
    ? `${linePath} L ${validPoints[validPoints.length - 1].x} ${baselineY} L ${validPoints[0].x} ${baselineY} Z`
    : validPoints.length === 1
      ? `M ${validPoints[0].x} ${validPoints[0].y} L ${validPoints[0].x} ${baselineY} Z`
      : "";

  const yGridValues = [0, 2.5, 5, 7.5, 10];

  const hasAnyData = stressLevels.some((s) => isStressScoreDefined(s.averageScore));

  if (stressLevels.length === 0 || !hasAnyData) {
    return (
      <div style={{ height: "130px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
          Belum ada data stres minggu ini
        </p>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <style>{`
        @keyframes tooltipFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <svg
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        style={{ overflow: "visible", display: "block" }}
      >
        <defs>
          <linearGradient id="stressAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-area-stop)" stopOpacity="var(--chart-area-opacity)" />
            <stop offset="100%" stopColor="var(--chart-area-stop)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="stressLineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--chart-line-start)" />
            <stop offset="100%" stopColor="var(--chart-line-end)" />
          </linearGradient>
        </defs>

        {/* Y-axis grid + labels (skala 0–10) */}
        {yGridValues.map((val) => {
          const gy = PAD.top + innerH - (val / maxScore) * innerH;
          return (
            <g key={val}>
              <line
                x1={PAD.left} y1={gy}
                x2={PAD.left + innerW} y2={gy}
                stroke="var(--border-light)"
                strokeWidth="1"
                strokeDasharray={val === 0 ? "0" : "4 3"}
              />
              <text
                x={PAD.left - 6} y={gy + 4}
                textAnchor="end" fontSize="9" fill="var(--text-muted)"
                fontFamily="Inter, sans-serif"
              >
                {val % 1 === 0 ? val.toFixed(0) : val.toFixed(2)}
              </text>
            </g>
          );
        })}

        {/* Area */}
        {areaPath && <path d={areaPath} fill="url(#stressAreaGrad)" />}

        {/* Line */}
        {linePath && (
          <path d={linePath} fill="none"
            stroke="url(#stressLineGrad)"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          />
        )}

        {/* Active hover vertical guideline */}
        {tooltip && (
          <line
            x1={tooltip.x}
            y1={PAD.top}
            x2={tooltip.x}
            y2={baselineY}
            stroke={getStressColor(tooltip.score)}
            strokeWidth="1.5"
            strokeDasharray="4 3"
            opacity="0.3"
            style={{ pointerEvents: "none" }}
          />
        )}

        {/* Dots */}
        {validPoints.length === 1 && (
          <line
            x1={validPoints[0].x} y1={validPoints[0].y}
            x2={validPoints[0].x} y2={baselineY}
            stroke="var(--border-medium)" strokeWidth="1" strokeDasharray="4 3"
          />
        )}

        {points.map((p, i) => {
          if (p.y === null || p.score === null) {
            return (
              <circle key={i}
                cx={p.x} cy={baselineY}
                r="3" fill="var(--bg-primary)" stroke="var(--border-medium)" strokeWidth="1.5"
              />
            );
          }
          const col = getStressColor(p.score);
          const isHovered = tooltip && tooltip.x === p.x;
          const outerRadius = isHovered ? 11 : 7;
          const innerRadius = isHovered ? 6 : 4.5;
          const outerOpacity = isHovered ? 0.45 : 0.25;

          return (
            <g key={i}>
              <rect
                x={p.x - 18} y={PAD.top}
                width="36" height={innerH}
                fill="transparent"
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setTooltip({ x: p.x, y: p.y!, score: p.score!, day: p.day })}
                onMouseLeave={() => setTooltip(null)}
              />
              {/* Glow circle */}
              <circle 
                cx={p.x} cy={p.y} r={outerRadius} fill={col} opacity={outerOpacity} 
                style={{ transition: "all 0.15s ease", pointerEvents: "none" }} 
              />
              {/* Center dot */}
              <circle 
                cx={p.x} cy={p.y} r={innerRadius}
                fill="var(--bg-card)" stroke={col} strokeWidth={isHovered ? "3.5" : "2.5"}
                style={{ transition: "all 0.15s ease", pointerEvents: "none" }}
              />
            </g>
          );
        })}

        {/* X-axis day labels */}
        {stressLevels.map((s, i) => (
          <text key={i}
            x={PAD.left + (i / Math.max(stressLevels.length - 1, 1)) * innerW}
            y={H - 6}
            textAnchor="middle" fontSize="10" fill="var(--text-muted)"
            fontFamily="Inter, sans-serif" fontWeight="500"
          >
            {s.day.slice(0, 3)}
          </text>
        ))}
      </svg>

      {/* Simplified, premium responsive HTML Tooltip */}
      {tooltip && (() => {
        const col = getStressColor(tooltip.score);
        const leftPct = (tooltip.x / W) * 100;
        const topPct = (tooltip.y / H) * 100;
        return (
          <div
            style={{
              position: "absolute",
              left: `${leftPct}%`,
              top: `${topPct}%`,
              transform: "translate(-50%, -100%) translateY(-10px)",
              pointerEvents: "none",
              zIndex: 10,
            }}
          >
            <div
              style={{
                background: "var(--bg-card)",
                border: `1.5px solid ${col}`,
                borderRadius: "20px",
                padding: "5px 12px",
                boxShadow: "var(--shadow-md)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                whiteSpace: "nowrap",
                animation: "tooltipFadeIn 0.15s ease-out forwards",
              }}
            >
              <span style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--text-primary)",
                fontFamily: "Inter, sans-serif",
              }}>
                {tooltip.day} · <span style={{ fontWeight: 800, color: col }}>{displayStress(tooltip.score)}</span>
              </span>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─── Emotion Panel ────────────────────────────────────────────────────────────

function EmotionPanel({ emotionSummary }: { emotionSummary: EmotionSummary[] }) {
  if (emotionSummary.length === 0) {
    return (
      <p style={{ fontSize: "15px", color: "#64748B", marginTop: "4px", lineHeight: 1.5 }}>
        Belum ada data kondisi mental minggu ini. Mulai menulis jurnal!
      </p>
    );
  }

  const dominant = emotionSummary.reduce((a, b) => (a.count >= b.count ? a : b));
  const domName = formatEmotion(dominant.emotion);
  const domColor = emotionColor(dominant.emotion);
  const totalCount = emotionSummary.reduce((s, e) => s + e.count, 0);

  return (
    <>
      {/* Dominant emotion card */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "14px",
        marginBottom: "20px",
        padding: "16px 0",
        borderBottom: "1px solid var(--border-light)",
      }}>
        <div style={{
          width: "16px",
          height: "16px",
          borderRadius: "50%",
          background: domColor,
          boxShadow: `0 0 8px ${domColor}80`,
          flexShrink: 0,
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: "13px",
            fontWeight: 500,
            color: "var(--text-secondary)",
            marginBottom: "4px",
          }}>
            Kondisi mental dominan
          </p>
          <p style={{
            fontSize: "20px",
            fontWeight: 700,
            color: domColor,
            textTransform: "capitalize",
            lineHeight: 1.2,
          }}>
            {domName.toLowerCase() == "personality_disorder" ? "Personality Disorder" : domName || "—"}
          </p>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>
            {dominant.count}x muncul minggu ini
          </p>
        </div>
      </div>
      {console.log('domName===============================',domName.toLowerCase())}

      {/* Emotion bar list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {emotionSummary.slice(0, 3).map((e, i) => {
          const pct = Math.round((e.count / totalCount) * 100);
          const col = emotionColor(e.emotion);
          return (
            <div key={e.emotion ? e.emotion + i : i}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "6px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    background: col,
                    boxShadow: `0 0 6px ${col}60`,
                    flexShrink: 0,
                  }} />
                  <span style={{
                    fontSize: "16px",
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    textTransform: "capitalize",
                  }}>
                    {formatEmotion(e.emotion).toLowerCase()==="personality_disorder"? "Personality Disorder" : formatEmotion(e.emotion)}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{e.count}x</span>
                  <span style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: col,
                    background: `${col}15`,
                    padding: "2px 8px",
                    borderRadius: "99px",
                  }}>
                    {pct}%
                  </span>
                </div>
              </div>
              <div style={{
                height: "4px",
                background: "var(--border-light)",
                borderRadius: "99px",
                overflow: "hidden",
                marginLeft: "28px",
              }}>
                <div style={{
                  height: "100%",
                  width: `${pct}%`,
                  background: col,
                  borderRadius: "99px",
                  transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}


// ─── Dashboard Page ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  const [journals, setJournals] = useState<Journal[]>([]);
  const [stressLevels, setStressLevels] = useState<StressLevel[]>([]);
  const [emotionSummary, setEmotionSummary] = useState<EmotionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [todayJournal, setTodayJournal] = useState<Journal | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Promise.allSettled: salah satu endpoint gagal tidak membatalkan yang lain
      const [journalsResult, stressResult, emotionResult] = await Promise.allSettled([
        journalsApi.getAll(),
        journalsApi.getWeeklyStress(),
        journalsApi.getWeeklyEmotion(),
      ]);
      console.log('journalsResult', journalsResult);
      console.log('stressResult', stressResult);
      console.log('emotionResult', emotionResult);

      // ── Journals ──────────────────────────────────────────────────────────
      const allJournals =
        journalsResult.status === "fulfilled"
          ? journalsResult.value.data?.journals || []
          : [];

      const sortedJournals = [...allJournals].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setJournals(sortedJournals);

      const today = new Date().toDateString();
      setTodayJournal(
        allJournals.find((j: Journal) => new Date(j.created_at).toDateString() === today) ?? null
      );

      // ── Stress levels ─────────────────────────────────────────────────────
      // Coba pakai data API; jika kosong fallback ke perhitungan client-side
      // dari data jurnal (workaround untuk bug filter tanggal di backend SQL).
      const apiStressLevels =
        stressResult.status === "fulfilled"
          ? normalizeStressLevels(stressResult.value.data?.stressLevels || [])
          : [];
      const hasApiStressData = apiStressLevels.some((s) =>
        isStressScoreDefined(s.averageScore)
      );
      setStressLevels(
        hasApiStressData
          ? apiStressLevels
          : computeWeeklyStressFromJournals(allJournals)
      );

      // ── Emotion summary ───────────────────────────────────────────────────
      // Sama: coba API dulu, fallback ke client-side jika kosong.
      const apiEmotionSummary =
        emotionResult.status === "fulfilled"
          ? normalizeEmotionSummary(emotionResult.value.data?.emotionSummary || [])
          : [];
      setEmotionSummary(
        apiEmotionSummary.length > 0
          ? apiEmotionSummary
          : computeWeeklyEmotionFromJournals(allJournals)
      );
    } catch (err) {
      console.error("[Dashboard] Gagal memuat data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Selamat Pagi";
    if (h < 15) return "Selamat Siang";
    if (h < 18) return "Selamat Sore";
    return "Selamat Malam";
  };

  const todayDate = new Date().toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  console.log('emotionSummary===============================',emotionSummary)
  console.log('stressLevels===============================',stressLevels)

  const validScores = stressLevels
    .filter((s) => isStressScoreDefined(s.averageScore))
    .map((s) => s.averageScore as number);
  const avgStressRaw = validScores.length > 0
    ? validScores.reduce((a, b) => a + b, 0) / validScores.length
    : null;

  if (isLoading) {
    return (
      <div className="app-page" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {[1, 2, 3].map((i) => (
          <div key={i}
            style={{ height: "120px", background: "var(--bg-card)", borderRadius: "16px", boxShadow: "0 4px 24px rgba(61, 90, 90, 0.08)" }}
            className="animate-pulse-soft"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="app-page animate-fadeIn">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: "28px" }}>
        <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginBottom: "4px" }}>
          {todayDate}
        </p>
        <h1 className="dashboard-greeting" style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>
          {greeting()}, {user?.fullname || user?.username || "Pengguna"}!
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
          Bagaimana perasaanmu hari ini? Yuk ceritakan lewat jurnal.
        </p>
      </div>

      <NotificationSetup />

      {/* ── Quick CTA + Emosi Dominan ───────────────────────────────────────── */}
      <div className="grid-2-responsive" style={{ marginBottom: "20px" }}>

        {/* Write Journal CTA */}
        <div style={{
          background: "var(--cta-bg)",
          borderRadius: "16px",
          padding: "28px 32px",
          boxShadow: "0 4px 24px rgba(61, 90, 90, 0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "20px",
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "10px",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--accent-teal)" aria-hidden="true">
                <circle cx="12" cy="5.5" r="2.5" />
                <path d="M12 9c-2.5 0-4.5 1.2-5.5 3.2-.5.9-.5 2-.5 2.8v.5h12v-.5c0-.8 0-1.9-.5-2.8C16.5 10.2 14.5 9 12 9z" />
                <path d="M8 18.5c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="var(--accent-teal)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                <path d="M6 20.5c1.5-1.2 3.5-2 6-2s4.5.8 6 2" stroke="var(--accent-teal)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </svg>
              <span style={{
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.12em",
                color: "var(--teal-badge)",
                textTransform: "uppercase",
              }}>
                {todayJournal ? "Jurnal Hari Ini" : "Isi Jurnal Harian"}
              </span>
            </div>
            <h2 style={{
              fontSize: "clamp(18px, 2.5vw, 24px)",
              fontWeight: 700,
              color: "var(--cta-text)",
              lineHeight: 1.35,
              margin: 0,
            }}>
              {todayJournal
                ? "Kamu sudah menulis jurnal hari ini"
                : "Saatnya untuk eksplorasi perasaan mu"}
            </h2>
            <Link
              href={todayJournal ? `/journal/${todayJournal.id}` : "/journal/new"}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                marginTop: 10,
                flexShrink: 0,
                background: "var(--accent-teal)",
                color: "#ffffff",
                padding: "12px 24px",
                borderRadius: "9999px",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textDecoration: "none",
                textTransform: "uppercase",
                boxShadow: "0 4px 12px var(--accent-teal-glow)",
                whiteSpace: "nowrap",
              }}
            >
              {todayJournal ? "Lihat Jurnal" : "Start Reflection"}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Emotion Dominant Panel */}
        <div style={{
          background: "var(--bg-card)",
          borderRadius: "16px",
          padding: "28px 32px",
          boxShadow: "0 4px 24px rgba(61, 90, 90, 0.08)",
        }}>
          <h2 style={{
            fontSize: "clamp(10px, 2.8vw, 20px)",
            fontWeight: 700,
            color: "var(--text-primary)",
            lineHeight: 1.25,
            margin: "0 0 10px 0",
          }}>
            Kondisi Mental Dominan Minggu ini
          </h2>
          <p style={{
            fontSize: "15px",
            fontWeight: 400,
            color: "var(--text-secondary)",
            margin: "0 0 10px 0",
            lineHeight: 1.5,
          }}>
            Berdasarkan jurnalmu yang kamu tulis minggu ini
          </p>
          <EmotionPanel emotionSummary={emotionSummary} />
        </div>
      </div>

      {/* ── Stress Chart ────────────────────────────────────────────────────── */}
      <div className="card-padding-sm" style={{
        background: "var(--bg-card)", borderRadius: "16px", padding: "24px",
        boxShadow: "0 4px 24px rgba(61, 90, 90, 0.08)",
        marginBottom: "20px",
      }}>
        {/* Header baris: judul kiri, badge rata-rata kanan */}
        <div className="stress-chart-header" style={{ marginBottom: "16px" }}>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "2px" }}>
              Tingkat Stres Minggu Ini
            </h2>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
              Berdasarkan analisis AI · Skala 0–10 
            </p>
          </div>

          {/* Badge rata-rata — di header, bukan di dalam SVG */}
          {avgStressRaw !== null && (
            <div className="stress-avg-badge" style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: "4px",
            }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "2px" }}>
                <span style={{
                  fontSize: "26px",
                  fontWeight: 800,
                  color: getStressColor(avgStressRaw),
                  lineHeight: 1,
                }}>
                  {displayStress(avgStressRaw)}
                </span>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>
                  /10
                </span>
              </div>
              <span style={{
                display: "inline-block",
                background: `${getStressColor(avgStressRaw)}18`,
                color: getStressColor(avgStressRaw),
                fontSize: "11px",
                fontWeight: 700,
                padding: "2px 10px",
                borderRadius: "99px",
              }}>
                Rata-rata · {getStressLabel(avgStressRaw)} 
              </span>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="stress-legend" style={{ marginBottom: "14px" }}>
          {[
            { label: "Rendah  (0–3)", color: "#22c55e" },
            { label: "Sedang (4–6)", color: "#f97316" },
            { label: "Tinggi   (7–10)", color: "#ef4444" },
          ].map((l) => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <div style={{
                width: "8px", height: "8px",
                borderRadius: "50%",
                background: l.color,
                flexShrink: 0,
              }} />
              <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{l.label}</span>
            </div>
          ))}
        </div>

        <StressChart stressLevels={stressLevels} />
      </div>

      {/* ── Recent Journals ─────────────────────────────────────────────────── */}
      <div style={{
        background: "var(--bg-card)", borderRadius: "16px", padding: "24px",
        boxShadow: "0 4px 24px rgba(61, 90, 90, 0.08)",
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: "16px",
        }}>
          <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>
            Jurnal Terbaru
          </h2>
          <Link href="/history" style={{
            fontSize: "13px", color: "var(--accent-blue)",
            textDecoration: "none", fontWeight: 500,
          }}>
            Lihat Semua →
          </Link>
        </div>

        {journals.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "16px" }}>
              Belum ada jurnal. Mulai ceritakan harimu!
            </p>
            <Link href="/journal/new" style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              background: "var(--accent-teal)", color: "#fff",
              padding: "10px 20px", borderRadius: "10px",
              fontSize: "14px", fontWeight: 600, textDecoration: "none",
              boxShadow: "0 4px 12px rgba(61, 90, 90, 0.3)",
            }}>
              Tulis Jurnal Pertama
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {journals.slice(0, 4).map((j) => (
              <Link key={j.id} href={`/journal/${j.id}`} style={{ textDecoration: "none" }}>
                <div
                  style={{
                    padding: "13px 15px", borderRadius: "12px",
                    border: "1px solid var(--border-light)",
                    display: "flex", justifyContent: "space-between",
                    alignItems: "flex-start", gap: "12px", cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-card-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontWeight: 600, fontSize: "14px",
                      color: "var(--text-primary)", marginBottom: "3px",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {j.title}
                    </p>
                    <p style={{
                      fontSize: "12.5px", color: "var(--text-secondary)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {j.content.slice(0, 100)}...
                    </p>
                  </div>
                  <div style={{
                    display: "flex", flexDirection: "column",
                    alignItems: "flex-end", gap: "5px", flexShrink: 0,
                  }}>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      {new Date(j.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </span>
                    {j.emotion && (
                      <span style={{
                        background: `${emotionColor(j.emotion)}15`,
                        color: emotionColor(j.emotion),
                        padding: "2px 8px", borderRadius: "99px",
                        fontSize: "11px", fontWeight: 600, textTransform: "capitalize",
                      }}>
                        {formatEmotion(j.emotion).toLowerCase() === "personality_disorder" ? "Personality Disorder" : formatEmotion(j.emotion)}
                      </span>
                    )}
                    {j.stress_score != null && (
                      <span style={{
                        background: `${getStressColor(j.stress_score)}15`,
                        color: getStressColor(j.stress_score),
                        padding: "2px 8px", borderRadius: "99px",
                        fontSize: "11px", fontWeight: 600,
                      }}>
                        Stres {getStressLabel(j.stress_score)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
