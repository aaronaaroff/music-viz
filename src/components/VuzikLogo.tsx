import React from "react";

interface VuzikLogoProps {
  size?: number;
}

export default function VuzikLogo({ size = 64 }: VuzikLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-lg"
    >
      <defs>
        <linearGradient id="vuzikGradientStatic" x1="0" y1="0" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgb(153,213,42)" />
          <stop offset="100%" stopColor="rgb(196,240,66)" />
        </linearGradient>
      </defs>

      {/* Left bars */}
      <rect x="10" y="50" width="6" height="20" rx="3" fill="url(#vuzikGradientStatic)" />
      <rect x="22" y="40" width="6" height="30" rx="3" fill="url(#vuzikGradientStatic)" />
      <rect x="34" y="30" width="6" height="40" rx="3" fill="url(#vuzikGradientStatic)" />

      {/* Center peak */}
      <rect x="47" y="15" width="6" height="55" rx="3" fill="url(#vuzikGradientStatic)" />

      {/* Right bars */}
      <rect x="60" y="30" width="6" height="40" rx="3" fill="url(#vuzikGradientStatic)" />
      <rect x="72" y="40" width="6" height="30" rx="3" fill="url(#vuzikGradientStatic)" />
      <rect x="84" y="50" width="6" height="20" rx="3" fill="url(#vuzikGradientStatic)" />
    </svg>
  );
}