import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import UsageOverTime from "@/components/UsageOverTime";
import {
  getDate,
  millisecToHMS,
  useSystemDarkStatus,
  useTotalUsage,
} from "@/lib/utils";
import FocusMode from "@/components/FocusMode";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Toaster } from "@/components/ui/toaster";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function App() {
  const isDark = useSystemDarkStatus();
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const totalUsage = useTotalUsage();

  const todayUsage = useMemo(() => totalUsage[getDate()] ?? {}, [totalUsage]);

  // required for calculating progress bar percentage
  const totalTime = useMemo(() => {
    let totalTime = 0;
    for (const hostName in todayUsage) {
      totalTime += todayUsage[hostName];
    }
    return totalTime;
  }, [todayUsage]);

  const [selectedHost, setSelectedHost] = useState<string | null>(null);

  useEffect(() => {
    // set selectedHost: by default it's the most used website
    const mostUsedSite = Object.keys(todayUsage).sort(
      (hostnamea, hostnameb) => {
        if (todayUsage[hostnamea] > todayUsage[hostnameb]) return -1;
        if (todayUsage[hostnamea] < todayUsage[hostnameb]) return 1;
        return 0;
      },
    )[0];
    setSelectedHost(mostUsedSite);
  }, [todayUsage]);

  return (
    <main className="flex justify-center lg:items-center h-screen overflow-auto py-10 dark:bg-zinc-950 font-sans">
      <section className="flex gap-5 flex-col lg:flex-row h-fit">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Websites visited</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] -mx-6">
              <ul className="space-y-1 px-6">
                {Object.keys(todayUsage)
                  .sort((hostnamea, hostnameb) => {
                    if (todayUsage[hostnamea] > todayUsage[hostnameb])
                      return -1;
                    if (todayUsage[hostnamea] < todayUsage[hostnameb]) return 1;
                    return 0;
                  })
                  .map((hostName) => {
                    const timeSpent = todayUsage[hostName];
                    const [hour, minute, second] = millisecToHMS(timeSpent);
                    return (
                      <li key={hostName}>
                        <button
                          type="button"
                          onClick={() => setSelectedHost(hostName)}
                          className="flex items-center gap-x-8 px-2 py-1 -mx-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded"
                        >
                          <div className="w-44 flex items-center gap-3">
                            <Avatar className="size-3.5">
                              <AvatarImage
                                src={"https://favicone.com/" + hostName}
                                alt={hostName + " favicon"}
                              />
                              <AvatarFallback>{hostName[0]}</AvatarFallback>
                            </Avatar>
                            <span className="line-clamp-1 text-left">
                              {hostName}
                            </span>
                          </div>
                          <span className="w-20 text-right tabular-nums">
                            {hour ? hour + "h" : ""}{" "}
                            {minute ? minute + "m" : ""}{" "}
                            {second ? second + "s" : ""}
                          </span>
                          <Progress
                            value={(timeSpent / totalTime) * 100}
                            className="w-32 h-1.5"
                          />
                        </button>
                      </li>
                    );
                  })}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>
        <div className="flex flex-col gap-5">
          <UsageOverTime totalUsage={totalUsage} selectedHost={selectedHost} />
          <FocusMode />
        </div>
      </section>
      <Toaster />
    </main>
  );
}
