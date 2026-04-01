"use client";

import { cn } from "@/lib/utils";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";

interface SliderProps {
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  className?: string;
  label?: string;
}

export function QuantitySelector({
  min = 0,
  max = 100,
  step = 1,
  defaultValue = 0,
  onChange,
  className,
  label = "UNITS",
}: SliderProps) {
  const [value, setValue] = useState(defaultValue);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const width = useMotionValue(0);

  const valueToPosition = (val: number, trackWidth: number) => {
    const percentage = (val - min) / (max - min);
    return percentage * trackWidth;
  };

  const positionToValue = (pos: number, trackWidth: number) => {
    const percentage = pos / trackWidth;
    const rawValue = percentage * (max - min) + min;
    const steppedValue = Math.round(rawValue / step) * step;
    return Math.min(Math.max(steppedValue, min), max);
  };

  useEffect(() => {
    if (trackRef.current) {
      const trackWidth = trackRef.current.offsetWidth;
      width.set(trackWidth);
      x.set(valueToPosition(value, trackWidth));
    }
  }, [value, min, max, width, x]);

  const handleDrag = () => {
    if (trackRef.current) {
      const trackWidth = trackRef.current.offsetWidth;
      const newValue = positionToValue(x.get(), trackWidth);
      if (newValue !== value) {
        setValue(newValue);
        onChange?.(newValue);
      }
    }
  };

  const handleTrackClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (trackRef.current) {
      const rect = trackRef.current.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const trackWidth = rect.width;
      const newValue = positionToValue(clickX, trackWidth);

      setValue(newValue);
      onChange?.(newValue);

      animate(x, clickX, {
        type: "spring",
        stiffness: 300,
        damping: 30,
      });
    }
  };

  const fillWidth = useTransform(x, (latest) => Math.max(0, latest));

  return (
    <div className={cn("w-full py-4", className)}>
      <div className="flex justify-between items-center mb-4">
        <label className="text-sm font-medium font-mono tracking-[0.15em] text-neutral-500 uppercase">
          {label}
        </label>
        <span className="text-sm font-mono font-bold text-black bg-neutral-100 px-3 py-1.5 border border-neutral-200">
          {value}
        </span>
      </div>

      <div
        className="relative h-10 flex items-center cursor-pointer group"
        ref={trackRef}
        onClick={handleTrackClick}
      >
        {/* Track */}
        <div className="absolute w-full h-2 bg-neutral-200 overflow-hidden">
          <motion.div className="h-full bg-black" style={{ width: fillWidth }} />
        </div>

        {/* Handle */}
        <motion.div
          drag="x"
          dragConstraints={trackRef}
          dragElastic={0}
          dragMomentum={false}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => setIsDragging(false)}
          onDrag={handleDrag}
          style={{ x }}
          className="absolute top-1/2 -translate-y-1/2 left-0 -ml-4 z-10"
        >
          <motion.div
            className={cn(
              "w-8 h-8 bg-white border-2 border-black flex items-center justify-center transition-all",
              isDragging ? "scale-110 border-black" : "group-hover:border-black/80"
            )}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="w-2 h-2 bg-black" />
          </motion.div>

          {isDragging && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: -36 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute left-1/2 -translate-x-1/2 bg-black text-white text-xs font-mono px-2.5 py-1 tracking-wider border border-black"
            >
              {value}
              <span className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-black" />
            </motion.div>
          )}
        </motion.div>
      </div>

      <div className="flex justify-between mt-2 text-[10px] font-mono text-neutral-400 tracking-wider">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
