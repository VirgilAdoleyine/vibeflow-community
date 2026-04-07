"use client";

import { useState, useEffect } from "react";
import { Settings, Key, X, Check, Loader2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      fetchUser();
    }
  }, [isOpen]);

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/user");
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        if (data.user.openrouter_api_key) {
          setApiKey(data.user.openrouter_api_key);
        }
      }
    } catch (err) {
      console.error("Failed to fetch user:", err);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openrouter_api_key: apiKey }),
      });
      if (res.ok) {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
      }
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <Settings className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
            </div>
            <h2 className="text-sm font-semibold">Settings</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
          >
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Signed in as <span className="font-medium text-zinc-700 dark:text-zinc-300">{user?.email}</span>
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              OpenRouter API Key
            </label>
            <div className="relative group">
              <Key className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-zinc-100 transition-colors" />
              <input 
                type="password"
                placeholder="sk-or-v1-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full h-11 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-transparent transition-all"
              />
            </div>
            <p className="text-[10px] text-zinc-400 leading-relaxed">
              Get a key at openrouter.ai — required to use the automation features.
            </p>
          </div>

          <a 
            href="https://openrouter.ai/keys" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            Get an API key <ExternalLink className="w-3 h-3" />
          </a>

          <div className="flex items-center gap-2 pt-4">
            <button
              onClick={handleSave}
              disabled={loading}
              className={cn(
                "flex-1 h-11 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all",
                isSaved 
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 active:scale-[0.98]"
              )}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : isSaved ? <><Check className="w-4 h-4" /> Saved</> : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
