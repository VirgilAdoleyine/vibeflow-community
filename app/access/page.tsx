"use client";

import { useState } from "react";
import { Zap, Lock, ShieldCheck, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AccessPage() {
  const [secret, setSecret] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Set the cookie for middleware and localStorage for the client
      document.cookie = `v_secret=${secret}; path=/; max-age=${60 * 60 * 24 * 30}`;
      localStorage.setItem("v_secret", secret);
      
      // Navigate to homepage
      router.push("/");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-zinc-100">
      
      <div className="w-full max-w-sm space-y-8 animate-fade-in text-center">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-white flex items-center justify-center shadow-2xl">
            <Zap className="w-8 h-8 text-zinc-900" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Access VibeFlow</h1>
          <p className="text-zinc-400 text-sm">
            Please enter your access secret to proceed.
          </p>
        </div>

        {/* Access Form */}
        <form onSubmit={handleAccess} className="space-y-4">
          <div className="group relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-zinc-300 transition-colors">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type="password"
              placeholder="Enter your secret"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="w-full h-12 bg-zinc-900 border border-zinc-800 rounded-2xl pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-transparent transition-all placeholder:text-zinc-600"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-white text-zinc-900 rounded-2xl text-sm font-semibold hover:bg-zinc-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
          >
            {isLoading ? "Unlocking..." : "Enter Workspace"}
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </form>

        {/* Security badges */}
        <div className="pt-8 border-t border-zinc-900 flex justify-center gap-6">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-semibold text-zinc-600">
            <ShieldCheck className="w-3.5 h-3.5" />
            Vercel Secure
          </div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-semibold text-zinc-600">
            <Lock className="w-3.5 h-3.5" />
            E2B Sandboxed
          </div>
        </div>
      </div>
    </div>
  );
}
