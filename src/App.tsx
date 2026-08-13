import React, { useEffect, useState } from 'react';
import { authService } from './services/authService';
import { User } from './types';
import LoginScreen from './components/LoginScreen';

// Importa tus otros componentes aquí
// import Dashboard from './components/Dashboard';
// import Header from './components/Header';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
      <div className="loading-container">
        <div className="loading-spinner">Cargando...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // Aquí va tu contenido principal de la app
  return (
    <div className="app">
      {/* <Header user={user} onLogout={handleLogout} /> */}
      {/* <Dashboard user={user} /> */}
      <div>
        <h1>Bienvenido, {user.nombre}</h1>
        <p>Rol: {user.role}</p>
        <button onClick={handleLogout}>Cerrar Sesión</button>
      </div>
    </div>
  );
}

export default App;
