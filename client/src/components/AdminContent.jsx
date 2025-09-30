import React from 'react';
import './AdminContent.css';
import './AdminTraffic.css';

export default function AdminContent() {
  return (
    <div className="admin-content">
      <div className="traffic-toolbar">
        <div className="toolbar-top">
          <div className="title">Content</div>
        </div>
        <div className="traffic-chip-row">
          <button className="traffic-chip" type="button">New Post</button>
          <button className="traffic-chip" type="button">Drafts</button>
          <button className="traffic-chip" type="button">Categories</button>
        </div>
      </div>

      <div className="card-grid">
        {samplePosts.map((p) => (
          <div key={p.id} className="content-card">
            <div className="content-title">{p.title}</div>
            <div className="content-excerpt">{p.excerpt}</div>
            <div className="row-actions">
              <button className="btn small">Edit</button>
              <button className="btn small">Publish</button>
              <button className="btn small danger">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const samplePosts = [
  { id: 'p1', title: 'Welcome to PeakSelf', excerpt: 'Kickstarting your journey to peak performance.' },
  { id: 'p2', title: 'Mindfulness Tips', excerpt: 'Practical ways to stay present every day.' },
  { id: 'p3', title: 'Habits That Stick', excerpt: 'Build habits that last with these techniques.' },
];
