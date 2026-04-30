export function LivePreviewSkeleton() {
  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="mb-3 h-7 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      <div className="mb-6 h-3 w-full max-w-xl animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
      <div className="mb-4 flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={`sk-${index}`}
            className="h-8 w-9 animate-pulse rounded-md bg-slate-100 dark:bg-slate-800"
          />
        ))}
      </div>
      <div className="mx-auto rounded-xl border border-slate-200 bg-slate-100/60 p-3 dark:border-slate-700 dark:bg-slate-900/60">
        <div
          className="mx-auto min-h-[400px] w-full animate-pulse rounded-md border border-transparent bg-white dark:border-slate-500/30 dark:bg-white lg:min-h-[1200px]"
          style={{
            width: "min(100%, 1122px)",
          }}
        />
      </div>
      <p className="mt-3 text-xs text-slate-600 dark:text-slate-300">
        Loading A3 editor…
      </p>
    </section>
  );
}
