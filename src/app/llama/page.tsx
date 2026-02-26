"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { SectionHeader, StatGrid, InfoCard } from "@/components/ui";

/* ── Llama 3.1 8B exact specs ── */
const SPECS = {
  params: "8.03B",
  layers: 32,
  dModel: 4096,
  dFFN: 14336,
  nHeads: 32,
  nKVHeads: 8,
  headDim: 128,
  vocab: 128256,
  maxCtx: 131072,
  ropeBase: 500000,
  ropeScalingFactor: 8,
  normEps: 1e-5,
  activationFn: "SiLU (SwiGLU)",
  dtype: "BF16",
};

const GQA_RATIO = SPECS.nHeads / SPECS.nKVHeads; // 4

/* ── Memory calculations ── */
const bytesPerParam = 2; // BF16
const modelWeightGB = (8.03e9 * bytesPerParam) / 1e9;
const kvPerToken =
  2 * SPECS.nKVHeads * SPECS.headDim * SPECS.layers * bytesPerParam; // bytes per token
const kvPerTokenKB = kvPerToken / 1024;
const kv1kTokensMB = (kvPerToken * 1024) / (1024 * 1024);
const kv128kTokensMB = (kvPerToken * 131072) / (1024 * 1024);

/* ── Layer breakdown for the interactive stack ── */
const layerStack = [
  {
    id: "embed",
    label: "Token Embedding",
    color: "#0969da",
    params: "0.53B",
    shape: `(${SPECS.vocab.toLocaleString()}, ${SPECS.dModel})`,
    detail:
      `Lookup table that maps each of the ${SPECS.vocab.toLocaleString()} token IDs to a ${SPECS.dModel}-dimensional vector. At BF16, this table alone takes ~1 GB of VRAM. Unlike GPT-style models, Llama 3.1 uses a shared embedding (the same weight matrix is reused for the output projection (lm_head)) which saves parameters.`,
  },
  {
    id: "rmsnorm_in",
    label: "RMSNorm (pre-attention)",
    color: "#8b949e",
    params: `${SPECS.dModel} weights`,
    shape: `(${SPECS.dModel},)`,
    detail:
      `Root Mean Square Layer Normalization. Unlike standard LayerNorm it skips mean-centering: RMSNorm(x) = x / RMS(x) · γ, with ε = ${SPECS.normEps}. This simplification makes it ~10–15% faster than LayerNorm while maintaining training stability. Applied before attention (pre-norm architecture), not after.`,
  },
  {
    id: "attention",
    label: "Grouped Query Attention (GQA)",
    color: "#0969da",
    params: "~67M per layer",
    shape: `Q: (${SPECS.dModel}, ${SPECS.nHeads}×${SPECS.headDim}) | K,V: (${SPECS.dModel}, ${SPECS.nKVHeads}×${SPECS.headDim})`,
    detail:
      `This is the key architectural difference from standard multi-head attention. Llama 3.1-8B uses ${SPECS.nHeads} query heads but only ${SPECS.nKVHeads} key-value heads, a ${GQA_RATIO}:1 ratio. Each KV head is shared across ${GQA_RATIO} query heads. This cuts KV cache memory by ${GQA_RATIO}× compared to full MHA without meaningful quality loss. The attention computation is: Attn(Q,K,V) = softmax(QKᵀ / √${SPECS.headDim}) · V. With GQA, vLLM can serve ${GQA_RATIO}× more concurrent requests in the same VRAM budget.`,
  },
  {
    id: "rope",
    label: "RoPE (Rotary Position Embedding)",
    color: "#e5622a",
    params: "0 (computed, not learned)",
    shape: `sin/cos: (seq_len, ${SPECS.headDim})`,
    detail:
      `RoPE encodes position by rotating pairs of dimensions in the Q and K vectors by angles that depend on position. Base frequency θ = ${SPECS.ropeBase.toLocaleString()}. Llama 3.1 uses an extended RoPE with a scaling factor of ${SPECS.ropeScalingFactor}×, which is how it pushes the context window from 8K to ${(SPECS.maxCtx / 1024)}K tokens. The rotation makes attention scores naturally decay with distance, giving the model a soft notion of locality without any learned position embedding.`,
  },
  {
    id: "rmsnorm_post",
    label: "RMSNorm (post-attention)",
    color: "#8b949e",
    params: `${SPECS.dModel} weights`,
    shape: `(${SPECS.dModel},)`,
    detail:
      `Second RMSNorm applied after the residual connection from attention output. Normalizes before the feed-forward network. Same formula as the pre-attention norm.`,
  },
  {
    id: "ffn",
    label: "SwiGLU Feed-Forward Network",
    color: "#1a7f37",
    params: "~176M per layer",
    shape: `gate: (${SPECS.dModel}, ${SPECS.dFFN}) | up: (${SPECS.dModel}, ${SPECS.dFFN}) | down: (${SPECS.dFFN}, ${SPECS.dModel})`,
    detail:
      `The FFN uses SwiGLU gating: FFN(x) = W_down · (SiLU(W_gate · x) ⊙ W_up · x). This requires three weight matrices instead of two, but the gating mechanism consistently outperforms standard ReLU or GELU MLPs. The intermediate dimension is ${SPECS.dFFN.toLocaleString()}, which is ${(SPECS.dFFN / SPECS.dModel).toFixed(1)}× the model dimension. Each FFN layer has ${(3 * SPECS.dModel * SPECS.dFFN * bytesPerParam / 1e9).toFixed(2)} GB of weights at BF16. The FFN is where most of the model's "knowledge" is believed to be stored.`,
  },
  {
    id: "lm_head",
    label: "Output Head (lm_head)",
    color: "#cf222e",
    params: "Shared with embedding",
    shape: `(${SPECS.dModel}, ${SPECS.vocab.toLocaleString()})`,
    detail:
      `Linear projection from the final hidden state back to vocabulary logits. Weight-tied with the token embedding (same matrix, transposed). A softmax converts logits to a probability distribution over ${SPECS.vocab.toLocaleString()} tokens. vLLM can fuse this with the sampling kernel to avoid writing the full logit tensor back to HBM.`,
  },
];

