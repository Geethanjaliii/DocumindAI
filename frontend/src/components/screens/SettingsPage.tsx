import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Key, Bell, Shield, Plus, Copy, Trash2, Check } from 'lucide-react';
import { useSettings, useUpdateSettings } from '../../services/queries';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export const SettingsPage: React.FC = () => {
  const { data: settings } = useSettings();
  const updateSettingsMutation = useUpdateSettings();

  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'api' | 'notifications' | 'security'>('profile');
  const [profileData, setProfileData] = useState({ username: '', email: '', organization: '' });
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<{ key: string; name: string; created: string }[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [showAddKey, setShowAddKey] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (settings) {
      setProfileData({
        username: settings.username || '',
        email: settings.email || '',
        organization: settings.organization || ''
      });
      setApiKeys(settings.api_keys || []);
    }
  }, [settings]);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (settings) {
      updateSettingsMutation.mutate({
        ...settings,
        ...profileData
      }, {
        onSuccess: () => {
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 2000);
        }
      });
    }
  };

  const handleCopyKey = (keyStr: string) => {
    navigator.clipboard.writeText(keyStr);
    setCopiedKey(keyStr);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleGenerateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName) return;

    const newKey = {
      key: `dm_${activeSubTab === 'profile' ? 'live' : 'test'}_${Math.random().toString(36).substr(2, 20)}`,
      name: newKeyName,
      created: new Date().toISOString()
    };

    const updatedKeys = [...apiKeys, newKey];
    setApiKeys(updatedKeys);
    setNewKeyName('');
    setShowAddKey(false);

    if (settings) {
      updateSettingsMutation.mutate({
        ...settings,
        api_keys: updatedKeys
      });
    }
  };

  const handleRevokeKey = (keyStr: string) => {
    if (confirm("Are you sure you want to revoke this API key?")) {
      const updatedKeys = apiKeys.filter(k => k.key !== keyStr);
      setApiKeys(updatedKeys);
      if (settings) {
        updateSettingsMutation.mutate({
          ...settings,
          api_keys: updatedKeys
        });
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="page-header">
        <div>
          <h1 className="page-header-title">Settings</h1>
          <p className="page-header-desc">Manage API integrations, user accounts, and notification alert thresholds.</p>
        </div>
      </div>

      <div className="settings-layout">
        {/* Sub Navigation Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={() => setActiveSubTab('profile')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: activeSubTab === 'profile' ? '#e2e8f0' : 'transparent',
              color: activeSubTab === 'profile' ? 'var(--text-main)' : 'var(--text-muted)',
              fontWeight: 500,
              fontSize: '0.85rem',
              textAlign: 'left',
              cursor: 'pointer'
            }}
          >
            <User size={16} /> Account Profile
          </button>
          
          <button
            onClick={() => setActiveSubTab('api')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: activeSubTab === 'api' ? '#e2e8f0' : 'transparent',
              color: activeSubTab === 'api' ? 'var(--text-main)' : 'var(--text-muted)',
              fontWeight: 500,
              fontSize: '0.85rem',
              textAlign: 'left',
              cursor: 'pointer'
            }}
          >
            <Key size={16} /> API Access Keys
          </button>

          <button
            onClick={() => setActiveSubTab('notifications')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: activeSubTab === 'notifications' ? '#e2e8f0' : 'transparent',
              color: activeSubTab === 'notifications' ? 'var(--text-main)' : 'var(--text-muted)',
              fontWeight: 500,
              fontSize: '0.85rem',
              textAlign: 'left',
              cursor: 'pointer'
            }}
          >
            <Bell size={16} /> Notifications
          </button>

          <button
            onClick={() => setActiveSubTab('security')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: activeSubTab === 'security' ? '#e2e8f0' : 'transparent',
              color: activeSubTab === 'security' ? 'var(--text-main)' : 'var(--text-muted)',
              fontWeight: 500,
              fontSize: '0.85rem',
              textAlign: 'left',
              cursor: 'pointer'
            }}
          >
            <Shield size={16} /> Security Settings
          </button>
        </div>

        {/* Configurations Forms Container */}
        <div>
          {activeSubTab === 'profile' && (
            <Card title="Account Profile">
              <form onSubmit={handleProfileSubmit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="username">Full Name</label>
                  <input
                    id="username"
                    type="text"
                    className="form-input"
                    value={profileData.username}
                    onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    className="form-input"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="organization">Organization Name</label>
                  <input
                    id="organization"
                    type="text"
                    className="form-input"
                    value={profileData.organization}
                    onChange={(e) => setProfileData({ ...profileData, organization: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <Button variant="primary" type="submit">
                    Save Profile Changes
                  </Button>
                  {saveSuccess && (
                    <span style={{ color: 'var(--success-text)', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={14} /> Saved profile!
                    </span>
                  )}
                </div>
              </form>
            </Card>
          )}

          {activeSubTab === 'api' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <Card title="API Access Tokens" actions={
                <Button variant="primary" style={{ padding: '6px 12px', fontSize: '0.75rem' }} icon={<Plus size={14} />} onClick={() => setShowAddKey(!showAddKey)}>
                  New Key
                </Button>
              }>
                {showAddKey && (
                  <form onSubmit={handleGenerateKey} style={{
                    marginBottom: '20px',
                    padding: '16px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid var(--border-light)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" htmlFor="keyname">Token Label / Description</label>
                      <input
                        id="keyname"
                        type="text"
                        placeholder="e.g. Production Ingestion Engine"
                        className="form-input"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button variant="primary" type="submit" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Generate</Button>
                      <Button variant="outline" type="button" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => setShowAddKey(false)}>Cancel</Button>
                    </div>
                  </form>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {apiKeys.length > 0 ? (
                    apiKeys.map((keyObj, i) => (
                      <div key={i} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '14px 16px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid var(--border-light)'
                      }}>
                        <div>
                          <span style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem' }}>{keyObj.name}</span>
                          <code style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {keyObj.key.substr(0, 8)}••••••••••••••••
                          </code>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Button variant="ghost" style={{ padding: '4px' }} onClick={() => handleCopyKey(keyObj.key)}>
                            {copiedKey === keyObj.key ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                          </Button>
                          <Button variant="ghost" style={{ padding: '4px', color: 'var(--error)' }} onClick={() => handleRevokeKey(keyObj.key)}>
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '20px', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
                      No active API keys found. Generate a key to begin code integrations.
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {activeSubTab === 'notifications' && (
            <Card title="Alert Preferences">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <input type="checkbox" id="email-comp" defaultChecked style={{ marginTop: '4px' }} />
                  <div>
                    <label htmlFor="email-comp" style={{ fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>Document Extraction Complete</label>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Receive email summaries of daily invoices and receipt counts.</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <input type="checkbox" id="email-fail" defaultChecked style={{ marginTop: '4px' }} />
                  <div>
                    <label htmlFor="email-fail" style={{ fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>Anomaly & Failure Alerts</label>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Immediate notifications if OCR confidence falls below threshold or files lack signatures.</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <input type="checkbox" id="email-dup" defaultChecked style={{ marginTop: '4px' }} />
                  <div>
                    <label htmlFor="email-dup" style={{ fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>Duplicate Interception Notifications</label>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Receive an alert when our vector matching flags invoices with identical identifiers.</span>
                  </div>
                </div>

                <Button variant="primary" style={{ alignSelf: 'flex-start' }}>Save Alert Rules</Button>
              </div>
            </Card>
          )}

          {activeSubTab === 'security' && (
            <Card title="Security Credentials">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border-light)' }}>
                  <div>
                    <span style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem' }}>Multi-Factor Authentication (MFA)</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Secure your admin workspace with authenticator app tokens.</span>
                  </div>
                  <span className="badge badge-error">DISABLED</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem' }}>Login Session Audit Log</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Track IP addresses and timestamps of recent login actions.</span>
                  </div>
                  <Button variant="outline" style={{ fontSize: '0.75rem', padding: '6px 12px' }}>View Logs</Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  );
};
