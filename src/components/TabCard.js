import React from 'react';

const TabCard = ({ tab, onArchive }) => {
  const handleSwitchToTab = () => {
    chrome.tabs.update(tab.id, { active: true });
    chrome.windows.update(tab.windowId, { focused: true });
  };

  const getDomainFromUrl = (url) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  return (
    <div className="tab-card">
      <div className="tab-details" onClick={handleSwitchToTab} style={{ cursor: 'pointer' }}>
        <img 
          src={tab.favIconUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjOTQ5NGE0Ii8+Cjwvc3ZnPgo='} 
          alt="favicon" 
          className="favicon"
          onError={(e) => {
            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjOTQ5NGE0Ii8+Cjwvc3ZnPgo=';
          }}
        />
        <div className="tab-info">
          <div className="tab-title" title={tab.title}>
            {tab.title || 'Untitled Tab'}
          </div>
          <div className="tab-url" title={tab.url}>
            {getDomainFromUrl(tab.url)}
          </div>
        </div>
      </div>
      
      <div className="tab-actions">
        <button 
          onClick={() => onArchive(tab)} 
          className="archive-button"
          title="Archive this tab"
        >
          📁 Archive
        </button>
      </div>
    </div>
  );
};

export default TabCard; 