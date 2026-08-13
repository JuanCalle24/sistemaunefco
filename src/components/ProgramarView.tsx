import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const ProgramarView: React.FC<{ user: any; isViewer: boolean }> = ({ user, isViewer }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Función corregida
  const getData = async () => {
    try {
      const { data, error } = await supabase.from('schedules').select('*');
      
      if (error) {
        console.error('Error al cargar:', error);
        setData([]);
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

  // ✅ Llamar la función al cargar
  useEffect(() => {
    getData();
  }, []);

  if (loading) {
    return <p>Cargando datos...</p>;
  }

  return (
    <div>
      <h3>Programar</h3>
      {data && data.length > 0 ? (
        data.map((item) => (
          <div key={item.id}>
            {item.ciclo_nombre || 'Sin nombre'}
          </div>
        ))
      ) : (
        <p>No hay datos disponibles</p>
      )}
    </div>
  );
};
