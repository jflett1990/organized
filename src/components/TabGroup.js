import React from 'react';
import TabCard from './TabCard';

const TabGroup = ({ tabs, onArchive }) => {
  return (
    <div className="tab-group">
      {tabs.map(tab => (
        <TabCard key={tab.id} tab={tab} onArchive={onArchive} />
      ))}
    </div>
  );
};

export default TabGroup; 