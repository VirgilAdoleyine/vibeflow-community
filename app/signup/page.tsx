"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, Lock, Mail, Key, AlertCircle, Check, Loader2 } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [openrouterKey, setOpenrouterKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!openrouterKey.startsWith("sk-or-")) {
      setError("OpenRouter API key must start with 'sk-or-'");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, openrouter_api_key: openrouterKey }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Signup failed");
        return;
      }

      router.push("/signin?registered=true");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-zinc-100">
      <div className="w-full max-w-sm space-y-8 animate-fade-in text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-white flex items-center justify-center shadow-2xl">
            <Zap className="w-8 h-8 text-zinc-900" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Create Account</h1>
          <p className="text-zinc-400 text-sm">
            Get started with your own VibeFlow account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 bg-zinc-900 border border-zinc-800 rounded-2xl pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-transparent transition-all placeholder:text-zinc-600"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 bg-zinc-900 border border-zinc-800 rounded-2xl pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-transparent transition-all placeholder:text-zinc-600"
                required
                minLength={6}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-12 bg-zinc-900 border border-zinc-800 rounded-2xl pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-transparent transition-all placeholder:text-zinc-600"
                required
                minLength={6}
              />
            </div>
          </div>

          <div className="p-4 bg-amber-900/20 border border-amber-800/50 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Key className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-amber-400">
                OpenRouter API Key Required
              </span>
            </div>
            <p className="text-xs text-amber-200/70 mb-3">
              You must provide your own OpenRouter API key from day one. 
              Get one free at openrouter.ai or use your existing key.
            </p>
            <input
              type="password"
              placeholder="sk-or-v1-..."
              value={openrouterKey}
              onChange={(e) => setOpenrouterKey(e.target.value)}
              className="w-full h-10 bg-zinc-900 border border-zinc-700 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
              required
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-white text-zinc-900 rounded-2xl text-sm font-semibold hover:bg-zinc-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p className="text-zinc-500 text-sm">
          Already have an account?{" "}
          <button
            onClick={() => router.push("/signin")}
            className="text-white hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
