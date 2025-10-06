import React, { useEffect, useMemo, useState } from 'react';
import './AdminTraffic.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

function formatTime(ts) {
  const date = new Date(ts);
  const now = new Date();
  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatFullTime(ts) {
  return new Date(ts).toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short'
  });
}

// Small source logos (same style as AdminTraffic)
const logos = {
  instagram: (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <defs>
        <linearGradient id="ig-small-sessions" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f58529"/>
          <stop offset="50%" stopColor="#dd2a7b"/>
          <stop offset="100%" stopColor="#8134af"/>
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#ig-small-sessions)"/>
      <circle cx="12" cy="12" r="4.5" fill="none" stroke="#fff" strokeWidth="2"/>
      <circle cx="17" cy="7" r="1.3" fill="#fff"/>
    </svg>
  ),
  youtube: (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <rect x="2" y="6" width="20" height="12" rx="3" fill="#ff0000"/>
      <polygon points="10,9 16,12 10,15" fill="#ffffff"/>
    </svg>
  ),
  google: (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  ),
  other: (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="10" fill="#666"/>
      <path d="M2 12h20M12 2v20" stroke="#fff" strokeWidth="1.5" opacity="0.6"/>
      <circle cx="12" cy="12" r="5" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.9"/>
    </svg>
  )
};

