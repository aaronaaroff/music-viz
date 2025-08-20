import React from "react";
import { motion } from "framer-motion";

interface VuzikLogoAnimatedProps {
  size?: number;
}

export default function VuzikLogoAnimated({ size = 64 }: VuzikLogoAnimatedProps) {
  const barPositions = [10, 22, 34, 47, 60, 72, 84];
  const delays = [0, 0.1, 0.2, 0.3, 0.2, 0.1, 0];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-lg"
    >
      <defs>
        <linearGradient id="vuzikGradientAnimated" x1="0" y1="0" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgb(153,213,42)" />
          <stop offset="100%" stopColor="rgb(196,240,66)" />
        </linearGradient>
      </defs>

      {barPositions.map((x, i) => (
        <motion.rect
          key={i}
          x={x}
          y={50 - Math.abs(3 - i) * 5}
          width="6"
          height={20 + (3 - Math.abs(3 - i)) * 10}
          rx="3"
          fill="url(#vuzikGradientAnimated)"
          animate={{
            scaleY: [1, 1.4, 1],
          }}
          transition={{
            duration: 0.6,
            delay: delays[i],
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </svg>
  );
}