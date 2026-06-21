"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Beranda", shortLabel: "Beranda", icon: HomeIcon },
  { href: "/journal/new", label: "Tulis Jurnal", shortLabel: "Tulis", icon: PenIcon },
  { href: "/history", label: "Riwayat Jurnal", shortLabel: "Riwayat", icon: BookIcon },
];

function LogoMark({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function isNavActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

/** Sun / Moon toggle button */
function ThemeToggleButton({ compact = false }: { compact?: boolean }) {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Mode Terang" : "Mode Gelap"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: compact ? 0 : "10px",
        padding: compact ? "8px" : "10px 12px",
        borderRadius: "10px",
        border: "none",
        background: isDark
          ? "rgba(255,255,255,0.06)"
          : "rgba(0,0,0,0.04)",
        color: "var(--text-sidebar)",
        fontWeight: 400,
        fontSize: "14px",
        width: compact ? "auto" : "100%",
        cursor: "pointer",
        flexShrink: 0,
        transition: "background 0.2s, color 0.2s",
      }}
      onMouseEnter={(e) =>
      (e.currentTarget.style.background = isDark
        ? "rgba(255,255,255,0.1)"
        : "rgba(0,0,0,0.08)")
      }
      onMouseLeave={(e) =>
      (e.currentTarget.style.background = isDark
        ? "rgba(255,255,255,0.06)"
        : "rgba(0,0,0,0.04)")
      }
    >
      {isDark ? (
        // Sun icon
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.85 }}>
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
        // Moon icon
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.85 }}>
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
      {!compact && (
        <span>{isDark ? "Mode Terang" : "Mode Gelap"}</span>
      )}
    </button>
  );
}

/** Desktop sidebar — hidden on mobile via CSS */
export function SidebarDesktop() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <aside 
      className="sidebar-desktop"
      style={{
        background: isDark ? "#0d1526" : "#ffffff",
        borderRight: isDark ? "1px solid rgba(255, 255, 255, 0.06)" : "1px solid rgba(0, 0, 0, 0.06)",
        transition: "all 0.25s ease-in-out",
      }}
    >
      <SidebarHeader user={user} />
      <SidebarNav pathname={pathname} />
      <SidebarLogout onLogout={handleLogout} />
    </aside>
  );
}

