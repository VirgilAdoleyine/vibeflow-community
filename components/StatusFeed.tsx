"use client";

import { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Loader2,
  Code2,
  ListChecks,
  Zap,
  Brain,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StageIndicator } from "./StageIndicator";
import type { AgentStreamEvent, AgentStage } from "@/types/agent";

interface StatusFeedProps {
  events: AgentStreamEvent[];
  stage: AgentStage;
  onContinue?: (prompt: string) => void;
}

const STAGE_ICON: Record<string, React.ReactNode> = {
  planning: <ListChecks className="w-3.5 h-3.5" />,
  executing: <Zap className="w-3.5 h-3.5" />,
  reflecting: <Brain className="w-3.5 h-3.5" />,
  formatting: <Package className="w-3.5 h-3.5" />,
  done: <CheckCircle2 className="w-3.5 h-3.5" />,
  error: <XCircle className="w-3.5 h-3.5" />,
};

function ScriptBlock({ script }: { script: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
      >
        <Code2 className="w-3 h-3" />
        {open ? "Hide" : "Show"} script
        {open ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
      </button>
      {open && (
        <pre className="mt-2 p-3 rounded-lg bg-zinc-950 text-zinc-300 text-xs overflow-x-auto leading-relaxed border border-zinc-800 max-h-64">
          <code>{script}</code>
        </pre>
      )}
    </div>
  );
}

function PlanSteps({ plan }: { plan: string[] }) {
  return (
    <ol className="mt-2 space-y-1">
      {plan.map((step, i) => (
        <li key={i} className="flex items-start gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center text-[10px] font-medium">
            {i + 1}
          </span>
          {step}
        </li>
      ))}
    </ol>
  );
}

function EventRow({ event, isLast, onContinue }: { event: AgentStreamEvent; isLast: boolean; onContinue?: (prompt: string) => void }) {
  const isDone = event.stage === "done";
  const isError = event.stage === "error";

  const handleContinue = () => {
    const currentPrompt = event.message || "";
    const newPrompt = currentPrompt + " (please fix the error and try again)";
    onContinue?.(newPrompt);
  };

  return (
    <div
      className={cn(
        "flex gap-3 animate-fade-in",
        isLast && !isDone && !isError && "opacity-90"
      )}
    >
      {/* Timeline dot + line */}
      <div className="flex flex-col items-center flex-shrink-0 pt-0.5">
        <div
          className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
            isDone && "bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300",
            isError && "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300",
            !isDone && !isError && "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
          )}
        >
          {isLast && !isDone && !isError ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            STAGE_ICON[event.stage] ?? <Zap className="w-3 h-3" />
          )}
        </div>
        {!isLast && (
          <div className="w-px flex-1 bg-zinc-100 dark:bg-zinc-800 my-1" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-4 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <StageIndicator stage={event.stage} />
        </div>

        <p
          className={cn(
            "text-sm mt-1",
            isDone
              ? "text-zinc-800 dark:text-zinc-100 font-medium"
              : isError
              ? "text-red-600 dark:text-red-400"
              : "text-zinc-600 dark:text-zinc-300"
          )}
        >
          {event.message}
        </p>

        {event.plan && <PlanSteps plan={event.plan} />}
        {event.script && <ScriptBlock script={event.script} />}

        {event.error && (
          <p className="mt-1 text-xs text-red-500 dark:text-red-400 font-mono">
            {event.error}
          </p>
        )}

        {isError && onContinue && (
          <button
            onClick={handleContinue}
            className="mt-2 px-3 py-1.5 text-xs font-medium bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:opacity-90 transition-opacity"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

export function StatusFeed({ events, stage, onContinue }: StatusFeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events]);

  if (events.length === 0) return null;

  return (
    <div className="w-full rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
          Execution log
        </span>
        <StageIndicator stage={stage} />
      </div>

      {/* Event list */}
      <div className="p-4 space-y-0 max-h-[500px] overflow-y-auto">
        {events.map((event, i) => (
          <EventRow
            key={i}
            event={event}
            isLast={i === events.length - 1}
            onContinue={onContinue}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
