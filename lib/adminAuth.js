import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { initMongoose } from "@/lib/mongoose";
import User from "@/models/User";

export async function getServerSessionWithRole(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) return session;

  await initMongoose();
  const emailLower = session.user.email.toLowerCase();
  const dbUser = await User.findOne(
    { emailLower },
    { _id: 1, role: 1, name: 1, email: 1 },
  ).lean();

  if (dbUser?._id) {
    session.user.id = dbUser._id.toString();
    session.user.role = dbUser.role || "user";
  } else {
    session.user.role = session.user.role || "user";
  }

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
