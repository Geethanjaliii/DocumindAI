import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, CheckCircle2, AlertCircle, RefreshCw, X, FileText, Sparkles } from 'lucide-react';
import { useUploadDocuments } from '../../services/queries';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface InFlightUpload {
  name: string;
  size: number;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  stage: 'Uploaded' | 'OCR Scanning' | 'Classifying' | 'Extracting Data' | 'Completed' | 'Failed';
  id: string;
}

export const UploadPage: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [inFlightList, setInFlightList] = useState<InFlightUpload[]>([]);
  const uploadMutation = useUploadDocuments();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFiles = (files: File[]) => {
    if (files.length === 0) return;

    const newUploads: InFlightUpload[] = files.map(f => ({
      id: `up-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: f.name,
      size: f.size,
      progress: 0,
      status: 'uploading',
      stage: 'Uploaded'
    }));

    setInFlightList(prev => [...newUploads, ...prev]);

    // Perform actual API upload
    uploadMutation.mutate({
      files,
      onProgress: (pct) => {
        setInFlightList(prev => prev.map(item => {
          const match = newUploads.find(nu => nu.name === item.name);
          if (match && item.id === match.id) {
            return {
              ...item,
              progress: pct,
              status: pct >= 100 ? 'processing' : 'uploading',
              stage: pct >= 100 ? 'OCR Scanning' : 'Uploaded'
            };
          }
          return item;
        }));
      }
    }, {
      onSuccess: () => {
        // Run AI stage simulations
        newUploads.forEach(nu => {
          simulateAIPipeline(nu.id);
        });
      }
    });
  };

  const simulateAIPipeline = (id: string) => {
    // Stage 1: OCR -> Stage 2: Classify -> Stage 3: Extract -> Done
    const stages: ('OCR Scanning' | 'Classifying' | 'Extracting Data' | 'Completed' | 'Failed')[] = [
      'OCR Scanning',
      'Classifying',
      'Extracting Data',
      'Completed'
    ];

    let currentStageIdx = 0;
    const interval = setInterval(() => {
      setInFlightList(prev => prev.map(item => {
        if (item.id === id) {
          const isFailed = item.name.toLowerCase().includes('corrupt') || item.name.toLowerCase().includes('blurry');
          
          if (isFailed && currentStageIdx === 1) {
            clearInterval(interval);
            return {
              ...item,
              status: 'failed',
              stage: 'Failed'
            };
          }

          const nextStage = stages[currentStageIdx];
          const isFinished = nextStage === 'Completed';

          if (isFinished) {
            clearInterval(interval);
          }

          return {
            ...item,
            status: isFinished ? 'completed' : 'processing',
            stage: nextStage
          };
        }
        return item;
      }));
      currentStageIdx++;
    }, 2000); // Shift stage every 2 seconds
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (id: string) => {
    setInFlightList(prev => prev.filter(f => f.id !== id));
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
          <h1 className="page-header-title">Document Upload</h1>
          <p className="page-header-desc">Batch process your financial statements and legal documents with AI-powered extraction.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Upload Region */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div
            className={`dropzone ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              style={{ display: 'none' }}
              onChange={handleChange}
              accept=".pdf,.png,.jpg,.jpeg"
            />
            <div className="dropzone-icon-container">
              <UploadCloud size={28} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px' }}>
              Drag and drop documents here
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
              Support for PDF, PNG, and JPG (Max 50MB per file)
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button variant="outline" type="button">Browse Files</Button>
              <Button variant="secondary" type="button">Select Folder</Button>
            </div>
          </div>

          {/* Upload Queue */}
          {inFlightList.length > 0 && (
            <Card title={`Uploading (${inFlightList.length})`} actions={<span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>All operations normal</span>}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {inFlightList.map((file) => (
                  <div key={file.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '12px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid var(--border-light)'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--primary-light)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FileText size={20} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {file.name}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {file.status === 'uploading' 
                            ? `${file.progress}%` 
                            : file.stage}
                        </span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div style={{ height: '4px', backgroundColor: '#e2e8f0', borderRadius: '2px', overflow: 'hidden', display: 'flex' }}>
                        {file.status === 'uploading' ? (
                          <div style={{ width: `${file.progress}%`, backgroundColor: 'var(--primary)', transition: 'width 0.2s' }} />
                        ) : file.status === 'processing' ? (
                          <div className="animate-pulse" style={{ width: '100%', backgroundColor: 'var(--accent)' }} />
                        ) : file.status === 'completed' ? (
                          <div style={{ width: '100%', backgroundColor: 'var(--success)' }} />
                        ) : (
                          <div style={{ width: '100%', backgroundColor: 'var(--error)' }} />
                        )}
                      </div>
                    </div>

                    <div>
                      {file.status === 'completed' ? (
                        <CheckCircle2 size={18} color="var(--success)" />
                      ) : file.status === 'failed' ? (
                        <AlertCircle size={18} color="var(--error)" />
                      ) : (
                        <RefreshCw size={16} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
                      )}
                    </div>

                    <button onClick={() => removeFile(file.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar Info Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Extraction Engine Stats */}
          <Card title="Extraction Engine">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Status</span>
                <span className="badge badge-success">OPTIMAL</span>
              </div>

              <div style={{ display: 'flex', gap: '12px', padding: '12px', backgroundColor: 'var(--primary-light)', borderRadius: '8px' }}>
                <div style={{ color: 'var(--primary)' }}><Sparkles size={18} /></div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Average Latency</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>1.4s per page</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', padding: '12px', backgroundColor: 'var(--primary-light)', borderRadius: '8px' }}>
                <div style={{ color: 'var(--accent)' }}><CheckCircle2 size={18} /></div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>AI Confidence</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>98.2% Accuracy</span>
                </div>
              </div>

              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                Our Gemini-1.5-Flash extraction engine is active. OCR layout analysis and Named Entity Recognition (NER) models are running.
              </p>
            </div>
          </Card>

          {/* Quick status alerts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              display: 'flex',
              gap: '12px',
              padding: '16px',
              backgroundColor: 'var(--success-bg)',
              borderLeft: '4px solid var(--success)',
              borderRadius: '8px',
              fontSize: '0.8rem',
              color: 'var(--success-text)'
            }}>
              <CheckCircle2 size={18} />
              <div>
                <span style={{ fontWeight: 'bold', display: 'block' }}>Successfully Extracted</span>
                Tax_Report_2023.pdf finished processing. <a href="#" style={{ textDecoration: 'underline', fontWeight: 'bold' }}>Download CSV</a>
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              padding: '16px',
              backgroundColor: 'var(--error-bg)',
              borderLeft: '4px solid var(--error)',
              borderRadius: '8px',
              fontSize: '0.8rem',
              color: 'var(--error-text)'
            }}>
              <AlertCircle size={18} />
              <div>
                <span style={{ fontWeight: 'bold', display: 'block' }}>Missing Signature</span>
                employment_contract.pdf requires human review. <a href="#" style={{ textDecoration: 'underline', fontWeight: 'bold' }}>Review Now</a>
              </div>
            </div>
          </div>

          {/* Session limits */}
          <Card title="Session Resources">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: 'var(--text-muted)' }}>
                  <span>Batch Limit</span>
                  <span>45 / 100 docs</span>
                </div>
                <div style={{ height: '4px', backgroundColor: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: '45%', height: '100%', backgroundColor: 'var(--primary)' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: 'var(--text-muted)' }}>
                  <span>Cloud Storage</span>
                  <span>2.4 GB / 10 GB</span>
                </div>
                <div style={{ height: '4px', backgroundColor: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: '24%', height: '100%', backgroundColor: 'var(--accent)' }} />
                </div>
              </div>

              <Button variant="outline" style={{ width: '100%', fontSize: '0.75rem', padding: '6px' }}>Upgrade Quota</Button>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};
