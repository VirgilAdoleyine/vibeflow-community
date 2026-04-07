"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Zap,
  History,
  Settings,
  ChevronRight,
  RotateCcw,
  LayoutGrid,
  List,
  Plus,
  LogOut,
  Folder,
} from "lucide-react";
import { CommandBar } from "@/components/CommandBar";
import { StatusFeed } from "@/components/StatusFeed";
import { NodeCanvas } from "@/components/NodeCanvas";
import { ConnectorList } from "@/components/ConnectorList";
import { SettingsModal } from "@/components/SettingsModal";
import { ConfirmModal } from "@/components/ConfirmModal";
import { cn } from "@/lib/utils";
import type { AgentStreamEvent, AgentStage } from "@/types/agent";

const EXAMPLE_PROMPTS = [
  "Summarize unread Slack messages",
  "Sync new HubSpot contacts to Notion",
  "Draft a reply to my latest Gmail",
  "List items from my Airtable base",
  "Create a new row in Google Sheets",
  "Get files from my Google Drive",
  "Check my Google Calendar for today",
  "List open GitHub issues",
];

interface Session {
  id: string;
  title: string;
  updated_at: string;
}

interface HistoryItem {
  id: string;
  prompt: string;
  output: string;
  stage: AgentStage;
  timestamp: Date;
}

type ViewMode = "timeline" | "canvas";

