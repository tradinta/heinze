"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmConfig, setConfirmConfig] = useState<{
    resolve: (value: boolean) => void;
    options: ConfirmOptions;
  } | null>(null);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const success = useCallback((msg: string) => toast(msg, "success"), [toast]);
  const error = useCallback((msg: string) => toast(msg, "error"), [toast]);
  const info = useCallback((msg: string) => toast(msg, "info"), [toast]);
  const warning = useCallback((msg: string) => toast(msg, "warning"), [toast]);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirmConfig({
        resolve,
        options
      });
    });
  }, []);

  return (
    <ToastContext.Provider value={{ toast, success, error, info, warning, confirm }}>
      {children}
      
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none select-none font-mono">
        <AnimatePresence>
          {toasts.map((t) => {
            let icon = <Info className="h-4 w-4 shrink-0 text-primary" />;
            let borderColor = "border-border";
            let bgColor = "bg-background";
            
            if (t.type === "success") {
              icon = <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />;
              borderColor = "border-emerald-500/30";
              bgColor = "bg-card-bg/95";
            } else if (t.type === "error") {
              icon = <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />;
              borderColor = "border-red-500/30";
              bgColor = "bg-card-bg/95";
            } else if (t.type === "warning") {
              icon = <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />;
              borderColor = "border-amber-500/30";
              bgColor = "bg-card-bg/95";
            } else {
              icon = <Info className="h-4 w-4 shrink-0 text-primary" />;
              borderColor = "border-primary/20";
              bgColor = "bg-card-bg/95";
            }

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`pointer-events-auto flex items-start justify-between gap-3 border ${borderColor} ${bgColor} p-3.5 shadow-xl rounded-none`}
              >
                <div className="flex gap-2.5 items-start">
                  <div className="mt-0.5">{icon}</div>
                  <div className="text-[11px] font-semibold text-foreground leading-normal break-words">
                    {t.message}
                  </div>
                </div>
                <button
                  onClick={() => removeToast(t.id)}
                  className="text-zinc-500 hover:text-foreground transition-colors p-0.5 shrink-0"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Confirmation Modal overlay */}
      <AnimatePresence>
        {confirmConfig && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-mono">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="border border-border bg-zinc-950 max-w-sm w-full p-5 space-y-4 shadow-2xl relative rounded-none"
            >
              <div className="space-y-2">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b border-border pb-1.5">
                  {confirmConfig.options.title || "Confirmation Required"}
                </h3>
                <p className="text-[11px] text-zinc-300 font-sans leading-relaxed">
                  {confirmConfig.options.message}
                </p>
              </div>
              <div className="flex gap-2 justify-end text-[9px] uppercase font-bold pt-1">
                <button
                  onClick={() => {
                    confirmConfig.resolve(false);
                    setConfirmConfig(null);
                  }}
                  className="px-3 py-1.5 border border-border hover:text-foreground text-zinc-400 bg-background/50 hover:bg-background transition-colors"
                >
                  {confirmConfig.options.cancelText || "Cancel"}
                </button>
                <button
                  onClick={() => {
                    confirmConfig.resolve(true);
                    setConfirmConfig(null);
                  }}
                  className={`px-3 py-1.5 border ${
                    confirmConfig.options.variant === "danger"
                      ? "border-red-500/30 bg-red-950/20 text-red-400 hover:bg-red-950/40"
                      : "border-primary bg-primary/10 text-primary hover:bg-primary/20"
                  } transition-colors`}
                >
                  {confirmConfig.options.confirmText || "Confirm"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
