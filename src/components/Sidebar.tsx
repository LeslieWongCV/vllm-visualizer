"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const navItems = [
  { href: "/", label: "Overview", icon: "🏠" },
  { href: "/architecture", label: "Transformer Architecture", icon: "🧠" },
  { href: "/paged-attention", label: "PagedAttention", icon: "📄" },
  { href: "/kv-cache", label: "KV Cache Management", icon: "💾" },
  { href: "/continuous-batching", label: "Continuous Batching", icon: "⚡" },
  { href: "/scheduler", label: "Scheduler", icon: "📋" },
  { href: "/tokenizer", label: "Tokenizer", icon: "🔤" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0d0d0d] border-r border-[var(--card-border)] flex flex-col z-50">
      <div className="p-6 border-b border-[var(--card-border)]">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white font-bold text-sm">
            v
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">vLLM</h1>
            <p className="text-xs text-[var(--muted)]">Architecture Visualizer</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                className={`relative flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                  isActive
                    ? "text-white bg-violet-500/10"
                    : "text-[var(--muted)] hover:text-white hover:bg-white/5"
                }`}
                whileHover={{ x: 4 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute left-0 top-0 bottom-0 w-[3px] bg-violet-500 rounded-r"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[var(--card-border)]">
        <a
          href="https://github.com/vllm-project/vllm"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[var(--muted)] hover:text-white transition-colors"
        >
          GitHub → vllm-project/vllm
        </a>
      </div>
    </aside>
  );
}
