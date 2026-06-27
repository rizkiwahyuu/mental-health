const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ─── Response Types ────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  code: number;
  status: string;
  message: string;
  data?: T;
}

// ─── Token Helpers ─────────────────────────────────────────────────────────────

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
}

export function clearTokens() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refreshToken");
}

/**
 * Decode JWT payload tanpa library eksternal.
 * Mengembalikan payload object atau null jika invalid.
 */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

let onUnauthorizedCallback: (() => void) | null = null;

export function registerUnauthorizedCallback(callback: () => void) {
  onUnauthorizedCallback = callback;
}

let refreshPromise: Promise<string | null> | null = null;

async function executeTokenRefresh(rToken: string): Promise<string | null> {
  try {
    const refreshRes = await fetch(`${API_BASE}/authentications`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken: rToken }),
    });
    if (refreshRes.ok) {
      const refreshData = await refreshRes.json();
      const newAccessToken = refreshData.data?.accessToken;
      if (newAccessToken) {
        setTokens(newAccessToken, rToken);
        return newAccessToken;
      }
    }
  } catch (err) {
    console.error("Token refresh API error:", err);
  }
  return null;
}

// ─── HTTP Client ───────────────────────────────────────────────────────────────

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized for token refresh
  if (res.status === 401 && !endpoint.includes("/authentications")) {
    const rToken = getRefreshToken();
    if (rToken) {
      if (!refreshPromise) {
        refreshPromise = executeTokenRefresh(rToken).finally(() => {
          setTimeout(() => {
            refreshPromise = null;
          }, 1000);
        });
      }
      const newAccessToken = await refreshPromise;
      if (newAccessToken) {
        headers["Authorization"] = `Bearer ${newAccessToken}`;
        const retryRes = await fetch(`${API_BASE}${endpoint}`, {
          ...options,
          headers,
        });
        const retryContentType = retryRes.headers.get("content-type") || "";
        if (!retryContentType.includes("application/json")) {
          throw new Error(`Server error: ${retryRes.status} ${retryRes.statusText}`);
        }
        const retryData = await retryRes.json();
        if (!retryRes.ok) {
          throw new Error(retryData.message || "Terjadi kesalahan pada server");
        }
        return retryData;
      }
    }

    // Refresh failed or no refresh token
    clearTokens();
    if (onUnauthorizedCallback) {
      onUnauthorizedCallback();
    }
    throw new Error("Sesi Anda telah berakhir. Silakan login kembali.");
  }

  // Handle non-JSON responses (e.g., HTML error pages from server)
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error(`Server error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Terjadi kesalahan pada server");
  }

  return data;
}

// ─── Auth API ──────────────────────────────────────────────────────────────────

export const authApi = {
  /** POST /users — Register user baru */
  register: (body: { username: string; password: string; fullname?: string }) =>
    request<{ id: string }>("/users", { method: "POST", body: JSON.stringify(body) }),

  /** POST /authentications — Login, mengembalikan accessToken & refreshToken */
  login: (body: { username: string; password: string }) =>
    request<{ accessToken: string; refreshToken: string }>("/authentications", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  /** DELETE /authentications — Logout, invalidate refreshToken */
  logout: (refreshToken: string) =>
    request("/authentications", {
      method: "DELETE",
      body: JSON.stringify({ refreshToken }),
    }),

  /** PUT /authentications — Refresh access token menggunakan refresh token */
  refreshToken: (refreshToken: string) =>
    request<{ accessToken: string }>("/authentications", {
      method: "PUT",
      body: JSON.stringify({ refreshToken }),
    }),
};

// ─── Users API ─────────────────────────────────────────────────────────────────

export const usersApi = {
  /** GET /users/{id} — Ambil data user berdasarkan ID */
  getById: (id: string) => request<{ user: User }>(`/users/${id}`),
};

// ─── Journals API ──────────────────────────────────────────────────────────────

export const journalsApi = {
  /** GET /journals — Ambil semua jurnal milik user */
  getAll: () => request<{ journals: Journal[] }>("/journals"),

  /** GET /journals/{id} — Ambil satu jurnal berdasarkan ID */
  getById: (id: string) => request<{ journal: Journal }>(`/journals/${id}`),

  /** POST /journals — Buat jurnal baru (memicu analisis AI otomatis) */
  create: (body: { title: string; content: string }) =>
    request<{ journalId: string; prediction?: AiPrediction }>("/journals", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  /** PUT /journals/{id} — Update jurnal */
  update: (id: string, body: { title: string; content: string }) =>
    request<{ journal: Journal }>(`/journals/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  /** DELETE /journals/{id} — Hapus jurnal */
  delete: (id: string) =>
    request(`/journals/${id}`, { method: "DELETE" }),

  /** GET /journals/stress-levels — Tingkat stres mingguan */
  getWeeklyStress: () =>
    request<{ stressLevels: StressLevel[] }>("/journals/stress-levels"),

  /** GET /journals/emotions — Ringkasan emosi mingguan */
  getWeeklyEmotion: () =>
    request<{ emotionSummary: EmotionSummary[] }>("/journals/emotions"),
};

