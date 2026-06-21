"use client";

import React, { useEffect, useState, useCallback } from "react";
import { notificationsApi } from "@/lib/api";

type NotifStatus = "idle" | "loading" | "granted" | "denied" | "unsupported";

/**
 * Komponen yang mengelola pendaftaran Web Push Notification.
 * Ditampilkan sebagai banner di bagian atas halaman jika izin belum diberikan.
 * Secara otomatis mendaftar ke backend jika izin sudah diberikan.
 */
export default function NotificationSetup() {
  const [status, setStatus] = useState<NotifStatus>("idle");
  const [dismissed, setDismissed] = useState(false);
  const [justGranted, setJustGranted] = useState(false);
  const [testingNotif, setTestingNotif] = useState(false);
  const [testMessage, setTestMessage] = useState<string | null>(null);

  // Ambil VAPID public key dari environment variable
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  const checkCurrentPermission = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "granted") setStatus("granted");
    else if (Notification.permission === "denied") setStatus("denied");
    else setStatus("idle");
  }, []);

  useEffect(() => {
    checkCurrentPermission();
  }, [checkCurrentPermission]);

  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeToNotifications = useCallback(async () => {
    if (!vapidPublicKey) {
      console.warn("[Notif] NEXT_PUBLIC_VAPID_PUBLIC_KEY belum diset");
      return;
    }

    setStatus("loading");
    try {
      // Daftarkan service worker
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });
      await navigator.serviceWorker.ready;

      // Minta izin notifikasi dari browser
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }

      // Subscribe ke Push API
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as any,
      });

      // Kirim subscription ke backend
      await notificationsApi.subscribe(subscription.toJSON());
      setStatus("granted");
      setJustGranted(true);
    } catch (err) {
      console.error("[Notif] Gagal subscribe:", err);
      setStatus("denied");
    }
  }, [vapidPublicKey]);

  const sendTestPush = useCallback(async () => {
    setTestingNotif(true);
    setTestMessage(null);
    try {
      const response = await notificationsApi.test();
      if (response.status === "success" || response.code === 200 || response.status === "OK" || (response as any).message) {
        setTestMessage("Notifikasi uji coba berhasil dikirim! Silakan periksa desktop/layar HP Anda.");
      } else {
        setTestMessage("Notifikasi uji coba terkirim.");
      }
    } catch (err: any) {
      console.error("[Notif] Gagal mengirim notifikasi tes:", err);
      setTestMessage(`Gagal mengirim notifikasi: ${err.message || "kesalahan tidak dikenal"}`);
    } finally {
      setTestingNotif(false);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
  };

  // Jangan tampilkan jika: sudah granted (dan tidak dalam mode justGranted), denied, unsupported, dismissed, atau VAPID key tidak ada
  if (
    (status === "granted" && !justGranted) ||
    status === "denied" ||
    status === "unsupported" ||
    dismissed ||
    !vapidPublicKey
  ) {
    return null;
  }

  if (status === "granted" && justGranted) {
    return (
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-light)",
          borderRadius: "16px",
          padding: "24px clamp(16px, 4vw, 32px)",
          boxShadow: "0 4px 24px rgba(61, 90, 90, 0.04)",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          marginBottom: "24px",
          transition: "all 0.3s ease",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "20px",
            flexWrap: "wrap",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", flex: 1, minWidth: "260px" }}>
            {/* <div 
              style={{ 
                fontSize: "24px", 
                background: "rgba(16, 185, 129, 0.1)", 
                padding: "12px", 
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#10b981",
                flexShrink: 0
              }}
            >
              🎉
            </div> */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <h3 style={{ color: "var(--text-primary)", fontSize: "16px", fontWeight: 700, margin: 0 }}>
                Notifikasi Berhasil Diaktifkan!
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "13.5px", fontWeight: 400, margin: 0, lineHeight: 1.5 }}>
                Hebat! Sekarang Anda dapat menerima notifikasi pengingat jurnal setiap harinya.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", flexShrink: 0, flexWrap: "wrap" }}>
            {/* <button
              onClick={sendTestPush}
              disabled={testingNotif}
              style={{
                padding: "10px 20px",
                background: "#10b981",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                fontSize: "13.5px",
                fontWeight: 700,
                cursor: testingNotif ? "not-allowed" : "pointer",
                opacity: testingNotif ? 0.8 : 1,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s ease",
              }}
            >
              {testingNotif ? (
                <>
                  <svg
                    style={{ animation: "spin 1s linear infinite" }}
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Mengirim...
                </>
              ) : (
                "Kirim Uji Coba"
              )}
            </button> */}
            <button
              onClick={() => setJustGranted(false)}
              style={{
                padding: "10px 18px",
                background: "var(--border-light)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-light)",
                borderRadius: "10px",
                fontSize: "13.5px",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              Selesai
            </button>
          </div>
        </div>
        {testMessage && (
          <div
            style={{
              background: "rgba(16, 185, 129, 0.06)",
              borderLeft: "4px solid #10b981",
              padding: "10px 16px",
              borderRadius: "0 8px 8px 0",
              marginLeft: "52px",
            }}
          >
            <p
              style={{
                color: "var(--text-primary)",
                fontSize: "13px",
                margin: 0,
                fontWeight: 500,
              }}
            >
              {testMessage}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-light)",
        borderRadius: "16px",
        padding: "24px clamp(16px, 4vw, 32px)",
        boxShadow: "0 4px 24px rgba(61, 90, 90, 0.04)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "24px",
        flexWrap: "wrap",
        marginBottom: "24px",
        transition: "all 0.3s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", flex: 1, minWidth: "260px" }}>
        {/* <div 
          style={{ 
            fontSize: "24px", 
            background: "rgba(61, 90, 90, 0.08)", 
            padding: "12px", 
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--accent-teal)",
            flexShrink: 0
          }}
        >
          🔔
        </div> */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <h3 style={{ color: "var(--text-primary)", fontSize: "16px", fontWeight: 700, margin: 0 }}>
            Aktifkan Pengingat Jurnal Harian
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "13.5px", fontWeight: 400, margin: 0, lineHeight: 1.5 }}>
            Dapatkan notifikasi agar tetap konsisten menulis jurnal harian dan memantau kesehatan mentalmu.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", flexShrink: 0, flexWrap: "wrap" }}>
        <button
          onClick={subscribeToNotifications}
          disabled={status === "loading"}
          style={{
            padding: "10px 24px",
            background: "var(--accent-teal)",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            fontSize: "13.5px",
            fontWeight: 700,
            cursor: status === "loading" ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            opacity: status === "loading" ? 0.8 : 1,
            boxShadow: "0 4px 12px var(--accent-teal-glow)",
            transition: "all 0.2s ease",
          }}
        >
          {status === "loading" ? (
            <>
              <svg
                style={{ animation: "spin 1s linear infinite" }}
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Memproses...
            </>
          ) : (
            "Aktifkan"
          )}
        </button>
        <button
          onClick={handleDismiss}
          style={{
            padding: "10px 18px",
            background: "var(--border-light)",
            color: "var(--text-secondary)",
            border: "1px solid var(--border-light)",
            borderRadius: "10px",
            fontSize: "13.5px",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          Nanti
        </button>
      </div>
    </div>
  );
}
