import React, { useMemo, useState } from 'react';
import './AdminSettings.css';
import './AdminTraffic.css';

export default function AdminSettings() {
  const [tab, setTab] = useState('general');
  const [palette, setPalette] = useState('neutral');

  const palettes = useMemo(() => ([
    { key: 'neutral', name: 'Neutral', tones: ['#111','#333','#888','#e0e0e0','#fff'] },
    { key: 'dim', name: 'Dim', tones: ['#111','#222','#555','#cfcfcf','#f6f6f6'] },
    { key: 'contrast', name: 'High Contrast', tones: ['#000','#111','#666','#dddddd','#ffffff'] },
    { key: 'mono', name: 'Mono', tones: ['#111','#444','#777','#bbbbbb','#f2f2f2'] }
  ]), []);

  return (
    <div className="admin-settings">
      <div className="traffic-toolbar">
        <div className="toolbar-top">
          <div className="title">Settings</div>
        </div>
      </div>
      <div className="settings-layout">
        <nav className="settings-nav">
          <div className="settings-nav-title">Settings</div>
          {[
            { key: 'general', label: 'General' },
            { key: 'appearance', label: 'Appearance' },
            { key: 'security', label: 'Security' },
            { key: 'email', label: 'Email' },
          ].map((s) => (
            <button
              key={s.key}
              className={`settings-nav-item ${tab === s.key ? 'active' : ''}`}
              onClick={() => setTab(s.key)}
            >
              {s.label}
            </button>
          ))}
        </nav>

        <div className="settings-content">
          {tab === 'general' && (
            <section className="settings-card">
              <header className="settings-card-header">
                <h2>General</h2>
                <p>Basic configuration for your site</p>
              </header>
              <div className="settings-form-grid">
                <Field label="Site title">
                  <input type="text" placeholder="PeakSelf" />
                </Field>
                <Field label="Support email">
                  <input type="email" placeholder="support@example.com" />
                </Field>
                <Field label="Tagline" full>
                  <textarea rows={3} placeholder="A short description of your site" />
                </Field>
                <Field label="Maintenance mode" alignCenter>
                  <input type="checkbox" />
                </Field>
              </div>
            </section>
          )}

          {tab === 'appearance' && (
            <section className="settings-card">
              <header className="settings-card-header">
                <h2>Appearance</h2>
                <p>Theme, density, and color palette</p>
              </header>
              <div className="settings-form-grid">
                <Field label="Theme">
                  <div className="choice-row">
                    <label className="choice"><input type="radio" name="theme" defaultChecked /> <span>Light</span></label>
                    <label className="choice"><input type="radio" name="theme" /> <span>Auto</span></label>
                    <label className="choice"><input type="radio" name="theme" /> <span>Dark</span></label>
                  </div>
                </Field>

                <Field label="Density">
                  <div className="choice-row">
                    <label className="choice"><input type="radio" name="density" defaultChecked /> <span>Comfortable</span></label>
                    <label className="choice"><input type="radio" name="density" /> <span>Compact</span></label>
                  </div>
                </Field>

                <Field label="Color palette">
                  <div className="palette-row">
                    {palettes.map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => setPalette(p.key)}
                        className={`palette-btn ${palette === p.key ? 'active' : ''}`}
                      >
                        <span className="palette-name">{p.name}</span>
                        <span className="palette-tones">
                          {p.tones.map((t, i) => (
                            <span key={i} className="tone" style={{ background: t }} />
                          ))}
                        </span>
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
            </section>
          )}

          {tab === 'security' && (
            <section className="settings-card">
              <header className="settings-card-header">
                <h2>Security</h2>
                <p>Authentication and session options</p>
              </header>
              <div className="settings-form-grid">
                <Field label="JWT expiry (days)">
                  <input type="number" min={1} max={30} defaultValue={1} />
                </Field>
                <Field label="Require 2FA" alignCenter>
                  <input type="checkbox" />
                </Field>
                <Field label="Allow email login" alignCenter>
                  <input type="checkbox" defaultChecked />
                </Field>
              </div>
            </section>
          )}

          {tab === 'email' && (
            <section className="settings-card">
              <header className="settings-card-header">
                <h2>Email</h2>
                <p>From settings and provider configuration</p>
              </header>
              <div className="settings-form-grid">
                <Field label="From name">
                  <input type="text" placeholder="PeakSelf" />
                </Field>
                <Field label="From address">
                  <input type="email" placeholder="no-reply@example.com" />
                </Field>
                <div className="settings-row">
                  <div className="settings-label">SMTP</div>
                  <div>
                    <span className="badge">Not configured</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          <div className="settings-sticky-bar">
            <button className="btn secondary" type="button">Reset</button>
            <button className="btn primary" type="button">Save changes</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, full = false, alignCenter = false }) {
  return (
    <label className={`settings-row ${full ? 'full' : ''} ${alignCenter ? 'align-center' : ''}`}>
      <div className="settings-label">{label}</div>
      <div className="settings-control">{children}</div>
    </label>
  );
}