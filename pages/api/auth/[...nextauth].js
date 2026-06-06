import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { initMongoose } from "@/lib/mongoose";
import { applyRateLimit, checkRateLimit } from "@/lib/rateLimit";
import { verifyPassword } from "@/lib/passwordAuth";
import User from "@/models/User";

const providers = [
  CredentialsProvider({
    name: "Email and Password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials, req) {
      if (!credentials?.email || !credentials?.password) return null;

      const loginRate = checkRateLimit(req, {
        keyPrefix: "auth-login",
        windowMs: 15 * 60 * 1000,
        maxRequests: 20,
      });
      if (loginRate.limited) return null;

      await initMongoose();
      const emailLower = credentials.email.trim().toLowerCase();
      const dbUser = await User.findOne(
        { emailLower, passwordHash: { $exists: true, $ne: "" } },
        { _id: 1, email: 1, name: 1, role: 1, passwordHash: 1, image: 1 },
      ).lean();

      if (!dbUser) return null;
      const isValid = verifyPassword(credentials.password, dbUser.passwordHash);
      if (!isValid) return null;

      return {
        id: dbUser._id.toString(),
        email: dbUser.email,
        name: dbUser.name || "",
        role: dbUser.role || "user",
        image: dbUser.image || "",
      };
    },
  }),
];

function getAdminEmailSet() {
  return new Set(
    (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export const authOptions = {
  providers,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async signIn({ user, account }) {
      try {
        if (!user?.email) return true;

        await initMongoose();
        const emailLower = user.email.trim().toLowerCase();
        const adminEmails = getAdminEmailSet();
        const makeAdmin = adminEmails.has(emailLower);

        const setFields = {
          name: user.name || "",
          email: user.email,
          emailLower,
          image: user.image || "",
          authProvider: account?.provider || "credentials",
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

        const dbUser = await User.findOneAndUpdate(
          { emailLower },
          {
            $set: setFields,
            $setOnInsert: setOnInsert,
          },
          { new: true, upsert: true },
        ).exec();

        user.id = dbUser._id.toString();
        user.role = dbUser.role;
      } catch (error) {
        console.error("NextAuth signIn sync error:", error);
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) token.userId = user.id;
      if (user?.role) token.role = user.role;

      if (!token.role && token.email) {
        try {
          await initMongoose();
          const dbUser = await User.findOne(
            { emailLower: token.email.toLowerCase() },
            { _id: 1, role: 1 },
          ).lean();
          if (dbUser?._id) token.userId = dbUser._id.toString();
          if (dbUser?.role) token.role = dbUser.role;
        } catch (error) {
          console.error("NextAuth jwt sync error:", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.userId || token.sub;
        session.user.role = token.role || "user";
      }
      return session;
    },
  },
};

const authHandler = NextAuth(authOptions);

export default async function handler(req, res) {
  if (req.method === "POST") {
    const ok = applyRateLimit(req, res, {
      keyPrefix: "auth-api",
      windowMs: 15 * 60 * 1000,
      maxRequests: 60,
    });
    if (!ok) return;
  }

  return authHandler(req, res);
}
