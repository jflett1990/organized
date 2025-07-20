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
      {loading && <div className="loading-overlay">Archiving...</div>}
      <div className="header">
        <h1>TabSense</h1>
        <button onClick={toggleTheme}>
          {theme === 'light' ? 'Dark' : 'Light'} Mode
        </button>
      </div>
      <TabGroup tabs={tabs} onArchive={handleArchiveTab} />

      <hr />

      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search archived tabs..."
      />
      <ArchivedTabs tabs={filteredArchivedTabs} onRestore={handleRestoreTab} />
    </div>
  );
};

export default App; 