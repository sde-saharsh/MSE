import type { ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Activity, LayoutDashboard, BarChart3, LogOut } from 'lucide-react';
import Login from './Login';
import KanbanBoard from './KanbanBoard';
import AnalyticsDashboard from './AnalyticsDashboard';

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
};

const Layout = ({ children }: { children: ReactNode }) => {
  const username = localStorage.getItem('username');
  const role = localStorage.getItem('role');
  const location = useLocation();

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <div>
      <nav className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'var(--primary)', padding: '8px', borderRadius: '8px' }}>
            <Activity color="white" size={20} />
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>Nexus Flow</span>
        </div>

        <div className="nav-links">
          <Link to="/" className={`nav-link flex items-center gap-2 ${location.pathname === '/' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <LayoutDashboard size={18} /> Board
          </Link>
          <Link to="/analytics" className={`nav-link flex items-center gap-2 ${location.pathname === '/analytics' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <BarChart3 size={18} /> Analytics
          </Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{username}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--primary)', textTransform: 'capitalize' }}>{role}</div>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '8px 12px' }}>
            <LogOut size={16} />
          </button>
        </div>
      </nav>
      <main>
        {children}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><KanbanBoard /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><AnalyticsDashboard /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}
