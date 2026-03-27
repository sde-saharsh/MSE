import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, AlertCircle, CheckCircle2, PlayCircle, Lock } from 'lucide-react';
import api from './api';

type Order = {
    _id: string;
    productName: string;
    quantity: number;
    workStation: string;
    status: 'Planned' | 'In Progress' | 'On Hold' | 'Completed';
    priority: 'Low' | 'Medium' | 'High';
    assignedTo?: string;
    startTime?: string;
    endTime?: string;
};

const COLUMNS = ['Planned', 'In Progress', 'On Hold', 'Completed'];
const VALID_TRANSITIONS: Record<string, string[]> = {
    'Planned': ['In Progress'],
    'In Progress': ['On Hold', 'Completed'],
    'On Hold': ['In Progress'],
    'Completed': []
};

export default function KanbanBoard() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newOrder, setNewOrder] = useState({ productName: '', quantity: '', workStation: '', priority: 'Medium' });

    const role = localStorage.getItem('role');
    const isSupervisor = role === 'supervisor';

    const fetchOrders = async () => {
        try {
            const { data } = await api.get('/orders');
            setOrders(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleStatusChange = async (id: string, currentStatus: string, newStatus: string) => {
        if (!VALID_TRANSITIONS[currentStatus]?.includes(newStatus)) return;

        // Optimistic UI update
        setOrders(prev => prev.map(o => o._id === id ? { ...o, status: newStatus as any } : o));

        try {
            await api.patch(`/orders/${id}/status`, { status: newStatus });
            fetchOrders(); // Sync with backend timestamps
        } catch (err) {
            // Revert if fail
            fetchOrders();
            alert('Failed to update status');
        }
    };

    const handleCreateOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isSupervisor) return;
        try {
            await api.post('/orders', newOrder);
            setShowCreateModal(false);
            fetchOrders();
        } catch (err) {
            alert('Failed to create order');
        }
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-muted)' }}>Loading Nexus Board...</div>;

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 32px 0 32px' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem' }}>Production Floor</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Manage and track manufacturing orders.</p>
                </div>

                {isSupervisor && (
                    <button className="btn" onClick={() => setShowCreateModal(true)}>
                        <Plus size={18} /> New Order
                    </button>
                )}
            </div>

            <div className="kanban-container">
                {COLUMNS.map(column => (
                    <div key={column} className="kanban-column">
                        <div className={`column-header col-header-${column.replace(' ', '').toLowerCase()}`}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{column}</h3>
                            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>
                                {orders.filter(o => o.status === column).length}
                            </div>
                        </div>

                        <AnimatePresence>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {orders.filter(o => o.status === column).map(order => (
                                    <motion.div
                                        key={order._id}
                                        layoutId={order._id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className={`kanban-card card-${column.replace(' ', '').toLowerCase()}`}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span className={`badge badge-${order.priority.toLowerCase()}`}>{order.priority}</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.workStation}</span>
                                        </div>

                                        <h4 className="card-title">{order.productName}</h4>

                                        <div className="card-details">
                                            <span>QTY: {order.quantity}</span>
                                            {order.assignedTo && <span>Assignee: {order.assignedTo}</span>}
                                            {order.startTime && <span>Started: {new Date(order.startTime).toLocaleTimeString()}</span>}
                                        </div>

                                        <div className="card-actions">
                                            {VALID_TRANSITIONS[order.status]?.map(nextStatus => (
                                                <button
                                                    key={nextStatus}
                                                    className="btn-secondary"
                                                    style={{
                                                        padding: '6px 12px',
                                                        fontSize: '0.8rem',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        color: 'var(--text-main)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}
                                                    onClick={() => handleStatusChange(order._id, order.status, nextStatus)}
                                                >
                                                    {nextStatus === 'In Progress' && <PlayCircle size={14} color="var(--status-inprogress-border)" />}
                                                    {nextStatus === 'On Hold' && <AlertCircle size={14} color="var(--status-onhold-border)" />}
                                                    {nextStatus === 'Completed' && <CheckCircle2 size={14} color="var(--status-completed-border)" />}
                                                    Move to {nextStatus}
                                                </button>
                                            ))}
                                            {order.status === 'Completed' && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--status-completed-border)' }}>
                                                    <Lock size={14} /> Finalized
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </AnimatePresence>
                    </div>
                ))}
            </div>

            {showCreateModal && isSupervisor && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel" style={{ padding: '32px', width: '100%', maxWidth: '500px' }}>
                        <h2 style={{ marginBottom: '24px' }}>Create New Order</h2>
                        <form onSubmit={handleCreateOrder} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label>Product Name</label>
                                <input required value={newOrder.productName} onChange={e => setNewOrder({ ...newOrder, productName: e.target.value })} />
                            </div>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ flex: 1 }}>
                                    <label>Quantity</label>
                                    <input type="number" required value={newOrder.quantity} onChange={e => setNewOrder({ ...newOrder, quantity: e.target.value })} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label>Priority</label>
                                    <select value={newOrder.priority} onChange={e => setNewOrder({ ...newOrder, priority: e.target.value })}>
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label>Work Station</label>
                                <input required value={newOrder.workStation} onChange={e => setNewOrder({ ...newOrder, workStation: e.target.value })} placeholder="e.g. Welding, Assembly" />
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                <button type="submit" className="btn" style={{ flex: 1 }}>Create Order</button>
                                <button type="button" className="btn-secondary" style={{ padding: '10px 20px', borderRadius: '8px' }} onClick={() => setShowCreateModal(false)}>Cancel</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </>
    );
}
