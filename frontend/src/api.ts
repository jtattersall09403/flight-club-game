export type Mode = "normal" | "hard";

export interface Airport {
  iata: string;
  name: string | null;
  city: string | null;
  country: string | null;
}

export interface Airline {
  iata: string;
  name: string;
}

export interface Question {
  group_id: string;
  group_name: string;
  obscurity: number;
  a: string;
  b: string;
  a_name: string | null;
  b_name: string | null;
  a_city: string | null;
  b_city: string | null;
  a_country: string | null;
  b_country: string | null;
  level: number;
  connectivity_tier: number;
  min_stops: number;
  direct_available: boolean;
  mode: Mode;
  a_lat: number | null;
  a_lon: number | null;
  b_lat: number | null;
  b_lon: number | null;
}

export interface LegInput {
  src: string;
  dst: string;
  airline: string;
}

export interface ResolvedLeg extends LegInput {
  src_lat: number | null;
  src_lon: number | null;
  dst_lat: number | null;
  dst_lon: number | null;
  airline_name?: string;
}

export interface ValidateResult {
  valid: boolean;
  reason: string | null;
  stops: number | null;
  min_stops: number;
  points: number;
  legs: ResolvedLeg[];
}

export interface ExampleResult {
  legs: ResolvedLeg[];
}

export interface RouteSummary {
  stops: number;
  total_km: number;
  path: string[];
  legs: ResolvedLeg[];
}

export interface RoutesResult {
  routes: RouteSummary[];
}

export interface HintResult {
  group_id: string;
  group_name: string;
  anchor: string | null;
  airlines: Airline[];
}

// In dev, leave empty so Vite's proxy handles `/api/*`.
// In prod, set VITE_API_BASE_URL to the backend's public origin (no trailing slash).
const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

async function http<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`${res.status}: ${detail}`);
  }
  return (await res.json()) as T;
}

export const api = {
  airports: () => http<Airport[]>("/api/airports"),
  airlines: () => http<Airline[]>("/api/airlines"),
  question: (level: number, mode: Mode) =>
    http<Question>("/api/question", { level, mode }),
  validate: (req: {
    group_id: string;
    a: string;
    b: string;
    mode: Mode;
    legs: LegInput[];
    hint_used: boolean;
    level: number;
  }) => http<ValidateResult>("/api/validate", req),
  example: (req: { group_id: string; a: string; b: string; mode: Mode }) =>
    http<ExampleResult>("/api/example", req),
  routes: (req: { group_id: string; a: string; b: string; mode: Mode; k?: number }) =>
    http<RoutesResult>("/api/routes", req),
  hint: (group_id: string) => http<HintResult>("/api/hint", { group_id }),
};
