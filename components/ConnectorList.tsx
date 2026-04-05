"use client";

import { useState, useEffect, useCallback } from "react";
import { Plug, PlugZap, RefreshCw, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Integration } from "@/types/integration";

interface ConnectorListProps {
  className?: string;
}

export function ConnectorList({ className }: ConnectorListProps) {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  const fetchIntegrations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/integrations");
      const data = await res.json();
      setIntegrations(data.integrations ?? []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  // Listen for Nango OAuth callback from popup
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "NANGO_CALLBACK") {
        setConnecting(null);
        fetchIntegrations();
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [fetchIntegrations]);

  const handleConnect = async (integration: Integration) => {
    const publicKey = process.env.NEXT_PUBLIC_NANGO_PUBLIC_KEY;
    if (!publicKey) {
      alert("Nango public key not configured. Set NEXT_PUBLIC_NANGO_PUBLIC_KEY in .env.local");
      return;
    }

    setConnecting(integration.provider);
    const appUrl = window.location.origin;
    const url = `https://api.nango.dev/oauth/connect/${integration.provider}?public_key=${publicKey}&connection_id=demo-user&redirect_uri=${appUrl}/api/nango/callback`;

    const popup = window.open(url, "nango-oauth", "width=500,height=700,menubar=no,toolbar=no");
    if (!popup) {
      alert("Popup blocked. Please allow popups for this site.");
      setConnecting(null);
    }
  };

  const handleDisconnect = async (integration: Integration) => {
    try {
      await fetch(`/api/integrations/${integration.provider}`, { method: "DELETE" });
      fetchIntegrations();
    } catch {
      // silently fail
    }
  };

  if (loading) {
    return (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-14 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Connected apps
        </h3>
        <button
          onClick={fetchIntegrations}
          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {integrations.map((integration) => {
        const isConnected = integration.status === "connected";
        const isConnecting = connecting === integration.provider;

        return (
          <div
            key={integration.id}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl border transition-all",
              isConnected
                ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
                : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-600"
            )}
          >
            {/* Icon */}
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
              style={{ backgroundColor: `${integration.color}18` }}
            >
              {integration.icon}
            </span>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100 leading-tight">
                {integration.display_name}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                {integration.description}
              </p>
            </div>

            {/* Action */}
            {isConnected ? (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <PlugZap className="w-3 h-3" />
                  Live
                </span>
                <button
                  onClick={() => handleDisconnect(integration)}
                  className="text-xs text-zinc-400 hover:text-red-500 transition-colors ml-1"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleConnect(integration)}
                disabled={isConnecting}
                className={cn(
                  "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all",
                  "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900",
                  "hover:bg-zinc-700 dark:hover:bg-zinc-100 active:scale-95",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Connecting…
                  </>
                ) : (
                  <>
                    <Plug className="w-3 h-3" />
                    Connect
                  </>
                )}
              </button>
            )}
          </div>
        );
      })}

      <p className="text-xs text-zinc-400 dark:text-zinc-500 pt-1">
        OAuth is handled by{" "}
        <a
          href="https://nango.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-zinc-600 dark:hover:text-zinc-300 inline-flex items-center gap-0.5"
        >
          Nango <ExternalLink className="w-2.5 h-2.5" />
        </a>{" "}
        — your credentials are never stored here.
      </p>
    </div>
  );
}
