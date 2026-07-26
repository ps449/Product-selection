import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Search, TrendingUp, AlertTriangle, Database, Box } from 'lucide-react';

export default function DiscoveryPage() {
  const [data, setData] = useState({ columns: [], items: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('social');
  const navigate = useNavigate();

  const tabs = [
    { id: 'social', label: '社群話題選品', icon: <TrendingUp size={16} /> },
    { id: 'crowdfunding', label: '募資趨勢選品', icon: <Compass size={16} /> },
    { id: 'disadvantage', label: '產品劣勢選品', icon: <AlertTriangle size={16} /> },
    { id: 'platform', label: 'Google 趨勢選品', icon: <Database size={16} /> },
    { id: 'fixed', label: '固定需求選品', icon: <Box size={16} /> }
  ];

  useEffect(() => {
    setIsLoading(true);
    fetch(`http://127.0.0.1:8000/api/v1/discovery?category=${activeTab}`)
      .then(res => res.json())
      .then(result => {
        setData(result);
        setIsLoading(false);
      });
  }, [activeTab]);

  const handleAnalyze = (productName) => {
    navigate('/', { state: { autoFill: productName } });
  };

  return (
    <div className="page-container" style={{ maxWidth: '1000px' }}>
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--text-main)' }}>
          <Compass color="var(--primary-color)" /> 五大選品靈感庫
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          選品的本質在於洞察「消費者需求」及「需求變動」。在此探索不同切入點的高潛力商品。
        </p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', overflowX: 'auto' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem',
                border: 'none', borderRadius: '0.5rem',
                background: activeTab === tab.id ? 'var(--primary-color)' : 'transparent',
                color: activeTab === tab.id ? 'white' : 'var(--text-muted)',
                fontWeight: activeTab === tab.id ? '600' : '400',
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background 0.2s'
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Table */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>資料載入中...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
              <thead>
                <tr style={{ background: 'var(--bg-base)', borderBottom: '2px solid var(--border-color)' }}>
                  {data.columns.map((col, i) => (
                    <th key={i} style={{ padding: '1rem', color: 'var(--text-main)' }}>{col}</th>
                  ))}
                  <th style={{ padding: '1rem', color: 'var(--text-main)' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem', fontWeight: 'bold', color: index < 3 ? 'var(--danger-color)' : 'var(--text-muted)' }}>{item.rank}</td>
                    <td style={{ padding: '1rem', color: 'var(--primary-color)', fontWeight: '600' }}>{item.product_name}</td>
                    <td style={{ padding: '1rem' }}>{item.col3}</td>
                    <td style={{ padding: '1rem' }}>{item.col4}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ color: item.col5?.startsWith('+') ? 'var(--danger-color)' : 'inherit' }}>
                        {item.col5}
                      </span>
                    </td>
                    {data.columns.length > 5 && (
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '1rem',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          backgroundColor: item.col6 === '話題爆款' ? '#fee2e2' : item.col6 === '趨勢需求' ? '#dcfce7' : '#f3e8ff',
                          color: item.col6 === '話題爆款' ? '#dc2626' : item.col6 === '趨勢需求' ? '#16a34a' : '#9333ea'
                        }}>
                          {item.col6}
                        </span>
                      </td>
                    )}
                    <td style={{ padding: '1rem' }}>
                      <button 
                        className="btn-primary" 
                        onClick={() => handleAnalyze(item.product_name)}
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem', margin: '0 auto' }}
                      >
                        <Search size={14} /> 分析
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
