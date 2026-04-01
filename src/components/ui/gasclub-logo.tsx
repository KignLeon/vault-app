"use client";

import React from "react";

export function GasclubLogo({
  className = "",
  size = 32,
  style,
  accentColor,
}: {
  className?: string;
  size?: number;
  style?: React.CSSProperties;
  accentColor?: string;
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
      {/* Outer circle */}
      <circle cx="60" cy="60" r="56" stroke="currentColor" strokeWidth="2.5" />
      {/* Inner ring — accent tint */}
      <circle
        cx="60"
        cy="60"
        r="48"
        stroke={accentColor || "currentColor"}
        strokeWidth="1"
        opacity="0.3"
      />
      {/* G letterform */}
      <path
        d="M 72 42 C 66 35, 52 32, 44 38 C 36 44, 33 56, 35 64 C 37 72, 44 80, 54 82 C 64 84, 72 78, 74 72 L 62 72 L 62 64 L 82 64 L 82 72 C 80 82, 70 90, 58 90 C 44 90, 32 80, 28 66 C 24 52, 28 38, 40 30 C 52 22, 68 26, 76 36 Z"
        fill="currentColor"
      />
      {/* Subtle sun ray accent — Cali vibe */}
      <line
        x1="95"
        y1="20"
        x2="102"
        y2="13"
        stroke={accentColor || "currentColor"}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.4"
      />
      <line
        x1="104"
        y1="30"
        x2="112"
        y2="27"
        stroke={accentColor || "currentColor"}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.3"
      />
      <line
        x1="100"
        y1="10"
        x2="104"
        y2="4"
        stroke={accentColor || "currentColor"}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.2"
      />
    </svg>
  );
}

export function GasclubWordmark({
  className = "",
  accentColor,
}: {
  className?: string;
  accentColor?: string;
}) {
  return (
    <span className={`font-mono text-sm font-bold tracking-[0.25em] uppercase ${className}`}>
      GAS
      <span style={{ color: accentColor }}>CLUB</span>
      <span style={{ opacity: 0.5, fontSize: "0.8em" }}>247</span>
    </span>
  );
}
