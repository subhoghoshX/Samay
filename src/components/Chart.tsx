import { millisecToHMS } from "@/lib/utils";
import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import type { ChartData } from "@/components/UsageOverTime";

interface Props {
  data: ChartData[] | undefined;
}

export default function Chart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid
          vertical={false}
          strokeDasharray="3 1"
          className="dark:stroke-zinc-600"
        />
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => {
            const [hour, minute, second] = millisecToHMS(value * 60 * 1000);
            let label = "";
            if (hour) {
              label += hour + "h";
            }
            if (minute) {
              label += " " + minute + "m";
            }
            if (hour === 0 && minute === 0 && second) {
              label += second + "s";
            }
            if (hour === 0 && minute === 0 && second === 0) {
              label += minute;
            }
            return label;
          }}
        />
        <Bar
          dataKey="total"
          fill="currentColor"
          radius={[4, 4, 0, 0]}
          className="fill-primary"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
