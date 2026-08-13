import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const DashboardMetrics: React.FC<{ user: any; isViewer: boolean }> = ({ user, isViewer }) => {
  const [metrics, setMetrics] = useState({
    totalSchedules: 0,
    activeSchedules: 0,
    totalCorrelativos: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getMetrics = async () => {
      try {
        // Contar schedules
        const { count: schedulesCount } = await supabase
          .from('schedules')
          .select('*', { count: 'exact', head: true });
        
        // Contar schedules activos
        const { count: activeCount } = await supabase
          .from('schedules')
          .select('*', { count: 'exact', head: true })
          .eq('estado', 'ACTIVO');
        
        // Contar correlativos
        const { count: correlativosCount } = await supabase
          .from('correlativos')
          .select('*', { count: 'exact', head: true });
        
        // Contar usuarios
        const { count: usersCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });

        setMetrics({
          totalSchedules: schedulesCount || 0,
          activeSchedules: activeCount || 0,
          totalCorrelativos: correlativosCount || 0,
          totalUsers: usersCount || 0,
        });
      } catch (error) {
        console.error('Error al cargar métricas:', error);
      } finally {
        setLoading(false);
      }
    };
    getMetrics();
  }, []);

  if (loading) return <p>Cargando métricas...</p>;

  return (
    <div>
      <h3>📊 Dashboard</h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginTop: '16px',
      }}>
        <div style={{ background: '#e3f2fd', padding: '20px', borderRadius: '8px' }}>
          <h4>Total Cronogramas</h4>
          <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '8px 0' }}>{metrics.totalSchedules}</p>
        </div>
        <div style={{ background: '#e8f5e9', padding: '20px', borderRadius: '8px' }}>
          <h4>Activos</h4>
          <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '8px 0' }}>{metrics.activeSchedules}</p>
        </div>
        <div style={{ background: '#fff3e0', padding: '20px', borderRadius: '8px' }}>
          <h4>Correlativos</h4>
          <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '8px 0' }}>{metrics.totalCorrelativos}</p>
        </div>
        <div style={{ background: '#f3e5f5', padding: '20px', borderRadius: '8px' }}>
          <h4>Usuarios</h4>
          <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '8px 0' }}>{metrics.totalUsers}</p>
        </div>
      </div>
    </div>
  );
};
