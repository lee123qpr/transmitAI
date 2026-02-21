import { useState, useEffect, useCallback } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import {
    Shield, Users, FileText, Search, Mail, AlertTriangle,
    Activity, Newspaper, Bell, Settings, Lock, Eye, Trash2,
    RefreshCcw, CircleCheck as CheckCircle, CircleX as XCircle, LogOut,
    Check, X, PlusCircle, ExternalLink, Globe, Laptop, Info, Copy,
    Bold, Italic, List, Image as ImageIcon, Quote, Code, Heading,
    ChevronUp, ChevronDown, ArrowUpDown, Download
} from 'lucide-react';
import { useToast } from '../../components/Toast';
import SEO from '../../components/SEO';
import Modal from '../../components/Modal';
import { useDocumentStore } from '../../services/store';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface Stats {
    totalUsers: number;
    totalDocuments: number;
    proUsers: number;
    revenue: number;
    recentUsers: UserData[];
    recentLogs: { id: string; user_id: string; action: string; details: string; created_at: string; ip_address: string }[];
    contentStats: {
        articles: { published: number; drafts: number };
        newsletterSubscribers: number;
    };
}

interface UserData {
    id: string;
    email: string;
    subscription_tier: string;
    documents_usage: number;
    documents_limit: number;
    created_at: string;
    company_name?: string;
    status: 'active' | 'suspended';
    newsletter_subscribed: boolean;
    last_seen_at?: string;
    last_ip?: string;
}

interface Subscriber {
    email: string;
    created_at: string;
    source: 'public' | 'registered';
}
interface Article {
    id: string;
    title: string;
    slug: string;
    published: boolean;
    created_at: string;
    content?: string;
    excerpt?: string;
    header_image?: string;
    keywords?: string;
}

interface Announcement {
    id: string;
    message: string;
    active: boolean;
    type: string;
    link?: string;
}

interface SystemHealth {
    status: string;
    database: { status: string; latency: number };
    uptime: number;
    timestamp: string;
}

interface LogEntry {
    id: string;
    user_id: string;
    admin_id?: string;
    target_id?: string;
    action: string;
    details: string;
    created_at: string;
    ip_address: string;
}

interface BlockedIP {
    ip: string;
    reason: string;
    blocked_at: string;
}

interface Setting {
    key: string;
    value: unknown; // Value can be anything (string, object, etc.)
}

interface Subscriber {
    email: string;
    created_at: string;
    status: string;
}

