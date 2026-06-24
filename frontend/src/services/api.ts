// Centralized API Service Layer with LocalStorage Simulation fallback
const BACKEND_URL = 'http://localhost:8000/api/v1';

// Types
export interface DocumentSummary {
  id: string;
  original_filename: string;
  mime_type: string;
  file_size_bytes: number;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  document_type: 'invoice' | 'receipt' | 'purchase_order' | 'other' | null;
  page_count: number;
  error_message: string | null;
  is_duplicate: boolean;
  original_document_id: string | null;
  created_at: string;
  updated_at: string;
  processed_at: string | null;
}

export interface OcrResult {
  id: string;
  raw_text: string;
  ocr_engine: string;
  ocr_confidence_avg: number;
  language: string;
  created_at: string;
}

export interface ClassificationResult {
  id: string;
  predicted_type: 'invoice' | 'receipt' | 'purchase_order' | 'other';
  confidence_score: number;
  model_name: string;
  rationale: string;
  created_at: string;
}

export interface ExtractionResult {
  id: string;
  schema_version: string;
  extracted_json: Record<string, any>;
  overall_confidence: number;
  field_confidences: Record<string, number>;
  created_at: string;
}

export interface DocumentDetail extends DocumentSummary {
  ocr_result: OcrResult | null;
  classification: ClassificationResult | null;
  extraction: ExtractionResult | null;
}

export interface DocumentEvent {
  id: string;
  event_type: string;
  metadata_: Record<string, any> | null;
  created_at: string;
}

export interface DuplicateMatch {
  id: string;
  match_type: string;
  similarity_score: number;
  match_details: Record<string, any>;
  status: 'pending' | 'confirmed' | 'dismissed';
  created_at: string;
  source_document: DocumentSummary;
  matched_document: DocumentSummary;
}

export interface DashboardStats {
  total_documents: number;
  processing_documents: number;
  completed_documents: number;
  failed_documents: number;
  invoice_count: number;
  receipt_count: number;
  purchase_order_count: number;
  other_count: number;
  pending_duplicates: number;
  average_confidence: number;
}

