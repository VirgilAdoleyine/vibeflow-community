"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { RefreshCw, ExternalLink, Loader2, Search, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Integration } from "@/types/integration";

interface ConnectorListProps {
  className?: string;
}

const PROVIDER_TO_APP: Record<string, string> = {
  slack: "slack",
  hubspot: "hubspot",
  notion: "notion",
  gmail: "gmail",
  airtable: "airtable",
  googlesheets: "googlesheets",
  googledrive: "googledrive",
  googlecalendar: "googlecalendar",
  github: "github",
  salesforce: "salesforce",
  jira: "jira",
  discord: "discord",
  calendly: "calendly",
  trello: "trello",
  asana: "asana",
  outlook: "outlook",
  supabase: "supabase",
  apaleo: "apaleo",
  attio: "attio",
  basecamp: "basecamp",
  boldsign: "boldsign",
  blackbaud: "blackbaud",
  googlesuper: "googlesuper",
  discordbot: "discordbot",
};

export function ConnectorList({ className }: ConnectorListProps) {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [connecting, setConnecting] = useState<string | null>(null);

  const fetchIntegrations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/integrations");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setIntegrations(data.integrations ?? []);
    } catch (err) {
      console.error("[ConnectorList] Failed to fetch integrations:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const filteredIntegrations = useMemo(() => {
    if (!searchQuery.trim()) return integrations;
    const query = searchQuery.toLowerCase();
    return integrations.filter(
      (i) =>
        i.display_name.toLowerCase().includes(query) ||
        i.description.toLowerCase().includes(query) ||
        i.provider.toLowerCase().includes(query)
    );
  }, [integrations, searchQuery]);

  const handleConnect = useCallback(async (integration: Integration) => {
    const appName = PROVIDER_TO_APP[integration.provider] || integration.provider;
    setConnecting(integration.provider);
    try {
      const res = await fetch("/api/integrations/composio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "authorize", appName }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    } catch (err) {
      console.error("[ConnectorList] Failed to connect:", err);
    } finally {
      setConnecting(null);
    }
  }, []);

  if (loading) {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Search apps..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-9 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg pl-9 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all placeholder:text-zinc-400"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors"
          >
            <X className="w-3 h-3 text-zinc-400" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {filteredIntegrations.length} apps
        </p>
        <button
          onClick={fetchIntegrations}
          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {filteredIntegrations.map((integration) => (
          <div
            key={integration.id}
            className={cn(
              "flex flex-col p-3 rounded-xl border transition-all",
              "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-600"
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className="w-7 h-7 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                style={{ backgroundColor: `${integration.color}18` }}
              >
                {integration.icon}
              </span>
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">
                {integration.display_name}
              </p>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-3 flex-1">
              {integration.description}
            </p>
            {integration.status === "connected" ? (
              <button
                disabled
                className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
              >
                <Check className="w-3 h-3" />
                Connected
              </button>
            ) : (
              <button
                onClick={() => handleConnect(integration)}
                disabled={connecting === integration.provider}
                className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg text-xs font-medium bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {connecting === integration.provider ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <ExternalLink className="w-3 h-3" />
                )}
                Connect
              </button>
            )}
          </div>
        ))}
      </div>

      {filteredIntegrations.length === 0 && (
        <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-8">
          No apps found matching "{searchQuery}"
        </p>
      )}

      <p className="text-xs text-zinc-400 dark:text-zinc-500 pt-1">
        Connect apps to enable automation
      </p>
    </div>
  );
}
