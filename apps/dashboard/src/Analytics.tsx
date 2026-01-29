import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Globe, Link as LinkIcon, Loader2, MousePointer2 } from 'lucide-react';

type AnalyticsData = {
    slug: string;
    long_url: string;
    stats: {
        clicks_over_time: { date: string; count: number }[];
        country_breakdown: { country: string; count: number }[];
        referrer_breakdown: { referrer: string; count: number }[];
    };
};

export function Analytics() {
    const { slug } = useParams<{ slug: string }>();
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchAnalytics();
    }, [slug]);

    const fetchAnalytics = async () => {
        try {
            const res = await fetch(`/api/analytics/${slug}`, { credentials: 'include' });
            if (res.ok) {
                const json = await res.json();
                setData(json);
            } else {
                setError('Failed to load analytics data');
            }
        } catch (err) {
            setError('Error loading analytics');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="animate-spin text-zinc-500" size={32} />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="text-center py-20">
                <p className="text-zinc-500 mb-4">{error || 'No data available'}</p>
                <Link to="/" className="text-white underline hover:no-underline">Back to Dashboard</Link>
            </div>
        );
    }

    const totalClicks = data.stats.clicks_over_time.reduce((acc, curr) => acc + curr.count, 0);

    return (
        <div className="max-w-6xl mx-auto px-6 py-12 text-white">
            <div className="mb-8">
                <Link to="/" className="text-zinc-500 hover:text-white flex items-center gap-2 mb-4 transition-colors">
                    <ArrowLeft size={16} /> Back to Dashboard
                </Link>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <span className="bg-zinc-800 p-2 rounded-lg"><LinkIcon size={24} /></span>
                    /{data.slug}
                </h1>
                <a href={data.long_url} target="_blank" rel="noreferrer" className="text-zinc-500 mt-2 block hover:text-zinc-300 truncate max-w-xl">
                    {data.long_url}
                </a>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl">
                    <h3 className="text-zinc-500 text-sm font-medium mb-1 flex items-center gap-2">
                        <MousePointer2 size={16} /> Total Clicks
                    </h3>
                    <p className="text-3xl font-bold">{totalClicks}</p>
                </div>
            </div>

            {/* Chart */}
            <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl mb-8">
                <h3 className="text-lg font-semibold mb-6">Clicks Over Time</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.stats.clicks_over_time}>
                            <defs>
                                <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#fff" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#fff" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                            <XAxis
                                dataKey="date"
                                stroke="#666"
                                tick={{ fill: '#666' }}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            />
                            <YAxis
                                stroke="#666"
                                tick={{ fill: '#666' }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#111', borderColor: '#333' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="count"
                                stroke="#fff"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorClicks)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Breakdowns */}
            <div className="grid lg:grid-cols-2 gap-8">
                {/* Countries */}
                <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2"><Globe size={18} /> Top Countries</h3>
                    <div className="space-y-4">
                        {data.stats.country_breakdown.length === 0 ? (
                            <p className="text-zinc-500 text-sm text-center py-4">No data yet</p>
                        ) : (
                            data.stats.country_breakdown.map((item, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-zinc-400 font-mono text-xs w-6">{i + 1}</span>
                                        <span>{item.country || 'Unknown'}</span>
                                    </div>
                                    <span className="font-mono text-zinc-400">{item.count}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Referrers */}
                <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl">
                    <h3 className="text-lg font-semibold mb-6">Top Referrers</h3>
                    <div className="space-y-4">
                        {data.stats.referrer_breakdown.length === 0 ? (
                            <p className="text-zinc-500 text-sm text-center py-4">No data yet</p>
                        ) : (
                            data.stats.referrer_breakdown.map((item, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="text-zinc-400 font-mono text-xs w-6 flex-shrink-0">{i + 1}</span>
                                        <span className="truncate text-sm text-zinc-300" title={item.referrer}>{item.referrer || 'Direct'}</span>
                                    </div>
                                    <span className="font-mono text-zinc-400 flex-shrink-0">{item.count}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
