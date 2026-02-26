"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface InfoCardProps {
  title: string;
  description: string;
  icon: string;
  delay?: number;
  children?: ReactNode;
}

export function InfoCard({ title, description, icon, delay = 0, children }: InfoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-6 hover:border-violet-500/30 transition-colors"
    >
      <div className="flex items-start gap-4">
        <span className="text-2xl">{icon}</span>
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-sm text-[var(--muted)] leading-relaxed">{description}</p>
          {children}
        </div>
      </div>
    </motion.div>
  );
}

interface SectionHeaderProps {
  title: string;
  subtitle: string;
  badge?: string;
}

export function SectionHeader({ title, subtitle, badge }: SectionHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-8"
    >
      {badge && (
        <span className="inline-block px-3 py-1 text-xs font-medium bg-violet-500/10 text-violet-400 rounded-full mb-3">
          {badge}
        </span>
      )}
      <h1 className="text-3xl font-bold mb-2">{title}</h1>
      <p className="text-[var(--muted)] max-w-2xl">{subtitle}</p>
    </motion.div>
  );
}

interface AnimatedBlockProps {
  color: string;
  label: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  delay?: number;
  className?: string;
}

export function AnimatedBlock({
  color,
  label,
  x = 0,
  y = 0,
  width = 120,
  height = 50,
  delay = 0,
  className = "",
}: AnimatedBlockProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay }}
      className={`absolute flex items-center justify-center rounded-lg border text-xs font-medium ${className}`}
      style={{
        left: x,
        top: y,
        width,
        height,
        backgroundColor: color + "20",
        borderColor: color + "40",
        color: color,
      }}
    >
      {label}
    </motion.div>
  );
}