const EmailManager = ({ settings, onSave, isSaving, onTest }: { settings: Setting[], onSave: (key: string, value: { subject: string; html: string }) => void, isSaving: boolean, onTest: (type: 'newsletter' | 'user_welcome') => void }) => {
    const [selectedType, setSelectedType] = useState<'newsletter' | 'user_welcome'>('newsletter');
    const [subject, setSubject] = useState('');
    const [html, setHtml] = useState('');
    const [previewMode, setPreviewMode] = useState(false);

    const getTemplate = useCallback((type: string) => {
        const key = `email_template_${type}`;
        const setting = settings.find(s => s.key === key);
        return (setting?.value as { subject: string; html: string }) || { subject: '', html: '' };
    }, [settings]);

    const handleTypeChange = (type: 'newsletter' | 'user_welcome') => {
        setSelectedType(type);
        const template = getTemplate(type);
        const defaultSubject = type === 'newsletter' ? 'Welcome to our Newsletter!' : 'Welcome to Transmittal!';
        setSubject(template.subject || defaultSubject);
        setHtml(template.html || '');
    };

    useEffect(() => {
        const template = getTemplate(selectedType);
        const defaultSubject = selectedType === 'newsletter' ? 'Welcome to our Newsletter!' : 'Welcome to Transmittal!';
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSubject(template.subject || defaultSubject);

        setHtml(template.html || '');
    }, [settings, selectedType, getTemplate]);

    return (
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row h-[700px] animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Sidebar */}
            <div className="w-full md:w-64 border-r border-slate-100 bg-slate-50/50 p-6 space-y-2">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 px-2">Email Automations</h3>
                <button
                    onClick={() => handleTypeChange('newsletter')}
                    className={`w-full text-left px-5 py-4 rounded-2xl text-sm font-bold transition-all duration-300 ${selectedType === 'newsletter' ? 'bg-white shadow-xl shadow-blue-500/10 text-blue-600 border border-blue-100' : 'text-slate-500 hover:bg-white hover:text-slate-900'}`}
                >
                    Newsletter Welcome
                </button>
                <button
                    onClick={() => handleTypeChange('user_welcome')}
                    className={`w-full text-left px-5 py-4 rounded-2xl text-sm font-bold transition-all duration-300 ${selectedType === 'user_welcome' ? 'bg-white shadow-xl shadow-blue-500/10 text-blue-600 border border-blue-100' : 'text-slate-500 hover:bg-white hover:text-slate-900'}`}
                >
                    User Welcome
                </button>
            </div>

            {/* Editor */}
            <div className="flex-1 flex flex-col bg-white">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button
                            onClick={() => setPreviewMode(false)}
                            className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${!previewMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                        >
                            Edit Template
                        </button>
                        <button
                            onClick={() => setPreviewMode(true)}
                            className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${previewMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                        >
                            Live Preview
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => onTest(selectedType)}
                            disabled={isSaving}
                            className="px-4 py-2.5 bg-slate-100 text-slate-700 text-sm font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 disabled:opacity-50 flex items-center gap-2 transition-all"
                        >
                            <Mail size={16} />
                            Send Test
                        </button>
                        <button
                            onClick={() => onSave(`email_template_${selectedType}`, { subject, html })}
                            disabled={isSaving}
                            className="px-6 py-2.5 bg-blue-600 text-white text-sm font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center gap-2 active:scale-95 transition-all"
                        >
                            {isSaving ? <RefreshCcw size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
                            Update Template
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col p-8">
                    {previewMode ? (
                        <div className="flex-1 border border-slate-200 rounded-[1.5rem] overflow-hidden bg-slate-50 p-6 flex flex-col">
                            <div className="bg-white rounded-xl shadow-xl border border-slate-200 flex-1 flex flex-col overflow-hidden">
                                <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                    <span className="ml-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Preview: {subject}</span>
                                </div>
                                <iframe
                                    title="Preview"
                                    srcDoc={html || `<div style="padding: 40px; text-align: center; color: #94a3b8; font-family: sans-serif;">Build something beautiful...</div>`}
                                    className="w-full flex-1 border-none"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 flex-1 flex flex-col min-h-0">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Subject Line</label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-bold transition-all"
                                    placeholder="Enter subject line..."
                                />
                            </div>
                            <div className="flex-1 flex flex-col min-h-0">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">HTML Content</label>
                                <textarea
                                    value={html}
                                    onChange={(e) => setHtml(e.target.value)}
                                    className="flex-1 w-full px-5 py-5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-mono resize-none transition-all"
                                    placeholder="<!-- Paste your premium HTML template here -->"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const AdminDashboard = () => {
    const { user, isLoaded } = useUser();
    const { getToken } = useAuth();
    const { showToast } = useToast();
    const { isInitialized, isAdmin } = useDocumentStore();
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'content' | 'newsletter' | 'emails' | 'security' | 'settings'>('overview');

    const isActuallyAdmin = isAdmin || user?.primaryEmailAddress?.emailAddress?.toLowerCase() === 'leekilcoyne1@gmail.com';

    // Data States
    const [stats, setStats] = useState<Stats | null>(null);
    const [users, setUsers] = useState<UserData[]>([]);
    const [articles, setArticles] = useState<Article[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [health, setHealth] = useState<SystemHealth | null>(null);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
    const [settings, setSettings] = useState<Setting[]>([]);
    const [newsletterSubscribers, setNewsletterSubscribers] = useState<Subscriber[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof UserData; direction: 'asc' | 'desc' }>({ key: 'created_at', direction: 'desc' });

    // Modal States
    const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [emailSubject, setEmailSubject] = useState('');
    const [emailMessage, setEmailMessage] = useState('');

    // CMS Modals
    const [articleModalOpen, setArticleModalOpen] = useState(false);
    const [selectedArticle, setSelectedArticle] = useState<Partial<Article>>({});
    const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Partial<Announcement>>({});

    const [isActionLoading, setIsActionLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Sorting Logic
    const sortedUsers = [...users]
        .filter(u => u.email.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => {
            const key = sortConfig.key;
            const aVal = a[key] ?? '';
            const bVal = b[key] ?? '';

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

    const requestSort = (key: keyof UserData) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const SortIcon = ({ column }: { column: keyof UserData }) => {
        if (sortConfig.key !== column) return <ArrowUpDown size={14} className="opacity-30 group-hover:opacity-100" />;
        return sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
    };

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = await getToken();
            const headers = { Authorization: `Bearer ${token}` };

            if (activeTab === 'overview') {
                const [sRes, hRes] = await Promise.all([
                    fetch(`${API_URL}/admin/stats`, { headers }),
                    fetch(`${API_URL}/admin/health`, { headers })
                ]);

                if (!sRes.ok || !hRes.ok) throw new Error(`Stats: ${sRes.status}, Health: ${hRes.status}`);

                const sData = await sRes.json();
                setStats(sData.stats);
                setHealth(await hRes.json());
            } else if (activeTab === 'users') {
                const res = await fetch(`${API_URL}/admin/users`, { headers });
                if (!res.ok) throw new Error(`Users: ${res.status}`);
                const data = await res.json();
                setUsers(data.users);
            } else if (activeTab === 'newsletter') {
                const res = await fetch(`${API_URL}/admin/newsletter`, { headers });
                if (!res.ok) throw new Error(`Newsletter: ${res.status}`);
                const data = await res.json();
                setNewsletterSubscribers(data.subscribers);
                // Settings are fetched globally for 'settings' or 'emails' tab, no need to duplicate here
            } else if (activeTab === 'content') { // Changed from 'articles' to 'content' to match tab name
                const [articlesRes, announcementsRes] = await Promise.all([
                    fetch(`${API_URL}/admin/articles`, { headers }),
                    fetch(`${API_URL}/admin/announcements`, { headers })
                ]);
                if (!articlesRes.ok) throw new Error(`Articles: ${articlesRes.status}`);
                if (!announcementsRes.ok) throw new Error(`Announcements: ${announcementsRes.status}`);
                const articlesData = await articlesRes.json();
                const announcementsData = await announcementsRes.json();
                console.log('[Admin] Received articles:', articlesData.articles);
                console.log('[Admin] Received announcements:', announcementsData.announcements);
                setArticles(articlesData.articles || []);
                setAnnouncements(announcementsData.announcements || []);
            } else if (activeTab === 'security') {
                const [lRes, iRes] = await Promise.all([
                    fetch(`${API_URL}/admin/logs`, { headers }),
                    fetch(`${API_URL}/admin/blocked-ips`, { headers })
                ]);
                if (!lRes.ok || !iRes.ok) throw new Error(`Logs: ${lRes.status}, IPs: ${iRes.status}`);
                setLogs(await lRes.json());
                setBlockedIPs(await iRes.json());
            } else if (activeTab === 'settings' || activeTab === 'emails') {
                const res = await fetch(`${API_URL}/admin/settings`, { headers });
                if (!res.ok) throw new Error(`Settings: ${res.status}`);
                setSettings(await res.json());
            }
        } catch {
            showToast('Failed to fetch data', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [activeTab, getToken, showToast]);

    useEffect(() => {
        if (isLoaded && user && isInitialized) {
            if (isActuallyAdmin) {
                fetchData();
            } else {
                showToast('Unauthorized access', 'error');
            }
        }
    }, [isLoaded, user, isInitialized, isActuallyAdmin, fetchData, showToast]);

    const handleAction = async (method: string, url: string, body?: unknown) => {
        setIsActionLoading(true);
        try {
            const token = await getToken();
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: body ? JSON.stringify(body) : undefined
            });
            if (!res.ok) throw new Error('Action failed');
            showToast('Success', 'success');
            fetchData();
        } catch {
            showToast('Action failed', 'error');
        } finally {
            setIsActionLoading(false);
        }
    };

    const downloadCSV = (data: Record<string, unknown>[], filename: string) => {
        if (!data.length) return;
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(obj =>
            Object.values(obj).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
        ).join('\n');
        const csvContent = `${headers}\n${rows}`;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExport = async (type: 'users' | 'newsletter', mode?: 'public' | 'unified') => {
        setIsActionLoading(true);
        try {
            const token = await getToken();
            let url = type === 'users'
                ? `${API_URL}/admin/users/export`
                : `${API_URL}/admin/newsletter/export`;

            if (mode) {
                url += `?mode=${mode}`;
            }

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Export failed');
            const data = await res.json();
            downloadCSV(data, `${type}_export_${new Date().toISOString().split('T')[0]}.csv`);
            showToast('Export successful', 'success');
        } catch {
            showToast('Export failed', 'error');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);

        setIsUploading(true);
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!res.ok) throw new Error('Upload failed');

            const data = await res.json();
            setSelectedArticle({ ...selectedArticle, header_image: data.url });
            showToast('Image uploaded successfully', 'success');
        } catch {
            showToast('Failed to upload image', 'error');
        } finally {
            setIsUploading(false);
        }
    };


    const handleSendEmail = async () => {
        if (!selectedUser) return;
        setIsActionLoading(true);
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/admin/users/${selectedUser.id}/email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ subject: emailSubject, message: emailMessage })
            });
            if (!res.ok) throw new Error('Failed to send email');
            showToast(`Email sent to ${selectedUser.email}`, 'success');
            setEmailModalOpen(false);
        } catch {
            showToast('Failed to send email', 'error');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleSaveArticle = async () => {
        if (!selectedArticle.title || !selectedArticle.content) {
            showToast('Title and content are required', 'error');
            return;
        }

        setIsActionLoading(true);
        try {
            const token = await getToken();
            const slug = selectedArticle.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || '';
            const payload = { ...selectedArticle, slug };

            const res = await fetch(`${API_URL}/admin/articles`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Failed to save article');
            showToast('Article saved successfully', 'success');
            setArticleModalOpen(false);
            fetchData();
        } catch {
            showToast('Failed to save article', 'error');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleSaveAnnouncement = async () => {
        setIsActionLoading(true);
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/admin/announcements`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(selectedAnnouncement)
            });

            if (!res.ok) throw new Error('Failed to save banner');
            showToast('Banner saved successfully', 'success');
            setAnnouncementModalOpen(false);
            fetchData();
        } catch {
            showToast('Failed to save banner', 'error');
        } finally {
            setIsActionLoading(false);
        }
    };

    if (!isLoaded || !isInitialized) return <div className="p-8 text-center text-slate-500">Initializing Admin Session...</div>;
    if (isLoading && !stats && !users.length) return <div className="p-8 text-center text-slate-500">Loading Admin Panel Data...</div>;
    if (!isActuallyAdmin) return <div className="p-8 text-center text-red-500">Unauthorized: Admin Access Required</div>;

    const formatUptime = (seconds: number) => {
        const d = Math.floor(seconds / 86400);
        const h = Math.floor((seconds % 86400) / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return d > 0 ? `${d}d ${h}h` : `${h}h ${m}m`;
    };

    return (
        <div className="space-y-6">
            <SEO title="Admin Console | Transmit.AI" />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-8 rounded-2xl text-white shadow-xl">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500 rounded-xl shadow-lg shadow-blue-500/20">
                        <Shield size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Admin Console</h1>
                        <p className="text-slate-400">Total Oversight & System Management</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => fetchData()}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <RefreshCcw size={18} className={isLoading ? 'animate-spin' : ''} />
                        Sync
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex overflow-x-auto gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm scrollbar-hide">
                <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<Activity size={18} />} label="System Health" />
                <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Users size={18} />} label="User Management" />
                <TabButton active={activeTab === 'content'} onClick={() => setActiveTab('content')} icon={<Newspaper size={18} />} label="Content (CMS)" />
                <TabButton active={activeTab === 'newsletter'} onClick={() => setActiveTab('newsletter')} icon={<Mail size={18} />} label="Newsletter" />
                <TabButton active={activeTab === 'emails'} onClick={() => setActiveTab('emails')} icon={<Mail size={18} className="text-orange-500" />} label="Emails" />
                <TabButton active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon={<Lock size={18} />} label="Security & Auditing" />
                <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings size={18} />} label="Settings" />
            </div>

            {/* Tab Panels */}
            <div className="min-h-[500px]">
                {activeTab === 'overview' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {/* Status Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <StatusCard
                                label="DB Status"
                                value={health?.database.status === 'healthy' ? 'Online' : 'Offline'}
                                sub={`Latency: ${health?.database.latency}ms`}
                                icon={<RefreshCcw size={20} />}
                                color={health?.database.status === 'healthy' ? 'green' : 'red'}
                            />
                            <StatusCard
                                label="System Uptime"
                                value={health ? formatUptime(health.uptime) : 'N/A'}
                                sub="Healthy"
                                icon={<Laptop size={20} />}
                                color="blue"
                            />
                            <StatusCard
                                label="Total Revenue"
                                value={`$${stats?.revenue || 0}`}
                                sub="0% from last month"
                                icon={<RefreshCcw size={20} />}
                                color="purple"
                            />
                            <StatusCard
                                label="Environment"
                                value="Production"
                                sub="Neon DB / Vercel"
                                icon={<Globe size={20} />}
                                color="slate"
                            />
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <MetricCard label="Total Users" value={stats?.totalUsers || 0} icon={<Users size={24} />} color="blue" />
                            <MetricCard label="Paid Subs" value={stats?.proUsers || 0} icon={<CheckCircle size={24} />} color="green" />
                            <MetricCard label="Total Docs" value={stats?.totalDocuments || 0} icon={<FileText size={24} />} color="orange" />
                        </div>

                        {/* Recent Activity & Content */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Activity Feed */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <Activity size={20} className="text-blue-500" /> Recent Activity
                                </h3>
                                <div className="space-y-4">
                                    {stats?.recentUsers?.map((u) => (
                                        <div key={u.id} className="flex items-center justify-between text-sm border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-green-100 text-green-700 p-1.5 rounded-full"><Users size={14} /></div>
                                                <div>
                                                    <p className="font-medium text-slate-700">New User Signup</p>
                                                    <p className="text-slate-500 text-xs">{u.email}</p>
                                                </div>
                                            </div>
                                            <span className="text-xs text-slate-400">{new Date(u.created_at).toLocaleDateString()}</span>
                                        </div>
                                    ))}
                                    {stats?.recentLogs?.map((l) => (
                                        <div key={l.id} className="flex items-center justify-between text-sm border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-amber-100 text-amber-700 p-1.5 rounded-full"><Shield size={14} /></div>
                                                <div>
                                                    <p className="font-medium text-slate-700 capitalize">{l.action.replace(/_/g, ' ')}</p>
                                                    <p className="text-slate-500 text-xs">Admin Action</p>
                                                </div>
                                            </div>
                                            <span className="text-xs text-slate-400">{new Date(l.created_at).toLocaleDateString()}</span>
                                        </div>
                                    ))}
                                    {!stats?.recentUsers?.length && !stats?.recentLogs?.length && (
                                        <p className="text-slate-400 text-center py-4">No recent activity found.</p>
                                    )}
                                </div>
                            </div>

                            {/* Content Overview */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <FileText size={20} className="text-purple-500" /> Content Overview
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                                        <p className="text-slate-500 text-sm font-medium mb-1">Published Articles</p>
                                        <p className="text-2xl font-bold text-slate-800">{stats?.contentStats?.articles?.published || 0}</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                                        <p className="text-slate-500 text-sm font-medium mb-1">Draft Articles</p>
                                        <p className="text-2xl font-bold text-slate-800">{stats?.contentStats?.articles?.drafts || 0}</p>
                                    </div>
                                    <div className="col-span-2 p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between">
                                        <div>
                                            <p className="text-blue-800 font-bold">Newsletter Subscribers</p>
                                            <p className="text-blue-600 text-sm">Active Audience</p>
                                        </div>
                                        <p className="text-3xl font-bold text-blue-700">{stats?.contentStats?.newsletterSubscribers || 0}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-in slide-in-from-bottom-2 duration-300">
                        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
                                <Users size={20} /> User Management
                            </h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleExport('users')}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors font-bold text-sm border border-blue-200"
                                    title="Export all registered users with emails and company info"
                                >
                                    <Download size={16} />
                                    Export Users
                                </button>
                                <div className="relative w-full md:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search by email..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="overflow-x-auto text-slate-900">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4 cursor-pointer group" onClick={() => requestSort('email')}>
                                            <div className="flex items-center gap-1">User Details <SortIcon column="email" /></div>
                                        </th>
                                        <th className="px-6 py-4 cursor-pointer group" onClick={() => requestSort('status')}>
                                            <div className="flex items-center gap-1">Status <SortIcon column="status" /></div>
                                        </th>
                                        <th className="px-6 py-4 cursor-pointer group" onClick={() => requestSort('last_seen_at')}>
                                            <div className="flex items-center gap-1">Last Activity <SortIcon column="last_seen_at" /></div>
                                        </th>
                                        <th className="px-6 py-4">Last IP</th>
                                        <th className="px-6 py-4">Tier / Limits</th>
                                        <th className="px-6 py-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {sortedUsers.map(u => (
                                        <tr key={u.id} className="hover:bg-slate-50/50">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold">{u.email}</div>
                                                <div className="text-xs text-slate-500">Joined {new Date(u.created_at).toDateString()}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={u.status} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-slate-700">
                                                    {u.last_seen_at ? new Date(u.last_seen_at).toLocaleDateString() : 'N/A'}
                                                </div>
                                                <div className="text-[10px] text-slate-500">
                                                    {u.last_seen_at ? new Date(u.last_seen_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never active'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 font-mono">
                                                        {u.last_ip || '0.0.0.0'}
                                                    </code>
                                                    {u.last_ip && (
                                                        <button
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(u.last_ip!);
                                                                showToast('IP copied to clipboard', 'info');
                                                            }}
                                                            className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                                                            title="Copy IP"
                                                        >
                                                            <Copy size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <select
                                                        className="text-xs font-bold bg-slate-100 border-none rounded p-1 focus:ring-0"
                                                        value={u.subscription_tier}
                                                        onChange={(e) => handleAction('PATCH', `${API_URL}/admin/users/${u.id}/tier`, { tier: e.target.value, limit: e.target.value === 'pro' ? 100 : e.target.value === 'business' ? 1000 : 10 })}
                                                    >
                                                        <option value="free">FREE</option>
                                                        <option value="pro">PRO</option>
                                                        <option value="business">BIZ</option>
                                                    </select>
                                                    <div className="text-[10px] text-slate-500">{u.documents_usage} / {u.documents_limit} docs</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 flex items-center gap-2">
                                                <button onClick={() => { setSelectedUser(u); setEmailModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 border border-slate-200 rounded-lg transition-colors"><Mail size={16} /></button>
                                                <button onClick={() => handleAction('PATCH', `${API_URL}/admin/users/${u.id}/status`, { status: u.status === 'active' ? 'suspended' : 'active' })} className={`p-2 border border-slate-200 rounded-lg transition-colors ${u.status === 'active' ? 'text-slate-400 hover:text-red-500' : 'text-green-500 hover:text-green-600'}`}>
                                                    {u.status === 'active' ? <XCircle size={16} /> : <CheckCircle size={16} />}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'content' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-right-2 duration-300">
                        {/* Articles */}
                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="font-bold flex items-center gap-2"><Newspaper size={18} /> Articles</h3>
                                <button
                                    onClick={() => { setSelectedArticle({ published: false }); setArticleModalOpen(true); }}
                                    className="p-1 px-3 text-xs bg-slate-900 text-white rounded-lg flex items-center gap-2"
                                >
                                    <PlusCircle size={14} /> New
                                </button>
                            </div>
                            <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                                {articles.length === 0 ? <p className="p-6 text-slate-400 text-center">No articles found</p> : articles.map(a => (
                                    <div key={a.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                                        <div>
                                            <div className="font-medium text-slate-900">{a.title}</div>
                                            <div className="text-[10px] text-slate-400 uppercase tracking-widest">{a.published ? 'Published' : 'Draft'}</div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => { setSelectedArticle(a); setArticleModalOpen(true); }}
                                                className="p-1.5 text-slate-400 hover:text-blue-600"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button onClick={() => handleAction('DELETE', `/api/admin/articles/${a.id}`)} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Announcements */}
                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="font-bold flex items-center gap-2"><Bell size={18} /> Live Banners</h3>
                                <button
                                    onClick={() => { setSelectedAnnouncement({ active: true, type: 'info' }); setAnnouncementModalOpen(true); }}
                                    className="p-1 px-3 text-xs bg-slate-900 text-white rounded-lg flex items-center gap-2"
                                >
                                    <PlusCircle size={14} /> Add
                                </button>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {announcements.length === 0 ? <p className="p-6 text-slate-400 text-center">No active banners</p> : announcements.map(n => (
                                    <div key={n.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                                        <div className="flex-1 mr-4">
                                            <div className={`text-sm ${n.active ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>{n.message}</div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`w-2 h-2 rounded-full ${n.active ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></span>
                                                <span className="text-[10px] text-slate-500 uppercase">{n.type}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleAction('POST', '/api/admin/announcements', { ...n, active: !n.active })} className={`p-1.5 rounded-lg border ${n.active ? 'bg-green-50 border-green-200 text-green-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                                                {n.active ? <Check size={14} /> : <X size={14} />}
                                            </button>
                                            <button onClick={() => handleAction('DELETE', `/api/admin/announcements/${n.id}`)} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'security' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-left-2 duration-300">
                        {/* Audit Logs */}
                        <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm h-fit">
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="font-bold flex items-center gap-2 text-slate-900"><Activity size={18} /> Admin Audit Trail</h3>
                                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">Last 100 Actions</span>
                            </div>
                            <div className="overflow-auto max-h-[600px] text-slate-900">
                                <table className="w-full text-left">
                                    <thead className="sticky top-0 bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
                                        <tr>
                                            <th className="px-4 py-3">Timestamp</th>
                                            <th className="px-4 py-3">Admin</th>
                                            <th className="px-4 py-3">Action</th>
                                            <th className="px-4 py-3">Target</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 text-xs">
                                        {logs.map(log => (
                                            <tr key={log.id} className="hover:bg-slate-50/50">
                                                <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{new Date(log.created_at).toLocaleTimeString()}</td>
                                                <td className="px-4 py-3 font-medium truncate max-w-[100px]">{log.admin_id}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold
                                                        ${log.action.includes('delete') ? 'bg-red-50 text-red-600' :
                                                            log.action.includes('create') ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                                                        {log.action.replace('_', ' ').toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-slate-500">{log.target_id || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* IP Blocking */}
                        <div className="bg-slate-900 text-white rounded-xl shadow-xl overflow-hidden flex flex-col h-[600px]">
                            <div className="p-6 bg-slate-800/50 border-b border-white/10">
                                <h3 className="font-bold flex items-center gap-2"><Lock size={18} className="text-red-500" /> IP Firewall</h3>
                                <p className="text-xs text-slate-400 mt-1">Block malicious actors instantly</p>
                            </div>
                            <div className="p-4 space-y-4">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        id="ip-input"
                                        placeholder="0.0.0.0"
                                        className="flex-1 bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                                    />
                                    <button
                                        onClick={() => {
                                            const input = document.getElementById('ip-input') as HTMLInputElement;
                                            if (input.value) handleAction('POST', '/api/admin/blocked-ips', { ip: input.value, reason: 'Manual Block' });
                                        }}
                                        className="p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                                    >
                                        <Shield size={18} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto px-4 pb-4 divide-y divide-white/5">
                                {blockedIPs.map(ip => (
                                    <div key={ip.ip} className="py-3 flex items-center justify-between">
                                        <div>
                                            <div className="text-sm font-mono text-white">{ip.ip}</div>
                                            <div className="text-[10px] text-slate-400">{ip.reason}</div>
                                        </div>
                                        <button onClick={() => handleAction('DELETE', `/api/admin/blocked-ips/${ip.ip}`)} className="text-slate-500 hover:text-white"><Trash2 size={16} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'newsletter' && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                                        <Mail size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Newsletter Subscribers</h2>
                                        <p className="text-slate-500 text-sm mt-1">Combined list of public signups and registered users</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleExport('newsletter', 'public')}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors font-bold text-sm border border-blue-200"
                                        title="Export only emails from public footer signup"
                                    >
                                        <Download size={16} />
                                        Export Public Signups
                                    </button>
                                    <button
                                        onClick={() => handleExport('newsletter', 'unified')}
                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors font-bold text-sm border border-indigo-200"
                                        title="Export both public signups and registered newsletter users"
                                    >
                                        <Download size={16} />
                                        Export Full List
                                    </button>
                                </div>
                                <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mr-2">Total:</span>
                                    <span className="text-lg font-black text-blue-600">{newsletterSubscribers.length}</span>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100">
                                            <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Email Address</th>
                                            <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Source</th>
                                            <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Subscribed On</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {newsletterSubscribers.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="px-8 py-16 text-center text-slate-400 font-medium italic">No subscribers found yet</td>
                                            </tr>
                                        ) : (
                                            newsletterSubscribers.map((sub: Subscriber & { source?: string }, i: number) => (
                                                <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-8 py-5 font-black text-slate-700">{sub.email}</td>
                                                    <td className="px-8 py-5 text-center">
                                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${sub.source === 'registered'
                                                            ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                                            : 'bg-blue-50 text-blue-700 border border-blue-100'
                                                            }`}>
                                                            {sub.source}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5 text-right text-slate-500 font-medium tabular-nums group-hover:text-slate-900 transition-colors">
                                                        {new Date(sub.created_at).toLocaleDateString(undefined, {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'emails' && (
                    <div className="animate-in slide-in-from-right-4 duration-500">
                        <EmailManager
                            settings={settings}
                            isSaving={isActionLoading}
                            onSave={(key, value) => handleAction('POST', `/api/admin/settings`, { key, value })}
                            onTest={(type) => handleAction('POST', `/api/admin/emails/test-${type === 'user_welcome' ? 'welcome' : 'newsletter'}`)}
                        />
                    </div>
                )}

                {
                    activeTab === 'settings' && (
                        <div className="max-w-2xl mx-auto space-y-6 animate-in zoom-in-95 duration-300">
                            <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
                                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                    <Settings className="text-blue-500" /> Platform Settings
                                </h2>

                                <div className="space-y-8">
                                    <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-xl ${settings.find(s => s.key === 'maintenance_mode')?.value ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                                                <AlertTriangle size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900">Maintenance Mode</h4>
                                                <p className="text-sm text-slate-500">Stop all uploads and downloads site-wide</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const current = settings.find(s => s.key === 'maintenance_mode')?.value;
                                                handleAction('POST', '/api/admin/settings', { key: 'maintenance_mode', value: !current });
                                            }}
                                            className={`w-14 h-8 rounded-full transition-colors relative ${settings.find(s => s.key === 'maintenance_mode')?.value ? 'bg-amber-500' : 'bg-slate-300'}`}
                                        >
                                            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${settings.find(s => s.key === 'maintenance_mode')?.value ? 'right-1' : 'left-1'}`}></div>
                                        </button>
                                    </div>

                                    <SettingsItem
                                        label="Global Alert Banner"
                                        desc="Show a message to all users in the header"
                                        icon={<Bell size={20} />}
                                        action={<button onClick={() => setActiveTab('content')} className="text-blue-600 font-bold text-sm">Configure</button>}
                                    />

                                    <SettingsItem
                                        label="Resend Email Integration"
                                        desc="Manage API keys and templates"
                                        icon={<Mail size={20} />}
                                        action={<button className="text-slate-400 font-bold text-sm flex items-center gap-1 cursor-not-allowed">Active <ExternalLink size={14} /></button>}
                                    />

                                    <div className="pt-6 border-t border-slate-100">
                                        <button className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-slate-800 transition-shadow">
                                            <LogOut size={20} /> Logout Administration
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }
            </div >

            {/* Support Modal */}
            < Modal
                isOpen={emailModalOpen}
                onClose={() => setEmailModalOpen(false)}
                title={`Contact ${selectedUser?.email}`}
                type="info"
                onConfirm={handleSendEmail}
                confirmText={isActionLoading ? "Sending..." : "Send Secure Message"}
                isLoading={isActionLoading}
                className="max-w-2xl"
            >
                <div className="space-y-4 pt-4">
                    <div className="flex items-center gap-3 p-4 bg-blue-50 text-blue-700 rounded-xl mb-4 border border-blue-100">
                        <Mail size={32} />
                        <p className="text-xs">Your message will be sent through the system email account. Ensure compliance with GDPR/Privacy policies.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1 uppercase tracking-wider">Subject Line</label>
                        <input
                            type="text"
                            value={emailSubject}
                            onChange={(e) => setEmailSubject(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="Important account update..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1 uppercase tracking-wider">Message Content</label>
                        <textarea
                            value={emailMessage}
                            onChange={(e) => setEmailMessage(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl h-48 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                            placeholder="Type your message here..."
                        />
                    </div>
                </div>
            </Modal >

            {/* Article Modal */}
            < Modal
                isOpen={articleModalOpen}
                onClose={() => setArticleModalOpen(false)}
                title={selectedArticle.id ? 'Edit Article' : 'New Article'}
                type="info"
                onConfirm={handleSaveArticle}
                confirmText={isActionLoading ? "Saving..." : "Save Article"}
                isLoading={isActionLoading}
                className="w-full h-full max-w-none rounded-none m-0"
            >
                <div className="space-y-4 pt-4 flex flex-col h-full">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1 font-mono uppercase tracking-wider">Category (e.g., Guide, AI, News)</label>
                            <input
                                type="text"
                                value={selectedArticle.keywords || ''}
                                onChange={(e) => setSelectedArticle({ ...selectedArticle, keywords: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="ai, construction, document-control..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Header Image</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <ImageIcon size={16} className="absolute left-3 top-3 text-slate-400" />
                                    <input
                                        type="text"
                                        value={selectedArticle.header_image || ''}
                                        onChange={(e) => setSelectedArticle({ ...selectedArticle, header_image: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="https://... or upload file"
                                    />
                                </div>
                                <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                        disabled={isUploading}
                                    />
                                    <ImageIcon size={18} className="text-slate-500" />
                                    <span className="text-sm font-bold text-slate-600">
                                        {isUploading ? 'Uploading...' : 'Upload'}
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col min-h-0">
                        <label className="block text-sm font-bold text-slate-700 mb-1">Content</label>
                        <div className="border border-slate-200 rounded-lg flex-1 flex flex-col overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                            {/* Toolbar */}
                            <div className="flex items-center gap-1 p-2 bg-slate-50 border-b border-slate-100 overflow-x-auto shrink-0">
                                <button title="Bold" className="p-1.5 hover:bg-slate-200 rounded text-slate-600" onClick={() => setSelectedArticle(prev => ({ ...prev, content: (prev.content || '') + '**bold**' }))}><Bold size={16} /></button>
                                <button title="Italic" className="p-1.5 hover:bg-slate-200 rounded text-slate-600" onClick={() => setSelectedArticle(prev => ({ ...prev, content: (prev.content || '') + '*italic*' }))}><Italic size={16} /></button>
                                <div className="w-px h-4 bg-slate-300 mx-1"></div>
                                <button title="Heading" className="p-1.5 hover:bg-slate-200 rounded text-slate-600" onClick={() => setSelectedArticle(prev => ({ ...prev, content: (prev.content || '') + '\n## Heading' }))}><Heading size={16} /></button>
                                <button title="Quote" className="p-1.5 hover:bg-slate-200 rounded text-slate-600" onClick={() => setSelectedArticle(prev => ({ ...prev, content: (prev.content || '') + '\n> Quote' }))}><Quote size={16} /></button>
                                <button title="Code" className="p-1.5 hover:bg-slate-200 rounded text-slate-600" onClick={() => setSelectedArticle(prev => ({ ...prev, content: (prev.content || '') + '\n```\ncode\n```' }))}><Code size={16} /></button>
                                <div className="w-px h-4 bg-slate-300 mx-1"></div>
                                <button title="List" className="p-1.5 hover:bg-slate-200 rounded text-slate-600" onClick={() => setSelectedArticle(prev => ({ ...prev, content: (prev.content || '') + '\n- List item' }))}><List size={16} /></button>
                                <button title="Image" className="p-1.5 hover:bg-slate-200 rounded text-slate-600" onClick={() => setSelectedArticle(prev => ({ ...prev, content: (prev.content || '') + '\n![Alt](url)' }))}><ImageIcon size={16} /></button>
                            </div>
                            <textarea
                                value={String(selectedArticle.content || '')}
                                onChange={(e) => setSelectedArticle({ ...selectedArticle, content: e.target.value })}
                                className="flex-1 w-full p-4 outline-none font-mono text-sm resize-none overflow-y-auto"
                                placeholder="Write your article here..."
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Excerpt</label>
                        <textarea
                            value={String(selectedArticle.excerpt || '')}
                            onChange={(e) => setSelectedArticle({ ...selectedArticle, excerpt: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg h-24 outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm resize-none"
                            placeholder="Short summary for previews..."
                        />
                    </div>

                    <div className="flex items-center gap-2 pt-2 shrink-0">
                        <input
                            type="checkbox"
                            className="w-4 h-4"
                            checked={selectedArticle.published || false}
                            onChange={(e) => setSelectedArticle({ ...selectedArticle, published: e.target.checked })}
                        />
                        <span className="text-sm font-bold text-slate-700">Publish Immediately</span>
                    </div>
                </div>
            </Modal >

            {/* Announcement Modal */}
            < Modal
                isOpen={announcementModalOpen}
                onClose={() => setAnnouncementModalOpen(false)}
                title="Manage Banner"
                type="warning"
                onConfirm={handleSaveAnnouncement}
                confirmText={isActionLoading ? "Saving..." : "Save Banner"}
                isLoading={isActionLoading}
            >
                <div>
                    <div className="flex items-center gap-3 p-4 bg-blue-50 text-blue-700 rounded-xl mb-4 border border-blue-100">
                        <Info size={32} />
                        <p className="text-xs">Banner will appear at the top of the user dashboard.</p>
                    </div>
                    <div className="space-y-4 pt-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Message</label>
                            <input
                                type="text"
                                value={selectedAnnouncement.message || ''}
                                onChange={(e) => setSelectedAnnouncement({ ...selectedAnnouncement, message: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="System maintenance scheduled..."
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Type</label>
                                <select
                                    value={selectedAnnouncement.type || 'info'}
                                    onChange={(e) => setSelectedAnnouncement({ ...selectedAnnouncement, type: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none"
                                >
                                    <option value="info">Info (Blue)</option>
                                    <option value="warning">Warning (Amber)</option>
                                    <option value="success">Success (Green)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Link (Optional)</label>
                                <input
                                    type="text"
                                    value={selectedAnnouncement.link || ''}
                                    onChange={(e) => setSelectedAnnouncement({ ...selectedAnnouncement, link: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="https://"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 pt-6">
                            <input
                                type="checkbox"
                                className="w-4 h-4"
                                checked={selectedAnnouncement.active || false}
                                onChange={(e) => setSelectedAnnouncement({ ...selectedAnnouncement, active: e.target.checked })}
                            />
                            <span className="text-sm font-bold text-slate-700">Active</span>
                        </div>
                    </div>
                </div>
            </Modal >
        </div >
    );
};

// Sub-components
const TabButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all font-semibold whitespace-nowrap
            ${active ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
    >
        {icon}
        {label}
    </button>
);

const MetricCard = ({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: 'blue' | 'green' | 'orange' }) => {
    const colors = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        orange: 'bg-orange-50 text-orange-600'
    };
    return (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-6">
                <div className={`p-3 rounded-xl ${colors[color]}`}>{icon}</div>
                <span className="text-3xl font-bold text-slate-900 tracking-tight">{value}</span>
            </div>
            <h3 className="text-slate-500 font-bold uppercase tracking-widest text-xs">{label}</h3>
        </div>
    );
};

const StatusCard = ({ label, value, sub, icon, color }: { label: string; value: string | number; sub: string; icon: React.ReactNode; color: 'green' | 'blue' | 'purple' | 'slate' | 'red' }) => {
    const bgColors = {
        green: 'bg-green-500/10 border-green-500/20 text-green-700',
        blue: 'bg-blue-500/10 border-blue-500/20 text-blue-700',
        purple: 'bg-purple-500/10 border-purple-500/20 text-purple-700',
        slate: 'bg-slate-500/10 border-slate-500/20 text-slate-700',
        red: 'bg-red-500/10 border-red-500/20 text-red-700'
    };
    return (
        <div className={`p-5 rounded-2xl border ${bgColors[color]} shadow-inner`}>
            <div className="flex items-center gap-3 mb-2">
                <div className="p-1.5 opacity-60">{icon}</div>
                <span className="text-[10px] uppercase font-bold tracking-widest opacity-70">{label}</span>
            </div>
            <div className="text-xl font-black">{value}</div>
            <div className="text-[10px] font-bold opacity-60 mt-1">{sub}</div>
        </div>
    );
};

const StatusBadge = ({ status }: { status: string }) => (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest
        ${status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        {status}
    </span>
);

const SettingsItem = ({ label, desc, icon, action }: { label: string; desc: string; icon: React.ReactNode; action: React.ReactNode }) => (
    <div className="flex items-center justify-between py-4 group">
        <div className="flex items-center gap-4">
            <div className="p-2.5 bg-slate-100 text-slate-500 rounded-xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">{icon}</div>
            <div>
                <h4 className="font-bold text-slate-900 text-sm">{label}</h4>
                <p className="text-xs text-slate-500">{desc}</p>
            </div>
        </div>
        {action}
    </div>
);

export default AdminDashboard;
