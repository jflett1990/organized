import React from 'react';

const ArchivedTabs = ({ tabs, onRestore }) => {
  return (
    <div className="archived-tabs">
      <h2>Archived Tabs</h2>
      {tabs.map(tab => (
        <div key={tab.id} className="archived-tab-card">
          <div className="tab-info">
            <div className="tab-title">{tab.title}</div>
            <div className="tab-url">{tab.url}</div>
            {tab.notes && <div className="tab-notes">{tab.notes}</div>}
          </div>
          <button onClick={() => onRestore(tab)} className="restore-button">
            Restore
          </button>
        </div>
      ))}
    </div>
  );
};

export default ArchivedTabs; 