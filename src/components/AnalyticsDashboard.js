import React, { useState, useEffect } from 'react';

const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [activeView, setActiveView] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
    loadSuggestions();
  }, []);

  const loadAnalytics = () => {
    chrome.runtime.sendMessage({ type: 'GET_ANALYTICS' }, (response) => {
      setAnalytics(response);
      setLoading(false);
    });
  };

  const loadSuggestions = () => {
    chrome.runtime.sendMessage({ type: 'GET_TAB_SUGGESTIONS' }, (response) => {
      setSuggestions(response.suggestions || []);
    });
  };

  const formatTime = (milliseconds) => {
    const minutes = Math.floor(milliseconds / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const getProductivityLevel = (score) => {
    if (score > 100) return { level: 'Excellent', color: '#10b981', emoji: '🚀' };
    if (score > 50) return { level: 'Good', color: '#3b82f6', emoji: '📈' };
    if (score > 20) return { level: 'Fair', color: '#f59e0b', emoji: '⚡' };
    return { level: 'Starting', color: '#6b7280', emoji: '🌱' };
  };

  const getTodayStats = () => {
    if (!analytics?.dailyStats) return {};
    const today = new Date().toDateString();
    return analytics.dailyStats[today] || {};
  };

  const calculateTotalFocusTime = () => {
    if (!analytics?.focusTime) return 0;
    return Object.values(analytics.focusTime).reduce((total, time) => total + time, 0);
  };

  const applySuggestion = async (suggestion) => {
    if (suggestion.type === 'ARCHIVE_OLD') {
      // Archive suggested tabs
      for (const tab of suggestion.tabs) {
        chrome.runtime.sendMessage({
          type: 'ARCHIVE_TAB',
          tab: tab
        });
      }
      loadSuggestions(); // Refresh suggestions
    }
    
    if (suggestion.type === 'GROUP_SIMILAR') {
      // Create tab group (Chrome feature)
      if (chrome.tabGroups) {
        const groupId = await chrome.tabs.group({ tabIds: suggestion.tabs.map(t => t.id) });
        chrome.tabGroups.update(groupId, { 
          title: suggestion.domain,
          color: 'blue'
        });
      }
      loadSuggestions();
    }
  };

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="loading-spinner"></div>
        <div>Loading insights...</div>
      </div>
    );
  }

  const todayStats = getTodayStats();
  const totalFocusTime = calculateTotalFocusTime();
  const productivityInfo = getProductivityLevel(analytics?.productivityScore || 0);

  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <h3 className="section-title">📊 Productivity Insights</h3>
        <div className="view-tabs">
          <button 
            className={`view-tab ${activeView === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveView('overview')}
          >
            Overview
          </button>
          <button 
            className={`view-tab ${activeView === 'suggestions' ? 'active' : ''}`}
            onClick={() => setActiveView('suggestions')}
          >
            Suggestions ({suggestions.length})
          </button>
        </div>
      </div>

      {activeView === 'overview' && (
        <div className="analytics-content">
          {/* Productivity Score */}
          <div className="productivity-card">
            <div className="productivity-header">
              <span className="productivity-emoji">{productivityInfo.emoji}</span>
              <div>
                <div className="productivity-level" style={{ color: productivityInfo.color }}>
                  {productivityInfo.level}
                </div>
                <div className="productivity-score">
                  Score: {analytics?.productivityScore || 0}
                </div>
              </div>
            </div>
            <div className="productivity-bar">
              <div 
                className="productivity-fill" 
                style={{ 
                  width: `${Math.min((analytics?.productivityScore || 0) / 100 * 100, 100)}%`,
                  backgroundColor: productivityInfo.color 
                }}
              ></div>
            </div>
          </div>

          {/* Today's Activity */}
          <div className="activity-grid">
            <div className="activity-card">
              <div className="activity-icon">⏱️</div>
              <div className="activity-info">
                <div className="activity-value">{formatTime(totalFocusTime)}</div>
                <div className="activity-label">Focus Time</div>
              </div>
            </div>
            
            <div className="activity-card">
              <div className="activity-icon">🔄</div>
              <div className="activity-info">
                <div className="activity-value">{analytics?.tabSwitches || 0}</div>
                <div className="activity-label">Tab Switches</div>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          {analytics?.focusTime && Object.keys(analytics.focusTime).length > 0 && (
            <div className="category-section">
              <h4 className="category-title">Time by Category</h4>
              <div className="category-list">
                {Object.entries(analytics.focusTime)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([category, time]) => (
                    <div key={category} className="category-item">
                      <div className="category-info">
                        <span className="category-name">{category}</span>
                        <span className="category-time">{formatTime(time)}</span>
                      </div>
                      <div className="category-bar">
                        <div 
                          className="category-fill"
                          style={{ 
                            width: `${(time / totalFocusTime) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Daily Activity */}
          {Object.keys(todayStats).length > 0 && (
            <div className="daily-section">
              <h4 className="category-title">Today's Activity</h4>
              <div className="daily-grid">
                {Object.entries(todayStats).map(([category, stats]) => (
                  <div key={category} className="daily-item">
                    <div className="daily-category">{category}</div>
                    <div className="daily-stats">
                      <span>📂 {stats.created}</span>
                      <span>👀 {stats.visited}</span>
                      <span>❌ {stats.closed}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeView === 'suggestions' && (
        <div className="suggestions-content">
          {suggestions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">✨</div>
              <div className="empty-state-text">
                No suggestions right now.<br />
                Keep browsing to get smart recommendations!
              </div>
            </div>
          ) : (
            <div className="suggestions-list">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="suggestion-card">
                  <div className="suggestion-content">
                    <div className="suggestion-icon">
                      {suggestion.type === 'GROUP_SIMILAR' ? '📁' : '🗂️'}
                    </div>
                    <div className="suggestion-info">
                      <div className="suggestion-message">{suggestion.message}</div>
                      <div className="suggestion-detail">
                        {suggestion.type === 'GROUP_SIMILAR' && 
                          `${suggestion.domain} • ${suggestion.tabs.length} tabs`
                        }
                        {suggestion.type === 'ARCHIVE_OLD' && 
                          `Save ${suggestion.tabs.length} idle tabs`
                        }
                      </div>
                    </div>
                  </div>
                  <button 
                    className="suggestion-action"
                    onClick={() => applySuggestion(suggestion)}
                  >
                    Apply
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;