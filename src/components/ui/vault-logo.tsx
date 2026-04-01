"use client";

import React from "react";

export function VaultLogo({
  className = "",
  size = 32,
  style,
}: {
  className?: string;
  size?: number;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <rect x="4" y="4" width="112" height="112" stroke="currentColor" strokeWidth="3" />
      <rect x="12" y="12" width="96" height="96" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M 35 30 L 60 90 L 85 30"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="square"
        strokeLinejoin="miter"
        fill="none"
      />
      <line x1="40" y1="98" x2="80" y2="98" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function VaultWordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-mono text-sm font-bold tracking-[0.35em] uppercase ${className}`}>
      VAULT
    </span>
  );
}
