import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const AdminModal: React.FC<{ user: any; isViewer: boolean }> = ({ user, isViewer }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUsers = async () => {
      try {
        const { data, error } = await supabase.from('users').select('*');
        if (error) throw error;
        setUsers(data || []);
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
      } finally {
        setLoading(false);
      }
    };
    getUsers();
  }, []);

  if (loading) return <p>Cargando usuarios...</p>;

  return (
    <div>
      <h3>⚙️ Administración</h3>
      <p style={{ color: '#666' }}>Gestión de usuarios y configuraciones del sistema</p>
      <div style={{ marginTop: '16px' }}>
        {users.length > 0 ? (
          users.map((u) => (
            <div key={u.id} style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
              {u.email} - <strong>{u.role}</strong>
            </div>
          ))
        ) : (
          <p>No hay usuarios registrados</p>
        )}
      </div>
    </div>
  );
};
