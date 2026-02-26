"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { SectionHeader, StatGrid, InfoCard } from "@/components/ui";

/* ── Layer definitions — plain-language explanations ── */
const layers = [
  {
    id: "embedding",
    label: "Token Embedding",
    subtitle: "Words → Numbers",
    color: "#0969da",
    detail: `Before the model can do anything, it needs to turn text into numbers. Each word (or piece of a word) gets mapped to a unique ID, and then that ID is used to look up a row in a giant table. The result is a list of numbers (a vector) that represents the meaning of that token. Think of it like looking up a word in a dictionary, except instead of getting a definition you get a list of 4,096 numbers that capture what the word "means" to the model.`,
    analogy: "Like looking up a contact in your phone: the name is the token, and the contact card with all the details is the vector.",
  },
  {
    id: "attention",
    label: "Self-Attention",
    subtitle: "Which words matter to each other?",
    color: "#0969da",
    detail: `This is the heart of the transformer. For every token, the model asks: "Which other tokens in this sentence should I pay attention to?" It creates three things for each token:

• A Query (Q): "What am I looking for?"
• A Key (K): "What do I contain?"
• A Value (V): "What information do I carry?"

The model compares every Query against every Key to figure out which tokens are relevant. Tokens that match well get high attention scores. Then it uses those scores to pull in the right Values. This is how the model understands that in "The cat sat on the mat", the word "sat" is connected to "cat" (who sat) and "mat" (where it sat).`,
    analogy: "Like being at a party: you scan the room (Query), people wear name tags describing themselves (Keys), and once you find someone interesting, you have a conversation and learn something (Value).",
  },
  {
    id: "multi_head",
    label: "Multiple Attention Heads",
    subtitle: "Looking at things from different angles",
    color: "#8250df",
    detail: `Instead of doing attention once, the model does it many times in parallel. These parallel runs are called "heads." Each head can focus on something different. One head might track grammar (subject-verb agreement), another might track meaning (what the sentence is about), and another might focus on nearby words vs. distant ones.

Llama 3.1 8B uses 32 heads. It's like having 32 people read the same sentence, each highlighting different relationships, and then combining all their notes into one summary.`,
    analogy: "Like a group project: each person reads the same document but takes notes on different things, then you combine everyone's notes for a complete picture.",
  },
  {
    id: "residual",
    label: "Residual Connection (Skip Connection)",
    subtitle: "Don't forget the original",
    color: "#8b949e",
    detail: `After the attention layer processes the data, the model adds the original input back to the output. This "shortcut" is surprisingly important. It means the model doesn't have to re-learn everything from scratch at each layer. Each layer just learns what to add or change.

Without these skip connections, very deep models (30+ layers) fail to train because information gets lost as it passes through layer after layer. The residual connection keeps a clean copy of the signal flowing through.`,
    analogy: "Like editing a document with \"Track Changes\" on: you can always see the original text underneath your modifications.",
  },
  {
    id: "norm",
    label: "Normalization (RMSNorm)",
    subtitle: "Keeping numbers in a healthy range",
    color: "#8b949e",
    detail: `As data flows through the model, the numbers can drift, getting really large or really small. Normalization rescales them back to a consistent range after each major operation. This keeps training stable and helps the model learn faster.

Modern models like Llama use RMSNorm, which is a simpler and faster version of the original LayerNorm. It just divides each number by the overall scale of the vector, without bothering to center the numbers first.`,
    analogy: "Like adjusting the volume on your music: if it gets too loud or too quiet, you bring it back to a comfortable level.",
  },
  {
    id: "ffn",
    label: "Feed-Forward Network (FFN)",
    subtitle: "Where the model actually 'thinks'",
    color: "#1a7f37",
    detail: `After attention figures out which tokens are related, the FFN processes each token individually. It passes the data through two large layers of numbers, with an activation function in between that decides what to amplify and what to suppress.

This is where most of the model's "knowledge" is stored: facts, language patterns, reasoning abilities. The FFN accounts for about 2/3 of all the parameters in the model. Modern models use a gated version called SwiGLU, which has an extra "gate" that helps the model be more selective about what information passes through.`,
    analogy: "If attention is about gathering information from context, the FFN is about processing that information and making decisions. Think of it like reading your notes and then writing your answer.",
  },
  {
    id: "output",
    label: "Output: Predict Next Token",
    subtitle: "Picking the next word",
    color: "#cf222e",
    detail: `After the data has passed through all the layers, the model needs to make its prediction. It takes the final vector for the last token and scores every word in its vocabulary: "How likely is each word to come next?" These scores get turned into probabilities, and then the model picks a word.

It doesn't always pick the most likely word; that would make it repetitive and boring. Instead, it samples from the top candidates, which is why the same prompt can produce different responses each time.`,
    analogy: "Like a multiple-choice test with 128,000 options: the model assigns a confidence score to each option and then picks one from the top choices.",
  },
];

