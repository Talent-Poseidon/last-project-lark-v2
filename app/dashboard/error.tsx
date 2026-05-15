"use client";

import { Button } from "@mantine/core";
import { AlertCircle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error("[dashboard:error] Error boundary triggered", {
    name: error.name,
    message: error.message,
    digest: error.digest,
    stack: error.stack?.split("\n").slice(0, 3).join(" | "),
  });

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
        <AlertCircle className="h-8 w-8 text-red-500" />
      </div>
      <h2 className="mt-4 text-xl font-semibold text-foreground">
        Something went wrong
      </h2>
      <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
        An error occurred while loading the dashboard. Please try again.
      </p>
      <Button
        onClick={reset}
        className="mt-6"
        variant="outline"
        size="md"
      >
        Try again
      </Button>
    </div>
  );
}
