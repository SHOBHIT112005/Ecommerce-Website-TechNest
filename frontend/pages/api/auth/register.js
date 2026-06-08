// ============================================================================
// Registration API Route — Proxies to Go backend POST /api/auth/register
// NO MongoDB dependency.
// ============================================================================

const INTERNAL_API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { name, email, password } = req.body || {};

    // Forward to Go backend
    const backendRes = await fetch(`${INTERNAL_API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await backendRes.json();

    if (!backendRes.ok) {
      res.status(backendRes.status).json(data);
      return;
    }

    res.status(201).json(data);
  } catch (error) {
    console.error("Register proxy error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