// ---------------------------------------------------------
// Seed Initial Mock Data in localStorage if empty
// ---------------------------------------------------------
const initMockDB = () => {
  if (!localStorage.getItem('documind_docs')) {
    const docs: DocumentDetail[] = [
      {
        id: '8829a21d-91b3-461d-9e67-d86b9766942a',
        original_filename: 'Invoice_INT_8829.pdf',
        mime_type: 'application/pdf',
        file_size_bytes: 1048576,
        status: 'completed',
        document_type: 'invoice',
        page_count: 2,
        error_message: null,
        is_duplicate: false,
        original_document_id: null,
        created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
        processed_at: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
        ocr_result: {
          id: 'ocr-1',
          raw_text: 'INVOICE\nStripe, Inc.\nInvoice ID: INV-9042\nTotal Amount: $12,450.00\nTax ID: 94-23019\nVerified\nItem 1: API Services - $10,000\nItem 2: Custom Engineering - $2,450',
          ocr_engine: 'pytesseract-v4.0',
          ocr_confidence_avg: 98.4,
          language: 'en',
          created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        },
        classification: {
          id: 'class-1',
          predicted_type: 'invoice',
          confidence_score: 99.1,
          model_name: 'gemini-1.5-flash-classification',
          rationale: 'Contains typical invoice markers: INVOICE header, vendor name Stripe Inc., line item amounts, tax ID and net totals.',
          created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        },
        extraction: {
          id: 'ext-1',
          schema_version: 'v1.2-invoice',
          extracted_json: {
            invoice_id: 'INV-9042',
            vendor_name: 'Stripe, Inc.',
            total_amount: '12450.00',
            tax_id: '94-23019',
            billing_address: '354 Oyster Point Blvd, South San Francisco, CA',
            due_date: '2026-07-24'
          },
          overall_confidence: 98.4,
          field_confidences: {
            invoice_id: 99.4,
            vendor_name: 98.9,
            total_amount: 99.8,
            tax_id: 97.2,
            billing_address: 96.5,
            due_date: 98.0
          },
          created_at: new Date(Date.now() - 1.5 * 60 * 1000).toISOString(),
        }
      },
      {
        id: '5521b44c-21a4-4a2a-bc91-236b1299efda',
        original_filename: 'receipt_uber_chicago.png',
        mime_type: 'image/png',
        file_size_bytes: 340912,
        status: 'completed',
        document_type: 'receipt',
        page_count: 1,
        error_message: null,
        is_duplicate: false,
        original_document_id: null,
        created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
        processed_at: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
        ocr_result: {
          id: 'ocr-2',
          raw_text: 'UBER TECHNOLOGIES INC\nDate: June 24, 2026\nSubtotal: $24.50\nTip: $5.00\nTotal: $29.50\nThank you for riding!',
          ocr_engine: 'pytesseract-v4.0',
          ocr_confidence_avg: 96.2,
          language: 'en',
          created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        },
        classification: {
          id: 'class-2',
          predicted_type: 'receipt',
          confidence_score: 97.8,
          model_name: 'gemini-1.5-flash-classification',
          rationale: 'Layout contains point-of-sale text receipt headers (Uber) and small total values, with tipping indicators.',
          created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        },
        extraction: {
          id: 'ext-2',
          schema_version: 'v1.0-receipt',
          extracted_json: {
            merchant_name: 'Uber Technologies Inc.',
            receipt_date: '2026-06-24',
            total_amount: '29.50',
            tax_amount: '0.00',
            payment_method: 'Card Ending in 4242'
          },
          overall_confidence: 96.2,
          field_confidences: {
            merchant_name: 99.0,
            receipt_date: 95.0,
            total_amount: 98.4,
            tax_amount: 92.0,
            payment_method: 97.0
          },
          created_at: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
        }
      },
      {
        id: '2019a55b-419b-449e-ba21-125ac361ee7f',
        original_filename: 'purchase_order_corporate.pdf',
        mime_type: 'application/pdf',
        file_size_bytes: 2049120,
        status: 'completed',
        document_type: 'purchase_order',
        page_count: 3,
        error_message: null,
        is_duplicate: false,
        original_document_id: null,
        created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 44 * 60 * 1000).toISOString(),
        processed_at: new Date(Date.now() - 44 * 60 * 1000).toISOString(),
        ocr_result: {
          id: 'ocr-3',
          raw_text: 'PURCHASE ORDER\nOrder ID: PO-45091\nFrom: TechNova Solutions Ltd.\nTo: Global Supply Corp.\nDate: 2026-06-20\nTotal Order Value: $4,800.00',
          ocr_engine: 'pytesseract-v4.0',
          ocr_confidence_avg: 98.9,
          language: 'en',
          created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        },
        classification: {
          id: 'class-3',
          predicted_type: 'purchase_order',
          confidence_score: 99.5,
          model_name: 'gemini-1.5-flash-classification',
          rationale: 'Explicitly declares itself as a Purchase Order and outlines buying client details and supplier details.',
          created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        },
        extraction: {
          id: 'ext-3',
          schema_version: 'v1.1-po',
          extracted_json: {
            po_number: 'PO-45091',
            buyer_name: 'TechNova Solutions Ltd.',
            supplier_name: 'Global Supply Corp.',
            total_amount: '4800.00',
            order_date: '2026-06-20'
          },
          overall_confidence: 99.0,
          field_confidences: {
            po_number: 99.9,
            buyer_name: 99.5,
            supplier_name: 98.7,
            total_amount: 99.2,
            order_date: 97.8
          },
          created_at: new Date(Date.now() - 44 * 60 * 1000).toISOString(),
        }
      },
      {
        id: 'f9911e3b-bba3-46bc-88b1-31ba5f22ad9e',
        original_filename: 'invoice_duplicate_danger.pdf',
        mime_type: 'application/pdf',
        file_size_bytes: 840912,
        status: 'completed',
        document_type: 'invoice',
        page_count: 1,
        error_message: null,
        is_duplicate: true,
        original_document_id: '8829a21d-91b3-461d-9e67-d86b9766942a',
        created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 9 * 60 * 1000).toISOString(),
        processed_at: new Date(Date.now() - 9 * 60 * 1000).toISOString(),
        ocr_result: {
          id: 'ocr-4',
          raw_text: 'INVOICE\nStripe, Inc.\nInvoice ID: INV-9042\nTotal Amount: $12,450.00\nTax ID: 94-23019\nVerified\nItem 1: API Services - $10,000\nItem 2: Custom Engineering - $2,450',
          ocr_engine: 'pytesseract-v4.0',
          ocr_confidence_avg: 98.4,
          language: 'en',
          created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        },
        classification: {
          id: 'class-4',
          predicted_type: 'invoice',
          confidence_score: 99.1,
          model_name: 'gemini-1.5-flash-classification',
          rationale: 'Has exact same text content as another Stripe invoice in the system.',
          created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        },
        extraction: {
          id: 'ext-4',
          schema_version: 'v1.2-invoice',
          extracted_json: {
            invoice_id: 'INV-9042',
            vendor_name: 'Stripe, Inc.',
            total_amount: '12450.00',
            tax_id: '94-23019',
            billing_address: '354 Oyster Point Blvd, South San Francisco, CA',
            due_date: '2026-07-24'
          },
          overall_confidence: 98.4,
          field_confidences: {
            invoice_id: 99.4,
            vendor_name: 98.9,
            total_amount: 99.8,
            tax_id: 97.2,
            billing_address: 96.5,
            due_date: 98.0
          },
          created_at: new Date(Date.now() - 9 * 60 * 1000).toISOString(),
        }
      },
      {
        id: 'c8811e9a-77d1-4cb3-a551-998bef432e12',
        original_filename: 'damaged_receipt_scan.jpg',
        mime_type: 'image/jpeg',
        file_size_bytes: 512000,
        status: 'failed',
        document_type: null,
        page_count: 1,
        error_message: 'OCR confidence too low (less than 20%). Image is blurry or text is illegible.',
        is_duplicate: false,
        original_document_id: null,
        created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
        processed_at: null,
        ocr_result: null,
        classification: null,
        extraction: null
      }
    ];

    const duplicates: DuplicateMatch[] = [
      {
        id: 'dup-match-1',
        match_type: 'invoice_number_vendor',
        similarity_score: 1.0,
        match_details: {
          invoice_number: 'INV-9042',
          vendor_name: 'Stripe, Inc.',
          reason: 'Identical invoice vendor and document identifier found.'
        },
        status: 'pending',
        created_at: new Date(Date.now() - 9 * 60 * 1000).toISOString(),
        source_document: docs[0],
        matched_document: docs[3]
      }
    ];

    const events: Record<string, DocumentEvent[]> = {
      [docs[0].id]: [
        { id: 'ev-1', event_type: 'uploaded', metadata_: null, created_at: docs[0].created_at },
        { id: 'ev-2', event_type: 'ocr_started', metadata_: { ocr_engine: 'pytesseract' }, created_at: docs[0].created_at },
        { id: 'ev-3', event_type: 'ocr_completed', metadata_: { confidence: 98.4 }, created_at: docs[0].processed_at! },
        { id: 'ev-4', event_type: 'classified', metadata_: { predicted_type: 'invoice' }, created_at: docs[0].processed_at! },
        { id: 'ev-5', event_type: 'extracted', metadata_: { keys: ['invoice_id', 'total_amount'] }, created_at: docs[0].processed_at! }
      ],
      [docs[4].id]: [
        { id: 'ev-6', event_type: 'uploaded', metadata_: null, created_at: docs[4].created_at },
        { id: 'ev-7', event_type: 'ocr_started', metadata_: { ocr_engine: 'pytesseract' }, created_at: docs[4].created_at },
        { id: 'ev-8', event_type: 'failed', metadata_: { reason: 'OCR confidence too low' }, created_at: docs[4].created_at }
      ]
    };

    localStorage.setItem('documind_docs', JSON.stringify(docs));
    localStorage.setItem('documind_duplicates', JSON.stringify(duplicates));
    localStorage.setItem('documind_events', JSON.stringify(events));
    localStorage.setItem('documind_settings', JSON.stringify({
      username: 'Alex Rivera',
      email: 'alex.rivera@documind.ai',
      organization: 'DocuMind Admin Team',
      mfa_enabled: false,
      api_keys: [
        { key: 'dm_live_948f98df2410a568cbb04', created: '2026-03-12T10:00:00Z', name: 'Production Bot' },
        { key: 'dm_test_ca819dfc9e83120ea93fa', created: '2026-06-20T14:32:00Z', name: 'Local Test' }
      ]
    }));
  }
};

