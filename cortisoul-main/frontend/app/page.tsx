"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [fullname, setFullname] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, register, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading || isAuthenticated) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          height: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-primary)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <img
            src="/cortisoul-logo.png"
            alt="CortiSoul Logo"
            style={{
              width: "48px",
              height: "48px",
              objectFit: "contain",
            }}
            className="animate-pulse-soft"
          />
          <span
            style={{
              color: "var(--text-secondary)",
              fontSize: "14px",
            }}
          >
            Memuat...
          </span>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (mode === "register" && password !== confirmPassword) {
      setError("Password tidak cocok");
      return;
    }

    setIsLoading(true);
    try {
      if (mode === "register") {
        await register(username, password, fullname);
        // Auto-login setelah pendaftaran berhasil untuk UX yang seamless
        await login(username, password);
        router.push("/history?registered=success");
      } else {
        await login(username, password);
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-primary)",
        padding: "16px",
        position: "relative",
      }}
    >
      {/* Floating theme toggle — top right */}
      <button
        onClick={toggleTheme}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        title={isDark ? "Mode Terang" : "Mode Gelap"}
        style={{
          position: "fixed",
          top: "16px",
          right: "16px",
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          border: "1px solid var(--border-medium)",
          background: "var(--bg-card)",
          color: "var(--text-secondary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 100,
          boxShadow: "var(--shadow-md)",
          transition: "all 0.2s ease",
        }}
      >
        {isDark ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </button>
      {/* Background decoration — teal glow */}
      <div
        style={{
          position: "fixed",
          top: "-120px",
          left: "-120px",
          width: "480px",
          height: "480px",
          background: "radial-gradient(circle, rgba(61,90,90,0.1) 0%, transparent 65%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: "-100px",
          right: "-100px",
          width: "400px",
          height: "400px",
          background: "radial-gradient(circle, rgba(129,140,248,0.08) 0%, transparent 65%)",
          pointerEvents: "none",
        }}
      />

      <div
        className="animate-fadeIn"
        style={{
          background: "var(--bg-card)",
          borderRadius: "20px",
          border: "1px solid var(--border-teal)",
          boxShadow: "var(--shadow-xl), var(--shadow-teal)",
          width: "100%",
          maxWidth: "400px",
          overflow: "hidden",
        }}
      >
        {/* Header — dark with teal accent */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(61,90,90,0.15) 0%, rgba(0,0,0,0.08) 100%)",
            borderBottom: "1px solid var(--border-teal)",
            padding: "32px 32px 28px",
            textAlign: "center",
          }}
        >
          <img
            src="/cortisoul-logo.png"
            alt="CortiSoul Logo"
            style={{
              width: "56px",
              height: "56px",
              objectFit: "contain",
              margin: "0 auto 14px",
              filter: "drop-shadow(0 8px 16px rgba(61, 90, 90, 0.35))",
            }}
          />
          <h1 style={{ color: "var(--text-primary)", fontSize: "22px", fontWeight: 700, marginBottom: "6px" }}>
            {mode === "login" ? "Selamat Datang!" : "Buat Akun"}
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "13.5px" }}>
            {mode === "login"
              ? "Masuk untuk melanjutkan jurnal mentalmu"
              : "Daftarkan diri untuk mulai perjalananmu"}
          </p>
        </div>

        {/* Form */}
        <div style={{ padding: "24px 20px 28px" }}>
          {/* Tab switcher */}
          <div
            style={{
              display: "flex",
              background: "rgba(255,255,255,0.04)",
              borderRadius: "10px",
              padding: "4px",
              marginBottom: "24px",
              border: "1px solid var(--border-light)",
            }}
          >
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); }}
                style={{
                  flex: 1,
                  padding: "8px",
                  borderRadius: "8px",
                  border: "none",
                  background: mode === m ? "rgba(61,90,90,0.15)" : "transparent",
                  color: mode === m ? "var(--teal-badge)" : "var(--text-secondary)",
                  fontWeight: mode === m ? 600 : 400,
                  fontSize: "13.5px",
                  cursor: "pointer",
                  boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.2)" : "none",
                }}
              >
                {m === "login" ? "Masuk" : "Daftar"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {mode === "register" && (
                <>
                  <div className="animate-fadeIn">
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      value={fullname}
                      onChange={(e) => setFullname(e.target.value)}
                      placeholder="Masukkan nama lengkap"
                      required
                      autoComplete="name"
                    />
                  </div>
                </>
              )}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                required
                autoComplete="username"
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                required
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </div>

            
            {mode === "register" && (
              <>
                <div className="animate-fadeIn">
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>
                    Konfirmasi Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password"
                    required
                    autoComplete="new-password"
                  />
                </div>
              </>
            )}

            {error && (
              <div
                className="animate-fadeIn"
                style={{
                  background: "rgba(220, 38, 38, 0.1)",
                  border: "1px solid rgba(220, 38, 38, 0.25)",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  color: "#f87171",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              style={{
                marginTop: "4px",
                padding: "12px",
                background: isLoading
                  ? "rgba(61, 90, 90, 0.4)"
                  : "linear-gradient(135deg, #3d5a5a 0%, #2b3f3f 100%)",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                fontWeight: 600,
                fontSize: "15px",
                cursor: isLoading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: isLoading ? "none" : "0 4px 15px rgba(61, 90, 90, 0.3)",
              }}
            >
              {isLoading && (
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              )}
              {mode === "login" ? "Masuk" : "Daftar Sekarang"}
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: "13px", color: "var(--text-secondary)", marginTop: "20px" }}>
            {mode === "login" ? "Belum punya akun? " : "Sudah punya akun? "}
            <button
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
              style={{
                background: "none",
                border: "none",
                color: "var(--accent-teal)",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              {mode === "login" ? "Daftar" : "Masuk"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
