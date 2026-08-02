"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Activity = { day: string; value: number };

export function ActivityChart({ data }: { data: Activity[] }) {
  const chartData = data.map((item) => ({
    ...item,
    label: item.day.slice(5).replace("-", "/"),
  }));

  return (
    <div className="activity-chart" aria-label="过去七天学习活动柱状图">
      <ResponsiveContainer width="100%" height={210}>
        <BarChart data={chartData} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
          <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} stroke="#6b7280" />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} stroke="#6b7280" />
          <Tooltip cursor={{ fill: "#eee7da" }} contentStyle={{ border: "1px solid #d9d0c1", borderRadius: 7, background: "#fffdf8" }} />
          <Bar dataKey="value" name="学习活动" fill="#b58a3a" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
