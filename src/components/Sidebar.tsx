import React from 'react';

export const Sidebar: React.FC<{
  activeTab: string;
  onTabChange: (tab: string) => void;
  user: any;
  isViewer: boolean;
}> = ({ activeTab, onTabChange, user, isViewer }) => {
  const tabs = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'programar', label: '📅 Programar' },
    { id: 'correlativos', label: '📄 Correlativos' },
    { id: 'history', label: '📜 Historial' },
    { id: 'users', label: '👥 Usuarios' },
  ];

  if (user.role === 'admin') {
    tabs.push({ id: 'admin', label: '⚙️ Admin' });
  }

  return (
    <div style={{
      width: '200px',
      background: '#1a1a2e',
      color: 'white',
      padding: '20px 0',
      height: '100vh',
      position: 'sticky',
      top: 0,
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ padding: '0 20px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', margin: 0 }}>🎓 UNEFCO</h2>
        <p style={{ fontSize: '12px', opacity: 0.6, margin: '4px 0 0' }}>La Paz</p>
      </div>

      <nav style={{ flex: 1 }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              display: 'block',
              width: '100%',
              padding: '12px 20px',
              background: activeTab === tab.id ? '#0f3460' : 'transparent',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '14px',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div style={{
        padding: '12px 20px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        fontSize: '12px',
        opacity: 0.6,
      }}>
        <p style={{ margin: 0 }}>{user.nombre}</p>
        <p style={{ margin: '4px 0 0' }}>{user.role}</p>
      </div>
    </div>
  );
};
