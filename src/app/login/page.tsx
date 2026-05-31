"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useToast } from "@/context/ToastContext";
import { ArrowRight, Mail, Lock, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    setErrorMsg("");

    try {
      const { data, error } = await authClient.signIn.email({
        email,
        password,
        callbackURL: "/"
      });

      if (error) {
        setErrorMsg(error.message || "Invalid credentials.");
      } else {
        toast.success("Logged in successfully!");
        router.push("/");
        router.refresh();
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16 bg-background font-sans select-none">
      <div className="w-full max-w-sm border border-border bg-card-bg p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link 
            href="/" 
            className="font-serif text-xl font-semibold tracking-tight text-primary hover:opacity-85"
          >
            Robert Heinze
          </Link>
          <h2 className="text-xl font-bold font-serif text-foreground mt-2">
            Welcome back
          </h2>
          <p className="text-[11px] text-on-surface-variant font-mono">
            Enter details to access your reader account
          </p>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="border border-red-500/20 bg-red-500/5 p-3 font-mono text-[10px] text-red-500 leading-normal">
            Error: {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4 font-mono text-xs">
          <div className="space-y-1">
            <label className="text-zinc-500 block">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                <Mail className="h-3.5 w-3.5" />
              </span>
              <input
                type="email"
                required
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full border border-border bg-background pl-9 pr-3 py-2 text-foreground outline-hidden focus:border-primary placeholder-zinc-500 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-zinc-500 block">Password</label>
              <a href="#" className="text-[10px] text-primary hover:underline">Forgot?</a>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                <Lock className="h-3.5 w-3.5" />
              </span>
              <input
                type="password"
                required
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-border bg-background pl-9 pr-3 py-2 text-foreground outline-hidden focus:border-primary placeholder-zinc-500 disabled:opacity-50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-2 font-bold hover:bg-primary/95 transition-colors uppercase tracking-widest text-[10px] flex items-center justify-center gap-1 mt-6 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Toggle Link */}
        <div className="text-center text-[10px] font-mono text-on-surface-variant pt-2 border-t border-border/40">
          <span>New reader? </span>
          <Link href="/signup" className="text-primary font-bold hover:underline">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
