"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { name, role, logout } = useAuth();

  return (
    <header className="navbar sticky top-0 z-50 border-b border-border/60">
      <div className="mx-auto max-w-5xl flex items-center justify-between px-6 h-16">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="size-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
            <span className="text-primary font-bold text-sm leading-none">T</span>
          </span>
          <span className="font-bold text-base tracking-tight">
            tapcet
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {name ? (
            <>
              <Link href="/quiz/create">
                <Button variant="ghost" size="sm" className="text-xs font-medium hidden sm:inline-flex">
                  + Create Quiz
                </Button>
              </Link>
              {role === "admin" && (
                <Link href="/admin">
                  <Button variant="ghost" size="sm" className="text-xs font-medium">
                    Manage
                  </Button>
                </Link>
              )}
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-xs font-medium gap-2">
                  <span className="size-6 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
                    <span className="text-primary font-mono font-bold text-xs leading-none">
                      {(name[0] ?? "?").toUpperCase()}
                    </span>
                  </span>
                  <span className="hidden sm:inline">{name}</span>
                  {role === "admin" && (
                    <span className="font-mono text-xs text-primary/80 font-semibold hidden sm:inline">
                      ·admin
                    </span>
                  )}
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Log out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-xs font-medium">
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="text-xs font-medium">
                  Sign up
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
