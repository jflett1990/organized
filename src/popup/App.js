import React, { useState, useEffect } from 'react';
import Fuse from 'fuse.js';
import TabGroup from '../components/TabGroup';
import SmartTabGroups from '../components/SmartTabGroups';
import ArchivedTabs from '../components/ArchivedTabs';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import { openDB, addArchivedTab, getArchivedTabs, removeArchivedTab } from '../utils/indexedDB';

const App = () => {
  const [tabs, setTabs] = useState([]);
  const [archivedTabs, setArchivedTabs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [theme, setTheme] = useState('light');
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState('tabs'); // 'tabs', 'groups', 'analytics', 'archived'

  const fuse = new Fuse(archivedTabs, {
    keys: [
      { name: 'title', weight: 0.4 },
      { name: 'url', weight: 0.2 },
      { name: 'metadata.description', weight: 0.3 },
      { name: 'metadata.keywords', weight: 0.1 },
    ],
    includeScore: true,
    threshold: 0.5,
    minMatchCharLength: 2,
  });

  useEffect(() => {
    initializeApp();
    loadTheme();
  }, []);

  const initializeApp = async () => {
    await openDB();
    loadArchivedTabs();
    loadOpenTabs();
  };

  const loadTheme = () => {
    chrome.storage.sync.get(['theme'], (result) => {
      if (result.theme) {
        setTheme(result.theme);
      }
    });
  };

  const saveTheme = (newTheme) => {
    chrome.storage.sync.set({ theme: newTheme });
  };

  useEffect(() => {
    const messageListener = (message, sender, sendResponse) => {
      if (message.type === 'METADATA_RESULT') {
        const tabToArchive = JSON.parse(localStorage.getItem('tabToArchive'));
        if (tabToArchive) {
          const fullArchivedTab = {
            ...tabToArchive,
            metadata: message.metadata,
          };
          addArchivedTab(fullArchivedTab, '').then(() => {
            chrome.tabs.remove(tabToArchive.id, () => {
              loadOpenTabs();
              loadArchivedTabs();
              setLoading(false);
              localStorage.removeItem('tabToArchive');
            });
          });
        }
      }

      if (message.type === 'SUGGEST_ARCHIVE') {
        // Handle auto-archive suggestions
        showArchiveSuggestion(message.tab, message.idleTime);
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  const showArchiveSuggestion = (tab, idleTime) => {
    // Create a notification or badge for suggested archiving
    const minutes = Math.floor(idleTime / (60 * 1000));
    console.log(`Suggest archiving: ${tab.title} (idle for ${minutes} minutes)`);
  };

  const loadOpenTabs = () => {
    chrome.tabs.query({}, (tabs) => {
      setTabs(tabs);
    });
  };

  const loadArchivedTabs = () => {
    getArchivedTabs().then(tabs => {
      setArchivedTabs(tabs);
    });
  };

  const handleArchiveTab = (tabToArchive) => {
    setLoading(true);
    localStorage.setItem('tabToArchive', JSON.stringify(tabToArchive));
    chrome.scripting.executeScript({
      target: { tabId: tabToArchive.id },
      files: ['content.js'],
    });
  };

  const handleRestoreTab = (tabToRestore) => {
    chrome.tabs.create({ url: tabToRestore.url }, () => {
      removeArchivedTab(tabToRestore.id).then(() => {
        loadArchivedTabs();
      });
    });
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    saveTheme(newTheme);
  };

  const filteredArchivedTabs = searchTerm
    ? fuse.search(searchTerm).map(result => result.item)
    : archivedTabs;

  const getViewIcon = (view) => {
    const icons = {
      'tabs': '📑',
      'groups': '📁',
      'analytics': '📊',
      'archived': '🗂️'
    };
    return icons[view] || '📄';
  };

  return (
    <div className={`app-container ${theme}`}>
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <div>Archiving tab...</div>
        </div>
      )}
      
      <div className="header">
        <h1>TabSense</h1>
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'light' ? '🌙' : '☀️'} {theme === 'light' ? 'Dark' : 'Light'}
        </button>
      </div>

      {/* Enhanced Navigation */}
      <div className="main-content">
        <div className="view-tabs" style={{ marginBottom: '16px', justifyContent: 'center' }}>
          {[
            { key: 'tabs', label: 'Simple View' },
            { key: 'groups', label: 'Smart Groups' },
            { key: 'analytics', label: 'Analytics' },
            { key: 'archived', label: 'Archived' }
          ].map(({ key, label }) => (
            <button 
              key={key}
              className={`view-tab ${activeView === key ? 'active' : ''}`}
              onClick={() => setActiveView(key)}
            >
              {getViewIcon(key)} {label}
            </button>
          ))}
        </div>

        {/* Stats Bar - Always visible */}
        <div className="stats-bar">
          <div className="stat-item">
            <span>Open:</span>
            <span className="stat-number">{tabs.length}</span>
          </div>
          <div className="stat-item">
            <span>Archived:</span>
            <span className="stat-number">{archivedTabs.length}</span>
          </div>
          <div className="stat-item">
            <span>Total:</span>
            <span className="stat-number">{tabs.length + archivedTabs.length}</span>
          </div>
        </div>

        {/* Tab Views */}
        {activeView === 'tabs' && (
          <div className="section">
            <h3 className="section-title">Open Tabs</h3>
            {tabs.length > 0 ? (
              <TabGroup tabs={tabs} onArchive={handleArchiveTab} />
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                <div className="empty-state-text">No open tabs found</div>
              </div>
            )}
          </div>
        )}

        {activeView === 'groups' && (
          <div className="section">
            <h3 className="section-title">Smart Tab Groups</h3>
            {tabs.length > 0 ? (
              <SmartTabGroups tabs={tabs} onArchive={handleArchiveTab} />
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📁</div>
                <div className="empty-state-text">
                  No tabs to group.<br />
                  Open some tabs to see smart grouping!
                </div>
              </div>
            )}
          </div>
        )}

        {activeView === 'analytics' && (
          <AnalyticsDashboard />
        )}

        {activeView === 'archived' && (
          <div className="section">
            <h3 className="section-title">Archived Tabs</h3>
            <div className="search-container">
              <div className="search-icon">🔍</div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search archived tabs..."
                className="search-input"
              />
            </div>
            
            {archivedTabs.length > 0 ? (
              <ArchivedTabs tabs={filteredArchivedTabs} onRestore={handleRestoreTab} />
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📚</div>
                <div className="empty-state-text">
                  No archived tabs yet.<br />
                  Archive tabs to keep them organized!
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default App; 