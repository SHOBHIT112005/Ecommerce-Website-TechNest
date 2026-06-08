// ============================================================================
// Proxy API: Forwards authenticated requests to Go backend with user context.
// NextAuth uses JWE (encrypted tokens) which the Go backend can't decode.
// This proxy reads the session server-side and passes userEmail as a header.
// ============================================================================

import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

import { AuthOptions } from "next-auth";

const INTERNAL_API_URL =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8080";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Verify NextAuth session
  const session = await getServerSession(req, res, authOptions as AuthOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Build the target path from the slug
  const { slug } = req.query;
  const pathSegments = Array.isArray(slug) ? slug : [slug];
  const targetPath = "/api/" + pathSegments.join("/");

  // Build query string (exclude slug param)
  const url = new URL(req.url || "", "http://localhost");
  const queryString = url.search || "";

  try {
    const backendRes = await fetch(
      `${INTERNAL_API_URL}${targetPath}${queryString}`,
      {
        method: req.method,
        headers: {
          "Content-Type": "application/json",
          // Pass user info as trusted internal headers
          "X-User-Email": session.user.email,
          "X-User-Name": session.user.name || "",
          "X-User-Role": (session.user as Record<string, string>).role || "user",
          "X-User-Id": (session.user as Record<string, string>).id || "",
        },
        body:
          req.method !== "GET" && req.method !== "HEAD"
            ? JSON.stringify(req.body)
            : undefined,
      },
    );

    const data = await backendRes.json().catch(() => ({}));
    return res.status(backendRes.status).json(data);
  } catch (error) {
    console.error("Proxy error:", error);
    return res.status(502).json({ error: "Backend service unavailable" });
  }
}
