"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Zap, Lock, Mail, AlertCircle, Loader2 } from "lucide-react";

export default function SigninPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Sign in failed");
        return;
      }

      router.push("/");
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
          <h1 className="text-2xl font-bold tracking-tight">Welcome Back</h1>
          <p className="text-zinc-400 text-sm">
            Sign in to continue to your workspace
          </p>
        </div>

        {registered && (
          <div className="p-3 bg-green-900/20 border border-green-800/50 rounded-xl text-sm text-green-400">
            Account created! Please sign in.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
              "Sign In"
            )}
          </button>
        </form>

        <p className="text-zinc-500 text-sm">
          Don't have an account?{" "}
          <button
            onClick={() => router.push("/signup")}
            className="text-white hover:underline"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}
