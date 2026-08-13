// ProgramarView.tsx
import React, { useState, useEffect } from 'react';

export const ProgramarView: React.FC<{ user: any; isViewer: boolean }> = ({ user, isViewer }) => {
  const [data, setData] = useState<any[]>([]); // ← Siempre array
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ... tu código
    setData(response || []); // ← Siempre asignar array, incluso si es vacío
    setLoading(false);
  }, []);

  if (loading) return <p>Cargando...</p>;

  return (
    <div>
      {/* Verificación SEGURA */}
      {data && data.length > 0 ? (
        data.map((item) => (
          <div key={item.id}>{item.nombre}</div>
        ))
      ) : (
        <p>No hay datos disponibles</p>
      )}
    </div>
  );
};
