// src/background/index.js

console.log("TabSense background script loaded.");

chrome.runtime.onInstalled.addListener(() => {
  console.log("TabSense extension installed.");
});

chrome.tabs.onCreated.addListener((tab) => {
  console.log("Tab created:", tab);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    console.log("Tab updated:", tab);
  }
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  console.log("Tab removed:", tabId);
}); 