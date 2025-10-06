import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, Users as UsersIcon, FileText, Settings as SettingsIcon, Activity } from 'lucide-react';
import AdminSettings from '../components/AdminSettings';
import AdminOverview from '../components/AdminOverview';
import AdminTraffic from '../components/AdminTraffic';
import AdminUsers from '../components/AdminUsers';
import AdminContent from '../components/AdminContent';
import AdminSessions from '../components/AdminSessions';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export default function Admin() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [active, setActive] = useState('overview');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/admin`, { credentials: 'include' });
        if (res.status === 401 || res.status === 403) {
          window.location.href = '/not-accessible';
          return;
        }
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load admin');
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load admin');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const sections = useMemo(() => {
    const base = [
      { key: 'overview', label: 'Overview', icon: BarChart3 },
      { key: 'traffic', label: 'Traffic', icon: BarChart3 },
      { key: 'sessions', label: 'Sessions', icon: Activity },
      { key: 'users', label: 'Users', icon: UsersIcon },
      { key: 'content', label: 'Content', icon: FileText },
      { key: 'settings', label: 'Settings', icon: SettingsIcon }
    ];
    return base;
  }, []);

  if (loading) return <div style={{padding: '2rem'}}>Loading admin...</div>;
  if (error) return <div style={{padding: '2rem', color: '#b91c1c'}}>Error: {error}</div>;

  const user = data?.user;

  return (
    <div style={{display: 'flex', minHeight: 'calc(100vh - 64px)', background: '#ebebeb'}}>
      {/* Sidebar */}
      <aside style={{width: 260, borderRight: '1px solid #111', background: '#000'}}>
        <div style={{padding: '1rem 1rem 0.5rem 1rem'}}>
          <div style={{fontSize: 18, fontWeight: 800, color: '#fff'}}>Admin</div>
          <div style={{fontSize: 12, color: '#bbb'}}>Signed in as</div>
          <div style={{fontSize: 13, color: '#ddd', wordBreak: 'break-all'}}>{user?.email}</div>
        </div>
        <div style={{padding: '0.75rem 0.5rem'}}>
          {sections.map((s) => (
            <button
              key={s.key}
              onClick={() => setActive(s.key)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '0.6rem 0.75rem',
                background: active === s.key ? '#fff' : 'transparent',
                color: active === s.key ? '#111' : '#ddd',
                border: '1px solid ' + (active === s.key ? '#fff' : '#333'),
                borderRadius: 8,
                margin: '0.25rem 0',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <s.icon size={16} style={{ color: active === s.key ? '#111' : '#ddd' }} />
              <span style={{fontWeight: 700, fontSize: 14}}>{s.label}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* Main content */}
      <section style={{flex: 1, padding: '1.25rem'}}>

        {active === 'overview' && (
          <AdminOverview />
        )}

        {active === 'traffic' && (
          <AdminTraffic />
        )}

        {active === 'sessions' && (
          <AdminSessions />
        )}

        {active === 'users' && (
          <AdminUsers />
        )}

        {active === 'content' && (
          <AdminContent />
        )}

        {active === 'settings' && (
          <AdminSettings />
        )}
      </section>
    </div>
  );
}
