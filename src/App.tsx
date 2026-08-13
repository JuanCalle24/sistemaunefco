import React, { useEffect, useState } from 'react';
import { authService } from './services/authService';
import { User } from './types';
import LoginScreen from './components/LoginScreen';
import { ProgramarView } from './components/ProgramarView';

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
    return <div>Cargando sistema...</div>;
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const isViewer = user.role === 'viewer';

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        padding: '10px 20px',
        background: '#1a1a2e',
        color: 'white',
        borderRadius: '8px'
      }}>
        <h1 style={{ margin: 0, fontSize: '20px' }}>🎓 UNEFCO La Paz</h1>
        <div>
          <span style={{ marginRight: '15px' }}>👤 {user.nombre}</span>
          <button 
            onClick={handleLogout}
            style={{
              padding: '6px 14px',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      <ProgramarView user={user} isViewer={isViewer} />
    </div>
  );
}

export default App;
