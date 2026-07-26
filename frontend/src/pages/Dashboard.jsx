import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ScatterChart, Scatter, ZAxis } from 'recharts';
import { ArrowLeft, Loader2, Target, BarChart2, TrendingUp, DollarSign, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { keyword, analyzeResult } = location.state || {};
  
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEvaluation();
  }, [keyword, navigate]);

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
                  <div style={{ fontWeight: '600', color: 'var(--primary-color)' }}>{item}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>可與主商品組成情境套組提升客單價</div>
                </div>
              ))}
            </div>
          </div>
        )}

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
          </>
        )}
      </div>
    </div>
  );
}
