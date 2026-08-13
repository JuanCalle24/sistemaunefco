import React, { useState } from 'react';

export const ScheduleFilterBar: React.FC<{ 
  onFilter: (filters: any) => void;
  user: any;
  isViewer: boolean;
}> = ({ onFilter, user, isViewer }) => {
  const [filters, setFilters] = useState({
    ciclo: '',
    lugar: '',
    modalidad: '',
    estado: '',
  });

  const handleChange = (campo: string, valor: string) => {
    const newFilters = { ...filters, [campo]: valor };
    setFilters(newFilters);
    onFilter(newFilters);
  };

  const handleReset = () => {
    const emptyFilters = { ciclo: '', lugar: '', modalidad: '', estado: '' };
    setFilters(emptyFilters);
    onFilter(emptyFilters);
  };

  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      flexWrap: 'wrap',
      padding: '16px',
      background: '#f8f9fa',
      borderRadius: '8px',
      marginBottom: '16px',
      alignItems: 'center',
    }}>
      <input
        type="text"
        placeholder="Ciclo"
        value={filters.ciclo}
        onChange={(e) => handleChange('ciclo', e.target.value)}
        style={{
          padding: '8px 12px',
          border: '1px solid #ccc',
          borderRadius: '6px',
          flex: 1,
          minWidth: '150px',
        }}
      />
      <input
        type="text"
        placeholder="Lugar"
        value={filters.lugar}
        onChange={(e) => handleChange('lugar', e.target.value)}
        style={{
          padding: '8px 12px',
          border: '1px solid #ccc',
          borderRadius: '6px',
          flex: 1,
          minWidth: '150px',
        }}
      />
      <select
        value={filters.modalidad}
        onChange={(e) => handleChange('modalidad', e.target.value)}
        style={{
          padding: '8px 12px',
          border: '1px solid #ccc',
          borderRadius: '6px',
          flex: 1,
          minWidth: '150px',
        }}
      >
        <option value="">Todas las modalidades</option>
        <option value="Presencial">Presencial</option>
        <option value="Virtual">Virtual</option>
        <option value="Mixta">Mixta</option>
      </select>
      <select
        value={filters.estado}
        onChange={(e) => handleChange('estado', e.target.value)}
        style={{
          padding: '8px 12px',
          border: '1px solid #ccc',
          borderRadius: '6px',
          flex: 1,
          minWidth: '150px',
        }}
      >
        <option value="">Todos los estados</option>
        <option value="ACTIVO">ACTIVO</option>
        <option value="ANULADO">ANULADO</option>
        <option value="FINALIZADO">FINALIZADO</option>
      </select>
      <button
        onClick={handleReset}
        style={{
          padding: '8px 16px',
          background: '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
        }}
      >
        Limpiar
      </button>
    </div>
  );
};
