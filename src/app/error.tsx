"use client";

import React, { useEffect } from "react";
import { ShieldAlert, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

function getBrowserDetails() {
  if (typeof window === "undefined") {
    return { device: "server", browser: "server", os: "server" };
  }
  
  const ua = navigator.userAgent;
  let device = "Desktop";
  if (/mobile/i.test(ua)) device = "Mobile";
  if (/tablet|ipad/i.test(ua)) device = "Tablet";

  let browser = "Unknown";
  if (ua.indexOf("Firefox") > -1) browser = "Firefox";
  else if (ua.indexOf("SamsungBrowser") > -1) browser = "Samsung Browser";
  else if (ua.indexOf("Opera") > -1 || ua.indexOf("OPR") > -1) browser = "Opera";
  else if (ua.indexOf("Edge") > -1) browser = "Edge";
  else if (ua.indexOf("Chrome") > -1) browser = "Chrome";
  else if (ua.indexOf("Safari") > -1) browser = "Safari";

  let os = "Unknown";
  if (ua.indexOf("Windows NT 10.0") > -1) os = "Windows 10/11";
  else if (ua.indexOf("Windows NT 6.2") > -1) os = "Windows 8";
  else if (ua.indexOf("Windows NT 6.1") > -1) os = "Windows 7";
  else if (ua.indexOf("Macintosh") > -1) os = "macOS";
  else if (ua.indexOf("Android") > -1) os = "Android";
  else if (ua.indexOf("iPhone") > -1) os = "iOS (iPhone)";
  else if (ua.indexOf("iPad") > -1) os = "iOS (iPad)";
  else if (ua.indexOf("Linux") > -1) os = "Linux";

  return { device, browser, os };
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to console for local debugging
    console.error("Unhandled client-side runtime error caught:", error);

    const reportCrashToServer = async () => {
      try {
        let userEmail = null;
        let loginStatus = false;
        
        // Retrieve current authentication session
        try {
          const sessionRes = await fetch("/api/auth/get-session");
          if (sessionRes.ok) {
            const sessionData = await sessionRes.json();
            if (sessionData && sessionData.user) {
              userEmail = sessionData.user.email;
              loginStatus = true;
            }
          }
        } catch (e) {
          console.warn("Failed to check authentication status during crash log:", e);
        }

        const details = getBrowserDetails();

        // Send payload to backend
        await fetch("/api/crashes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            errorMessage: error.message || String(error),
            errorStack: error.stack || null,
            componentStack: error.digest || null,
            url: typeof window !== "undefined" ? window.location.href : null,
            device: details.device,
            browser: details.browser,
            os: details.os,
            userEmail,
            loginStatus
          })
        });
      } catch (err) {
        console.error("Failed to report crash log to Server Console:", err);
      }
    };

    reportCrashToServer();
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[75vh] px-4 font-mono select-text">
      
      {/* Visual Terminal Boundary Box */}
      <div className="max-w-xl w-full border border-red-500/30 bg-card-bg/25 p-8 shadow-xl text-center relative overflow-hidden">
        
        {/* Decorative blinking status light */}
        <div className="absolute top-0 left-0 w-full h-0.5 bg-red-500/40 animate-pulse" />
        
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full">
            <ShieldAlert className="h-8 w-8 animate-pulse" />
          </div>
        </div>

        <h1 className="text-xl font-bold tracking-tight text-foreground mb-2">
          CRITICAL_SYSTEM_CRASH
        </h1>
        
        <p className="text-[10px] text-red-400 uppercase tracking-widest mb-6">
          Unhandled Application Error Intercepted
        </p>

        {/* Real Error Diagnostic Box */}
        <div className="bg-red-950/10 dark:bg-red-950/20 border border-red-500/15 p-4 rounded-sm mb-6 text-left text-[11px] leading-relaxed text-zinc-400">
          <div className="text-red-400/80 font-bold mb-1">// Error Diagnostics</div>
          <div className="font-bold text-foreground break-all">&gt; Message: {error.message || "Unknown error"}</div>
          {error.digest && (
            <div className="text-zinc-500">&gt; Digest Hash: {error.digest}</div>
          )}
          <div className="text-zinc-500 mt-2 font-serif text-[10px] italic leading-normal select-none">
            This exception has been automatically recorded in the Server Logs Console. Heinze administrators will review it for fix release.
          </div>
        </div>

        {/* Control buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center text-xs">
          <button 
            onClick={() => reset()}
            className="px-4 py-2 border border-primary bg-primary/10 text-primary hover:bg-primary/25 transition-all font-bold tracking-wider uppercase inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reload Segment
          </button>
          
          <Link 
            href="/"
            className="px-4 py-2 border border-border bg-background hover:border-zinc-500 text-foreground transition-all tracking-wider uppercase inline-flex items-center justify-center gap-1.5"
          >
            <Home className="h-3.5 w-3.5" />
            Return Home
          </Link>
        </div>

      </div>

    </div>
  );
}
