"use client";

import { memo, useState, useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  Play,
  CheckCircle2,
  XCircle,
  Loader2,
  Code2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Pencil,
  Save,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type NodeStatus = "pending" | "running" | "success" | "error" | "skipped";

export interface AutomationNodeData {
  stepIndex: number;
  label: string;
  script: string;
  result: React.ReactNode;
  status: NodeStatus;
  error?: string;
  onRerun: (stepIndex: number, script: string) => void;
  onScriptChange: (stepIndex: number, script: string) => void;
  [key: string]: unknown;
}

const STATUS_STYLES: Record<NodeStatus, string> = {
  pending:  "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900",
  running:  "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30",
  success:  "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30",
  error:    "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30",
  skipped:  "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 opacity-50",
};

const STATUS_ICON: Record<NodeStatus, React.ReactNode> = {
  pending:  <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-600" />,
  running:  <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" />,
  success:  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
  error:    <XCircle className="w-3.5 h-3.5 text-red-500" />,
  skipped:  <div className="w-2 h-2 rounded-full bg-zinc-200 dark:bg-zinc-700" />,
};

function ResultPreview({ result }: { result: unknown }) {
  if (!result) return null;
  const str =
    typeof result === "string" ? result : JSON.stringify(result, null, 2);
  const preview = str.length > 200 ? str.slice(0, 200) + "…" : str;
  return (
    <pre className="mt-2 p-2 rounded-lg bg-zinc-950 text-zinc-300 text-[10px] leading-relaxed overflow-x-auto max-h-28 border border-zinc-800 whitespace-pre-wrap break-all">
      {preview}
    </pre>
  );
}

export const AutomationNode = memo(function AutomationNode({
  data,
}: NodeProps) {
  const d = data as unknown as AutomationNodeData;
  const [showScript, setShowScript] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftScript, setDraftScript] = useState(d.script);

  const handleSave = useCallback(() => {
    d.onScriptChange(d.stepIndex, draftScript);
    setEditing(false);
  }, [d, draftScript]);

  const handleCancel = useCallback(() => {
    setDraftScript(d.script);
    setEditing(false);
  }, [d.script]);

  const handleRerun = useCallback(() => {
    d.onRerun(d.stepIndex, d.script);
  }, [d]);

  return (
    <div
      className={cn(
        "w-72 rounded-2xl border shadow-sm transition-all duration-200",
        STATUS_STYLES[d.status],
        "hover:shadow-md"
      )}
    >
      {/* Incoming handle */}
      {d.stepIndex > 0 && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-zinc-300 dark:!bg-zinc-600 !border-2 !border-white dark:!border-zinc-900"
        />
      )}

      {/* Header */}
      <div className="flex items-start gap-2.5 px-4 pt-4 pb-3">
        <div className="mt-0.5 flex-shrink-0">{STATUS_ICON[d.status as NodeStatus] as React.ReactNode}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Step {d.stepIndex + 1}
            </span>
          </div>
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100 leading-snug">
            {d.label}
          </p>
        </div>
      </div>

      {/* Script section */}
      {d.script && (
        <div className="px-4 pb-3">
          <button
            onClick={() => setShowScript((s) => !s)}
            className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors w-full"
          >
            <Code2 className="w-3 h-3" />
            <span className="flex-1 text-left">
              {editing ? "Editing script…" : "Script"}
            </span>
            {showScript ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>

          {showScript && (
            <div className="mt-2">
              {editing ? (
                <>
                  <textarea
                    className="w-full p-2.5 rounded-lg bg-zinc-950 text-zinc-200 text-[11px] font-mono leading-relaxed border border-zinc-700 focus:outline-none focus:border-zinc-500 resize-none"
                    rows={10}
                    value={draftScript}
                    onChange={(e) => setDraftScript(e.target.value)}
                    spellCheck={false}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors"
                    >
                      <Save className="w-3 h-3" />
                      Save &amp; re-run
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-500 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors"
                    >
                      <X className="w-3 h-3" />
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <pre className="p-2.5 rounded-lg bg-zinc-950 text-zinc-300 text-[11px] font-mono leading-relaxed overflow-x-auto max-h-48 border border-zinc-800 whitespace-pre">
                    {d.script}
                  </pre>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => {
                        setDraftScript(d.script);
                        setEditing(true);
                      }}
                      className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors"
                    >
                      <Pencil className="w-3 h-3" />
                      Edit
                    </button>
                    <button
                      onClick={handleRerun}
                      className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Re-run
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Result section */}
      {d.result && (
        <div className="px-4 pb-3">
          <button
            onClick={() => setShowResult((s) => !s)}
            className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors w-full"
          >
            <CheckCircle2 className="w-3 h-3" />
            <span className="flex-1 text-left">Result</span>
            {showResult ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
          {showResult && <ResultPreview result={d.result} />}
        </div>
      )}

      {/* Error */}
      {d.error && (
        <div className="mx-4 mb-3 p-2 rounded-lg bg-red-100 dark:bg-red-950/50 border border-red-200 dark:border-red-800">
          <p className="text-[11px] text-red-600 dark:text-red-400 font-mono leading-relaxed">
            {d.error}
          </p>
        </div>
      )}

      {/* Footer actions */}
      <div className="flex items-center justify-between px-4 pb-3 pt-1 border-t border-zinc-100 dark:border-zinc-800">
        <span
          className={cn(
            "text-[10px] font-medium uppercase tracking-wider",
            d.status === "success" && "text-emerald-500",
            d.status === "error" && "text-red-500",
            d.status === "running" && "text-amber-500",
            d.status === "pending" && "text-zinc-400 dark:text-zinc-500"
          )}
        >
          {d.status}
        </span>
        {(d.status === "error" || d.status === "success") && (
          <button
            onClick={handleRerun}
            className="flex items-center gap-1 text-[10px] text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            <Play className="w-2.5 h-2.5" />
            Re-run
          </button>
        )}
      </div>

      {/* Outgoing handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-zinc-300 dark:!bg-zinc-600 !border-2 !border-white dark:!border-zinc-900"
      />
    </div>
  );
});
