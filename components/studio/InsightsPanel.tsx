"use client";

import dynamic from "next/dynamic";
import { FiBarChart2 } from "react-icons/fi";

const SectionLengthChart = dynamic(
  () =>
    import("@/components/section-length-chart").then(
      (module) => module.SectionLengthChart
    ),
  {
    ssr: false,
  }
);

type InsightsPanelProps = {
  chartData: { section: string; size: number }[];
  usage: {
    generateCount: number;
    exportCount: number;
    uploadCount: number;
  };
  plan: string;
};

export function InsightsPanel({ chartData, usage, plan }: InsightsPanelProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950">
      <div className="mb-3 flex items-center gap-2 text-slate-900 dark:text-slate-100">
        <FiBarChart2 className="h-4.5 w-4.5" />
        <h2 className="text-base font-semibold">Insights</h2>
      </div>
      <div className="h-56 w-full">
        <SectionLengthChart data={chartData} />
      </div>
      <p className="mt-3 text-xs text-slate-600 dark:text-slate-300">
        Plan: {plan} | Generate: {usage.generateCount} | Export: {usage.exportCount} |
        Upload: {usage.uploadCount}
      </p>
    </section>
  );
}
