"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/api/auth.api";
import { useAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ErrorAlert";

export default function LoginPage() {
  const router = useRouter();
  const { login: setAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login(email, password);
      setAuth(res.token, res.name, res.role, res.userId);
      router.push("/");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-20">
      <div className="mb-10">
        <h1 className="font-mono font-bold text-2xl tracking-tight mb-2">
          Log in<span className="text-primary">.</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Welcome back to Tapcet.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <ErrorAlert message={error} />
        <div className="space-y-1.5">
          <Label htmlFor="email" className="font-mono text-xs tracking-tight">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="font-mono text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password" className="font-mono text-xs tracking-tight">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="font-mono text-sm"
          />
        </div>
        <Button type="submit" className="w-full font-mono text-xs tracking-tight" disabled={loading}>
          {loading ? "logging in..." : "log in"}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground text-center mt-8">
        No account?{" "}
        <Link href="/register" className="text-primary hover:underline underline-offset-4">
          Sign up
        </Link>
      </p>
    </div>
  );
}
