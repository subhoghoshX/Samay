import { getDate } from "@/lib/utils";

export default defineBackground(() => {
  const browser = chrome;

  browser.runtime.onInstalled.addListener(fillLocalStorage);

  async function fillLocalStorage() {
    // set the initial data structure in localStorage
    // important for avoiding reading properties of undefined
    const localStorage = await browser.storage.local.get();
    const { totalUsage, focusMode, automatic } = localStorage;
    await browser.storage.local.clear();
    await browser.storage.local.set({
      ...(totalUsage ? { totalUsage } : { totalUsage: {} }),
      ...(focusMode
        ? { focusMode }
        : { focusMode: { isEnabled: false, blockedSites: [] } }),
      ...(automatic
        ? { automatic }
        : {
            automatic: {
              isEnabled: false,
              startTime: [undefined, undefined],
              endTime: [undefined, undefined],
              days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
            },
          }),
    });
  }

  browser.tabs.onActivated.addListener(handler);
  browser.webNavigation.onCommitted.addListener(handler);
  browser.windows.onFocusChanged.addListener(handler);

  async function handler(details) {
    const localStorage = await browser.storage.local.get();
    const { totalUsage, focusMode, automatic } = localStorage;
    if (!totalUsage || !focusMode || !automatic) {
      await fillLocalStorage();
    }

    let tab;
    // this means the window changed
    if (typeof details === "number") {
      // focused on a devtools window
      if (details < 0) return;

      const tabs = await chrome.tabs.query({
        currentWindow: true,
        active: true,
      });
      tab = tabs[0];
    } else {
      tab = await browser.tabs.get(details.tabId);
    }
    // tab.url requires "tabs" permission
    if (!tab.url) return;

    const { hostname } = new URL(tab.url);

    const sessionStorage = await browser.storage.session.get();
    const lastActiveHost = sessionStorage.activeHost;

    if (lastActiveHost) {
      const newTimeSpent = Date.now() - lastActiveHost.timeStamp;
      const localStorage = await browser.storage.local.get();
      const prevTimeSpent =
        localStorage.totalUsage[getDate()]?.[lastActiveHost.hostName] ?? 0;

      await browser.storage.local.set({
        ...localStorage,
        totalUsage: {
          ...localStorage.totalUsage,
          [getDate()]: {
            ...localStorage.totalUsage[getDate()],
            [lastActiveHost.hostName]: prevTimeSpent + newTimeSpent,
          },
        },
      });
      await browser.storage.session.set({
        activeHost: { hostName: hostname, timeStamp: Date.now() },
      });
    } else {
      await browser.storage.session.set({
        activeHost: { hostName: hostname, timeStamp: Date.now() },
      });
    }
  }

  browser.webNavigation.onCommitted.addListener(async (details) => {
    const focusMode = (await browser.storage.local.get()).focusMode;
    if (!focusMode.isEnabled) return;

    // don't use details.url it can also come from iframes
    const { url: tabUrl } = await browser.tabs.get(details.tabId);
    const url = new URL(tabUrl);
    const blockedSites = focusMode.blockedSites;

    // Check if the URL matches any of the blocked URLs
    const isBlocked = blockedSites.some((blockedUrl) => {
      const pattern = new URL(
        blockedUrl.startsWith("http") ? blockedUrl : `https://${blockedUrl}`,
      );
      return url.hostname === pattern.hostname;
    });

    if (isBlocked) {
      browser.tabs.update(details.tabId, {
        url: `redirect/index.html?from=${tabUrl}`,
      });
    }
  });

  browser.alarms.create("updateFocusMode", { periodInMinutes: 5 });

  browser.alarms.onAlarm.addListener(async (alarmInfo) => {
    if (alarmInfo.name !== "updateFocusMode") return;

    const { automatic } = await browser.storage.local.get("automatic");
    const { isEnabled, startTime, endTime, days } = automatic;

    if (!isEnabled) return;
    if ([startTime[0], startTime[1], endTime[0], endTime[1]].includes(null))
      return;

    const d = new Date();
    const dayName = d.toLocaleString("en-US", { weekday: "short" });

    if (!days.includes(dayName)) return;

    d.setHours(automatic.startTime[0], automatic.startTime[1], 0, 0);
    const startTimeUnix = d.getTime();

    d.setHours(automatic.endTime[0], automatic.endTime[1], 0, 0);
    const endTimeUnix = d.getTime();

    if (startTimeUnix === endTimeUnix) return;

    const now = Date.now();

    if (endTimeUnix > startTimeUnix) {
      if (now > startTimeUnix && now < endTimeUnix) {
        const { focusMode } = await browser.storage.local.get("focusMode");
        browser.storage.local.set({
          focusMode: {
            ...focusMode,
            isEnabled: true,
          },
        });
      } else {
        const { focusMode } = await browser.storage.local.get("focusMode");
        browser.storage.local.set({
          focusMode: {
            ...focusMode,
            isEnabled: false,
          },
        });
      }
    } else {
      if (now > startTimeUnix || now < endTimeUnix) {
        const { focusMode } = await browser.storage.local.get("focusMode");
        browser.storage.local.set({
          focusMode: {
            ...focusMode,
            isEnabled: true,
          },
        });
      } else {
        const { focusMode } = await browser.storage.local.get("focusMode");
        browser.storage.local.set({
          focusMode: {
            ...focusMode,
            isEnabled: false,
          },
        });
      }
    }
  });
});
