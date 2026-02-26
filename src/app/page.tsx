"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const features = [
  {
    href: "/architecture",
    icon: "🧠",
    title: "Transformer Architecture",
    description:
      "Explore the multi-layer transformer architecture that powers modern LLMs — attention heads, feed-forward networks, and layer normalization.",
    color: "#7c3aed",
  },
  {
    href: "/paged-attention",
    icon: "📄",
    title: "PagedAttention",
    description:
      "vLLM's core innovation. See how attention computation is broken into pages/blocks, inspired by OS virtual memory, to eliminate KV cache waste.",
    color: "#3b82f6",
  },
  {
    href: "/kv-cache",
    icon: "💾",
    title: "KV Cache Management",
    description:
      "Visualize how key-value tensors are stored in non-contiguous physical blocks, mapped via block tables, and shared across sequences.",
    color: "#10b981",
  },
  {
    href: "/continuous-batching",
    icon: "⚡",
    title: "Continuous Batching",
    description:
      "Watch how vLLM dynamically adds/removes sequences from the running batch every iteration, maximizing GPU utilization.",
    color: "#f59e0b",
  },
  {
    href: "/scheduler",
    icon: "📋",
    title: "Scheduler",
    description:
      "Understand the FCFS scheduler that manages waiting, running, and swapped queues with preemption strategies (recompute vs. swap).",
    color: "#ef4444",
  },
  {
    href: "/tokenizer",
    icon: "🔤",
    title: "Tokenizer",
    description:
      "See how text is broken into subword tokens using BPE, mapped to IDs, and how the vocabulary shapes the model's understanding.",
    color: "#ec4899",
  },
];

const stats = [
  { label: "Throughput Gain", value: "24x", sub: "vs HuggingFace TGI" },
  { label: "Memory Waste", value: "<4%", sub: "with PagedAttention" },
  { label: "KV Cache Sharing", value: "55%", sub: "reduction with parallel sampling" },
];

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-16"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white font-bold text-xl">
            v
          </div>
          <div>
            <span className="inline-block px-2 py-0.5 text-[10px] font-medium bg-violet-500/20 text-violet-400 rounded-full">
              INTERACTIVE
            </span>
          </div>
        </div>
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-violet-300 bg-clip-text text-transparent">
          vLLM Architecture
          <br />
          Visualizer
        </h1>
        <p className="text-lg text-[var(--muted)] max-w-2xl leading-relaxed">
          An interactive deep-dive into{" "}
          <strong className="text-white">vLLM</strong> — the high-throughput,
          memory-efficient LLM serving engine. Explore PagedAttention, continuous
          batching, KV cache management, and the scheduler that makes it all work.
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="grid grid-cols-3 gap-6 mb-16"
      >
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-6 text-center"
          >
            <div className="text-3xl font-bold text-violet-400 mb-1">{stat.value}</div>
            <div className="text-sm font-medium mb-1">{stat.label}</div>
            <div className="text-xs text-[var(--muted)]">{stat.sub}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature, i) => (
          <Link key={feature.href} href={feature.href}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.08, duration: 0.4 }}
              whileHover={{ y: -4, borderColor: feature.color + "60" }}
              className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-6 cursor-pointer h-full transition-shadow hover:shadow-lg"
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl">{feature.icon}</span>
                <div>
                  <h3
                    className="text-lg font-semibold mb-2"
                    style={{ color: feature.color }}
                  >
                    {feature.title}
                  </h3>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">
                    {feature.description}
                  </p>
                  <span
                    className="inline-block mt-3 text-xs font-medium"
                    style={{ color: feature.color }}
                  >
                    Explore →
                  </span>
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>

      {/* Architecture Diagram Preview */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-16 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-8"
      >
        <h2 className="text-xl font-bold mb-6">High-Level Architecture</h2>
        <div className="relative h-80">
          <svg width="100%" height="100%" viewBox="0 0 800 280">
            <rect x="20" y="110" width="100" height="60" rx="8" fill="#7c3aed20" stroke="#7c3aed" strokeWidth="1.5" />
            <text x="70" y="145" textAnchor="middle" fill="#a78bfa" fontSize="13" fontWeight="600">Client</text>
            <line x1="120" y1="140" x2="170" y2="140" stroke="#333" strokeWidth="1.5" markerEnd="url(#arrow)" />
            <rect x="170" y="100" width="120" height="80" rx="8" fill="#3b82f620" stroke="#3b82f6" strokeWidth="1.5" />
            <text x="230" y="135" textAnchor="middle" fill="#60a5fa" fontSize="12" fontWeight="600">API Server</text>
            <text x="230" y="155" textAnchor="middle" fill="#60a5fa80" fontSize="10">(FastAPI)</text>
            <line x1="290" y1="140" x2="340" y2="140" stroke="#333" strokeWidth="1.5" markerEnd="url(#arrow)" />
            <rect x="340" y="100" width="120" height="80" rx="8" fill="#f59e0b20" stroke="#f59e0b" strokeWidth="1.5" />
            <text x="400" y="135" textAnchor="middle" fill="#fbbf24" fontSize="12" fontWeight="600">Scheduler</text>
            <text x="400" y="155" textAnchor="middle" fill="#fbbf2480" fontSize="10">+ Block Mgr</text>
            <line x1="460" y1="140" x2="510" y2="140" stroke="#333" strokeWidth="1.5" markerEnd="url(#arrow)" />
            <rect x="510" y="80" width="130" height="120" rx="8" fill="#10b98120" stroke="#10b981" strokeWidth="1.5" />
            <text x="575" y="115" textAnchor="middle" fill="#34d399" fontSize="12" fontWeight="600">Worker</text>
            <text x="575" y="135" textAnchor="middle" fill="#34d39980" fontSize="10">Model Runner</text>
            <text x="575" y="155" textAnchor="middle" fill="#34d39980" fontSize="10">+ PagedAttn</text>
            <text x="575" y="175" textAnchor="middle" fill="#34d39980" fontSize="10">+ KV Cache</text>
            <line x1="640" y1="140" x2="690" y2="140" stroke="#333" strokeWidth="1.5" markerEnd="url(#arrow)" />
            <rect x="690" y="110" width="90" height="60" rx="8" fill="#ef444420" stroke="#ef4444" strokeWidth="1.5" />
            <text x="735" y="145" textAnchor="middle" fill="#f87171" fontSize="12" fontWeight="600">GPU(s)</text>
            <defs>
              <marker id="arrow" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto">
                <path d="M0,0 L8,4 L0,8" fill="none" stroke="#555" strokeWidth="1.5" />
              </marker>
            </defs>
          </svg>
        </div>
      </motion.div>
    </div>
  );
}
