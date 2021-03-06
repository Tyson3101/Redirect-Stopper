let isOn = false;

chrome.runtime.onMessage.addListener(
  async ({ state }, sender, sendResponse) => {
    if (state) {
      isOn = true;
      let queryOptions = { active: true, currentWindow: true };
      let tabs = await chrome.tabs.query(queryOptions);
      const mainTab = tabs[0];
      const url = new URL(mainTab?.url)?.origin;
      console.log(url);
      let interval = setInterval(async () => {
        let queryOptions = { active: true, currentWindow: true };
        let [checkTab] = await chrome.tabs.query(queryOptions);
        if (mainTab.id !== checkTab.id) {
          setTimeout(async () => {
            await chrome.storage.local.set({ state: false });
            isOn = false;
            clearInterval(interval);
          }, 400);
        } else if (url !== new URL(checkTab.url).origin) {
          setTimeout(async () => {
            await chrome.storage.local.set({ state: false });
            isOn = false;
            clearInterval(interval);
          }, 400);
          clearInterval(interval);
        }
      }, 3000);
      newTabEvent = await chrome.tabs.onCreated.addListener(
        async (noInfoTab) => {
          await chrome.tabs.update(mainTab.id, { active: true });
          await chrome.tabs.onUpdated.addListener(async (_, __, tab) => {
            console.log("TabUpdated", tab.id, noInfoTab.id);
            if (noInfoTab.id === tab.id) {
              try {
                if (new URL(tab.url).origin !== url && isOn)
                  await chrome.tabs.remove(tab.id);
                else await chrome.tabs.update(tab.id, { active: true });
              } catch {
                console.log("Closed.");
              }
            } else if (
              mainTab.id === tab.id &&
              new URL(tab.url).origin !== url
            ) {
              await chrome.storage.local.set({ state: false });
              isOn = false;
            }
          });
        }
      );
    } else {
      console.log("Off");
      isOn = false;
    }
  }
);
