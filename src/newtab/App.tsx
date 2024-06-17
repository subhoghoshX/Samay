import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Overview } from "@/components/Overview";
import { getDate, millisecToHMS } from "@/lib/utils";
import FocusModeCard from "@/components/FocusModeCard";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function App() {
  const [totalUsage, setTotalUsage] = useState({});

  const todayUsage = useMemo(() => totalUsage[getDate()] ?? {}, [totalUsage]);

  // required for calculating progress bar percentage
  const totalTime = useMemo(() => {
    let totalTime = 0;
    for (const hostName in todayUsage) {
      totalTime += todayUsage[hostName];
    }
    return totalTime;
  }, [todayUsage]);

  const [selectedHost, setSelectedHost] = useState(null);

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

  const graphData = useMemo(() => {
    if (!selectedHost) {
      return null;
    }

    const days = ["Sun", "Mon", "Tue", "Wed", "Thi", "Fri", "Sat"];
    const data = [];
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

  useEffect(() => {
    const browser = chrome;

    browser.runtime.onMessage.addListener(onMessageListener);
    async function onMessageListener(message) {
      if (message.type === "get_times_reply") {
        const { totalUsage } = message;

        // delete special tabs like `newtab`, `settings`, `devtools`, `extensions`
        for (const date in totalUsage) {
          const usage = totalUsage[date];
          for (const hostName in usage) {
            if (hostName.split(".").length === 1) {
              delete usage[hostName];
            }
          }
        }

        setTotalUsage(totalUsage);
      }
    }

    browser.runtime.sendMessage({
      type: "get_times",
    });

    // dark mode
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", themeChangeListener);
    function themeChangeListener(event: MediaQueryListEvent) {
      const isDark = event.matches;
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }

    return () => {
      browser.runtime.onMessage.removeListener(onMessageListener);
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .removeEventListener("change", themeChangeListener);
    };
  }, []);

  return (
    <main className="flex justify-center lg:items-center h-screen overflow-auto py-10 dark:bg-zinc-950">
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
                      <li
                        key={hostName}
                        className="flex items-center gap-x-8 px-2 py-1 -mx-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded"
                        onClick={() => setSelectedHost(hostName)}
                      >
                        <div className="w-44 flex items-center gap-3">
                          <img
                            className="size-3.5 rounded"
                            src={"https://favicone.com/" + hostName}
                            alt=""
                          />
                          {hostName}
                        </div>
                        <span className="w-20 text-right tabular-nums">
                          {hour ? hour + "h" : ""} {minute ? minute + "m" : ""}{" "}
                          {second ? second + "s" : ""}
                        </span>
                        <Progress
                          value={(timeSpent / totalTime) * 100}
                          className="w-32 h-1.5"
                        />
                      </li>
                    );
                  })}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>
        <div className="flex flex-col gap-5">
          <Card className="lg:w-96 flex flex-col lg:h-1/2 h-80">
            <CardHeader>
              <CardTitle className="text-lg">Last 7 days</CardTitle>
              <CardDescription>{selectedHost}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <Overview data={graphData} />
            </CardContent>
          </Card>
          <FocusModeCard />
        </div>
      </section>
    </main>
  );
}
