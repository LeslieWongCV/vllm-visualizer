"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { SectionHeader, PlaybackControls, InfoCard } from "@/components/ui";
import { useSpeed } from "@/components/SpeedProvider";

interface Req {
  id: string;
  prompt: string;
  total: number;
  done: number;
  status: "waiting" | "running" | "completed";
  color: string;
  arrivedAt: number;
}

const INITIAL: Req[] = [
  { id: "R1", prompt: "Explain quantum computing", total: 6, done: 0, status: "waiting", color: "#7c3aed", arrivedAt: 0 },
  { id: "R2", prompt: "Write a haiku about AI", total: 4, done: 0, status: "waiting", color: "#3b82f6", arrivedAt: 0 },
  { id: "R3", prompt: "Translate to French", total: 8, done: 0, status: "waiting", color: "#10b981", arrivedAt: 0 },
  { id: "R4", prompt: "Summarize this paper", total: 5, done: 0, status: "waiting", color: "#f59e0b", arrivedAt: 3 },
  { id: "R5", prompt: "Code a binary search", total: 7, done: 0, status: "waiting", color: "#ef4444", arrivedAt: 5 },
];

const MAX_BATCH = 3;

export default function ContinuousBatchingPage() {
  const [mode, setMode] = useState<"static" | "continuous">("continuous");
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const simRequests = useCallback(
    (cur: number) => {
      const reqs = INITIAL.map((r) => ({ ...r }));

      if (mode === "static") {
        const batch = reqs.filter((r) => r.arrivedAt === 0).slice(0, MAX_BATCH);
        const maxTok = Math.max(...batch.map((r) => r.total));
        batch.forEach((r) => {
          r.status = "running";
          r.done = Math.min(cur, r.total);
          if (cur >= maxTok) r.status = "completed";
        });
        if (cur >= maxTok) {
          reqs.filter((r) => r.status === "waiting" && r.arrivedAt <= cur)
            .slice(0, MAX_BATCH)
            .forEach((r) => {
              r.status = "running";
              r.done = Math.min(cur - maxTok, r.total);
              if (r.done >= r.total) r.status = "completed";
            });
        }
      } else {
        let running = 0;
        for (let s = 0; s <= cur; s++) {
          reqs.forEach((r) => {
            if (r.status === "running" && r.done >= r.total) {
              r.status = "completed";
              running--;
            }
          });
          reqs
            .filter((r) => r.status === "waiting" && r.arrivedAt <= s)
            .forEach((r) => {
              if (running < MAX_BATCH) { r.status = "running"; running++; }
            });
          reqs.forEach((r) => {
            if (r.status === "running") r.done = Math.min(r.done + 1, r.total);
          });
        }
        reqs.forEach((r) => {
          if (r.status === "running" && r.done >= r.total) r.status = "completed";
        });
      }
      return reqs;
    },
    [mode],
  );

  const requests = simRequests(step);

  const { interval } = useSpeed();

  useEffect(() => {
    if (!isPlaying) return;
    const t = setInterval(() => {
      setStep((s) => {
        if (s >= 20) { setIsPlaying(false); return s; }
        return s + 1;
      });
    }, interval(550));
    return () => clearInterval(t);
  }, [isPlaying, interval]);

  const running = requests.filter((r) => r.status === "running");
  const waiting = requests.filter((r) => r.status === "waiting");
  const completed = requests.filter((r) => r.status === "completed");
  const gpuPct = ((running.length / MAX_BATCH) * 100).toFixed(0);

  return (
    <div>
      <SectionHeader
        badge="Scheduling"
        title="Continuous Batching"
        subtitle="Static batching wastes GPU cycles whenever a short request finishes early. Continuous batching fills those empty slots immediately, keeping the GPU busy."
      />

      {/* Mode toggle */}
      <div className="flex items-center gap-3 mb-2">
        <div
          className="inline-flex rounded-lg overflow-hidden"
          style={{ border: "1px solid var(--border)" }}
        >
          {(["static", "continuous"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setStep(0); setIsPlaying(false); }}
              className="px-4 py-2 text-xs font-medium transition-colors"
              style={{
                background: mode === m ? "var(--accent-subtle)" : "var(--bg-card)",
                color: mode === m ? "var(--accent-text)" : "var(--text-muted)",
              }}
            >
              {m === "static" ? "Static" : "Continuous"}
            </button>
          ))}
        </div>
      </div>

      <PlaybackControls
        isPlaying={isPlaying}
        onPlay={() => { setStep(0); setIsPlaying(true); }}
        onPause={() => setIsPlaying(false)}
        onReset={() => { setStep(0); setIsPlaying(false); }}
        step={step}
        maxStep={20}
        label="Iter"
      />

      {/* GPU batch slots */}
      <div className="card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-label" style={{ color: "#10b981" }}>
            GPU Batch Slots (max {MAX_BATCH})
          </h3>
          <span
            className="text-xs font-mono font-medium"
            style={{
              color: Number(gpuPct) >= 100 ? "#10b981" : Number(gpuPct) > 0 ? "#f59e0b" : "#ef4444",
            }}
          >
            {gpuPct}% utilized
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((slot) => {
            const req = running[slot];
            return (
              <div
                key={slot}
                className="h-28 rounded-xl flex flex-col items-center justify-center transition-colors"
                style={{
                  border: `2px ${req ? "solid" : "dashed"} ${req ? req.color + "50" : "var(--border)"}`,
                  background: req ? req.color + "08" : "transparent",
                }}
              >
                <AnimatePresence mode="wait">
                  {req ? (
                    <motion.div
                      key={req.id}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      className="text-center px-2"
                    >
                      <div className="font-mono font-bold text-base" style={{ color: req.color }}>
                        {req.id}
                      </div>
                      <div
                        className="text-[10px] mt-0.5 max-w-[110px] truncate"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {req.prompt}
                      </div>
                      {/* progress */}
                      <div
                        className="w-20 h-1.5 rounded-full mt-2 mx-auto overflow-hidden"
                        style={{ background: "var(--bg-secondary)" }}
                      >
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: req.color }}
                          animate={{ width: `${(req.done / req.total) * 100}%` }}
                        />
                      </div>
                      <div className="text-[9px] mt-1 font-mono" style={{ color: "var(--text-muted)" }}>
                        {req.done}/{req.total}
                      </div>
                    </motion.div>
                  ) : (
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Empty
                    </span>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Waiting + Completed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="card p-5">
          <h3 className="section-label mb-3" style={{ color: "#f59e0b" }}>
            Waiting ({waiting.length})
          </h3>
          <div className="space-y-1.5 min-h-[80px]">
            <AnimatePresence>
              {waiting.map((r) => (
                <motion.div
                  key={r.id}
                  layout
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  className="flex items-center gap-2.5 rounded-lg p-2"
                  style={{ background: "var(--bg-secondary)" }}
                >
                  <span
                    className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-mono font-bold"
                    style={{ background: r.color + "18", color: r.color }}
                  >
                    {r.id}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-medium truncate" style={{ color: "var(--text)" }}>
                      {r.prompt}
                    </div>
                    <div className="text-[9px]" style={{ color: "var(--text-muted)" }}>
                      {r.total} tokens
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {waiting.length === 0 && (
              <p className="text-[11px] text-center py-3" style={{ color: "var(--text-muted)" }}>
                Queue empty
              </p>
            )}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="section-label mb-3" style={{ color: "#10b981" }}>
            Completed ({completed.length})
          </h3>
          <div className="space-y-1.5 min-h-[80px]">
            <AnimatePresence>
              {completed.map((r) => (
                <motion.div
                  key={r.id}
                  layout
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2.5 rounded-lg p-2"
                  style={{ background: "#10b98108" }}
                >
                  <span
                    className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold"
                    style={{ color: "#10b981" }}
                  >
                    ✓
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-medium truncate" style={{ color: "var(--text)" }}>
                      {r.id} — {r.prompt}
                    </div>
                    <div className="text-[9px]" style={{ color: "#10b981" }}>
                      {r.total} tokens done
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {completed.length === 0 && (
              <p className="text-[11px] text-center py-3" style={{ color: "var(--text-muted)" }}>
                None yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Explanation */}
      <InfoCard title={mode === "static" ? "Static batching (the old way)" : "Continuous batching (vLLM)"}>
        {mode === "static" ? (
          <p>
            A fixed batch of requests is loaded onto the GPU. Even when one finishes early,
            its slot sits idle until the longest request in the batch is done. New arrivals have
            to wait. The result: lots of wasted compute, especially when sequence lengths vary.
          </p>
        ) : (
          <p>
            After every single iteration (one token per sequence), vLLM checks who&apos;s done.
            Finished sequences free their slot immediately, and waiting requests slide in.
            The GPU stays full almost all the time. This is why vLLM can serve 2-4x more
            requests per second than static-batching systems.
          </p>
        )}
      </InfoCard>
    </div>
  );
}
