"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { SectionHeader } from "@/components/ui";

interface Request {
  id: string;
  prompt: string;
  totalTokens: number;
  generatedTokens: number;
  status: "waiting" | "running" | "completed";
  color: string;
  arrivedAt: number; // step when it arrived
}

export default function ContinuousBatchingPage() {
  const [mode, setMode] = useState<"static" | "continuous">("continuous");
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const initialRequests: Request[] = [
    { id: "R1", prompt: "Explain quantum computing", totalTokens: 6, generatedTokens: 0, status: "waiting", color: "#7c3aed", arrivedAt: 0 },
    { id: "R2", prompt: "Write a haiku about AI", totalTokens: 4, generatedTokens: 0, status: "waiting", color: "#3b82f6", arrivedAt: 0 },
    { id: "R3", prompt: "Translate to French", totalTokens: 8, generatedTokens: 0, status: "waiting", color: "#10b981", arrivedAt: 0 },
    { id: "R4", prompt: "Summarize this paper", totalTokens: 5, generatedTokens: 0, status: "waiting", color: "#f59e0b", arrivedAt: 3 },
    { id: "R5", prompt: "Code a binary search", totalTokens: 7, generatedTokens: 0, status: "waiting", color: "#ef4444", arrivedAt: 5 },
  ];

  const getRequestsAtStep = useCallback((currentStep: number) => {
    const requests = initialRequests.map((r) => ({ ...r }));
    const maxBatchSize = 3;

    if (mode === "static") {
      // Static batching: batch of first 3 requests runs until ALL complete
      const batch = requests.filter((r) => r.arrivedAt === 0).slice(0, maxBatchSize);
      const maxTokensInBatch = Math.max(...batch.map((r) => r.totalTokens));

      batch.forEach((r) => {
        r.status = "running";
        r.generatedTokens = Math.min(currentStep, r.totalTokens);
        if (r.generatedTokens >= r.totalTokens) {
          // In static batching, slot stays occupied until entire batch completes
          if (currentStep >= maxTokensInBatch) {
            r.status = "completed";
          }
        }
      });

      // After first batch completes, start next batch
      if (currentStep >= maxTokensInBatch) {
        const remaining = requests.filter(
          (r) => r.status === "waiting" && r.arrivedAt <= currentStep
        );
        remaining.slice(0, maxBatchSize).forEach((r) => {
          r.status = "running";
          r.generatedTokens = Math.min(currentStep - maxTokensInBatch, r.totalTokens);
          if (r.generatedTokens >= r.totalTokens) r.status = "completed";
        });
      }
    } else {
      // Continuous batching: immediately fill slots as sequences complete
      let runningCount = 0;

      for (let s = 0; s <= currentStep; s++) {
        // Mark completed
        requests.forEach((r) => {
          if (r.status === "running" && r.generatedTokens >= r.totalTokens) {
            r.status = "completed";
            runningCount--;
          }
        });

        // Add new requests to fill batch
        requests
          .filter((r) => r.status === "waiting" && r.arrivedAt <= s)
          .forEach((r) => {
            if (runningCount < maxBatchSize) {
              r.status = "running";
              runningCount++;
            }
          });

        // Generate one token for running requests
        requests.forEach((r) => {
          if (r.status === "running" && s <= currentStep) {
            r.generatedTokens = Math.min(r.generatedTokens + 1, r.totalTokens);
          }
        });
      }

      // Final check
      requests.forEach((r) => {
        if (r.status === "running" && r.generatedTokens >= r.totalTokens) {
          r.status = "completed";
        }
      });
    }

    return requests;
  }, [mode]);

  const requests = getRequestsAtStep(step);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setStep((s) => {
        if (s >= 20) {
          setIsPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, 600);
    return () => clearInterval(timer);
  }, [isPlaying]);

  const running = requests.filter((r) => r.status === "running");
  const waiting = requests.filter((r) => r.status === "waiting");
  const completed = requests.filter((r) => r.status === "completed");
  const gpuUtil = (running.length / 3) * 100;

  return (
    <div className="max-w-6xl mx-auto">
      <SectionHeader
        title="Continuous Batching"
        subtitle="Instead of waiting for the entire batch to finish, vLLM immediately fills empty slots with new requests — dramatically improving GPU utilization and throughput."
        badge="SCHEDULING"
      />

      {/* Mode Selector */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex rounded-lg overflow-hidden border border-[var(--card-border)]">
          {(["static", "continuous"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setStep(0);
                setIsPlaying(false);
              }}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                mode === m
                  ? "bg-violet-500/20 text-violet-400"
                  : "bg-[var(--card-bg)] text-[var(--muted)] hover:text-white"
              }`}
            >
              {m === "static" ? "Static Batching" : "Continuous Batching"}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            setStep(0);
            setIsPlaying(true);
          }}
          className="px-4 py-2 rounded-lg bg-violet-500/20 text-violet-400 border border-violet-500/40 text-sm font-medium"
        >
          ▶ Play
        </button>
        <button
          onClick={() => setIsPlaying(false)}
          className="px-4 py-2 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] text-sm text-[var(--muted)]"
        >
          ⏸
        </button>
        <button
          onClick={() => { setStep(0); setIsPlaying(false); }}
          className="px-4 py-2 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] text-sm text-[var(--muted)]"
        >
          ↺
        </button>

        <div className="ml-auto text-sm text-[var(--muted)] font-mono">
          Iteration: {step}
        </div>
      </div>

      {/* GPU Slots Visualization */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-green-400">GPU Batch Slots (max: 3)</h3>
          <span className={`text-sm font-medium ${gpuUtil >= 100 ? "text-green-400" : gpuUtil > 0 ? "text-amber-400" : "text-red-400"}`}>
            GPU Utilization: {gpuUtil.toFixed(0)}%
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map((slot) => {
            const req = running[slot];
            return (
              <motion.div
                key={slot}
                layout
                className={`h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-colors ${
                  req ? "border-solid" : "border-[var(--card-border)]"
                }`}
                style={
                  req
                    ? {
                        borderColor: req.color,
                        backgroundColor: req.color + "10",
                      }
                    : {}
                }
              >
                <AnimatePresence mode="wait">
                  {req ? (
                    <motion.div
                      key={req.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="text-center"
                    >
                      <div className="font-mono font-bold text-lg" style={{ color: req.color }}>
                        {req.id}
                      </div>
                      <div className="text-xs text-[var(--muted)] mt-1 max-w-[120px] truncate">
                        {req.prompt}
                      </div>
                      {/* Progress bar */}
                      <div className="w-24 h-2 bg-[var(--card-border)] rounded-full mt-2 mx-auto overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: req.color }}
                          animate={{ width: `${(req.generatedTokens / req.totalTokens) * 100}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-[var(--muted)] mt-1">
                        {req.generatedTokens}/{req.totalTokens} tokens
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[var(--muted)] text-sm"
                    >
                      Empty Slot
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Queue and Completed */}
      <div className="grid grid-cols-2 gap-8">
        {/* Waiting Queue */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-amber-400 mb-4">
            Waiting Queue ({waiting.length})
          </h3>
          <div className="space-y-2">
            <AnimatePresence>
              {waiting.map((req) => (
                <motion.div
                  key={req.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-3 rounded-lg p-3 bg-[#0a0a0a]"
                >
                  <div
                    className="w-8 h-8 rounded flex items-center justify-center font-mono font-bold text-sm"
                    style={{ backgroundColor: req.color + "20", color: req.color }}
                  >
                    {req.id}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium">{req.prompt}</div>
                    <div className="text-[10px] text-[var(--muted)]">
                      {req.totalTokens} tokens to generate
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {waiting.length === 0 && (
              <div className="text-sm text-[var(--muted)] text-center py-4">Queue empty</div>
            )}
          </div>
        </div>

        {/* Completed */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-green-400 mb-4">
            Completed ({completed.length})
          </h3>
          <div className="space-y-2">
            <AnimatePresence>
              {completed.map((req) => (
                <motion.div
                  key={req.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 rounded-lg p-3 bg-green-500/5"
                >
                  <div
                    className="w-8 h-8 rounded flex items-center justify-center font-mono font-bold text-sm"
                    style={{ backgroundColor: req.color + "20", color: req.color }}
                  >
                    ✓
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium">{req.id} — {req.prompt}</div>
                    <div className="text-[10px] text-green-400">
                      {req.totalTokens} tokens generated
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {completed.length === 0 && (
              <div className="text-sm text-[var(--muted)] text-center py-4">None yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div className="mt-8 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-6">
        <h3 className="text-sm font-semibold text-violet-400 mb-3">
          {mode === "static" ? "Static Batching (Baseline)" : "Continuous Batching (vLLM)"}
        </h3>
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          {mode === "static" ? (
            <>
              <strong className="text-white">Static batching</strong> groups requests into a fixed batch.
              Even if one request finishes early, its GPU slot stays occupied until the entire batch is done.
              New requests must wait until all sequences in the current batch complete. This leads to
              <strong className="text-red-400"> significant GPU underutilization</strong>, especially when
              sequence lengths vary.
            </>
          ) : (
            <>
              <strong className="text-white">Continuous batching</strong> (iteration-level scheduling)
              checks for completed sequences after every iteration. Finished sequences are immediately
              removed and new requests can fill the empty slots. This means the GPU is
              <strong className="text-green-400"> almost always fully utilized</strong>.
              vLLM implements this at the token level — each iteration generates exactly one token per
              running sequence.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
