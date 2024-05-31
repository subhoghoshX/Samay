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
      localStorage[getDate()]?.[lastActiveHost.hostName] ?? 0;

    await browser.storage.local.set({
      ...localStorage,
      [getDate()]: {
        ...localStorage[getDate()],
        [lastActiveHost.hostName]: prevTimeSpent + newTimeSpent,
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
      times: localStorage[getDate()],
    });
  }
});

function getDate() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0"); //January is 0!
  const yyyy = d.getFullYear();

  return `${yyyy}-${mm}-${dd}`;
}
