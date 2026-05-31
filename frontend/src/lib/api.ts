const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001";
const WS_BASE  = process.env.NEXT_PUBLIC_WS_URL  ?? "ws://localhost:8001";

export { WS_BASE };

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function refreshTokens(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const refresh = localStorage.getItem("focusnt_refresh_token");
  if (!refresh) return null;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    localStorage.setItem("focusnt_access_token", data.access_token);
    localStorage.setItem("focusnt_refresh_token", data.refresh_token);
    return data.access_token;
  } catch {
    return null;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("focusnt_access_token")
      : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401 && retry) {
    const newToken = await refreshTokens();
    if (newToken) return apiFetch<T>(path, options, false);
    if (typeof window !== "undefined") {
      localStorage.removeItem("focusnt_access_token");
      localStorage.removeItem("focusnt_refresh_token");
    }
    throw new ApiError(401, "Session expired");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, (body as { detail?: string }).detail ?? "Request failed");
  }

  return res.json() as Promise<T>;
}

// ── Typed API methods ───────────────────────────────────────────────────────���─

export const api = {
  auth: {
    register: (email: string, username: string, password: string) =>
      apiFetch<TokenResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, username, password }),
      }, false),
    login: (email: string, password: string) =>
      apiFetch<TokenResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }, false),
    me: () => apiFetch<UserPublic>("/auth/me"),
  },

  sessions: {
    start: (mode: string, duration_seconds: number, model_index: number, room_id?: string) =>
      apiFetch<SessionStartResponse>("/sessions", {
        method: "POST",
        body: JSON.stringify({ mode, duration_seconds, model_index, room_id }),
      }),
    complete: (id: string, stats: SessionStats) =>
      apiFetch<SessionCompleteResponse>(`/sessions/${id}/complete`, {
        method: "POST",
        body: JSON.stringify(stats),
      }),
    fail: (id: string) =>
      apiFetch<{ ok: boolean }>(`/sessions/${id}/fail`, { method: "POST" }),
    abandon: (id: string) =>
      apiFetch<{ ok: boolean }>(`/sessions/${id}/abandon`, { method: "POST" }),
  },

  galaxy: {
    planets: () => apiFetch<GalaxyResponse>("/galaxy/planets"),
  },

  rooms: {
    list: () => apiFetch<RoomResponse[]>("/rooms"),
    create: (name: string, is_private: boolean, scheduled_at?: string) =>
      apiFetch<RoomResponse>("/rooms", {
        method: "POST",
        body: JSON.stringify({ name, is_private, scheduled_at }),
      }),
    join: (room_id: string, invite_code?: string) =>
      apiFetch<{ ok: boolean; room_id: string }>(
        `/rooms/${room_id}/join${invite_code ? `?invite_code=${encodeURIComponent(invite_code)}` : ""}`,
        { method: "POST" }
      ),
    members: (room_id: string) =>
      apiFetch<RoomMemberResponse[]>(`/rooms/${room_id}/members`),
  },

  analytics: {
    summary: () => apiFetch<AnalyticsSummary>("/analytics/summary"),
    sessions: (limit = 20, offset = 0) =>
      apiFetch<SessionResponse[]>(`/analytics/sessions?limit=${limit}&offset=${offset}`),
  },
};

// ── TypeScript types ──────────────────────────────────────────────────────────

export interface UserPublic {
  id: string;
  email: string;
  username: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: UserPublic;
}

export interface SessionStartResponse {
  id: string;
  started_at: string;
}

export interface SessionStats {
  avg_attention_score: number;
  min_attention_score: number;
  distraction_count: number;
  total_distracted_secs: number;
}

export interface SessionCompleteResponse {
  session_id: string;
  planet_id: string;
  collection_index: number;
  model_index: number;
}

export interface SessionResponse {
  id: string;
  mode: string;
  duration_seconds: number;
  started_at: string;
  ended_at: string | null;
  result: string | null;
  avg_attention_score: number | null;
  model_index: number;
}

export interface PlanetDetail {
  id: string;
  collection_index: number;
  model_index: number;
  created_at: string;
  session: SessionResponse;
}

export interface GalaxyResponse {
  planets: PlanetDetail[];
  total_count: number;
}

export interface RoomResponse {
  id: string;
  name: string;
  is_private: boolean;
  invite_code: string | null;
  scheduled_at: string | null;
  status: string;
  owner: UserPublic;
  member_count: number;
}

export interface RoomMemberResponse {
  user_id: string;
  username: string;
  focus_status: string;
  attention_score: number;
}

export interface AnalyticsSummary {
  total_sessions: number;
  completed_sessions: number;
  failed_sessions: number;
  total_focus_minutes: number;
  avg_attention_score: number | null;
  current_streak_days: number;
  longest_streak_days: number;
  mode_breakdown: Record<string, number>;
}
