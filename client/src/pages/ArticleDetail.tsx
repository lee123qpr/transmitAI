import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, User, ArrowLeft, ChevronRight, Newspaper, Linkedin, Twitter, Link2 } from 'lucide-react';
import SEO from '../components/SEO';
import { useToast } from '../components/Toast';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface Article {
    id: string;
    title: string;
    slug: string;
    content: string;
    header_image?: string;
    created_at: string;
    keywords?: string;
}

const ArticleDetail = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [article, setArticle] = useState<Article | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        showToast('Article link copied to clipboard!', 'success');
    };

    const shareOnLinkedIn = () => {
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank', 'width=600,height=600');
    };

    const shareOnTwitter = () => {
        if (!article) return;
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(article.title)}`, '_blank', 'width=600,height=600');
    };

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                const res = await fetch(`${API_URL}/articles/${slug}`);
                if (!res.ok) {
                    if (res.status === 404) navigate('/articles');
                    throw new Error('Failed to fetch');
                }
                const data = await res.json();
                setArticle(data);
            } catch (error) {
                console.error('Fetch error:', error);
            } finally {
                setIsLoading(false);
            }
        };
        if (slug) fetchArticle();
    }, [slug, navigate]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white py-20 px-6">
                <div className="max-w-3xl mx-auto space-y-8 animate-pulse">
                    <div className="h-4 w-32 bg-slate-100 rounded" />
                    <div className="h-12 w-full bg-slate-100 rounded" />
                    <div className="h-4 w-48 bg-slate-100 rounded" />
                    <div className="w-full h-80 bg-slate-100 rounded-2xl" />
                    <div className="space-y-4">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="h-4 w-full bg-slate-100 rounded" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!article) return null;

    return (
        <div className="bg-white min-h-screen pb-24">
            <SEO
                title={`${article.title} | Transmit.AI`}
                description={article.content.substring(0, 160)}
            />

            {/* Breadcrumbs */}
            <div className="bg-slate-50 border-b border-slate-100 py-4 px-6 mb-12">
                <div className="max-w-4xl mx-auto flex items-center gap-2 text-xs font-bold text-slate-400 tracking-widest uppercase">
                    <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
                    <ChevronRight size={12} />
                    <Link to="/articles" className="hover:text-blue-600 transition-colors">Articles</Link>
                    <ChevronRight size={12} />
                    <span className="text-slate-900 truncate">{article.title}</span>
                </div>
            </div>

            <article className="max-w-4xl mx-auto px-6">
                <Link
                    to="/articles"
                    className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 mb-8 transition-colors group"
                >
                    <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" /> Back to Articles
                </Link>

                <header className="mb-12">
                    <div className="flex items-center gap-4 text-xs font-bold text-blue-600 mb-4 uppercase tracking-widest">
                        <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {new Date(article.created_at).toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                            <User size={14} />
                            Transmit Team
                        </span>
                    </div>

                    <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-8 leading-tight">
                        {article.title}
                    </h1>

                    {article.keywords && (
                        <div className="flex flex-wrap gap-2 mb-8">
                            {article.keywords.split(',').map((tag, i) => (
                                <span key={i} className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full uppercase tracking-wider">
                                    {tag.trim()}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Social Share Strip */}
                    <div className="flex items-center gap-3 pt-6 pb-8 border-t border-slate-100">
                        <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mr-2">Share</span>
                        <button onClick={shareOnLinkedIn} className="p-2.5 rounded-full bg-slate-50 text-[#0A66C2] hover:bg-[#0A66C2] hover:text-white transition-all shadow-sm">
                            <Linkedin size={18} />
                        </button>
                        <button onClick={shareOnTwitter} className="p-2.5 rounded-full bg-slate-50 text-slate-800 hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                            <Twitter size={18} />
                        </button>
                        <button onClick={handleCopyLink} className="p-2.5 rounded-full bg-slate-50 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-all shadow-sm" title="Copy Link">
                            <Link2 size={18} />
                        </button>
                    </div>

                    {article.header_image ? (
                        <div className="rounded-3xl overflow-hidden shadow-2xl mb-12 aspect-[21/9]">
                            <img
                                src={article.header_image}
                                alt={article.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ) : (
                        <div className="rounded-3xl bg-slate-100 aspect-[21/9] flex items-center justify-center text-slate-300 mb-12">
                            <Newspaper size={80} />
                        </div>
                    )}
                </header>

                <div className="prose prose-lg prose-slate max-w-none">
                    <div className="whitespace-pre-wrap text-slate-700 text-lg leading-relaxed">
                        {article.content}
                    </div>
                </div>

                <footer className="mt-16 pt-8 border-t border-slate-100">
                    <NewsletterSignup />
                </footer>
            </article>
        </div>
    );
};

const NewsletterSignup = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        setStatus('loading');
        try {
            const res = await fetch(`${API_URL}/newsletter/subscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            if (!res.ok) throw new Error();
            setStatus('success');
            setEmail('');
        } catch {
            setStatus('error');
        }
    };

    return (
        <div className="bg-slate-50 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/50 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl group-hover:bg-blue-200/50 transition-colors" />

            <div className="relative z-10 max-w-2xl">
                <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">
                    Want more <span className="text-blue-600">insights?</span>
                </h3>
                <p className="text-slate-600 text-lg mb-8 font-medium">
                    Join our newsletter to receive the latest AI updates in construction.
                </p>

                {status === 'success' ? (
                    <div className="p-4 bg-green-50 text-green-700 font-bold rounded-2xl border border-green-100 animate-in fade-in slide-in-from-bottom-2">
                        🎉 Thanks for subscribing! We'll stay in touch.
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="email"
                            required
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="flex-grow px-6 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold"
                        />
                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50 whitespace-nowrap active:scale-95"
                        >
                            {status === 'loading' ? 'Subscribing...' : 'Subscribe Now'}
                        </button>
                    </form>
                )}
                {status === 'error' && (
                    <p className="mt-4 text-red-500 font-bold text-sm">Failed to subscribe. Please try again.</p>
                )}
            </div>
        </div>
    );
};

export default ArticleDetail;
