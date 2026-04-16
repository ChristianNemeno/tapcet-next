"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface CopyLinkButtonProps {
  url?: string; // defaults to window.location.href
  label?: string;
  size?: "sm" | "default";
  variant?: "outline" | "ghost" | "default";
}

export function CopyLinkButton({
  url,
  label = "Copy Link",
  size = "sm",
  variant = "outline",
}: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const target = url ?? window.location.href;
    try {
      await navigator.clipboard.writeText(target);
    } catch {
      // Fallback for browsers that block clipboard without user gesture
      const el = document.createElement("textarea");
      el.value = target;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const iconOnly = label === "";

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={`font-mono text-xs gap-1.5${iconOnly ? " px-2" : ""}`}
      aria-label={copied ? "Link copied" : (label || "Copy link")}
      title={copied ? "Copied!" : "Copy link"}
    >
      {copied ? (
        <>
          <svg
            width={13}
            height={13}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {!iconOnly && "Copied!"}
        </>
      ) : (
        <>
          <svg
            width={13}
            height={13}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          {!iconOnly && label}
        </>
      )}
    </Button>
  );
}
