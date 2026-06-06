import { initMongoose } from "@/lib/mongoose";
import { hashPassword } from "@/lib/passwordAuth";
import { applyRateLimit } from "@/lib/rateLimit";
import User from "@/models/User";

function getAdminEmailSet() {
  return new Set(
    (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export default async function handler(req, res) {
  try {
    const allowed = applyRateLimit(req, res, {
      keyPrefix: "auth-register",
      windowMs: 15 * 60 * 1000,
      maxRequests: 10,
    });
    if (!allowed) return;

    await initMongoose();

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const { name, email, password } = req.body || {};
    const cleanName = (name || "").trim();
    const cleanEmail = (email || "").trim();
    const cleanPassword = password || "";

    if (!cleanEmail || !cleanEmail.includes("@")) {
      res.status(400).json({ error: "Valid email is required" });
      return;
    }
    if (!cleanPassword || cleanPassword.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }

    const emailLower = cleanEmail.toLowerCase();
    const adminEmails = getAdminEmailSet();
    const makeAdmin = adminEmails.has(emailLower);
    const passwordHash = hashPassword(cleanPassword);

    const existingUser = await User.findOne({ emailLower }).lean();
    if (existingUser?.passwordHash) {
      res.status(409).json({ error: "User already exists. Please sign in." });
      return;
    }

    const setFields = {
      name: cleanName,
      email: cleanEmail,
      emailLower,
      passwordHash,
      authProvider: "credentials",
      isRegistered: true,
      lastLoginAt: new Date(),
    };
    if (makeAdmin) {
      setFields.role = "admin";
    }

    const setOnInsert = {
      orderHistory: [],
    };
    if (!makeAdmin) {
      setOnInsert.role = "user";
    }

    await User.findOneAndUpdate(
      { emailLower },
      {
        $set: setFields,
        $setOnInsert: setOnInsert,
      },
      { upsert: true, new: true },
    ).exec();

    res.status(201).json({ success: true });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
