// src/components/Header.tsx
import React from 'react';
import { User } from '../types';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  activeTab: 'dashboard' | 'programar' | 'correlativos' | 'history';
  onTabChange: (tab: 'dashboard' | 'programar' | 'correlativos' | 'history') => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, activeTab, onTabChange }) => {
  const isViewer = user.role === 'viewer';

  const tabs = [
    { id: 'dashboard' as const, label: '📊 Dashboard' },
    { id: 'programar' as const, label: '📅 Programar' },
    { id: 'correlativos' as const, label: '📄 Correlativos' },
    { id: 'history' as const, label: '📜 Historial' },
  ];

  return (
    <header style={{
      background: '#1a1a2e',
      color: 'white',
      padding: '12px 24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1400px',
        margin: '0 auto',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        {/* Logo y título */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ fontSize: '20px', margin: 0, fontWeight: '600' }}>
            UNEFCO La Paz
          </h1>
          <span style={{
            background: isViewer ? '#ffc107' : '#28a745',
            color: isViewer ? '#856404' : 'white',
            fontSize: '11px',
            padding: '2px 10px',
            borderRadius: '12px',
            fontWeight: '600',
          }}>
            {isViewer ? '👁️ VIEWER' : user.role.toUpperCase()}
          </span>
        </div>

        {/* Navegación */}
        <nav style={{
          display: 'flex',
          gap: '4px',
          flexWrap: 'wrap',
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{
                padding: '8px 16px',
                background: activeTab === tab.id ? '#0f3460' : 'transparent',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'background 0.2s',
                fontWeight: activeTab === tab.id ? '600' : '400',
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

        {/* Usuario y logout */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <span style={{
            fontSize: '14px',
            opacity: 0.8,
          }}>
            👤 {user.nombre}
          </span>
          <button
            onClick={onLogout}
            style={{
              padding: '6px 14px',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#c82333'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#dc3545'}
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
