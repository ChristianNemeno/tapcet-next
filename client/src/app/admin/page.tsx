"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminQuizzesTab } from "./_components/AdminQuizzesTab";
import { AdminMockExamsTab } from "./_components/AdminMockExamsTab";
import { AdminReportsTab } from "./_components/AdminReportsTab";

export default function AdminPage() {
  const { token, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!token || role !== "admin") {
      router.replace("/");
    }
  }, [token, role, router]);

  if (!token || role !== "admin") return null;

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-10">
        <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase mb-2">
          Administration
        </p>
        <h1 className="font-mono font-bold text-2xl tracking-tight">
          Manage content<span className="text-primary">.</span>
        </h1>
      </div>

      <Tabs defaultValue="quizzes">
        <TabsList className="mb-8">
          <TabsTrigger value="quizzes" className="font-mono text-xs">Quizzes</TabsTrigger>
          <TabsTrigger value="mock-exams" className="font-mono text-xs">Mock Exams</TabsTrigger>
          <TabsTrigger value="reports" className="font-mono text-xs">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="quizzes">
          <AdminQuizzesTab token={token} />
        </TabsContent>
        <TabsContent value="mock-exams">
          <AdminMockExamsTab token={token} />
        </TabsContent>
        <TabsContent value="reports">
          <AdminReportsTab token={token} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
