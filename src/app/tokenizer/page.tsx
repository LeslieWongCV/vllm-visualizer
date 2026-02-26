"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { SectionHeader } from "@/components/ui";

// Simple BPE-like tokenizer simulation
const vocabulary: Record<string, number> = {
  "The": 1000,
  "the": 1001,
  " quick": 2001,
  " brown": 2002,
  " fox": 2003,
  " jumps": 2004,
  " over": 2005,
  " lazy": 2006,
  " dog": 2007,
  "Hello": 3000,
  " world": 3001,
  " of": 3002,
  " AI": 3003,
  " and": 3004,
  " machine": 3005,
  " learning": 3006,
  "Trans": 4000,
  "former": 4001,
  "s": 4002,
  " are": 4003,
  " amazing": 4004,
  "v": 5000,
  "LL": 5001,
  "M": 5002,
  " is": 5003,
  " fast": 5004,
  " ": 6000,
  "a": 6001,
  "b": 6002,
  "c": 6003,
  "d": 6004,
  "e": 6005,
  "f": 6006,
  "g": 6007,
  "h": 6008,
  "i": 6009,
  "j": 6010,
  "k": 6011,
  "l": 6012,
  "m": 6013,
  "n": 6014,
  "o": 6015,
  "p": 6016,
  "q": 6017,
  "r": 6018,
  "s ": 6019,
  "t": 6020,
  "u": 6021,
  "v ": 6022,
  "w": 6023,
  "x": 6024,
  "y": 6025,
  "z": 6026,
};

function tokenize(text: string): { token: string; id: number }[] {
  const tokens: { token: string; id: number }[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    let bestMatch = "";
    let bestId = -1;

    // Greedy longest match
    for (const [token, id] of Object.entries(vocabulary)) {
      if (remaining.startsWith(token) && token.length > bestMatch.length) {
        bestMatch = token;
        bestId = id;
      }
    }

    if (bestMatch) {
      tokens.push({ token: bestMatch, id: bestId });
      remaining = remaining.slice(bestMatch.length);
    } else {
      // Unknown char — use char-level fallback
      tokens.push({ token: remaining[0], id: 0 });
      remaining = remaining.slice(1);
    }
  }

  return tokens;
}

const exampleTexts = [
  "The quick brown fox",
  "Hello world of AI",
  "Transformers are amazing",
  "vLLM is fast",
];

const tokenColors = [
  "#7c3aed", "#3b82f6", "#10b981", "#f59e0b",
  "#ef4444", "#ec4899", "#8b5cf6", "#06b6d4",
  "#f97316", "#84cc16",
];

