import React from 'react';

export const CicloCard: React.FC<{
  ciclo: any;
  onEdit: (ciclo: any) => void;
  onDelete: (ciclo: any) => void;
  isViewer: boolean;
}> = ({ ciclo, onEdit, onDelete, isViewer }) => {
  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      border: '1px solid #e0e0e0',
      transition: 'all 0.2s',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
    }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div>
          <h4 style={{ margin: '0 0 4px', fontSize: '18px' }}>
            {ciclo.ciclo_nombre || 'Sin nombre'}
          </h4>
          <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
            {ciclo.lugar} - {ciclo.modalidad}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#999' }}>
            Facilitador: {ciclo.facilitador || 'No asignado'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{
            padding: '2px 10px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '600',
            background: ciclo.estado === 'ACTIVO' ? '#d4edda' : '#f8d7da',
            color: ciclo.estado === 'ACTIVO' ? '#155724' : '#721c24',
          }}>
            {ciclo.estado || 'PENDIENTE'}
          </span>
        </div>
      </div>

      {!isViewer && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <button
            onClick={() => onEdit(ciclo)}
            style={{
              padding: '6px 14px',
              background: '#0f3460',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            ✏️ Editar
          </button>
          <button
            onClick={() => onDelete(ciclo)}
            style={{
              padding: '6px 14px',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            🗑️ Eliminar
          </button>
        </div>
      )}
    </div>
  );
};
