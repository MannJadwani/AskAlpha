import React from "react";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";


type PlanWrapperProps = {
  hideGenerateReportSection: boolean;
  children: React.ReactNode;
};

const PlanWrapper: React.FC<PlanWrapperProps> = ({ hideGenerateReportSection, children }) => {
  if (!hideGenerateReportSection) {
    return <div className={cn("relative", "rounded-2xl")}>{children}</div>;
  }

  return (
    <div className={cn("relative", "rounded-2xl")}>
      <div className={cn("rounded-2xl", "pointer-events-none select-none")}>{children}</div>
      <div
        className={cn(
          "absolute inset-0 flex flex-col items-center justify-center",
          "rounded-2xl",
          "border border-white/10 bg-black/40 backdrop-blur-sm"
        )}
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
          <Lock className="h-3.5 w-3.5 text-zinc-400" />
        </div>
        
          <p className="mt-2 max-w-sm text-center text-sm text-zinc-400">🚀 You must have a plan to access this section</p>
        
      </div>
    </div>
  );
};

export default PlanWrapper;
