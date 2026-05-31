"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function Footer() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await authClient.getSession();
        if (res?.data) {
          setUser(res.data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Session error in footer:", err);
      }
    };
    fetchSession();
  }, [pathname]);

  return (
    <footer className="border-t border-border py-8 px-4 bg-card-bg transition-colors duration-250 font-mono text-[10px] text-on-surface-variant select-none">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="font-serif text-sm font-semibold text-primary">Robert Heinze Thoughts</div>
        <div className="flex gap-4">
          <Link href="/articles" className="hover:text-primary transition-colors">Articles</Link>
          <Link href="/books" className="hover:text-primary transition-colors">Books</Link>
          <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
          <Link href="/cookie" className="hover:text-primary transition-colors">Cookies</Link>
          {user && user.role === "admin" && (
            <Link href="/admin" className="hover:text-primary transition-colors">Console</Link>
          )}
        </div>
        <div className="text-zinc-500">© {new Date().getFullYear()} Robert Heinze. All rights reserved.</div>
      </div>
    </footer>
  );
}
