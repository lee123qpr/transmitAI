import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Newspaper, Calendar, User, ArrowRight } from 'lucide-react';
import SEO from '../components/SEO';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface Article {
    id: string;
    title: string;
    slug: string;
    excerpt?: string;
    header_image?: string;
    created_at: string;
    keywords?: string;
}

const ArticlesPage = () => {
    const [articles, setArticles] = useState<Article[]>([]);
    const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
    const [activeCategory, setActiveCategory] = useState('All');
    const [categories, setCategories] = useState<string[]>(['All']);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchArticles = async () => {
            try {
                const res = await fetch(`${API_URL}/articles`);
                if (!res.ok) throw new Error('Failed to fetch');
                const data = await res.json();
                setArticles(data);
                setFilteredArticles(data);

                // Extract unique categories from keywords
                const allKeywords = new Set<string>();
                allKeywords.add('All');
                data.forEach((article: Article) => {
                    if (article.keywords) {
                        article.keywords.split(',').forEach(k => allKeywords.add(k.trim()));
                    }
                });
                setCategories(Array.from(allKeywords).sort());
            } catch (error) {
                console.error('Fetch error:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchArticles();
    }, []);

    useEffect(() => {
        if (activeCategory === 'All') {
            setFilteredArticles(articles);
        } else {
            setFilteredArticles(articles.filter(a =>
                a.keywords?.split(',').map(k => k.trim()).includes(activeCategory)
            ));
        }
    }, [activeCategory, articles]);

    return (
        <div className="bg-slate-50 min-h-screen">
            <SEO
                title="Articles & Insights | Transmit.AI"
                description="Stay updated with the latest in construction AI, document control, and project management."
            />

            <section className="py-20 px-6 lg:px-8 bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                        <div>
                            <h1 className="text-4xl lg:text-6xl font-black text-slate-900 mb-6 tracking-tight">
                                Latest <span className="text-blue-600">Articles</span>
                            </h1>
                            <p className="text-slate-600 text-lg max-w-2xl font-medium">
                                Expert insights on AI, document control, and construction technology.
                            </p>
                        </div>
                    </div>

                    {/* Category Filter */}
                    {categories.length > 1 && (
                        <div className="flex flex-wrap gap-2 mb-12">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`px-5 py-2 rounded-xl font-bold text-sm transition-all ${activeCategory === cat
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105'
                                            : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <section className="py-16 px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200 animate-pulse">
                                    <div className="w-full h-48 bg-slate-100 rounded-xl mb-4" />
                                    <div className="h-6 bg-slate-100 rounded w-3/4 mb-3" />
                                    <div className="h-4 bg-slate-100 rounded w-full mb-2" />
                                    <div className="h-4 bg-slate-100 rounded w-2/3" />
                                </div>
                            ))}
                        </div>
                    ) : articles.length === 0 ? (
                        <div className="text-center py-20">
                            <Newspaper size={48} className="mx-auto text-slate-300 mb-4" />
                            <h3 className="text-xl font-bold text-slate-900">No articles found</h3>
                            <p className="text-slate-500">Check back later for new content.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredArticles.map((article) => (
                                <Link
                                    key={article.id}
                                    to={`/articles/${article.slug}`}
                                    className="group bg-white rounded-[2rem] border border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-slate-200/50 transition-all flex flex-col h-full"
                                >
                                    <div className="relative h-56 overflow-hidden">
                                        {article.header_image ? (
                                            <img
                                                src={article.header_image}
                                                alt={article.title}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                <Newspaper size={40} />
                                            </div>
                                        )}
                                        <div className="absolute top-4 left-4">
                                            <span className="bg-white/90 backdrop-blur-sm text-blue-600 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
                                                Article
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-8 flex-grow flex flex-col">
                                        <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={14} />
                                                {new Date(article.created_at).toLocaleDateString()}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <User size={14} />
                                                Transmit Team
                                            </span>
                                        </div>

                                        <h2 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-blue-600 transition-colors leading-tight">
                                            {article.title}
                                        </h2>

                                        <p className="text-slate-600 text-sm mb-6 line-clamp-3 leading-relaxed">
                                            {article.excerpt || 'Read the full article to learn more about this topic.'}
                                        </p>

                                        {article.keywords && (
                                            <div className="flex flex-wrap gap-2 mb-6">
                                                {article.keywords.split(',').map((tag, i) => (
                                                    <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded uppercase tracking-wider">
                                                        {tag.trim()}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        <div className="mt-auto flex items-center gap-2 text-blue-600 font-bold text-sm">
                                            Read More <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default ArticlesPage;
