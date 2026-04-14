import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  label: string;
  value: string | number;
  loading: boolean;
}

export function StatCard({ label, value, loading }: StatCardProps) {
  return (
    <Card size="sm">
      <CardContent className="pt-3">
        {loading ? (
          <>
            <Skeleton className="h-7 w-16 mb-1" />
            <Skeleton className="h-3 w-24" />
          </>
        ) : (
          <>
            <p className="font-mono font-semibold text-2xl tracking-tight text-foreground">
              {value}
            </p>
            <p className="font-mono text-xs text-muted-foreground mt-0.5 tracking-wide">
              {label}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
