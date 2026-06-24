import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, Trash2, Check, ShieldCheck, Sparkles, FileText, Code, Activity } from 'lucide-react';
import { useDocumentDetails, useDocumentEvents, useReprocessDocument, useDeleteDocument } from '../../services/queries';
import { Skeleton } from '../ui/Skeleton';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export const DocumentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: doc, isLoading } = useDocumentDetails(id);
  const { data: events } = useDocumentEvents(id);
  
  const reprocessMutation = useReprocessDocument();
  const deleteMutation = useDeleteDocument();
  
  const [activeTab, setActiveTab] = useState<'fields' | 'ocr' | 'events'>('fields');
  const [editedFields, setEditedFields] = useState<Record<string, string>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleFieldChange = (key: string, value: string) => {
    setEditedFields(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveFields = (e: React.FormEvent) => {
    e.preventDefault();
    if (!doc?.extraction) return;

    // Simulate save by merging edited fields into localStorage
    const docs = JSON.parse(localStorage.getItem('documind_docs') || '[]');
    const docIdx = docs.findIndex((d: any) => d.id === id);
    if (docIdx !== -1) {
      docs[docIdx].extraction.extracted_json = {
        ...docs[docIdx].extraction.extracted_json,
        ...editedFields
      };
      // Reduce confidence fields to 100% since human corrected it!
      const currentConfidences = { ...docs[docIdx].extraction.field_confidences };
      Object.keys(editedFields).forEach(k => {
        currentConfidences[k] = 100.0;
      });
      docs[docIdx].extraction.field_confidences = currentConfidences;
      docs[docIdx].extraction.overall_confidence = 99.8;
      
      localStorage.setItem('documind_docs', JSON.stringify(docs));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const handleReprocess = () => {
    if (id) {
      reprocessMutation.mutate(id);
    }
  };

  const handleDelete = () => {
    if (id && confirm("Are you sure you want to delete this document?")) {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          navigate('/documents');
        }
      });
    }
  };

  if (isLoading || !doc) {
    return (
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
          <Skeleton variant="text" width="20%" />
          <Skeleton variant="rectangular" width="15%" height="36px" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', height: '500px' }}>
          <Skeleton variant="rectangular" width="100%" height="100%" />
          <Skeleton variant="rectangular" width="100%" height="100%" />
        </div>
      </div>
    );
  }

  const extractedData = {
    ...doc.extraction?.extracted_json,
    ...editedFields
  };

  const fieldConfidences = doc.extraction?.field_confidences || {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--header-height) - 32px)' }}
    >
      {/* Header controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '16px',
        borderBottom: '1px solid var(--border-light)',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link to="/documents" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                {doc.original_filename}
              </h2>
              <Badge variant={doc.status}>{doc.status}</Badge>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              ID: {doc.id}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="outline" icon={<RefreshCw size={14} className={doc.status === 'processing' ? 'animate-spin' : ''} />} onClick={handleReprocess} disabled={doc.status === 'processing'}>
            Reprocess File
          </Button>
          <Button variant="danger" icon={<Trash2 size={14} />} onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="split-layout">
        {/* Left Side: Mock Document Viewer */}
        <div className="document-viewer-panel">
          <div className="document-viewer-header">
            <span style={{ fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={16} /> PDF Page Ingestion
            </span>
            <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>Page 1 of {doc.page_count}</span>
          </div>
          
          <div className="document-viewer-content">
            <div className="document-viewer-placeholder">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                <div style={{ height: '24px', width: '35%', backgroundColor: '#475569', borderRadius: '4px' }} />
                <div style={{ height: '32px', width: '25%', backgroundColor: '#475569', borderRadius: '4px' }} />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="document-viewer-line" />
                <div className="document-viewer-line highlighted" />
                <div className="document-viewer-line" />
                <div className="document-viewer-line" />
                <div className="document-viewer-line highlighted" style={{ width: '60%' }} />
              </div>

              <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                <div style={{ height: '10px', width: '40%', backgroundColor: '#475569', borderRadius: '4px' }} />
                <div style={{ height: '12px', width: '20%', backgroundColor: '#475569', borderRadius: '4px' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Extraction Inspector Tabs */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div className="tabs-navigation">
            <button className={`tab-btn ${activeTab === 'fields' ? 'active' : ''}`} onClick={() => setActiveTab('fields')}>
              <Sparkles size={14} style={{ marginRight: '6px', display: 'inline' }} /> Data Fields
            </button>
            <button className={`tab-btn ${activeTab === 'ocr' ? 'active' : ''}`} onClick={() => setActiveTab('ocr')}>
              <Code size={14} style={{ marginRight: '6px', display: 'inline' }} /> Raw OCR Text
            </button>
            <button className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`} onClick={() => setActiveTab('events')}>
              <Activity size={14} style={{ marginRight: '6px', display: 'inline' }} /> Audit Logs
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid var(--border-light)', padding: '24px' }}>
            {activeTab === 'fields' && (
              <form onSubmit={handleSaveFields}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  backgroundColor: 'var(--success-bg)',
                  border: '1px solid var(--success-border)',
                  borderRadius: '6px',
                  marginBottom: '24px',
                  color: 'var(--success-text)',
                  fontSize: '0.85rem'
                }}>
                  <ShieldCheck size={18} />
                  <div>
                    <span style={{ fontWeight: 'bold', display: 'block' }}>Auto-Classified: {doc.classification?.predicted_type.toUpperCase()}</span>
                    Model: {doc.classification?.model_name} (Confidence: {doc.classification?.confidence_score}%)
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {doc.extraction ? (
                    Object.keys(doc.extraction.extracted_json).map((key) => {
                      const confidence = fieldConfidences[key] || 90;
                      const confColor = confidence > 95 ? 'var(--success)' : confidence > 80 ? 'var(--warning)' : 'var(--error)';
                      
                      return (
                        <div key={key} className="form-group" style={{ marginBottom: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <label className="form-label" style={{ textTransform: 'capitalize', marginBottom: 0 }}>
                              {key.replace('_', ' ')}
                            </label>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: confColor }}>
                              Confidence: {confidence}%
                            </span>
                          </div>

                          <input
                            type="text"
                            className="form-input"
                            value={extractedData[key] || ''}
                            onChange={(e) => handleFieldChange(key, e.target.value)}
                          />
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No extraction results available for this status.
                    </div>
                  )}

                  {doc.extraction && (
                    <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                      <Button variant="primary" type="submit" loading={reprocessMutation.isPending}>
                        Save Corrected Fields
                      </Button>
                      {saveSuccess && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--success)', fontSize: '0.85rem', fontWeight: 600 }}>
                          <Check size={16} /> Saved!
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </form>
            )}

            {activeTab === 'ocr' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
                  <span>OCR Engine: {doc.ocr_result?.ocr_engine || '—'}</span>
                  <span>Confidence: {doc.ocr_result?.ocr_confidence_avg || '—'}%</span>
                </div>
                <pre style={{
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  backgroundColor: '#f8fafc',
                  padding: '16px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-light)',
                  color: '#334155'
                }}>
                  {doc.ocr_result?.raw_text || 'No OCR raw text extracted.'}
                </pre>
              </div>
            )}

            {activeTab === 'events' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '8px' }}>Execution Steps Audit</h4>
                {events && events.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {events.map((ev, i) => (
                      <div key={ev.id} style={{ display: 'flex', gap: '12px', position: 'relative' }}>
                        {/* Line connector */}
                        {i < events.length - 1 && (
                          <div style={{
                            position: 'absolute',
                            left: '8px',
                            top: '20px',
                            bottom: '-20px',
                            width: '2px',
                            backgroundColor: '#e2e8f0'
                          }} />
                        )}
                        
                        <div style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          backgroundColor: ev.event_type.includes('fail') ? 'var(--error)' : 'var(--primary)',
                          border: '4px solid white',
                          boxShadow: '0 0 0 1px #cbd5e1',
                          zIndex: 2,
                          marginTop: '2px'
                        }} />
                        
                        <div>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', textTransform: 'capitalize' }}>
                            {ev.event_type.replace('_', ' ')}
                          </span>
                          {ev.metadata_ && (
                            <code style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                              {JSON.stringify(ev.metadata_)}
                            </code>
                          )}
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                            {new Date(ev.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No events recorded.</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
