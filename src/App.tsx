import React, { useEffect, useState } from 'react';
import { authService } from './services/authService';
import { User } from './types';
import LoginScreen from './components/LoginScreen';
import ProgramarView from './components/ProgramarView';

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
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
          
          {/* ProgramarView - Componente principal */}
          <ProgramarView user={user} isViewer={isViewer} />
        </div>
      </main>
    </div>
  );
}

export default App;
