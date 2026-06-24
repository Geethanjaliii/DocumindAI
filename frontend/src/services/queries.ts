import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import type { DocumentSummary, DocumentDetail } from './api';

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.getStats(),
    refetchInterval: 10000, // Poll stats every 10 seconds for real-time dashboards
  });
};

export const useRecentDocuments = (limit = 5) => {
  return useQuery({
    queryKey: ['recent-documents', limit],
    queryFn: () => api.getRecent(limit),
    refetchInterval: 5000, // Refresh recent lists often to catch complete processing states
  });
};

export const useDocumentsList = (filters: { status?: string; document_type?: string; q?: string }, page = 1, page_size = 10) => {
  return useQuery({
    queryKey: ['documents-list', filters, page, page_size],
    queryFn: () => api.listDocuments(filters, page, page_size),
    refetchInterval: (query) => {
      // If any documents in the list are processing, refresh every 3 seconds to catch status updates
      const data = query.state.data as any;
      if (data?.data?.some((d: DocumentSummary) => d.status === 'processing')) {
        return 3000;
      }
      return false;
    }
  });
};

export const useDocumentDetails = (id: string | undefined) => {
  return useQuery({
    queryKey: ['document-details', id],
    queryFn: () => {
      if (!id) throw new Error("Document ID required");
      return api.getDocument(id);
    },
    enabled: !!id,
    refetchInterval: (query) => {
      const data = query.state.data as DocumentDetail;
      return data && data.status === 'processing' ? 3000 : false;
    }
  });
};

export const useDocumentEvents = (id: string | undefined) => {
  return useQuery({
    queryKey: ['document-events', id],
    queryFn: () => {
      if (!id) throw new Error("Document ID required");
      return api.getDocumentEvents(id);
    },
    enabled: !!id,
    refetchInterval: 3000
  });
};

export const useReprocessDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.reprocessDocument(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['document-details', id] });
      queryClient.invalidateQueries({ queryKey: ['documents-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    }
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents-list'] });
      queryClient.invalidateQueries({ queryKey: ['recent-documents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['duplicate-matches'] });
    }
  });
};

export const useUploadDocuments = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ files, onProgress }: { files: File[]; onProgress?: (pct: number) => void }) => 
      api.uploadDocuments(files, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents-list'] });
      queryClient.invalidateQueries({ queryKey: ['recent-documents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    }
  });
};

export const useDuplicateMatches = () => {
  return useQuery({
    queryKey: ['duplicate-matches'],
    queryFn: () => api.listDuplicates(),
    refetchInterval: 5000
  });
};

export const useUpdateDuplicateStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'pending' | 'confirmed' | 'dismissed' }) => 
      api.updateDuplicateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['duplicate-matches'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    }
  });
};

export const useSettings = () => {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => api.getSettings()
  });
};

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: any) => api.updateSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    }
  });
};