const modelConfigs = [
  { name: "Llama 3.1 8B", layers: 32, heads: 32, kvHeads: 8, dim: 4096, ffn: 14336, vocab: "128K", ctx: "128K" },
  { name: "Llama 3.1 70B", layers: 80, heads: 64, kvHeads: 8, dim: 8192, ffn: 28672, vocab: "128K", ctx: "128K" },
  { name: "Mistral 7B", layers: 32, heads: 32, kvHeads: 8, dim: 4096, ffn: 14336, vocab: "32K", ctx: "32K" },
  { name: "GPT-3 175B", layers: 96, heads: 96, kvHeads: 96, dim: 12288, ffn: 49152, vocab: "50K", ctx: "2K" },
];

export default function ArchitecturePage() {
  const [expandedLayer, setExpandedLayer] = useState<string | null>(null);
  const [modelIdx, setModelIdx] = useState(0);
  const model = modelConfigs[modelIdx];

  return (
    <div>
      <SectionHeader
        badge="Architecture"
        title="How a Transformer Works"
        subtitle="Every modern LLM (ChatGPT, Llama, Mistral) is built from the same basic building blocks stacked on top of each other. Click each layer below to understand what it does."
      />

      {/* Model selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {modelConfigs.map((m, i) => (
          <button
            key={m.name}
            onClick={() => setModelIdx(i)}
            className={modelIdx === i ? "btn-primary" : "btn-ghost"}
          >
            {m.name}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="mb-10">
        <StatGrid
          stats={[
            { label: "Layers", value: model.layers },
            { label: "Attention Heads", value: model.heads },
            { label: "KV Heads", value: model.kvHeads },
            { label: "Hidden Size", value: model.dim.toLocaleString() },
            { label: "Vocabulary", value: model.vocab },
            { label: "Max Context", value: model.ctx },
          ]}
        />
      </div>

      {/* The big picture */}
      <div className="card p-6 mb-8">
        <h3 className="section-label" style={{ color: "var(--accent-text)" }}>
          The Big Picture
        </h3>
        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
          A transformer takes in text, breaks it into tokens, processes them through many identical layers, and predicts the next token. That&apos;s it. The entire magic of ChatGPT, Llama, and every other LLM comes from repeating this simple loop, one token at a time.
        </p>
        <div className="overflow-x-auto">
          <svg width="730" height="90" viewBox="0 0 730 90" className="mx-auto block">
            {[
              { x: 0,   w: 100, label: "Text Input",              color: "#8b949e" },
              { x: 118, w: 100, label: "Tokenize",                color: "#8b949e" },
              { x: 236, w: 100, label: "Embed",                   color: "#0969da" },
              { x: 354, w: 120, label: `${model.layers}\u00d7 Transformer`, color: "#8250df" },
              { x: 492, w: 100, label: "Predict",                 color: "#cf222e" },
              { x: 610, w: 120, label: "Next Token",              color: "#1a7f37" },
            ].map((n, i, arr) => (
              <g key={i}>
                <rect x={n.x} y="20" width={n.w} height="44" rx="8" fill={`${n.color}10`} stroke={n.color} strokeWidth="1" />
                <text x={n.x + n.w / 2} y="46" textAnchor="middle" fill={n.color} fontSize="12" fontWeight="600">{n.label}</text>
                {i < arr.length - 1 && (
                  <line x1={n.x + n.w + 4} y1="42" x2={arr[i + 1].x - 4} y2="42" stroke="var(--svg-arrow)" strokeWidth="1" markerEnd="url(#arrowBig)" />
                )}
              </g>
            ))}
            <defs>
              <marker id="arrowBig" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6" fill="none" stroke="var(--svg-arrow)" strokeWidth="1" />
              </marker>
            </defs>
          </svg>
        </div>
      </div>

      <div className="flex gap-6 items-start">
        {/* Main transformer stack */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text)" }}>
            Inside Each Layer
          </h3>

          {layers.map((layer, i) => {
            const isOpen = expandedLayer === layer.id;
            return (
              <motion.button
                key={layer.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setExpandedLayer(isOpen ? null : layer.id)}
                className={`w-full text-left mb-2 last:mb-0 rounded-lg p-4 transition-all ${
                  isOpen ? "ring-1" : ""
                }`}
                style={{
                  background: layer.color + "0a",
                  border: `1px solid ${layer.color}${isOpen ? "50" : "18"}`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-bold" style={{ color: layer.color }}>
                      {layer.label}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}>
                      {layer.subtitle}
                    </span>
                  </div>
                  <motion.span
                    animate={{ rotate: isOpen ? 90 : 0 }}
                    className="text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    ▶
                  </motion.span>
                </div>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-3 pt-3 space-y-3"
                      style={{ borderTop: `1px solid ${layer.color}18` }}
                    >
                      {/* Detail text */}
                      <div className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--text-secondary)" }}>
                        {layer.detail}
                      </div>

                      {/* Analogy */}
                      <div className="rounded-lg p-3 text-sm" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                        <span className="font-semibold" style={{ color: "var(--accent-text)" }}>Analogy: </span>
                        <span style={{ color: "var(--text-secondary)" }}>{layer.analogy}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>

        {/* Attention visual sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-5 w-80 shrink-0 hidden lg:block"
        >
          <h3
            className="text-sm font-semibold uppercase tracking-wider mb-2"
            style={{ color: "var(--accent-text)" }}
          >
            How Attention Works
          </h3>
          <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
            Each token creates a Query, Key, and Value. Queries and Keys are compared to find which tokens are relevant, then Values carry the actual information.
          </p>
          <svg viewBox="0 0 260 340" className="w-full">
            {/* Input */}
            <rect x="75" y="5" width="110" height="28" rx="6" fill="#0969da10" stroke="#0969da" strokeWidth="1" />
            <text x="130" y="23" textAnchor="middle" fill="#0969da" fontSize="11" fontWeight="500">Token Vector</text>

            {/* Projection lines */}
            <line x1="105" y1="33" x2="42" y2="65" stroke="var(--svg-arrow)" strokeWidth="0.8" />
            <line x1="130" y1="33" x2="130" y2="65" stroke="var(--svg-arrow)" strokeWidth="0.8" />
            <line x1="155" y1="33" x2="218" y2="65" stroke="var(--svg-arrow)" strokeWidth="0.8" />

            {/* Q, K, V labels */}
            <rect x="10" y="65" width="60" height="34" rx="6" fill="#8250df10" stroke="#8250df" strokeWidth="1" />
            <text x="40" y="80" textAnchor="middle" fill="#8250df" fontSize="11" fontWeight="700">Query</text>
            <text x="40" y="93" textAnchor="middle" fill="#8250df" fontSize="7" fontWeight="400">&quot;What am I looking for?&quot;</text>

            <rect x="100" y="65" width="60" height="34" rx="6" fill="#0969da10" stroke="#0969da" strokeWidth="1" />
            <text x="130" y="80" textAnchor="middle" fill="#0969da" fontSize="11" fontWeight="700">Key</text>
            <text x="130" y="93" textAnchor="middle" fill="#0969da" fontSize="7" fontWeight="400">&quot;What do I contain?&quot;</text>

            <rect x="190" y="65" width="60" height="34" rx="6" fill="#1a7f3710" stroke="#1a7f37" strokeWidth="1" />
            <text x="220" y="80" textAnchor="middle" fill="#1a7f37" fontSize="11" fontWeight="700">Value</text>
            <text x="220" y="93" textAnchor="middle" fill="#1a7f37" fontSize="7" fontWeight="400">&quot;Here&apos;s my info&quot;</text>

            {/* Compare Q & K */}
            <line x1="40" y1="99" x2="90" y2="135" stroke="var(--svg-arrow)" strokeWidth="0.8" />
            <line x1="130" y1="99" x2="90" y2="135" stroke="var(--svg-arrow)" strokeWidth="0.8" />

            <rect x="35" y="135" width="110" height="32" rx="6" fill="#9a670010" stroke="#9a6700" strokeWidth="1" />
            <text x="90" y="149" textAnchor="middle" fill="#9a6700" fontSize="10" fontWeight="500">Compare Q with K</text>
            <text x="90" y="161" textAnchor="middle" fill="#9a6700" fontSize="8">&quot;How relevant is each token?&quot;</text>

            {/* Attention scores */}
            <line x1="90" y1="167" x2="90" y2="187" stroke="var(--svg-arrow)" strokeWidth="0.8" />
            <rect x="30" y="187" width="120" height="28" rx="6" fill="#cf222e10" stroke="#cf222e" strokeWidth="1" />
            <text x="90" y="205" textAnchor="middle" fill="#cf222e" fontSize="10" fontWeight="500">Attention Scores →  %</text>

            {/* × V → Output */}
            <line x1="90" y1="215" x2="130" y2="250" stroke="var(--svg-arrow)" strokeWidth="0.8" />
            <line x1="220" y1="99" x2="130" y2="250" stroke="var(--svg-arrow)" strokeWidth="0.8" strokeDasharray="4 3" />

            <rect x="60" y="250" width="140" height="32" rx="6" fill="#8250df10" stroke="#8250df" strokeWidth="1" />
            <text x="130" y="264" textAnchor="middle" fill="#8250df" fontSize="10" fontWeight="500">Weighted mix of Values</text>
            <text x="130" y="276" textAnchor="middle" fill="#8250df" fontSize="8">Relevant info combined</text>

            {/* Output */}
            <line x1="130" y1="282" x2="130" y2="305" stroke="var(--svg-arrow)" strokeWidth="0.8" />
            <rect x="75" y="305" width="110" height="28" rx="6" fill="#1a7f3710" stroke="#1a7f37" strokeWidth="1" />
            <text x="130" y="323" textAnchor="middle" fill="#1a7f37" fontSize="10" fontWeight="500">Updated Token Vector</text>
          </svg>
        </motion.div>
      </div>

      {/* ── Data flow diagram ── */}
      <div className="card p-6 mt-10 mb-8">
        <h3 className="section-label" style={{ color: "var(--accent-text)" }}>
          What Happens Inside One Layer
        </h3>
        <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
          Each layer follows this pattern: normalize the data, run attention to gather context, add the original back (skip connection), normalize again, run the FFN to process it, and add the original back again. This repeats {model.layers} times.
        </p>
        <div className="overflow-x-auto">
          <svg width="780" height="110" viewBox="0 0 780 110" className="mx-auto block">
            {[
              { x: 0, label: "Input", color: "#0969da", w: 80 },
              { x: 110, label: "Normalize", color: "#8b949e", w: 90 },
              { x: 230, label: "Attention", color: "#0969da", w: 90 },
              { x: 350, label: "Add Back", color: "#8b949e", w: 85 },
              { x: 465, label: "Normalize", color: "#8b949e", w: 90 },
              { x: 585, label: "FFN", color: "#1a7f37", w: 70 },
              { x: 685, label: "Add Back", color: "#8b949e", w: 85 },
            ].map((n, i, arr) => (
              <g key={i}>
                <rect x={n.x} y="30" width={n.w} height="44" rx="8" fill={`${n.color}10`} stroke={n.color} strokeWidth="1" />
                <text x={n.x + n.w / 2} y="56" textAnchor="middle" fill={n.color} fontSize="11" fontWeight="600">{n.label}</text>
                {i < arr.length - 1 && (
                  <line x1={n.x + n.w + 3} y1="52" x2={arr[i + 1].x - 3} y2="52" stroke="var(--svg-arrow)" strokeWidth="1" markerEnd="url(#arrowFlow)" />
                )}
              </g>
            ))}
            {/* Residual skip connections */}
            <path d="M40,30 Q40,10 230,10 Q370,10 392,30" stroke="#0969da" strokeWidth="0.8" strokeDasharray="4 3" fill="none" />
            <text x="215" y="8" fill="#0969da" fontSize="13" textAnchor="middle">skip connection</text>

            <path d="M392,74 Q392,95 585,95 Q727,95 727,74" stroke="#1a7f37" strokeWidth="0.8" strokeDasharray="4 3" fill="none" />
            <text x="555" y="108" fill="#1a7f37" fontSize="13" textAnchor="middle">skip connection</text>

            <defs>
              <marker id="arrowFlow" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6" fill="none" stroke="var(--svg-arrow)" strokeWidth="1" />
              </marker>
            </defs>
          </svg>
        </div>
      </div>

      {/* ── Beginner-friendly info cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <InfoCard title="Why are there so many layers?">
          <p>Each layer refines the model&apos;s understanding a little bit more. Early layers tend to learn basic things like grammar and word relationships. Middle layers build up meaning and context. Later layers make high-level decisions about what to say next.</p>
          <p>Stacking 32 (or 80, or 126) layers gives the model enough depth to go from raw words to genuinely understanding what you&apos;re asking.</p>
        </InfoCard>
        <InfoCard title="What are attention heads?">
          <p>A single attention head can only focus on one kind of relationship at a time. With multiple heads (32 in Llama 8B), the model can track many things simultaneously: grammar, meaning, word proximity, coreference, and more.</p>
          <p><strong>Grouped-Query Attention (GQA)</strong> is a memory-saving trick: instead of giving every head its own Key and Value, several heads share the same ones. Llama 8B groups 4 query heads per KV pair, cutting memory use by 4× with minimal quality loss.</p>
        </InfoCard>
        <InfoCard title="Why skip connections matter">
          <p>Without skip connections, information would have to survive passing through dozens of layers of transformations. In practice, it gets distorted and lost, making the model impossible to train.</p>
          <p>Skip connections create a shortcut: the original data always makes it through unchanged, and each layer just adds small corrections on top. This is what makes deep models practical.</p>
        </InfoCard>
        <InfoCard title="How does the model generate text?">
          <p>One token at a time. The model reads everything so far, predicts the most likely next token, appends it to the input, and repeats. A 100-word response means the model ran ~130 times, once per token.</p>
          <p>This is why generation feels slower than reading your prompt: the prompt can be processed all at once (parallel), but each new token must wait for the previous one (sequential).</p>
        </InfoCard>
      </div>

      {/* ── Where parameters live — visual bar ── */}
      <div className="card p-6">
        <h3 className="section-label" style={{ color: "var(--accent-text)" }}>
          Where Do the Parameters Live?
        </h3>
        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
          A model&apos;s billions of parameters aren&apos;t spread evenly. The FFN layers hold the majority; they&apos;re where the model stores most of its learned knowledge.
        </p>
        <div className="flex rounded-lg overflow-hidden h-10 w-full mb-3" style={{ border: "1px solid var(--border)" }}>
          <div className="h-full flex items-center justify-center text-xs font-medium text-white" style={{ width: "8%", background: "#0969da" }}>
            Embed
          </div>
          <div className="h-full flex items-center justify-center text-xs font-medium text-white" style={{ width: "25%", background: "#8250df" }}>
            Attention ~25%
          </div>
          <div className="h-full flex items-center justify-center text-xs font-medium text-white" style={{ width: "65%", background: "#1a7f37" }}>
            FFN ~65%
          </div>
          <div className="h-full flex items-center justify-center text-xs font-medium" style={{ width: "2%", background: "var(--bg-secondary)", color: "var(--text-muted)" }}>
          </div>
        </div>
        <div className="flex gap-4 text-xs flex-wrap" style={{ color: "var(--text-muted)" }}>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: "#0969da" }} /> Embeddings</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: "#8250df" }} /> Attention</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: "#1a7f37" }} /> FFN</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }} /> Norms (tiny)</span>
        </div>
      </div>
    </div>
  );
}
