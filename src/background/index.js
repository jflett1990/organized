// src/background/index.js

console.log("TabSense background script loaded.");

// Storage for analytics and productivity tracking
let tabMetrics = {
  dailyStats: {},
  focusTime: {},
  tabSwitches: 0,
  productivityScore: 0
};

let idleTabs = new Map(); // Track idle tabs for auto-archiving
let focusStartTime = null;
let currentActiveTab = null;

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log("TabSense extension installed.");
  initializeAnalytics();
  setupIdleDetection();
});

// Initialize analytics storage
async function initializeAnalytics() {
  const result = await chrome.storage.local.get(['tabMetrics']);
  if (result.tabMetrics) {
    tabMetrics = { ...tabMetrics, ...result.tabMetrics };
  }
  updateDailyStats();
}

// Smart auto-grouping by domain and activity
function getTabCategory(tab) {
  const url = new URL(tab.url);
  const domain = url.hostname;
  
  // Smart categorization based on common patterns
  const categories = {
    'Development': ['github.com', 'stackoverflow.com', 'developer.mozilla.org', 'npmjs.com', 'codepen.io'],
    'Social': ['twitter.com', 'facebook.com', 'linkedin.com', 'instagram.com', 'reddit.com'],
    'Productivity': ['docs.google.com', 'notion.so', 'trello.com', 'slack.com', 'asana.com'],
    'Learning': ['youtube.com', 'coursera.org', 'udemy.com', 'khan.academy.org', 'medium.com'],
    'Shopping': ['amazon.com', 'ebay.com', 'etsy.com', 'shopify.com'],
    'Entertainment': ['netflix.com', 'spotify.com', 'twitch.tv', 'hulu.com']
  };
  
  for (const [category, domains] of Object.entries(categories)) {
    if (domains.some(d => domain.includes(d))) {
      return category;
    }
  }
  
  return 'General';
}

// Track tab creation with smart grouping
chrome.tabs.onCreated.addListener((tab) => {
  console.log("Tab created:", tab);
  
  if (tab.url && !tab.url.startsWith('chrome://')) {
    const category = getTabCategory(tab);
    updateCategoryStats(category, 'created');
    
    // Store tab group info
    chrome.storage.local.set({
      [`tab_${tab.id}`]: {
        category,
        createdAt: Date.now(),
        domain: new URL(tab.url).hostname
      }
    });
  }
});

// Enhanced tab tracking with focus time
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  // Track focus time for previous tab
  if (currentActiveTab && focusStartTime) {
    const focusTime = Date.now() - focusStartTime;
    await updateFocusTime(currentActiveTab, focusTime);
  }
  
  // Start tracking new tab
  currentActiveTab = activeInfo.tabId;
  focusStartTime = Date.now();
  tabMetrics.tabSwitches++;
  
  // Reset idle timer for this tab
  idleTabs.delete(activeInfo.tabId);
  
  saveMetrics();
});

// Track tab updates and analyze productivity
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
    const category = getTabCategory(tab);
    updateCategoryStats(category, 'visited');
    
    // Check if this looks like a productive session
    const isProductiveTime = await analyzeProductivity(tab);
    if (isProductiveTime) {
      tabMetrics.productivityScore += 10;
    }
    
    // Update tab metadata
    chrome.storage.local.set({
      [`tab_${tabId}`]: {
        category,
        lastVisited: Date.now(),
        domain: new URL(tab.url).hostname,
        title: tab.title
      }
    });
    
    console.log(`Tab updated: ${tab.title} (${category})`);
  }
});

// Smart idle detection for auto-archiving
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  console.log("Tab removed:", tabId);
  idleTabs.delete(tabId);
  
  // Clean up stored data
  chrome.storage.local.remove([`tab_${tabId}`]);
  
  updateCategoryStats('General', 'closed');
});

// Idle detection system
function setupIdleDetection() {
  // Check for idle tabs every 30 seconds
  setInterval(checkIdleTabs, 30000);
  
  // Listen for window focus changes
  chrome.windows.onFocusChanged.addListener((windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
      // Browser lost focus - start idle timer for all tabs
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          if (!idleTabs.has(tab.id)) {
            idleTabs.set(tab.id, Date.now());
          }
        });
      });
    }
  });
}

