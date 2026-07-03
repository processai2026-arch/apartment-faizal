import { create } from 'zustand';
import { api } from '@/lib/api';
import type { OfficeDocument, DocumentSummary } from '@/types';

interface DocumentState {
  documents: OfficeDocument[];
  summary: DocumentSummary | null;
  loading: boolean;

  loadDocuments: (params?: Record<string, string | undefined>) => Promise<void>;
  loadSummary: () => Promise<void>;
  createDocument: (payload: Partial<OfficeDocument>) => Promise<OfficeDocument>;
  updateDocument: (id: string, payload: Partial<OfficeDocument>) => Promise<OfficeDocument>;
  deleteDocument: (id: string) => Promise<void>;
}

export const useDocumentStore = create<DocumentState>()((set) => ({
  documents: [],
  summary: null,
  loading: false,

  loadDocuments: async (params) => {
    set({ loading: true });
    try {
      const result = await api.documents.list(params);
      set({ documents: result.items });
    } finally { set({ loading: false }); }
  },

  loadSummary: async () => {
    const summary = await api.documents.summary();
    set({ summary });
  },

  createDocument: async (payload) => {
    const doc = await api.documents.create(payload);
    set((s) => ({ documents: [doc, ...s.documents] }));
    return doc;
  },

  updateDocument: async (id, payload) => {
    const updated = await api.documents.update(id, payload);
    set((s) => ({ documents: s.documents.map((d) => (d.id === id ? updated : d)) }));
    return updated;
  },

  deleteDocument: async (id) => {
    await api.documents.destroy(id);
    set((s) => ({ documents: s.documents.filter((d) => d.id !== id) }));
  },
}));
