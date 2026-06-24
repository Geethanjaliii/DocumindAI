import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Eye, RefreshCw, Trash2, MoreHorizontal, ArrowLeft, ArrowRight, FileText, Sparkles, SlidersHorizontal } from 'lucide-react';
import { useDocumentsList, useReprocessDocument, useDeleteDocument } from '../../services/queries';
import { TableSkeleton } from '../ui/Skeleton';
import type { DocumentSummary } from '../../services/api';
import { EmptyState } from '../ui/EmptyState';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Link } from 'react-router-dom';

export const DocumentsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [searchVal, setSearchVal] = useState<string>('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const filters = {
    status: statusFilter || undefined,
    document_type: typeFilter || undefined,
    q: searchVal || undefined
  };

  const { data, isLoading } = useDocumentsList(filters, page, 10);
  const reprocessMutation = useReprocessDocument();
  const deleteMutation = useDeleteDocument();

  const handleReprocess = (id: string) => {
    reprocessMutation.mutate(id);
    setActiveMenu(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this document?")) {
      deleteMutation.mutate(id);
    }
    setActiveMenu(null);
  };

  const handleClearFilters = () => {
    setStatusFilter('');
    setTypeFilter('');
    setSearchVal('');
    setPage(1);
  };

  const documents = data?.data || [];
  const pagination = data?.pagination || { page: 1, page_size: 10, total: 0, total_pages: 1 };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="page-header">
        <div>
          <h1 className="page-header-title">Documents Management</h1>
          <p className="page-header-desc">Analyze and filter all processed documents and review structured extractions.</p>
        </div>
        <Link to="/upload" className="btn btn-primary">
          + Upload Document
        </Link>
      </div>

      {/* Filters Area */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '20px',
        backgroundColor: '#ffffff',
        padding: '16px 20px',
        borderRadius: '8px',
        border: '1px solid var(--border-light)'
      }}>
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f1f5f9', padding: '8px 12px', borderRadius: '6px', width: '280px' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search by file name or text..."
            style={{ border: 'none', background: 'transparent', fontSize: '0.85rem', width: '100%' }}
            value={searchVal}
            onChange={(e) => { setSearchVal(e.target.value); setPage(1); }}
          />
        </div>

        {/* Dropdowns */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
            <SlidersHorizontal size={14} color="var(--text-muted)" />
            <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Type</span>
            <select
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-medium)',
                backgroundColor: 'white',
                fontSize: '0.85rem'
              }}
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Types</option>
              <option value="invoice">Invoice</option>
              <option value="receipt">Receipt</option>
              <option value="purchase_order">Purchase Order</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Status</span>
            <select
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-medium)',
                backgroundColor: 'white',
                fontSize: '0.85rem'
              }}
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Statuses</option>
              <option value="uploaded">Uploaded</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {(statusFilter || typeFilter || searchVal) && (
            <button
              onClick={handleClearFilters}
              style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--primary)',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card">
        <div className="table-container">
          {isLoading ? (
            <div style={{ padding: '24px' }}>
              <TableSkeleton rows={8} cols={6} />
            </div>
          ) : documents.length > 0 ? (
            <table className="table-dense" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Pages</th>
                  <th>Processed Date</th>
                  <th>Confidence</th>
                  <th>Status</th>
                  <th style={{ width: '60px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc: DocumentSummary) => (
                  <tr key={doc.id} style={{ position: 'relative' }}>
                    <td>
                      <Link to={`/documents/${doc.id}`} style={{ fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={16} style={{ opacity: 0.6 }} />
                        {doc.original_filename}
                        {doc.is_duplicate && (
                          <span style={{
                            padding: '2px 6px',
                            backgroundColor: 'var(--warning-bg)',
                            color: 'var(--warning-text)',
                            borderRadius: '4px',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            border: '1px solid var(--warning-border)'
                          }}>DUPLICATE</span>
                        )}
                      </Link>
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>
                      {doc.document_type ? doc.document_type.replace('_', ' ') : '—'}
                    </td>
                    <td>
                      {(doc.file_size_bytes / 1024).toFixed(0)} KB
                    </td>
                    <td>{doc.page_count}</td>
                    <td>
                      {doc.processed_at 
                        ? new Date(doc.processed_at).toLocaleDateString() + ' ' + new Date(doc.processed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : doc.status === 'failed' ? 'Failed' : 'Processing...'}
                    </td>
                    <td>
                      {doc.status === 'completed' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--success-text)', fontWeight: 600 }}>
                          <Sparkles size={12} color="var(--success)" />
                          98.2%
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      <Badge variant={doc.status}>{doc.status}</Badge>
                    </td>
                    <td style={{ textAlign: 'center', position: 'relative' }}>
                      <button
                        onClick={() => setActiveMenu(activeMenu === doc.id ? null : doc.id)}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
                      >
                        <MoreHorizontal size={18} />
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenu === doc.id && (
                        <>
                          <div
                            onClick={() => setActiveMenu(null)}
                            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 }}
                          />
                          <div style={{
                            position: 'absolute',
                            right: '20px',
                            top: '32px',
                            backgroundColor: 'white',
                            border: '1px solid var(--border-light)',
                            borderRadius: '6px',
                            boxShadow: 'var(--shadow-lg)',
                            zIndex: 20,
                            minWidth: '140px',
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '4px'
                          }}>
                            <Link to={`/documents/${doc.id}`} style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '8px 12px',
                              fontSize: '0.8rem',
                              color: 'var(--text-main)',
                              textAlign: 'left'
                            }} className="dropdown-item-hover">
                              <Eye size={14} /> View Details
                            </Link>

                            <button onClick={() => handleReprocess(doc.id)} style={{
                              border: 'none',
                              background: 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '8px 12px',
                              fontSize: '0.8rem',
                              color: 'var(--text-main)',
                              textAlign: 'left',
                              cursor: 'pointer'
                            }} className="dropdown-item-hover">
                              <RefreshCw size={14} /> Reprocess
                            </button>

                            <div style={{ height: '1px', backgroundColor: 'var(--border-light)', margin: '4px 0' }} />

                            <button onClick={() => handleDelete(doc.id)} style={{
                              border: 'none',
                              background: 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '8px 12px',
                              fontSize: '0.8rem',
                              color: 'var(--error)',
                              textAlign: 'left',
                              cursor: 'pointer'
                            }} className="dropdown-item-hover">
                              <Trash2 size={14} /> Delete File
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '24px' }}>
              <EmptyState
                icon={<Search size={24} />}
                title="No documents found"
                description="Your filters or search keywords didn't match any active files in the database."
                actionText="Reset All Filters"
                onActionClick={handleClearFilters}
              />
            </div>
          )}
        </div>

        {/* Pagination footer */}
        {pagination.total > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 24px',
            borderTop: '1px solid var(--border-light)',
            fontSize: '0.8rem',
            color: 'var(--text-muted)'
          }}>
            <span>
              Showing <strong>{Math.min(pagination.total, (page - 1) * 10 + 1)}</strong> to <strong>{Math.min(pagination.total, page * 10)}</strong> of <strong>{pagination.total.toLocaleString()}</strong> documents
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                variant="outline"
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                icon={<ArrowLeft size={12} />}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                disabled={page >= pagination.total_pages}
                onClick={() => setPage(page + 1)}
                icon={<ArrowRight size={12} />}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
