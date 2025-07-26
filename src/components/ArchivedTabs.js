import React from 'react';

const ArchivedTabs = ({ tabs, onRestore }) => {
  const getDomainFromUrl = (url) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = (now - date) / (1000 * 60 * 60);
      
      if (diffInHours < 1) {
        return 'Just now';
      } else if (diffInHours < 24) {
        return `${Math.floor(diffInHours)}h ago`;
      } else {
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d ago`;
      }
    } catch {
      return '';
    }
  };

  if (tabs.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🔍</div>
        <div className="empty-state-text">No matching archived tabs found</div>
      </div>
    );
  }

  return (
    <div className="archived-tabs">
      {tabs.map(tab => (
        <div key={tab.id} className="archived-tab-card">
          <div className="archived-tab-content">
            <div className="archived-tab-info">
              <div className="tab-info">
                <div className="tab-title" title={tab.title}>
                  {tab.title || 'Untitled Tab'}
                </div>
                <div className="tab-url" title={tab.url}>
                  {getDomainFromUrl(tab.url)}
                  {tab.archivedAt && (
                    <span style={{ marginLeft: '8px', opacity: 0.7 }}>
                      • {formatDate(tab.archivedAt)}
                    </span>
                  )}
                </div>
              </div>
              
              {tab.notes && (
                <div className="tab-notes">
                  💭 {tab.notes}
                </div>
              )}
              
              {tab.metadata && tab.metadata.description && (
                <div className="tab-notes">
                  📄 {tab.metadata.description.substring(0, 100)}
                  {tab.metadata.description.length > 100 ? '...' : ''}
                </div>
              )}
            </div>
            
            <div className="tab-actions">
              <button 
                onClick={() => onRestore(tab)} 
                className="restore-button"
                title="Restore this tab"
              >
                ↩️ Restore
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ArchivedTabs; 