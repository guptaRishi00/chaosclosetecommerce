// Shown instantly while a console page renders on the server (every page queries the DB).
// The header and tab row live in the layout, so only the content area is replaced.
// In production next/link prefetches this shell, so a tab tap swaps to it with no network wait.
export default function ConsoleLoading() {
  return (
    <div role="status" aria-label="Loading" className="flex animate-pulse flex-col gap-6 motion-reduce:animate-none">
      <div className="flex flex-col gap-2">
        <div className="h-7 w-40 rounded-md bg-muted" />
        <div className="h-4 w-full max-w-md rounded-md bg-muted/70" />
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-border p-4 last:border-0">
            <div className="size-10 shrink-0 rounded-md bg-muted" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="h-4 w-3/5 rounded bg-muted" />
              <div className="h-3 w-2/5 rounded bg-muted/70" />
            </div>
            <div className="hidden h-4 w-20 rounded bg-muted sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}
