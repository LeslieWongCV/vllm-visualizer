"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { SectionHeader } from "@/components/ui";

const layers = [
  {
    id: "embedding",
    label: "Token Embedding",
    sublabel: "+ Positional Encoding (RoPE)",
    color: "#ec4899",
    detail:
      "Converts token IDs into dense vectors. RoPE (Rotary Position Embedding) encodes positional information directly into the attention computation, enabling better generalization to longer sequences.",
  },
  {
    id: "attention",
    label: "Multi-Head Self-Attention",
    sublabel: "Q, K, V projections → Scaled Dot-Product",
    color: "#7c3aed",
    detail:
      "Each head projects input into Query, Key, Value matrices. Attention = softmax(QK^T / √d_k) · V. Multiple heads allow the model to attend to different relationship types simultaneously. vLLM uses PagedAttention here.",
  },
  {
    id: "add_norm_1",
    label: "Add & LayerNorm",
    sublabel: "Residual connection + RMSNorm",
    color: "#6b7280",
    detail:
      "Residual connections (x + sublayer(x)) prevent vanishing gradients. RMSNorm (used in LLaMA) normalizes by root-mean-square, simpler than LayerNorm.",
  },
  {
    id: "ffn",
    label: "Feed-Forward Network",
    sublabel: "SwiGLU activation (LLaMA) or GELU",
    color: "#3b82f6",
    detail:
      "Two linear transformations with a non-linearity: FFN(x) = W₂ · SwiGLU(W₁x, W₃x). The hidden dimension is typically 4x the model dimension. This is where most parameters live.",
  },
  {
    id: "add_norm_2",
    label: "Add & LayerNorm",
    sublabel: "Residual connection + RMSNorm",
    color: "#6b7280",
    detail: "Another residual connection preserving gradient flow.",
  },
];

const modelSizes = [
  { name: "7B", layers: 32, heads: 32, dim: 4096, ffn: 11008 },
  { name: "13B", layers: 40, heads: 40, dim: 5120, ffn: 13824 },
  { name: "70B", layers: 80, heads: 64, dim: 8192, ffn: 28672 },
];

