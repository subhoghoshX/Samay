import React, { useMemo } from "react";
import { getDate } from "@/lib/utils";
import InteractiveBarChart from "./InteractiveBarChart";

interface Props {
  totalUsage: Record<string, Record<string, number>>;
  selectedHost: string | null;
}

export interface ChartData {
  date: string;
  timeSpent: number;
}

export default function UsageOverTime({ totalUsage, selectedHost }: Props) {
  const chartData = useMemo(() => {
    if (!selectedHost) return;

    const data: ChartData[] = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);

      const date = getDate(d);

      const thatDayUsage = totalUsage[date];
      const timeSpent = thatDayUsage?.[selectedHost] ?? 0;
      data.unshift({ date, timeSpent });
    }
    return data;
  }, [totalUsage, selectedHost]);

  return <InteractiveBarChart data={chartData} />;
}
