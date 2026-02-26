"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { SectionHeader } from "@/components/ui";

const BLOCK_SIZE = 4; // tokens per block

interface Block {
  id: number;
  tokens: string[];
  status: "free" | "allocated" | "active";
}

interface VirtualPage {
  logicalIndex: number;
  physicalBlockId: number | null;
  tokens: string[];
}

export default function PagedAttentionPage() {
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const prompt = ["The", "quick", "brown", "fox", "jumps", "over", "the", "lazy", "dog", "and", "runs"];

  // Physical blocks (GPU memory)
  const totalPhysicalBlocks = 8;
  const physicalBlocks: Block[] = Array.from({ length: totalPhysicalBlocks }, (_, i) => ({
    id: i,
    tokens: [],
    status: "free" as const,
  }));

  // Calculate current state based on step
  const tokensProcessed = Math.min(step, prompt.length);
  const currentTokens = prompt.slice(0, tokensProcessed);
  const numPagesNeeded = Math.ceil(tokensProcessed / BLOCK_SIZE);

  // Build virtual pages
  const virtualPages: VirtualPage[] = [];
  for (let i = 0; i < numPagesNeeded; i++) {
    const startIdx = i * BLOCK_SIZE;
    const pageTokens = currentTokens.slice(startIdx, startIdx + BLOCK_SIZE);
    virtualPages.push({
      logicalIndex: i,
      physicalBlockId: i < totalPhysicalBlocks ? i : null,
      tokens: pageTokens,
    });
  }

  // Update physical blocks
  virtualPages.forEach((page) => {
    if (page.physicalBlockId !== null) {
      physicalBlocks[page.physicalBlockId] = {
        ...physicalBlocks[page.physicalBlockId],
        tokens: page.tokens,
        status: page.logicalIndex === numPagesNeeded - 1 ? "active" : "allocated",
      };
    }
  });

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setStep((s) => {
        if (s >= prompt.length) {
          setIsPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, 800);
    return () => clearInterval(timer);
  }, [isPlaying, prompt.length]);

  const wastedSlots =
    numPagesNeeded > 0
      ? numPagesNeeded * BLOCK_SIZE - tokensProcessed
      : 0;
  const wastePercent =
    numPagesNeeded > 0
      ? ((wastedSlots / (numPagesNeeded * BLOCK_SIZE)) * 100).toFixed(1)
      : "0";

  return (
    <div className="max-w-6xl mx-auto">
      <SectionHeader
        title="PagedAttention"
        subtitle="Inspired by OS virtual memory & paging. KV cache is stored in non-contiguous physical blocks, mapped via a block table. This near-eliminates memory fragmentation."
        badge="CORE INNOVATION"
      />

      {/* Controls */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => {
            setStep(0);
            setIsPlaying(true);
          }}
          className="px-4 py-2 rounded-lg bg-violet-500/20 text-violet-400 border border-violet-500/40 text-sm font-medium hover:bg-violet-500/30 transition-colors"
        >
          ▶ Play Animation
        </button>
        <button
          onClick={() => setIsPlaying(false)}
          className="px-4 py-2 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] text-sm text-[var(--muted)] hover:text-white transition-colors"
        >
          ⏸ Pause
        </button>
        <button
          onClick={() => {
            setStep(0);
            setIsPlaying(false);
          }}
          className="px-4 py-2 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] text-sm text-[var(--muted)] hover:text-white transition-colors"
        >
          ↺ Reset
        </button>
        <div className="ml-auto text-sm text-[var(--muted)]">
          Step: {step}/{prompt.length}
        </div>
      </div>

      {/* Prompt Display */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-6 mb-8">
        <h3 className="text-sm font-semibold text-[var(--muted)] mb-3">Input Prompt</h3>
        <div className="flex flex-wrap gap-2">
          {prompt.map((token, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0.3 }}
              animate={{
                opacity: i < tokensProcessed ? 1 : 0.3,
                scale: i === tokensProcessed - 1 ? 1.1 : 1,
              }}
              className={`px-3 py-1 rounded text-sm font-mono ${
                i < tokensProcessed
                  ? i === tokensProcessed - 1
                    ? "bg-violet-500/30 text-violet-300 border border-violet-500/50"
                    : "bg-blue-500/15 text-blue-300 border border-blue-500/30"
                  : "bg-[var(--card-border)] text-[var(--muted)] border border-transparent"
              }`}
            >
              {token}
            </motion.span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Virtual Page Table */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-blue-400 mb-4">
            Logical Block Table (Virtual)
          </h3>
          <div className="space-y-3">
            <AnimatePresence>
              {virtualPages.map((page) => (
                <motion.div
                  key={page.logicalIndex}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-20 text-xs text-[var(--muted)] font-mono">
                    Page {page.logicalIndex}
                  </div>
                  <div className="flex gap-1 flex-1">
                    {Array.from({ length: BLOCK_SIZE }, (_, j) => (
                      <motion.div
                        key={j}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: j * 0.05 }}
                        className={`flex-1 h-10 rounded flex items-center justify-center text-xs font-mono ${
                          page.tokens[j]
                            ? "bg-blue-500/20 border border-blue-500/40 text-blue-300"
                            : "bg-[var(--card-border)]/30 border border-dashed border-[var(--card-border)] text-[var(--muted)]"
                        }`}
                      >
                        {page.tokens[j] || "—"}
                      </motion.div>
                    ))}
                  </div>
                  <div className="text-xs text-[var(--muted)]">
                    → Block {page.physicalBlockId}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {virtualPages.length === 0 && (
              <div className="text-sm text-[var(--muted)] text-center py-8">
                Press Play to start tokenization
              </div>
            )}
          </div>
        </div>

        {/* Physical GPU Memory */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-green-400 mb-4">
            Physical GPU Memory Blocks
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {physicalBlocks.map((block) => (
              <motion.div
                key={block.id}
                animate={{
                  borderColor:
                    block.status === "active"
                      ? "#7c3aed"
                      : block.status === "allocated"
                      ? "#10b981"
                      : "#1e1e1e",
                }}
                className={`rounded-lg border p-3 ${
                  block.status === "active"
                    ? "bg-violet-500/10 animate-pulse-glow"
                    : block.status === "allocated"
                    ? "bg-green-500/5"
                    : "bg-[#0a0a0a]"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-[var(--muted)]">
                    Block {block.id}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                      block.status === "free"
                        ? "bg-gray-500/20 text-gray-500"
                        : block.status === "active"
                        ? "bg-violet-500/20 text-violet-400"
                        : "bg-green-500/20 text-green-400"
                    }`}
                  >
                    {block.status}
                  </span>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: BLOCK_SIZE }, (_, j) => (
                    <div
                      key={j}
                      className={`flex-1 h-6 rounded text-[10px] flex items-center justify-center font-mono ${
                        block.tokens[j]
                          ? "bg-green-500/20 text-green-300"
                          : "bg-[var(--card-border)]/20"
                      }`}
                    >
                      {block.tokens[j] || ""}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mt-8">
        {[
          { label: "Tokens Processed", value: tokensProcessed, color: "#3b82f6" },
          { label: "Pages Allocated", value: numPagesNeeded, color: "#10b981" },
          { label: "Wasted Slots", value: wastedSlots, color: "#f59e0b" },
          { label: "Internal Fragmentation", value: wastePercent + "%", color: "#ef4444" },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            layout
            className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-4 text-center"
          >
            <div className="text-2xl font-bold" style={{ color: stat.color }}>
              {stat.value}
            </div>
            <div className="text-xs text-[var(--muted)]">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Explanation */}
      <div className="mt-8 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-6">
        <h3 className="text-sm font-semibold text-violet-400 mb-3">How PagedAttention Works</h3>
        <div className="grid grid-cols-2 gap-6 text-sm text-[var(--muted)] leading-relaxed">
          <div>
            <p className="mb-3">
              <strong className="text-white">The Problem:</strong> Traditional attention stores KV cache in contiguous memory.
              If a sequence might generate up to 2048 tokens but only uses 100, the remaining 1948 slots are wasted (up to 96% waste).
            </p>
            <p>
              <strong className="text-white">The Solution:</strong> PagedAttention divides KV cache into fixed-size blocks (pages).
              Blocks are allocated on-demand and can be non-contiguous in physical memory, just like OS virtual memory.
            </p>
          </div>
          <div>
            <p className="mb-3">
              <strong className="text-white">Block Table:</strong> Maps logical (virtual) block indices to physical block locations.
              Each sequence has its own block table. This indirection enables flexible memory management.
            </p>
            <p>
              <strong className="text-white">Key Benefit:</strong> Memory waste is limited to the last block of each sequence
              (internal fragmentation {"<"}4%), compared to 60-80% waste in naive approaches.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
