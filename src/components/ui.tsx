"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { useSpeed } from "./SpeedProvider";

interface SectionHeaderProps {
  title: string;
  subtitle: string;
  badge?: string;
}

export function SectionHeader({ title, subtitle, badge }: SectionHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mb-10"
    >
      {badge && <span className="badge mb-3">{badge}</span>}
      <h1 className="text-3xl font-bold tracking-tight mb-3" style={{ color: "var(--text)" }}>
        {title}
      </h1>
      <p className="text-base leading-relaxed max-w-2xl" style={{ color: "var(--text-secondary)" }}>
        {subtitle}
      </p>
    </motion.div>
  );
}

interface InfoCardProps {
  title: string;
  children: ReactNode;
  accent?: string;
  className?: string;
}

export function InfoCard({ title, children, accent, className = "" }: InfoCardProps) {
  return (
    <div className={`card p-6 ${className}`}>
      <h3
        className="text-base font-semibold mb-3"
        style={{ color: accent || "var(--accent-text)" }}
      >
        {title}
      </h3>
      <div className="prose-custom space-y-2.5">
        {children}
      </div>
    </div>
  );
}

interface PlaybackControlsProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  step: number;
  maxStep: number;
  label?: string;
}

export function PlaybackControls({
  isPlaying,
  onPlay,
  onPause,
  onReset,
  step,
  maxStep,
  label = "Step",
}: PlaybackControlsProps) {
  const { speed, setSpeed } = useSpeed();
  const speeds: (0.5 | 1 | 1.5 | 2)[] = [0.5, 1, 1.5, 2];

  const isPaused = !isPlaying && step > 0 && step < maxStep;

  return (
    <div className="flex items-center gap-3 mb-8 flex-wrap">
      <button onClick={onPlay} className={isPaused ? "btn-secondary" : "btn-primary"} style={{ minWidth: "90px", justifyContent: "center" }}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><polygon points="2,0 12,6 2,12"/></svg>
        {isPaused ? "Resume" : "Play"}
      </button>
      <button
        onClick={onPause}
        disabled={!isPlaying}
        className={isPaused ? "btn-primary" : "btn-secondary"}
        style={isPaused ? { opacity: 1 } : undefined}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><rect x="1" y="0" width="3.5" height="12" rx="0.5"/><rect x="7.5" y="0" width="3.5" height="12" rx="0.5"/></svg>
        Pause
      </button>
      <button onClick={onReset} className="btn-secondary">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 4a5 5 0 019.4 1M11 8A5 5 0 011.6 7"/><polyline points="1,1 1,4 4,4"/></svg>
        Reset
      </button>

      {/* Speed selector */}
      <div
        className="inline-flex items-center rounded-lg overflow-hidden"
        style={{ border: "1px solid var(--border)" }}
      >
        <span className="px-2 text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="inline -mt-px mr-0.5"><circle cx="8" cy="8" r="5.5"/><path d="M8 5v3.5l2.5 1.5"/></svg>
          Speed
        </span>
        {speeds.map((s) => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className="px-2 py-1 text-[11px] font-mono font-medium transition-colors"
            style={{
              background: speed === s ? "var(--accent)" : "transparent",
              color: speed === s ? "#fff" : "var(--text-secondary)",
              borderLeft: "1px solid var(--border)",
            }}
          >
            {s}x
          </button>
        ))}
      </div>

      {/* Progress bar */}
      <div className="ml-auto flex items-center gap-3">
        <div
          className="w-32 h-1.5 rounded-full overflow-hidden"
          style={{ background: "var(--bg-secondary)" }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: "var(--accent)" }}
            animate={{ width: `${(step / maxStep) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <span className="text-xs font-mono tabular-nums" style={{ color: "var(--text-muted)" }}>
          {label} {step}/{maxStep}
        </span>
      </div>
    </div>
  );
}

interface StatGridProps {
  stats: { label: string; value: string | number; color?: string }[];
}

export function StatGrid({ stats }: StatGridProps) {
  return (
    <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}>
      {stats.map((stat) => (
        <motion.div key={stat.label} layout className="stat-card">
          <div className="stat-value" style={stat.color ? { color: stat.color } : {}}>
            {stat.value}
          </div>
          <div className="stat-label">{stat.label}</div>
        </motion.div>
      ))}
    </div>
  );
}

