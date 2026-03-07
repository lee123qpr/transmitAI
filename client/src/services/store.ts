import { create } from 'zustand';

export interface DocumentData {
    id: string; // Database ID (UUID or Serial)
    filename: string;
    documentNumber: string;
    revision: string;
    title: string;
    issueDate: string;
    discipline: string;
    consultant: string;
    status: string;
    uploadedAt: string;
    transmittalTitle?: string;
    summary?: string;
    documentType?: string;
    confidence_score?: number;
    reasoning_notes?: string;
}

interface UserState {
    usage: {
        current: number;
        limit: number;
    };
    subscriptionTier: string;
    createdAt: string | null;
    renewalDate: number | null;
    cancelAtPeriodEnd: boolean;
    companyName: string | null;
    companyLogoUrl: string | null;
    isInitialized: boolean;
    fetchUserStatus: (userId: string, email?: string, token?: string) => Promise<void>;
}

interface SystemState {
    maintenanceMode: boolean;
    announcements: { id: string; message: string; type: string; active: boolean }[];
    fetchSystemState: () => Promise<void>;
}

interface DocumentState extends UserState, SystemState {
    documents: DocumentData[];
    isLoading: boolean;
    error: string | null;
    fetchDocuments: (userId: string, token?: string) => Promise<void>;
    addDocument: (doc: DocumentData) => void;
    deleteDocument: (id: string, userId: string, token?: string) => void;
    deleteTransmittal: (title: string, userId: string, token?: string) => void;
    setUsage: (curr: number, limit: number) => void;
}

const API_URL = import.meta.env.VITE_API_URL || '/api';



export const useDocumentStore = create<DocumentState>((set, get) => ({
    documents: [],
    isLoading: false,
    error: null,

    // User Stats
    usage: { current: 0, limit: 10 },
    subscriptionTier: 'free',
    createdAt: null,
    renewalDate: null,
    cancelAtPeriodEnd: false,
    companyName: null,
    companyLogoUrl: null,
    isInitialized: false,

    // System Stats
    maintenanceMode: false,
    announcements: [],

    fetchUserStatus: async (userId, email, token) => {
        try {
            let urlStr = `${API_URL}/user?userId=${encodeURIComponent(userId)}&_t=${Date.now()}`;
            if (email) urlStr += `&email=${encodeURIComponent(email)}`;

            const res = await fetch(urlStr, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            if (!res.ok) throw new Error('Failed to fetch user status');

            const data = await res.json();

            set({
                usage: { current: data.documents_usage, limit: data.documents_limit },
                subscriptionTier: data.subscription_tier,
                createdAt: data.createdAt,
                renewalDate: data.renewalDate,
                cancelAtPeriodEnd: data.cancel_at_period_end || false,
                companyName: data.company_name,
                companyLogoUrl: data.company_logo_url,
            });
        } catch (err) {
            console.error('[Store] fetchUserStatus error:', err);
        } finally {
            set({ isInitialized: true });
        }
    },

    fetchSystemState: async () => {
        try {
            const [sRes, aRes] = await Promise.all([
                fetch(`${API_URL}/config`),
                fetch(`${API_URL}/announcements`)
            ]);

            if (sRes.ok && aRes.ok) {
                const config = await sRes.json();
                const announcements = await aRes.json();

                set({
                    maintenanceMode: config.maintenanceMode,
                    announcements: announcements
                });
            }
        } catch (err) {
            console.error('[Store] fetchSystemState error:', err);
        }
    },

    fetchDocuments: async (userId, token) => {
        set({ isLoading: true, error: null });
        try {
            const headers: HeadersInit = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`${API_URL}/documents?userId=${userId}&_t=${Date.now()}`, {
                headers
            });
            if (!res.ok) throw new Error('Failed to fetch documents');
            const data = await res.json();

            console.log('[Store] Fetched documents:', data.length);
            if (data.length > 0) {
                console.log('[Store] Sample Transmittal Title:', data[0].transmittalTitle);
            }

            set({
                documents: data,
                isLoading: false
            });
        } catch (err) {
            set({ error: (err as Error).message, isLoading: false });
        }
    },

    addDocument: (doc) => set((state) => ({
        documents: [doc, ...state.documents],
        usage: { ...state.usage, current: state.usage.current + 1 }
    })),

    deleteDocument: async (id, userId, token) => {
        const prevDocs = get().documents;
        set((state) => ({
            documents: state.documents.filter(d => d.id !== id),
        }));

        try {
            const headers: HeadersInit = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`${API_URL}/documents/${id}?userId=${userId}`, {
                method: 'DELETE',
                headers
            });

            if (!res.ok) throw new Error('Failed to delete document');

            // Sync with server
            await get().fetchUserStatus(userId);
        } catch (err) {
            console.error('Failed to delete document:', err);
            set({ documents: prevDocs });
        }
    },

    deleteTransmittal: async (title, userId, token) => {
        // Optimistic Update
        const prevDocs = get().documents;

        set((state) => ({
            documents: state.documents.filter(d => (d.transmittalTitle || 'Unsorted Uploads') !== title),
        }));

        try {
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`${API_URL}/transmittals?userId=${userId}`, {
                method: 'DELETE',
                headers,
                body: JSON.stringify({ title })
            });

            if (!res.ok) throw new Error('Failed to delete transmittal');

            // Sync with server to ensure limits/usage are 100% accurate
            await get().fetchUserStatus(userId);

        } catch (err) {
            console.error(err);
            set({ documents: prevDocs }); // Revert
        }
    },

    setUsage: (current, limit) => set({ usage: { current, limit } })
}));
