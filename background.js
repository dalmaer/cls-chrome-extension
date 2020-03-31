"use strict";

const errorCode = -1; // unable to get the value

//
// Extention Events
//
//chrome.runtime.onInstalled.addListener(function() {});

// When a tab is updated check to see if it is loaded and reset the icon UI
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  ifExtensionIsTurnedOn(() => {
    if (
      changeInfo.status == "complete" &&
      tab.url.startsWith("http") &&
      tab.active
    ) {
      chrome.tabs.executeScript({ file: "content.js" }, result => {
        // Catch errors such as "This page cannot be scripted due to an ExtensionsSettings policy."
        const lastErr = chrome.runtime.lastError;
        if (lastErr) {
          console.log("Error: " + lastErr.message);

          chrome.browserAction.setIcon({ path: "cls-error.png" });
          chrome.browserAction.setBadgeText({ text: "" });
          let key = hashCode(tab.url);
          chrome.storage.local.set({ [key]: errorCode });
        }
      });
    }
  });
});

// Fires when the active tab in a window changes
chrome.tabs.onActivated.addListener(activeInfo => {
  tryToUpdateIconUIFromStorage(activeInfo.tabId);
});

// message from content script, the CLS will be in request.result
chrome.runtime.onMessage.addListener((request, sender, response) => {
  updateIconUI(request.result);

  if (sender.tab.url) {
    let key = hashCode(sender.tab.url);
    chrome.storage.local.set({ [key]: request.result });
  }
});

// Toggle the extension on and off when you tap on the icon
chrome.browserAction.onClicked.addListener(tab => {
  chrome.storage.local.get("off", result => {
    if (result.off) {
      // turn it on
      chrome.storage.local.set({ off: false });
      chrome.browserAction.setIcon({ path: "cls-on.png" });
      chrome.browserAction.setBadgeText({ text: "" });

      tryToUpdateIconUIFromStorage(tab.id);
    } else {
      // turn it off
      chrome.storage.local.set({ off: true });
      chrome.browserAction.setIcon({ path: "cls-off.png" });
      chrome.browserAction.setBadgeText({ text: "" });
    }
  });
});

//
// Mess around with the Icon UI
//

// Given the cls as a number in milliseconds, update the Icon UI
function updateIconUI(cls) {
  let color = getColor(cls);

  let clsBadgeText = cls > 9999 ? "BAD" : cls.toString();

  chrome.browserAction.setIcon({ path: "cls-" + color + ".png" });
  chrome.browserAction.setBadgeText({ text: clsBadgeText });
  chrome.browserAction.setBadgeBackgroundColor({ color: "#000000" });
}

// load up the most recent result for this tab and update the IconUI
function tryToUpdateIconUIFromStorage(tabId) {
  chrome.tabs.get(tabId, tab => {
    if (tab.url) {
      let key = hashCode(tab.url);
      chrome.storage.local.get(key, result => {
        if (result[key] == errorCode) {
          chrome.browserAction.setIcon({ path: "cls-error.png" });
          chrome.browserAction.setBadgeText({ text: "" });
        } else if (result[key]) {
          updateIconUI(result[key]);
        } else {
          resetIconUI();
        }
      });
    }
  });
}

// Reset the UI to the base ON or OFF icon
function resetIconUI() {
  chrome.storage.local.get("off", result => {
    let onoff = result.off ? "off" : "on";

    chrome.browserAction.setIcon({ path: "cls-" + onoff + ".png" });
  });
  chrome.browserAction.setBadgeText({ text: "" });
}

//
// Helper Functions
//

// Given a function, only run it if the extension is turned on by the user
function ifExtensionIsTurnedOn(callback) {
  chrome.storage.local.get("off", result => {
    if (!result.off) {
      callback();
    }
  });
}

// Given the CLS, return green, yellow, or red depending on the amount
function getColor(cls) {
  let color = "red";

  // GREEN < 0.1, YELLOW < 0.25, RED > 0.25
  if (cls < 0.1) {
    color = "green";
  } else if (cls < 0.25) {
    color = "yellow";
  }

  return color;
}

// Hash the URL and return a numeric hash as a String to be used as the key
function hashCode(str) {
  let hash = 0;
  if (str.length == 0) {
    return "";
  }
  for (var i = 0; i < str.length; i++) {
    var char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
}
