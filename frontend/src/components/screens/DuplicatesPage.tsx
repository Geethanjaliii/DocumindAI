import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Check, Ban, Trash2, ArrowRightLeft, FileWarning } from 'lucide-react';
import { useDuplicateMatches, useUpdateDuplicateStatus, useDeleteDocument } from '../../services/queries';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Link } from 'react-router-dom';

export const DuplicatesPage: React.FC = () => {
  const { data: matches, isLoading } = useDuplicateMatches();
  const updateStatusMutation = useUpdateDuplicateStatus();
  const deleteMutation = useDeleteDocument();

  const handleResolve = (id: string, status: 'confirmed' | 'dismissed') => {
    updateStatusMutation.mutate({ id, status });
  };

  const handleDelete = (docId: string) => {
    if (confirm("Are you sure you want to delete this document?")) {
      deleteMutation.mutate(docId);
    }
  };

  const pendingMatches = matches?.filter(m => m.status === 'pending') || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="page-header">
        <div>
          <h1 className="page-header-title">Duplicate Detection</h1>
          <p className="page-header-desc">Review double-uploaded invoices or receipts flagged by our identity-matching engine.</p>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
          <Skeleton variant="rectangular" width="100%" height="220px" />
          <Skeleton variant="rectangular" width="100%" height="220px" />
        </div>
      ) : pendingMatches.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {pendingMatches.map((match) => (
            <Card
              key={match.id}
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <ShieldAlert color="var(--warning)" size={20} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Duplicate Flags: {match.match_type.toUpperCase().replace('_', ' ')}</span>
                  <span style={{
                    backgroundColor: 'var(--error-bg)',
                    color: 'var(--error-text)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    border: '1px solid var(--error-border)'
                  }}>
                    {Math.round(match.similarity_score * 100)}% Similarity
                  </span>
                </div>
              }
              actions={
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    variant="outline"
                    icon={<Check size={14} />}
                    onClick={() => handleResolve(match.id, 'confirmed')}
                    style={{ color: 'var(--success-text)', fontSize: '0.8rem', padding: '6px 12px' }}
                  >
                    Confirm Duplicate
                  </Button>
                  <Button
                    variant="outline"
                    icon={<Ban size={14} />}
                    onClick={() => handleResolve(match.id, 'dismissed')}
                    style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: '6px 12px' }}
                  >
                    Dismiss Flag
                  </Button>
                </div>
              }
            >
              {/* Side-by-Side File Comparison */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 60px 1fr',
                gap: '16px',
                alignItems: 'center'
              }}>
                {/* Source File */}
                <div style={{
                  padding: '16px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid var(--border-light)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Original Document</span>
                  <Link to={`/documents/${match.source_document.id}`} style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '0.9rem' }}>
                    {match.source_document.original_filename}
                  </Link>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span>Uploaded: {new Date(match.source_document.created_at).toLocaleDateString()}</span>
                    <span>Doc Type: Invoice</span>
                    <span>Total Value: $12,450.00</span>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => handleDelete(match.source_document.id)}
                    style={{ alignSelf: 'flex-start', color: 'var(--error)', fontSize: '0.75rem', padding: '4px 8px', marginTop: '6px' }}
                    icon={<Trash2 size={12} />}
                  >
                    Delete Original
                  </Button>
                </div>

                {/* Compare Vector */}
                <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  <ArrowRightLeft size={24} />
                </div>

                {/* Matched File */}
                <div style={{
                  padding: '16px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid var(--border-light)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Duplicate Document</span>
                  <Link to={`/documents/${match.matched_document.id}`} style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '0.9rem' }}>
                    {match.matched_document.original_filename}
                  </Link>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span>Uploaded: {new Date(match.matched_document.created_at).toLocaleDateString()}</span>
                    <span>Doc Type: Invoice</span>
                    <span>Total Value: $12,450.00</span>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => handleDelete(match.matched_document.id)}
                    style={{ alignSelf: 'flex-start', color: 'var(--error)', fontSize: '0.75rem', padding: '4px 8px', marginTop: '6px' }}
                    icon={<Trash2 size={12} />}
                  >
                    Delete Duplicate
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<FileWarning size={24} />}
          title="No duplicates pending review"
          description="Your document workspace is currently clean. All uploaded invoices, receipts, and POs show unique identifiers."
        />
      )}
    </motion.div>
  );
};
