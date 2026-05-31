"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

export default function SignUp() {
  const { register } = useAuth();
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const cardBg      = "rgba(10,10,20,0.72)";
  const textStrong  = "rgba(255,255,255,0.9)";
  const textMid     = "rgba(255,255,255,0.6)";
  const textFaint   = "rgba(255,255,255,0.35)";
  const border      = "1px solid rgba(255,255,255,0.08)";
  const inputBg     = "rgba(255,255,255,0.05)";
  const inputBorder = "1px solid rgba(255,255,255,0.1)";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (username.length < 3) { setError("Username must be at least 3 characters"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      await register(email, username, password);
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    background: inputBg,
    border: inputBorder,
    borderRadius: 12,
    padding: "11px 14px",
    color: textStrong,
    fontSize: 14,
    outline: "none",
    transition: "border-color 0.2s",
  };

  const labelStyle = {
    fontSize: 12,
    fontWeight: 500 as const,
    color: textMid,
    letterSpacing: "0.04em",
  };

  return (
    <main
      style={{
        width: "100vw",
        height: "100vh",
        background:
          "radial-gradient(ellipse at 72% 18%, rgba(55,25,95,0.45) 0%, transparent 55%), " +
          "radial-gradient(ellipse at 18% 82%, rgba(15,35,75,0.35) 0%, transparent 50%), " +
          "#03030a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "SF Pro Display", sans-serif',
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <div
        style={{
          width: 380,
          background: cardBg,
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
          border,
          borderRadius: 24,
          padding: "36px 32px",
          boxShadow:
            "0 24px 64px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.03) inset",
          animation: "float-in 0.5s cubic-bezier(0.16,1,0.3,1) both",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: "-0.04em",
              color: textStrong,
            }}
          >
            focusn&#39;t
          </div>
          <div style={{ fontSize: 13, color: textFaint, marginTop: 6, letterSpacing: "0.02em" }}>
            Begin your galaxy.
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Email */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={labelStyle}>EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "rgba(99,102,241,0.6)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
            />
          </div>

          {/* Username */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={labelStyle}>USERNAME</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="explorer42"
              minLength={3}
              maxLength={32}
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "rgba(99,102,241,0.6)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
            />
            <span style={{ fontSize: 11, color: textFaint }}>3–32 characters</span>
          </div>

          {/* Password */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={labelStyle}>PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              minLength={8}
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "rgba(99,102,241,0.6)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
            />
            <span style={{ fontSize: 11, color: textFaint }}>Minimum 8 characters</span>
          </div>

          {/* Error */}
          {error && (
            <div style={{ fontSize: 13, color: "#f87171", textAlign: "center" }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="focus-btn"
            style={{
              marginTop: 6,
              padding: "13px",
              borderRadius: 14,
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "0.02em",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
              transition: "opacity 0.2s",
            }}
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        {/* Sign in link */}
        <div style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: textFaint }}>
          Already have an account?{" "}
          <Link
            href="/signin"
            style={{ color: "#818cf8", textDecoration: "none", fontWeight: 500 }}
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
