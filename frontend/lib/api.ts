// ============================================================================
// TechNest — API Client Utility
// Handles communication between the Next.js frontend and the Go backend.
// Uses NEXT_PUBLIC_API_URL for browser requests and INTERNAL_API_URL for SSR.
// ============================================================================

/** Base URL for client-side (browser) API calls */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

/** Base URL for server-side (SSR / getServerSideProps) API calls */
const INTERNAL_API_URL = process.env.INTERNAL_API_URL || API_URL;

// ── Client-side helpers (used in components and useEffect) ──────────────────

/**
 * GET request to the Go backend (client-side).
 */
export async function apiGet<T>(path: string, token?: string): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({} as Record<string, unknown>));
    throw new Error((body?.error as string) || `API error: ${res.status}`);
  }
  return res.json();
}

/**
 * POST request to the Go backend (client-side).
 */
export async function apiPost<T>(path: string, body: unknown, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({} as Record<string, unknown>));
    throw new Error((data?.error as string) || `API error: ${res.status}`);
  }
  return res.json();
}

/**
 * PATCH request to the Go backend (client-side).
 */
export async function apiPatch<T>(path: string, body: unknown, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({} as Record<string, unknown>));
    throw new Error((data?.error as string) || `API error: ${res.status}`);
  }
  return res.json();
}

/**
 * DELETE request to the Go backend (client-side).
 */
export async function apiDelete<T = unknown>(path: string, token?: string): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({} as Record<string, unknown>));
    throw new Error((data?.error as string) || `API error: ${res.status}`);
  }
  return res.json();
}

// ── Server-side helpers (used in getServerSideProps) ────────────────────────

/**
 * GET request to the Go backend (server-side).
 * Uses INTERNAL_API_URL for Docker network communication.
 */
export async function serverApiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${INTERNAL_API_URL}${path}`);
  if (!res.ok) {
    throw new Error(`Server API error: ${res.status}`);
  }
  return res.json();
}
