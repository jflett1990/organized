import React, { useState, useEffect } from 'react';
import Fuse from 'fuse.js';
import TabGroup from '../components/TabGroup';
import ArchivedTabs from '../components/ArchivedTabs';
import { openDB, addArchivedTab, getArchivedTabs, removeArchivedTab } from '../utils/indexedDB';

const App = () => {
  const [tabs, setTabs] = useState([]);
  const [archivedTabs, setArchivedTabs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [theme, setTheme] = useState('light');
  const [loading, setLoading] = useState(false);

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
    openDB().then(() => {
      loadArchivedTabs();
    });
    loadOpenTabs();

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
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

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
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const filteredArchivedTabs = searchTerm
    ? fuse.search(searchTerm).map(result => result.item)
    : archivedTabs;

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

      <div className="main-content">
        {/* Stats Bar */}
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

        {/* Open Tabs Section */}
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

        <hr className="divider" />

        {/* Search Section */}
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
      </div>
    </div>
  );
};

export default App; 