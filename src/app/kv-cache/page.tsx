"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { SectionHeader } from "@/components/ui";

interface CacheBlock {
  id: number;
  owner: string | null; // sequence id
  layer: number;
  type: "key" | "value";
  refCount: number;
  tokens: number;
}

export default function KVCachePage() {
  const [selectedSeq, setSelectedSeq] = useState<string | null>(null);
  const [showSharing, setShowSharing] = useState(false);

  const sequences = [
    { id: "seq_A", prompt: "Tell me about", generated: ["machine", "learning", "and"], color: "#7c3aed" },
    { id: "seq_B", prompt: "Tell me about", generated: ["deep", "neural"], color: "#3b82f6" },
    { id: "seq_C", prompt: "What is the", generated: ["capital", "of", "France", "?"], color: "#10b981" },
  ];

  // Build cache blocks
  const cacheBlocks: CacheBlock[] = [];
  let blockId = 0;

  // If sharing is enabled, seq_A and seq_B share prompt blocks
  const sharedPromptBlockK = blockId++;
  const sharedPromptBlockV = blockId++;

  if (showSharing) {
    cacheBlocks.push(
      { id: sharedPromptBlockK, owner: "shared_AB", layer: 0, type: "key", refCount: 2, tokens: 3 },
      { id: sharedPromptBlockV, owner: "shared_AB", layer: 0, type: "value", refCount: 2, tokens: 3 },
    );
  } else {
    // Separate blocks for A and B
    cacheBlocks.push(
      { id: sharedPromptBlockK, owner: "seq_A", layer: 0, type: "key", refCount: 1, tokens: 3 },
      { id: sharedPromptBlockV, owner: "seq_A", layer: 0, type: "value", refCount: 1, tokens: 3 },
      { id: blockId++, owner: "seq_B", layer: 0, type: "key", refCount: 1, tokens: 3 },
      { id: blockId++, owner: "seq_B", layer: 0, type: "value", refCount: 1, tokens: 3 },
    );
  }

  // Generated token blocks
  sequences.forEach((seq) => {
    if (seq.generated.length > 0) {
      cacheBlocks.push(
        { id: blockId++, owner: seq.id, layer: 0, type: "key", refCount: 1, tokens: seq.generated.length },
        { id: blockId++, owner: seq.id, layer: 0, type: "value", refCount: 1, tokens: seq.generated.length },
      );
    }
  });

  // seq_C prompt
  cacheBlocks.push(
    { id: blockId++, owner: "seq_C", layer: 0, type: "key", refCount: 1, tokens: 3 },
    { id: blockId++, owner: "seq_C", layer: 0, type: "value", refCount: 1, tokens: 3 },
  );

  const getOwnerColor = (owner: string | null) => {
    if (owner === "shared_AB") return "#f59e0b";
    const seq = sequences.find((s) => s.id === owner);
    return seq?.color || "#6b7280";
  };

  const totalBlocks = 16;
  const usedBlocks = cacheBlocks.length;
  const savedBlocks = showSharing ? 2 : 0;

  return (
    <div className="max-w-6xl mx-auto">
      <SectionHeader
        title="KV Cache Management"
        subtitle="Every attention layer stores Key and Value tensors for all previous tokens. vLLM manages this cache with block-level granularity, enabling sharing and efficient memory use."
        badge="MEMORY"
      />

      {/* Controls */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => setShowSharing(!showSharing)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            showSharing
              ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
              : "bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--muted)] hover:text-white"
          }`}
        >
          {showSharing ? "✓ Prefix Sharing ON" : "Enable Prefix Sharing"}
        </button>
        <div className="text-sm text-[var(--muted)]">
          {showSharing && (
            <span className="text-amber-400">
              Seq A & B share prompt KV cache (same prefix &quot;Tell me about&quot;)
            </span>
          )}
        </div>
      </div>

      {/* Sequences */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {sequences.map((seq) => (
          <motion.div
            key={seq.id}
            onClick={() => setSelectedSeq(selectedSeq === seq.id ? null : seq.id)}
            whileHover={{ y: -2 }}
            className={`bg-[var(--card-bg)] border rounded-xl p-4 cursor-pointer transition-colors ${
              selectedSeq === seq.id
                ? "border-opacity-60"
                : "border-[var(--card-border)]"
            }`}
            style={{
              borderColor: selectedSeq === seq.id ? seq.color : undefined,
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: seq.color }}
              />
              <span className="text-sm font-mono font-medium">{seq.id}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {seq.prompt.split(" ").map((t, i) => (
                <span
                  key={`p${i}`}
                  className="px-2 py-0.5 rounded text-xs font-mono bg-gray-500/10 text-gray-400"
                >
                  {t}
                </span>
              ))}
              {seq.generated.map((t, i) => (
                <span
                  key={`g${i}`}
                  className="px-2 py-0.5 rounded text-xs font-mono"
                  style={{
                    backgroundColor: seq.color + "20",
                    color: seq.color,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Block Table */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-violet-400 mb-4">Block Table Mapping</h3>
          <div className="space-y-2">
            {cacheBlocks
              .filter((b) => !selectedSeq || b.owner === selectedSeq || b.owner === "shared_AB")
              .map((block) => (
                <motion.div
                  key={block.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-3 rounded-lg p-2 hover:bg-white/5"
                >
                  <div
                    className="w-8 h-8 rounded flex items-center justify-center text-xs font-mono font-bold"
                    style={{
                      backgroundColor: getOwnerColor(block.owner) + "20",
                      color: getOwnerColor(block.owner),
                    }}
                  >
                    {block.id}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium">
                      {block.owner === "shared_AB" ? (
                        <span className="text-amber-400">Shared (A+B)</span>
                      ) : (
                        <span style={{ color: getOwnerColor(block.owner) }}>{block.owner}</span>
                      )}
                      <span className="text-[var(--muted)]"> · Layer {block.layer}</span>
                    </div>
                    <div className="text-[10px] text-[var(--muted)]">
                      {block.type.toUpperCase()} cache · {block.tokens} tokens
                    </div>
                  </div>
                  {block.refCount > 1 && (
                    <div className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
                      refs: {block.refCount}
                    </div>
                  )}
                </motion.div>
              ))}
          </div>
        </div>

        {/* Physical Memory Visualization */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-green-400 mb-4">GPU Memory Layout</h3>
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: totalBlocks }, (_, i) => {
              const block = cacheBlocks.find((b) => b.id === i);
              return (
                <motion.div
                  key={i}
                  layout
                  className={`h-16 rounded-lg border flex flex-col items-center justify-center text-xs ${
                    block
                      ? "border-opacity-50"
                      : "border-[var(--card-border)] bg-[#0a0a0a]"
                  }`}
                  style={
                    block
                      ? {
                          backgroundColor: getOwnerColor(block.owner) + "10",
                          borderColor: getOwnerColor(block.owner) + "40",
                        }
                      : {}
                  }
                >
                  {block ? (
                    <>
                      <span
                        className="font-mono font-bold text-[10px]"
                        style={{ color: getOwnerColor(block.owner) }}
                      >
                        {block.type.toUpperCase()[0]}
                      </span>
                      <span className="text-[9px] text-[var(--muted)]">
                        {block.owner === "shared_AB" ? "A+B" : block.owner?.split("_")[1]}
                      </span>
                    </>
                  ) : (
                    <span className="text-[var(--muted)]">free</span>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4">
            {sequences.map((seq) => (
              <div key={seq.id} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded"
                  style={{ backgroundColor: seq.color }}
                />
                <span className="text-[10px] text-[var(--muted)]">{seq.id}</span>
              </div>
            ))}
            {showSharing && (
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded bg-amber-500" />
                <span className="text-[10px] text-[var(--muted)]">Shared</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mt-8">
        {[
          { label: "Used Blocks", value: usedBlocks, color: "#3b82f6" },
          { label: "Free Blocks", value: totalBlocks - usedBlocks, color: "#10b981" },
          { label: "Blocks Saved (Sharing)", value: savedBlocks, color: "#f59e0b" },
          {
            label: "Memory Efficiency",
            value: ((usedBlocks / totalBlocks) * 100).toFixed(0) + "%",
            color: "#7c3aed",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-4 text-center"
          >
            <div className="text-2xl font-bold" style={{ color: stat.color }}>
              {stat.value}
            </div>
            <div className="text-xs text-[var(--muted)]">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Copy-on-Write Explanation */}
      <div className="mt-8 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-6">
        <h3 className="text-sm font-semibold text-violet-400 mb-3">Copy-on-Write (CoW)</h3>
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          When multiple sequences share a KV cache block (e.g., same prompt prefix), vLLM uses
          <strong className="text-white"> reference counting</strong>. The shared block has refCount {">"}1.
          When one sequence needs to modify the block (diverging generation), vLLM copies the block
          first (Copy-on-Write), decrements the ref count on the original, and gives the new copy
          to the diverging sequence. This is the same technique used by OS memory management.
        </p>
      </div>
    </div>
  );
}
