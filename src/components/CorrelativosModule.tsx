import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const CorrelativosModule: React.FC<{ user: any; isViewer: boolean }> = ({ user, isViewer }) => {
  const [correlativos, setCorrelativos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCorrelativo, setNewCorrelativo] = useState({
    tipo: 'cp',
    ci_num: '',
    ci_comp: '',
    nombre_facilitador: '',
    motivo: 'CONTRATO FACILITADOR',
  });

  useEffect(() => {
    getCorrelativos();
  }, []);

  const getCorrelativos = async () => {
    try {
      const { data, error } = await supabase
        .from('correlativos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCorrelativos(data || []);
    } catch (error) {
      console.error('Error al cargar correlativos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (isViewer) {
      alert('👁️ Modo solo lectura: No puedes crear');
      return;
    }

    if (!newCorrelativo.ci_num || !newCorrelativo.ci_comp || !newCorrelativo.nombre_facilitador) {
      alert('⚠️ Completa todos los campos');
      return;
    }

    try {
      // Generar número correlativo
      const { data: counters } = await supabase
        .from('correlativos_counters')
        .select('last_number')
        .eq('tipo', newCorrelativo.tipo)
        .single();

      const numero = (counters?.last_number || 0) + 1;
      const codigo_completo = `UNEFCO-${newCorrelativo.tipo.toUpperCase()}-LP Nº${String(numero).padStart(3, '0')}/${new Date().getFullYear()}`;

      const { data, error } = await supabase
        .from('correlativos')
        .insert({
          tipo: newCorrelativo.tipo,
          prefijo: newCorrelativo.tipo,
          numero: numero,
          codigo_completo: codigo_completo,
          ci_num: newCorrelativo.ci_num,
          ci_comp: newCorrelativo.ci_comp,
          ci_completa: `${newCorrelativo.ci_num}-${newCorrelativo.ci_comp}`,
          nombre_facilitador: newCorrelativo.nombre_facilitador,
          motivo: newCorrelativo.motivo,
          anio: new Date().getFullYear(),
          usuario_generador: user.email,
          estado: 'Activo',
          fecha_generacion: new Date().toISOString(),
        })
        .select();

      if (error) throw error;

      // Actualizar contador
      await supabase
        .from('correlativos_counters')
        .upsert({
          tipo: newCorrelativo.tipo,
          last_number: numero,
        });

      setNewCorrelativo({
        tipo: 'cp',
        ci_num: '',
        ci_comp: '',
        nombre_facilitador: '',
        motivo: 'CONTRATO FACILITADOR',
      });

      getCorrelativos();
      alert('✅ Correlativo creado correctamente');
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  if (loading) return <p>Cargando correlativos...</p>;

  return (
    <div>
      <h3>📄 Correlativos</h3>

      {/* Formulario de creación */}
      {!isViewer && (
        <div style={{
          background: '#f8f9fa',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px',
        }}>
          <h4>Generar Nuevo Correlativo</h4>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <select
              value={newCorrelativo.tipo}
              onChange={(e) => setNewCorrelativo({ ...newCorrelativo, tipo: e.target.value })}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
            >
              <option value="cp">CP</option>
              <option value="inf">INF</option>
              <option value="ini">INI</option>
            </select>
            <input
              type="text"
              placeholder="Nº CI"
              value={newCorrelativo.ci_num}
              onChange={(e) => setNewCorrelativo({ ...newCorrelativo, ci_num: e.target.value })}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc', flex: 1 }}
            />
            <input
              type="text"
              placeholder="Complemento CI"
              value={newCorrelativo.ci_comp}
              onChange={(e) => setNewCorrelativo({ ...newCorrelativo, ci_comp: e.target.value })}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc', flex: 1 }}
            />
            <input
              type="text"
              placeholder="Nombre Facilitador"
              value={newCorrelativo.nombre_facilitador}
              onChange={(e) => setNewCorrelativo({ ...newCorrelativo, nombre_facilitador: e.target.value })}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc', flex: 1 }}
            />
            <button
              onClick={handleCreate}
              style={{
                padding: '8px 20px',
                background: '#0f3460',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Generar
            </button>
          </div>
        </div>
      )}

      {/* Lista de correlativos */}
      {correlativos.length > 0 ? (
        correlativos.map((c) => (
          <div key={c.id} style={{
            padding: '12px',
            borderBottom: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <strong>{c.codigo_completo}</strong>
              <p style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}>
                {c.nombre_facilitador} - CI: {c.ci_completa}
              </p>
            </div>
            <span style={{
              padding: '2px 10px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: '600',
              background: c.estado === 'Activo' ? '#d4edda' : '#f8d7da',
              color: c.estado === 'Activo' ? '#155724' : '#721c24',
            }}>
              {c.estado}
            </span>
          </div>
        ))
      ) : (
        <p>No hay correlativos registrados</p>
      )}
    </div>
  );
};
