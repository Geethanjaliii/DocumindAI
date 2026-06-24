import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Files, CheckCircle2, TrendingUp, AlertTriangle, FileCode } from 'lucide-react';
import { useDashboardStats, useRecentDocuments } from '../../services/queries';
import { Skeleton } from '../ui/Skeleton';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Link } from 'react-router-dom';

// ---------------------------------------------------------
// Custom SVG Area Line Chart
// ---------------------------------------------------------
const UploadActivityChart: React.FC = () => {
  // Simple coordinates for a nice smooth wave
  const dataPoints = [30, 45, 35, 78, 65, 110, 40]; // Mon - Sun
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Chart dimensions
  const width = 500;
  const height = 150;
  const padding = 20;
  
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  
  const maxVal = 120;
  
  // Generate SVG path coordinates
  const points = dataPoints.map((val, idx) => {
    const x = padding + (idx / (dataPoints.length - 1)) * chartWidth;
    const y = height - padding - (val / maxVal) * chartHeight;
    return { x, y };
  });
  
  const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%">
      <defs>
        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
        </linearGradient>
      </defs>
      
      {/* Grid lines */}
      <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#f1f5f9" strokeWidth={1} />
      <line x1={padding} y1={padding + chartHeight / 2} x2={width - padding} y2={padding + chartHeight / 2} stroke="#f1f5f9" strokeWidth={1} />
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e2e8f0" strokeWidth={1} />
      
      {/* Area under the line */}
      <path d={areaPath} fill="url(#chartGradient)" />
      
      {/* The line itself */}
      <path d={linePath} fill="none" stroke="#4f46e5" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Interactive dots */}
      {points.map((p, idx) => (
        <g key={idx} className="chart-dot" style={{ cursor: 'pointer' }}>
          <circle cx={p.x} cy={p.y} r={4} fill="#ffffff" stroke="#4f46e5" strokeWidth={2} />
        </g>
      ))}

      {/* Axis Labels */}
      {labels.map((lbl, idx) => {
        const x = padding + (idx / (labels.length - 1)) * chartWidth;
        return (
          <text key={idx} x={x} y={height - 4} fontSize="8" fill="#64748b" textAnchor="middle" fontFamily="sans-serif">
            {lbl}
          </text>
        );
      })}
    </svg>
  );
};

