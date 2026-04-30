"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type SectionLengthChartProps = {
  data: {
    section: string;
    size: number;
  }[];
};

export function SectionLengthChart({ data }: SectionLengthChartProps) {
  return (
    <div className="h-full w-full text-slate-700 dark:text-slate-300">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--paperly-chart-grid)"
          />
          <XAxis
            dataKey="section"
            tick={{ fill: "currentColor", fontSize: 11 }}
            interval={0}
            angle={-18}
            textAnchor="end"
            height={56}
          />
          <YAxis tick={{ fill: "currentColor", fontSize: 11 }} width={36} />
          <Tooltip
            cursor={{ fill: "rgb(99 102 241 / 0.08)" }}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid rgb(148 163 184 / 0.45)",
              backgroundColor: "var(--background)",
              color: "var(--foreground)",
              fontSize: 12,
            }}
          />
          <Bar
            dataKey="size"
            fill="var(--paperly-chart-bar)"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
