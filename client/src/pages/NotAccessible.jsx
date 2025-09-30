import React from 'react';

export default function NotAccessible() {
  return (
    <div className="container" style={{padding: '4rem 1.5rem', textAlign: 'center'}}>
      <div style={{display: 'inline-block', textAlign: 'left', maxWidth: 520}}>
        <h1 style={{fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.5rem'}}>Not Accessible</h1>
        <p style={{color: '#6b7280', marginBottom: '1.25rem'}}>
          You don’t have permission to access this page. If you believe this is a mistake, please contact an administrator.
        </p>
        <a href="/" style={{display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0.6rem 1rem', fontWeight: 700, color: '#000', textDecoration: 'none', border: '1px solid #e5e7eb', borderRadius: 9999}}>Return Home</a>
      </div>
    </div>
  );
}