import { useState, useEffect } from 'react';
import { Loader2, Save } from 'lucide-react';

export function Settings() {
    const [rootUrl, setRootUrl] = useState('');
    const [notFoundUrl, setNotFoundUrl] = useState('');
    const [shortDomain, setShortDomain] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/settings', { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setRootUrl(data.root_url);
                setNotFoundUrl(data.not_found_url);
                setShortDomain(data.short_domain);
            }
        } catch (err) {
            console.error('Failed to fetch settings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ root_url: rootUrl, not_found_url: notFoundUrl, short_domain: shortDomain }),
                credentials: 'include'
            });

            if (res.ok) {
                alert('Settings saved successfully!');
            } else {
                alert('Failed to save settings');
            }
        } catch (err) {
            alert('Error saving settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-white" /></div>;
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Redirect Configuration</h2>
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
                <form onSubmit={handleSave} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">Root URL Redirect</label>
                        <p className="text-xs text-zinc-500 mb-2">Where to redirect users when they visit the bare domain (e.g., https://short.example.com/). Leave empty for 404.</p>
                        <input
                            type="url"
                            placeholder="https://example.com"
                            className="w-full bg-black border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-zinc-700 focus:outline-none focus:border-white/30 transition-colors"
                            value={rootUrl}
                            onChange={e => setRootUrl(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">Short Link Domain</label>
                        <p className="text-xs text-zinc-500 mb-2">The public domain used for short links (e.g., https://short.example.com). If not set, the dashboard will use its own domain.</p>
                        <input
                            type="url"
                            placeholder="https://short.example.com"
                            className="w-full bg-black border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-zinc-700 focus:outline-none focus:border-white/30 transition-colors"
                            value={shortDomain}
                            onChange={e => setShortDomain(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">404 Fallback Redirect</label>
                        <p className="text-xs text-zinc-500 mb-2">Where to redirect users when they visit a non-existent short link. Leave empty for default 404 page.</p>
                        <input
                            type="url"
                            placeholder="https://example.com/404"
                            className="w-full bg-black border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-zinc-700 focus:outline-none focus:border-white/30 transition-colors"
                            value={notFoundUrl}
                            onChange={e => setNotFoundUrl(e.target.value)}
                        />
                    </div>

                    <div className="pt-4 border-t border-white/5">
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-white text-black font-bold rounded-lg px-6 py-2.5 hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            Save Configuration
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