export default function AdminSessions() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessions, setSessions] = useState([]);
  const [page, setPage] = useState(0);

  const [filterSource, setFilterSource] = useState('');
  const [filterUserId, setFilterUserId] = useState('');
  const [filterVisitorId, setFilterVisitorId] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(true);

  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [events, setEvents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  async function loadSessions(nextPage = 0) {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterSource) params.set('source', filterSource);
      if (filterUserId) params.set('user_id', filterUserId);
      if (filterVisitorId) params.set('visitor_id', filterVisitorId);
      params.set('limit', '50');
      params.set('offset', String(nextPage * 50));
      const res = await fetch(`${API_BASE}/api/admin/sessions?${params.toString()}`, { credentials: 'include' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load sessions');
      setSessions(Array.isArray(json.sessions) ? json.sessions : []);
      setPage(nextPage);
      setError('');
    } catch (e) {
      setError(e.message || 'Failed to load sessions');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }

  async function openSession(id) {
    try {
      setSelectedId(id);
      setModalOpen(true);
      setDetail(null);
      setEvents([]);
      const [res1, res2] = await Promise.all([
        fetch(`${API_BASE}/api/admin/sessions/${id}`, { credentials: 'include' }),
        fetch(`${API_BASE}/api/admin/sessions/${id}/events`, { credentials: 'include' })
      ]);
      const json1 = await res1.json();
      const json2 = await res2.json();
      if (!res1.ok) throw new Error(json1.error || 'Failed to load session');
      if (!res2.ok) throw new Error(json2.error || 'Failed to load events');
      setDetail(json1.session || null);
      setEvents(Array.isArray(json2.events) ? json2.events : []);
    } catch (e) {
      setError(e.message || 'Failed to load session');
    }
  }

  useEffect(() => { loadSessions(0); /* eslint-disable-line */ }, []);
  useEffect(() => { loadSessions(0); /* eslint-disable-line */ }, [filterSource]);

  if (loading) return <div style={{ padding: 16 }}>Loading sessions…</div>;
  if (error) return <div style={{ padding: 16, color: '#b91c1c' }}>Error: {error}</div>;

  const isEnded = (s) => (s.ended_at || (Date.now() - new Date(s.last_seen_at).getTime() > 30*60*1000));

  return (
    <div className="admin-traffic">
      <div className="traffic-toolbar">
        <div className="toolbar-top">
          <div className="title">Sessions</div>
        </div>
      </div>

      <div className="traffic-table-wrap" style={{ display: 'grid', gridTemplateColumns: filtersOpen ? '1fr 300px' : '1fr', gap: 12, alignItems: 'start', marginTop: 16 }}>
        <div className="table-card" style={{ background: 'transparent', border: 'none' }}>
          <div style={{ padding: 16 }}>
            {/* Cards grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
              {sessions.map((s) => (
                <button
                  key={s.session_id}
                  onClick={() => openSession(s.session_id)}
                  style={{
                    position: 'relative',
                    textAlign: 'left',
                    background: '#ffffff',
                    border: '2px solid #e1e5e9',
                    borderBottom: '3px solid var(--accent)',
                    borderRadius: 14,
                    padding: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.borderColor = 'var(--accent)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = '#e1e5e9';
                  }}
                >
                  {/* Colored left accent strip */}
                  <div style={{ 
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 4,
                    background: `linear-gradient(180deg, var(--accent) 0%, var(--accent-dark) 100%)`
                  }} />

                  {/* Card content - single row layout */}
                  <div style={{ padding: '14px 16px 14px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    {/* Left: Logo and first source */}
                    <div style={{ 
                      width: 52, 
                      height: 52,
                      minWidth: 52,
                      borderRadius: 12, 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#f8f9fa',
                      border: '2px solid #e5e7eb',
                      position: 'relative'
                    }}>
                      {logos[(s.first_source || 'other')] || logos.other}
                      <div style={{
                        position: 'absolute',
                        bottom: -6,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#111',
                        color: '#fff',
                        fontSize: 9,
                        fontWeight: 600,
                        padding: '2px 6px',
                        borderRadius: 4,
                        whiteSpace: 'nowrap',
                        border: '1.5px solid #fff'
                      }}>
                        {s.first_source || 'other'}
                      </div>
                    </div>

                    {/* Middle: Time info in compact grid */}
                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 11, color: '#666', fontWeight: 600, marginBottom: 3 }}>Started</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{formatTime(s.started_at)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: '#666', fontWeight: 600, marginBottom: 3 }}>Last Seen</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{formatTime(s.last_seen_at)}</div>
                      </div>
                      <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <div style={{ 
                          background: '#f3f4f6', 
                          padding: '4px 10px', 
                          borderRadius: 6,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}>
                          <span style={{ fontSize: 11, color: '#666', fontWeight: 600 }}>Source</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#111' }}>{s.source || 'other'}</span>
                        </div>
                        <div style={{ 
                          background: '#f3f4f6', 
                          padding: '4px 10px', 
                          borderRadius: 6,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}>
                          <span style={{ fontSize: 11, color: '#666', fontWeight: 600 }}>Pages</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#111' }}>{s.page_count}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Status badge */}
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: '2px solid',
                        borderColor: isEnded(s) ? '#e5e7eb' : '#86efac',
                        color: isEnded(s) ? '#6b7280' : '#166534',
                        background: isEnded(s) ? '#f9fafb' : '#dcfce7',
                        minWidth: 70,
                        textAlign: 'center'
                      }}>
                        {isEnded(s) ? 'Ended' : 'Active'}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="pagination-controls" style={{ marginTop: 12 }}>
              <button className="btn pagination-btn" onClick={() => { if (page>0) loadSessions(page-1); }} disabled={page===0} style={{ opacity: page === 0 ? 0.5 : 1 }}>Previous</button>
              <button className="btn pagination-btn" onClick={() => loadSessions(page+1)}>Next</button>
            </div>
          </div>
        </div>

        {filtersOpen && (
          <aside className="filters-card">
            <div className="filters-header">Filters</div>
            <div className="filters-body">
              <label className="field">
                <div className="label">Source</div>
                <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)}>
                  <option value="">All sources</option>
                  <option value="instagram">Instagram</option>
                  <option value="youtube">YouTube</option>
                  <option value="google">Google</option>
                  <option value="other">Others</option>
                </select>
              </label>
              <label className="field">
                <div className="label">User ID</div>
                <input value={filterUserId} onChange={(e) => setFilterUserId(e.target.value)} placeholder="UUID" />
              </label>
              <label className="field">
                <div className="label">Visitor ID</div>
                <input value={filterVisitorId} onChange={(e) => setFilterVisitorId(e.target.value)} placeholder="UUID" />
              </label>
              <div className="filter-buttons">
                <button className="btn primary" onClick={() => loadSessions(0)}>Apply</button>
                <button className="btn" onClick={() => { setFilterSource(''); setFilterUserId(''); setFilterVisitorId(''); loadSessions(0); }}>Reset</button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Modal for session details */}
      {modalOpen && selectedId && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Session Details</h2>
              <button className="modal-close" onClick={() => setModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              {detail ? (
                <div>
                  {/* Top badge row with first and current sources */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, display: 'grid', placeItems: 'center', background: '#f3f4f6' }}>
                        {logos[(detail.first_source || 'other')] || logos.other}
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>First source</div>
                        <div style={{ fontSize: 13, fontWeight: 800 }}>{detail.first_source || 'other'}</div>
                      </div>
                    </div>
                    <div style={{ width: 1, height: 36, background: '#e5e7eb' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, display: 'grid', placeItems: 'center', background: '#f3f4f6' }}>
                        {logos[(detail.current_source || detail.source || 'other')] || logos.other}
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>Current source</div>
                        <div style={{ fontSize: 13, fontWeight: 800 }}>{detail.current_source || detail.source || 'other'}</div>
                      </div>
                    </div>
                    <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 800, padding: '4px 8px', borderRadius: 999, border: '1px solid', borderColor: (detail.ended_at || (Date.now() - new Date(detail.last_seen_at).getTime() > 30*60*1000)) ? '#e5e7eb' : '#bbf7d0', color: (detail.ended_at || (Date.now() - new Date(detail.last_seen_at).getTime() > 30*60*1000)) ? '#6b7280' : '#166534', background: (detail.ended_at || (Date.now() - new Date(detail.last_seen_at).getTime() > 30*60*1000)) ? '#f9fafb' : '#dcfce7' }}>
                      {(detail.ended_at || (Date.now() - new Date(detail.last_seen_at).getTime() > 30*60*1000)) ? 'Ended' : 'Active'}
                    </span>
                  </div>

                  {/* Details grid */}
                  <div className="detail-grid">
                    <div className="detail-item">
                      <div className="detail-label">Session ID</div>
                      <div className="detail-value large">{detail.id}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">Visitor ID</div>
                      <div className="detail-value">{detail.visitor_id}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">User ID</div>
                      <div className="detail-value">{detail.user_id || '—'}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">Session source</div>
                      <div className="detail-value">{detail.source}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">Landing Path</div>
                      <div className="detail-value">{detail.landing_path || '/'}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">Started</div>
                      <div className="detail-value">{formatFullTime(detail.started_at)}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">Last Seen</div>
                      <div className="detail-value">{formatFullTime(detail.last_seen_at)}</div>
                    </div>
                  <div className="detail-item">
                    <div className="detail-label">Ended</div>
                    <div className="detail-value">{(detail.ended_at || (Date.now() - new Date(detail.last_seen_at).getTime() > 30*60*1000)) ? (detail.ended_at ? formatFullTime(detail.ended_at) : 'Ended (inferred)') : 'Active'}</div>
                  </div>
                    <div className="detail-item">
                      <div className="detail-label">Page Count</div>
                      <div className="detail-value">{detail.page_count}</div>
                    </div>
                    {detail.first_referrer !== undefined && (
                      <div className="detail-item">
                        <div className="detail-label">First Referrer</div>
                        <div className="detail-value">{detail.first_referrer || 'No referrer'}</div>
                      </div>
                    )}
                    {detail.current_referrer !== undefined && (
                      <div className="detail-item">
                        <div className="detail-label">Current Referrer</div>
                        <div className="detail-value">{detail.current_referrer || 'No referrer'}</div>
                      </div>
                    )}
                    {detail.user_agent && (
                      <div className="detail-item user-agent-detail">
                        <div className="detail-label">User Agent</div>
                        <div className="detail-value">{detail.user_agent}</div>
                      </div>
                    )}
                    {detail.ip && (
                      <div className="detail-item">
                        <div className="detail-label">IP</div>
                        <div className="detail-value">{detail.ip}</div>
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Events</div>
                    <div className="table-scroll-container">
                      <table className="traffic-table">
                        <thead>
                          <tr>
                            <th>Time</th>
                            <th>Route</th>
                            <th>Referrer</th>
                          </tr>
                        </thead>
                        <tbody>
                          {events.map((e, idx) => (
                            <tr key={idx}>
                              <td>{formatFullTime(e.occurred_at)}</td>
                              <td>{e.path || '/'}</td>
                              <td>{e.referrer || 'No referrer'}</td>
                            </tr>
                          ))}
                          {events.length === 0 && (
                            <tr>
                              <td colSpan={3} style={{ textAlign: 'center', color: '#666', padding: 16 }}>No events</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div>Loading…</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
