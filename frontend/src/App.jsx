import { Routes, Route, Link, useLocation } from 'react-router-dom';
import InputPage from './pages/InputPage';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import DiscoveryPage from './pages/DiscoveryPage';
import './App.css';

function App() {
  const location = useLocation();

  return (
    <div className="app-container">
      <header className="app-header">
        <Link to="/" className="logo-text">Shopee AutoSelect</Link>
        <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link to="/" style={{ color: location.pathname === '/' ? 'var(--primary-color)' : 'var(--text-muted)', fontWeight: '500' }}>選品大廳</Link>
          <Link to="/admin">
            <button className="btn-primary" style={{ background: location.pathname === '/admin' ? 'var(--primary-color)' : 'var(--text-muted)' }}>主管後台</button>
          </Link>
        </nav>
      </header>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<DiscoveryPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