// ---------------------------------------------------------
// Custom SVG Donut Chart
// ---------------------------------------------------------
const TypeDistributionChart: React.FC<{ stats: any }> = ({ stats }) => {
  const invoiceVal = stats?.invoice_count || 4230;
  const receiptVal = stats?.receipt_count || 3120;
  const poVal = stats?.purchase_order_count || 2800;
  const otherVal = stats?.other_count || 300;
  
  const total = invoiceVal + receiptVal + poVal + otherVal;
  
  // Arc calculation parameters
  const size = 150;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * radius;
  const center = size / 2;
  
  // Percentages
  const p1 = invoiceVal / total;
  const p2 = receiptVal / total;
  const p3 = poVal / total;
  const p4 = otherVal / total;
  
  // Offsets
  const offset1 = 0;
  const offset2 = circ * p1;
  const offset3 = circ * (p1 + p2);
  const offset4 = circ * (p1 + p2 + p3);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
      <div style={{ position: 'relative', width: `${size}px`, height: `${size}px` }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Circle segments */}
          {/* Invoice - Indigo */}
          <circle
            cx={center} cy={center} r={radius} fill="transparent"
            stroke="#4f46e5" strokeWidth={strokeWidth}
            strokeDasharray={`${circ * p1} ${circ}`}
            strokeDashoffset={-offset1}
            transform={`rotate(-90 ${center} ${center})`}
          />
          {/* Receipt - Purple */}
          <circle
            cx={center} cy={center} r={radius} fill="transparent"
            stroke="#8b5cf6" strokeWidth={strokeWidth}
            strokeDasharray={`${circ * p2} ${circ}`}
            strokeDashoffset={-offset2}
            transform={`rotate(-90 ${center} ${center})`}
          />
          {/* Purchase Order - Emerald */}
          <circle
            cx={center} cy={center} r={radius} fill="transparent"
            stroke="#10b981" strokeWidth={strokeWidth}
            strokeDasharray={`${circ * p3} ${circ}`}
            strokeDashoffset={-offset3}
            transform={`rotate(-90 ${center} ${center})`}
          />
          {/* Other - Gray */}
          <circle
            cx={center} cy={center} r={radius} fill="transparent"
            stroke="#94a3b8" strokeWidth={strokeWidth}
            strokeDasharray={`${circ * p4} ${circ}`}
            strokeDashoffset={-offset4}
            transform={`rotate(-90 ${center} ${center})`}
          />
        </svg>
        {/* Inner Label */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none'
        }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#0f172a' }}>
            {total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total}
          </span>
          <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Total</span>
        </div>
      </div>
      
      {/* Legends */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: '0.75rem', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4f46e5' }} />
          <span style={{ color: 'var(--text-muted)' }}>Invoices</span>
          <span style={{ marginLeft: 'auto', fontWeight: 'bold' }}>{Math.round(p1 * 100)}%</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#8b5cf6' }} />
          <span style={{ color: 'var(--text-muted)' }}>Receipts</span>
          <span style={{ marginLeft: 'auto', fontWeight: 'bold' }}>{Math.round(p2 * 100)}%</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
          <span style={{ color: 'var(--text-muted)' }}>P.O.s</span>
          <span style={{ marginLeft: 'auto', fontWeight: 'bold' }}>{Math.round(p3 * 100)}%</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#94a3b8' }} />
          <span style={{ color: 'var(--text-muted)' }}>Other</span>
          <span style={{ marginLeft: 'auto', fontWeight: 'bold' }}>{Math.round(p4 * 100)}%</span>
        </div>
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentDocs, isLoading: recentLoading } = useRecentDocuments(5);

  const statsList = [
    {
      title: 'Total Documents',
      value: stats?.total_documents || 12450,
      trend: '+12% vs last month',
      trendUp: true,
      icon: <FileText size={20} />
    },
    {
      title: 'Invoices',
      value: stats?.invoice_count || 4230,
      trend: '+8% vs last month',
      trendUp: true,
      icon: <FileCode size={20} />
    },
    {
      title: 'Receipts',
      value: stats?.receipt_count || 3120,
      trend: '-3% vs last month',
      trendUp: false,
      icon: <TrendingUp size={20} />
    },
    {
      title: 'Purchase Orders',
      value: stats?.purchase_order_count || 2800,
      trend: '+15% vs last month',
      trendUp: true,
      icon: <CheckCircle2 size={20} />
    },
    {
      title: 'Duplicates Found',
      value: stats?.pending_duplicates || 142,
      trend: 'Action Required',
      trendUp: false,
      icon: <Files size={20} />,
      highlight: true
    }
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
          <h1 className="page-header-title">Extraction Overview</h1>
          <p className="page-header-desc">Real-time intelligence from your business documents.</p>
        </div>
        <Link to="/upload" className="btn btn-primary">
          + Upload New
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid-kpis">
        {statsLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="kpi-card">
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="rectangular" width="40%" height="32px" style={{ margin: '12px 0 6px 0' }} />
              <Skeleton variant="text" width="50%" />
            </div>
          ))
        ) : (
          statsList.map((kpi, idx) => (
            <div key={idx} className="kpi-card" style={kpi.highlight ? { borderLeft: '4px solid var(--accent)' } : {}}>
              <div className="kpi-card-header">
                <span>{kpi.title}</span>
                <span className="kpi-card-icon">{kpi.icon}</span>
              </div>
              <div className="kpi-card-value">
                {kpi.value.toLocaleString()}
              </div>
              <div className={`kpi-card-footer ${kpi.trendUp ? 'kpi-trend-up' : kpi.title.includes('Duplicates') ? 'kpi-trend-down' : ''}`} style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                {kpi.title.includes('Duplicates') && <AlertTriangle size={12} style={{ marginRight: '4px' }} />}
                {kpi.trend}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Charts Grid */}
      <div className="grid-charts">
        {/* Upload Activity */}
        <Card title="Upload Activity" actions={<span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Last 7 Days</span>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="svg-chart-container" style={{ height: '200px' }}>
              <UploadActivityChart />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4f46e5' }} />
                <span style={{ color: 'var(--text-muted)' }}>Current Period</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#cbd5e1', border: '1px dashed #cbd5e1' }} />
                <span style={{ color: 'var(--text-muted)' }}>Previous Period</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Type Distribution */}
        <Card title="Type Distribution">
          {statsLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '20px' }}>
              <Skeleton variant="circular" width="120px" height="120px" />
              <Skeleton variant="rectangular" width="80%" height="40px" />
            </div>
          ) : (
            <TypeDistributionChart stats={stats} />
          )}
        </Card>
      </div>

      {/* Recent Extractions */}
      <Card title="Recent Extractions" actions={<Link to="/documents" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>View All Activity</Link>}>
        <div className="table-container">
          {recentLoading ? (
            <div style={{ padding: '16px' }}>
              <Skeleton variant="rectangular" width="100%" height="24px" style={{ marginBottom: '8px' }} />
              <Skeleton variant="rectangular" width="100%" height="24px" style={{ marginBottom: '8px' }} />
              <Skeleton variant="rectangular" width="100%" height="24px" />
            </div>
          ) : recentDocs && recentDocs.length > 0 ? (
            <table className="table-dense">
              <thead>
                <tr>
                  <th>Document Name</th>
                  <th>Type</th>
                  <th>Processed</th>
                  <th>Confidence</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentDocs.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <Link to={`/documents/${doc.id}`} style={{ fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={16} style={{ opacity: 0.6 }} />
                        {doc.original_filename}
                      </Link>
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{doc.document_type || 'unclassified'}</td>
                    <td>
                      {doc.processed_at 
                        ? new Date(doc.processed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {doc.status === 'completed' ? '98.4%' : '—'}
                    </td>
                    <td>
                      <Badge variant={doc.status}>{doc.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No documents processed yet. Click "+ Upload New" to get started!
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};
