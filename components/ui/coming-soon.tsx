import React from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ComingSoonProps {
  children: React.ReactNode;
  className?: string;
  label?: string; // Small badge text
  message?: string; // Optional supporting copy under the badge
  disabled?: boolean; // If false, renders children normally (no overlay)
  blur?: boolean; // Apply a subtle blur to children when disabled
  rounded?: string; // Tailwind rounding utility override
}

/**
 * ComingSoon wraps any content and overlays a polished "Coming soon" glass panel.
 * Matches the site's dark glass aesthetic.
 */
export function ComingSoon({
  children,
  className,
  label = "Coming soon",
  message,
  disabled = true,
  blur = true,
  rounded = "rounded-2xl",
}: ComingSoonProps) {
  if (!disabled) {
    return <div className={cn("relative", rounded, className)}>{children}</div>;
  }

  return (
    <div className={cn("relative", rounded, className)}>
      <div className={cn(rounded, blur && "blur-[1.5px]", "pointer-events-none select-none")}>{children}</div>
      <div
        className={cn(
          "absolute inset-0 flex flex-col items-center justify-center",
          rounded,
          "border border-white/10 bg-black/40 backdrop-blur-sm"
        )}
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
          <Lock className="h-3.5 w-3.5 text-zinc-400" />
          <span>{label}</span>
        </div>
        {message && (
          <p className="mt-2 max-w-sm text-center text-sm text-zinc-400">{message}</p>
        )}
      </div>
    </div>
  );
}

export default ComingSoon;