// ─── Reflections API ───────────────────────────────────────────────────────────

export const reflectionsApi = {
  /** POST /journals/{id}/reflections — Generate AI reflection untuk jurnal */
  generate: (journalId: string) =>
    request<{ reflection: Reflection }>(`/journals/${journalId}/reflections`, {
      method: "POST",
      body: JSON.stringify({}),
    }),

  /** GET /journals/{id}/reflections — Ambil reflection yang sudah ada */
  get: (journalId: string) =>
    request<{ reflection: Reflection }>(`/journals/${journalId}/reflections`),
};

// ─── Predict API ───────────────────────────────────────────────────────────────

export const predictApi = {
  /** POST /predict — Prediksi teks jurnal */
  predict: (text: string) =>
    request<{ prediction: AiPrediction }>("/predict", {
      method: "POST",
      body: JSON.stringify({ text }),
    }),
};

/** Ambil teks refleksi dari berbagai field respons layanan AI */
export function getReflectionText(prediction: AiPrediction): string {
  const p = prediction as AiPrediction & Record<string, unknown>;
  const candidates = [
    prediction.suggestion,
    p.teks_refleksi,
    p.reflection_text,
    p.refleksi,
    p.reflection,
    p.saran,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  return "";
}

// ─── Notifications API ─────────────────────────────────────────────────────────

export const notificationsApi = {
  /**
   * POST /notifications/subscribe — Daftarkan browser untuk menerima push notification.
   * Membutuhkan PushSubscription object dari browser Push API.
   */
  subscribe: (subscription: PushSubscriptionJSON) =>
    request("/notifications/subscribe", {
      method: "POST",
      body: JSON.stringify(subscription),
    }),

  /**
   * DELETE /notifications/subscribe — Batalkan langganan push notification.
   * Membutuhkan endpoint yang sama dengan saat subscribe.
   */
  unsubscribe: (subscription: PushSubscriptionJSON) =>
    request("/notifications/subscribe", {
      method: "DELETE",
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    }),

  /**
   * POST /notifications/test — Kirim notifikasi uji coba ke browser.
   */
  test: () =>
    request("/notifications/test", { method: "POST", body: JSON.stringify({}) }),
};

// ─── Health API ────────────────────────────────────────────────────────────────

export const healthApi = {
  /** GET /health — Cek status server */
  check: () =>
    request<{ uptime: number; timestamp: string }>("/health"),
};

// ─── Data Types ────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  username: string;
  fullname?: string;
}

export interface Journal {
  id: string;
  title: string;
  content: string;
  owner: string;
  stress_score?: number;
  stress_category?: string;
  emotion?: string;
  /** Saran dari AI berdasarkan isi jurnal */
  suggestion?: string;
  created_at: string;
  updated_at?: string;
}

export interface Reflection {
  id?: string;
  journal_id?: string;
  reflection_text: string;
  teks_refleksi?: string;
  created_at?: string;
}

export interface AiPrediction {
  stress_score: number;
  prediksi_label: string;
  suggestion?: string;
  teks_refleksi?: string;
  reflection_text?: string;
  refleksi?: string;
  saran?: string;
}

export interface StressLevel {
  date: string;
  day: string;
  /** Rata-rata skor hari itu (0–10); tidak ada jurnal = null / tidak dikirim */
  averageScore?: number | null;
}

export interface EmotionSummary {
  emotion: string;
  /** Field dari API backend (`emotion AS label`) */
  label?: string;
  count: number;
}
