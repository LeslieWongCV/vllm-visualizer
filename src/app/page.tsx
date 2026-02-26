"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const features = [
  {
    href: "/architecture",
    title: "Transformer Architecture",
    description:
      "How the multi-layer transformer actually works: attention heads, feed-forward blocks, and why layer norm matters.",
    color: "var(--accent)",
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><line x1="10" y1="6.5" x2="14" y2="6.5" strokeDasharray="2 2"/><line x1="6.5" y1="10" x2="6.5" y2="14" strokeDasharray="2 2"/></svg>
    ),
  },
  {
    href: "/paged-attention",
    title: "PagedAttention",
    description:
      "vLLM's core idea: borrowing virtual memory concepts from operating systems to manage attention KV data without waste.",
    color: "#3b82f6",
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z"/><path d="M14 14h6v6h-6" strokeDasharray="3 2"/><path d="M7 10v4M17 10v4" strokeDasharray="2 2"/></svg>
    ),
  },
  {
    href: "/kv-cache",
    title: "KV Cache Management",
    description:
      "Non-contiguous block storage, block tables, copy-on-write, and prefix sharing. All the tricks that cut memory usage.",
    color: "#10b981",
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="5" rx="1"/><rect x="2" y="10" width="20" height="5" rx="1"/><rect x="2" y="17" width="12" height="5" rx="1"/><circle cx="18" cy="19.5" r="2.5"/></svg>
    ),
  },
  {
    href: "/continuous-batching",
    title: "Continuous Batching",
    description:
      "Why waiting for the slowest sequence in a batch is wasteful, and how iteration-level scheduling fixes it.",
    color: "#f59e0b",
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
    ),
  },
  {
    href: "/scheduler",
    title: "Scheduler & Preemption",
    description:
      "FCFS scheduling with three queues (waiting, running, swapped) and how vLLM decides when to swap or recompute.",
    color: "#ef4444",
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>
    ),
  },
  {
    href: "/tokenizer",
    title: "BPE Tokenizer",
    description:
      "Watch byte-pair encoding in action. See how raw text gets broken into subword tokens the model can actually process.",
    color: "#a855f7",
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>
    ),
  },
  {
    href: "/llama",
    title: "Llama 3.1 8B Deep Dive",
    description:
      "Concrete architecture numbers for Meta's Llama 3.1-8B: GQA heads, RoPE scaling, memory footprint, and how vLLM serves it.",
    color: "#0969da",
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 2v5M7 4l3 4M17 4l-3 4"/><circle cx="12" cy="14" r="5.5"/><path d="M9.5 13h5M10 16h4"/></svg>
    ),
  },
];

