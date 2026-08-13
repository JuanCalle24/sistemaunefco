// ✅ CÓDIGO CORREGIDO
const getData = async () => {
  try {
    const { data, error } = await supabase.from('schedules').select('*');
    
    if (error) {
      console.error('Error al cargar:', error);
      setData([]);
      return;
    }
    
    // ✅ Usar 'data', no 'response'
    console.log(data);
    setData(data || []);
  } catch (error) {
    console.error('Error:', error);
    setData([]);
  }
};
