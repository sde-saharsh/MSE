import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Clock, Zap, Target } from 'lucide-react';
import api from './api';

type AnalyticsData = {
    totalOrders: number;
    statusCounts: { 'Planned': number, 'In Progress': number, 'On Hold': number, 'Completed': number };
    avgCycleTimeHours: number;
    bottleneck: string;
    throughputToday: number;
};

export default function AnalyticsDashboard() {
    const [data, setData] = useState<AnalyticsData | null>(null);

    useEffect(() => {
        api.get('/analytics').then(res => setData(res.data)).catch(console.error);
    }, []);

    if (!data) return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }}>Loading Insights...</div>;

    const maxStatusCount = Math.max(...Object.values(data.statusCounts), 1); // prevent div by zero

    const kpiCards = [
        { title: 'Total Orders', value: data.totalOrders, icon: <Target size={24} color="#6366f1" />, bg: 'rgba(99, 102, 241, 0.1)' },
        { title: 'Throughput Today', value: data.throughputToday, icon: <Zap size={24} color="#10b981" />, bg: 'rgba(16, 185, 129, 0.1)' },
        { title: 'Avg Cycle Time (hrs)', value: data.avgCycleTimeHours, icon: <Clock size={24} color="#f59e0b" />, bg: 'rgba(245, 158, 11, 0.1)' },
        { title: 'Current Bottleneck', value: data.bottleneck, icon: <BarChart3 size={24} color="#ef4444" />, bg: 'rgba(239, 68, 68, 0.1)' },
    ];

    return (
        <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '1.75rem' }}>Factory Performance</h2>
                <p style={{ color: 'var(--text-muted)' }}>Real-time production metrics and bottleneck analysis.</p>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                {kpiCards.map((kpi, idx) => (
                    <motion.div
                        key={kpi.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="card"
                        style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}
                    >
                        <div style={{ background: kpi.bg, padding: '16px', borderRadius: '16px' }}>
                            {kpi.icon}
                        </div>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 500 }}>{kpi.title}</div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 600 }}>{kpi.value}</div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="card" style={{ padding: '32px' }}>
                <h3 style={{ marginBottom: '24px', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart3 size={20} color="var(--primary)" />
                    Order Distribution by Status
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {Object.entries(data.statusCounts).map(([status, count]) => {
                        const percentage = (count / maxStatusCount) * 100;

                        let textColor = 'var(--status-planned-text)';
                        if (status === 'In Progress') { textColor = 'var(--status-inprogress-text)'; }
                        if (status === 'On Hold') { textColor = 'var(--status-onhold-text)'; }
                        if (status === 'Completed') { textColor = 'var(--status-completed-text)'; }

                        return (
                            <div key={status}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.875rem' }}>
                                    <span style={{ fontWeight: 500 }}>{status}</span>
                                    <span style={{ color: 'var(--text-muted)' }}>{count} Orders</span>
                                </div>
                                <div style={{ background: 'var(--bg-button)', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percentage}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        style={{ background: textColor, height: '100%', borderRadius: '5px' }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
