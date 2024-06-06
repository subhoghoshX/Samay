import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Overview } from "@/components/Overview";
import { getDate } from "@/lib/utils";
import FocusModeCard from "@/components/FocusModeCard";

function millisecToHMS(millisec) {
  const d = new Date(millisec);
  return d
    .toISOString()
    .slice(11, 19)
    .split(":")
    .map((item) => Number(item));
}

export default function App() {
  const [totalUsage, setTotalUsage] = React.useState({});

  const todayUsage = React.useMemo(
    () => totalUsage[getDate()] ?? {},
    [totalUsage],
  );
  const totalTime = React.useMemo(() => {
    // delete time spent in `newtab` data
    delete todayUsage["newtab"];

    // set total time
    let totalTime = 0;
    for (const hostName in todayUsage) {
      totalTime += todayUsage[hostName];
    }
    return totalTime;
  }, [todayUsage]);

  const [selectedHost, setSelectedHost] = React.useState(null);

  React.useEffect(() => {
    // by default it's the most used website
    const mostUsedSite = Object.keys(todayUsage).sort(
      (hostnamea, hostnameb) => {
        if (todayUsage[hostnamea] > todayUsage[hostnameb]) return -1;
        if (todayUsage[hostnamea] < todayUsage[hostnameb]) return 1;
        return 0;
      },
    )[0];
    setSelectedHost(mostUsedSite);
  }, [todayUsage]);

  const graphData = React.useMemo(() => {
    if (!selectedHost) {
      return null;
    }

    const days = ["Sun", "Mon", "Tue", "Wed", "Thi", "Fri", "Sat"];
    const data = [];
    for (const date in totalUsage) {
      const usage = totalUsage[date];
      const timeSpent = usage[selectedHost];
      const minutesSpent = timeSpent / (1000 * 60);
      const day = days[new Date(date).getDay()];
      data.push({ name: day, total: minutesSpent });
    }
    return data;
  }, [totalUsage, selectedHost]);

  const [isDark, setIsDark] = React.useState(() => {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return true;
    } else {
      return false;
    }
  });

  React.useEffect(() => {
    const browser = chrome;

    browser.runtime.onMessage.addListener(onMessageListener);
    async function onMessageListener(message) {
      if (message.type === "get_times_reply") {
        const { totalUsage } = message;

        setTotalUsage(totalUsage);
      }
    }

    browser.runtime.sendMessage({
      type: "get_times",
    });

    // dark mode
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", themeChangeListener);
    function themeChangeListener(event: MediaQueryListEvent) {
      const isDark = event.matches;
      setIsDark(isDark);
    }

    return () => {
      browser.runtime.onMessage.removeListener(onMessageListener);
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .removeEventListener("change", themeChangeListener);
    };
  }, []);

  return (
    <main
      className={`flex justify-center items-center h-screen ${isDark ? "dark bg-zinc-950" : ""}`}
    >
      <section className="flex gap-5 flex-col lg:flex-row">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Websites visited</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {Object.keys(todayUsage)
                .sort((hostnamea, hostnameb) => {
                  if (todayUsage[hostnamea] > todayUsage[hostnameb]) return -1;
                  if (todayUsage[hostnamea] < todayUsage[hostnameb]) return 1;
                  return 0;
                })
                .map((hostName) => {
                  const timeSpent = todayUsage[hostName];
                  const [hour, minute, second] = millisecToHMS(timeSpent);
                  return (
                    <li key={hostName} className="flex items-center gap-x-8">
                      <span className="w-44">{hostName}</span>{" "}
                      <span className="w-20 text-right tabular-nums">
                        {hour ? hour + "h" : ""} {minute ? minute + "m" : ""}{" "}
                        {second ? second + "s" : ""}
                      </span>
                      <Progress
                        value={(timeSpent / totalTime) * 100}
                        className="w-32 h-1.5"
                        onClick={() => setSelectedHost(hostName)}
                      />
                    </li>
                  );
                })}
            </ul>
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