export default function ArchitecturePage() {
  const [activeLayer, setActiveLayer] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState(0);
  const model = modelSizes[selectedModel];

  return (
    <div className="max-w-5xl mx-auto">
      <SectionHeader
        title="Transformer Architecture"
        subtitle="The backbone of every LLM. Each transformer block repeats N times to create the full model."
        badge="ARCHITECTURE"
      />

      {/* Model Size Selector */}
      <div className="flex gap-3 mb-8">
        {modelSizes.map((m, i) => (
          <button
            key={m.name}
            onClick={() => setSelectedModel(i)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedModel === i
                ? "bg-violet-500/20 text-violet-400 border border-violet-500/40"
                : "bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--muted)] hover:text-white"
            }`}
          >
            LLaMA {m.name}
          </button>
        ))}
      </div>

      {/* Model Stats */}
      <motion.div
        layout
        className="grid grid-cols-4 gap-4 mb-10"
      >
        {[
          { label: "Layers", value: model.layers },
          { label: "Attention Heads", value: model.heads },
          { label: "Hidden Dim", value: model.dim.toLocaleString() },
          { label: "FFN Dim", value: model.ffn.toLocaleString() },
        ].map((s) => (
          <motion.div
            key={s.label}
            layout
            className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-4 text-center"
          >
            <div className="text-xl font-bold text-violet-400">{s.value}</div>
            <div className="text-xs text-[var(--muted)]">{s.label}</div>
          </motion.div>
        ))}
      </motion.div>

      <div className="flex gap-8">
        {/* Transformer Stack */}
        <div className="flex-1">
          <div className="relative">
            {/* Input */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center mb-4"
            >
              <div className="inline-block px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
                Input Tokens
              </div>
            </motion.div>

            {/* Arrow down */}
            <div className="flex justify-center mb-2">
              <div className="w-px h-6 bg-[var(--card-border)]" />
            </div>

            {/* Transformer Block */}
            <div className="border border-dashed border-[var(--card-border)] rounded-xl p-4 relative">
              <div className="absolute -top-3 left-4 px-2 bg-[var(--background)] text-xs text-[var(--muted)]">
                × {model.layers} Transformer Blocks
              </div>

              {layers.map((layer, i) => (
                <motion.div
                  key={layer.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onMouseEnter={() => setActiveLayer(layer.id)}
                  onMouseLeave={() => setActiveLayer(null)}
                  className={`mb-3 last:mb-0 rounded-lg border p-4 cursor-pointer transition-all ${
                    activeLayer === layer.id
                      ? "border-opacity-60 scale-[1.02]"
                      : "border-opacity-20"
                  }`}
                  style={{
                    backgroundColor: layer.color + "08",
                    borderColor:
                      activeLayer === layer.id
                        ? layer.color + "60"
                        : layer.color + "20",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div
                        className="font-semibold text-sm"
                        style={{ color: layer.color }}
                      >
                        {layer.label}
                      </div>
                      <div className="text-xs text-[var(--muted)] mt-0.5">
                        {layer.sublabel}
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: activeLayer === layer.id ? 90 : 0 }}
                      className="text-[var(--muted)]"
                    >
                      →
                    </motion.div>
                  </div>

                  {activeLayer === layer.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-3 text-xs text-[var(--muted)] leading-relaxed border-t pt-3"
                      style={{ borderColor: layer.color + "20" }}
                    >
                      {layer.detail}
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Arrow down */}
            <div className="flex justify-center my-2">
              <div className="w-px h-6 bg-[var(--card-border)]" />
            </div>

            {/* Output */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center"
            >
              <div className="inline-block px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                Linear → Softmax → Next Token
              </div>
            </motion.div>
          </div>
        </div>

        {/* Attention Detail */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="w-80 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-6"
        >
          <h3 className="text-sm font-semibold mb-4 text-violet-400">
            Multi-Head Attention Detail
          </h3>
          <svg viewBox="0 0 240 300" className="w-full">
            {/* Input */}
            <rect x="80" y="5" width="80" height="25" rx="4" fill="#10b98120" stroke="#10b981" strokeWidth="1" />
            <text x="120" y="22" textAnchor="middle" fill="#34d399" fontSize="9">Input X</text>

            {/* Q K V split */}
            <line x1="100" y1="30" x2="40" y2="60" stroke="#444" strokeWidth="1" />
            <line x1="120" y1="30" x2="120" y2="60" stroke="#444" strokeWidth="1" />
            <line x1="140" y1="30" x2="200" y2="60" stroke="#444" strokeWidth="1" />

            <rect x="10" y="60" width="55" height="25" rx="4" fill="#7c3aed20" stroke="#7c3aed" strokeWidth="1" />
            <text x="37" y="77" textAnchor="middle" fill="#a78bfa" fontSize="9">W_Q</text>

            <rect x="93" y="60" width="55" height="25" rx="4" fill="#3b82f620" stroke="#3b82f6" strokeWidth="1" />
            <text x="120" y="77" textAnchor="middle" fill="#60a5fa" fontSize="9">W_K</text>

            <rect x="175" y="60" width="55" height="25" rx="4" fill="#10b98120" stroke="#10b981" strokeWidth="1" />
            <text x="202" y="77" textAnchor="middle" fill="#34d399" fontSize="9">W_V</text>

            {/* Arrows down */}
            <line x1="37" y1="85" x2="37" y2="110" stroke="#444" strokeWidth="1" />
            <line x1="120" y1="85" x2="120" y2="110" stroke="#444" strokeWidth="1" />
            <line x1="202" y1="85" x2="202" y2="110" stroke="#444" strokeWidth="1" />

            {/* Q K V outputs */}
            <rect x="10" y="110" width="55" height="25" rx="4" fill="#7c3aed10" stroke="#7c3aed80" strokeWidth="1" />
            <text x="37" y="127" textAnchor="middle" fill="#a78bfa" fontSize="9">Q</text>

            <rect x="93" y="110" width="55" height="25" rx="4" fill="#3b82f610" stroke="#3b82f680" strokeWidth="1" />
            <text x="120" y="127" textAnchor="middle" fill="#60a5fa" fontSize="9">K</text>

            <rect x="175" y="110" width="55" height="25" rx="4" fill="#10b98110" stroke="#10b98180" strokeWidth="1" />
            <text x="202" y="127" textAnchor="middle" fill="#34d399" fontSize="9">V</text>

            {/* QK^T */}
            <line x1="37" y1="135" x2="80" y2="165" stroke="#444" strokeWidth="1" />
            <line x1="120" y1="135" x2="80" y2="165" stroke="#444" strokeWidth="1" />

            <rect x="40" y="165" width="80" height="25" rx="4" fill="#f59e0b20" stroke="#f59e0b" strokeWidth="1" />
            <text x="80" y="182" textAnchor="middle" fill="#fbbf24" fontSize="8">QK^T / √d_k</text>

            {/* Softmax */}
            <line x1="80" y1="190" x2="80" y2="210" stroke="#444" strokeWidth="1" />
            <rect x="40" y="210" width="80" height="25" rx="4" fill="#ef444420" stroke="#ef4444" strokeWidth="1" />
            <text x="80" y="227" textAnchor="middle" fill="#f87171" fontSize="9">Softmax</text>

            {/* × V */}
            <line x1="80" y1="235" x2="120" y2="255" stroke="#444" strokeWidth="1" />
            <line x1="202" y1="135" x2="120" y2="255" stroke="#444" strokeWidth="1" strokeDasharray="4" />

            <rect x="80" y="255" width="80" height="25" rx="4" fill="#ec489920" stroke="#ec4899" strokeWidth="1" />
            <text x="120" y="272" textAnchor="middle" fill="#f472b6" fontSize="9">Attention Out</text>
          </svg>
        </motion.div>
      </div>
    </div>
  );
}
