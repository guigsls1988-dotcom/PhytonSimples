const API_URL = import.meta.env.VITE_API_URL || "/api/v1";

export async function api<T>(
  path: string,
  options: RequestInit = {},
  isForm = false,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!isForm) headers.set("Content-Type", "application/json");
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: "Erro inesperado" }));
    throw new Error(body.detail || `Erro HTTP ${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
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
  latam: {
    total: number;
    countries: Record<string, number>;
    severity: Record<string, number>;
    recent: RegionalIntel[];
  };
};

export type Entity = Record<string, unknown> & { id: string };

export type RegionalIntel = {
  id: string;
  title: string;
  summary: string | null;
  source_name: string;
  source_url: string;
  country_code: string;
  country_name: string;
  severity: string;
  sectors: string[];
  tags: string[];
  published_at: string;
};
