"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { SidebarDesktop, MobileTopBar, MobileBottomNav } from "@/components/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
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

  if (!isAuthenticated) return null;

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        minHeight: "100dvh",
        height: "100dvh",
        overflow: "hidden",
      }}
    >
      <SidebarDesktop />
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minHeight: "100%",
        }}
      >
        <MobileTopBar />
        <main
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            background: "var(--bg-primary)",
          }}
        >
          {children}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
