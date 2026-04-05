"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { ArrowUp, Zap, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentStage } from "@/types/agent";

interface CommandBarProps {
  onSubmit: (prompt: string) => void;
  stage: AgentStage;
  disabled?: boolean;
}

const EXAMPLE_PROMPTS = [
  "Get my last 10 Shopify orders and post a summary to #sales in Slack",
  "Find all HubSpot contacts added this week and create a Notion table",
  "Send me a Gmail digest of unread emails from the last 24 hours",
  "Fetch all open Shopify orders over $200 and check if customers are in HubSpot",
  "Pull this week's Airtable records and summarise them in Slack",
];

export function CommandBar({ onSubmit, stage, disabled }: CommandBarProps) {
  const [value, setValue] = useState("");
  const [placeholder, setPlaceholder] = useState(EXAMPLE_PROMPTS[0]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isRunning = !["idle", "done", "error"].includes(stage);

  // Cycle placeholder examples
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      i = (i + 1) % EXAMPLE_PROMPTS.length;
      setPlaceholder(EXAMPLE_PROMPTS[i]);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  }, [value]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || isRunning || disabled) return;
    onSubmit(trimmed);
    setValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleExample = (prompt: string) => {
    setValue(prompt);
    textareaRef.current?.focus();
  };

  return (
    <div className="w-full space-y-3">
      {/* Example prompts */}
      <div className="flex flex-wrap gap-2">
        {EXAMPLE_PROMPTS.slice(0, 3).map((p) => (
          <button
            key={p}
            onClick={() => handleExample(p)}
            className={cn(
              "text-xs px-3 py-1.5 rounded-full border transition-all",
              "text-zinc-500 border-zinc-200 hover:border-zinc-400 hover:text-zinc-700",
              "dark:text-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500 dark:hover:text-zinc-300",
              "truncate max-w-[280px]"
            )}
          >
            {p.length > 48 ? p.slice(0, 48) + "…" : p}
          </button>
        ))}
      </div>

      {/* Main input */}
      <div
        className={cn(
          "relative rounded-2xl border bg-white dark:bg-zinc-900 shadow-sm transition-all",
          "focus-within:shadow-md focus-within:border-zinc-400 dark:focus-within:border-zinc-500",
          isRunning
            ? "border-amber-300 dark:border-amber-700 shadow-amber-100 dark:shadow-amber-950"
            : "border-zinc-200 dark:border-zinc-700"
        )}
      >
        {/* Running shimmer */}
        {isRunning && (
          <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
            <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-shimmer bg-[length:200%_100%]" />
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isRunning ? "Running your automation…" : placeholder}
          disabled={isRunning || disabled}
          rows={1}
          className={cn(
            "w-full resize-none bg-transparent px-4 pt-4 pb-12",
            "text-sm leading-relaxed text-zinc-800 dark:text-zinc-100",
            "placeholder:text-zinc-400 dark:placeholder:text-zinc-500",
            "focus:outline-none disabled:cursor-not-allowed",
            "transition-all"
          )}
        />

        {/* Footer bar */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 pb-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
            <Zap className="w-3 h-3" />
            <span>Shift+Enter for new line</span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!value.trim() || isRunning || disabled}
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-xl transition-all",
              "disabled:opacity-30 disabled:cursor-not-allowed",
              value.trim() && !isRunning
                ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:scale-105 active:scale-95 shadow-sm"
                : "bg-zinc-200 dark:bg-zinc-700 text-zinc-400"
            )}
          >
            {isRunning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowUp className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      <p className="text-xs text-center text-zinc-400 dark:text-zinc-500">
        Describe what you want to automate in plain English
      </p>
    </div>
  );
}
