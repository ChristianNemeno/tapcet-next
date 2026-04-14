import Link from "next/link";
import type { MyCollectionSummary } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Props {
  myCollections: MyCollectionSummary[];
  loading: boolean;
  onDelete: (id: string) => void;
}

export function DashboardMyCollections({ myCollections, loading, onDelete }: Props) {
  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase mb-1">Created</p>
          <h2 className="font-mono font-bold text-xl tracking-tight">
            My collections<span className="text-primary">.</span>
          </h2>
        </div>
        <Link href="/collection/create">
          <Button size="sm" className="font-mono text-xs tracking-tight">+ new collection</Button>
        </Link>
      </div>

      <div className="flex items-center gap-4 px-1 pb-3 border-b border-border font-mono text-xs text-muted-foreground tracking-tight">
        <span className="flex-1">Title</span>
        <span className="w-10 text-right">Qs</span>
        <span className="w-14 text-right">Exam</span>
        <span className="w-14 text-right">Status</span>
        <span className="w-20 text-right">Actions</span>
      </div>

      <div className="divide-y divide-border">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-1 py-4">
              <Skeleton className="h-4 w-40 flex-1" />
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))
        ) : myCollections.length === 0 ? (
          <div className="py-12 text-center">
            <p className="font-mono text-sm text-muted-foreground">
              No collections yet.{" "}
              <Link href="/collection/create" className="text-primary hover:underline underline-offset-4">
                Create one
              </Link>
            </p>
          </div>
        ) : (
          myCollections.map((col) => (
            <div key={col.id} className="flex items-center gap-4 px-1 py-4">
              <Link
                href={`/collection/${col.id}`}
                className="font-mono text-sm flex-1 truncate hover:text-primary transition-colors"
              >
                {col.title}
              </Link>
              <span className="font-mono text-xs text-muted-foreground text-right w-10 tabular-nums">
                {col.quizCount}
              </span>
              <span className="font-mono text-xs text-muted-foreground text-right w-14 truncate">
                {col.examTag ?? "—"}
              </span>
              <div className="w-14 flex justify-end">
                <Badge
                  variant={col.visibility === "public" ? "default" : "secondary"}
                  className="font-mono text-xs"
                >
                  {col.visibility}
                </Badge>
              </div>
              <div className="flex items-center gap-2 justify-end w-20">
                <Link href={`/collection/${col.id}/edit`}>
                  <button className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">
                    edit
                  </button>
                </Link>
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <button className="font-mono text-xs text-muted-foreground hover:text-destructive transition-colors" />
                    }
                  >
                    delete
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-mono tracking-tight">
                        Delete &ldquo;{col.title}&rdquo;?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the collection. The quizzes themselves are not deleted.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="font-mono text-xs">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(col.id)}
                        className="font-mono text-xs bg-destructive text-white hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
