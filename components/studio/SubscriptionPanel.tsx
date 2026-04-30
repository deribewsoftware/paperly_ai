"use client";

type PlanLabel = "free" | "pro" | "team" | "enterprise";

type SubscriptionPanelProps = {
  isAuthenticated: boolean;
  plan: PlanLabel;
  onUpgrade: () => void;
};

export function SubscriptionPanel({
  isAuthenticated,
  plan,
  onUpgrade,
}: SubscriptionPanelProps) {
  const paid = plan !== "free";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Your subscription
          </h2>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
            Free is included with signup—no payment. Pro unlocks downloadable exports.
          </p>
        </div>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
          {paid ? plan : "Free"}
        </span>
      </div>

      {!paid ? (
        <div className="mt-4 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
          <p className="font-medium text-slate-800 dark:text-slate-100">
            Paperly Free (automatic)
          </p>
          <ul className="list-inside list-disc space-y-1">
            <li>Generate documents with AI</li>
            <li>A3 live editing and save to your account</li>
            <li>Image uploads (within monthly limits)</li>
            <li>PDF, DOCX, and PPTX require Paperly Pro</li>
          </ul>
          <button
            type="button"
            onClick={onUpgrade}
            disabled={!isAuthenticated}
            className="mt-2 w-full rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Upgrade to Pro for downloads
          </button>
        </div>
      ) : (
        <p className="mt-3 text-xs text-slate-600 dark:text-slate-300">
          You have full export access while your subscription is active. Thank you for
          supporting Paperly.
        </p>
      )}
    </section>
  );
}
