"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
  type Node,
  type Edge,
  type Connection,
  MarkerType,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  AutomationNode,
  type AutomationNodeData,
  type NodeStatus,
} from "./nodes/AutomationNode";
import { StageIndicator } from "./StageIndicator";
import { LayoutGrid, Plus, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentStreamEvent, AgentStage } from "@/types/agent";

// ── Types ────────────────────────────────────────────────────────────────────

interface NodeCanvasProps {
  events: AgentStreamEvent[];
  stage: AgentStage;
  onRerunStep: (stepIndex: number, script: string) => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const NODE_WIDTH = 288;   // matches w-72 = 288px
const NODE_GAP   = 80;
const STEP_STRIDE = NODE_WIDTH + NODE_GAP;

function stageToStatus(stage: AgentStage, isCurrent: boolean): NodeStatus {
  if (!isCurrent) return "pending";
  if (stage === "executing") return "running";
  if (stage === "done")      return "success";
  if (stage === "error")     return "error";
  return "pending";
}

// Build React Flow node list from streamed events
function buildNodes(
  events: AgentStreamEvent[],
  stage: AgentStage,
  onRerun: (stepIndex: number, script: string) => void,
  onScriptChange: (stepIndex: number, script: string) => void
): Node<AutomationNodeData>[] {
  // Find the latest plan
  const planEvent = [...events].reverse().find((e) => e.plan && e.plan.length > 0);
  if (!planEvent?.plan) return [];

  const plan = planEvent.plan;

  // Collect script + result per step index from events
  const stepData: Record<number, { script?: string; result?: unknown; error?: string }> = {};
  let stepCursor = 0;

  for (const e of events) {
    if (e.stage === "executing") {
      if (e.script) {
        stepData[stepCursor] = { ...stepData[stepCursor], script: e.script };
      }
      if (e.output) {
        stepData[stepCursor] = { ...stepData[stepCursor], result: e.output };
        stepCursor = Math.min(stepCursor + 1, plan.length - 1);
      }
      if (e.error) {
        stepData[stepCursor] = { ...stepData[stepCursor], error: e.error };
      }
    }
  }

  // Current step = how many have a result
  const completedSteps = Object.values(stepData).filter((s) => s.result).length;

  return plan.map((label, i) => {
    const sd = stepData[i] ?? {};
    const isCurrent = i === completedSteps;
    const isComplete = !!sd.result;
    const hasError = !!sd.error;

    let status: NodeStatus = "pending";
    if (isComplete) status = "success";
    else if (hasError) status = "error";
    else if (isCurrent) status = stageToStatus(stage, true);

    return {
      id: `step-${i}`,
      type: "automationNode",
      position: { x: i * STEP_STRIDE, y: 80 },
      data: {
        stepIndex: i,
        label,
        script: sd.script ?? "",
        result: sd.result ?? null,
        error: sd.error,
        status,
        onRerun,
        onScriptChange,
      } as AutomationNodeData,
      draggable: true,
    };
  });
}

function buildEdges(nodeCount: number): Edge[] {
  return Array.from({ length: nodeCount - 1 }, (_, i) => ({
    id: `edge-${i}`,
    source: `step-${i}`,
    target: `step-${i + 1}`,
    type: "smoothstep",
    animated: true,
    style: { stroke: "#a1a1aa", strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#a1a1aa" },
  }));
}

const nodeTypes = { automationNode: AutomationNode };

// ── Main component ────────────────────────────────────────────────────────────

export function NodeCanvas({ events, stage, onRerunStep }: NodeCanvasProps) {
  const [scripts, setScripts] = useState<Record<number, string>>({});

  const handleScriptChange = useCallback((stepIndex: number, script: string) => {
    setScripts((prev) => ({ ...prev, [stepIndex]: script }));
    onRerunStep(stepIndex, script);
  }, [onRerunStep]);

  const handleRerun = useCallback((stepIndex: number, script: string) => {
    onRerunStep(stepIndex, scripts[stepIndex] ?? script);
  }, [onRerunStep, scripts]);

  const rawNodes = useMemo(
    () => buildNodes(events, stage, handleRerun, handleScriptChange),
    [events, stage, handleRerun, handleScriptChange]
  );
  const rawEdges = useMemo(() => buildEdges(rawNodes.length), [rawNodes.length]);

  const [nodes, setNodes, onNodesChange] = useNodesState(rawNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(rawEdges);

  // Sync when new events arrive
  useEffect(() => {
    setNodes(rawNodes);
  }, [rawNodes, setNodes]);

  useEffect(() => {
    setEdges(rawEdges);
  }, [rawEdges, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleExportJSON = useCallback(() => {
    const data = nodes.map((n) => ({
      step: (n.data as AutomationNodeData).stepIndex + 1,
      label: (n.data as AutomationNodeData).label,
      script: (n.data as AutomationNodeData).script,
      status: (n.data as AutomationNodeData).status,
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vibeflow-automation.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes]);

  if (events.length === 0) {
    return (
      <div className="w-full h-[500px] rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-center">
        <div className="text-center space-y-2">
          <LayoutGrid className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto" />
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            Nodes appear here once your automation runs
          </p>
        </div>
      </div>
    );
  }

  // Canvas width: enough to show all nodes
  const canvasHeight = 400;

  return (
    <div
      className="w-full rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-sm"
      style={{ height: canvasHeight }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.25, maxZoom: 1 }}
        minZoom={0.3}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
        className="bg-zinc-50 dark:bg-zinc-950"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="var(--rf-bg-color, #d4d4d8)"
          className="opacity-40"
        />
        <Controls
          className="!shadow-none !border !border-zinc-200 dark:!border-zinc-700 !rounded-xl overflow-hidden"
          showInteractive={false}
        />
        <MiniMap
          nodeColor={(node) => {
            const s = (node.data as AutomationNodeData).status;
            if (s === "success") return "#10b981";
            if (s === "error")   return "#ef4444";
            if (s === "running") return "#f59e0b";
            return "#a1a1aa";
          }}
          className="!border !border-zinc-200 dark:!border-zinc-700 !rounded-xl !bg-white dark:!bg-zinc-900"
          maskColor="rgba(0,0,0,0.05)"
        />

        {/* Top-right panel */}
        <Panel position="top-right">
          <div className="flex items-center gap-2">
            <StageIndicator stage={stage} />
            <button
              onClick={handleExportJSON}
              title="Export as JSON"
              className={cn(
                "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg",
                "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700",
                "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200",
                "shadow-sm transition-colors"
              )}
            >
              <Download className="w-3 h-3" />
              Export
            </button>
          </div>
        </Panel>

        {/* Bottom-left: node count */}
        <Panel position="bottom-left">
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 px-2 py-1 rounded-lg">
            {nodes.length} node{nodes.length !== 1 ? "s" : ""} · drag to rearrange · edit any script inline
          </span>
        </Panel>
      </ReactFlow>
    </div>
  );
}
