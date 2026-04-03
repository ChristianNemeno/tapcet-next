"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Navbar() {
  const { name, role, logout } = useAuth();

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto max-w-4xl flex items-center justify-between px-4 h-14">
        <Link href="/" className="font-bold text-lg tracking-tight">
          Tapcet
        </Link>
        <nav className="flex items-center gap-3">
          {name ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  {name}
                  {role === "admin" && (
                    <Badge className="ml-2" variant="secondary">
                      admin
                    </Badge>
                  )}
                </Button>
              </Link>
              {role === "admin" && (
                <Link href="/admin">
                  <Button variant="ghost" size="sm">
                    Manage
                  </Button>
                </Link>
              )}
              <Button variant="outline" size="sm" onClick={logout}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Sign up</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