export default function HomePage() {
  const [stage, setStage] = useState<AgentStage>("idle");
  const [events, setEvents] = useState<AgentStreamEvent[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [sidebarTab, setSidebarTab] = useState<"sessions" | "connectors">("sessions");
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<string[]>([]);
  const [pendingPrompt, setPendingPrompt] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  
  const abortRef = useRef<AbortController | null>(null);
  const runIdRef = useRef<string>("");

  useEffect(() => {
    fetchSessions();
    fetchHistory();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/sessions");
      const data = await res.json();
      setSessions(data.sessions || []);
      if (data.sessions?.length > 0 && !currentSession) {
        setCurrentSession(data.sessions[0]);
      }
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/executions");
      const data = await res.json();
      setHistory(
        (data.executions || []).map((e: any) => ({
          id: e.id,
          prompt: e.prompt,
          output: e.output || "",
          stage: e.stage as AgentStage,
          timestamp: new Date(e.created_at),
        }))
      );
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  const createNewSession = async () => {
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Workflow" }),
      });
      const data = await res.json();
      setSessions((prev) => [data.session, ...prev]);
      setCurrentSession(data.session);
      setHistory([]);
      setEvents([]);
      setStage("idle");
    } catch (err) {
      console.error("Failed to create session:", err);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/signin";
  };

  const startAutomationExecution = useCallback(
    async (prompt: string, stepIndex?: number, patchedScript?: string) => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      const runId = Date.now().toString();
      runIdRef.current = runId;

      const userApiKey = localStorage.getItem("openrouter_api_key") || "";

      if (stepIndex !== undefined) {
        setEvents((prev) => {
          const planEvent = prev.find((e) => e.plan);
          return planEvent ? [planEvent] : [];
        });
      } else {
        setEvents([]);
      }

      setStage("planning");

      try {
        const body =
          stepIndex !== undefined && patchedScript
            ? { prompt, stepIndex, patchedScript }
            : { prompt };

        const res = await fetch("/api/automate", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            ...(userApiKey ? { "x-user-api-key": userApiKey } : {})
          },
          body: JSON.stringify(body),
          signal: abortRef.current.signal,
        });

        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

        // Handle immediate JSON errors (rate limits, security blocks) returned with status 200
        const contentType = res.headers.get("Content-Type");
        if (contentType?.includes("application/json")) {
          const data = await res.json();
          if (data.error) {
            setStage("error");
            setEvents((prev) => [
              ...prev,
              { stage: "error", message: data.error },
            ]);
            return;
          }
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let finalOutput = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const event: AgentStreamEvent = JSON.parse(line.slice(6));
              if (runIdRef.current !== runId) return;
              
              // If we get a plan and we're NOT in a re-run, PAUSE and show confirm modal
              if (event.plan && stepIndex === undefined) {
                setPendingPlan(event.plan);
                setPendingPrompt(prompt);
                setIsConfirmOpen(true);
                setEvents([event]); // Keep the plan event for visualization
                setStage("idle");
                return; // Stop streaming until confirmed
              }

              setStage(event.stage);
              setEvents((prev) => [...prev, event]);
              if (event.stage === "done") finalOutput = event.message;
            } catch {
              // malformed SSE line — skip
            }
          }
        }

        if (finalOutput && runIdRef.current === runId) {
          setHistory((prev) => [
            {
              id: runId,
              prompt,
              output: finalOutput,
              stage: "done",
              timestamp: new Date(),
            },
            ...prev.slice(0, 19),
          ]);
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        if (runIdRef.current === runId) {
          setStage("error");
          setEvents((prev) => [
            ...prev,
            {
              stage: "error",
              message: "Connection failed",
              error: err instanceof Error ? err.message : "Unknown error",
            },
          ]);
        }
      }
    },
    []
  );

  const handleConfirmPlan = () => {
    setIsConfirmOpen(false);
    // Restart automation but skip planning (or let it re-plan quickly)
    // Actually, we'd need a specialized 'execute' route to bypass re-planning,
    // but for now, we'll just allow it to re-stream but we could optimize.
    // Let's just re-run it for now.
    startAutomationExecution(pendingPrompt);
  };

  const handleSubmit = useCallback(
    (prompt: string) => startAutomationExecution(prompt),
    [startAutomationExecution]
  );

  const handleRerunStep = useCallback(
    (stepIndex: number, script: string) => {
      const planEvent = events.find((e) => e.plan);
      if (!planEvent?.plan) return;
      const stepPrompt = planEvent.plan[stepIndex];
      if (stepPrompt) startAutomationExecution(stepPrompt, stepIndex, script);
    },
    [events, startAutomationExecution]
  );

  const handleReset = () => {
    abortRef.current?.abort();
    setStage("idle");
    setEvents([]);
  };

  const hasContent = events.length > 0;

  return (
    <>
    <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside className="w-72 flex-shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="w-7 h-7 rounded-lg bg-zinc-900 dark:bg-white flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-white dark:text-zinc-900" />
          </div>
          <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm tracking-tight">
            VibeFlow
          </span>
          <span className="ml-auto text-[10px] font-medium text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-700 rounded px-1.5 py-0.5">
            BETA
          </span>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-zinc-100 dark:border-zinc-800">
          {(["sessions", "connectors"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSidebarTab(tab)}
              className={cn(
                "flex-1 py-2.5 text-xs font-medium transition-colors",
                sidebarTab === tab
                  ? "text-zinc-900 dark:text-zinc-100 border-b-2 border-zinc-900 dark:border-zinc-100"
                  : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
              )}
            >
              {tab === "sessions" ? (
                <span className="flex items-center justify-center gap-1.5">
                  <Folder className="w-3 h-3" /> Workflows
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  <Settings className="w-3 h-3" /> Apps
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-4">
          {sidebarTab === "sessions" ? (
            <div className="space-y-2">
              <button
                onClick={createNewSession}
                className="w-full flex items-center justify-center gap-2 p-2 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-400 transition-all"
              >
                <Plus className="w-3 h-3" /> New Workflow
              </button>
              {sessions.length === 0 ? (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-8">
                  No workflows yet. Create one to get started.
                </p>
              ) : (
                sessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => setCurrentSession(session)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl border transition-all",
                      currentSession?.id === session.id
                        ? "border-zinc-900 dark:border-zinc-100 bg-zinc-100 dark:bg-zinc-800"
                        : "border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900"
                    )}
                  >
                    <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">
                      {session.title}
                    </p>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">
                      {new Date(session.updated_at).toLocaleDateString()}
                    </p>
                  </button>
                ))
              )}
            </div>
          ) : (
            <ConnectorList />
          )}
        </div>

        {/* User footer */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-xl text-xs text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
          >
            <LogOut className="w-3 h-3" /> Sign Out
          </button>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-600 text-center">
            Powered by LangGraph · E2B · Neon
          </p>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div>
            <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Automation
            </h1>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              Describe what you want — VibeFlow handles the rest
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View mode toggle */}
            {hasContent && (
              <div className="flex items-center gap-0.5 p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                <button
                  onClick={() => setViewMode("timeline")}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                    viewMode === "timeline"
                      ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                  )}
                >
                  <List className="w-3.5 h-3.5" />
                  Timeline
                </button>
                <button
                  onClick={() => setViewMode("canvas")}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                    viewMode === "canvas"
                      ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                  )}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  Nodes
                </button>
              </div>
            )}

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all hover:rotate-45"
            >
              <Settings className="w-4 h-4 text-zinc-400" />
            </button>

            {(stage === "done" || stage === "error") && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                New run
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

            {/* Hero */}
            {stage === "idle" && !hasContent && (
              <div className="text-center py-12 space-y-3 animate-fade-in">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 dark:bg-white flex items-center justify-center mx-auto shadow-lg">
                  <Zap className="w-6 h-6 text-white dark:text-zinc-900" />
                </div>
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                  What should I automate?
                </h2>
                <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto py-4">
                  {EXAMPLE_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSubmit(prompt)}
                      className="px-3.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-400 transition-all font-medium"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-sm mx-auto text-balance">
                  Describe your task in plain English. Switch to{" "}
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">Nodes</span>{" "}
                  view to see and edit individual steps.
                </p>
              </div>
            )}

            {/* Loading skeleton for nodes/canvas */}
            {stage === "planning" && (
              <div className="w-full h-48 bg-zinc-100 dark:bg-zinc-900/50 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 flex items-center justify-center animate-shimmer bg-gradient-to-r from-transparent via-zinc-200/50 dark:via-zinc-800/50 to-transparent">
                <p className="text-xs font-medium text-zinc-400">Architecting workflow...</p>
              </div>
            )}
            {/* Timeline view */}
            {hasContent && viewMode === "timeline" && (
              <div className="animate-slide-up">
                <StatusFeed events={events} stage={stage} />
              </div>
            )}

            {/* Node canvas view */}
            {hasContent && viewMode === "canvas" && (
              <div className="animate-slide-up">
                <NodeCanvas
                  events={events}
                  stage={stage}
                  onRerunStep={handleRerunStep}
                />
              </div>
            )}

            {/* Command bar */}
            <div className={cn(hasContent ? "pt-2" : "pt-0")}>
              <CommandBar
                onSubmit={handleSubmit}
                stage={stage}
                disabled={false}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
      
    <SettingsModal 
      isOpen={isSettingsOpen} 
      onClose={() => setIsSettingsOpen(false)} 
    />
    <ConfirmModal
      isOpen={isConfirmOpen}
      onClose={() => {
        setIsConfirmOpen(false);
        setPendingPlan([]);
      }}
      onConfirm={handleConfirmPlan}
      plan={pendingPlan}
    />
    </>
  );
}
