import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { getServerSession } from "next-auth/next";
import { signIn } from "next-auth/react";
import Layout from "@/pages/Layout";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

const errorMessages = {
  Configuration: "Authentication is not configured correctly on the server.",
  AccessDenied: "Access was denied for this account.",
  CredentialsSignin: "Invalid email or password.",
  Default: "Sign in failed. Please try again.",
};

export default function SignInPage({ error, callbackUrl }) {
  const serverErrorMessage = error ? (errorMessages[error] || errorMessages.Default) : null;
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState("signin");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  async function handleCredentialsAuth(e) {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      const cleanEmail = email.trim();
      if (!cleanEmail || !cleanEmail.includes("@")) {
        setFormError("Enter a valid email address.");
        return;
      }

      if (password.length < 6) {
        setFormError("Password must be at least 6 characters.");
        return;
      }

      if (mode === "signup") {
        const registerRes = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email: cleanEmail, password }),
        });

        const registerBody = await registerRes.json().catch(() => ({}));
        if (!registerRes.ok) {
          setFormError(registerBody?.error || "Could not create account.");
          return;
        }
      }

      const result = await signIn("credentials", {
        redirect: false,
        email: cleanEmail,
        password,
        callbackUrl: callbackUrl || "/",
      });

      if (result?.error) {
        setFormError(errorMessages[result.error] || "Invalid email or password.");
        return;
      }

      await router.replace(callbackUrl || "/");
    } catch (err) {
      console.error(err);
      setFormError("Authentication failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Layout>
      <Head>
        <title>Sign In - Technest</title>
        <meta name="description" content="Sign in or sign up at Technest" />
      </Head>

      <div className="max-w-md mx-auto py-10">
        <h1 className="text-2xl font-bold">Welcome to Technest</h1>
        <p className="text-gray-600 mt-2">
          Use email and password for fast local authentication.
        </p>

        {(serverErrorMessage || formError) && (
          <div className="mt-5 bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm">
            {formError || serverErrorMessage}
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            onClick={() => setMode("signin")}
            className={`rounded-lg py-2 text-sm font-semibold transition-colors ${
              mode === "signin" ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-700"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode("signup")}
            className={`rounded-lg py-2 text-sm font-semibold transition-colors ${
              mode === "signup" ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-700"
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleCredentialsAuth} className="mt-4 space-y-3">
          {mode === "signup" && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-100 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              placeholder="Full name (optional)"
              type="text"
            />
          )}
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-gray-100 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            placeholder="Email"
            type="email"
            required
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-gray-100 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            placeholder="Password (min 6 chars)"
            type="password"
            required
          />
          <button
            disabled={submitting}
            className="w-full bg-emerald-500 text-white font-semibold py-3 px-4 rounded-xl hover:bg-emerald-600 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:opacity-60"
            type="submit"
          >
            {submitting ? "Please wait..." : mode === "signup" ? "Create Account" : "Sign In"}
          </button>
        </form>

        <Link href="/" className="inline-block mt-6 text-sm text-emerald-600 hover:text-emerald-700">
          Back to Home
        </Link>
      </div>
    </Layout>
  );
}

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (session) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: {
      error: context.query.error || null,
      callbackUrl: normalizeCallbackUrl(context.query.callbackUrl),
    },
  };
}

function normalizeCallbackUrl(value) {
  if (!value || Array.isArray(value)) return "/";

  try {
    const parsed = new URL(value, "http://localhost");
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return value.startsWith("/") ? value : "/";
  }
}
