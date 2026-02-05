import React, { useState, useEffect } from 'react';
import { editorsAPI } from '../firebaseApi';
import { EditorStats } from '../types';

const Editors: React.FC<{ onTabChange: (tab: string) => void }> = ({ onTabChange }) => {
  const [editorStats, setEditorStats] = useState<EditorStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEditorStats();
  }, []);

  const loadEditorStats = async () => {
    try {
      const res = await editorsAPI.getEditorStats();
      setEditorStats(res.data);
    } catch (error) {
      console.error('Error loading editor stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMaxVideos = () => {
    return Math.max(...editorStats.map(e => e.videosEdited), 1);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="header" style={{ paddingTop: '8px' }}>
        <div>
          <div className="app-title">CrownX Agency</div>
        </div>
        <div className="header-icons">
          <button className="icon-btn">
            <span className="material-icons-round text-slate-600">notifications</span>
          </button>
          <div className="user-avatar">F1</div>
        </div>
      </header>

      <div style={{ height: '16px' }}></div>

      <div className="tab-nav">
        <button className="tab-btn" onClick={() => onTabChange('dashboard')}>Dashboard</button>
        <button className="tab-btn active" onClick={() => onTabChange('editors')}>Editors</button>
      </div>

      <div style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px', color: '#1e293b' }}>
          Editor Analytics
        </h2>

        <div className="editor-stats-container">
          {editorStats.map((editor) => (
            <div key={editor.name} className="editor-card">
              <div className="editor-header">
                <div className="editor-avatar">{editor.name.charAt(0)}</div>
                <div>
                  <h3 className="editor-name">{editor.name}</h3>
                  <p className="editor-videos">{editor.videosEdited} videos edited</p>
                </div>
              </div>

              <div className="editor-bar-container">
                <div 
                  className="editor-bar"
                  style={{ width: `${(editor.videosEdited / getMaxVideos()) * 100}%` }}
                ></div>
              </div>

              <div className="editor-cost">
                <span className="cost-label">Total Cost</span>
                <span className="cost-value">₹{editor.totalCost.toLocaleString()}</span>
              </div>
            </div>
          ))}

          {editorStats.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              No editor data available
            </div>
          )}
        </div>
      </div>

      <nav className="bottom-nav">
        <button className="nav-item">
          <span className="material-icons-round nav-icon">dashboard</span>
          <span>Home</span>
        </button>
        <button className="nav-item">
          <span className="material-icons-round nav-icon">pie_chart</span>
          <span>Stats</span>
        </button>
        <button className="nav-item">
          <span className="material-icons-round nav-icon">account_circle</span>
          <span>Profile</span>
        </button>
        <button className="nav-item">
          <span className="material-icons-round nav-icon">settings</span>
          <span>Settings</span>
        </button>
      </nav>
    </div>
  );
};

export default Editors;
