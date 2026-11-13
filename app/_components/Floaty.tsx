"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Kartu melayang dekoratif untuk hero landing page.
 * Wrapper luar membawa posisi + rotasi (Tailwind), wrapper dalam membawa animasi
 * naik-turun (framer-motion) agar transform tidak saling menimpa.
 */
export function Floaty({
  className,
  delay = 0,
  duration = 6,
  children,
}: {
  className?: string;
  delay?: number;
  duration?: number;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <div className={className}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={reduce ? { opacity: 1, y: 0 } : { opacity: 1, y: [0, -8, 0] }}
        transition={
          reduce
            ? { duration: 0.3 }
            : {
                opacity: { duration: 0.6, delay },
                y: { duration, delay, repeat: Infinity, ease: "easeInOut" },
              }
        }
      >
        {children}
      </motion.div>
    </div>
  );
}

