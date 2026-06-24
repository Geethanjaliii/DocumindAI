import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { api } from '../../services/api';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password || (isRegister && !formData.name)) {
      setError('Please fill in all fields');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        await api.register({
          email: formData.email,
          password: formData.password,
          full_name: formData.name
        });
      } else {
        await api.login({
          email: formData.email,
          password: formData.password
        });
      }
      navigate('/dashboard');
    } catch (err: any) {
      console.warn("Backend auth failed, invoking mock fallback:", err);
      // Fallback
      localStorage.setItem('documind_token', 'mock-jwt-token-xyz123');
      const currentSettings = JSON.parse(localStorage.getItem('documind_settings') || '{}');
      localStorage.setItem('documind_settings', JSON.stringify({
        ...currentSettings,
        username: formData.name || currentSettings.username || 'Alex Rivera',
        email: formData.email
      }));
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1.1fr 1fr',
      minHeight: '100vh',
      backgroundColor: '#f8fafc'
    }}>
      {/* Left Glassmorphism Illustration Panel */}
      <div className="auth-split-banner">
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'white', opacity: 0.8, fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Back to home
        </Link>
        
        <div style={{ margin: 'auto 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'white', marginBottom: '24px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'var(--primary-gradient)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '18px',
              fontWeight: 800
            }}>D</div>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>DocuMind AI</span>
          </div>

          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'white', marginBottom: '16px', lineHeight: 1.25 }}>
            Automate Document Extraction in Minutes
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: '480px' }}>
            Upload PDFs, PNGs, or JPEGs. Our LLM pipeline reads texts, detects duplicates, classifies document types, and maps fields into structured databases instantly.
          </p>
        </div>

        {/* Glassmorphic visual element */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10b981' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#10b981' }}>SYSTEM ONLINE</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem', fontFamily: 'monospace' }}>
            <div>&gt; Initializing OCR engine... Done.</div>
            <div>&gt; Loading Gemini schema... Active.</div>
            <div>&gt; Extraction Accuracy: <span style={{ color: '#a78bfa' }}>98.2% avg</span></div>
          </div>
        </div>
      </div>

      {/* Right Login / Register forms */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px'
      }}>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          style={{ maxWidth: '400px', width: '100%' }}
        >
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', marginBottom: '8px' }}>
              {isRegister ? 'Create your account' : 'Sign in to DocuMind'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {isRegister ? 'Start your 14-day free trial.' : 'Enter your credentials to access the platform.'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {error && (
              <div style={{
                backgroundColor: 'var(--error-bg)',
                border: '1px solid var(--error-border)',
                color: 'var(--error-text)',
                padding: '10px 14px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 500
              }}>
                {error}
              </div>
            )}

            {isRegister && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="name">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }}><User size={16} /></span>
                  <input
                    id="name"
                    type="text"
                    className="form-input"
                    placeholder="Alex Rivera"
                    style={{ paddingLeft: '38px' }}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="email">Work Email</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }}><Mail size={16} /></span>
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  placeholder="alex@company.com"
                  style={{ paddingLeft: '38px' }}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" htmlFor="password" style={{ marginBottom: 0 }}>Password</label>
                {!isRegister && <a href="#" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 500 }}>Forgot password?</a>}
              </div>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }}><Lock size={16} /></span>
                <input
                  id="password"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  style={{ paddingLeft: '38px' }}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            <Button variant="primary" type="submit" loading={loading} style={{ padding: '10px', fontSize: '0.95rem', fontWeight: 600 }}>
              {isRegister ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          {/* Social Logins */}
          <div style={{ margin: '24px 0', textAlign: 'center', position: 'relative' }}>
            <span style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              backgroundColor: '#f8fafc',
              padding: '0 8px',
              position: 'relative',
              zIndex: 2
            }}>OR CONTINUE WITH</span>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              height: '1px',
              backgroundColor: 'var(--border-light)',
              zIndex: 1
            }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Button variant="outline" icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.12 1 1.16 5.92 1.16 12s4.96 11 11.08 11c6.39 0 10.646-4.411 10.646-10.702 0-.72-.073-1.272-.174-1.821H12.24z"/>
              </svg>
            } onClick={() => { setLoading(true); setTimeout(() => navigate('/dashboard'), 1000); }}>
              Google
            </Button>
            
            <Button variant="outline" icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.167 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
            } onClick={() => { setLoading(true); setTimeout(() => navigate('/dashboard'), 1000); }}>
              GitHub
            </Button>
          </div>

          <div style={{ marginTop: '32px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => setIsRegister(!isRegister)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--primary)',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {isRegister ? 'Sign In' : 'Register'}
              </button>
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
