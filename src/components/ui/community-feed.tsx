"use client";

import React from "react";
import { motion } from "framer-motion";
import { type Feedback } from "@/lib/data";
import { useTheme } from "@/lib/theme";
import { Star, CheckCircle } from "lucide-react";

// ── Star Rating Display ─────────────────────────────────────────────────
function StarRating({ rating, size = 10 }: { rating: number; size?: number }) {
  const { accent, muted } = useTheme();
  return (
    <div className="flex items-center gap-px">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          fill={star <= rating ? accent : "none"}
          style={{ color: star <= rating ? accent : muted }}
        />
      ))}
    </div>
  );
}

// ── Review/Testimonial Card ──────────────────────────────────────────────
function ReviewCard({ feedback }: { feedback: Feedback }) {
  const { fg, border, isDark, cardBg, muted, accent, accentFg, surfaceAccent } = useTheme();

  const isVerified = feedback.role?.toLowerCase().includes("verified") || feedback.role?.toLowerCase().includes("buyer");

  return (
    <div
      className="p-5 md:p-6 border max-w-xs w-full transition-colors duration-300"
      style={{
        borderColor: border,
        background: cardBg,
      }}
    >
      {/* Star rating */}
      {feedback.rating && (
        <div className="mb-2.5">
          <StarRating rating={feedback.rating} size={11} />
        </div>
      )}

      {/* Review text */}
      <div
        className="text-sm leading-relaxed"
        style={{ color: fg, opacity: 0.85 }}
      >
        <span style={{ color: accent, opacity: 0.6 }}>&ldquo;</span>
        {feedback.text}
        <span style={{ color: accent, opacity: 0.6 }}>&rdquo;</span>
      </div>

      {/* Author + Role */}
      <div className="flex items-center gap-2.5 mt-4">
        <img
          width={36}
          height={36}
          src={feedback.avatar}
          alt={feedback.name}
          className="h-9 w-9 rounded-full grayscale object-cover"
          style={{
            border: `1px solid ${border}`,
          }}
        />
        <div className="flex flex-col min-w-0">
          <div
            className="font-mono text-[11px] font-medium tracking-wider leading-tight truncate"
            style={{ color: fg }}
          >
            {feedback.name}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            {isVerified && (
              <CheckCircle size={9} style={{ color: accent }} />
            )}
            <span
              className="font-mono text-[9px] leading-tight tracking-wider"
              style={{ color: muted }}
            >
              {feedback.role}
            </span>
          </div>
        </div>

        {/* Timestamp */}
        {feedback.timestamp && (
          <span
            className="font-mono text-[8px] tracking-wider ml-auto flex-shrink-0"
            style={{ color: muted, opacity: 0.6 }}
          >
            {feedback.timestamp}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Reviews Column (auto-scrolling) ──────────────────────────────────────
export const ReviewsColumn = (props: {
  className?: string;
  testimonials: Feedback[];
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.div
        animate={{ translateY: "-50%" }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-5 pb-5"
      >
        {[...new Array(2).fill(0).map((_, index) => (
          <React.Fragment key={index}>
            {props.testimonials.map((feedback, i) => (
              <ReviewCard key={`${index}-${i}`} feedback={feedback} />
            ))}
          </React.Fragment>
        ))]}
      </motion.div>
    </div>
  );
};

// Backward compatibility alias
export const TestimonialsColumn = ReviewsColumn;