export default function TokenizerPage() {
  const [inputText, setInputText] = useState("The quick brown fox");
  const [showIds, setShowIds] = useState(true);
  const [showEmbedding, setShowEmbedding] = useState(false);

  const tokens = tokenize(inputText);

  return (
    <div className="max-w-5xl mx-auto">
      <SectionHeader
        title="Tokenizer"
        subtitle="Text is split into subword tokens using Byte-Pair Encoding (BPE). Each token maps to an ID in the vocabulary, which is then converted to a dense embedding vector."
        badge="TOKENIZATION"
      />

      {/* Input */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-6 mb-8">
        <h3 className="text-sm font-semibold text-[var(--muted)] mb-3">Input Text</h3>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="w-full bg-[#0a0a0a] border border-[var(--card-border)] rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:border-violet-500/50"
          placeholder="Type something..."
        />
        <div className="flex gap-2 mt-3">
          {exampleTexts.map((t) => (
            <button
              key={t}
              onClick={() => setInputText(t)}
              className="px-3 py-1 rounded text-xs bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition-colors"
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setShowIds(!showIds)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            showIds ? "bg-blue-500/20 text-blue-400 border border-blue-500/40" : "bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--muted)]"
          }`}
        >
          {showIds ? "✓ " : ""}Token IDs
        </button>
        <button
          onClick={() => setShowEmbedding(!showEmbedding)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            showEmbedding ? "bg-green-500/20 text-green-400 border border-green-500/40" : "bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--muted)]"
          }`}
        >
          {showEmbedding ? "✓ " : ""}Embedding Vectors
        </button>
      </div>

      {/* Tokenization Result */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-violet-400">Tokenization Result</h3>
          <span className="text-sm text-[var(--muted)]">{tokens.length} tokens</span>
        </div>

        {/* Visual tokens */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tokens.map((token, i) => {
            const color = tokenColors[i % tokenColors.length];
            return (
              <motion.div
                key={`${token.token}-${i}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="group relative"
              >
                <div
                  className="px-3 py-2 rounded-lg text-sm font-mono cursor-default"
                  style={{
                    backgroundColor: color + "15",
                    border: `1px solid ${color}40`,
                    color: color,
                  }}
                >
                  <span className="whitespace-pre">
                    {token.token.replace(/ /g, "·")}
                  </span>
                  {showIds && (
                    <span className="ml-2 text-[10px] opacity-60">{token.id}</span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Token table */}
        <div className="border-t border-[var(--card-border)] pt-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[var(--muted)]">
                <th className="text-left py-1 pr-4">Position</th>
                <th className="text-left py-1 pr-4">Token</th>
                <th className="text-left py-1 pr-4">Token ID</th>
                {showEmbedding && <th className="text-left py-1">Embedding (first 4 dims)</th>}
              </tr>
            </thead>
            <tbody>
              {tokens.map((token, i) => {
                const color = tokenColors[i % tokenColors.length];
                // Fake embedding values based on token ID
                const embedding = Array.from({ length: 4 }, (_, j) =>
                  ((Math.sin(token.id * (j + 1) * 0.1) + 1) / 2).toFixed(4)
                );
                return (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-t border-[var(--card-border)]/50"
                  >
                    <td className="py-2 pr-4 text-[var(--muted)]">{i}</td>
                    <td className="py-2 pr-4 font-mono" style={{ color }}>
                      &quot;{token.token.replace(/ /g, "·")}&quot;
                    </td>
                    <td className="py-2 pr-4 font-mono text-[var(--muted)]">{token.id}</td>
                    {showEmbedding && (
                      <td className="py-2 font-mono text-green-400/70">
                        [{embedding.join(", ")}...]
                      </td>
                    )}
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* BPE Explanation */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-violet-400 mb-3">Byte-Pair Encoding (BPE)</h3>
          <div className="text-sm text-[var(--muted)] leading-relaxed space-y-3">
            <p>
              <strong className="text-white">1. Start with characters:</strong> Begin with individual bytes/characters as the initial vocabulary.
            </p>
            <p>
              <strong className="text-white">2. Count pairs:</strong> Find the most frequent adjacent token pair in the training corpus.
            </p>
            <p>
              <strong className="text-white">3. Merge:</strong> Replace all occurrences of that pair with a new token. Add it to the vocabulary.
            </p>
            <p>
              <strong className="text-white">4. Repeat:</strong> Continue until the vocabulary reaches the desired size (e.g., 32K, 128K tokens).
            </p>
          </div>
        </div>

        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-violet-400 mb-3">Why Tokenization Matters for vLLM</h3>
          <div className="text-sm text-[var(--muted)] leading-relaxed space-y-3">
            <p>
              <strong className="text-white">KV Cache Size:</strong> Each token position needs K and V vectors stored. More tokens = more memory.
            </p>
            <p>
              <strong className="text-white">Block Allocation:</strong> vLLM allocates KV cache in blocks of fixed token count. The tokenizer determines how many blocks a sequence needs.
            </p>
            <p>
              <strong className="text-white">Prefix Sharing:</strong> Shared prefixes are detected at the token level. Tokenization consistency is critical for cache sharing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
