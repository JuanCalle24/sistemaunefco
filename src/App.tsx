import React, { useEffect, useState } from 'react';
import { authService } from './services/authService';
import { User } from './types';
import LoginScreen from './components/LoginScreen';
import ProgramarView from './components/ProgramarView';
import CorrelativosModule from './components/CorrelativosModule';
import HistoryModal from './components/HistoryModal';
import DashboardMetrics from './components/DashboardMetrics';

// Estilos completos
const styles = {
  app: {
    minHeight: '100vh',
    background: '#f0f2f5',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: '#1a1a2e',
    color: 'white',
    fontSize: '18px',
  },
  header: {
    background: '#1a1a2e',
    color: 'white',
    padding: '12px 24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '12px',
  },
  logo: {
    fontSize: '20px',
    fontWeight: '600',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userName: {
    fontSize: '14px',
    opacity: 0.9,
  },
  logoutBtn: {
    padding: '6px 14px',
    background: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    transition: 'background 0.2s',
  },
  main: {
    padding: '20px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  content: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
    borderBottom: '2px solid #e0e0e0',
    paddingBottom: '8px',
    flexWrap: 'wrap' as const,
  },
  tabButton: {
    padding: '10px 20px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: 500,
    color: '#666',
    borderRadius: '6px',
    transition: 'all 0.2s',
  },
  tabButtonActive: {
    background: '#0f3460',
    color: 'white',
  },
  viewerBanner: {
    background: '#fff3cd',
    color: '#856404',
    padding: '12px 20px',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid #ffc107',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '14px',
  },
};

type TabType = 'programar' | 'correlativos' | 'history' | 'dashboard';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  const handleLogin = (user: User) => {
    setUser(user);
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  if (loading) {
    return <div style={styles.loadingContainer}>Cargando sistema...</div>;
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const isViewer = user.role === 'viewer';

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardMetrics user={user} isViewer={isViewer} />;
      case 'programar':
        return <ProgramarView user={user} isViewer={isViewer} />;
      case 'correlativos':
        return <CorrelativosModule user={user} isViewer={isViewer} />;
      case 'history':
        return <HistoryModal user={user} isViewer={isViewer} />;
      default:
        return <DashboardMetrics user={user} isViewer={isViewer} />;
    }
  };

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <h1 style={styles.logo}>
          <span>🎓</span> UNEFCO La Paz
        </h1>
        <div style={styles.userInfo}>
          <span style={styles.userName}>👤 {user.nombre}</span>
          <span style={{
            background: isViewer ? '#ffc107' : '#28a745',
            color: isViewer ? '#856404' : 'white',
            padding: '2px 10px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: 600,
          }}>
            {isViewer ? '👁️ VIEWER' : user.role.toUpperCase()}
          </span>
          <button 
            style={styles.logoutBtn}
            onClick={handleLogout}
            onMouseEnter={(e) => e.currentTarget.style.background = '#c82333'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#dc3545'}
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      <main style={styles.main}>
        {isViewer && (
          <div style={styles.viewerBanner}>
            👁️ <strong>Modo Solo Lectura:</strong> Puedes ver toda la información, pero no puedes editar, crear o eliminar registros.
          </div>
        )}

        <div style={styles.content}>
          <div style={styles.tabs}>
            <button
              style={{
                ...styles.tabButton,
                ...(activeTab === 'dashboard' ? styles.tabButtonActive : {}),
              }}
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Dashboard
            </button>
            <button
              style={{
                ...styles.tabButton,
                ...(activeTab === 'programar' ? styles.tabButtonActive : {}),
              }}
              onClick={() => setActiveTab('programar')}
            >
              📅 Programar
            </button>
            <button
              style={{
                ...styles.tabButton,
                ...(activeTab === 'correlativos' ? styles.tabButtonActive : {}),
              }}
              onClick={() => setActiveTab('correlativos')}
            >
              📄 Correlativos
            </button>
            <button
              style={{
                ...styles.tabButton,
                ...(activeTab === 'history' ? styles.tabButtonActive : {}),
              }}
              onClick={() => setActiveTab('history')}
            >
              📜 Historial
            </button>
          </div>

          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;
