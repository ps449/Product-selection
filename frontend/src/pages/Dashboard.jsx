import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ScatterChart, Scatter, ZAxis, LineChart, Line } from 'recharts';
import { ArrowLeft, Loader2, Target, BarChart2, TrendingUp, DollarSign, AlertCircle, Sparkles, Copy, Check } from 'lucide-react';

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { keyword, analyzeResult } = location.state || {};
  
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Marketing Feature State
  const [isMarketingLoading, setIsMarketingLoading] = useState(false);
  const [marketingResult, setMarketingResult] = useState(null);
  const [marketingError, setMarketingError] = useState('');
  const [copiedField, setCopiedField] = useState('');

  useEffect(() => {
    if (!keyword) {
      navigate('/');
      return;
    }

    // Mock API call to evaluate endpoint
    const fetchEvaluation = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/v1/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            keyword: keyword,
            product_cost: 200, // Hardcoded for demo
            social_score: 60,
            scene_score: 85
          })
        });
        const data = await res.json();
        setResult(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvaluation();
  }, [keyword, navigate]);

  const handleGenerateMarketing = async () => {
    setIsMarketingLoading(true);
    setMarketingError('');
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/generate_marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: keyword })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMarketingResult(data);
      } else {
        setMarketingError(data.detail || data.error || '生成失敗，請確認 API Key 是否設定正確。');
      }
    } catch (err) {
      setMarketingError('連線錯誤，無法生成行銷素材。');
    } finally {
      setIsMarketingLoading(false);
    }
  };

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 2000);
  };

  if (isLoading) {
    return (
      <div className="page-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 size={48} className="lucide-spin" style={{ color: 'var(--primary-color)', animation: 'spin 2s linear infinite' }} />
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>正在蒐集多方市場數據與 Google 趨勢...</p>
      </div>
    );
  }

  if (!result) return null;

  const { evaluation, is_real_data } = result;
  


  const isRejected = evaluation.position.includes('不建議');
  
  const chartData = [
    { subject: 'Google 趨勢', A: evaluation.details.google_trend, fullMark: 100 },
    { subject: '電商搜尋', A: evaluation.details.shopee_search, fullMark: 100 },
    { subject: '銷量競爭', A: evaluation.details.sales, fullMark: 100 },
    { subject: '價格競爭', A: evaluation.details.competition, fullMark: 100 },
    { subject: '社群話題', A: evaluation.details.social, fullMark: 100 },
    { subject: '場景延伸', A: evaluation.details.scene, fullMark: 100 },
  ];

  return (
    <div className="page-container">
      <button onClick={() => navigate('/')} style={{ background: 'transparent', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
        <ArrowLeft size={18} /> 返回重新辨識
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* Left Column: Score Card */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>商品名稱: {keyword}</h2>
          <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>分類: {analyzeResult?.shopee_category}</div>
          
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '6rem', fontWeight: '800', color: isRejected ? 'var(--danger-color)' : 'var(--primary-color)', lineHeight: 1 }}>
              {evaluation.total_score}
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-main)', marginTop: '0.5rem' }}>綜合推薦分數</div>
          </div>

          <div style={{ background: isRejected ? '#fef2f2' : '#f0fdf4', border: `1px solid ${isRejected ? '#fecaca' : '#bbf7d0'}`, padding: '1rem', borderRadius: '0.5rem', textAlign: 'center' }}>
            <div style={{ fontWeight: '700', fontSize: '1.1rem', color: isRejected ? 'var(--danger-color)' : 'var(--success-color)' }}>
              建議定位: {evaluation.position}
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>預估毛利率: {evaluation.profit_margin_pct}%</div>
          </div>

          {evaluation.ai_comment && (
            <div style={{ marginTop: '1.5rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--primary-color)', fontWeight: '600' }}>
                ✨ AI 智慧評語
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-color)', lineHeight: '1.6' }}>
                {evaluation.ai_comment.split('。').filter(Boolean).map((text, idx) => (
                  <p key={idx} style={{ margin: '0.25rem 0' }}>{text}。</p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Radar Chart */}
        <div className="glass-panel" style={{ padding: '2rem', minHeight: '400px' }}>
          <h3 style={{ marginBottom: '1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            各項指標分析雷達圖
            {is_real_data ? (
              <span style={{ 
                fontSize: '0.75rem', 
                padding: '0.2rem 0.5rem', 
                borderRadius: '1rem', 
                background: '#dcfce7', 
                color: '#16a34a',
                fontWeight: 'bold',
                border: '1px solid #bbf7d0'
              }}>
                已連線真實數據
              </span>
            ) : (
              <span style={{ 
                fontSize: '0.75rem', 
                padding: '0.2rem 0.5rem', 
                borderRadius: '1rem', 
                background: '#fee2e2', 
                color: '#dc2626',
                fontWeight: 'bold',
                border: '1px solid #fecaca'
              }}>
                歷史模擬數據 (連線失敗)
              </span>
            )}
          </h3>
          {!isRejected ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ flex: 1, minHeight: '280px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="商品表現" dataKey="A" stroke="var(--primary-color)" fill="var(--primary-color)" fillOpacity={0.5} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(255,255,255,0.5)', borderRadius: '0.5rem' }}>
                * 註：PChome、momo搜尋權重、熱銷程度與競價空間，目前皆
                {is_real_data ? (
                  <strong style={{ color: 'var(--primary-color)' }}>基於真實市場定價與銷量即時運算</strong>
                ) : (
                  <strong style={{ color: 'var(--danger-color)' }}>採用歷史模擬數據運算 (未連線)</strong>
                )}
                。
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--danger-color)' }}>
              毛利率未達門檻，不進行綜合指標加權計算。
            </div>
          )}
        </div>

        {/* Scene Extensions */}
        {analyzeResult?.scene_extensions && (
          <div className="glass-panel" style={{ padding: '2rem', gridColumn: '1 / -1' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Target size={20} /> 場景延伸建議 (搭配販售)
            </h3>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {analyzeResult.scene_extensions.map(item => (
                <div key={item} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '0.5rem', flex: '1 1 200px' }}>
                  <h4 style={{ fontWeight: 'bold', color: 'var(--primary-color)', marginBottom: '0.25rem' }}>{item}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>可與主商品組成情境套組提升客單價</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Marketing Toolkit */}
        {!isRejected && (
          <div className="glass-panel" style={{ padding: '2rem', gridColumn: '1 / -1', border: '2px solid #e0e7ff', background: 'linear-gradient(to right, #ffffff, #f5f3ff)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6d28d9' }}>
                  <Sparkles size={22} /> AI 情感分析與行銷素材生成
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>一鍵自動預測消費者痛點，並由 AI 為您寫好 FB 廣告文案與蝦皮商品內文。</p>
              </div>
              <button 
                className="btn-primary" 
                onClick={handleGenerateMarketing} 
                disabled={isMarketingLoading}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', border: 'none' }}
              >
                {isMarketingLoading ? <Loader2 size={18} className="spin" /> : <Sparkles size={18} />}
                {isMarketingLoading ? 'AI 腦力激盪中...' : '✨ 一鍵生成行銷素材'}
              </button>
            </div>

            {marketingError && (
              <div style={{ padding: '1rem', background: '#fee2e2', color: '#dc2626', borderRadius: '0.5rem', fontSize: '0.9rem', marginBottom: '1rem' }}>
                ⚠️ {marketingError}
              </div>
            )}

            {marketingResult && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', animation: 'fadeIn 0.5s ease-out' }}>
                
                {/* 痛點與賣點 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ background: '#fff', border: '1px solid #fecaca', borderRadius: '0.5rem', padding: '1.25rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                    <h4 style={{ color: '#dc2626', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      ⚡ 買家常見痛點 (避雷指南)
                    </h4>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.9rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {marketingResult.pain_points.map((pt, i) => <li key={i}>{pt}</li>)}
                    </ul>
                  </div>
                  <div style={{ background: '#fff', border: '1px solid #bbf7d0', borderRadius: '0.5rem', padding: '1.25rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                    <h4 style={{ color: '#16a34a', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      💡 核心熱門賣點 (高轉化)
                    </h4>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.9rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {marketingResult.selling_points.map((pt, i) => <li key={i}>{pt}</li>)}
                    </ul>
                  </div>
                </div>

                {/* 行銷文案 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ background: '#fff', border: '1px solid #bfdbfe', borderRadius: '0.5rem', padding: '1.25rem', position: 'relative', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                    <button 
                      onClick={() => handleCopy(marketingResult.fb_ad_copy, 'fb')}
                      style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', cursor: 'pointer', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}
                    >
                      {copiedField === 'fb' ? <><Check size={14}/> 已複製</> : <><Copy size={14}/> 複製</>}
                    </button>
                    <h4 style={{ color: '#2563eb', fontWeight: 'bold', marginBottom: '0.75rem' }}>📢 FB 廣告投放文案</h4>
                    <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', color: '#334155', margin: 0, lineHeight: 1.6 }}>{marketingResult.fb_ad_copy}</p>
                  </div>
                  <div style={{ background: '#fff', border: '1px solid #fed7aa', borderRadius: '0.5rem', padding: '1.25rem', position: 'relative', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                    <button 
                      onClick={() => handleCopy(marketingResult.shopee_desc, 'shopee')}
                      style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', cursor: 'pointer', color: '#f97316', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}
                    >
                      {copiedField === 'shopee' ? <><Check size={14}/> 已複製</> : <><Copy size={14}/> 複製</>}
                    </button>
                    <h4 style={{ color: '#ea580c', fontWeight: 'bold', marginBottom: '0.75rem' }}>🛍️ 蝦皮商品詳細描述</h4>
                    <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', color: '#334155', margin: 0, lineHeight: 1.6, maxHeight: '200px', overflowY: 'auto' }}>{marketingResult.shopee_desc}</p>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}
      </div>

      {/* Three Major Analyses */}
        {!isRejected && result.three_analyses && (
          <>
            {/* 1. 搜索分析 */}
            <div className="glass-panel" style={{ padding: '2rem', gridColumn: '1 / -1' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <BarChart2 size={20} color="var(--primary-color)" /> 1. 搜索分析
              </h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>透過 PChome》momo 搜尋量變化，判斷市場需求大小及變化。</p>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={result.three_analyses.search_data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip cursor={{ fill: '#f1f5f9' }} />
                    <Legend />
                    <Bar dataKey="volume" name="搜尋量" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={60} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 2. 熱銷分析 */}
            <div className="glass-panel" style={{ padding: '2rem', gridColumn: '1 / -1' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <TrendingUp size={20} color="var(--primary-color)" /> 2. 熱銷分析
              </h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>透過產品銷量與月銷量對比，判斷消費者喜好與競品強度。</p>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={result.three_analyses.sales_data} layout="vertical" margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} />
                    <Tooltip cursor={{ fill: '#f1f5f9' }} />
                    <Legend />
                    <Bar dataKey="value" name="月銷量" fill="#10b981" radius={[0, 4, 4, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              {/* TOP 5 熱銷列表 */}
              {result.three_analyses.top_sales_items && result.three_analyses.top_sales_items.length > 0 && (
                <div style={{ marginTop: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-color)' }}>🔥 熱銷商品 Top 5</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {result.three_analyses.top_sales_items.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                          <span style={{ fontWeight: 'bold', color: '#64748b', minWidth: '1.5rem' }}>#{idx + 1}</span>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '400px', fontSize: '0.9rem' }} title={item.name}>{item.name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                          <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: '600' }}>月銷 {item.sales} 件</span>
                          {item.link ? (
                            <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', padding: '0.25rem 0.75rem', background:
                              item.link.includes('pchome') ? '#e85d04' :
                              item.link.includes('momoshop') ? '#c0392b' :
                              '#ee4d2d',
                              color: 'white', borderRadius: '0.25rem', textDecoration: 'none' }}>
                              {item.link.includes('pchome') ? '前往 PChome' : item.link.includes('momoshop') ? '前往 momo' : '前往商品'}
                            </a>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 3. 競價分析 */}
            <div className="glass-panel" style={{ padding: '2rem', gridColumn: '1 / -1' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <DollarSign size={20} color="var(--primary-color)" /> 3. 競價分析
              </h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>抓出月銷量高的低價/高價點，判斷消費者可接受之價格區間。</p>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="price" type="number" name="售價 (NT$)" unit="元" />
                    <YAxis dataKey="sales" type="number" name="月銷量" />
                    <ZAxis range={[100, 300]} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="市場競品定價" data={result.three_analyses.pricing_data} fill="#ef4444" opacity={0.7} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              
              {/* TOP 5 競價列表 (最低價) */}
              {result.three_analyses.top_cheap_items && result.three_analyses.top_cheap_items.length > 0 && (
                <div style={{ marginTop: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-color)' }}>💰 最具價格競爭力 (低價) Top 5</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {result.three_analyses.top_cheap_items.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                          <span style={{ fontWeight: 'bold', color: '#64748b', minWidth: '1.5rem' }}>#{idx + 1}</span>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '400px', fontSize: '0.9rem' }} title={item.name}>{item.name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                          <span style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: '600' }}>NT$ {item.price}</span>
                          {item.link ? (
                            <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', padding: '0.25rem 0.75rem', background:
                              item.link.includes('pchome') ? '#e85d04' :
                              item.link.includes('momoshop') ? '#c0392b' :
                              '#ee4d2d',
                              color: 'white', borderRadius: '0.25rem', textDecoration: 'none' }}>
                              {item.link.includes('pchome') ? '前往 PChome' : item.link.includes('momoshop') ? '前往 momo' : '前往商品'}
                            </a>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 4. Google Trends 詳細分析 */}
            <div className="glass-panel" style={{ padding: '2rem', gridColumn: '1 / -1' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <TrendingUp size={20} color="#10b981" /> 4. Google Trends 搜尋趨勢
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', background: '#d1fae5', color: '#065f46', padding: '0.15rem 0.5rem', borderRadius: '1rem' }}>即時數據</span>
              </h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>過去 12 週台灣地區搜尋熱度走勢，反映消費者需求的真實脈動。</p>

              {/* 12-week line chart */}
              {result.three_analyses.trends_weekly && result.three_analyses.trends_weekly.length > 0 ? (
                <div style={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer>
                    <LineChart data={result.three_analyses.trends_weekly} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => [`${v}/100`, '搜尋熱度']} />
                      <Line type="monotone" dataKey="interest" stroke="#10b981" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 2rem', color: '#94a3b8', background: '#f8fafc', borderRadius: '0.5rem', border: '1px dashed #cbd5e1' }}>
                  <AlertCircle size={32} style={{ margin: '0 auto 1rem', color: '#94a3b8' }} />
                  <p style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>無法獲取真實搜尋趨勢數據</p>
                  <p style={{ fontSize: '0.85rem' }}>Google Trends API 請求受到限制 (Rate Limit)，為確保數據真實性，我們不提供模擬數據。請稍後再試。</p>
                </div>
              )}

              {/* Stats row */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                {result.three_analyses.trends_peak_week && (
                  <div style={{ flex: 1, minWidth: '150px', background: '#f0fdf4', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #bbf7d0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>搜尋高峰</div>
                    <div style={{ fontWeight: '700', color: '#065f46', marginTop: '0.25rem' }}>{result.three_analyses.trends_peak_week}</div>
                  </div>
                )}
                {result.three_analyses.trends_current_vs_peak > 0 && (
                  <div style={{ flex: 1, minWidth: '150px', background: '#f0fdf4', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #bbf7d0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>當前 vs 高峰</div>
                    <div style={{ fontWeight: '700', color: '#065f46', marginTop: '0.25rem' }}>{result.three_analyses.trends_current_vs_peak}%</div>
                  </div>
                )}
              </div>

              {/* Related queries + Regional */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
                {/* Related keywords */}
                {result.three_analyses.trends_related && result.three_analyses.trends_related.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.75rem' }}>🔍 相關搜尋關鍵字</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {result.three_analyses.trends_related.slice(0, 8).map((q, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.75rem', background: q.type === 'rising' ? '#fef3c7' : '#f8fafc', borderRadius: '0.4rem', border: '1px solid #e2e8f0' }}>
                          <span style={{ fontSize: '0.85rem' }}>{q.query}</span>
                          <span style={{ fontSize: '0.75rem', color: q.type === 'rising' ? '#d97706' : '#64748b', fontWeight: '600' }}>
                            {q.type === 'rising' ? '🚀 上升' : `${q.value}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Regional interest */}
                {result.three_analyses.trends_regional && result.three_analyses.trends_regional.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.75rem' }}>📍 台灣地區熱度分佈</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {result.three_analyses.trends_regional.map((r, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.75rem', background: '#f8fafc', borderRadius: '0.4rem', border: '1px solid #e2e8f0' }}>
                          <span style={{ fontSize: '0.85rem' }}>{r.city}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: `${r.interest}px`, maxWidth: '80px', height: '6px', background: '#10b981', borderRadius: '3px' }} />
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{r.interest}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 5. Facebook Ads Library 廣告競爭分析 */}
            <div className="glass-panel" style={{ padding: '2rem', gridColumn: '1 / -1' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.1rem' }}>📣</span> 5. Facebook 廣告市場競爭
                {result.three_analyses.fb_status === 'active' ? (
                  <span style={{ marginLeft: 'auto', fontSize: '0.75rem', background: '#dbeafe', color: '#1e40af', padding: '0.15rem 0.5rem', borderRadius: '1rem' }}>FB Ads Library</span>
                ) : (
                  <span style={{ marginLeft: 'auto', fontSize: '0.75rem', background: '#fef3c7', color: '#92400e', padding: '0.15rem 0.5rem', borderRadius: '1rem' }}>待授權</span>
                )}
              </h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>分析台灣 Facebook 廣告主投放此關鍵字的廣告數量，評估電商廣告競爭強度。</p>

              {result.three_analyses.fb_status !== 'active' ? (
                <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: '0.75rem', padding: '1.25rem' }}>
                  <p style={{ fontWeight: '600', color: '#713f12', marginBottom: '0.5rem' }}>⚠️ 需設定 Token 或申請 ads_library 授權</p>
                  <p style={{ fontSize: '0.85rem', color: '#713f12', marginBottom: '0.75rem' }}>您的 Facebook App 尚未開通廣告資料庫 API 存取權，或是您尚未於後台設定 Access Token。</p>
                  <a href="https://www.facebook.com/ads/library/api" target="_blank" rel="noopener noreferrer"
                    style={{ display: 'inline-block', padding: '0.5rem 1.25rem', background: '#1877f2', color: 'white', borderRadius: '0.4rem', textDecoration: 'none', fontWeight: '600', fontSize: '0.9rem' }}>
                    前往申請 → facebook.com/ads/library/api
                  </a>
                  <p style={{ fontSize: '0.8rem', color: '#92400e', marginTop: '0.75rem' }}>申請並於設定頁面儲存 Token 後，重新整理即可看到廣告數據。</p>
                </div>
              ) : result.three_analyses.fb_ad_count > 0 ? (
                <div>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                    <div style={{ flex: 1, minWidth: '130px', background: '#eff6ff', padding: '1rem', borderRadius: '0.5rem', textAlign: 'center', border: '1px solid #bfdbfe' }}>
                      <div style={{ fontSize: '2rem', fontWeight: '800', color: '#1d4ed8' }}>{result.three_analyses.fb_ad_count}</div>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>現有廣告數量</div>
                    </div>
                    <div style={{ flex: 1, minWidth: '130px', background: '#f0fdf4', padding: '1rem', borderRadius: '0.5rem', textAlign: 'center', border: '1px solid #bbf7d0' }}>
                      <div style={{ fontSize: '2rem', fontWeight: '800', color: '#15803d' }}>{result.three_analyses.fb_advertiser_count}</div>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>廣告主數量</div>
                    </div>
                    <div style={{ flex: 1, minWidth: '130px', background: '#fef3c7', padding: '1rem', borderRadius: '0.5rem', textAlign: 'center', border: '1px solid #fde68a' }}>
                      <div style={{ fontSize: '2rem', fontWeight: '800', color: '#b45309' }}>{result.three_analyses.fb_competition_score}</div>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>廣告競爭指數 /100</div>
                    </div>
                  </div>
                  {result.three_analyses.fb_top_advertisers && result.three_analyses.fb_top_advertisers.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem' }}>🏆 主要廣告主 (Top 5)</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {result.three_analyses.fb_top_advertisers.map((adv, i) => (
                          <span key={i} style={{ padding: '0.3rem 0.75rem', background: '#dbeafe', borderRadius: '1rem', fontSize: '0.85rem', color: '#1e40af' }}>
                            {adv.name} ({adv.ad_count}則)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  <p>此關鍵字目前在台灣 Facebook 無主動廣告投放，市場競爭度低 🟢</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
