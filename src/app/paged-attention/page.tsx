"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { SectionHeader, PlaybackControls, StatGrid, InfoCard } from "@/components/ui";
import { useSpeed } from "@/components/SpeedProvider";

const BLOCK_SIZE = 4;

export default function PagedAttentionPage() {
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const prompt = ["The", "quick", "brown", "fox", "jumps", "over", "the", "lazy", "dog", "and", "runs"];

  const totalPhysical = 8;
  const tokensProcessed = Math.min(step, prompt.length);
  const currentTokens = prompt.slice(0, tokensProcessed);
  const pagesNeeded = Math.ceil(tokensProcessed / BLOCK_SIZE);

  // Build virtual pages
  const virtualPages = Array.from({ length: pagesNeeded }, (_, i) => ({
    logicalIndex: i,
    physicalId: i,
    tokens: currentTokens.slice(i * BLOCK_SIZE, (i + 1) * BLOCK_SIZE),
  }));

  // Physical blocks state
  const physicals = Array.from({ length: totalPhysical }, (_, id) => {
    const page = virtualPages.find((p) => p.physicalId === id);
    return {
      id,
      tokens: page?.tokens || [],
      status: page
        ? page.logicalIndex === pagesNeeded - 1
          ? ("active" as const)
          : ("used" as const)
        : ("free" as const),
    };
  });

  const { interval } = useSpeed();

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setStep((s) => {
        if (s >= prompt.length) { setIsPlaying(false); return s; }
        return s + 1;
      });
    }, interval(700));
    return () => clearInterval(timer);
  }, [isPlaying, prompt.length, interval]);

  const wastedSlots = pagesNeeded > 0 ? pagesNeeded * BLOCK_SIZE - tokensProcessed : 0;
  const wastePct = pagesNeeded > 0 ? ((wastedSlots / (pagesNeeded * BLOCK_SIZE)) * 100).toFixed(1) : "0";

  return (
    <div>
      <SectionHeader
        badge="Core Innovation"
        title="PagedAttention"
        subtitle="Treat GPU memory like an OS treats RAM: allocate fixed-size pages on demand, map them through a block table, and waste almost nothing."
      />

      <PlaybackControls
        isPlaying={isPlaying}
        onPlay={() => { setStep(0); setIsPlaying(true); }}
        onPause={() => setIsPlaying(false)}
        onReset={() => { setStep(0); setIsPlaying(false); }}
        step={step}
        maxStep={prompt.length}
        label="Token"
      />

      {/* Prompt display */}
      <div className="card p-5 mb-6">
        <h3 className="section-label mb-3">Input Prompt</h3>
        <div className="flex flex-wrap gap-1.5">
          {prompt.map((tok, i) => {
            const processed = i < tokensProcessed;
            const current = i === tokensProcessed - 1;
            return (
              <motion.span
                key={i}
                animate={{
                  opacity: processed ? 1 : 0.35,
                  scale: current ? 1.08 : 1,
                }}
                className="px-2.5 py-1 rounded text-xs font-mono"
                style={{
                  background: current
                    ? "var(--accent-subtle)"
                    : processed
                    ? "#3b82f610"
                    : "var(--bg-secondary)",
                  color: current
                    ? "var(--accent-text)"
                    : processed
                    ? "#3b82f6"
                    : "var(--text-muted)",
                  border: `1px solid ${current ? "var(--accent)" : processed ? "#3b82f625" : "transparent"}`,
                }}
              >
                {tok}
              </motion.span>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Virtual page table */}
        <div className="card p-5">
          <h3 className="section-label mb-4" style={{ color: "#3b82f6" }}>
            Logical Block Table
          </h3>
          <div className="space-y-2.5 min-h-[140px]">
            <AnimatePresence>
              {virtualPages.map((page) => (
                <motion.div
                  key={page.logicalIndex}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  className="flex items-center gap-3"
                >
                  <span className="text-[11px] font-mono w-14 shrink-0" style={{ color: "var(--text-muted)" }}>
                    Page {page.logicalIndex}
                  </span>
                  <div className="flex gap-1 flex-1">
                    {Array.from({ length: BLOCK_SIZE }, (_, j) => (
                      <motion.div
                        key={j}
                        initial={{ scale: 0.7 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: j * 0.04 }}
                        className="flex-1 h-9 rounded flex items-center justify-center text-[11px] font-mono"
                        style={{
                          background: page.tokens[j] ? "#3b82f610" : "var(--bg-secondary)",
                          border: `1px ${page.tokens[j] ? "solid" : "dashed"} ${page.tokens[j] ? "#3b82f630" : "var(--border)"}`,
                          color: page.tokens[j] ? "#3b82f6" : "var(--text-muted)",
                        }}
                      >
                        {page.tokens[j] || "—"}
                      </motion.div>
                    ))}
                  </div>
                  <span className="text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>
                    → B{page.physicalId}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
            {virtualPages.length === 0 && (
              <p className="text-sm text-center py-6" style={{ color: "var(--text-muted)" }}>
                Press Play to start the animation
              </p>
            )}
          </div>
        </div>

        {/* Physical GPU memory */}
        <div className="card p-5">
          <h3 className="section-label mb-4" style={{ color: "#10b981" }}>
            Physical GPU Blocks
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            {physicals.map((b) => (
              <motion.div
                key={b.id}
                layout
                className="rounded-lg p-2.5"
                style={{
                  background:
                    b.status === "active"
                      ? "var(--accent-subtle)"
                      : b.status === "used"
                      ? "#10b98108"
                      : "var(--bg-secondary)",
                  border: `1px solid ${
                    b.status === "active"
                      ? "var(--accent)"
                      : b.status === "used"
                      ? "#10b98125"
                      : "var(--border)"
                  }`,
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                    Block {b.id}
                  </span>
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{
                      background:
                        b.status === "active"
                          ? "var(--accent-subtle)"
                          : b.status === "used"
                          ? "#10b98115"
                          : "var(--bg-secondary)",
                      color:
                        b.status === "active"
                          ? "var(--accent-text)"
                          : b.status === "used"
                          ? "#10b981"
                          : "var(--text-muted)",
                    }}
                  >
                    {b.status}
                  </span>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: BLOCK_SIZE }, (_, j) => (
                    <div
                      key={j}
                      className="flex-1 h-5 rounded text-[9px] flex items-center justify-center font-mono"
                      style={{
                        background: b.tokens[j] ? "#10b98112" : "transparent",
                        color: b.tokens[j] ? "#10b981" : "transparent",
                      }}
                    >
                      {b.tokens[j] || ""}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Live stats */}
      <div className="mb-8">
        <StatGrid
          stats={[
            { label: "Tokens", value: tokensProcessed, color: "#3b82f6" },
            { label: "Pages Used", value: pagesNeeded, color: "#10b981" },
            { label: "Wasted Slots", value: wastedSlots, color: "#f59e0b" },
            { label: "Fragmentation", value: wastePct + "%", color: "#ef4444" },
          ]}
        />
      </div>

      {/* Explanation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoCard title="The problem it solves">
          <p>
            Traditional systems pre-allocate a contiguous KV cache for the maximum possible
            sequence length. A request that might reach 2048 tokens but only uses 100 still
            reserves all 2048 slots, wasting 60-80% of GPU memory.
          </p>
        </InfoCard>
        <InfoCard title="How paging fixes it">
          <p>
            Instead of one big allocation, KV data is stored in small fixed-size blocks (pages).
            New pages are allocated only when needed, and they don&apos;t have to be contiguous.
            Waste drops to the last page per sequence, typically under 4%.
          </p>
        </InfoCard>
      </div>
    </div>
  );
}
