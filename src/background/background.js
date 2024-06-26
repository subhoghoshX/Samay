import { getDate } from "@/lib/utils";

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
