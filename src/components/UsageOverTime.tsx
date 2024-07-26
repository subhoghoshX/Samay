import React, { useMemo } from "react";
import Chart from "@/components/Chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDate } from "@/lib/utils";

interface Props {
  totalUsage: Record<string, Record<string, number>>;
  selectedHost: string | null;
}

export interface ChartData {
  name: string;
  total: number;
}

export default function UsageOverTime({ totalUsage, selectedHost }: Props) {
  const chartData = useMemo(() => {
    if (!selectedHost) return;

    const days = ["Sun", "Mon", "Tue", "Wed", "Thi", "Fri", "Sat"];
    const data: ChartData[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const thatDayUsage = totalUsage[getDate(d)];
      const timeSpent = thatDayUsage?.[selectedHost] ?? 0;
      const minutesSpent = timeSpent / (1000 * 60);
      const weekDay = days[d.getDay()];
      data.unshift({ name: weekDay, total: minutesSpent });
    }
    return data;
  }, [totalUsage, selectedHost]);

  return (
    <Card className="lg:w-96 flex flex-col lg:h-1/2 h-80">
      <CardHeader>
        <CardTitle className="text-lg">Last 7 days</CardTitle>
        <CardDescription>{selectedHost}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <Chart data={chartData} />
      </CardContent>
    </Card>
  );
}
