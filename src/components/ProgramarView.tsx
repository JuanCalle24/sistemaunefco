import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const ProgramarView: React.FC<{ user: any; isViewer: boolean }> = ({ user, isViewer }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  // ✅ Función corregida
  const getData = async () => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('
