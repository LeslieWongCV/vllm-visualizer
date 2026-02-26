"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { SectionHeader, PlaybackControls, InfoCard } from "@/components/ui";
import { useSpeed } from "@/components/SpeedProvider";

interface SG {
  id: string;
  prompt: string;
  done: number;
  max: number;
  pri: number;
  status: "waiting" | "running" | "swapped" | "completed";
  color: string;
  blocks: number;
  swapBlocks: number;
}

const GPU_BLOCKS = 8;

export default function SchedulerPage() {
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [preempt, setPreempt] = useState<"swap" | "recompute">("swap");

  const simulate = (cur: number): SG[] => {
    const gs: SG[] = [
      { id: "SG1", prompt: "Tell a story about...", done: 0, max: 10, pri: 1, status: "waiting", color: "#7c3aed", blocks: 0, swapBlocks: 0 },
      { id: "SG2", prompt: "Explain how...", done: 0, max: 6, pri: 2, status: "waiting", color: "#3b82f6", blocks: 0, swapBlocks: 0 },
      { id: "SG3", prompt: "Write code for...", done: 0, max: 8, pri: 3, status: "waiting", color: "#10b981", blocks: 0, swapBlocks: 0 },
      { id: "SG4", prompt: "Translate this...", done: 0, max: 5, pri: 4, status: "waiting", color: "#f59e0b", blocks: 0, swapBlocks: 0 },
      { id: "SG5", prompt: "High priority!", done: 0, max: 4, pri: 0, status: "waiting", color: "#ef4444", blocks: 0, swapBlocks: 0 },
    ];

    for (let s = 0; s < cur; s++) {
      const running = gs.filter((g) => g.status === "running");
      let used = running.reduce((a, g) => a + g.blocks, 0);

      // schedule waiting (FCFS)
      const wq = gs
        .filter((g) => g.status === "waiting" && (g.id !== "SG5" || s >= 4))
        .sort((a, b) => a.pri - b.pri);

      for (const g of wq) {
        const need = 2;
        if (used + need <= GPU_BLOCKS) {
          g.status = "running";
          g.blocks = need;
          used += need;
        } else if (s >= 4 && g.id === "SG5") {
          const victim = running
            .filter((r) => r.pri > g.pri)
            .sort((a, b) => b.pri - a.pri)[0];
          if (victim) {
            if (preempt === "swap") {
              victim.status = "swapped";
              victim.swapBlocks = victim.blocks;
            } else {
              victim.status = "waiting";
              victim.done = 0;
              victim.blocks = 0;
            }
            g.status = "running";
            g.blocks = 2;
          }
        }
      }

      gs.forEach((g) => {
        if (g.status === "running") {
          g.done++;
          g.blocks = Math.min(Math.ceil(g.done / 4) + 1, 3);
          if (g.done >= g.max) { g.status = "completed"; g.blocks = 0; }
        }
      });

      // resume swapped
      const nowUsed = gs.filter((g) => g.status === "running").reduce((a, g) => a + g.blocks, 0);
      gs.filter((g) => g.status === "swapped").forEach((g) => {
        if (nowUsed + g.swapBlocks <= GPU_BLOCKS) {
          g.status = "running";
          g.blocks = g.swapBlocks;
          g.swapBlocks = 0;
        }
      });
    }
    return gs;
  };

  const groups = simulate(step);

  const { interval } = useSpeed();

  useEffect(() => {
    if (!isPlaying) return;
    const t = setInterval(() => {
      setStep((s) => { if (s >= 18) { setIsPlaying(false); return s; } return s + 1; });
    }, interval(650));
    return () => clearInterval(t);
  }, [isPlaying, interval]);

  const waiting = groups.filter((g) => g.status === "waiting");
  const running = groups.filter((g) => g.status === "running");
  const swapped = groups.filter((g) => g.status === "swapped");
  const completed = groups.filter((g) => g.status === "completed");
  const gpuUsed = running.reduce((a, g) => a + g.blocks, 0);

  return (
    <div>
      <SectionHeader
        badge="Scheduling"
        title="Scheduler & Preemption"
        subtitle="FCFS ordering with priority-aware preemption. When GPU memory runs out, the scheduler can either swap KV cache to CPU or discard and recompute later."
      />

      {/* Preemption mode */}
      <div className="flex items-center gap-3 mb-2">
        <div className="inline-flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          {(["swap", "recompute"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setPreempt(m); setStep(0); setIsPlaying(false); }}
              className="px-4 py-2 text-xs font-medium transition-colors"
              style={{
                background: preempt === m ? "var(--accent-subtle)" : "var(--bg-card)",
                color: preempt === m ? "var(--accent-text)" : "var(--text-muted)",
              }}
            >
              {m === "swap" ? "Swap" : "Recompute"}
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
        maxStep={18}
      />

      {/* GPU block bar */}
      <div className="card p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="section-label" style={{ color: "#10b981" }}>GPU Blocks</h3>
          <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
            {gpuUsed}/{GPU_BLOCKS}
          </span>
        </div>
        <div className="flex gap-1 h-9">
          {Array.from({ length: GPU_BLOCKS }, (_, i) => {
            let owner: SG | null = null;
            let acc = 0;
            for (const g of running) {
              if (i >= acc && i < acc + g.blocks) { owner = g; break; }
              acc += g.blocks;
            }
            return (
              <motion.div
                key={i}
                layout
                className="flex-1 rounded flex items-center justify-center text-[10px] font-mono font-medium"
                style={{
                  background: owner ? owner.color + "20" : "var(--bg-secondary)",
                  color: owner ? owner.color : "var(--text-muted)",
                  border: `1px solid ${owner ? owner.color + "35" : "var(--border)"}`,
                }}
              >
                {owner?.id || "—"}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Three queues */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {/* Waiting */}
        <div className="card p-4">
          <h3 className="section-label mb-3" style={{ color: "#f59e0b" }}>
            Waiting ({waiting.length})
          </h3>
          <div className="space-y-1.5 min-h-[100px]">
            <AnimatePresence>
              {waiting.map((g) => (
                <motion.div key={g.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: 12 }}
                  className="flex items-center gap-2 p-2 rounded-lg" style={{ background: "var(--bg-secondary)" }}
                >
                  <span className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-mono font-bold"
                    style={{ background: g.color + "18", color: g.color }}>{g.id.slice(-1)}</span>
                  <span className="text-[11px] flex-1" style={{ color: "var(--text)" }}>{g.id}</span>
                  <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>P{g.pri}</span>
                </motion.div>
              ))}
            </AnimatePresence>
            {waiting.length === 0 && <p className="text-[10px] text-center py-4" style={{ color: "var(--text-muted)" }}>Empty</p>}
          </div>
        </div>

        {/* Running */}
        <div className="card p-4">
          <h3 className="section-label mb-3" style={{ color: "#10b981" }}>
            Running ({running.length})
          </h3>
          <div className="space-y-1.5 min-h-[100px]">
            <AnimatePresence>
              {running.map((g) => (
                <motion.div key={g.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="p-2 rounded-lg" style={{ background: g.color + "08", border: `1px solid ${g.color}20` }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-mono font-bold"
                      style={{ background: g.color + "18", color: g.color }}>{g.id.slice(-1)}</span>
                    <span className="text-[11px] font-medium" style={{ color: g.color }}>{g.id}</span>
                    <span className="ml-auto text-[9px]" style={{ color: "var(--text-muted)" }}>{g.blocks}blk</span>
                  </div>
                  <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: "var(--bg-secondary)" }}>
                    <motion.div className="h-full rounded-full" style={{ background: g.color }}
                      animate={{ width: `${(g.done / g.max) * 100}%` }} />
                  </div>
                  <span className="text-[9px] font-mono" style={{ color: "var(--text-muted)" }}>{g.done}/{g.max}</span>
                </motion.div>
              ))}
            </AnimatePresence>
            {running.length === 0 && <p className="text-[10px] text-center py-4" style={{ color: "var(--text-muted)" }}>Empty</p>}
          </div>
        </div>

        {/* Swapped / Completed */}
        <div className="card p-4">
          <h3 className="section-label mb-3" style={{ color: "#ef4444" }}>
            Swapped ({swapped.length}) / Done ({completed.length})
          </h3>
          <div className="space-y-1.5 min-h-[100px]">
            <AnimatePresence>
              {swapped.map((g) => (
                <motion.div key={g.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center gap-2 p-2 rounded-lg" style={{ background: "#ef444408", border: "1px solid #ef444420" }}
                >
                  <span className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-mono font-bold"
                    style={{ background: "#ef444418", color: "#ef4444" }}>{g.id.slice(-1)}</span>
                  <span className="text-[11px]" style={{ color: "#ef4444" }}>{g.id}</span>
                  <span className="ml-auto text-[9px]" style={{ color: "var(--text-muted)" }}>{g.swapBlocks}blk CPU</span>
                </motion.div>
              ))}
              {completed.map((g) => (
                <motion.div key={g.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center gap-2 p-2 rounded-lg" style={{ background: "#10b98108" }}
                >
                  <span className="text-[10px]" style={{ color: "#10b981" }}>✓</span>
                  <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{g.id} done</span>
                </motion.div>
              ))}
            </AnimatePresence>
            {swapped.length === 0 && completed.length === 0 && (
              <p className="text-[10px] text-center py-4" style={{ color: "var(--text-muted)" }}>Empty</p>
            )}
          </div>
        </div>
      </div>

      {/* Explanations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoCard title="Swap preemption" accent="#3b82f6">
          <p>
            The victim&apos;s KV cache blocks get copied from GPU → CPU over PCIe. When the
            sequence gets rescheduled, blocks are swapped back. All generated tokens are
            preserved, but you pay for the transfer bandwidth.
          </p>
        </InfoCard>
        <InfoCard title="Recompute preemption" accent="#f59e0b">
          <p>
            The KV cache is simply discarded. When the sequence runs again, vLLM re-processes
            the prompt from scratch (prefill) to rebuild the cache. No extra memory needed,
            but you redo compute. Works best for short prompts.
          </p>
        </InfoCard>
      </div>
    </div>
  );
}
