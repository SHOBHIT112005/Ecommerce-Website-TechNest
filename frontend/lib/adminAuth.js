// ============================================================================
// Admin Auth Helper — Verifies admin role from NextAuth JWT session
// NO MongoDB dependency. Role is stored in JWT token (set during login).
// ============================================================================

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

export async function getServerSessionWithRole(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) return session;

  // Role is already in the JWT token (set by the jwt callback in [...nextauth].js)
  // No need to query the database
  session.user.role = session.user.role || "user";

  return session;
}

export async function requireAdminApi(req, res) {
  const session = await getServerSessionWithRole(req, res);
  if (!session?.user) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  if (session.user.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return null;
  }
  return session;
}
