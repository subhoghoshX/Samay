import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

function millisecToHMS(millisec) {
  const d = new Date(millisec);
  return d
    .toISOString()
    .slice(11, 19)
    .split(":")
    .map((item) => Number(item));
}

export default function App() {
  const [times, setTimes] = React.useState({});
  const [totalTime, setTotalTime] = React.useState(0);
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
        const { times } = message;
        // delete time spent in `newtab` data
        delete times["newtab"];

        setTimes(times);

        // set total time
        let totalTime = 0;
        for (const hostName in times) {
          totalTime += times[hostName];
        }
        setTotalTime(totalTime);
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
    <div
      className={`flex justify-center items-center h-screen ${isDark ? "dark bg-zinc-950" : ""}`}
    >
      <main className="flex justify-center">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Websites visited</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {Object.keys(times)
                .sort((hostnamea, hostnameb) => {
                  if (times[hostnamea] > times[hostnameb]) return -1;
                  if (times[hostnamea] < times[hostnameb]) return 1;
                  return 0;
                })
                .map((hostName) => {
                  const timeSpent = times[hostName];
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
                      />
                    </li>
                  );
                })}
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
