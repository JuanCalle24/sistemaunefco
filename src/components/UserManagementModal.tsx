import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export const UserManagementModal: React.FC<{ user: any; isViewer: boolean }> = ({ user, isViewer }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [message, setMessage] = useState('');

  const handleCreateUser = async () => {
    if (!email) {
      setMessage('⚠️ Ingresa un email');
      return;
    }

    try {
      // Crear usuario en Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password: 'Temporal123*',
      });

      if (error) throw error;

      if (data.user) {
        // Insertar en tabla users
        await supabase.from('users').insert({
          id: data.user.id,
          email: email,
          nombre_completo: email.split('@')[0],
          role: role,
        });
        setMessage(`✅ Usuario ${email} creado con rol ${role}`);
        setEmail('');
      }
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    }
  };

  return (
    <div>
      <h3>👥 Gestión de Usuarios</h3>
      
      {message && (
        <div style={{
          padding: '12px',
          marginBottom: '16px',
          background: message.includes('✅') ? '#d4edda' : '#f8d7da',
          color: message.includes('✅') ? '#155724' : '#721c24',
          borderRadius: '6px',
        }}>
          {message}
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <input
          type="email"
          placeholder="Email del usuario"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '6px',
            flex: 1,
            minWidth: '200px',
          }}
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          style={{
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '6px',
          }}
        >
          <option value="viewer">Viewer</option>
          <option value="tecnico">Técnico</option>
          <option value="admin">Admin</option>
        </select>
        <button
          onClick={handleCreateUser}
          disabled={isViewer}
          style={{
            padding: '10px 20px',
            background: isViewer ? '#ccc' : '#0f3460',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isViewer ? 'not-allowed' : 'pointer',
          }}
        >
          Crear Usuario
        </button>
      </div>
      
      {isViewer && (
        <p style={{ color: '#856404', marginTop: '12px' }}>
          👁️ Modo solo lectura: No puedes crear usuarios
        </p>
      )}
    </div>
  );
};