initMockDB();

// JWT Token Extractors
const getToken = (): string | null => localStorage.getItem('documind_token');

const getHeaders = (isMultipart = false): Record<string, string> => {
  const headers: Record<string, string> = {};
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Helper to check if backend API is online
const checkOnline = async (): Promise<boolean> => {
  try {
    const res = await fetch(`${BACKEND_URL}/health`, { signal: AbortSignal.timeout(1000) });
    return res.ok;
  } catch (e) {
    return false;
  }
};

// Helper to parse backend error responses
const handleResponseError = async (res: Response): Promise<string> => {
  try {
    const errorBody = await res.json();
    return errorBody.detail || res.statusText;
  } catch (e) {
    return res.statusText;
  }
};

// Central API layer
export const api = {
  // Authentication
  login: async (payload: any) => {
    try {
      if (await checkOnline()) {
        const res = await fetch(`${BACKEND_URL}/auth/login`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            email: payload.email,
            password: payload.password
          })
        });
        
        if (!res.ok) {
          throw new Error(await handleResponseError(res));
        }
        
        const data = await res.json();
        localStorage.setItem('documind_token', data.access_token);
        localStorage.setItem('documind_settings', JSON.stringify({
          username: data.user.full_name || 'Alex Rivera',
          email: data.user.email,
          organization: 'DocuMind Workspace'
        }));
        return data;
      }
    } catch (e) {
      console.warn("Backend auth login failed, falling back to mock:", e);
    }
    
    // Fallback Simulation
    localStorage.setItem('documind_token', 'mock-jwt-token-xyz123');
    return { token: 'mock-jwt-token-xyz123', user: { id: 'usr-1', email: payload.email, name: 'Alex Rivera' } };
  },

  register: async (payload: any) => {
    try {
      if (await checkOnline()) {
        const res = await fetch(`${BACKEND_URL}/auth/register`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            email: payload.email,
            password: payload.password,
            full_name: payload.full_name
          })
        });
        
        if (!res.ok) {
          throw new Error(await handleResponseError(res));
        }
        
        const data = await res.json();
        localStorage.setItem('documind_token', data.access_token);
        localStorage.setItem('documind_settings', JSON.stringify({
          username: data.user.full_name || payload.full_name || 'Alex Rivera',
          email: data.user.email,
          organization: 'DocuMind Workspace'
        }));
        return data;
      }
    } catch (e) {
      console.warn("Backend auth register failed, falling back to mock:", e);
    }
    
    // Fallback Simulation
    localStorage.setItem('documind_token', 'mock-jwt-token-xyz123');
    return { token: 'mock-jwt-token-xyz123', user: { id: 'usr-1', email: payload.email, name: payload.name || 'Alex Rivera' } };
  },

  getMe: async () => {
    try {
      if (await checkOnline()) {
        const res = await fetch(`${BACKEND_URL}/auth/me`, {
          headers: getHeaders()
        });
        if (res.ok) {
          const user = await res.json();
          return { id: user.id, email: user.email, name: user.full_name || 'User' };
        }
      }
    } catch (e) {
      console.warn("Backend getMe failed:", e);
    }
    const settings = JSON.parse(localStorage.getItem('documind_settings') || '{}');
    return { id: 'usr-1', email: settings.email || 'alex.rivera@documind.ai', name: settings.username || 'Alex Rivera' };
  },

  // Dashboard Stats
  getStats: async (): Promise<DashboardStats> => {
    try {
      if (await checkOnline()) {
        const res = await fetch(`${BACKEND_URL}/dashboard/stats`, {
          headers: getHeaders()
        });
        if (!res.ok) {
          throw new Error(await handleResponseError(res));
        }
        const body = await res.json();
        return body.data;
      }
    } catch (e) {
      console.warn("Backend getStats failed, falling back to mock:", e);
    }

    // Fallback Simulation based on localStorage
    const docs: DocumentDetail[] = JSON.parse(localStorage.getItem('documind_docs') || '[]');
    const dups: DuplicateMatch[] = JSON.parse(localStorage.getItem('documind_duplicates') || '[]');
    
    const processing = docs.filter(d => d.status === 'processing').length;
    const completed = docs.filter(d => d.status === 'completed').length;
    const failed = docs.filter(d => d.status === 'failed').length;
    
    const invoices = docs.filter(d => d.document_type === 'invoice').length;
    const receipts = docs.filter(d => d.document_type === 'receipt').length;
    const pos = docs.filter(d => d.document_type === 'purchase_order').length;
    const others = docs.filter(d => d.document_type === 'other').length;
    
    const pendingDups = dups.filter(d => d.status === 'pending').length;

    return {
      total_documents: docs.length + 12445,
      processing_documents: processing,
      completed_documents: completed + 12200,
      failed_documents: failed + 245,
      invoice_count: invoices + 4226,
      receipt_count: receipts + 3118,
      purchase_order_count: pos + 2797,
      other_count: others + 304,
      pending_duplicates: pendingDups + 141,
      average_confidence: 98.4
    };
  },

  getRecent: async (limit: number = 5): Promise<DocumentSummary[]> => {
    try {
      if (await checkOnline()) {
        const res = await fetch(`${BACKEND_URL}/dashboard/recent?limit=${limit}`, {
          headers: getHeaders()
        });
        if (!res.ok) {
          throw new Error(await handleResponseError(res));
        }
        const body = await res.json();
        return body.data;
      }
    } catch (e) {
      console.warn("Backend getRecent failed, falling back to mock:", e);
    }
    
    // Fallback Simulation
    const docs: DocumentDetail[] = JSON.parse(localStorage.getItem('documind_docs') || '[]');
    return docs.slice().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, limit);
  },

  // Document list with paging and search filter
  listDocuments: async (filters: { status?: string, document_type?: string, q?: string }, page = 1, page_size = 10) => {
    try {
      if (await checkOnline()) {
        if (filters.q) {
          // HIT SEARCH ENDPOINT
          let query = `?q=${encodeURIComponent(filters.q)}&page=${page}&limit=${page_size}`;
          if (filters.document_type) {
            query += `&document_type=${filters.document_type}`;
          }
          const res = await fetch(`${BACKEND_URL}/search${query}`, {
            headers: getHeaders()
          });
          if (!res.ok) {
            throw new Error(await handleResponseError(res));
          }
          const body = await res.json();
          return {
            data: body.data,
            pagination: body.meta // Normalize meta to pagination
          };
        } else {
          // HIT REGULAR DOCUMENTS LIST ENDPOINT
          let query = `?page=${page}&page_size=${page_size}`;
          if (filters.status) query += `&status=${filters.status}`;
          if (filters.document_type) query += `&document_type=${filters.document_type}`;
          
          const res = await fetch(`${BACKEND_URL}/documents${query}`, {
            headers: getHeaders()
          });
          if (!res.ok) {
            throw new Error(await handleResponseError(res));
          }
          return res.json();
        }
      }
    } catch (e) {
      console.warn("Backend listDocuments failed, falling back to mock:", e);
    }

    // Fallback Simulation
    let docs: DocumentDetail[] = JSON.parse(localStorage.getItem('documind_docs') || '[]');
    
    if (filters.status) {
      docs = docs.filter(d => d.status === filters.status);
    }
    if (filters.document_type) {
      docs = docs.filter(d => d.document_type === filters.document_type);
    }
    if (filters.q) {
      const q = filters.q.toLowerCase();
      docs = docs.filter(d => d.original_filename.toLowerCase().includes(q) || 
                            d.ocr_result?.raw_text.toLowerCase().includes(q) || 
                            d.document_type?.toLowerCase().includes(q));
    }

    const total = docs.length + (filters.q ? 0 : 12445);
    const totalPages = Math.ceil(total / page_size);
    const start = (page - 1) * page_size;
    
    let pageDocs = docs.slice(start, start + page_size);
    if (pageDocs.length < page_size && pageDocs.length === 0 && total > 0) {
      pageDocs = Array.from({ length: Math.min(page_size, total - start) }).map((_, i) => ({
        id: `mock-doc-p${page}-${i}`,
        original_filename: `Invoice_US_Supply_00${start + i}.pdf`,
        mime_type: 'application/pdf',
        file_size_bytes: 421000 + i * 2000,
        status: 'completed',
        document_type: 'invoice',
        page_count: 1,
        error_message: null,
        is_duplicate: false,
        original_document_id: null,
        created_at: new Date(Date.now() - (start + i) * 3600 * 1000).toISOString(),
        updated_at: new Date(Date.now() - (start + i) * 3600 * 1000).toISOString(),
        processed_at: new Date(Date.now() - (start + i) * 3600 * 1000).toISOString(),
      } as any));
    }

    return {
      data: pageDocs,
      pagination: {
        page,
        page_size,
        total,
        total_pages: totalPages
      }
    };
  },

  // Get Single Document Detail
  getDocument: async (id: string): Promise<DocumentDetail> => {
    try {
      if (await checkOnline()) {
        const res = await fetch(`${BACKEND_URL}/documents/${id}`, {
          headers: getHeaders()
        });
        if (!res.ok) {
          throw new Error(await handleResponseError(res));
        }
        const body = await res.json();
        return body.data;
      }
    } catch (e) {
      console.warn("Backend getDocument failed, falling back to mock:", e);
    }
    
    // Fallback Simulation
    const docs: DocumentDetail[] = JSON.parse(localStorage.getItem('documind_docs') || '[]');
    const found = docs.find(d => d.id === id);
    if (!found) {
      throw new Error("Document not found");
    }
    return found;
  },

  deleteDocument: async (id: string): Promise<void> => {
    try {
      if (await checkOnline()) {
        const res = await fetch(`${BACKEND_URL}/documents/${id}`, {
          method: 'DELETE',
          headers: getHeaders()
        });
        if (!res.ok) {
          throw new Error(await handleResponseError(res));
        }
        return;
      }
    } catch (e) {
      console.warn("Backend deleteDocument failed, falling back to mock:", e);
    }
    
    // Fallback Simulation
    let docs: DocumentDetail[] = JSON.parse(localStorage.getItem('documind_docs') || '[]');
    docs = docs.filter(d => d.id !== id);
    localStorage.setItem('documind_docs', JSON.stringify(docs));
  },

  getDocumentEvents: async (id: string): Promise<DocumentEvent[]> => {
    try {
      if (await checkOnline()) {
        const res = await fetch(`${BACKEND_URL}/documents/${id}/events`, {
          headers: getHeaders()
        });
        if (!res.ok) {
          throw new Error(await handleResponseError(res));
        }
        const body = await res.json();
        return body.data;
      }
    } catch (e) {
      console.warn("Backend getDocumentEvents failed, falling back to mock:", e);
    }
    
    // Fallback Simulation
    const eventsMap = JSON.parse(localStorage.getItem('documind_events') || '{}');
    return eventsMap[id] || [
      { id: 'm-ev-1', event_type: 'uploaded', metadata_: null, created_at: new Date(Date.now() - 5000).toISOString() }
    ];
  },

  reprocessDocument: async (id: string): Promise<DocumentDetail> => {
    try {
      if (await checkOnline()) {
        const res = await fetch(`${BACKEND_URL}/documents/${id}/reprocess`, {
          method: 'POST',
          headers: getHeaders()
        });
        if (!res.ok) {
          throw new Error(await handleResponseError(res));
        }
        const body = await res.json();
        return body.data;
      }
    } catch (e) {
      console.warn("Backend reprocessDocument failed, falling back to mock:", e);
    }
    
    // Fallback Simulation
    const docs: DocumentDetail[] = JSON.parse(localStorage.getItem('documind_docs') || '[]');
    const docIdx = docs.findIndex(d => d.id === id);
    if (docIdx !== -1) {
      docs[docIdx].status = 'processing';
      docs[docIdx].error_message = null;
      localStorage.setItem('documind_docs', JSON.stringify(docs));
      
      const eventsMap = JSON.parse(localStorage.getItem('documind_events') || '{}');
      const docEvents = eventsMap[id] || [];
      docEvents.push({
        id: `ev-reprocess-${Date.now()}`,
        event_type: 'reprocess_requested',
        metadata_: null,
        created_at: new Date().toISOString()
      });
      eventsMap[id] = docEvents;
      localStorage.setItem('documind_events', JSON.stringify(eventsMap));

      setTimeout(() => {
        const latestDocs = JSON.parse(localStorage.getItem('documind_docs') || '[]');
        const idx = latestDocs.findIndex((d: any) => d.id === id);
        if (idx !== -1) {
          latestDocs[idx].status = 'completed';
          latestDocs[idx].document_type = latestDocs[idx].document_type || 'invoice';
          latestDocs[idx].processed_at = new Date().toISOString();
          
          if (!latestDocs[idx].ocr_result) {
            latestDocs[idx].ocr_result = {
              id: `ocr-${id}`,
              raw_text: 'Reprocessed raw text output from OCR...',
              ocr_engine: 'pytesseract-v4.0',
              ocr_confidence_avg: 99.0,
              language: 'en',
              created_at: new Date().toISOString()
            };
            latestDocs[idx].classification = {
              id: `class-${id}`,
              predicted_type: 'invoice',
              confidence_score: 99.5,
              model_name: 'gemini-1.5-flash-classification',
              rationale: 'Successful reprocessing extraction and classification',
              created_at: new Date().toISOString()
            };
            latestDocs[idx].extraction = {
              id: `ext-${id}`,
              schema_version: 'v1.2-invoice',
              extracted_json: { invoice_id: 'INV-7712', vendor_name: 'Acme Corp', total_amount: '350.00' },
              overall_confidence: 99.0,
              field_confidences: { invoice_id: 99, vendor_name: 99, total_amount: 99 },
              created_at: new Date().toISOString()
            };
          }
          localStorage.setItem('documind_docs', JSON.stringify(latestDocs));

          const currentEvents = JSON.parse(localStorage.getItem('documind_events') || '{}');
          currentEvents[id].push({
            id: `ev-comp-${Date.now()}`,
            event_type: 'extracted',
            metadata_: { success: true },
            created_at: new Date().toISOString()
          });
          localStorage.setItem('documind_events', JSON.stringify(currentEvents));
        }
      }, 5000);
    }
    return docs[docIdx];
  },

  // Upload multiple documents
  uploadDocuments: async (files: File[], onProgress?: (pct: number) => void): Promise<{ uploaded_count: number; document_ids: string[] }> => {
    try {
      if (await checkOnline()) {
        const formData = new FormData();
        files.forEach(f => formData.append('files', f));
        
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${BACKEND_URL}/documents/upload`);
        
        // Setup Bearer Auth Headers
        const token = getToken();
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        
        if (onProgress) {
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              onProgress(Math.round((e.loaded / e.total) * 100));
            }
          };
        }
        
        const responsePromise = new Promise<{ uploaded_count: number; document_ids: string[] }>((resolve, reject) => {
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(JSON.parse(xhr.responseText));
            } else {
              reject(new Error(xhr.statusText));
            }
          };
          xhr.onerror = () => reject(new Error('Network error during file upload'));
        });
        
        xhr.send(formData);
        return responsePromise;
      }
    } catch (e) {
      console.warn("Backend uploadDocuments failed, falling back to mock simulation:", e);
    }

    // Mock upload simulation fallback
    const docIds: string[] = [];
    const docs = JSON.parse(localStorage.getItem('documind_docs') || '[]');
    const eventsMap = JSON.parse(localStorage.getItem('documind_events') || '{}');

    let pct = 0;
    const interval = setInterval(() => {
      pct += 25;
      if (onProgress) onProgress(Math.min(pct, 100));
      if (pct >= 100) clearInterval(interval);
    }, 200);

    files.forEach(file => {
      const docId = `new-doc-${Math.random().toString(36).substr(2, 9)}`;
      docIds.push(docId);

      const isDPO = file.name.toLowerCase().includes('duplicate') || file.name === 'Invoice_INT_8829.pdf';
      const isFailed = file.name.toLowerCase().includes('corrupt') || file.name.toLowerCase().includes('blurry');
      
      const newDoc: DocumentDetail = {
        id: docId,
        original_filename: file.name,
        mime_type: file.type || 'application/pdf',
        file_size_bytes: file.size,
        status: 'processing',
        document_type: file.name.toLowerCase().includes('receipt') ? 'receipt' : file.name.toLowerCase().includes('po') ? 'purchase_order' : 'invoice',
        page_count: 1,
        error_message: null,
        is_duplicate: isDPO,
        original_document_id: isDPO ? '8829a21d-91b3-461d-9e67-d86b9766942a' : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        processed_at: null,
        ocr_result: null,
        classification: null,
        extraction: null
      };

      docs.unshift(newDoc);
      eventsMap[docId] = [
        { id: `ev-${docId}-1`, event_type: 'uploaded', metadata_: null, created_at: new Date().toISOString() },
        { id: `ev-${docId}-2`, event_type: 'ocr_started', metadata_: { ocr_engine: 'pytesseract' }, created_at: new Date().toISOString() }
      ];

      setTimeout(() => {
        const freshDocs = JSON.parse(localStorage.getItem('documind_docs') || '[]');
        const idx = freshDocs.findIndex((d: any) => d.id === docId);
        if (idx !== -1) {
          if (isFailed) {
            freshDocs[idx].status = 'failed';
            freshDocs[idx].error_message = 'Failed to extract text. File structure is corrupt or unsupported.';
          } else {
            freshDocs[idx].status = 'completed';
            freshDocs[idx].processed_at = new Date().toISOString();
            
            freshDocs[idx].ocr_result = {
              id: `ocr-${docId}`,
              raw_text: `Extracted content for ${file.name}.\nVendor: Acme Corp\nInvoice Date: 2026-06-24\nTotal: $150.00\n`,
              ocr_engine: 'pytesseract-v4.0',
              ocr_confidence_avg: 98.2,
              language: 'en',
              created_at: new Date().toISOString()
            };
            freshDocs[idx].classification = {
              id: `class-${docId}`,
              predicted_type: freshDocs[idx].document_type || 'invoice',
              confidence_score: 99.0,
              model_name: 'gemini-1.5-flash-classification',
              rationale: 'Recognized document properties during file ingestion scan.',
              created_at: new Date().toISOString()
            };
            freshDocs[idx].extraction = {
              id: `ext-${docId}`,
              schema_version: 'v1.2-invoice',
              extracted_json: {
                invoice_id: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
                vendor_name: 'Acme Corp Inc.',
                total_amount: '150.00',
                tax_id: '94-1100223'
              },
              overall_confidence: 98.2,
              field_confidences: { invoice_id: 99, vendor_name: 98, total_amount: 99, tax_id: 97 },
              created_at: new Date().toISOString()
            };
          }
          localStorage.setItem('documind_docs', JSON.stringify(freshDocs));

          const freshEvents = JSON.parse(localStorage.getItem('documind_events') || '{}');
          if (isFailed) {
            freshEvents[docId].push({
              id: `ev-${docId}-3`,
              event_type: 'processing_failed',
              metadata_: { reason: 'Corrupt file structure' },
              created_at: new Date().toISOString()
            });
          } else {
            freshEvents[docId].push(
              { id: `ev-${docId}-3`, event_type: 'ocr_completed', metadata_: { confidence: 98.2 }, created_at: new Date().toISOString() },
              { id: `ev-${docId}-4`, event_type: 'classified', metadata_: { type: freshDocs[idx].document_type }, created_at: new Date().toISOString() },
              { id: `ev-${docId}-5`, event_type: 'extracted', metadata_: { keys: ['invoice_id', 'total_amount'] }, created_at: new Date().toISOString() }
            );

            if (isDPO) {
              freshEvents[docId].push({
                id: `ev-${docId}-6`,
                event_type: 'duplicate_flagged',
                metadata_: { confidence: 100 },
                created_at: new Date().toISOString()
              });

              const dups = JSON.parse(localStorage.getItem('documind_duplicates') || '[]');
              dups.push({
                id: `dup-match-${Date.now()}`,
                match_type: 'invoice_number_vendor',
                similarity_score: 1.0,
                match_details: { invoice_number: 'INV-9042', vendor_name: 'Stripe, Inc.' },
                status: 'pending',
                created_at: new Date().toISOString(),
                source_document: freshDocs[idx],
                matched_document: freshDocs.find((d: any) => d.id === '8829a21d-91b3-461d-9e67-d86b9766942a') || freshDocs[idx]
              });
              localStorage.setItem('documind_duplicates', JSON.stringify(dups));
            }
          }
          localStorage.setItem('documind_events', JSON.stringify(freshEvents));
        }
      }, 6000);
    });

    localStorage.setItem('documind_docs', JSON.stringify(docs));
    localStorage.setItem('documind_events', JSON.stringify(eventsMap));

    return {
      uploaded_count: files.length,
      document_ids: docIds
    };
  },

  // Duplicate endpoints
  listDuplicates: async (): Promise<DuplicateMatch[]> => {
    try {
      if (await checkOnline()) {
        const res = await fetch(`${BACKEND_URL}/duplicates`, {
          headers: getHeaders()
        });
        if (!res.ok) {
          throw new Error(await handleResponseError(res));
        }
        const body = await res.json();
        return body.data;
      }
    } catch (e) {
      console.warn("Backend listDuplicates failed, falling back to mock:", e);
    }
    return JSON.parse(localStorage.getItem('documind_duplicates') || '[]');
  },

  updateDuplicateStatus: async (id: string, status: 'pending' | 'confirmed' | 'dismissed'): Promise<DuplicateMatch> => {
    try {
      if (await checkOnline()) {
        const res = await fetch(`${BACKEND_URL}/duplicates/${id}`, {
          method: 'PATCH',
          headers: getHeaders(),
          body: JSON.stringify({ status })
        });
        if (!res.ok) {
          throw new Error(await handleResponseError(res));
        }
        return res.json();
      }
    } catch (e) {
      console.warn("Backend updateDuplicateStatus failed, falling back to mock:", e);
    }
    
    // Fallback Simulation
    const dups: DuplicateMatch[] = JSON.parse(localStorage.getItem('documind_duplicates') || '[]');
    const dupIdx = dups.findIndex(d => d.id === id);
    if (dupIdx !== -1) {
      dups[dupIdx].status = status;
      localStorage.setItem('documind_duplicates', JSON.stringify(dups));
      return dups[dupIdx];
    }
    throw new Error('Duplicate match not found');
  },

  // Settings Endpoints
  getSettings: async () => {
    return JSON.parse(localStorage.getItem('documind_settings') || '{}');
  },

  updateSettings: async (settings: any) => {
    localStorage.setItem('documind_settings', JSON.stringify(settings));
    return settings;
  }
};
