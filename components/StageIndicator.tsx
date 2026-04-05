"use client";

import { cn } from "@/lib/utils";
import type { AgentStage } from "@/types/agent";

interface StageIndicatorProps {
  stage: AgentStage;
  className?: string;
}

const STAGE_CONFIG: Record<
  AgentStage,
  { label: string; color: string; pulse: boolean }
> = {
  idle: { label: "Ready", color: "bg-zinc-400", pulse: false },
  planning: { label: "Planning", color: "bg-blue-500", pulse: true },
  executing: { label: "Executing", color: "bg-amber-500", pulse: true },
  reflecting: { label: "Reflecting", color: "bg-orange-500", pulse: true },
  formatting: { label: "Packaging", color: "bg-violet-500", pulse: true },
  done: { label: "Done", color: "bg-emerald-500", pulse: false },
  error: { label: "Failed", color: "bg-red-500", pulse: false },
};

export function StageIndicator({ stage, className }: StageIndicatorProps) {
  const config = STAGE_CONFIG[stage] ?? STAGE_CONFIG.idle;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1",
        "text-xs font-medium border",
        stage === "idle" && "bg-zinc-100 border-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400",
        stage === "planning" && "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300",
        stage === "executing" && "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-300",
        stage === "reflecting" && "bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950 dark:border-orange-800 dark:text-orange-300",
        stage === "formatting" && "bg-violet-50 border-violet-200 text-violet-700 dark:bg-violet-950 dark:border-violet-800 dark:text-violet-300",
        stage === "done" && "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300",
        stage === "error" && "bg-red-50 border-red-200 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-300",
        className
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full",
          config.color,
          config.pulse && "animate-pulse"
        )}
      />
      {config.label}
    </span>
  );
}
