import { useState, useEffect } from 'react';
import { Save, AlertCircle, Settings } from 'lucide-react';

export default function AdminPanel() {
  const [weights, setWeights] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    // Validate sum is 100
    const sum = Object.values(weights).reduce((a, b) => a + Number(b), 0);
    if (sum !== 100) {
      setMessage('權重總和必須為 100%');
      return;
    }

    setIsSaving(true);
    setMessage('');
    
    // convert back to decimal
    const payload = {};
    for (const [k, v] of Object.entries(weights)) {
      payload[k] = v / 100;
    }

    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setMessage('設定已成功儲存！');
      } else {
        const err = await res.json();
        setMessage('錯誤: ' + err.detail);
      }
    } catch (e) {
  if (isLoading || !weights) return <div className="page-container">載入中...</div>;

  const fields = [
    { key: 'google_trend', label: 'Google 趨勢權重' },
    { key: 'shopee_search', label: '蝦皮搜尋權重' },
    { key: 'sales', label: '銷量競爭權重' },
    { key: 'competition', label: '價格競爭權重' },
    { key: 'social', label: '社群話題權重' },
    { key: 'scene', label: '場景延伸權重' },
  ];

  const total = Object.values(weights).reduce((a, b) => a + Number(b), 0);

  return (
    <div className="page-container" style={{ maxWidth: '800px' }}>
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
          <Settings /> 主管選品權重設定後台
        </h2>

        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: '1fr 1fr' }}>
          {fields.map(f => (
            <div key={f.key}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.95rem' }}>{f.label} (%)</label>
              <input 
                type="number" 
                value={weights[f.key]} 
                onChange={(e) => setWeights({ ...weights, [f.key]: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}
              />
            </div>
          ))}
        </div>

        <div style={{ marginTop: '2rem', padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>目前總和:</strong> <span style={{ color: total === 100 ? 'var(--success-color)' : 'var(--danger-color)', fontWeight: 'bold' }}>{total}%</span>
          </div>
          <button className="btn-primary" onClick={handleSave} disabled={isSaving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Save size={18} /> 儲存設定
          </button>
        </div>
        
        {message && (
          <div style={{ marginTop: '1rem', color: total === 100 && message.includes('成功') ? 'var(--success-color)' : 'var(--danger-color)' }}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
