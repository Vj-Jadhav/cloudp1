import React from 'react';
import { GraduationCap, Plus, Database, RefreshCw } from 'lucide-react';

export const Header = ({ onAddClick, healthStatus, onRefresh, loading }) => {
  const getStatusClass = () => {
    if (healthStatus === 'UP') return 'online';
    if (healthStatus === 'DEGRADED' || healthStatus === 'DOWN') return 'offline';
    return 'connecting';
  };

  const getStatusText = () => {
    if (healthStatus === 'UP') return 'API Connected';
    if (healthStatus === 'DEGRADED') return 'Degraded (No DB)';
    if (healthStatus === 'DOWN') return 'API Offline';
    return 'Checking API...';
  };

  return (
    <header className="header" role="banner">
      <div className="brand-section">
        <div className="brand-logo" aria-hidden="true">
          <GraduationCap size={28} />
        </div>
        <div>
          <h1 className="brand-title">Student Management Dashboard</h1>
          <div className="brand-subtitle">
            <span>Three-Tier Cloud Architecture</span>
            <span>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Database size={13} /> MongoDB Atlas
            </span>
          </div>
        </div>
      </div>

      <div className="header-actions">
        {/* Backend Connectivity Status Pill */}
        <div
          className="health-pill"
          title={`Backend status: ${getStatusText()}`}
          aria-label={`Server health: ${getStatusText()}`}
        >
          <span className={`health-dot ${getStatusClass()}`} aria-hidden="true" />
          <span>{getStatusText()}</span>
        </div>

        {/* Manual Refresh Button */}
        {onRefresh && (
          <button
            id="btn-refresh-students"
            className="btn btn-secondary"
            onClick={onRefresh}
            disabled={loading}
            title="Refresh student records from MongoDB"
            aria-label="Refresh student list"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw
              size={16}
              style={{
                animation: loading ? 'spin 1s linear infinite' : 'none',
              }}
              aria-hidden="true"
            />
            <span>Refresh</span>
          </button>
        )}

        {/* Add Student CTA */}
        <button
          id="btn-add-student"
          className="btn btn-primary"
          onClick={onAddClick}
          aria-label="Add new student"
        >
          <Plus size={18} aria-hidden="true" />
          <span>Add Student</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
