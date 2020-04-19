// guard against double-inclusion and making sure that the chrome runtime is available
if (
  typeof po == "undefined" &&
  typeof chrome.runtime == "object" &&
  typeof chrome.runtime.sendMessage == "function"
) {
  // Store the current layout shift score for the page.
  let cls = 0;

  // Create the PerformanceObserver instance.
  const po = new PerformanceObserver((entryList) => {
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

  // Show the final score once the page's lifecycle state becomes hidden.
  document.addEventListener("visibilitychange", function once() {
    if (document.visibilityState === "hidden") {
      // Force any pending records to be dispatched.
      po.takeRecords();
      po.disconnect();

      // if still 0, then force the message over to make sure it is tracked
      if (cls == 0) {
        chrome.runtime.sendMessage({ result: cls });
      }

      // Log the final score to the console.
      console.log("CLS (final):", cls);
      document.removeEventListener("visibilitychange", once);
    }
  });
}
