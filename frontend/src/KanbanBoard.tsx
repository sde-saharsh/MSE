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
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '4px' }}>Production Board</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Track manufacturing orders in real-time.</p>
                </div>

                {isSupervisor && (
                    <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                        <Plus size={16} /> New Order
                    </button>
                )}
            </div>

            <div className="kanban-container">
                {COLUMNS.map(column => {
                    const columnClass = column.replace(' ', '').toLowerCase();
                    return (
                        <div key={column} className="kanban-column">
                            <div className="column-header">
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <span className={`status-dot dot-${columnClass}`} />
                                    <h3>{column}</h3>
                                </div>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500 }}>
                                    {orders.filter(o => o.status === column).length}
                                </span>
                            </div>

                            <div className="kanban-scroll">
                                <AnimatePresence>
                                    {orders.filter(o => o.status === column).map(order => (
                                        <motion.div
                                            key={order._id}
                                            layoutId={order._id}
                                            initial={{ opacity: 0, scale: 0.98 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.98 }}
                                            className="kanban-card"
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <span className={`badge badge-${order.priority.toLowerCase()}`}>
                                                    {order.priority}
                                                </span>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{order.workStation}</span>
                                            </div>

                                            <h4 className="card-title">{order.productName}</h4>

                                            <div className="card-details">
                                                <span>QTY: {order.quantity}</span>
                                                {order.assignedTo && <span>Assignee: {order.assignedTo}</span>}
                                                {order.startTime && <span>Started: {new Date(order.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                                            </div>

                                            <div className="card-actions">
                                                {VALID_TRANSITIONS[order.status]?.map(nextStatus => (
                                                    <button
                                                        key={nextStatus}
                                                        className="btn"
                                                        style={{ padding: '6px 10px', fontSize: '0.75rem', flex: 1 }}
                                                        onClick={() => handleStatusChange(order._id, order.status, nextStatus)}
                                                    >
                                                        {nextStatus === 'In Progress' && <PlayCircle size={12} style={{ color: 'var(--status-inprogress-text)' }} />}
                                                        {nextStatus === 'On Hold' && <AlertCircle size={12} style={{ color: 'var(--status-onhold-text)' }} />}
                                                        {nextStatus === 'Completed' && <CheckCircle2 size={12} style={{ color: 'var(--status-completed-text)' }} />}
                                                        {nextStatus}
                                                    </button>
                                                ))}
                                                {order.status === 'Completed' && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--status-completed-text)', fontWeight: 500 }}>
                                                        <Lock size={12} /> Finalized
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    );
                })}
            </div>

            {showCreateModal && isSupervisor && (
                <div className="modal-backdrop">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="modal">
                        <h2 style={{ marginBottom: '24px', fontSize: '1.25rem' }}>Create Order</h2>
                        <form onSubmit={handleCreateOrder} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Product Name</label>
                                <input required value={newOrder.productName} onChange={e => setNewOrder({ ...newOrder, productName: e.target.value })} placeholder="e.g. Widget A" />
                            </div>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Quantity</label>
                                    <input type="number" required value={newOrder.quantity} onChange={e => setNewOrder({ ...newOrder, quantity: e.target.value })} placeholder="0" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Priority</label>
                                    <select value={newOrder.priority} onChange={e => setNewOrder({ ...newOrder, priority: e.target.value })}>
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Work Station</label>
                                <input required value={newOrder.workStation} onChange={e => setNewOrder({ ...newOrder, workStation: e.target.value })} placeholder="e.g. Welding, Assembly" />
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                                <button type="button" className="btn" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create Order</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </>
    );
}
