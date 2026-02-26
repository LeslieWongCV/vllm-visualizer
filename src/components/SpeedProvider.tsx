"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type Speed = 0.5 | 1 | 1.5 | 2;

interface SpeedContextType {
  speed: Speed;
  setSpeed: (s: Speed) => void;
  /** Multiply a base ms interval by the inverse of speed so faster = shorter delay */
  interval: (baseMs: number) => number;
}

const SpeedContext = createContext<SpeedContextType>({
  speed: 1,
  setSpeed: () => {},
  interval: (ms) => ms,
});

export function useSpeed() {
  return useContext(SpeedContext);
}

export function SpeedProvider({ children }: { children: ReactNode }) {
  const [speed, setSpeed] = useState<Speed>(1);

  const interval = (baseMs: number) => baseMs / speed;

  return (
    <SpeedContext.Provider value={{ speed, setSpeed, interval }}>
      {children}
    </SpeedContext.Provider>
  );
}
