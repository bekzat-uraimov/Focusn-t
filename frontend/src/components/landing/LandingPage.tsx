"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import { MOCK_DUCKS } from "@/lib/mock-data";
import { DuckSprite } from "@/components/ducks/DuckSprite";

const DuckSanctuary = dynamic(
  () => import("@/components/3d/DuckSanctuary").then((m) => m.DuckSanctuary),
  { ssr: false, loading: () => <div style={{ height: 500 }} /> }
);

const rarityColors: Record<string, string> = {
  common:    "#94a3b8",
  rare:      "#60a5fa",
  epic:      "#c084fc",
  legendary: "#fb923c",
  mythic:    "#f472b6",
};

const features = [
  { emoji: "🤖", title: "AI Attention Tracking", desc: "MediaPipe monitors your gaze, head pose, and eye blinks in real time. No cheating." },
  { emoji: "👥", title: "Multiplayer Focus Rooms", desc: "Study with friends. See who's focused, who's slacking, and who needs a nudge." },
  { emoji: "🦆", title: "Duck Evolution System", desc: "Every session grows your duck. Common → Rare → Epic → Legendary → Mythic." },
  { emoji: "📊", title: "Productivity Analytics", desc: "Track your focus score over time. See where you struggle and improve." },
];

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

export function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(to bottom, #0f0c29, #302b63, #24243e)" }}>

      {/* Stars */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 60 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 2 + 1,
              height: Math.random() * 2 + 1,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 60}%`,
            }}
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 3 }}
          />
        ))}
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🦆</span>
          <span className="font-black text-xl text-white" style={{ fontFamily: "'Nunito', sans-serif" }}>
            FocusDuck
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/room" className="text-white/60 hover:text-white text-sm font-medium transition-colors px-4 py-2">
            Rooms
          </Link>
          <Link
            href="/session"
            className="px-5 py-2 rounded-full text-sm font-bold transition-all hover:brightness-110 active:scale-95"
            style={{ background: "linear-gradient(135deg, #FFD166, #F4845F)", color: "#1a0a00", fontFamily: "'Nunito', sans-serif" }}
          >
            Start Focusing
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 text-center px-6 pt-8 pb-4 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
        >
          <motion.div
            className="inline-block px-4 py-1.5 rounded-full text-xs font-bold mb-6 tracking-widest uppercase"
            style={{ background: "rgba(255,209,102,0.15)", border: "1px solid rgba(255,209,102,0.3)", color: "#FFD166" }}
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            ✨ AI-Powered Focus Sessions
          </motion.div>

          <h1
            className="font-black text-6xl md:text-7xl leading-tight mb-6 text-white"
            style={{ fontFamily: "'Nunito', sans-serif" }}
          >
            Focus Together.<br />
            <span className="text-gradient">Grow Your Flock.</span>
          </h1>

          <p className="text-white/55 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Your AI-powered study companion. Every focus session evolves your duck.
            Get distracted — and it falls asleep.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/session"
              className="px-8 py-4 rounded-2xl font-black text-lg transition-all hover:brightness-110 active:scale-95"
              style={{ background: "linear-gradient(135deg, #FFD166, #F4845F)", color: "#1a0a00", fontFamily: "'Nunito', sans-serif", boxShadow: "0 0 40px rgba(255,209,102,0.3)" }}
            >
              Start Focusing 🦆
            </Link>
            <Link
              href="/room"
              className="px-8 py-4 rounded-2xl font-bold text-lg transition-all hover:bg-white/10 active:scale-95 glass"
              style={{ color: "white", fontFamily: "'Nunito', sans-serif" }}
            >
              Browse Rooms
            </Link>
          </div>
        </motion.div>
      </section>

      {/* 3D Scene */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 1 }}
        className="relative z-10 -mt-4"
      >
        <DuckSanctuary height={480} />
        {/* Fade bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-32" style={{ background: "linear-gradient(to top, #1a1535, transparent)" }} />
      </motion.div>

      {/* Duck Collection Preview */}
      <section className="relative z-10 px-6 py-16 max-w-6xl mx-auto">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          <motion.div variants={fadeUp} className="text-center mb-12">
            <h2 className="font-black text-4xl text-white mb-3" style={{ fontFamily: "'Nunito', sans-serif" }}>
              Collect. Evolve. <span className="text-gradient">Flex.</span>
            </h2>
            <p className="text-white/50 max-w-lg mx-auto">Every duck has a unique evolution path. Longer sessions unlock rarer forms.</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {MOCK_DUCKS.map((duck, i) => (
              <motion.div
                key={duck.id}
                variants={fadeUp}
                whileHover={{ scale: 1.05, y: -4 }}
                className="glass rounded-2xl p-4 text-center cursor-pointer transition-all"
                style={{ border: `1px solid ${rarityColors[duck.rarity]}30` }}
              >
                <DuckSprite mood="happy" size={72} rarity={duck.rarity} />
                <div className="mt-2 font-bold text-sm text-white truncate" style={{ fontFamily: "'Nunito', sans-serif" }}>
                  {duck.name.split(" ").slice(-1)[0]}
                </div>
                <div className="text-xs font-semibold mt-0.5 capitalize" style={{ color: rarityColors[duck.rarity] }}>
                  {duck.rarity}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-6 py-12 max-w-6xl mx-auto">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              whileHover={{ y: -3 }}
              className="glass rounded-2xl p-6 flex gap-4 items-start"
            >
              <div className="text-3xl flex-shrink-0">{f.emoji}</div>
              <div>
                <h3 className="font-black text-lg text-white mb-1" style={{ fontFamily: "'Nunito', sans-serif" }}>{f.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-7xl mb-4">🦆</div>
          <h2 className="font-black text-4xl text-white mb-4" style={{ fontFamily: "'Nunito', sans-serif" }}>
            Your duck is waiting.
          </h2>
          <p className="text-white/50 mb-8 max-w-sm mx-auto">Join thousands of students studying smarter together.</p>
          <Link
            href="/session"
            className="inline-block px-10 py-4 rounded-2xl font-black text-lg transition-all hover:brightness-110 active:scale-95"
            style={{ background: "linear-gradient(135deg, #FFD166, #F4845F)", color: "#1a0a00", fontFamily: "'Nunito', sans-serif", boxShadow: "0 0 50px rgba(255,209,102,0.35)" }}
          >
            Start Focusing
          </Link>
        </motion.div>
      </section>

      <footer className="relative z-10 text-center py-8 text-white/25 text-sm">
        Built at hackathon 2025 · FocusDuck 🦆
      </footer>
    </div>
  );
}