/** Mobile top bar — shown only on mobile via CSS */
export function MobileTopBar() {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <header 
      className="mobile-top-bar" 
      style={{ 
        background: isDark ? "#0d1526" : "#ffffff",
        borderBottom: isDark ? "1px solid rgba(255, 255, 255, 0.06)" : "1px solid rgba(0, 0, 0, 0.06)",
        transition: "all 0.25s ease-in-out",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
        <img
          src="/cortisoul-logo.png"
          alt="CortiSoul Logo"
          style={{
            width: "32px",
            height: "32px",
            objectFit: "contain",
            flexShrink: 0,
          }}
        />
        <div style={{ minWidth: 0 }}>
          <p
            style={{
              color: isDark ? "#fff" : "#3d5a5a",
              fontWeight: 700,
              fontSize: "15px",
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              transition: "color 0.2s",
            }}
          >
            CortiSoul
          </p>
          {user && (
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "11px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              @{user.username}
            </p>
          )}
        </div>
      </div>
      {/* Theme toggle + Logout */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
        <ThemeToggleButton compact />
        <button
          onClick={handleLogout}
          aria-label="Keluar"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            border: "none",
            background: "rgba(248,113,113,0.12)",
            color: "#f87171",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <LogoutIcon size={17} />
        </button>
      </div>
    </header>
  );
}

/** Mobile bottom nav — fixed, shown only on mobile via CSS */
export function MobileBottomNav() {
  const pathname = usePathname();
  const { isDark } = useTheme();

  return (
    <nav 
      className="mobile-bottom-nav" 
      aria-label="Navigasi utama"
      style={{
        background: isDark ? "#0d1526" : "#ffffff",
        borderTop: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(0, 0, 0, 0.06)",
        transition: "all 0.25s ease-in-out",
      }}
    >
      <div className="mobile-bottom-nav__inner">
        {navItems.map((item) => {
          const isActive = isNavActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-bottom-nav__link${isActive ? " mobile-bottom-nav__link--active" : ""}`}
              style={{
                color: isActive ? (isDark ? "#fff" : "#3d5a5a") : "var(--text-sidebar)",
                background: isActive ? (isDark ? "rgba(61, 90, 90, 0.2)" : "rgba(61, 90, 90, 0.08)") : "transparent",
              }}
            >
              <Icon size={20} style={{ opacity: isActive ? 1 : 0.75, flexShrink: 0 }} />
              <span>{item.shortLabel}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default function Sidebar() {
  return (
    <>
      <SidebarDesktop />
      <MobileTopBar />
      <MobileBottomNav />
    </>
  );
}

function SidebarHeader({ user }: { user: { username: string } | null }) {
  const { isDark } = useTheme();
  return (
    <div
      style={{
        padding: "32px 24px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <img
          src="/cortisoul-logo.png"
          alt="CortiSoul Logo"
          style={{
            width: "36px",
            height: "36px",
            objectFit: "contain",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            color: isDark ? "#ffffff" : "#3d5a5a",
            fontWeight: 800,
            fontSize: "24px",
            letterSpacing: "-0.03em",
            fontFamily: "Inter, sans-serif",
            transition: "color 0.2s",
          }}
        >
          Corti<span style={{ fontWeight: 500 }}>Soul</span>
        </span>
      </div>

      {user && (
        <div
          style={{
            padding: "10px 12px",
            background: isDark ? "rgba(255,255,255,0.06)" : "rgba(61,90,90,0.04)",
            borderRadius: "10px",
            transition: "background 0.2s",
          }}
        >
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "11px",
              marginBottom: "2px",
            }}
          >
            Masuk sebagai
          </p>
          <p
            style={{
              color: isDark ? "#fff" : "#1e293b",
              fontSize: "13px",
              fontWeight: 500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              transition: "color 0.2s",
            }}
          >
            @{user.username}
          </p>
        </div>
      )}
    </div>
  );
}

function SidebarNav({ pathname }: { pathname: string }) {
  const { isDark } = useTheme();
  
  // Filter out the "Tulis Jurnal" from the regular list items in the desktop sidebar,
  // since it will be rendered as a prominent CTA button at the top!
  const desktopNavItems = navItems.filter(item => item.href !== "/journal/new");

  return (
    <div style={{ flex: 1, padding: "0 16px", display: "flex", flexDirection: "column", gap: "24px" }}>
      
      {/* Premium CTA Button matching the image */}
      <Link
        href="/journal/new"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#3d5a5a",
          color: "#ffffff",
          padding: "12px 20px",
          borderRadius: "12px",
          fontSize: "14.5px",
          fontWeight: 700,
          textDecoration: "none",
          textAlign: "center",
          boxShadow: "0 4px 14px rgba(61, 90, 90, 0.2)",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#2d4343";
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = "0 6px 20px rgba(61, 90, 90, 0.3)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#3d5a5a";
          e.currentTarget.style.transform = "none";
          e.currentTarget.style.boxShadow = "0 4px 14px rgba(61, 90, 90, 0.2)";
        }}
      >
        Isi Jurnal Harian
      </Link>

      <nav
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        {desktopNavItems.map((item) => {
          const isActive = isNavActive(pathname, item.href);
          const Icon = item.icon;
          
          const activeBg = isDark ? "rgba(61, 90, 90, 0.2)" : "rgba(61, 90, 90, 0.05)";
          const activeColor = isDark ? "#ffffff" : "#3d5a5a";
          const inactiveColor = "var(--text-sidebar)";
          const hoverBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(61, 90, 90, 0.03)";

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                borderRadius: "12px",
                color: isActive ? activeColor : inactiveColor,
                background: isActive ? activeBg : "transparent",
                fontWeight: isActive ? 600 : 500,
                fontSize: "14.5px",
                textDecoration: "none",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = hoverBg;
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = "transparent";
              }}
            >
              <Icon
                size={18}
                style={{
                  color: isActive ? activeColor : (isDark ? "var(--text-sidebar)" : "#64748b"),
                  transition: "color 0.2s ease",
                  flexShrink: 0,
                }}
              />
              {item.label}
              
              {/* Vertical active indicator bar on the right of the button card */}
              {isActive && (
                <div
                  style={{
                    position: "absolute",
                    right: "0",
                    top: "0",
                    bottom: "0",
                    width: "4px",
                    background: "#3d5a5a",
                    borderRadius: "0 12px 12px 0",
                  }}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function SidebarLogout({ onLogout }: { onLogout: () => void }) {
  const { isDark } = useTheme();
  return (
    <div
      style={{
        padding: "16px",
        borderTop: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        transition: "border-color 0.2s",
      }}
    >
      <ThemeToggleButton />
      <button
        onClick={onLogout}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "10px 12px",
          borderRadius: "10px",
          color: "#f87171",
          background: "transparent",
          border: "none",
          fontWeight: 500,
          fontSize: "14px",
          width: "100%",
          cursor: "pointer",
          transition: "background 0.2s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "rgba(248,113,113,0.08)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = "transparent")
        }
      >
        <LogoutIcon size={17} style={{ opacity: 0.8, flexShrink: 0 }} />
        Keluar
      </button>
    </div>
  );
}

function HomeIcon({ size = 20, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
}

function PenIcon({ size = 20, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function BookIcon({ size = 20, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <polyline points="3 3 3 8 8 8" />
      <line x1="12" y1="7" x2="12" y2="12" />
      <line x1="12" y1="12" x2="16" y2="14" />
    </svg>
  );
}

function LogoutIcon({ size = 20, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
