import React from 'react';

export const Timeline: React.FC<{ events: any[]; onEventClick: (event: any) => void }> = ({ 
  events, 
  onEventClick 
}) => {
  if (!events || events.length === 0) {
    return <p>No hay eventos para mostrar</p>;
  }

  return (
    <div style={{ position: 'relative', paddingLeft: '24px' }}>
      {/* Línea vertical */}
      <div style={{
        position: 'absolute',
        left: '8px',
        top: 0,
        bottom: 0,
        width: '2px',
        background: '#e0e0e0',
      }} />

      {events.map((event, index) => (
        <div
          key={event.id_transaccion || index}
          onClick={() => onEventClick(event)}
          style={{
            position: 'relative',
            marginBottom: '16px',
            padding: '12px 16px',
            background: 'white',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {/* Punto en la línea de tiempo */}
          <div style={{
            position: 'absolute',
            left: '-20px',
            top: '16px',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: '#0f3460',
            border: '2px solid white',
            boxShadow: '0 0 0 2px #0f3460',
          }} />

          <h4 style={{ margin: '0 0 4px', fontSize: '16px' }}>
            {event.ciclo_nombre || 'Evento'}
          </h4>
          <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
            {event.lugar} - {event.modalidad}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#999' }}>
            {event.facilitador || 'Sin facilitador'}
          </p>
        </div>
      ))}
    </div>
  );
};
