"use client";

import React from "react";
import { Pie, PieChart } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { getDate } from "@/lib/utils";

const date = new Date();
const formattedDate = `${date.toLocaleString("default", { month: "long" })} ${date.getDate()}, ${date.getFullYear()}`;

interface Props {
  totalUsage: Record<string, Record<string, number>>;
}

export function Overview({ totalUsage }: Props) {
  const d = new Date();
  const today = getDate(d);
  const todayUsage = totalUsage[today] ?? {};
  const top5 = Object.entries(todayUsage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const chartConfig: Record<string, { label: string; color: string }> = {};

  for (const [hostName] of top5) {
    chartConfig[hostName] = {
      label: hostName,
      color: `hsl(var(--chart-${Object.keys(chartConfig).length + 1}))`,
    };
  }

  const chartData = top5.map(([hostName, timeSpent]) => ({
    hostName,
    timeSpent,
    fill: chartConfig[hostName]?.color,
  }));

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-lg">Top 5 sites</CardTitle>
        <CardDescription id="overview-date">{formattedDate}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <PieChart>
            <Pie data={chartData} dataKey="timeSpent" />
            <ChartLegend
              content={<ChartLegendContent nameKey="hostName" />}
              className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
