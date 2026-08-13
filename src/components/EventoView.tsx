import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export const EventoView: React.FC<{ 
  evento: any; 
  user: any; 
  isViewer: boolean;
  onClose: () => void;
  onUpdate: () => void;
}> = ({ evento, user, isViewer, onClose, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [fechas, setFechas] = useState({
    inicio: evento?.inicio || '',
    fin: evento?.fin || '',
    planificacion: evento?.planificacion || '',
    informe_final: evento?.informe_final || '',
    sesion2: evento?.sesion2 || '',
    sesion3: evento?.sesion3 || '',
  });

  const handleChange = (campo: string, valor: string) => {
    setFechas({ ...fechas, [campo]: valor });
  };

  const handleSave = async () => {
    if (isViewer) {
      alert('👁️ Modo solo lectura: No puedes editar');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('schedules')
        .update({
          inicio: fechas.inicio,
          fin: fechas.fin,
          planificacion: fechas.planificacion,
          informe_final: fechas.informe_final,
          sesion2: fechas.sesion2,
          sesion3: fechas.sesion3,
          updated_at: new Date().toISOString(),
        })
        .eq('id_transaccion', evento.id_transaccion);

      if (error) throw error;
      alert('✅ Evento actualizado correctamente');
      onUpdate();
      onClose();
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
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
    }}>
      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto',
      }}>
        <h3>📅 {evento?.ciclo_nombre || 'Evento'}</h3>
        <p><strong>Lugar:</strong> {evento?.lugar}</p>
        <p><strong>Modalidad:</strong> {evento?.modalidad}</p>
        <p><strong>Facilitador:</strong> {evento?.facilitador}</p>

        <hr style={{ margin: '16px 0' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label>
            Inicio:
            <input
              type="datetime-local"
              value={fechas.inicio || ''}
              onChange={(e) => handleChange('inicio', e.target.value)}
              disabled={isViewer}
              style={{ width: '100%', padding: '8px', marginTop: '4px' }}
            />
          </label>
          <label>
            Fin:
            <input
              type="datetime-local"
              value={fechas.fin || ''}
              onChange={(e) => handleChange('fin', e.target.value)}
              disabled={isViewer}
              style={{ width: '100%', padding: '8px', marginTop: '4px' }}
            />
          </label>
          <label>
            Planificación:
            <input
              type="datetime-local"
              value={fechas.planificacion || ''}
              onChange={(e) => handleChange('planificacion', e.target.value)}
              disabled={isViewer}
              style={{ width: '100%', padding: '8px', marginTop: '4px' }}
            />
          </label>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Cerrar
          </button>
          {!isViewer && (
            <button
              onClick={handleSave}
              disabled={loading}
              style={{
                padding: '10px 20px',
                background: '#0f3460',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Guardando...' : '💾 Guardar'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
