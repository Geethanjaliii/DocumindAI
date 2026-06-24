import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Cpu, ShieldCheck, BarChart3, ArrowRight, Check, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';

export const LandingPage: React.FC = () => {
  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* Header / Navbar */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 48px',
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: '#ffffff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            background: 'var(--primary-gradient)',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '14px'
          }}>D</div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '18px', letterSpacing: '-0.02em' }}>DocuMind AI</span>
        </div>
        <nav style={{ display: 'flex', gap: '32px', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}>
          <a href="#features" style={{ transition: 'color 0.2s' }} className="nav-hover">Features</a>
          <a href="#demo" style={{ transition: 'color 0.2s' }} className="nav-hover">Product Demo</a>
          <a href="#pricing" style={{ transition: 'color 0.2s' }} className="nav-hover">Pricing</a>
        </nav>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Link to="/login" style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}>Sign In</Link>
          <Link to="/register">
            <Button variant="primary">Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ padding: '80px 24px', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            backgroundColor: 'var(--primary-light)',
            border: '1px solid var(--primary-border)',
            borderRadius: '20px',
            color: 'var(--primary)',
            fontSize: '0.8rem',
            fontWeight: 600,
            marginBottom: '28px'
          }}>
            <span style={{
              padding: '2px 6px',
              backgroundColor: 'var(--primary)',
              color: 'white',
              borderRadius: '10px',
              fontSize: '0.7rem'
            }}>NEW</span>
            v2.4 Enterprise Model Released
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '3.75rem',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            color: '#0f172a',
            maxWidth: '850px',
            margin: '0 auto 24px auto'
          }}>
            Unlock the Intelligence in <span style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #8b5cf6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Every Document</span>
          </h1>

          <p style={{
            fontSize: '1.15rem',
            color: 'var(--text-muted)',
            maxWidth: '650px',
            margin: '0 auto 36px auto',
            lineHeight: 1.6
          }}>
            Go beyond simple OCR. DocuMind uses proprietary LLMs to classify, extract, and analyze complex unstructured data with 99.9% precision.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <Link to="/register">
              <Button variant="primary" style={{ padding: '12px 28px', fontSize: '1rem' }} icon={<ArrowRight size={18} />}>
                Start Free Trial
              </Button>
            </Link>
            <a href="#demo">
              <Button variant="outline" style={{ padding: '12px 28px', fontSize: '1rem' }} icon={<Play size={18} fill="currentColor" />}>
                Watch Demo
              </Button>
            </a>
          </div>
        </motion.div>

        {/* Product Demo Preview */}
        <motion.div
          id="demo"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{
            marginTop: '64px',
            background: '#0f172a',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: 'var(--shadow-premium)',
            maxWidth: '960px',
            margin: '64px auto 0 auto',
            textAlign: 'left'
          }}
        >
          {/* Mock Window Controls */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10b981' }} />
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginLeft: '12px', fontFamily: 'monospace' }}>extraction_engine_v2.0.pdf</span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: '20px',
            backgroundColor: '#1e293b',
            borderRadius: '8px',
            padding: '24px',
            color: 'white',
            minHeight: '280px'
          }}>
            {/* Simulated Document Viewer */}
            <div style={{ borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ height: '12px', width: '30%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '6px' }} />
                <div style={{ height: '12px', width: '80%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '6px' }} />
                <div style={{
                  height: '14px',
                  width: '90%',
                  backgroundColor: 'rgba(99, 102, 241, 0.2)',
                  border: '1px solid rgba(99,102,241,0.5)',
                  borderRadius: '6px'
                }} />
                <div style={{ height: '12px', width: '50%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '6px' }} />
                <div style={{ height: '12px', width: '70%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '6px' }} />
              </div>
            </div>

            {/* Simulated Extraction results */}
            <div>
              <h4 style={{ fontSize: '0.8rem', color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Extraction Results</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>Invoice ID</span>
                  <span style={{ fontFamily: 'monospace', color: '#818cf8', fontWeight: 'bold' }}>INV-9042</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>Vendor</span>
                  <span style={{ fontWeight: 'bold' }}>Stripe, Inc.</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>Total Amount</span>
                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>$12,450.00</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>Tax ID</span>
                  <span style={{ color: '#10b981' }}>Verified</span>
                </div>
              </div>
              <div style={{
                marginTop: '16px',
                padding: '10px 14px',
                backgroundColor: 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: '6px',
                fontSize: '0.75rem'
              }}>
                <span style={{ color: '#a78bfa', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>✨ AI Summary</span>
                Found inconsistencies in line item tax calculations. Recommended for human review.
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Trusted By Companies Section */}
      <section style={{
        borderTop: '1px solid var(--border-light)',
        borderBottom: '1px solid var(--border-light)',
        backgroundColor: '#f8fafc',
        padding: '36px 24px',
        textAlign: 'center'
      }}>
        <p style={{
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          fontWeight: 600,
          marginBottom: '20px'
        }}>EMPOWERING DATA TEAMS AT</p>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '48px',
          flexWrap: 'wrap',
          opacity: 0.6,
          fontWeight: 700,
          color: '#475569',
          fontFamily: 'var(--font-display)',
          fontSize: '1rem'
        }}>
          <span>🏦 GlobalBank</span>
          <span>🛡️ SafeGuard</span>
          <span>🚀 TechNova</span>
          <span>📈 FinMetrics</span>
          <span>📦 LogisChain</span>
        </div>
      </section>

      {/* Feature cards section */}
      <section id="features" style={{ padding: '96px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '12px' }}>
            Precision Built for Enterprise
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '550px', margin: '0 auto' }}>
            DocuMind combines state-of-the-art vision models with linguistic analysis to turn documents into structured intelligence.
          </p>
        </div>

        <div className="landing-grid">
          <div className="landing-card">
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: '#e0e7ff',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              <Cpu size={20} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', fontWeight: 600 }}>Intelligent Field Extraction</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Automatically identify and extract specific data points from invoices, contracts, and IDs with semantic awareness.
            </p>
          </div>

          <div className="landing-card">
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: '#f5e6ff',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              <FileText size={20} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', fontWeight: 600 }}>Neural OCR</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              100% accurate text recognition even for handwritten notes, low-resolution scans, and rotated images.
            </p>
          </div>

          <div className="landing-card">
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: '#d1fae5',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              <ShieldCheck size={20} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', fontWeight: 600 }}>Auto-Classification</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Automatically sort incoming document streams into hundreds of custom categories.
            </p>
          </div>

          <div className="landing-card">
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: '#fee2e2',
              color: 'var(--error)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              <BarChart3 size={20} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', fontWeight: 600 }}>Operational Insights</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Monitor extraction accuracy, throughput trends, and anomaly detection in real-time.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{
        backgroundColor: '#f8fafc',
        borderTop: '1px solid var(--border-light)',
        borderBottom: '1px solid var(--border-light)',
        padding: '96px 24px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '12px' }}>
              Scalable Plans for Every Team
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '500px', margin: '0 auto' }}>
              Simple, transparent pricing built to grow with your document volume.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            maxWidth: '1000px',
            margin: '0 auto'
          }}>
            {/* Starter Plan */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid var(--border-light)', padding: '40px', position: 'relative' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>Starter</span>
              <div style={{ display: 'flex', alignItems: 'baseline', margin: '16px 0' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>$0</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginLeft: '4px' }}>/month</span>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', margin: '32px 0', fontSize: '0.9rem', color: '#475569' }}>
                <li style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><Check size={16} color="var(--success)" /> 100 pages / month</li>
                <li style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><Check size={16} color="var(--success)" /> Basic Extraction</li>
                <li style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><Check size={16} color="var(--success)" /> API Access</li>
              </ul>
              <Link to="/register" style={{ width: '100%' }}>
                <Button variant="outline" style={{ width: '100%', marginTop: 'auto' }}>Start Free</Button>
              </Link>
            </div>

            {/* Professional Plan (Highlighted) */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '2px solid var(--primary)',
              padding: '40px',
              position: 'relative',
              boxShadow: 'var(--shadow-lg)'
            }}>
              <div style={{
                position: 'absolute',
                top: '-12px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'var(--primary)',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '0.7rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>Most Popular</div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)', fontWeight: 700 }}>Professional</span>
              <div style={{ display: 'flex', alignItems: 'baseline', margin: '16px 0' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--primary)' }}>$149</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginLeft: '4px' }}>/month</span>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', margin: '32px 0', fontSize: '0.9rem', color: '#475569' }}>
                <li style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><Check size={16} color="var(--success)" /> 5,000 pages / month</li>
                <li style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><Check size={16} color="var(--success)" /> Custom ML Training</li>
                <li style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><Check size={16} color="var(--success)" /> Priority Support</li>
                <li style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><Check size={16} color="var(--success)" /> Advanced Analytics</li>
              </ul>
              <Link to="/register" style={{ width: '100%' }}>
                <Button variant="primary" style={{ width: '100%' }}>Upgrade Now</Button>
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid var(--border-light)', padding: '40px' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>Enterprise</span>
              <div style={{ display: 'flex', alignItems: 'baseline', margin: '16px 0' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>Custom</span>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', margin: '32px 0', fontSize: '0.9rem', color: '#475569' }}>
                <li style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><Check size={16} color="var(--success)" /> Unlimited Volume</li>
                <li style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><Check size={16} color="var(--success)" /> On-Prem Deployment</li>
                <li style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><Check size={16} color="var(--success)" /> Dedicated TAM</li>
                <li style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><Check size={16} color="var(--success)" /> SOC2 Compliance</li>
              </ul>
              <a href="mailto:sales@documind.ai" style={{ width: '100%' }}>
                <Button variant="outline" style={{ width: '100%' }}>Contact Sales</Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: '96px 24px', maxWidth: '960px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{
          background: 'radial-gradient(circle at top left, #1e1b4b, #0f172a)',
          borderRadius: '24px',
          padding: '64px 32px',
          color: 'white',
          boxShadow: 'var(--shadow-premium)'
        }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2.25rem', fontWeight: 800, color: 'white', marginBottom: '16px' }}>
            Ready to automate your document workflows?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', maxWidth: '550px', margin: '0 auto 36px auto', lineHeight: 1.5 }}>
            Join thousands of companies saving hours of manual data entry every single day.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <Link to="/register">
              <Button variant="primary" style={{ backgroundColor: '#ffffff', color: '#0f172a', fontWeight: 'bold' }}>Start Free Trial</Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'white' }}>Book a Demo</Button>
            </Link>
          </div>
          <span style={{ display: 'block', marginTop: '24px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>No credit card required. 14-day free trial.</span>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-light)',
        padding: '32px 48px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <span>DocuMind AI © 2026. Precision Document Intelligence.</span>
        <div style={{ display: 'flex', gap: '24px' }}>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Security</a>
          <a href="#">Status</a>
        </div>
      </footer>
    </div>
  );
};
