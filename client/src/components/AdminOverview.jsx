import React, { useEffect, useState } from 'react';
import './AdminOverview.css';
import './AdminTraffic.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export default function AdminOverview() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/admin/dashboard`, { credentials: 'include' });
        if (res.status === 401 || res.status === 403) {
          window.location.href = '/not-accessible';
          return;
        }
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load dashboard');
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div style={{ padding: '1rem' }}>Loading overview…</div>;
  if (error) return <div style={{ padding: '1rem', color: '#b91c1c' }}>Error: {error}</div>;

  const d = data || {};
  const subtitle = d.snapshot_at ? new Date(d.snapshot_at).toLocaleString() : (d.source === 'live' ? 'live' : '');

  return (
    <div className="admin-overview">
      <div className="traffic-toolbar">
        <div className="toolbar-top">
          <div className="title">Overview</div>
        </div>
      </div>
      <div style={{ marginBottom: 8, color: '#666', fontSize: 12 }}>Source: {d.source || 'snapshot'} {subtitle && `• ${subtitle}`}</div>
      <div className="stat-grid">
        <StatCard title="Total Users" value={fmt(d.total_users)} subtitle={d.signups_24h != null ? `+${fmt(d.signups_24h)} / 24h` : ''} />
        <StatCard title="Verified Users" value={fmt(d.verified_users)} subtitle="" />
        <StatCard title="Newsletter Subs" value={fmt(d.newsletter_total)} subtitle={d.newsletter_signups_24h != null ? `+${fmt(d.newsletter_signups_24h)} / 24h` : ''} />
        <StatCard title="Traffic • Instagram" value={fmt(d.traffic_instagram)} subtitle={"last 7 days"} />
        <StatCard title="Traffic • YouTube" value={fmt(d.traffic_youtube)} subtitle={"last 7 days"} />
        <StatCard title="Traffic • Google" value={fmt(d.traffic_google)} subtitle={"last 7 days"} />
        <StatCard title="Traffic • Others" value={fmt(d.traffic_others)} subtitle={"last 7 days"} />
      </div>

      {Array.isArray(d.traffic_others_refs) && d.traffic_others_refs.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Top "Others" referrers (7d)</div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {d.traffic_others_refs.map((ref, idx) => (
              <li key={idx} style={{ color: '#444', fontSize: 13 }}>{String(ref)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, subtitle }) {
  return (
    <div className="stat-card">
      <div className="stat-title">{title}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-subtitle">{subtitle}</div>
    </div>
  );
}

function fmt(n) {
  if (n == null) return '-';
  try { return Number(n).toLocaleString(); } catch { return String(n); }
}
