"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export interface AuthGuardResult {
  token: string | null;
  role: "user" | "admin" | null;
}

export function useAuthGuard(requireAdmin: boolean = false): AuthGuardResult {
  const router = useRouter();
  const { token, role } = useAuth();

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }
    if (requireAdmin && role !== "admin") {
      router.replace("/");
    }
  }, [token, role, requireAdmin, router]);

  return { token, role };
}
