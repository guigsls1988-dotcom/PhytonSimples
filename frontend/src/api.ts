const API_URL = import.meta.env.VITE_API_URL || "/api/v1";

export function token(): string | null {
  return sessionStorage.getItem("access_token");
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
  isForm = false,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!isForm) headers.set("Content-Type", "application/json");
  if (token()) headers.set("Authorization", `Bearer ${token()}`);
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (response.status === 401) {
    sessionStorage.removeItem("access_token");
    if (location.pathname !== "/login") location.assign("/login");
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: "Erro inesperado" }));
    throw new Error(body.detail || `Erro HTTP ${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

export async function login(email: string, password: string): Promise<void> {
  const form = new URLSearchParams({ username: email, password });
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });
  if (!response.ok) throw new Error("E-mail ou senha inválidos");
  const body = await response.json();
  sessionStorage.setItem("access_token", body.access_token);
}

export type DashboardData = {
  counts: Record<string, number>;
  severity: Record<string, number>;
  ioc_types: Record<string, number>;
  recent_events: Array<{
    id: string;
    title: string;
    event_type: string;
    occurred_at: string;
  }>;
};

export type Entity = Record<string, unknown> & { id: string };
