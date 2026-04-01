"use client";

import React from "react";
import { motion } from "motion/react";
import { type Feedback } from "@/lib/data";

export const TestimonialsColumn = (props: {
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
        className="flex flex-col gap-6 pb-6"
      >
        {[...new Array(2).fill(0).map((_, index) => (
          <React.Fragment key={index}>
            {props.testimonials.map(({ text, avatar, name, role }, i) => (
              <div
                className="p-6 md:p-8 border border-neutral-200 bg-white max-w-xs w-full"
                key={i}
              >
                <div className="text-sm text-neutral-700 leading-relaxed">
                  &ldquo;{text}&rdquo;
                </div>
                <div className="flex items-center gap-2.5 mt-5">
                  <img
                    width={36}
                    height={36}
                    src={avatar}
                    alt={name}
                    className="h-9 w-9 rounded-full grayscale object-cover"
                  />
                  <div className="flex flex-col">
                    <div className="font-mono text-[11px] font-medium tracking-wider leading-tight text-black">
                      {name}
                    </div>
                    <div className="font-mono text-[10px] leading-tight tracking-wider text-neutral-400">
                      {role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </React.Fragment>
        ))]}
      </motion.div>
    </div>
  );
};
