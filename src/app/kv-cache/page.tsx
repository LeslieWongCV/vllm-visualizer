"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { SectionHeader, StatGrid, InfoCard } from "@/components/ui";

export default function KVCachePage() {
  const [selectedSeq, setSelectedSeq] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  const sequences = [
    { id: "seq_A", prompt: "Tell me about", generated: ["machine", "learning", "and"], color: "#7c3aed" },
    { id: "seq_B", prompt: "Tell me about", generated: ["deep", "neural"], color: "#3b82f6" },
    { id: "seq_C", prompt: "What is the", generated: ["capital", "of", "France", "?"], color: "#10b981" },
  ];

  // Build cache blocks
  type CBlock = { id: number; owner: string; type: "K" | "V"; refCount: number; tokens: number };
  const blocks: CBlock[] = [];
  let bid = 0;

  if (sharing) {
    // A & B share prompt blocks
    blocks.push(
      { id: bid++, owner: "shared_AB", type: "K", refCount: 2, tokens: 3 },
      { id: bid++, owner: "shared_AB", type: "V", refCount: 2, tokens: 3 },
    );
  } else {
    blocks.push(
      { id: bid++, owner: "seq_A", type: "K", refCount: 1, tokens: 3 },
      { id: bid++, owner: "seq_A", type: "V", refCount: 1, tokens: 3 },
      { id: bid++, owner: "seq_B", type: "K", refCount: 1, tokens: 3 },
      { id: bid++, owner: "seq_B", type: "V", refCount: 1, tokens: 3 },
    );
  }

  // Generated blocks
  sequences.forEach((seq) => {
    if (seq.generated.length > 0) {
      blocks.push(
        { id: bid++, owner: seq.id, type: "K", refCount: 1, tokens: seq.generated.length },
        { id: bid++, owner: seq.id, type: "V", refCount: 1, tokens: seq.generated.length },
      );
    }
  });

  // seq_C prompt
  blocks.push(
    { id: bid++, owner: "seq_C", type: "K", refCount: 1, tokens: 3 },
    { id: bid++, owner: "seq_C", type: "V", refCount: 1, tokens: 3 },
  );

  const ownerColor = (o: string) => {
    if (o === "shared_AB") return "#f59e0b";
    return sequences.find((s) => s.id === o)?.color || "#6b7280";
  };

  const totalSlots = 16;
  const used = blocks.length;
  const saved = sharing ? 2 : 0;

  return (
    <div>
      <SectionHeader
        badge="Memory"
        title="KV Cache Management"
        subtitle="Each attention layer caches Key and Value tensors for past tokens. vLLM maps them to physical blocks through a block table, just like a page table in an OS."
      />

      {/* Toggle */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => setSharing(!sharing)}
          className={sharing ? "btn-primary" : "btn-secondary"}
        >
          {sharing ? "Prefix Sharing ON" : "Enable Prefix Sharing"}
        </button>
        {sharing && (
          <span className="text-xs" style={{ color: "#f59e0b" }}>
            Seq A &amp; B share the KV cache for their common prefix &quot;Tell me about&quot;
          </span>
        )}
      </div>

      {/* Sequence cards */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {sequences.map((seq) => {
          const active = selectedSeq === seq.id;
          return (
            <motion.button
              key={seq.id}
              onClick={() => setSelectedSeq(active ? null : seq.id)}
              whileHover={{ y: -2 }}
              className="card p-4 text-left transition-colors"
              style={active ? { borderColor: seq.color } : {}}
            >
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: seq.color }} />
                <span className="text-xs font-mono font-semibold" style={{ color: "var(--text)" }}>
                  {seq.id}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {seq.prompt.split(" ").map((t, i) => (
                  <span
                    key={`p${i}`}
                    className="px-1.5 py-0.5 rounded text-[10px] font-mono"
                    style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}
                  >
                    {t}
                  </span>
                ))}
                {seq.generated.map((t, i) => (
                  <span
                    key={`g${i}`}
                    className="px-1.5 py-0.5 rounded text-[10px] font-mono"
                    style={{ background: seq.color + "15", color: seq.color }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Block table */}
        <div className="card p-5">
          <h3 className="section-label mb-4" style={{ color: "var(--accent-text)" }}>
            Block Table
          </h3>
          <div className="space-y-1.5">
            {blocks
              .filter((b) => !selectedSeq || b.owner === selectedSeq || b.owner === "shared_AB")
              .map((b) => (
                <motion.div
                  key={b.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-3 rounded-lg p-2 transition-colors"
                  style={{ background: ownerColor(b.owner) + "06" }}
                >
                  <span
                    className="w-7 h-7 rounded flex items-center justify-center text-[10px] font-mono font-bold"
                    style={{ background: ownerColor(b.owner) + "18", color: ownerColor(b.owner) }}
                  >
                    {b.id}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium" style={{ color: ownerColor(b.owner) }}>
                      {b.owner === "shared_AB" ? "Shared (A+B)" : b.owner}
                    </span>
                    <span className="text-[10px] ml-2" style={{ color: "var(--text-muted)" }}>
                      {b.type} cache · {b.tokens} tok
                    </span>
                  </div>
                  {b.refCount > 1 && (
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{ background: "#f59e0b15", color: "#f59e0b" }}
                    >
                      refs: {b.refCount}
                    </span>
                  )}
                </motion.div>
              ))}
          </div>
        </div>

        {/* GPU memory grid */}
        <div className="card p-5">
          <h3 className="section-label mb-4" style={{ color: "#10b981" }}>
            GPU Memory
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: totalSlots }, (_, i) => {
              const blk = blocks.find((b) => b.id === i);
              return (
                <motion.div
                  key={i}
                  layout
                  className="h-14 rounded-lg flex flex-col items-center justify-center text-[10px]"
                  style={{
                    background: blk ? ownerColor(blk.owner) + "0c" : "var(--bg-secondary)",
                    border: `1px solid ${blk ? ownerColor(blk.owner) + "30" : "var(--border)"}`,
                  }}
                >
                  {blk ? (
                    <>
                      <span className="font-mono font-bold" style={{ color: ownerColor(blk.owner) }}>
                        {blk.type}
                      </span>
                      <span style={{ color: "var(--text-muted)" }}>
                        {blk.owner === "shared_AB" ? "A+B" : blk.owner.split("_")[1]}
                      </span>
                    </>
                  ) : (
                    <span style={{ color: "var(--text-muted)" }}>free</span>
                  )}
                </motion.div>
              );
            })}
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4">
            {sequences.map((s) => (
              <div key={s.id} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{s.id}</span>
              </div>
            ))}
            {sharing && (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Shared</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8">
        <StatGrid
          stats={[
            { label: "Used Blocks", value: used, color: "#3b82f6" },
            { label: "Free Blocks", value: totalSlots - used, color: "#10b981" },
            { label: "Saved (Sharing)", value: saved, color: "#f59e0b" },
            { label: "Utilization", value: ((used / totalSlots) * 100).toFixed(0) + "%", color: "var(--accent)" },
          ]}
        />
      </div>

      {/* Explanation */}
      <InfoCard title="Copy-on-Write (CoW)">
        <p>
          When sequences share a KV cache block (same prompt prefix), vLLM tracks it with a
          reference count. As long as nobody modifies the block, all sequences just point at
          the same physical memory. The moment one sequence diverges (for example, it generates a
          different next token), vLLM copies the block first, decrements the original&apos;s ref
          count, and gives the copy to the diverging sequence. Same trick your OS uses for
          fork().
        </p>
      </InfoCard>
    </div>
  );
}
