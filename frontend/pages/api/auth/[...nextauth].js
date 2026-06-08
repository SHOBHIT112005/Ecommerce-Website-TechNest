import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// ============================================================================
// NextAuth Configuration — Authenticates via Go backend (PostgreSQL)
// NO MongoDB dependency. Credentials are verified by POST /api/auth/login.
// ============================================================================

const INTERNAL_API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const providers = [
  CredentialsProvider({
    name: "Email and Password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;

      try {
        // Call Go backend to verify credentials
        const res = await fetch(`${INTERNAL_API_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials.email.trim(),
            password: credentials.password,
          }),
        });

        if (!res.ok) return null;

        const user = await res.json();
        return {
          id: String(user.id),
          email: user.email,
          name: user.name || "",
          role: user.role || "user",
          image: user.image || "",
        };
      } catch (error) {
        console.error("NextAuth authorize error:", error);
        return null;
      }
    },
  }),
];

export const authOptions = {
  providers,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      // On initial sign-in, attach user data to token
      if (user?.id) token.userId = user.id;
      if (user?.role) token.role = user.role;
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

export default NextAuth(authOptions);
