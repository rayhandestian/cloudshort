import { useState, useEffect } from 'react'
import { Plus, Trash2, Link as LinkIcon, Loader2, LogOut, Copy, Check, Settings as SettingsIcon, LayoutDashboard } from 'lucide-react'
import { Login } from './Login'
import { Settings } from './Settings'

type Link = {
    id: number;
    slug: string;
    long_url: string;
    created_at: number;
    clicks: number;
}

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [currentView, setCurrentView] = useState<'dashboard' | 'settings'>('dashboard');
    const [links, setLinks] = useState<Link[]>([]);
    const [sort, setSort] = useState<'created_at' | 'clicks'>('created_at');
    const [order, setOrder] = useState<'asc' | 'desc'>('desc');
    const [newSlug, setNewSlug] = useState('');
    const [newUrl, setNewUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [copying, setCopying] = useState<string | null>(null);

    useEffect(() => {
        checkAuth();
    }, []);

    // Re-fetch when sort/order changes (if authenticated)
    useEffect(() => {
        if (isAuthenticated) {
            fetchLinks();
        }
    }, [sort, order]);

    const checkAuth = async () => {
        try {
            const res = await fetch('/api/auth/check', { credentials: 'include' });
            const data = await res.json();
            if (data.authenticated) {
                setIsAuthenticated(true);
                fetchLinks(); // Initial fetch
            } else {
                console.log('Auth check failed:', data);
                setIsAuthenticated(false);
            }
        } catch {
            setIsAuthenticated(false);
        }
    };

    const fetchLinks = async () => {
        try {
            const res = await fetch(`/api/links?sort=${sort}&order=${order}`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setLinks(data);
            } else {
                const err = await res.text();
                console.error('Fetch links error:', res.status, err);
            }
        } catch (err) {
            console.error('Failed to fetch links', err);
        }
    };

    const createLink = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation: Alphanumeric slugs only (plus hyphens/underscores)
        if (!/^[a-zA-Z0-9-_]+$/.test(newSlug)) {
            alert('Invalid slug: Use only letters, numbers, hyphens, and underscores.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/links', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug: newSlug, long_url: newUrl }),
                credentials: 'include'
            });
            if (res.ok) {
                setNewSlug('');
                setNewUrl('');
                fetchLinks();
            } else if (res.status === 409) {
                alert('Error: This slug is already taken. Please choose another one.');
            } else {
                const err = await res.text();
                console.error('Create link error:', res.status, err);
                alert('Failed to create link: ' + err);
            }
        } catch (err) {
            alert('Error creating link');
        } finally {
            setLoading(false);
        }
    };

    const deleteLink = async (id: number) => {
        if (!confirm('Are you sure?')) return;
        try {
            await fetch(`/api/links/${id}`, { method: 'DELETE', credentials: 'include' });
            fetchLinks();
        } catch (err) {
            console.error('Failed to delete', err);
        }
    };

    const handleLogout = async () => {
        await fetch('/api/logout', { method: 'POST', credentials: 'include' });
        setIsAuthenticated(false);
    };

    const copyToClipboard = async (text: string, slug: string) => {
        await navigator.clipboard.writeText(text);
        setCopying(slug);
        setTimeout(() => setCopying(null), 2000);
    };

    if (isAuthenticated === null) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="animate-spin text-white" size={32} />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Login onLogin={() => { setIsAuthenticated(true); fetchLinks(); }} />;
    }

    return (
        <div className="min-h-screen bg-black text-white selection:bg-white/20">
            <nav className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                            <LinkIcon size={18} />
                        </div>
                        <span className="font-bold text-lg tracking-tight">Cloudshort</span>

                        <div className="h-6 w-px bg-white/10 mx-2"></div>

                        <div className="flex bg-white/5 rounded-lg p-1">
                            <button
                                onClick={() => setCurrentView('dashboard')}
                                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${currentView === 'dashboard' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
                            >
                                <div className="flex items-center gap-2"><LayoutDashboard size={14} /> Dashboard</div>
                            </button>
                            <button
                                onClick={() => setCurrentView('settings')}
                                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${currentView === 'settings' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
                            >
                                <div className="flex items-center gap-2"><SettingsIcon size={14} /> Settings</div>
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5"
                    >
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto px-6 py-12">
                {currentView === 'settings' ? (
                    <Settings />
                ) : (
                    <>
                        {/* Stats Section */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
                                <h3 className="text-zinc-500 text-sm font-medium mb-1">Total Links</h3>
                                <p className="text-3xl font-bold">{links.length}</p>
                            </div>
                            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
                                <h3 className="text-zinc-500 text-sm font-medium mb-1">Total Clicks</h3>
                                <p className="text-3xl font-bold">{links.reduce((acc, link) => acc + (link.clicks || 0), 0)}</p>
                            </div>
                            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
                                <h3 className="text-zinc-500 text-sm font-medium mb-1">Top Link</h3>
                                <p className="text-xl font-medium truncate text-zinc-300">
                                    {links.length > 0 ? links.sort((a, b) => (b.clicks || 0) - (a.clicks || 0))[0].slug : '-'}
                                </p>
                            </div>
                        </div>

                        <div className="grid lg:grid-cols-[350px,1fr] gap-8 items-start">
                            {/* Create Form */}
                            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 sticky top-24">
                                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                    <Plus className="text-zinc-500" size={20} /> New Link
                                </h2>
                                <form onSubmit={createLink} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Short Slug</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 select-none">/</span>
                                            <input
                                                type="text"
                                                placeholder="twitter"
                                                className="w-full bg-black border border-white/10 rounded-lg pl-6 pr-4 py-2.5 text-white placeholder-zinc-700 focus:outline-none focus:border-white/30 transition-colors"
                                                value={newSlug}
                                                onChange={e => setNewSlug(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Destination URL</label>
                                        <input
                                            type="url"
                                            placeholder="https://..."
                                            className="w-full bg-black border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-zinc-700 focus:outline-none focus:border-white/30 transition-colors"
                                            value={newUrl}
                                            onChange={e => setNewUrl(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-white text-black font-bold rounded-lg px-4 py-2.5 hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={18} /> : 'Create Short Link'}
                                    </button>
                                </form>
                            </div>

                            {/* Links List */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="text-xl font-semibold">Active Links</h2>
                                    <div className="flex items-center gap-4 text-sm text-zinc-500">
                                        <button
                                            onClick={() => {
                                                if (sort === 'clicks') {
                                                    setOrder(order === 'asc' ? 'desc' : 'asc');
                                                } else {
                                                    setSort('clicks');
                                                    setOrder('desc');
                                                }
                                            }}
                                            className={`flex items-center gap-1 hover:text-zinc-300 transition-colors ${sort === 'clicks' ? 'text-white font-medium' : ''}`}
                                        >
                                            Clicks
                                            {sort === 'clicks' && (order === 'desc' ? '↓' : '↑')}
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (sort === 'created_at') {
                                                    setOrder(order === 'asc' ? 'desc' : 'asc');
                                                } else {
                                                    setSort('created_at');
                                                    setOrder('desc');
                                                }
                                            }}
                                            className={`flex items-center gap-1 hover:text-zinc-300 transition-colors ${sort === 'created_at' ? 'text-white font-medium' : ''}`}
                                        >
                                            Date
                                            {sort === 'created_at' && (order === 'desc' ? '↓' : '↑')}
                                        </button>
                                    </div>
                                </div>

                                {links.length === 0 ? (
                                    <div className="text-center py-20 bg-zinc-900/30 border border-white/5 rounded-2xl border-dashed">
                                        <LinkIcon size={48} className="mx-auto text-zinc-700 mb-4" />
                                        <h3 className="text-lg font-medium text-zinc-400">No links yet</h3>
                                        <p className="text-zinc-600">Create your first shortened link to get started.</p>
                                    </div>
                                ) : (
                                    links.map(link => (
                                        <div key={link.id} className="group bg-zinc-900/50 hover:bg-zinc-900 border border-white/5 hover:border-white/10 rounded-xl p-5 transition-all">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                                                            /{link.slug}
                                                            <button
                                                                onClick={() => copyToClipboard(`${window.location.protocol}//${window.location.host}/${link.slug}`, link.slug)}
                                                                className="text-zinc-600 hover:text-white transition-colors"
                                                                title="Copy Link"
                                                            >
                                                                {copying === link.slug ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                                            </button>
                                                        </h3>
                                                        <span className="px-2 py-0.5 rounded-full bg-white/5 text-xs text-zinc-400 border border-white/5">
                                                            {link.clicks || 0} clicks
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-zinc-500 text-sm truncate">
                                                        <ArrowRight size={14} />
                                                        <a href={link.long_url} target="_blank" rel="noreferrer" className="hover:text-zinc-300 truncate transition-colors">
                                                            {link.long_url}
                                                        </a>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => deleteLink(link.id)}
                                                        className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-zinc-600">
                                                <span>Created {new Date(link.created_at).toLocaleDateString()}</span>
                                                <span className="font-mono text-[10px] uppercase">ID: {link.id}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    )
}

function ArrowRight({ size, className }: { size?: number, className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
        </svg>
    )
}

export default App
