"use client";

import { Play, X, ListTodo, ShieldCheck } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  plan: string[];
}

export function ConfirmModal({ isOpen, onClose, onConfirm, plan }: ConfirmModalProps) {
  if (!isOpen || plan.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-8 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <ListTodo className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
            </div>
            <h2 className="text-base font-bold tracking-tight">Review execution plan</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400 font-bold" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 space-y-4">
            {plan.map((step, i) => (
              <div key={i} className="flex gap-4 group">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-600 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
                  {i + 1}
                </span>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-300 transition-colors py-0.5">
                  {step}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex items-center gap-4 text-blue-700 dark:text-blue-300">
            <ShieldCheck className="w-5 h-5 flex-shrink-0" />
            <p className="text-xs leading-relaxed">
              VibeFlow will write and run the code for these steps in a secure E2B sandbox. 
              No changes will be made outside of the specified integrations.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-6">
            <button
              onClick={onConfirm}
              className="flex-1 h-12 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-sm font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <Play className="w-4 h-4 fill-current" />
              Execute Workflow
            </button>
            <button
              onClick={onClose}
              className="px-6 h-12 rounded-2xl text-sm font-semibold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all border border-transparent"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
