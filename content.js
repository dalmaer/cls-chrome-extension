// Store the current layout shift score for the page.
let cls = 0;

// Create the PerformanceObserver instance.
const po = new PerformanceObserver(entryList => {
  for (const entry of entryList.getEntries()) {
    // Only count layout shifts without recent user input.
    if (!entry.hadRecentInput) {
      cls += entry.value;
      // Send the CLS to the background page
      chrome.runtime.sendMessage({ result: cls.toFixed(3) });
      console.log("CLS:", cls);
    }
  }
});

po.observe({ type: "layout-shift", buffered: true });
