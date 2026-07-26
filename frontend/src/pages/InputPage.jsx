import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Upload, Search, CheckCircle, AlertCircle } from 'lucide-react';

export default function InputPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [textInput, setTextInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (location.state?.autoFill) {
      setTextInput(location.state.autoFill);
      // Optional: you could also auto trigger handleAnalyze here if desired
    }
  }, [location.state]);

  const handleAnalyze = async () => {
    if (!textInput) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text_input: textInput })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || '分析失敗');
      }
      
      setAiResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    // 進入評分流程
    navigate('/dashboard', { state: { analyzeResult: aiResult, keyword: aiResult.product_name } });
  };

  return (
    <div className="page-container">
      <section className="hero-section glass-panel">
        <h1 className="hero-title">商品選品自動化分析</h1>
        <p className="hero-subtitle">
          輸入商品名稱，系統將自動比對蝦皮搜尋量、競品銷量與 Google 趨勢。
        </p>
        
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', maxWidth: '600px', margin: '0 auto' }}>
          <input 
            type="text" 
            placeholder="請輸入商品名稱 (例如: 雨衣、滑雪機)..." 
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}
          />
          <button className="btn-primary" onClick={handleAnalyze} disabled={isLoading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isLoading ? '分析中...' : <><Search size={18} /> 智慧辨識</>}
          </button>
        </div>

        {error && (
          <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#fef2f2', color: 'var(--danger-color)', borderRadius: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={20} /> {error}
          </div>
        )}

        {aiResult && !error && (
          <div style={{ marginTop: '3rem', textAlign: 'left', background: 'white', padding: '2rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', maxWidth: '600px', margin: '3rem auto 0' }}>
            {aiResult.needs_disambiguation ? (
              <>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--warning-color)' }}>
                  <AlertCircle size={24} /> 辨識信心不足，請選擇最符合的建議分類
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {aiResult.suggestions.map((sug, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => setAiResult({ ...sug, needs_disambiguation: false, confidence: 1.0 })}
                      style={{ textAlign: 'left', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', background: 'var(--bg-base)', cursor: 'pointer', transition: 'background-color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-base)'}
                    >
                      <div style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>{sug.product_name}</div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>分類: {sug.shopee_category}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>關鍵字: {sug.keywords.join(', ')}</div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--primary-color)' }}>
                  <CheckCircle size={24} /> AI 辨識結果確認
                </h3>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>正規化商品名稱</label>
                  <input type="text" defaultValue={aiResult.product_name} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)' }} />
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>對應蝦皮類目 (第二層)</label>
                  <input type="text" defaultValue={aiResult.shopee_category} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)' }} />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>擴充關鍵字 (供爬蟲使用)</label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {aiResult.keywords.map(kw => (
                      <span key={kw} style={{ background: 'var(--bg-base)', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.85rem' }}>{kw}</span>
                    ))}
                  </div>
                </div>

                <button className="btn-primary" onClick={handleConfirm} style={{ width: '100%' }}>
                  確認無誤，開始收集市場數據
                </button>
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
