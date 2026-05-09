"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { SectionHeader, PlaybackControls, InfoCard, StatGrid } from "@/components/ui";
import { useSpeed } from "@/components/SpeedProvider";

const PROMPT_TOKENS = ["User", ":", "Explain", "how", "black", "holes", "form", "in", "space"];
const OUTPUT_TOKENS = ["Black", "holes", "form", "when", "massive", "stars", "collapse"];

type Phase = "idle" | "prefill" | "transfer" | "decode" | "done";

function getPhase(step: number): Phase {
  if (step === 0) return "idle";
  if (step <= 3) return "prefill";
  if (step === 4) return "transfer";
  if (step <= 4 + OUTPUT_TOKENS.length) return "decode";
  return "done";
}

export default function PDDisaggregationPage() {
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const { interval } = useSpeed();
  const maxStep = 4 + OUTPUT_TOKENS.length + 1;

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setStep((s) => {
        if (s >= maxStep) { setIsPlaying(false); return s; }
        return s + 1;
      });
    }, interval(800));
    return () => clearInterval(timer);
  }, [isPlaying, maxStep, interval]);

  const phase = getPhase(step);
  const prefillProgress = phase === "prefill"
    ? Math.min(step * 3, PROMPT_TOKENS.length)
    : phase !== "idle" ? PROMPT_TOKENS.length : 0;
  const decodeProgress = phase === "decode"
    ? step - 4
    : phase === "done" ? OUTPUT_TOKENS.length : 0;

  return (
    <div>
      <SectionHeader
        badge="PD Disaggregation"
        title="Prefill-Decode Disaggregation"
        subtitle="Prefill is compute-bound; decode is bandwidth-bound. Routing them to separate GPU pools eliminates the latency interference of co-location."
      />

      <div className="mb-10">
        <StatGrid stats={[
          { label: "Prefill Bottleneck", value: "Compute", color: "#ef4444" },
          { label: "Decode Bottleneck", value: "Bandwidth", color: "#3b82f6" },
          { label: "Intensity Ratio", value: "100×+ diff", color: "#f59e0b" },
          { label: "TTFT Improvement", value: "~2×", color: "#10b981" },
        ]} />
      </div>

      {/* ── Main animation ── */}
      <div className="card p-6 mb-8">
        <h3 className="section-label" style={{ color: "var(--accent-text)" }}>
          Request Flow Visualization
        </h3>

        <PlaybackControls
          isPlaying={isPlaying}
          onPlay={() => { if (step >= maxStep) setStep(0); setIsPlaying(true); }}
          onPause={() => setIsPlaying(false)}
          onReset={() => { setIsPlaying(false); setStep(0); }}
          step={step}
          maxStep={maxStep}
          label="Step"
        />

        {/* Phase pills — clickable, jump to that phase */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {([
            { key: "idle",     label: "Idle",        color: "var(--text-muted)", step: 0 },
            { key: "prefill",  label: "Prefilling",  color: "#ef4444",           step: 1 },
            { key: "transfer", label: "KV Transfer", color: "#f59e0b",           step: 4 },
            { key: "decode",   label: "Decoding",    color: "#3b82f6",           step: 5 },
            { key: "done",     label: "Done",        color: "#10b981",           step: maxStep },
          ] as { key: Phase; label: string; color: string; step: number }[]).map((p) => (
            <button
              key={p.key}
              onClick={() => { setIsPlaying(false); setStep(p.step); }}
              className="px-3 py-1 rounded-full text-xs font-medium transition-all"
              style={{
                background: phase === p.key ? p.color + "20" : "var(--bg-secondary)",
                color: phase === p.key ? p.color : "var(--text-muted)",
                border: `1px solid ${phase === p.key ? p.color + "60" : "var(--border)"}`,
                fontWeight: phase === p.key ? 700 : 400,
                cursor: "pointer",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Three-panel layout */}
        <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 72px 1fr" }}>

          {/* Prefill Pool */}
          <div className="rounded-xl p-5" style={{ background: "#ef444408", border: "1px solid #ef444330" }}>
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <div className="w-2 h-2 rounded-full" style={{ background: "#ef4444" }} />
              <span className="text-sm font-semibold" style={{ color: "#ef4444" }}>Prefill Pool</span>
              <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#ef444418", color: "#ef4444" }}>
                Compute-Bound
              </span>
            </div>

            <div className="flex gap-2 mb-4">
              {[0, 1].map((i) => (
                <div key={i} className="flex-1 rounded-lg p-2" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                  <div className="text-xs font-mono mb-1" style={{ color: "var(--text-muted)" }}>GPU {i}</div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "#ef4444" }}
                      animate={{ width: phase === "prefill" ? "92%" : "6%" }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <div className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {phase === "prefill" ? "92% SM utilization" : "idle"}
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-2 text-xs font-medium" style={{ color: "var(--text-muted)" }}>Prompt tokens</div>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {PROMPT_TOKENS.map((tok, i) => (
                <motion.span
                  key={i}
                  animate={{
                    background: i < prefillProgress ? "#ef444425" : "var(--bg-secondary)",
                    borderColor: i < prefillProgress ? "#ef4444" : "var(--border)",
                    color: i < prefillProgress ? "#ef4444" : "var(--text-muted)",
                  }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                  className="px-2 py-0.5 rounded text-xs font-mono"
                  style={{ border: "1px solid var(--border)" }}
                >
                  {tok}
                </motion.span>
              ))}
            </div>

            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span style={{ color: "var(--text-muted)" }}>KV cache produced</span>
                  <span style={{ color: "#ef4444" }}>{Math.round((prefillProgress / PROMPT_TOKENS.length) * 100)}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                  <motion.div className="h-full rounded-full" style={{ background: "#ef4444" }}
                    animate={{ width: `${(prefillProgress / PROMPT_TOKENS.length) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span style={{ color: "var(--text-muted)" }}>HBM bandwidth usage</span>
                  <span style={{ color: "#ef4444" }}>{phase === "prefill" ? "18%" : "0%"}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                  <motion.div className="h-full rounded-full" style={{ background: "#ef4444" }}
                    animate={{ width: phase === "prefill" ? "18%" : "0%" }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                  Low — compute is the bottleneck
                </div>
              </div>
            </div>
          </div>

          {/* Transfer arrow */}
          <div className="flex flex-col items-center justify-center gap-1 pt-12">
            <div className="text-[10px] text-center" style={{ color: "var(--text-muted)" }}>KV Cache</div>
            <motion.div animate={{ opacity: phase === "transfer" ? 1 : 0.25 }} className="w-full flex flex-col items-center">
              <svg width="72" height="28" viewBox="0 0 72 28">
                <defs>
                  <marker id="arrowPD" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6" fill="none" stroke={phase === "transfer" ? "#f59e0b" : "var(--svg-arrow)"} strokeWidth="1.2" />
                  </marker>
                </defs>
                <line x1="4" y1="14" x2="62" y2="14"
                  stroke={phase === "transfer" ? "#f59e0b" : "var(--svg-arrow)"}
                  strokeWidth="1.5"
                  strokeDasharray={phase === "transfer" ? "none" : "4 3"}
                  markerEnd="url(#arrowPD)"
                />
                {phase === "transfer" && (
                  <motion.circle r="4" cy="14" fill="#f59e0b"
                    animate={{ cx: [6, 60] }}
                    transition={{ duration: 0.7, repeat: Infinity }}
                  />
                )}
              </svg>
              <div className="text-[10px] text-center" style={{ color: phase === "transfer" ? "#f59e0b" : "var(--text-muted)" }}>
                RDMA
              </div>
            </motion.div>
          </div>

          {/* Decode Pool */}
          <div className="rounded-xl p-5" style={{ background: "#3b82f608", border: "1px solid #3b82f630" }}>
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <div className="w-2 h-2 rounded-full" style={{ background: "#3b82f6" }} />
              <span className="text-sm font-semibold" style={{ color: "#3b82f6" }}>Decode Pool</span>
              <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#3b82f618", color: "#3b82f6" }}>
                Memory-Bound
              </span>
            </div>

            <div className="flex gap-2 mb-4">
              {[0, 1].map((i) => (
                <div key={i} className="flex-1 rounded-lg p-2" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                  <div className="text-xs font-mono mb-1" style={{ color: "var(--text-muted)" }}>GPU {i}</div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "#3b82f6" }}
                      animate={{ width: phase === "decode" ? "35%" : "5%" }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <div className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {phase === "decode" ? "35% util (BW-bound)" : "idle"}
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-2 text-xs font-medium" style={{ color: "var(--text-muted)" }}>Generated tokens</div>
            <div className="flex flex-wrap gap-1.5 min-h-[28px] mb-4">
              <AnimatePresence>
                {OUTPUT_TOKENS.slice(0, decodeProgress).map((tok, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="px-2 py-0.5 rounded text-xs font-mono"
                    style={{ background: "#3b82f625", border: "1px solid #3b82f650", color: "#3b82f6" }}
                  >
                    {tok}
                  </motion.span>
                ))}
              </AnimatePresence>
              {decodeProgress > 0 && decodeProgress < OUTPUT_TOKENS.length && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ repeat: Infinity, duration: 0.55 }}
                  className="px-1.5 py-0.5 rounded text-xs font-mono"
                  style={{ background: "#3b82f615", border: "1px solid #3b82f640", color: "#3b82f6" }}
                >
                  ▌
                </motion.span>
              )}
            </div>

            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span style={{ color: "var(--text-muted)" }}>KV cache produced</span>
                  <span style={{ color: "#3b82f6" }}>{phase === "decode" || phase === "done" ? "100%" : "0%"}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                  <motion.div className="h-full rounded-full" style={{ background: "#3b82f6" }}
                    animate={{ width: phase === "decode" || phase === "done" ? "100%" : "0%" }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                  Received via RDMA transfer
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span style={{ color: "var(--text-muted)" }}>HBM bandwidth usage</span>
                  <span style={{ color: "#3b82f6" }}>{phase === "decode" || phase === "done" ? "88%" : "0%"}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                  <motion.div className="h-full rounded-full" style={{ background: "#3b82f6" }}
                    animate={{ width: phase === "decode" || phase === "done" ? "88%" : "0%" }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                  High — bandwidth is the bottleneck
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Co-location problem ── */}
      <div className="card p-6 mb-8">
        <h3 className="section-label" style={{ color: "var(--accent-text)" }}>
          The Problem With Co-location
        </h3>
        <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
          When prefill and decode run on the same GPU, they interfere in two ways:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="rounded-lg p-4" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
            <div className="text-sm font-semibold mb-2" style={{ color: "#f59e0b" }}>Problem 1 — TTFT Inflation</div>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              A new request&apos;s prefill must wait for all in-flight decode iterations to complete before it can start.
              Long decode batches create &ldquo;prefill blocking,&rdquo; ballooning Time-To-First-Token from milliseconds to seconds.
            </p>
          </div>
          <div className="rounded-lg p-4" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
            <div className="text-sm font-semibold mb-2" style={{ color: "#f59e0b" }}>Problem 2 — Utilization Mismatch</div>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              No single GPU configuration can simultaneously be compute-optimal for prefill and bandwidth-optimal for decode.
              You&apos;re always operating below the roofline peak for at least one phase, wasting expensive GPU time.
            </p>
          </div>
        </div>

        {/* Timeline comparison */}
        <div className="rounded-lg p-4 overflow-x-auto" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
          <div className="text-xs font-semibold mb-3" style={{ color: "var(--text-muted)" }}>
            Scheduling timeline: co-located vs disaggregated
          </div>
          <svg width="620" height="112" viewBox="0 0 620 112" className="block min-w-[520px]">
            {/* Co-located */}
            <text x="0" y="14" fontSize="9.5" fill="var(--text-muted)" fontWeight="600">Co-located GPU:</text>
            {[
              { x: 92,  w: 56, label: "Decode", color: "#3b82f6" },
              { x: 150, w: 56, label: "Decode", color: "#3b82f6" },
              { x: 208, w: 56, label: "Decode", color: "#3b82f6" },
              { x: 266, w: 76, label: "Prefill ⚠", color: "#ef4444" },
              { x: 344, w: 56, label: "Decode", color: "#3b82f6" },
            ].map((n, i) => (
              <g key={i}>
                <rect x={n.x} y="3" width={n.w} height="20" rx="4"
                  fill={n.color + "20"} stroke={n.color} strokeWidth="1" />
                <text x={n.x + n.w / 2} y="16" textAnchor="middle" fontSize="8" fill={n.color}>
                  {n.label}
                </text>
              </g>
            ))}
            {/* TTFT span — request arrived at x=92, prefill started at x=266 */}
            <line x1="92" y1="28" x2="266" y2="28" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 2" />
            <line x1="92" y1="25" x2="92" y2="31" stroke="#f59e0b" strokeWidth="1" />
            <line x1="266" y1="25" x2="266" y2="31" stroke="#f59e0b" strokeWidth="1" />
            <text x="179" y="38" textAnchor="middle" fontSize="8" fill="#f59e0b">← TTFT inflated (blocked for 3 decode iters) →</text>

            {/* Disaggregated */}
            <text x="0" y="62" fontSize="9.5" fill="var(--text-muted)" fontWeight="600">Disaggregated:</text>
            <text x="0" y="76" fontSize="8" fill="var(--text-muted)">P-GPU</text>
            {[
              { x: 92,  w: 76, label: "Prefill (immediate)", color: "#ef4444" },
              { x: 172, w: 76, label: "Prefill next req",    color: "#ef4444" },
              { x: 252, w: 76, label: "Prefill next req",    color: "#ef4444" },
            ].map((n, i) => (
              <g key={i}>
                <rect x={n.x} y="64" width={n.w} height="16" rx="4"
                  fill={n.color + "20"} stroke={n.color} strokeWidth="1" />
                <text x={n.x + n.w / 2} y="75" textAnchor="middle" fontSize="7.5" fill={n.color}>
                  {n.label}
                </text>
              </g>
            ))}
            <text x="0" y="92" fontSize="8" fill="var(--text-muted)">D-GPU</text>
            {[
              { x: 92,  w: 48, label: "Decode" },
              { x: 142, w: 48, label: "Decode" },
              { x: 192, w: 48, label: "Decode" },
              { x: 242, w: 48, label: "Decode" },
            ].map((n, i) => (
              <g key={i}>
                <rect x={n.x} y="82" width={n.w} height="16" rx="4"
                  fill="#3b82f620" stroke="#3b82f6" strokeWidth="1" />
                <text x={n.x + n.w / 2} y="93" textAnchor="middle" fontSize="7.5" fill="#3b82f6">
                  {n.label}
                </text>
              </g>
            ))}
            {/* TTFT span disaggregated — request arrived at x=92, prefill done at ~168 */}
            <line x1="92" y1="102" x2="168" y2="102" stroke="#10b981" strokeWidth="1" strokeDasharray="3 2" />
            <line x1="92"  y1="99" x2="92"  y2="105" stroke="#10b981" strokeWidth="1" />
            <line x1="168" y1="99" x2="168" y2="105" stroke="#10b981" strokeWidth="1" />
            <text x="130" y="112" textAnchor="middle" fontSize="8" fill="#10b981">← TTFT ~2× lower →</text>
          </svg>
        </div>
      </div>

      {/* ── Info cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoCard title="How vLLM Implements PD Disaggregation" accent="#0969da">
          <p>
            vLLM runs prefill and decode instances as <strong>separate processes</strong> with a shared scheduler.
            After prefill completes, KV cache blocks are migrated to the decode instance via <strong>RDMA or NVLink</strong>
            without recomputation. The decode instance then takes over and streams tokens back.
          </p>
          <p>
            Chunked prefill pipelines large prompts so KV transfer overlaps with the tail of prefill computation,
            hiding most of the network latency.
          </p>
        </InfoCard>

        <InfoCard title="H100 Roofline Numbers" accent="#8250df">
          <p>
            The H100 SXM5 delivers <strong>~989 TFLOP/s</strong> (BF16) and <strong>~3.35 TB/s</strong> HBM3 bandwidth.
            The ridge point — where compute and bandwidth limits meet — is at <strong>~295 FLOP/byte</strong>.
          </p>
          <p>
            Decode runs at roughly 1–10 FLOP/byte (far left of the roofline), bottlenecked by HBM bandwidth.
            Prefill with long sequences runs at 100–1000+ FLOP/byte (at or beyond the ridge), bottlenecked by compute.
            These are fundamentally different hardware operating regimes.
          </p>
        </InfoCard>

        <InfoCard title="KV Transfer Overhead" accent="#f59e0b">
          <p>
            For a 9-token prompt on Llama 3.1 8B (32 layers, 8 KV heads, 128-dim head, BF16):
            KV size ≈ 9 × 32 × 2 × 8 × 128 × 2 bytes ≈ <strong>1.2 MB</strong>.
          </p>
          <p>
            Over 400 Gbps InfiniBand, this transfers in ~24 µs — negligible compared to the prefill compute time.
            For longer prompts (e.g. 4K tokens ≈ 530 MB KV), chunked prefill pipelines the transfer to
            overlap with computation, keeping the overhead manageable.
          </p>
        </InfoCard>

        <InfoCard title="When to Use PD Disaggregation" accent="#10b981">
          <p>
            PD disaggregation pays off most when your workload has <strong>long prompts + short outputs</strong>
            (RAG, document QA, code completion) or strict TTFT SLOs.
            Prefill blocking is worst when decode batches are large and prompts are long.
          </p>
          <p>
            For <strong>chatbot workloads</strong> (short prompts, long multi-turn replies): co-location is
            often fine. For <strong>long-context serving</strong> where TTFT matters more than TPOT:
            disaggregation gives ~2× TTFT improvement with minimal added infrastructure complexity.
          </p>
        </InfoCard>
      </div>
    </div>
  );
}
