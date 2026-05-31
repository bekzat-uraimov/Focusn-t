"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

const SigninScene = dynamic(
  () => import("@/components/SigninScene"),
  { ssr: false }
);

const FEATURES = [
  {
    icon: "🌍",
    title: "Earn a planet every session",
    desc: "Complete a focus session and a new world permanently joins your galaxy.",
  },
  {
    icon: "🔭",
    title: "AI attention tracking",
    desc: "Your webcam monitors your focus in real time — drift too long and the planet fades.",
  },
  {
    icon: "📊",
    title: "Streaks & analytics",
    desc: "Track attention scores, session history, and daily focus streaks over time.",
  },
  {
    icon: "👥",
    title: "Live focus rooms",
    desc: "Co-focus with friends or colleagues in real-time shared sessions.",
  },
];

export default function SignIn() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @media (max-width: 860px) {
          .signin-welcome { display: none !important; }
          .signin-content { justify-content: center !important; }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <main style={{
        width: "100vw",
        height: "100vh",
        background: "#03030a",
        overflow: "hidden",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "SF Pro Display", sans-serif',
        WebkitFontSmoothing: "antialiased",
      }}>
        {/* 3D background */}
        <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
          <SigninScene />
        </div>

        {/* Readability gradient — darkens edges, keeps centre vivid */}
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 1,
          background:
            "radial-gradient(ellipse at 20% 50%, rgba(3,3,10,0.72) 0%, transparent 62%), " +
            "radial-gradient(ellipse at 80% 50%, rgba(3,3,10,0.62) 0%, transparent 60%), " +
            "radial-gradient(ellipse at 50% 100%, rgba(3,3,10,0.55) 0%, transparent 50%)",
        }} />

        {/* Main content */}
        <div
          className="signin-content"
          style={{
            position: "relative",
            zIndex: 2,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 48,
            padding: "0 7vw",
          }}
        >
          {/* ── Left: welcome copy ── */}
          <div
            className="signin-welcome"
            style={{
              flex: 1,
              maxWidth: 500,
              display: "flex",
              flexDirection: "column",
              gap: 28,
              animation: "fade-up 0.7s cubic-bezier(0.16,1,0.3,1) both",
            }}
          >
            {/* Wordmark */}
            <div>
              <div style={{
                fontSize: 56,
                fontWeight: 800,
                letterSpacing: "-0.05em",
                color: "rgba(255,255,255,0.95)",
                lineHeight: 1,
                marginBottom: 8,
              }}>
                focusn&#39;t
              </div>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "4px 12px",
                borderRadius: 100,
                background: "rgba(99,102,241,0.15)",
                border: "1px solid rgba(99,102,241,0.3)",
              }}>
                <span style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#818cf8",
                  display: "inline-block",
                  boxShadow: "0 0 8px #818cf8",
                }} />
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(129,140,248,0.9)",
                }}>
                  Focus · Build · Collect
                </span>
              </div>
            </div>

            {/* Headline */}
            <div>
              <h1 style={{
                fontSize: 36,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color: "rgba(255,255,255,0.92)",
                lineHeight: 1.22,
                margin: 0,
                marginBottom: 14,
              }}>
                Turn deep work<br />
                <span style={{
                  background: "linear-gradient(90deg, #a5b4fc, #c084fc)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>
                  into your galaxy.
                </span>
              </h1>
              <p style={{
                fontSize: 15.5,
                color: "rgba(255,255,255,0.48)",
                lineHeight: 1.72,
                margin: 0,
                maxWidth: 420,
              }}>
                Start a session, point your camera, and lock in.
                Your attention is tracked live — slip too long and
                the planet fades back into the void. Stay present,
                and it&apos;s yours forever.
              </p>
            </div>

            {/* Feature list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {FEATURES.map((f, i) => (
                <div
                  key={f.title}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 16,
                    animation: `fade-up 0.6s cubic-bezier(0.16,1,0.3,1) ${0.1 + i * 0.07}s both`,
                  }}
                >
                  <span style={{
                    fontSize: 22,
                    lineHeight: 1,
                    marginTop: 1,
                    filter: "drop-shadow(0 0 6px rgba(129,140,248,0.4))",
                  }}>
                    {f.icon}
                  </span>
                  <div>
                    <div style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "rgba(255,255,255,0.85)",
                      marginBottom: 3,
                    }}>
                      {f.title}
                    </div>
                    <div style={{
                      fontSize: 13,
                      color: "rgba(255,255,255,0.38)",
                      lineHeight: 1.55,
                    }}>
                      {f.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: sign-in card ── */}
          <div style={{
            width: 390,
            flexShrink: 0,
            background: "rgba(8,8,20,0.75)",
            backdropFilter: "blur(36px)",
            WebkitBackdropFilter: "blur(36px)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 26,
            padding: "38px 34px",
            boxShadow:
              "0 32px 80px rgba(0,0,0,0.8), " +
              "0 0 0 1px rgba(255,255,255,0.03) inset, " +
              "0 0 60px rgba(99,102,241,0.06) inset",
            animation: "float-in 0.55s cubic-bezier(0.16,1,0.3,1) 0.1s both",
          }}>
            {/* Card header */}
            <div style={{ marginBottom: 30 }}>
              <div style={{
                fontSize: 21,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color: "rgba(255,255,255,0.93)",
                marginBottom: 7,
              }}>
                Welcome back
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.36)" }}>
                Sign in to continue building your galaxy
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: 15 }}
            >
              {/* Email */}
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <label style={{
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.55)",
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 13,
                    padding: "12px 15px",
                    color: "rgba(255,255,255,0.9)",
                    fontSize: 14,
                    outline: "none",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "rgba(99,102,241,0.55)";
                    e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(255,255,255,0.1)";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>

              {/* Password */}
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <label style={{
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.55)",
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 13,
                    padding: "12px 15px",
                    color: "rgba(255,255,255,0.9)",
                    fontSize: 14,
                    outline: "none",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "rgba(99,102,241,0.55)";
                    e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(255,255,255,0.1)";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  fontSize: 13,
                  color: "#f87171",
                  textAlign: "center",
                  padding: "8px 12px",
                  background: "rgba(248,113,113,0.08)",
                  borderRadius: 10,
                  border: "1px solid rgba(248,113,113,0.15)",
                }}>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="focus-btn"
                style={{
                  marginTop: 4,
                  padding: "13px",
                  borderRadius: 14,
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.6 : 1,
                  transition: "opacity 0.2s",
                  background: "linear-gradient(135deg, rgba(99,102,241,0.22), rgba(139,92,246,0.18))",
                  border: "1px solid rgba(99,102,241,0.35)",
                  color: "rgba(255,255,255,0.92)",
                }}
              >
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>

            {/* Divider */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              margin: "22px 0",
            }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>or</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
            </div>

            {/* Sign up link */}
            <div style={{ textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
              Don&#39;t have an account?{" "}
              <Link
                href="/signup"
                style={{ color: "#a5b4fc", textDecoration: "none", fontWeight: 600 }}
              >
                Create one →
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