/* ── vLLM serving estimates ── */
const servingRows = [
  { gpu: "A100 80GB", modelMem: "~16 GB", kvBudget: "~60 GB", maxConcurrentReqs: "~90 (4K ctx)", note: "Production workhorse" },
  { gpu: "A10G 24GB", modelMem: "~16 GB", kvBudget: "~6 GB", maxConcurrentReqs: "~8 (4K ctx)", note: "AWS g5 instances" },
  { gpu: "H100 80GB", modelMem: "~16 GB", kvBudget: "~60 GB", maxConcurrentReqs: "~90 (4K ctx)", note: "2× A100 bandwidth" },
  { gpu: "L4 24GB", modelMem: "~16 GB", kvBudget: "~6 GB", maxConcurrentReqs: "~8 (4K ctx)", note: "Budget inference" },
];

export default function LlamaPage() {
  const [expandedLayer, setExpandedLayer] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<"arch" | "memory" | "serving">("arch");

  return (
    <div>
      <SectionHeader
        badge="Model Deep Dive"
        title="Llama 3.1: 8B Parameters"
        subtitle="A concrete walkthrough of Meta's Llama 3.1-8B architecture: every dimension, every weight matrix, and exactly how much memory each piece consumes when served with vLLM."
      />

      {/* Top-level stats */}
      <div className="mb-10">
        <StatGrid
          stats={[
            { label: "Parameters", value: SPECS.params },
            { label: "Layers", value: SPECS.layers },
            { label: "Context", value: "128K" },
            { label: "GQA Ratio", value: `${GQA_RATIO}:1` },
            { label: "Model Size (BF16)", value: `${modelWeightGB.toFixed(1)} GB` },
          ]}
        />
      </div>

      {/* Tab navigation */}
      <div className="flex items-center gap-1 mb-8">
        <div
          className="inline-flex rounded-lg overflow-hidden"
          style={{ border: "1px solid var(--border)" }}
        >
          {([
            { key: "arch" as const, label: "Architecture" },
            { key: "memory" as const, label: "Memory Budget" },
            { key: "serving" as const, label: "vLLM Serving" },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key)}
              className="px-4 py-2 text-sm font-medium transition-colors"
              style={{
                background: selectedTab === tab.key ? "var(--accent)" : "transparent",
                color: selectedTab === tab.key ? "#fff" : "var(--text-secondary)",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Architecture Tab ─── */}
      {selectedTab === "arch" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Config table */}
          <div className="card p-6 mb-8">
            <h3 className="section-label" style={{ color: "var(--accent-text)" }}>
              Model Configuration
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                ["Hidden Dim", SPECS.dModel.toLocaleString()],
                ["FFN Dim", SPECS.dFFN.toLocaleString()],
                ["Query Heads", SPECS.nHeads],
                ["KV Heads", SPECS.nKVHeads],
                ["Head Dim", SPECS.headDim],
                ["Vocab Size", SPECS.vocab.toLocaleString()],
                ["RoPE Base θ", SPECS.ropeBase.toLocaleString()],
                ["Activation", SPECS.activationFn],
              ].map(([label, val]) => (
                <div key={String(label)} className="py-2">
                  <div className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                    {label}
                  </div>
                  <div className="text-base font-semibold font-mono" style={{ color: "var(--text)" }}>
                    {val}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive layer stack */}
          <div className="card p-6 mb-8">
            <h3 className="section-label" style={{ color: "var(--accent-text)" }}>
              Layer-by-Layer Stack (click to expand)
            </h3>

            {/* Input chip */}
            <div className="flex justify-center mb-3">
              <div
                className="px-4 py-1.5 rounded-full text-sm font-medium"
                style={{ background: "var(--accent-subtle)", color: "var(--accent-text)", border: "1px solid var(--accent)" }}
              >
                Input Token IDs
              </div>
            </div>
            <div className="flex justify-center mb-2">
              <div className="w-px h-5" style={{ background: "var(--border)" }} />
            </div>

            {/* 32× block */}
            <div
              className="rounded-xl p-4 mb-2 relative"
              style={{ border: "1.5px dashed var(--border)" }}
            >
              <span
                className="absolute -top-2.5 left-4 px-2 text-sm font-medium"
                style={{ color: "var(--text-muted)", background: "var(--bg)" }}
              >
                × {SPECS.layers} transformer blocks
              </span>

              {layerStack.filter((l) => !["embed", "lm_head"].includes(l.id)).map((layer, i) => {
                const isOpen = expandedLayer === layer.id;
                return (
                  <motion.button
                    key={layer.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setExpandedLayer(isOpen ? null : layer.id)}
                    className={`w-full text-left mb-2 last:mb-0 rounded-lg p-4 transition-all ${isOpen ? "ring-1" : ""}`}
                    style={{
                      background: layer.color + "0a",
                      border: `1px solid ${layer.color}${isOpen ? "50" : "18"}`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold" style={{ color: layer.color }}>
                          {layer.label}
                        </span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}>
                          {layer.params}
                        </span>
                      </div>
                      <motion.span animate={{ rotate: isOpen ? 90 : 0 }} className="text-xs" style={{ color: "var(--text-muted)" }}>
                        ▶
                      </motion.span>
                    </div>

                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        className="mt-3 pt-3 space-y-2"
                        style={{ borderTop: `1px solid ${layer.color}18` }}
                      >
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-medium" style={{ color: "var(--text-muted)" }}>Shape:</span>
                          <code className="font-mono px-2 py-0.5 rounded text-xs" style={{ background: "var(--code-bg)", color: "var(--text-secondary)" }}>
                            {layer.shape}
                          </code>
                        </div>
                        <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                          {layer.detail}
                        </p>
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            <div className="flex justify-center my-2">
              <div className="w-px h-5" style={{ background: "var(--border)" }} />
            </div>

            {/* Output chip */}
            <div className="flex justify-center">
              <div
                className="px-4 py-1.5 rounded-full text-sm font-medium"
                style={{ background: "#cf222e14", color: "#cf222e", border: "1px solid #cf222e30" }}
              >
                lm_head → Softmax → Next Token
              </div>
            </div>
          </div>

          {/* GQA diagram */}
          <div className="card p-6">
            <h3 className="section-label" style={{ color: "var(--accent-text)" }}>
              Grouped Query Attention: 4:1 Sharing
            </h3>
            <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
              Each KV head serves {GQA_RATIO} query heads. This diagram shows one attention block with all {SPECS.nHeads} Q heads grouped under {SPECS.nKVHeads} KV heads.
            </p>
            <div className="overflow-x-auto">
              <svg width="700" height="200" viewBox="0 0 700 200" className="mx-auto block">
                {/* KV head groups */}
                {Array.from({ length: SPECS.nKVHeads }, (_, kvIdx) => {
                  const groupX = kvIdx * 85 + 10;
                  return (
                    <g key={kvIdx}>
                      {/* KV head box */}
                      <rect x={groupX} y="10" width="75" height="35" rx="8" fill="#0969da12" stroke="#0969da" strokeWidth="1" />
                      <text x={groupX + 37} y="32" textAnchor="middle" fill="#0969da" fontSize="11" fontWeight="600">
                        KV {kvIdx}
                      </text>
                      {/* Q heads under it */}
                      {Array.from({ length: GQA_RATIO }, (_, qOff) => {
                        const qIdx = kvIdx * GQA_RATIO + qOff;
                        const qX = groupX + qOff * 18 + 2;
                        return (
                          <g key={qIdx}>
                            <line x1={groupX + 37} y1="45" x2={qX + 8} y2="70" stroke="var(--svg-arrow)" strokeWidth="0.8" />
                            <rect x={qX} y="70" width="16" height="22" rx="4" fill="#1a7f3712" stroke="#1a7f37" strokeWidth="0.8" />
                            <text x={qX + 8} y="84" textAnchor="middle" fill="#1a7f37" fontSize="7" fontWeight="500">
                              Q{qIdx}
                            </text>
                          </g>
                        );
                      })}
                      {/* Group bracket label */}
                      <text x={groupX + 37} y="110" textAnchor="middle" fill="var(--text-muted)" fontSize="8">
                        Group {kvIdx}
                      </text>
                    </g>
                  );
                })}

                {/* Legend */}
                <rect x="10" y="140" width="14" height="14" rx="3" fill="#0969da12" stroke="#0969da" strokeWidth="0.8" />
                <text x="30" y="152" fill="var(--text-secondary)" fontSize="11">KV Head ({SPECS.nKVHeads} total)</text>

                <rect x="200" y="140" width="14" height="14" rx="3" fill="#1a7f3712" stroke="#1a7f37" strokeWidth="0.8" />
                <text x="220" y="152" fill="var(--text-secondary)" fontSize="11">Query Head ({SPECS.nHeads} total)</text>

                <text x="430" y="152" fill="var(--text-muted)" fontSize="11">
                  → {GQA_RATIO} Q heads share 1 KV head = {GQA_RATIO}× less KV cache
                </text>
              </svg>
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── Memory Budget Tab ─── */}
      {selectedTab === "memory" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Memory breakdown bar */}
          <div className="card p-6 mb-8">
            <h3 className="section-label" style={{ color: "var(--accent-text)" }}>
              A100 80GB VRAM Breakdown
            </h3>
            <div className="mb-5">
              <div className="flex rounded-lg overflow-hidden h-10 w-full" style={{ border: "1px solid var(--border)" }}>
                <div className="h-full flex items-center justify-center text-xs font-medium text-white" style={{ width: "20%", background: "#0969da" }}>
                  Weights 16GB
                </div>
                <div className="h-full flex items-center justify-center text-xs font-medium text-white" style={{ width: "5%", background: "#cf222e" }}>
                  OS
                </div>
                <div className="h-full flex items-center justify-center text-xs font-medium text-white" style={{ width: "70%", background: "#1a7f37" }}>
                  KV Cache ~58GB
                </div>
                <div className="h-full flex items-center justify-center text-xs font-medium" style={{ width: "5%", background: "var(--bg-secondary)", color: "var(--text-muted)" }}>
                  Free
                </div>
              </div>
              <div className="flex justify-between text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                <span>0 GB</span>
                <span>80 GB</span>
              </div>
            </div>

            {/* Detailed KV math */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--text)" }}>KV Cache per Token</h4>
                <div className="font-mono text-sm space-y-1" style={{ color: "var(--text-secondary)" }}>
                  <p>2 (K + V)</p>
                  <p>× {SPECS.nKVHeads} KV heads</p>
                  <p>× {SPECS.headDim} head dim</p>
                  <p>× {SPECS.layers} layers</p>
                  <p>× 2 bytes (BF16)</p>
                  <div className="pt-2 mt-2 font-semibold text-base" style={{ borderTop: "1px solid var(--border)", color: "var(--accent-text)" }}>
                    = {kvPerToken.toLocaleString()} bytes ({kvPerTokenKB.toFixed(1)} KB) / token
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--text)" }}>Scaling KV Cache</h4>
                <div className="space-y-3">
                  {[
                    { tokens: 1024, label: "1K tokens" },
                    { tokens: 4096, label: "4K tokens" },
                    { tokens: 32768, label: "32K tokens" },
                    { tokens: 131072, label: "128K tokens" },
                  ].map((row) => {
                    const mb = (kvPerToken * row.tokens) / (1024 * 1024);
                    return (
                      <div key={row.label} className="flex items-center justify-between text-sm">
                        <span style={{ color: "var(--text-secondary)" }}>{row.label}</span>
                        <span className="font-mono font-medium" style={{ color: "var(--accent-text)" }}>
                          {mb < 1024 ? `${mb.toFixed(0)} MB` : `${(mb / 1024).toFixed(1)} GB`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Why GQA saves memory */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <InfoCard title="GQA vs. Full MHA Memory">
              <p><strong>Full MHA</strong> would use 32 KV heads × 128 dim × 32 layers × 2 (K+V) × 2 bytes = <strong>1 MB per token</strong>.</p>
              <p><strong>GQA (8 KV heads)</strong> uses {kvPerTokenKB.toFixed(0)} KB per token, a <strong>{GQA_RATIO}× reduction</strong>.</p>
              <p>For a batch of 64 requests at 4K context, that saves ~{((1024 - kvPerTokenKB) * 4096 * 64 / (1024 * 1024)).toFixed(0)} GB of VRAM, the difference between fitting on one GPU or needing two.</p>
            </InfoCard>
            <InfoCard title="vLLM Block Allocation">
              <p>vLLM allocates KV cache in <strong>blocks of 16 tokens</strong> by default. Each block for Llama 3.1-8B is {(kvPerToken * 16 / 1024).toFixed(0)} KB.</p>
              <p>On an A100, vLLM pre-allocates ~{Math.floor(58 * 1024 * 1024 / (kvPerToken * 16)).toLocaleString()} blocks. Each new request gets blocks on demand with no pre-allocation waste.</p>
              <p>When a request finishes, its blocks are immediately returned to the free pool.</p>
            </InfoCard>
          </div>

          <div className="card p-6">
            <h3 className="section-label" style={{ color: "var(--accent-text)" }}>
              Quantization Impact
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>
                    <th className="text-left py-2 pr-4 font-medium">Format</th>
                    <th className="text-left py-2 pr-4 font-medium">Model Size</th>
                    <th className="text-left py-2 pr-4 font-medium">KV per Token</th>
                    <th className="text-left py-2 font-medium">Max Batch (A100)</th>
                  </tr>
                </thead>
                <tbody style={{ color: "var(--text-secondary)" }}>
                  {[
                    ["BF16", "16.1 GB", `${kvPerTokenKB.toFixed(0)} KB`, "~90 @ 4K"],
                    ["INT8 (W8A8)", "8.0 GB", `${(kvPerTokenKB / 2).toFixed(0)} KB`, "~200 @ 4K"],
                    ["GPTQ-4bit", "4.5 GB", `${kvPerTokenKB.toFixed(0)} KB*`, "~130 @ 4K"],
                    ["AWQ-4bit", "4.3 GB", `${kvPerTokenKB.toFixed(0)} KB*`, "~135 @ 4K"],
                    ["FP8 (H100)", "8.0 GB", `${(kvPerTokenKB / 2).toFixed(0)} KB`, "~210 @ 4K"],
                  ].map(([fmt, sz, kv, batch]) => (
                    <tr key={String(fmt)} style={{ borderTop: "1px solid var(--border)" }}>
                      <td className="py-2 pr-4 font-mono font-medium" style={{ color: "var(--text)" }}>{fmt}</td>
                      <td className="py-2 pr-4">{sz}</td>
                      <td className="py-2 pr-4">{kv}</td>
                      <td className="py-2">{batch}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
                *GPTQ/AWQ quantize weights only. KV cache stays BF16 unless you use FP8 KV cache quantization.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── vLLM Serving Tab ─── */}
      {selectedTab === "serving" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Serving command */}
          <div className="card p-6 mb-8">
            <h3 className="section-label" style={{ color: "var(--accent-text)" }}>
              Quick Start
            </h3>
            <div className="rounded-lg p-4 font-mono text-sm overflow-x-auto" style={{ background: "var(--code-bg)", border: "1px solid var(--border)", color: "var(--text)" }}>
              <div style={{ color: "var(--text-muted)" }}># Install vLLM</div>
              <div>pip install vllm</div>
              <br />
              <div style={{ color: "var(--text-muted)" }}># Serve Llama 3.1-8B with default settings</div>
              <div>vllm serve meta-llama/Llama-3.1-8B-Instruct \</div>
              <div>&nbsp;&nbsp;--dtype bfloat16 \</div>
              <div>&nbsp;&nbsp;--max-model-len 8192 \</div>
              <div>&nbsp;&nbsp;--gpu-memory-utilization 0.9</div>
              <br />
              <div style={{ color: "var(--text-muted)" }}># With quantization for smaller GPUs</div>
              <div>vllm serve meta-llama/Llama-3.1-8B-Instruct \</div>
              <div>&nbsp;&nbsp;--quantization awq \</div>
              <div>&nbsp;&nbsp;--dtype float16 \</div>
              <div>&nbsp;&nbsp;--max-model-len 4096</div>
            </div>
          </div>

          {/* GPU compatibility table */}
          <div className="card p-6 mb-8">
            <h3 className="section-label" style={{ color: "var(--accent-text)" }}>
              GPU Compatibility & Throughput
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>
                    <th className="text-left py-2 pr-4 font-medium">GPU</th>
                    <th className="text-left py-2 pr-4 font-medium">Model Weights</th>
                    <th className="text-left py-2 pr-4 font-medium">KV Budget</th>
                    <th className="text-left py-2 pr-4 font-medium">Concurrent Reqs</th>
                    <th className="text-left py-2 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody style={{ color: "var(--text-secondary)" }}>
                  {servingRows.map((row) => (
                    <tr key={row.gpu} style={{ borderTop: "1px solid var(--border)" }}>
                      <td className="py-2 pr-4 font-medium" style={{ color: "var(--text)" }}>{row.gpu}</td>
                      <td className="py-2 pr-4">{row.modelMem}</td>
                      <td className="py-2 pr-4">{row.kvBudget}</td>
                      <td className="py-2 pr-4 font-mono">{row.maxConcurrentReqs}</td>
                      <td className="py-2 text-xs" style={{ color: "var(--text-muted)" }}>{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Key vLLM optimizations for Llama */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard title="PagedAttention + GQA Synergy">
              <p>vLLM&apos;s block manager allocates KV cache in fixed-size blocks. With GQA&apos;s 4× smaller KV tensors, each block holds more useful context, giving you 4× more blocks from the same VRAM.</p>
              <p>Combined with PagedAttention&apos;s near-zero waste (&lt;4%), this lets vLLM pack significantly more concurrent Llama 3.1 requests than a naive implementation.</p>
            </InfoCard>
            <InfoCard title="Prefix Caching for Llama">
              <p>Llama 3.1 uses a structured chat template with a system prompt. vLLM detects shared prefixes across requests and reuses their KV blocks with no recomputation needed.</p>
              <p>For chatbots with a fixed system prompt, this can save 1–2 GB of KV cache across all active requests.</p>
            </InfoCard>
            <InfoCard title="Tensor Parallelism">
              <p>For lower latency, vLLM can split Llama 3.1-8B across 2 GPUs with tensor parallelism. Each GPU holds half of every weight matrix.</p>
              <p>This halves the memory per GPU and roughly doubles decode throughput at the cost of inter-GPU communication (NVLink preferred).</p>
            </InfoCard>
            <InfoCard title="Speculative Decoding">
              <p>vLLM supports speculative decoding with a smaller draft model. For Llama 3.1-8B, a 1B draft model can propose 5 tokens at once, which the 8B model verifies in a single forward pass.</p>
              <p>This can improve decode latency by 1.5–2× for latency-sensitive applications.</p>
            </InfoCard>
          </div>
        </motion.div>
      )}
    </div>
  );
}
