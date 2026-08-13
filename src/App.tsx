import React, { useEffect, useState } from 'react';
import { authService } from './services/authService';
import { User } from './types';
import LoginScreen from './components/LoginScreen';

// Importa tus componentes (ajusta las rutas según tu estructura)
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import ProgramarView from './components/ProgramarView';
import CorrelativosModule from './components/CorrelativosModule';
import HistoryModal from './components/HistoryModal';

// Estilos CSS (puedes moverlos a un archivo separado)
const styles = {
  app: {
    minHeight: '100vh',
    background: '#f0f2f5',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  main: {
    flex: 1,
    padding: '20px',
    maxWidth: '1400px',
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box' as const,
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
  content: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
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
  viewerIcon: {
    fontSize: '20px',
  },
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'programar' | 'correlativos' | 'history'>('dashboard');

  useEffect(() => {
    // Verificar sesión al cargar
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
    return (
      <div style={styles.loadingContainer}>
        <div>Cargando sistema...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const isViewer = user.role === 'viewer';
  const hasEditPermission = authService.hasEditPermission(user);

  // Renderizar contenido según tab activa
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard user={user} />;
      case 'programar':
        return <ProgramarView user={user} isViewer={isViewer} />;
      case 'correlativos':
        return <CorrelativosModule user={user} isViewer={isViewer} />;
      case 'history':
        return <HistoryModal user={user} isViewer={isViewer} />;
      default:
        return <Dashboard user={user} />;
    }
  };

  return (
    <div style={styles.app}>
      {/* Header con navegación */}
      <Header 
        user={user} 
        onLogout={handleLogout}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Contenido principal */}
      <main style={styles.main}>
        {/* Banner para usuarios viewer */}
        {isViewer && (
          <div style={styles.viewerBanner}>
            <span style={styles.viewerIcon}>👁️</span>
            <span>
              <strong>Modo Solo Lectura:</strong> Puedes ver toda la información, 
              pero no puedes editar, crear o eliminar registros.
            </span>
          </div>
        )}

        <div style={styles.content}>
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;
