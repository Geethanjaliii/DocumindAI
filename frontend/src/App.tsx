import React from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  UploadCloud,
  FileText,
  Search,
  Files,
  BarChart3,
  Settings,
  Bell,
  HelpCircle
} from 'lucide-react';
import { LandingPage } from './components/screens/LandingPage';
import { AuthPage } from './components/screens/AuthPage';
import { Dashboard } from './components/screens/Dashboard';
import { UploadPage } from './components/screens/UploadPage';
import { DocumentsPage } from './components/screens/DocumentsPage';
import { DocumentDetails } from './components/screens/DocumentDetails';
import { DuplicatesPage } from './components/screens/DuplicatesPage';
import { AnalyticsPage } from './components/screens/AnalyticsPage';
import { SettingsPage } from './components/screens/SettingsPage';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { useSettings } from './services/queries';

// Central Workspace Layout Shell
const WorkspaceLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const { data: settings } = useSettings();
  const username = settings?.username || 'Alex Rivera';
  const org = settings?.organization || 'Admin Account';
  
  // Storage Quota Simulation
  const storagePercentage = 65; // 6.5 GB out of 10 GB
  
  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Upload', path: '/upload', icon: <UploadCloud size={18} /> },
    { name: 'Documents', path: '/documents', icon: <FileText size={18} /> },
    { name: 'Duplicates', path: '/duplicates', icon: <Files size={18} /> },
    { name: 'Analytics', path: '/analytics', icon: <BarChart3 size={18} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={18} /> },
  ];

  const handleSearchFocus = () => {
    searchInputRef.current?.focus();
  };

  return (
    <div className="layout-wrapper">
      {/* Left Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo-icon">D</div>
          <div>
            <div className="sidebar-brand-name">DocuMind AI</div>
            <div className="sidebar-brand-subtitle">Enterprise Extraction</div>
          </div>
        </div>

        <ul className="sidebar-menu">
          {menuItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <li key={item.name}>
                <Link to={item.path} className={`sidebar-link ${isActive ? 'active' : ''}`}>
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
          {/* Search Trigger Shortcut in Sidebar */}
          <li>
            <button
              onClick={handleSearchFocus}
              className="sidebar-link"
              style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer' }}
            >
              <Search size={18} />
              <span>Search</span>
            </button>
          </li>
        </ul>

        {/* Quota Progress meter */}
        <div className="sidebar-quota">
          <div className="sidebar-quota-header">
            <span>Storage Capacity</span>
            <span>{storagePercentage}%</span>
          </div>
          <div className="sidebar-quota-bar">
            <div className="sidebar-quota-fill" style={{ width: `${storagePercentage}%` }} />
          </div>
          <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-sidebar)', marginTop: '8px', opacity: 0.8 }}>
            6.5 GB of 10 GB limit
          </span>
        </div>

        {/* User profile section */}
        <div className="sidebar-user">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100"
            alt="User profile"
            className="sidebar-user-avatar"
          />
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{username}</span>
            <span className="sidebar-user-role">{org}</span>
          </div>
        </div>
      </aside>

      {/* Main content page area */}
      <div className="main-content">
        {/* Top Header */}
        <header className="header">
          <div className="header-search">
            <Search size={16} color="var(--text-muted)" />
            <input
              ref={searchInputRef}
              type="text"
              className="header-search-input"
              placeholder="Search files, batches, or entities..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const target = e.target as HTMLInputElement;
                  window.location.href = `/documents?q=${target.value}`;
                }
              }}
            />
          </div>

          <div className="header-actions">
            <button className="header-btn">
              <Bell size={18} color="var(--text-muted)" />
              <div className="header-btn-badge" />
            </button>
            <button className="header-btn">
              <HelpCircle size={18} color="var(--text-muted)" />
            </button>
            
            <div style={{ height: '20px', width: '1px', backgroundColor: 'var(--border-light)' }} />
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>{username}</span>
              <span style={{ fontSize: '0.65rem', backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-muted)' }}>PROJECT LEAD</span>
            </div>
          </div>
        </header>

        {/* Child Views container */}
        <div className="content-container">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        {/* Public Pages */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />

        {/* Authenticated Workspace Pages */}
        <Route path="/dashboard" element={<WorkspaceLayout><Dashboard /></WorkspaceLayout>} />
        <Route path="/upload" element={<WorkspaceLayout><UploadPage /></WorkspaceLayout>} />
        <Route path="/documents" element={<WorkspaceLayout><DocumentsPage /></WorkspaceLayout>} />
        <Route path="/documents/:id" element={<WorkspaceLayout><DocumentDetails /></WorkspaceLayout>} />
        <Route path="/duplicates" element={<WorkspaceLayout><DuplicatesPage /></WorkspaceLayout>} />
        <Route path="/analytics" element={<WorkspaceLayout><AnalyticsPage /></WorkspaceLayout>} />
        <Route path="/settings" element={<WorkspaceLayout><SettingsPage /></WorkspaceLayout>} />

        {/* Fallback routing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

export default App;
