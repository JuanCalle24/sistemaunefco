import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const HistoryModal: React.FC<{ user: any; isViewer: boolean }> = ({ user, isViewer }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    getHistory();
  }, []);

  const getHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error al cargar historial:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter(item => {
    if (filter === 'all') return true;
    return item.estado === filter;
  });

  if (loading) return <p>Cargando historial...</p>;

  return (
    <div>
      <h3>📜 Historial</h3>
      
      {/* Filtros */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <button
          onClick={() => setFilter('all')}
          style={{
            padding: '6px 16px',
            background: filter === 'all' ? '#0f3460' : '#e0e0e0',
            color: filter === 'all' ? 'white' : '#333',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Todos
        </button>
        <button
          onClick={() => setFilter('ACTIVO')}
          style={{
            padding: '6px 16px',
            background: filter === 'ACTIVO' ? '#28a745' : '#e0e0e0',
            color: filter === 'ACTIVO' ? 'white' : '#333',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Activos
        </button>
        <button
          onClick={() => setFilter('ANULADO')}
          style={{
            padding: '6px 16px',
            background: filter === 'ANULADO' ? '#dc3545' : '#e0e0e0',
            color: filter === 'ANULADO' ? 'white' : '#333',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Anulados
        </button>
      </div>

      {/* Lista de historial */}
      {filteredHistory.length > 0 ? (
        filteredHistory.map((item) => (
          <div key={item.id_transaccion} style={{
            padding: '12px',
            borderBottom: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <strong>{item.ciclo_nombre || 'Sin nombre'}</strong>
              <p style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}>
                {item.lugar} - {item.modalidad}
              </p>
              <p style={{ margin: '4px 0', fontSize: '12px', color: '#999' }}>
                Facilitador: {item.facilitador || 'No asignado'}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{
                padding: '2px 10px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '600',
                background: item.estado === 'ACTIVO' ? '#d4edda' : '#f8d7da',
                color: item.estado === 'ACTIVO' ? '#155724' : '#721c24',
              }}>
                {item.estado || 'PENDIENTE'}
              </span>
              <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#999' }}>
                {new Date(item.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))
      ) : (
        <p>No hay registros en el historial</p>
      )}
    </div>
  );
};
