"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { MOCK_ROOMS } from "@/lib/mock-data";
import { DuckSprite } from "@/components/ducks/DuckSprite";

const statusConfig = {
  focused:    { label: "Focused",    color: "#22c55e", bg: "rgba(34,197,94,0.15)",  emoji: "🟢" },
  distracted: { label: "Distracted", color: "#ef4444", bg: "rgba(239,68,68,0.15)",  emoji: "🔴" },
  break:      { label: "Break",      color: "#fbbf24", bg: "rgba(251,191,36,0.15)", emoji: "🟡" },
  offline:    { label: "Offline",    color: "#6b7280", bg: "rgba(107,114,128,0.15)",emoji: "⚫" },
};

const rarityColors: Record<string, string> = {
  common: "#94a3b8", rare: "#60a5fa", epic: "#c084fc", legendary: "#fb923c", mythic: "#f472b6",
};

export function RoomScreen() {
  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(to bottom, #0f0c29, #1a1535)" }}>

      {/* Stars */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 40 }).map((_, i) => (
          <motion.div key={i} className="absolute rounded-full bg-white"
            style={{ width: Math.random() * 2 + 1, height: Math.random() * 2 + 1, left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
            animate={{ opacity: [0.2, 0.8, 0.2] }}
            transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 3 }}
          />
        ))}
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4">
        <Link href="/" className="font-black text-xl text-white" style={{ fontFamily: "'Nunito', sans-serif" }}>
          🦆 FocusDuck
        </Link>
        <Link href="/session"
          className="px-5 py-2 rounded-full text-sm font-bold transition-all hover:brightness-110"
          style={{ background: "linear-gradient(135deg, #FFD166, #F4845F)", color: "#1a0a00", fontFamily: "'Nunito', sans-serif" }}>
          Start Session
        </Link>
      </nav>

      <main className="relative z-10 px-6 py-4 max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-black text-4xl text-white" style={{ fontFamily: "'Nunito', sans-serif" }}>Focus Rooms</h1>
          <p className="text-white/50 mt-1">Join a room and study together</p>
        </div>

        {/* Rooms list */}
        {MOCK_ROOMS.map((room, ri) => (
          <motion.div
            key={room.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: ri * 0.1 }}
            className="glass rounded-3xl p-6 mb-4"
          >
            {/* Room header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{room.emoji}</div>
                <div>
                  <h2 className="font-black text-lg text-white" style={{ fontFamily: "'Nunito', sans-serif" }}>{room.name}</h2>
                  <p className="text-white/40 text-sm">{room.topic} · {room.memberCount} studying</p>
                </div>
              </div>
              <Link href="/session"
                className="px-4 py-2 rounded-xl text-sm font-bold transition-all hover:brightness-110 active:scale-95"
                style={{ background: "linear-gradient(135deg, #FFD166, #F4845F)", color: "#1a0a00", fontFamily: "'Nunito', sans-serif" }}>
                Join
              </Link>
            </div>

            {/* Members */}
            <div className="grid grid-cols-2 gap-3">
              {room.members.map((member) => {
                const sc = statusConfig[member.status];
                return (
                  <motion.div
                    key={member.id}
                    whileHover={{ scale: 1.02 }}
                    className="rounded-2xl p-3 flex items-center gap-3"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    {/* Duck */}
                    <div className="flex-shrink-0">
                      <DuckSprite
                        mood={member.status === "focused" ? "studying" : member.status === "distracted" ? "worried" : "happy"}
                        size={44}
                        rarity={member.activeDuck.rarity}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-white truncate" style={{ fontFamily: "'Nunito', sans-serif" }}>
                        {member.name}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{ background: sc.bg, color: sc.color }}
                        >
                          {sc.label}
                        </span>
                        {member.streak > 0 && (
                          <span className="text-xs text-white/40">🔥 {member.streak}</span>
                        )}
                      </div>
                      {/* Score bar */}
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex-1 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                          <motion.div
                            className="h-full rounded-full"
                            style={{
                              background: member.score >= 70 ? "#22c55e" : member.score >= 50 ? "#fbbf24" : "#ef4444",
                              width: `${member.score}%`,
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${member.score}%` }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                          />
                        </div>
                        <span className="text-xs text-white/30">{member.score}</span>
                      </div>
                      {/* Duck name */}
                      <div className="text-xs mt-0.5 truncate" style={{ color: rarityColors[member.activeDuck.rarity], opacity: 0.8 }}>
                        {member.activeDuck.name}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ))}

        {/* Create room */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-5 rounded-3xl font-black text-lg text-white/50 transition-all"
          style={{ background: "rgba(255,255,255,0.03)", border: "2px dashed rgba(255,255,255,0.1)", fontFamily: "'Nunito', sans-serif" }}
        >
          + Create a Room
        </motion.button>
      </main>
    </div>
  );
}
