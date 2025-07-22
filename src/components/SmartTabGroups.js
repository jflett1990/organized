import React, { useState, useEffect } from 'react';
import TabCard from './TabCard';

const SmartTabGroups = ({ tabs, onArchive }) => {
  const [groupedTabs, setGroupedTabs] = useState({});
  const [expandedGroups, setExpandedGroups] = useState({});
  const [groupingMode, setGroupingMode] = useState('category'); // 'category', 'domain', 'time'

  useEffect(() => {
    groupTabs();
  }, [tabs, groupingMode]);

  const groupTabs = () => {
    const groups = {};

    tabs.forEach(tab => {
      let groupKey;
      
      switch (groupingMode) {
        case 'domain':
          try {
            groupKey = new URL(tab.url).hostname;
          } catch {
            groupKey = 'Other';
          }
          break;
        case 'time':
          const now = new Date();
          const tabTime = new Date(tab.lastAccessed || Date.now());
          const hoursAgo = (now - tabTime) / (1000 * 60 * 60);
          
          if (hoursAgo < 1) groupKey = 'Last Hour';
          else if (hoursAgo < 6) groupKey = 'Last 6 Hours';
          else if (hoursAgo < 24) groupKey = 'Today';
          else groupKey = 'Older';
          break;
        case 'category':
        default:
          groupKey = getTabCategory(tab);
          break;
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(tab);
    });

    // Sort groups by tab count (descending)
    const sortedGroups = Object.keys(groups)
      .sort((a, b) => groups[b].length - groups[a].length)
      .reduce((acc, key) => {
        acc[key] = groups[key];
        return acc;
      }, {});

    setGroupedTabs(sortedGroups);

    // Auto-expand groups with few tabs
    const autoExpanded = {};
    Object.keys(sortedGroups).forEach(groupName => {
      autoExpanded[groupName] = sortedGroups[groupName].length <= 3;
    });
    setExpandedGroups(autoExpanded);
  };

  const getTabCategory = (tab) => {
    if (!tab.url) return 'Other';
    
    try {
      const domain = new URL(tab.url).hostname;
      
      const categories = {
        'Development': ['github.com', 'stackoverflow.com', 'developer.mozilla.org', 'npmjs.com', 'codepen.io', 'gitlab.com'],
        'Social': ['twitter.com', 'facebook.com', 'linkedin.com', 'instagram.com', 'reddit.com', 'discord.com'],
        'Productivity': ['docs.google.com', 'notion.so', 'trello.com', 'slack.com', 'asana.com', 'office.com'],
        'Learning': ['youtube.com', 'coursera.org', 'udemy.com', 'khan.academy.org', 'medium.com', 'wikipedia.org'],
        'Shopping': ['amazon.com', 'ebay.com', 'etsy.com', 'shopify.com', 'alibaba.com'],
        'Entertainment': ['netflix.com', 'spotify.com', 'twitch.tv', 'hulu.com', 'disney.com'],
        'News': ['cnn.com', 'bbc.com', 'reuters.com', 'techcrunch.com', 'hackernews.com']
      };
      
      for (const [category, domains] of Object.entries(categories)) {
        if (domains.some(d => domain.includes(d))) {
          return category;
        }
      }
      
      return 'General';
    } catch {
      return 'Other';
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Development': '💻',
      'Social': '👥',
      'Productivity': '📊',
      'Learning': '📚',
      'Shopping': '🛒',
      'Entertainment': '🎬',
      'News': '📰',
      'General': '🌐',
      'Other': '📄'
    };
    return icons[category] || '📁';
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Development': '#3b82f6',
      'Social': '#8b5cf6',
      'Productivity': '#10b981',
      'Learning': '#f59e0b',
      'Shopping': '#ef4444',
      'Entertainment': '#ec4899',
      'News': '#6b7280',
      'General': '#64748b',
      'Other': '#94a3b8'
    };
    return colors[category] || '#6b7280';
  };

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const archiveAllInGroup = (groupName) => {
    const tabsToArchive = groupedTabs[groupName];
    tabsToArchive.forEach(tab => onArchive(tab));
  };

  const createTabGroup = async (groupName) => {
    if (chrome.tabGroups) {
      const tabIds = groupedTabs[groupName].map(tab => tab.id);
      try {
        const groupId = await chrome.tabs.group({ tabIds });
        await chrome.tabGroups.update(groupId, { 
          title: groupName,
          color: 'blue'
        });
      } catch (error) {
        console.error('Failed to create tab group:', error);
      }
    }
  };

  return (
    <div className="smart-tab-groups">
      <div className="grouping-controls">
        <div className="grouping-modes">
          <button 
            className={`grouping-mode ${groupingMode === 'category' ? 'active' : ''}`}
            onClick={() => setGroupingMode('category')}
          >
            📂 Category
          </button>
          <button 
            className={`grouping-mode ${groupingMode === 'domain' ? 'active' : ''}`}
            onClick={() => setGroupingMode('domain')}
          >
            🌐 Domain
          </button>
          <button 
            className={`grouping-mode ${groupingMode === 'time' ? 'active' : ''}`}
            onClick={() => setGroupingMode('time')}
          >
            ⏰ Time
          </button>
        </div>
      </div>

      <div className="tab-groups-container">
        {Object.entries(groupedTabs).map(([groupName, groupTabs]) => (
          <div key={groupName} className="tab-group-section">
            <div className="group-header" onClick={() => toggleGroup(groupName)}>
              <div className="group-info">
                <span 
                  className="group-icon"
                  style={{ 
                    color: getCategoryColor(groupName),
                    fontSize: '16px'
                  }}
                >
                  {groupingMode === 'category' ? getCategoryIcon(groupName) : '📁'}
                </span>
                <span className="group-name">{groupName}</span>
                <span className="group-count">({groupTabs.length})</span>
              </div>
              
              <div className="group-actions">
                {chrome.tabGroups && groupingMode !== 'time' && (
                  <button 
                    className="group-action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      createTabGroup(groupName);
                    }}
                    title="Create browser tab group"
                  >
                    🔗
                  </button>
                )}
                
                <button 
                  className="group-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    archiveAllInGroup(groupName);
                  }}
                  title="Archive all tabs in group"
                >
                  📁
                </button>
                
                <span className="group-toggle">
                  {expandedGroups[groupName] ? '▼' : '▶'}
                </span>
              </div>
            </div>

            {expandedGroups[groupName] && (
              <div className="group-tabs">
                {groupTabs.map(tab => (
                  <TabCard 
                    key={tab.id} 
                    tab={tab} 
                    onArchive={onArchive}
                    showCategory={groupingMode !== 'category'}
                    category={groupingMode === 'category' ? groupName : getTabCategory(tab)}
                  />
                ))}
              </div>
            )}

            {!expandedGroups[groupName] && (
              <div className="group-preview">
                <div className="preview-tabs">
                  {groupTabs.slice(0, 3).map(tab => (
                    <div key={tab.id} className="preview-tab">
                      <img 
                        src={tab.favIconUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjOTQ5NGE0Ii8+Cjwvc3ZnPgo='} 
                        alt="favicon" 
                        className="preview-favicon"
                      />
                      <span className="preview-title">{tab.title}</span>
                    </div>
                  ))}
                  {groupTabs.length > 3 && (
                    <div className="preview-more">
                      +{groupTabs.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SmartTabGroups;