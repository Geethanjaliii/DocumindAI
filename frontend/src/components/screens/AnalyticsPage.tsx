import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Activity, Clock, FileWarning, ArrowUpRight } from 'lucide-react';
import { Card } from '../ui/Card';

// ---------------------------------------------------------
// Custom SVG Radial Gauge Chart
// ---------------------------------------------------------
const RadialGauge: React.FC<{ percentage: number; label: string; color: string }> = ({
  percentage,
  label,
  color,
}) => {
  const size = 120;
  const radius = 45;
  const strokeWidth = 10;
  const circ = 2 * Math.PI * radius;
  const strokeDashoffset = circ - (percentage / 100) * circ;
  const center = size / 2;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background circle */}
          <circle
            cx={center} cy={center} r={radius} fill="transparent"
            stroke="#f1f5f9" strokeWidth={strokeWidth}
          />
          {/* Foreground circle */}
          <circle
            cx={center} cy={center} r={radius} fill="transparent"
            stroke={color} strokeWidth={strokeWidth}
            strokeDasharray={circ}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${center} ${center})`}
            style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
          />
        </svg>
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.25rem',
          fontWeight: 700,
          fontFamily: 'var(--font-display)',
          color: '#0f172a'
        }}>
          {percentage}%
        </div>
      </div>
      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
    </div>
  );
};

export const AnalyticsPage: React.FC = () => {
  const categories = [
    { name: 'Invoices Extraction', rate: 99.4, color: 'var(--primary)' },
    { name: 'Receipts Parsing', rate: 96.2, color: 'var(--accent)' },
    { name: 'Purchase Order Matching', rate: 98.9, color: 'var(--success)' },
    { name: 'Duplicate Interception', rate: 100, color: 'var(--warning)' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="page-header">
        <div>
          <h1 className="page-header-title">Analytics & Intelligence</h1>
          <p className="page-header-desc">Deep-dive audit metrics detailing parsing speeds, success ratios, and extraction confidence.</p>
        </div>
      </div>

      {/* Accuracy Gauges Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        <Card title="Average AI Accuracy">
          <RadialGauge percentage={98.2} label="Field Extraction Accuracy" color="var(--primary)" />
        </Card>
        <Card title="OCR Confidence">
          <RadialGauge percentage={97.8} label="Neural OCR Text Read" color="var(--accent)" />
        </Card>
        <Card title="Classification Rate">
          <RadialGauge percentage={99.1} label="Document Sorting Success" color="var(--success)" />
        </Card>
        <Card title="SLA Compliance">
          <RadialGauge percentage={99.9} label="Latency under 5s Target" color="#3b82f6" />
        </Card>
      </div>

      {/* Performance Split */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '28px' }}>
        {/* Model Accuracy by category */}
        <Card title="Extraction Accuracy by Category">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {categories.map((cat, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 500 }}>{cat.name}</span>
                  <span style={{ fontWeight: 'bold' }}>{cat.rate}%</span>
                </div>
                <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${cat.rate}%`, height: '100%', backgroundColor: cat.color }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Processing Efficiency metrics */}
        <Card title="Performance Efficiency Parameters">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', marginBottom: '8px' }}>
                <Clock size={18} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Avg Processing Latency</span>
              </div>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>1.4 seconds</span>
              <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--success-text)', marginTop: '4px' }}>
                <ArrowUpRight size={12} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> 12% faster than v2.3
              </span>
            </div>

            <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', marginBottom: '8px' }}>
                <Activity size={18} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Success Ratio</span>
              </div>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>99.85%</span>
              <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--success-text)', marginTop: '4px' }}>
                Only 0.15% failed OCR threshold
              </span>
            </div>

            <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', marginBottom: '8px' }}>
                <Sparkles size={18} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Token Optimization</span>
              </div>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>42% savings</span>
              <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                via Gemini Context Cache
              </span>
            </div>

            <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--warning)', marginBottom: '8px' }}>
                <FileWarning size={18} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Duplicate Intercepts</span>
              </div>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>1,294 files</span>
              <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--success-text)', marginTop: '4px' }}>
                Prevented double-payment risk
              </span>
            </div>
          </div>
        </Card>
      </div>
    </motion.div>
  );
};
