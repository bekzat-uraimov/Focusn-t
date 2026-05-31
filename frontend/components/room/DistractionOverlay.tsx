"use client";
import { motion } from "framer-motion";

interface Props {
  countdown: number;
}

export default function DistractionOverlay({ countdown }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center animate-pulse_red"
    >
      <div className="flex flex-col items-center gap-6 bg-background/90 border border-destructive rounded-2xl p-10 shadow-2xl text-center max-w-sm mx-4">
        <div className="text-5xl">⚠️</div>
        <h2 className="text-2xl font-bold text-destructive">Focus Lost!</h2>
        <p className="text-muted-foreground">Look back at your screen or your tree will die.</p>
        <div className="text-6xl font-mono font-black text-destructive">
          {countdown}
        </div>
        <p className="text-xs text-muted-foreground">seconds remaining</p>
      </div>
    </motion.div>
  );
}
