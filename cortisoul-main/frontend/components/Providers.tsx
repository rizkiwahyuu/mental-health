"use client";

import React from "react";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div style={{ minHeight: "100dvh", height: "100%" }}>
        <AuthProvider>{children}</AuthProvider>
      </div>
    </ThemeProvider>
  );
}
