"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { SectionHeader } from "@/components/ui";

interface SeqGroup {
  id: string;
  prompt: string;
  tokensGenerated: number;
  maxTokens: number;
  priority: number;
  status: "waiting" | "running" | "swapped" | "completed";
  color: string;
  blocksUsed: number;
  swappedBlocks: number;
}

export default function SchedulerPage() {
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [preemptionMode, setPreemptionMode] = useState<"recompute" | "swap">("swap");

  const maxGpuBlocks = 8;

  // The scheduler simulation
  const getState = (currentStep: number) => {
    const groups: SeqGroup[] = [
      { id: "SG1", prompt: "Tell a story about...", tokensGenerated: 0, maxTokens: 10, priority: 1, status: "waiting", color: "#7c3aed", blocksUsed: 0, swappedBlocks: 0 },
      { id: "SG2", prompt: "Explain how...", tokensGenerated: 0, maxTokens: 6, priority: 2, status: "waiting", color: "#3b82f6", blocksUsed: 0, swappedBlocks: 0 },
      { id: "SG3", prompt: "Write code for...", tokensGenerated: 0, maxTokens: 8, priority: 3, status: "waiting", color: "#10b981", blocksUsed: 0, swappedBlocks: 0 },
      { id: "SG4", prompt: "Translate this...", tokensGenerated: 0, maxTokens: 5, priority: 4, status: "waiting", color: "#f59e0b", blocksUsed: 0, swappedBlocks: 0 },
      { id: "SG5", prompt: "High priority!", tokensGenerated: 0, maxTokens: 4, priority: 0, status: "waiting", color: "#ef4444", blocksUsed: 0, swappedBlocks: 0 },
    ];

    // Simple simulation
    for (let s = 0; s < currentStep; s++) {
      // Count running
      const running = groups.filter((g) => g.status === "running");
      const usedBlocks = running.reduce((sum, g) => sum + g.blocksUsed, 0);

      // Try to schedule waiting groups (FCFS)
      const waiting = groups
        .filter((g) => g.status === "waiting" && (g.id !== "SG5" || s >= 4))
        .sort((a, b) => a.priority - b.priority);

      for (const g of waiting) {
        const neededBlocks = 2;
        if (usedBlocks + neededBlocks <= maxGpuBlocks) {
          g.status = "running";
          g.blocksUsed = neededBlocks;
        } else if (s >= 4 && g.id === "SG5") {
          // Preempt lowest priority running
          const toPreempt = running
            .filter((r) => r.priority > g.priority)
            .sort((a, b) => b.priority - a.priority)[0];
          if (toPreempt) {
            if (preemptionMode === "swap") {
              toPreempt.status = "swapped";
              toPreempt.swappedBlocks = toPreempt.blocksUsed;
            } else {
              toPreempt.status = "waiting";
              toPreempt.tokensGenerated = 0;
              toPreempt.blocksUsed = 0;
            }
            g.status = "running";
            g.blocksUsed = 2;
          }
        }
      }

      // Generate tokens
      groups.forEach((g) => {
        if (g.status === "running") {
          g.tokensGenerated++;
          g.blocksUsed = Math.min(Math.ceil(g.tokensGenerated / 4) + 1, 3);
          if (g.tokensGenerated >= g.maxTokens) {
            g.status = "completed";
            g.blocksUsed = 0;
          }
        }
      });

      // Try to resume swapped
      const currentUsed = groups
        .filter((g) => g.status === "running")
        .reduce((sum, g) => sum + g.blocksUsed, 0);
      const swapped = groups.filter((g) => g.status === "swapped");
      for (const g of swapped) {
        if (currentUsed + g.swappedBlocks <= maxGpuBlocks) {
          g.status = "running";
          g.blocksUsed = g.swappedBlocks;
          g.swappedBlocks = 0;
        }
      }
    }

    return groups;
  };

  const groups = getState(step);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setStep((s) => {
        if (s >= 18) {
          setIsPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, 700);
    return () => clearInterval(timer);
  }, [isPlaying]);

  const waiting = groups.filter((g) => g.status === "waiting");
  const running = groups.filter((g) => g.status === "running");
  const swapped = groups.filter((g) => g.status === "swapped");
  const completed = groups.filter((g) => g.status === "completed");
  const gpuBlocksUsed = running.reduce((sum, g) => sum + g.blocksUsed, 0);

  return (
    <div className="max-w-6xl mx-auto">
      <SectionHeader
        title="vLLM Scheduler"
        subtitle="The scheduler orchestrates which sequences run, when to preempt, and how to manage GPU and CPU memory. It uses FCFS ordering with priority-based preemption."
        badge="SCHEDULING"
      />

      {/* Controls */}
      <div className="flex items-center gap-4 mb-8 flex-wrap">
        <div className="flex rounded-lg overflow-hidden border border-[var(--card-border)]">
          {(["swap", "recompute"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setPreemptionMode(m);
                setStep(0);
                setIsPlaying(false);
              }}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                preemptionMode === m
                  ? "bg-violet-500/20 text-violet-400"
                  : "bg-[var(--card-bg)] text-[var(--muted)]"
              }`}
            >
              {m === "swap" ? "Swap Preemption" : "Recompute Preemption"}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setStep(0); setIsPlaying(true); }}
          className="px-4 py-2 rounded-lg bg-violet-500/20 text-violet-400 border border-violet-500/40 text-sm font-medium"
        >
          ▶ Play
        </button>
        <button onClick={() => setIsPlaying(false)} className="px-4 py-2 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] text-sm text-[var(--muted)]">⏸</button>
        <button onClick={() => { setStep(0); setIsPlaying(false); }} className="px-4 py-2 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] text-sm text-[var(--muted)]">↺</button>
        <div className="ml-auto text-sm text-[var(--muted)] font-mono">Step: {step}</div>
      </div>

      {/* GPU Memory Bar */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-green-400">GPU Block Memory</h3>
          <span className="text-sm text-[var(--muted)]">{gpuBlocksUsed}/{maxGpuBlocks} blocks used</span>
        </div>
        <div className="flex gap-1 h-10">
          {Array.from({ length: maxGpuBlocks }, (_, i) => {
            let owner: SeqGroup | null = null;
            let count = 0;
            for (const g of running) {
              if (i >= count && i < count + g.blocksUsed) {
                owner = g;
                break;
              }
              count += g.blocksUsed;
            }
            return (
              <motion.div
                key={i}
                layout
                className="flex-1 rounded flex items-center justify-center text-xs font-mono"
                style={
                  owner
                    ? { backgroundColor: owner.color + "30", color: owner.color, border: `1px solid ${owner.color}40` }
                    : { backgroundColor: "#111", border: "1px solid #1e1e1e", color: "#555" }
                }
              >
                {owner?.id || "—"}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Three Queues */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* Waiting */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-amber-400 mb-3">
            Waiting Queue ({waiting.length})
          </h3>
          <div className="space-y-2 min-h-[120px]">
            <AnimatePresence>
              {waiting.map((g) => (
                <motion.div key={g.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-2 p-2 rounded-lg bg-[#0a0a0a]"
                >
                  <div className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-mono font-bold"
                    style={{ backgroundColor: g.color + "20", color: g.color }}>{g.id.slice(-1)}</div>
                  <div className="flex-1">
                    <div className="text-xs">{g.id}</div>
                    <div className="text-[10px] text-[var(--muted)]">P{g.priority}</div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {waiting.length === 0 && <div className="text-xs text-[var(--muted)] text-center py-6">Empty</div>}
          </div>
        </div>

        {/* Running */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-green-400 mb-3">
            Running ({running.length})
          </h3>
          <div className="space-y-2 min-h-[120px]">
            <AnimatePresence>
              {running.map((g) => (
                <motion.div key={g.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="p-2 rounded-lg" style={{ backgroundColor: g.color + "08", border: `1px solid ${g.color}30` }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-mono font-bold"
                      style={{ backgroundColor: g.color + "20", color: g.color }}>{g.id.slice(-1)}</div>
                    <span className="text-xs font-medium" style={{ color: g.color }}>{g.id}</span>
                    <span className="text-[10px] text-[var(--muted)] ml-auto">{g.blocksUsed} blk</span>
                  </div>
                  <div className="w-full h-1.5 bg-[var(--card-border)] rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ backgroundColor: g.color }}
                      animate={{ width: `${(g.tokensGenerated / g.maxTokens) * 100}%` }} />
                  </div>
                  <div className="text-[10px] text-[var(--muted)] mt-1">{g.tokensGenerated}/{g.maxTokens}</div>
                </motion.div>
              ))}
            </AnimatePresence>
            {running.length === 0 && <div className="text-xs text-[var(--muted)] text-center py-6">Empty</div>}
          </div>
        </div>

        {/* Swapped / Completed */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-red-400 mb-3">
            Swapped ({swapped.length}) / Completed ({completed.length})
          </h3>
          <div className="space-y-2 min-h-[120px]">
            <AnimatePresence>
              {swapped.map((g) => (
                <motion.div key={g.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center gap-2 p-2 rounded-lg bg-red-500/5 border border-red-500/20"
                >
                  <div className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-mono font-bold bg-red-500/20 text-red-400">
                    {g.id.slice(-1)}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-red-400">{g.id} (swapped)</div>
                    <div className="text-[10px] text-[var(--muted)]">{g.swappedBlocks} blocks on CPU</div>
                  </div>
                </motion.div>
              ))}
              {completed.map((g) => (
                <motion.div key={g.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center gap-2 p-2 rounded-lg bg-green-500/5"
                >
                  <div className="text-green-400 text-xs">✓</div>
                  <span className="text-xs text-[var(--muted)]">{g.id} done</span>
                </motion.div>
              ))}
            </AnimatePresence>
            {swapped.length === 0 && completed.length === 0 && (
              <div className="text-xs text-[var(--muted)] text-center py-6">Empty</div>
            )}
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-violet-400 mb-3">Preemption: Swap</h3>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            KV cache blocks are copied from <strong className="text-white">GPU → CPU memory</strong>.
            When the preempted sequence is rescheduled, its blocks are swapped back.
            Preserves all generated tokens but requires CPU memory and PCIe bandwidth.
          </p>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-violet-400 mb-3">Preemption: Recompute</h3>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            The preempted sequence&apos;s KV cache is <strong className="text-white">discarded entirely</strong>.
            When rescheduled, it re-runs the prompt (prefill) to regenerate the KV cache.
            Uses no extra memory but wastes compute. Better for short sequences.
          </p>
        </div>
      </div>
    </div>
  );
}
