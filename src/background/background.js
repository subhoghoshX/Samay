import { getDate } from "@/lib/utils";

const browser = chrome;

browser.tabs.onActivated.addListener(handler);
browser.webNavigation.onCommitted.addListener(handler);
browser.windows.onFocusChanged.addListener(handler);

async function handler(details) {
  let tab;
  // this means the window changed
  if (typeof details === "number") {
    const tabs = await chrome.tabs.query({ currentWindow: true, active: true });
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

browser.runtime.onMessage.addListener(async (message) => {
  if (message.type === "get_times") {
    const localStorage = await browser.storage.local.get();
    browser.runtime.sendMessage({
      type: "get_times_reply",
      totalUsage: localStorage.totalUsage,
    });
  } else if (message.type === "set_focusmode_details") {
    const localStorage = await browser.storage.local.get();
    await browser.storage.local.set({
      ...localStorage,
      focusMode: message.focusMode,
    });
  } else if (message.type === "get_focusmode_details") {
    const localStorage = await browser.storage.local.get();

    browser.runtime.sendMessage({
      type: "get_focusmode_details_reply",
      focusMode: localStorage.focusMode,
    });
  }
});

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
    browser.tabs.update(details.tabId, { url: "about:blank" });
  }
});
