import React, { useState } from 'react';
import { authService } from '../services/authService';
import { User } from '../types';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await authService.login(username, password);
      onLogin(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '24px',
        padding: '48px 40px',
        width: '100%',
        maxWidth: '420px',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
      }}>
        {/* Logo / Icono */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '72px',
            height: '72px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            borderRadius: '18px',
            margin: '0 auto 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
          }}>
            🎓
          </div>
          <h1 style={{
            color: 'white',
            fontSize: '28px',
            fontWeight: '700',
            margin: '0 0 4px',
            letterSpacing: '-0.5px',
          }}>
            UNEFCO La Paz
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: '14px',
            margin: 0,
          }}>
            Sistema de Gestión Académica
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(255, 59, 48, 0.15)',
            border: '1px solid rgba(255, 59, 48, 0.3)',
            color: '#ff6b6b',
            padding: '12px 16px',
            borderRadius: '12px',
            marginBottom: '24px',
            fontSize: '14px',
            textAlign: 'center',
            backdropFilter: 'blur(4px)',
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '18px' }}>
            <label style={{
              display: 'block',
              color: 'rgba(255,255,255,0.8)',
              fontSize: '13px',
              fontWeight: '500',
              marginBottom: '6px',
            }}>
              Usuario
            </label>
            <input
              type="text"
              placeholder="Ingresa tu usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '14px 16px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '12px',
                fontSize: '15px',
                color: 'white',
                outline: 'none',
                transition: 'all 0.3s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.background = 'rgba(255,255,255,0.12)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.12)';
                e.target.style.background = 'rgba(255,255,255,0.08)';
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              color: 'rgba(255,255,255,0.8)',
              fontSize: '13px',
              fontWeight: '500',
              marginBottom: '6px',
            }}>
              Contraseña
            </label>
            <input
              type="password"
              placeholder="Ingresa tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '14px 16px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '12px',
                fontSize: '15px',
                color: 'white',
                outline: 'none',
                transition: 'all 0.3s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.background = 'rgba(255,255,255,0.12)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.12)';
                e.target.style.background = 'rgba(255,255,255,0.08)';
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s',
              opacity: loading ? 0.6 : 1,
              transform: loading ? 'scale(0.98)' : 'scale(1)',
              boxShadow: '0 4px 16px rgba(102, 126, 234, 0.4)',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(102, 126, 234, 0.4)';
            }}
          >
            {loading ? (
              <span>⏳ Iniciando sesión...</span>
            ) : (
              <span>🚀 Iniciar Sesión</span>
            )}
          </button>
        </form>

        {/* Footer */}
        <div style={{
          marginTop: '24px',
          textAlign: 'center',
          color: 'rgba(255,255,255,0.3)',
          fontSize: '12px',
          letterSpacing: '0.5px',
        }}>
          <span>Sistema UNEFCO La Paz v2.0</span>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
