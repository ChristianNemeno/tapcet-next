"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ErrorAlert";

export default function RegisterPage() {
  const router = useRouter();
  const { login: setAuth } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await register(email, password, name);
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
          Create account<span className="text-primary">.</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Join Tapcet and track your scores.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <ErrorAlert message={error} />
        <div className="space-y-1.5">
          <Label htmlFor="name" className="font-mono text-xs tracking-tight">
            Name
          </Label>
          <Input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="font-mono text-sm"
          />
        </div>
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
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="font-mono text-sm"
          />
        </div>
        <Button type="submit" className="w-full font-mono text-xs tracking-tight" disabled={loading}>
          {loading ? "creating account..." : "sign up"}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground text-center mt-8">
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:underline underline-offset-4">
          Log in
        </Link>
      </p>
    </div>
  );
}
