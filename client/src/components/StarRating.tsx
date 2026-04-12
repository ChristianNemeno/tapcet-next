"use client";

import { useState } from "react";

interface StarRatingProps {
  value: number | null;
  onChange?: (v: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md";
}

export function StarRating({ value, onChange, readOnly = false, size = "md" }: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const starSize = size === "sm" ? 16 : 22;
  const gap = size === "sm" ? "gap-0.5" : "gap-1";

  const display = hovered ?? value ?? 0;

  return (
    <div className={`flex items-center ${gap}`} aria-label={`Rating: ${value ?? "none"} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= display;
        return (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => !readOnly && onChange?.(star)}
            onMouseEnter={() => !readOnly && setHovered(star)}
            onMouseLeave={() => !readOnly && setHovered(null)}
            className={`shrink-0 transition-transform ${
              readOnly ? "cursor-default" : "cursor-pointer hover:scale-110"
            }`}
            aria-label={`Rate ${star} out of 5`}
          >
            <svg
              width={starSize}
              height={starSize}
              viewBox="0 0 24 24"
              fill={filled ? "oklch(0.82 0.20 195)" : "none"}
              stroke={filled ? "oklch(0.82 0.20 195)" : "oklch(0.50 0.009 90)"}
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
