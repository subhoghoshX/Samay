import { clsx, type ClassValue } from "clsx";
import { useEffect, useState, useSyncExternalStore } from "react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDate(d?: Date) {
  d = d ?? new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0"); //January is 0!
  const yyyy = d.getFullYear();

  return `${yyyy}-${mm}-${dd}`;
}

export function millisecToHMS(millisec) {
  const d = new Date(millisec);
  return d
    .toISOString()
    .slice(11, 19)
    .split(":")
    .map((item) => Number(item));
}

function subscribe(callback: (event: MediaQueryListEvent) => void) {
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", callback);

  return () => {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .removeEventListener("change", callback);
  };
}

function getSnapshot() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function useSystemDarkStatus() {
  const isDark = useSyncExternalStore(subscribe, getSnapshot);
  return isDark;
}

export function useTotalUsage() {
  const [totalUsage, setTotalUsage] = useState({});

  useEffect(() => {
    const browser = chrome;

    browser.runtime.onMessage.addListener(onMessageListener);
    async function onMessageListener(message) {
      if (message.type === "get_times_reply") {
        const { totalUsage } = message;

        for (const date in totalUsage) {
          const usage = totalUsage[date];
          for (const hostName in usage) {
            // delete special tabs like `newtab`, `settings`, `devtools`, `extensions`
            if (hostName.split(".").length === 1) {
              delete usage[hostName];
            }

            // don't show usage if it's less than 1000ms
            if (usage[hostName] < 1000) {
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

    return () => {
      browser.runtime.onMessage.removeListener(onMessageListener);
    };
  }, []);

  return totalUsage;
}
