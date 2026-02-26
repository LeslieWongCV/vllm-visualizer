"use client";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="mt-20 py-8 border-t transition-colors duration-200"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px]" style={{ color: "var(--text-muted)" }}>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded flex items-center justify-center text-white text-[9px] font-bold"
            style={{ background: "var(--accent)" }}>
            v
          </div>
          <span>&copy; {year} vLLM Visualizer. All rights reserved.</span>
        </div>

        <div className="flex items-center gap-5">
          <a
            href="https://github.com/ssaketh-ch/vllm-visualizer"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 transition-colors hover:opacity-80"
            style={{ color: "var(--text-secondary)" }}
          >
            View on GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
