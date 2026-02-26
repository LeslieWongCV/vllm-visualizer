"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { SectionHeader, InfoCard } from "@/components/ui";

/* ---- tiny BPE-like vocab ---- */
const vocab: Record<string, number> = {
  "The": 1000, "the": 1001, " quick": 2001, " brown": 2002,
  " fox": 2003, " jumps": 2004, " over": 2005, " lazy": 2006,
  " dog": 2007, "Hello": 3000, " world": 3001, " of": 3002,
  " AI": 3003, " and": 3004, " machine": 3005, " learning": 3006,
  "Trans": 4000, "former": 4001, "s": 4002, " are": 4003,
  " amazing": 4004, "v": 5000, "LL": 5001, "M": 5002,
  " is": 5003, " fast": 5004, " ": 6000,
  "a": 6001, "b": 6002, "c": 6003, "d": 6004,
  "e": 6005, "f": 6006, "g": 6007, "h": 6008,
  "i": 6009, "j": 6010, "k": 6011, "l": 6012,
  "m": 6013, "n": 6014, "o": 6015, "p": 6016,
  "q": 6017, "r": 6018, "t": 6020, "u": 6021,
  "w": 6023, "x": 6024, "y": 6025, "z": 6026,
};

function tokenize(text: string) {
  const result: { token: string; id: number }[] = [];
  let rem = text;
  while (rem.length > 0) {
    let best = "", bestId = -1;
    for (const [tok, id] of Object.entries(vocab)) {
      if (rem.startsWith(tok) && tok.length > best.length) { best = tok; bestId = id; }
    }
    if (best) { result.push({ token: best, id: bestId }); rem = rem.slice(best.length); }
    else { result.push({ token: rem[0], id: 0 }); rem = rem.slice(1); }
  }
  return result;
}

const examples = ["The quick brown fox", "Hello world of AI", "Transformers are amazing", "vLLM is fast"];
const palette = ["#7c3aed", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#8b5cf6", "#06b6d4", "#f97316", "#84cc16"];

export default function TokenizerPage() {
  const [input, setInput] = useState("The quick brown fox");
  const [showIds, setShowIds] = useState(true);
  const [showEmbed, setShowEmbed] = useState(false);

  const tokens = tokenize(input);

  return (
    <div>
      <SectionHeader
        badge="Tokenization"
        title="BPE Tokenizer"
        subtitle="Before text reaches the transformer, it gets split into subword tokens via Byte-Pair Encoding. Each token maps to an integer ID and then to a dense embedding vector."
      />

      {/* Input */}
      <div className="card p-5 mb-6">
        <h3 className="section-label mb-3">Try it</h3>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="input-field mb-3"
          placeholder="Type anything…"
        />
        <div className="flex flex-wrap gap-1.5">
          {examples.map((t) => (
            <button
              key={t}
              onClick={() => setInput(t)}
              className="btn-ghost text-[11px]"
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setShowIds(!showIds)} className={showIds ? "btn-primary" : "btn-secondary"}>
          Token IDs {showIds && "✓"}
        </button>
        <button onClick={() => setShowEmbed(!showEmbed)} className={showEmbed ? "btn-primary" : "btn-secondary"}>
          Embeddings {showEmbed && "✓"}
        </button>
      </div>

      {/* Result */}
      <div className="card p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-label" style={{ color: "var(--accent-text)" }}>Result</h3>
          <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
            {tokens.length} token{tokens.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Visual tokens */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          {tokens.map((tok, i) => {
            const c = palette[i % palette.length];
            return (
              <motion.span
                key={`${tok.token}-${i}`}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                className="px-2.5 py-1.5 rounded text-xs font-mono"
                style={{ background: c + "12", border: `1px solid ${c}30`, color: c }}
              >
                {tok.token.replace(/ /g, "·")}
                {showIds && <span className="ml-1.5 opacity-50 text-[10px]">{tok.id}</span>}
              </motion.span>
            );
          })}
        </div>

        {/* Table */}
        <div className="overflow-x-auto" style={{ borderTop: "1px solid var(--border)" }}>
          <table className="w-full text-[12px] mt-3">
            <thead>
              <tr style={{ color: "var(--text-muted)" }}>
                <th className="text-left py-1.5 pr-4 font-medium">Pos</th>
                <th className="text-left py-1.5 pr-4 font-medium">Token</th>
                <th className="text-left py-1.5 pr-4 font-medium">ID</th>
                {showEmbed && <th className="text-left py-1.5 font-medium">Embedding (dims 0-3)</th>}
              </tr>
            </thead>
            <tbody>
              {tokens.map((tok, i) => {
                const c = palette[i % palette.length];
                const emb = Array.from({ length: 4 }, (_, j) =>
                  ((Math.sin(tok.id * (j + 1) * 0.1) + 1) / 2).toFixed(4),
                );
                return (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    style={{ borderTop: "1px solid var(--border)" }}
                  >
                    <td className="py-1.5 pr-4" style={{ color: "var(--text-muted)" }}>{i}</td>
                    <td className="py-1.5 pr-4 font-mono" style={{ color: c }}>
                      &quot;{tok.token.replace(/ /g, "·")}&quot;
                    </td>
                    <td className="py-1.5 pr-4 font-mono" style={{ color: "var(--text-muted)" }}>{tok.id}</td>
                    {showEmbed && (
                      <td className="py-1.5 font-mono" style={{ color: "#10b981" }}>
                        [{emb.join(", ")}…]
                      </td>
                    )}
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Explanations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoCard title="How BPE works">
          <p><strong>1.</strong> Start with individual bytes as the vocabulary.</p>
          <p><strong>2.</strong> Find the most frequent adjacent pair in the training data.</p>
          <p><strong>3.</strong> Merge that pair into a new token. Add it to the vocab.</p>
          <p><strong>4.</strong> Repeat until you hit the target vocab size (32K–128K tokens).</p>
        </InfoCard>
        <InfoCard title="Why this matters for vLLM">
          <p><strong>KV cache size</strong>: every token position stores K and V vectors. More tokens = more GPU memory.</p>
          <p><strong>Block allocation</strong>: vLLM allocates KV cache in fixed-size blocks. The token count determines how many blocks a request needs.</p>
          <p><strong>Prefix sharing</strong>: shared prefixes are detected at the token level, so consistent tokenization is critical for cache reuse.</p>
        </InfoCard>
      </div>
    </div>
  );
}
