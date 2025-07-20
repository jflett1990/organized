import React from 'react';

const TabCard = ({ tab, onArchive }) => {
  return (
    <div className="tab-card">
      <div className="tab-details">
        <img src={tab.favIconUrl} alt="favicon" className="favicon" />
        <div className="tab-info">
          <div className="tab-title">{tab.title}</div>
          <div className="tab-url">{tab.url}</div>
        </div>
      </div>
      <button onClick={() => onArchive(tab)} className="archive-button">
        Archive
      </button>
    </div>
  );
};

export default TabCard; 