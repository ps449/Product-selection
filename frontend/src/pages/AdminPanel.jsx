import { useState, useEffect } from 'react';
import { Save, Settings, Clock } from 'lucide-react';

export default function AdminPanel() {
  const [weights, setWeights] = useState(null);
  const [automation, setAutomation] = useState({
    enable_scheduler: false,
    schedule_time: '08:00',
    enable_email: false,
    smtp_email: '',
    smtp_password: '',
    target_emails: ''
  });
  const [integrations, setIntegrations] = useState({
    fb_access_token: '',
    gemini_api_key: ''
  });
  const [crawlerStatus, setCrawlerStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/v1/settings')
      .then(res => res.json())
      .then(data => {
        // convert to percentage for display
        const displayWeights = {};
        for (const [k, v] of Object.entries(data.weights)) {
          displayWeights[k] = Math.round(v * 100);
        }
        setWeights(displayWeights);
        if (data.automation) {
          setAutomation(data.automation);
        }
        if (data.integrations) {
          setIntegrations(data.integrations);
        }
        if (data.crawler_status) {
          setCrawlerStatus(data.crawler_status);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

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
    const payload = {
      weights: {},
      automation: automation,
      integrations: integrations
    };
    for (const [k, v] of Object.entries(weights)) {
      payload.weights[k] = v / 100;
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
      console.error(e);
      setMessage('錯誤: 無法連線至伺服器');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !weights) return <div className="page-container">載入中...</div>;

  const fields = [
    { key: 'google_trend', label: 'Google 趨勢權重' },
    { key: 'shopee_search', label: '電商搜尋權重 (PChome+momo)' },
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

      <div className="glass-panel" style={{ padding: '2rem', marginTop: '2rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
          API 金鑰設定 (Integrations)
        </h2>
        
        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: '1fr' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.95rem', fontWeight: 'bold' }}>Google Gemini API Key</label>
            <input 
              type="password" 
              value={integrations.gemini_api_key || ''} 
              onChange={(e) => setIntegrations({ ...integrations, gemini_api_key: e.target.value })}
              placeholder="AI Studio 申請的 Gemini API Key"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontFamily: 'monospace' }}
            />
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>用於智能辨識商品名稱、分類、與使用場景擴充建議。</p>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.95rem', fontWeight: 'bold' }}>Facebook Ads Token</label>
            <input 
              type="password" 
              value={integrations.fb_access_token || ''} 
              onChange={(e) => setIntegrations({ ...integrations, fb_access_token: e.target.value })}
              placeholder="EAAG..."
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontFamily: 'monospace' }}
            />
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>用於抓取台灣 Facebook 電商廣告市場競爭數據。</p>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', marginTop: '2rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
          <Clock /> 自動化排程與發信設定
        </h2>
        
        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: '1fr 1fr' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              <input type="checkbox" checked={automation.enable_scheduler} onChange={e => setAutomation({...automation, enable_scheduler: e.target.checked})} />
              啟用每日自動爬蟲
            </label>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>開啟後系統會在背景定時幫您收錄最新市場資訊。</p>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.95rem' }}>自動執行時間 (24小時制)</label>
            <input 
              type="time" 
              value={automation.schedule_time} 
              onChange={e => setAutomation({...automation, schedule_time: e.target.value})}
              disabled={!automation.enable_scheduler}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', opacity: automation.enable_scheduler ? 1 : 0.5 }}
            />
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '2rem 0' }} />

        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: '1fr' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
              <input type="checkbox" checked={automation.enable_email} onChange={e => setAutomation({...automation, enable_email: e.target.checked})} disabled={!automation.enable_scheduler} />
              啟用自動發信通知 (需搭配自動爬蟲開啟)
            </label>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>爬蟲完成後，將會自動寄送一封包含焦點關鍵字的精美郵件給團隊。</p>
          </div>
          
          <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: '1fr 1fr', opacity: automation.enable_email ? 1 : 0.5 }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.95rem' }}>發信專用 Gmail 信箱</label>
              <input 
                type="email" 
                placeholder="example@gmail.com"
                value={automation.smtp_email} 
                onChange={e => setAutomation({...automation, smtp_email: e.target.value})}
                disabled={!automation.enable_email}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.95rem' }}>Gmail 應用程式密碼</label>
              <input 
                type="password" 
                placeholder="16碼應用程式密碼"
                value={automation.smtp_password} 
                onChange={e => setAutomation({...automation, smtp_password: e.target.value})}
                disabled={!automation.enable_email}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.95rem' }}>收件者信箱 (多筆請用逗號分隔)</label>
              <input 
                type="text" 
                placeholder="boss@company.com, team@company.com"
                value={automation.target_emails} 
                onChange={e => setAutomation({...automation, target_emails: e.target.value})}
                disabled={!automation.enable_email}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}
              />
            </div>
          </div>
        </div>
      </div>

      {crawlerStatus && (
        <div className="glass-panel" style={{ padding: '2rem', marginTop: '2rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Clock /> 系統排程狀態
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
            <div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>前次爬蟲執行時間</div>
              <div style={{ fontWeight: '600', color: 'var(--text-main)', marginTop: '0.25rem' }}>
                {crawlerStatus.last_crawl_time !== "尚未執行" ? new Date(crawlerStatus.last_crawl_time).toLocaleString() : crawlerStatus.last_crawl_time}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>下次預定執行時間 (觸發制)</div>
              <div style={{ fontWeight: '600', color: 'var(--primary-color)', marginTop: '0.25rem' }}>
                {new Date(crawlerStatus.next_crawl_time).toLocaleString()} 之後
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