const stats = [
  { label: "Throughput vs. HF", value: "24x", color: "var(--accent)" },
  { label: "Memory Waste", value: "<4%", color: "#10b981" },
  { label: "KV Cache Savings", value: "55%", color: "#3b82f6" },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-14"
      >
        {/* Project badges */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <a
            href="https://github.com/ssaketh-ch/vllm-visualizer"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-md overflow-hidden text-xs font-medium leading-none"
            style={{ border: "1px solid var(--border)" }}
          >
            <span className="flex items-center gap-1 px-2 py-1" style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
              ssaketh-ch/vllm-visualizer
            </span>
            <span className="px-2 py-1" style={{ background: "var(--accent-subtle)", color: "var(--accent-text)" }}>
              View on GitHub
            </span>
          </a>
          {/* Branch indicator */}
          <span
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M11.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122V6A2.5 2.5 0 019 8.5H7.5a1 1 0 00-1 1v1.128a2.251 2.251 0 11-1.5 0V5.372a2.25 2.25 0 111.5 0v1.836A2.492 2.492 0 017.5 7H9a1 1 0 001-1v-.628A2.25 2.25 0 019.5 3.25zM4.25 12a.75.75 0 100 1.5.75.75 0 000-1.5zM3.5 3.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0z"/></svg>
            main
          </span>
          {/* Version tag */}
          <span
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M1 7.775V2.75C1 1.784 1.784 1 2.75 1h5.025c.464 0 .91.184 1.238.513l6.25 6.25a1.75 1.75 0 010 2.474l-5.026 5.026a1.75 1.75 0 01-2.474 0l-6.25-6.25A1.75 1.75 0 011 7.775zm1.5 0c0 .066.026.13.073.177l6.25 6.25a.25.25 0 00.354 0l5.025-5.025a.25.25 0 000-.354l-6.25-6.25a.25.25 0 00-.177-.073H2.75a.25.25 0 00-.25.25v5.025zM6 5a1 1 0 100 2 1 1 0 000-2z"/></svg>
            v0.1.0
          </span>
          {/* License */}
          <span
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
          >
            Apache-2.0
          </span>
        </div>

        <span className="badge mb-4">Interactive Explorer</span>

        <h1
          className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 leading-tight"
          style={{ color: "var(--text)" }}
        >
          Understand how{" "}
          <span style={{ color: "var(--accent)" }}>vLLM</span>{" "}
          actually works.
        </h1>

        <p
          className="text-base leading-relaxed max-w-xl"
          style={{ color: "var(--text-secondary)" }}
        >
          A hands-on guide to the internals of vLLM, the serving engine
          powering some of the fastest LLM deployments. Click through each
          module to see PagedAttention, continuous batching, and the
          scheduler in action.
        </p>
      </motion.section>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-3 gap-4 mb-14"
      >
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + i * 0.07 }}
            className="stat-card"
          >
            <div className="stat-value" style={{ color: s.color }}>
              {s.value}
            </div>
            <div className="stat-label">{s.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-14">
        {features.map((f, i) => (
          <Link key={f.href} href={f.href} className="group">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.06 }}
              className="card p-5 h-full flex gap-4 items-start group-hover:border-[color:var(--accent)] transition-all group-hover:-translate-y-0.5 group-hover:shadow-md"
            >
              <div
                className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center mt-0.5"
                style={{
                  color: f.color,
                  background: f.color + "14",
                }}
              >
                {f.icon}
              </div>
              <div className="min-w-0">
                <h3
                  className="text-base font-semibold mb-1"
                  style={{ color: "var(--text)" }}
                >
                  {f.title}
                </h3>
                <p
                  className="text-sm leading-relaxed mb-2"
                  style={{ color: "var(--text-muted)" }}
                >
                  {f.description}
                </p>
                <span
                  className="text-xs font-medium transition-all group-hover:font-semibold"
                  style={{ color: f.color, opacity: 0.55 }}
                >
                  Explore →
                </span>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>

      {/* Architecture overview diagram */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="card p-8"
      >
        <h2
          className="text-xl font-semibold mb-1"
          style={{ color: "var(--text)" }}
        >
          How vLLM fits together
        </h2>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          Request flow from client to GPU. Each box corresponds to a section in the sidebar.
        </p>

        <div className="overflow-x-auto">
          <svg width="760" height="110" viewBox="0 0 760 110" className="mx-auto block">
            {[
              { x: 0,   label: "Client",    sub: "HTTP / gRPC",   color: "#0969da" },
              { x: 152, label: "API Server", sub: "FastAPI",       color: "#3b82f6" },
              { x: 304, label: "Scheduler",  sub: "Block Mgr",    color: "#f59e0b" },
              { x: 456, label: "Worker",     sub: "Model Runner", color: "#10b981" },
              { x: 608, label: "GPU(s)",     sub: "CUDA kernels", color: "#ef4444" },
            ].map((n, i) => (
              <g key={i}>
                <rect x={n.x} y="18" width="132" height="72" rx="10"
                  fill={n.color + "12"} stroke={n.color} strokeWidth="1.3" />
                <text x={n.x + 66} y="52" textAnchor="middle" fill={n.color}
                  fontSize="13" fontWeight="600" fontFamily="var(--font-inter), sans-serif">
                  {n.label}
                </text>
                <text x={n.x + 66} y="70" textAnchor="middle" fill="var(--text-muted)"
                  fontSize="10" fontFamily="var(--font-inter), sans-serif">
                  {n.sub}
                </text>
                {i < 4 && (
                  <line x1={n.x + 136} y1="54" x2={n.x + 148} y2="54"
                    stroke="var(--svg-arrow)" strokeWidth="1.3" markerEnd="url(#arrowHome)" />
                )}
              </g>
            ))}
            <defs>
              <marker id="arrowHome" markerWidth="7" markerHeight="7" refX="7" refY="3.5" orient="auto">
                <path d="M0,0 L7,3.5 L0,7" fill="none" stroke="var(--svg-arrow)" strokeWidth="1.2" />
              </marker>
            </defs>
          </svg>
        </div>
      </motion.section>
    </div>
  );
}
