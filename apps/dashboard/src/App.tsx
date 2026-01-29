import { useState, useEffect } from 'react'
import { Link as LinkIcon, Loader2, LogOut, Settings as SettingsIcon, LayoutDashboard } from 'lucide-react'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Login } from './Login'
import { Settings } from './Settings'
import { Dashboard } from './Dashboard'
import { Analytics } from './Analytics'

function App() {
    return (
        <BrowserRouter>
            <AppContent />
        </BrowserRouter>
    );
}

function AppContent() {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [shortDomain, setShortDomain] = useState<string>('');
    const location = useLocation();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const res = await fetch('/api/auth/check', { credentials: 'include' });
            const data = await res.json();
            if (data.authenticated) {
                setIsAuthenticated(true);
                fetchSettings();
            } else {
                console.log('Auth check failed:', data);
                setIsAuthenticated(false);
            }
        } catch {
            setIsAuthenticated(false);
        }
    };

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/settings', { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                if (data.short_domain) setShortDomain(data.short_domain);
            }
        } catch (err) {
            console.error('Failed to fetch settings', err);
        }
    };

    const handleLogout = async () => {
        await fetch('/api/logout', { method: 'POST', credentials: 'include' });
        setIsAuthenticated(false);
        window.location.href = '/'; // Force reload/redirect
    };

    if (isAuthenticated === null) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="animate-spin text-white" size={32} />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Login onLogin={() => { setIsAuthenticated(true); fetchSettings(); }} />;
    }

    return (
        <div className="min-h-screen bg-black text-white selection:bg-white/20">
            <nav className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                                <LinkIcon size={18} />
                            </div>
                            <span className="font-bold text-lg tracking-tight">Cloudshort</span>
                        </Link>

                        <div className="h-6 w-px bg-white/10 mx-2"></div>

                        <div className="flex bg-white/5 rounded-lg p-1">
                            <Link
                                to="/"
                                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${location.pathname === '/' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
                            >
                                <div className="flex items-center gap-2"><LayoutDashboard size={14} /> Dashboard</div>
                            </Link>
                            <Link
                                to="/settings"
                                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${location.pathname === '/settings' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
                            >
                                <div className="flex items-center gap-2"><SettingsIcon size={14} /> Settings</div>
                            </Link>
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

            <main>
                <Routes>
                    <Route path="/" element={<Dashboard shortDomain={shortDomain} />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/analytics/:slug" element={<Analytics />} />
                </Routes>
            </main>
        </div>
    )
}

export default App