// Check for tabs that have been idle too long
async function checkIdleTabs() {
  const settings = await chrome.storage.sync.get(['autoArchiveMinutes']);
  const autoArchiveTime = (settings.autoArchiveMinutes || 60) * 60 * 1000; // Default 1 hour
  
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      if (idleTabs.has(tab.id)) {
        const idleTime = Date.now() - idleTabs.get(tab.id);
        if (idleTime > autoArchiveTime) {
          // Suggest archiving this tab
          chrome.runtime.sendMessage({
            type: 'SUGGEST_ARCHIVE',
            tab: tab,
            idleTime: idleTime
          });
        }
      }
    });
  });
}

// Analyze if current activity is productive
async function analyzeProductivity(tab) {
  const category = getTabCategory(tab);
  const productiveCategories = ['Development', 'Productivity', 'Learning'];
  
  // Check time of day (working hours are more productive)
  const hour = new Date().getHours();
  const isWorkingHours = hour >= 9 && hour <= 17;
  
  // Check if domain suggests focused work
  const focusedDomains = ['docs.google.com', 'github.com', 'stackoverflow.com'];
  const isFocusedWork = focusedDomains.some(domain => 
    tab.url.includes(domain)
  );
  
  return productiveCategories.includes(category) && (isWorkingHours || isFocusedWork);
}

// Update focus time tracking
async function updateFocusTime(tabId, timeSpent) {
  const tabData = await chrome.storage.local.get([`tab_${tabId}`]);
  if (tabData[`tab_${tabId}`]) {
    const category = tabData[`tab_${tabId}`].category;
    
    if (!tabMetrics.focusTime[category]) {
      tabMetrics.focusTime[category] = 0;
    }
    
    tabMetrics.focusTime[category] += timeSpent;
  }
}

// Update category statistics
function updateCategoryStats(category, action) {
  const today = new Date().toDateString();
  
  if (!tabMetrics.dailyStats[today]) {
    tabMetrics.dailyStats[today] = {};
  }
  
  if (!tabMetrics.dailyStats[today][category]) {
    tabMetrics.dailyStats[today][category] = {
      created: 0,
      visited: 0,
      closed: 0
    };
  }
  
  tabMetrics.dailyStats[today][category][action]++;
}

// Update daily stats
function updateDailyStats() {
  const today = new Date().toDateString();
  if (!tabMetrics.dailyStats[today]) {
    tabMetrics.dailyStats[today] = {};
  }
}

// Save metrics to storage
function saveMetrics() {
  chrome.storage.local.set({ tabMetrics });
}

// Productivity insights API for popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_ANALYTICS') {
    sendResponse({
      dailyStats: tabMetrics.dailyStats,
      focusTime: tabMetrics.focusTime,
      tabSwitches: tabMetrics.tabSwitches,
      productivityScore: tabMetrics.productivityScore
    });
  }
  
  if (request.type === 'GET_TAB_SUGGESTIONS') {
    generateTabSuggestions().then(suggestions => {
      sendResponse({ suggestions });
    });
  }
});

// Generate smart suggestions for tab management
async function generateTabSuggestions() {
  const tabs = await chrome.tabs.query({});
  const suggestions = [];
  
  // Group similar tabs
  const domainGroups = {};
  tabs.forEach(tab => {
    if (tab.url && !tab.url.startsWith('chrome://')) {
      const domain = new URL(tab.url).hostname;
      if (!domainGroups[domain]) {
        domainGroups[domain] = [];
      }
      domainGroups[domain].push(tab);
    }
  });
  
  // Suggest grouping for domains with multiple tabs
  Object.entries(domainGroups).forEach(([domain, domainTabs]) => {
    if (domainTabs.length > 2) {
      suggestions.push({
        type: 'GROUP_SIMILAR',
        domain,
        tabs: domainTabs,
        message: `Group ${domainTabs.length} ${domain} tabs together?`
      });
    }
  });
  
  // Suggest archiving old tabs
  const oldTabs = tabs.filter(tab => {
    return idleTabs.has(tab.id) && 
           (Date.now() - idleTabs.get(tab.id)) > 30 * 60 * 1000; // 30 minutes
  });
  
  if (oldTabs.length > 0) {
    suggestions.push({
      type: 'ARCHIVE_OLD',
      tabs: oldTabs,
      message: `Archive ${oldTabs.length} idle tabs?`
    });
  }
  
  return suggestions;
}

// Clean up old daily stats (keep last 30 days)
setInterval(() => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toDateString();
  Object.keys(tabMetrics.dailyStats).forEach(date => {
    if (new Date(date) < new Date(thirtyDaysAgo)) {
      delete tabMetrics.dailyStats[date];
    }
  });
  saveMetrics();
}, 24 * 60 * 60 * 1000); // Run daily 