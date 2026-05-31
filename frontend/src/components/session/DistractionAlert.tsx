"use client";

import { motion, AnimatePresence } from "framer-motion";

interface DistractionAlertProps {
  visible: boolean;
  countdown: number;
  warnings: string[];
  onDismiss?: () => void;
}

export function DistractionAlert({ visible, countdown, warnings }: DistractionAlertProps) {
  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Screen darkening */}
          <motion.div
            className="fixed inset-0 pointer-events-none z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)" }}
          />

          {/* Screen edge pulse */}
          <motion.div
            className="fixed inset-0 pointer-events-none z-40"
            style={{ border: "3px solid #ef4444", borderRadius: 0 }}
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          />

          {/* Alert card */}
          <motion.div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-80"
            initial={{ scale: 0.7, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 15, stiffness: 300 }}
          >
            <div
              className="glass rounded-3xl p-6 text-center"
              style={{ background: "rgba(30,10,10,0.85)", border: "1px solid rgba(239,68,68,0.4)", boxShadow: "0 0 60px rgba(239,68,68,0.3)" }}
            >
              {/* Worried duck */}
              <motion.div
                className="text-6xl mb-3"
                animate={{ rotate: [-5, 5, -5], x: [-3, 3, -3] }}
                transition={{ duration: 0.35, repeat: Infinity }}
              >
                😟🦆
              </motion.div>

              <h2 className="font-display font-black text-xl text-white mb-1" style={{ fontFamily: "'Nunito', sans-serif" }}>
                Duck is losing focus!
              </h2>
              <p className="text-white/50 text-sm mb-4">Come back or the duck goes to sleep</p>

              {/* Reasons */}
              {warnings.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center mb-4">
                  {warnings.map((w) => (
                    <span key={w} className="px-2 py-1 rounded-full text-xs font-semibold" style={{ background: "rgba(239,68,68,0.2)", color: "#fca5a5" }}>
                      {w}
                    </span>
                  ))}
                </div>
              )}

              {/* Countdown */}
              <motion.div
                className="font-display font-black text-6xl"
                style={{ fontFamily: "'Nunito', sans-serif", color: "#ef4444" }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                {countdown}
              </motion.div>
              <p className="text-white/40 text-xs mt-1 tracking-widest uppercase">seconds left</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface SessionFailedProps {
  visible: boolean;
  onRetry: () => void;
  onExit: () => void;
}

export function SessionFailed({ visible, onRetry, onExit }: SessionFailedProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.9)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="text-center max-w-sm px-6"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", delay: 0.1 }}
          >
            <motion.div
              className="text-8xl mb-4"
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 1, delay: 0.3 }}
            >
              😴
            </motion.div>
            <h1 className="font-display font-black text-4xl text-white mb-2" style={{ fontFamily: "'Nunito', sans-serif" }}>
              Duck fell asleep
            </h1>
            <p className="text-white/50 mb-8">
              Your duck tried its best. Try again — this time stay focused!
            </p>
            <div className="flex gap-3">
              <button
                onClick={onRetry}
                className="flex-1 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg, #FFD166, #F4845F)", color: "#1a0a00", fontFamily: "'Nunito', sans-serif" }}
              >
                Try Again
              </button>
              <button
                onClick={onExit}
                className="flex-1 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95"
                style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}
              >
                Exit
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface SessionCompleteProps {
  visible: boolean;
  xpGained: number;
  duckName: string;
  onContinue: () => void;
}

export function SessionComplete({ visible, xpGained, duckName, onContinue }: SessionCompleteProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.85)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* Particle burst */}
          {Array.from({ length: 16 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-2xl"
              style={{ left: "50%", top: "50%" }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
              animate={{
                x: Math.cos((i / 16) * Math.PI * 2) * (100 + Math.random() * 80),
                y: Math.sin((i / 16) * Math.PI * 2) * (100 + Math.random() * 80),
                opacity: 0, scale: [0, 1.2, 0],
              }}
              transition={{ duration: 1.2, delay: 0.2 + i * 0.03, ease: "easeOut" }}
            >
              {["⭐", "✨", "🌟", "💛", "🦆"][i % 5]}
            </motion.div>
          ))}

          <motion.div
            className="text-center max-w-sm px-6 z-10"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", delay: 0.15 }}
          >
            <motion.div
              className="text-8xl mb-2"
              animate={{ rotate: [-10, 10, -10, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              🎉
            </motion.div>
            <h1 className="font-display font-black text-4xl mb-1" style={{ fontFamily: "'Nunito', sans-serif", color: "#FFD166" }}>
              Session Complete!
            </h1>
            <p className="text-white/60 mb-6">{duckName} is proud of you</p>

            <motion.div
              className="glass rounded-2xl p-4 mb-6 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="text-3xl font-black text-gradient" style={{ fontFamily: "'Nunito', sans-serif" }}>
                +{xpGained} XP
              </div>
              <div className="text-white/40 text-sm mt-1">earned this session</div>
            </motion.div>

            <button
              onClick={onContinue}
              className="w-full py-4 rounded-2xl font-black text-base transition-all active:scale-95 hover:brightness-110"
              style={{ background: "linear-gradient(135deg, #FFD166, #F4845F)", color: "#1a0a00", fontFamily: "'Nunito', sans-serif" }}
            >
              Claim Rewards 🦆
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
