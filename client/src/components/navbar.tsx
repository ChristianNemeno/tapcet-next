"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { name, role, logout } = useAuth();

  return (
    <header className="border-b border-border">
      <div className="mx-auto max-w-3xl flex items-center justify-between px-6 h-16">
        <Link href="/" className="group flex items-center gap-1.5">
          <span className="font-mono font-semibold text-base tracking-tight">
            tapcet
          </span>
          <span className="text-primary font-mono animate-blink">_</span>
        </Link>
        <nav className="flex items-center gap-1">
          {name ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="font-mono text-xs tracking-tight">
                  {name}
                  {role === "admin" && (
                    <span className="ml-1.5 text-primary font-medium">[admin]</span>
                  )}
                </Button>
              </Link>
              <Link href="/quiz/create">
                <Button variant="ghost" size="sm" className="font-mono text-xs tracking-tight">
                  create
                </Button>
              </Link>
              {role === "admin" && (
                <Link href="/admin">
                  <Button variant="ghost" size="sm" className="font-mono text-xs tracking-tight">
                    manage
                  </Button>
                </Link>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="font-mono text-xs tracking-tight text-muted-foreground"
              >
                log out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="font-mono text-xs tracking-tight">
                  log in
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="font-mono text-xs tracking-tight">
                  sign up
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
