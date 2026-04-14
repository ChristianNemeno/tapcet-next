interface ErrorAlertProps {
  message?: string | null;
  className?: string;
}

export function ErrorAlert({ message, className }: ErrorAlertProps) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className={`rounded-md border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300 ${className ?? ""}`}
    >
      {message}
    </div>
  );
}
