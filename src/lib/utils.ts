import { clsx, type ClassValue } from "clsx";
import { useEffect, useState, useSyncExternalStore } from "react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDate(_d?: Date) {
  const d = _d ?? new Date();
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

    async function getTotalUsage() {
      const { totalUsage } = await browser.storage.local.get("totalUsage");

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

    getTotalUsage();
  }, []);

  return totalUsage;
}

export function useFocusMode() {
  const [focusMode, setFocusMode] = useState({
    isEnabled: false,
    blockedSites: [],
  });

  useEffect(() => {
    const browser = chrome;

    async function getFocusMode() {
      const { focusMode } = await browser.storage.local.get("focusMode");
      setFocusMode(focusMode);
    }
    getFocusMode();

    browser.storage.onChanged.addListener(onChangeHandler);
    function onChangeHandler(changes) {
      if (changes.focusMode) {
        setFocusMode(changes.focusMode.newValue);
      }
    }

    return () => {
      browser.storage.onChanged.removeListener(onChangeHandler);
    };
  }, []);

  return focusMode;
}

export function useAutomaticMode() {
  interface State {
    isEnabled: boolean;
    startTime: [string | undefined, string | undefined];
    endTime: [string | undefined, string | undefined];
    days: string[];
  }
  const [automaticMode, setAutomaticMode] = useState<State>({
    isEnabled: false,
    startTime: [undefined, undefined],
    endTime: [undefined, undefined],
    days: [],
  });

  useEffect(() => {
    const browser = chrome;

    async function getAutomaticDetails() {
      const { automatic } = await browser.storage.local.get("automatic");

      const { isEnabled, startTime, endTime, days } = automatic;
      setAutomaticMode({
        isEnabled,
        startTime: [startTime[0] ?? undefined, startTime[1] ?? undefined],
        endTime: [endTime[0] ?? undefined, endTime[1] ?? undefined],
        days: days ?? [],
      });
    }
    getAutomaticDetails();

    browser.storage.onChanged.addListener(onChangeHandler);
    function onChangeHandler(changes) {
      if (changes.automatic) {
        const { isEnabled, startTime, endTime, days } =
          changes.automatic.newValue;
        setAutomaticMode({
          isEnabled,
          startTime: [startTime[0] ?? undefined, startTime[1] ?? undefined],
          endTime: [endTime[0] ?? undefined, endTime[1] ?? undefined],
          days,
        });
      }
    }

    return () => {
      browser.storage.onChanged.removeListener(onChangeHandler);
    };
  }, []);

  return automaticMode;
}
