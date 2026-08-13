import React, { useEffect, useState } from 'react';
import { authService } from './services/authService';
import { User } from './types';
import LoginScreen from './components/LoginScreen';
import ProgramarView from './components/ProgramarView';
import CorrelativosModule from './components/CorrelativosModule';
import HistoryModal from './components/HistoryModal';

// Estilos inline para la app
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
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userName: {
    fontSize: '14px',
    opacity: 0.8,
  },
  logoutBtn: {
    padding: '6px 14px',
    background: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
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
  welcome: {
    fontSize: '24px',
    marginBottom: '8px',
  },
  roleBadge: {
    background: '#28a745',
    color: 'white',
    fontSize: '12px',
    padding: '4px 12px',
    borderRadius: '12px',
    display: 'inline-block',
  },
  viewerBanner: {
    background: '#fff3cd',
    color: '#856404',
    padding: '12px 20px',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid #ffc107',
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
};

type TabType = 'programar' | 'correlativos' | 'history';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('programar');

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

  // Renderizar contenido según tab activa
  const renderContent = () => {
    switch (activeTab) {
      case 'programar':
        return <ProgramarView user={user} isViewer={isViewer} />;
      case 'correlativos':
        return <CorrelativosModule user={user} isViewer={isViewer} />;
      case 'history':
        return <HistoryModal user={user} isViewer={isViewer} />;
      default:
        return <ProgramarView user={user} isViewer={isViewer} />;
    }
  };

  return (
    <div style={styles.app}>
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.logo}>UNEFCO La Paz</h1>
        <div style={styles.userInfo}>
          <span style={styles.userName}>👤 {user.nombre}</span>
          <span style={styles.roleBadge}>
            {isViewer ? '👁️ VIEWER' : user.role.toUpperCase()}
          </span>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Contenido principal */}
      <main style={styles.main}>
        {isViewer && (
          <div style={styles.viewerBanner}>
            👁️ <strong>Modo Solo Lectura:</strong> Puedes ver toda la información, pero no puedes editar, crear o eliminar registros.
          </div>
        )}

        <div style={styles.content}>
          <h2 style={styles.welcome}>Bienvenido, {user.nombre}</h2>
          <p style={{ color: '#666', marginBottom: '16px' }}>
            Rol: <strong>{user.role}</strong>
          </p>

          {/* Navegación por tabs */}
          <div style={styles.tabs}>
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

          {/* Contenido dinámico */}
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;
