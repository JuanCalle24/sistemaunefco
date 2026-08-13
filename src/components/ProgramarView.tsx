import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const ProgramarView: React.FC<{ user: any; isViewer: boolean }> = ({ user, isViewer }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const getData = async () => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error al cargar datos:', error);
        setData([]);
        setLoading(false);
        return;
      }

      console.log('Datos cargados:', data);
      setData(data || []);
    } catch (error) {
      console.error('Error:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  if (loading) {
    return <p>Cargando datos...</p>;
  }

  return (
    <div>
      <h3>📅 Programar</h3>
      <p style={{ color: '#666', fontSize: '14px' }}>
        Rol: <strong>{user?.role || 'Sin rol'}</strong>
        {isViewer && ' (👁️ Solo Lectura)'}
      </p>

      {data && data.length > 0 ? (
        <div style={{ marginTop: '16px' }}>
          {data.map((item) => (
            <div
              key={item.id_transaccion || item.id}
              style={{
                padding: '12px',
                marginBottom: '8px',
                background: '#f8f9fa',
                borderRadius: '6px',
                border: '1px solid #e9ecef',
                cursor: 'pointer',
              }}
              onClick={() => setSelectedEvent(item)}
            >
              <strong>{item.ciclo_nombre || 'Sin nombre'}</strong>
              {item.lugar && ` - ${item.lugar}`}
              <span
                style={{
                  marginLeft: '12px',
                  padding: '2px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '600',
                  background: item.estado === 'ACTIVO' ? '#d4edda' : '#f8d7da',
                  color: item.estado === 'ACTIVO' ? '#155724' : '#721c24',
                }}
              >
                {item.estado || 'PENDIENTE'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: '#999', marginTop: '16px' }}>No hay datos disponibles</p>
      )}

      {selectedEvent && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
          onClick={() => setSelectedEvent(null)}
        >
          <div
            style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{selectedEvent.ciclo_nombre || 'Evento'}</h3>
            <p><strong>Lugar:</strong> {selectedEvent.lugar}</p>
            <p><strong>Modalidad:</strong> {selectedEvent.modalidad}</p>
            <p><strong>Facilitador:</strong> {selectedEvent.facilitador || 'No asignado'}</p>
            <p><strong>Estado:</strong> {selectedEvent.estado || 'PENDIENTE'}</p>
            <button
              onClick={() => setSelectedEvent(null)}
              style={{
                marginTop: '16px',
                padding: '8px 20px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
