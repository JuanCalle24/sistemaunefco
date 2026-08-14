-- ==============================================================================
-- SISTEMA DE CRONOGRAMAS UNEFCO - SUPABASE SCHEMA (POSTGRESQL) - PRODUCCIÓN LIMPIA
-- ==============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA DE PERFILES DE USUARIOS (TÉCNICOS Y ADMINISTRADORES)
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'tecnico')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    cargo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA DE CRONOGRAMAS ACADÉMICOS
CREATE TABLE IF NOT EXISTS public.cronogramas (
    id TEXT PRIMARY KEY, -- ID de transacción e.g. TRANS-1718290000000
    id_transaccion TEXT NOT NULL,
    tecnico TEXT NOT NULL,
    rol_operador TEXT,
    facilitador TEXT NOT NULL,
    ci TEXT NOT NULL,
    ci_complemento TEXT,
    fecha_inicio_contrato DATE NOT NULL,
    limite_contrato DATE NOT NULL,
    days_used INTEGER DEFAULT 0,
    modo TEXT DEFAULT 'automatico',
    hash_seguridad TEXT,
    estado TEXT NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'ANULADO')),
    motivo_anulacion TEXT,
    fecha_anulacion TIMESTAMPTZ,
    usuario_registro TEXT,
    usuario_anulador TEXT,
    slots JSONB DEFAULT '[]'::jsonb,
    asignaciones JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA DE CORRELATIVOS (CONTRATOS E INFORMES)
CREATE TABLE IF NOT EXISTS public.correlativos (
    id TEXT PRIMARY KEY, -- e.g. CP-001-2026
    tipo TEXT NOT NULL CHECK (tipo IN ('cp', 'inf', 'ini')),
    prefijo TEXT NOT NULL,
    numero INTEGER NOT NULL,
    codigo_completo TEXT NOT NULL,
    ci_num TEXT NOT NULL,
    ci_comp TEXT,
    ci_completa TEXT NOT NULL,
    nombre_facilitador TEXT NOT NULL,
    motivo TEXT NOT NULL,
    anio INTEGER NOT NULL DEFAULT 2026,
    fecha_generacion TIMESTAMPTZ NOT NULL,
    usuario_generador TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Anulado')),
    motivo_anulacion TEXT,
    fecha_anulacion TIMESTAMPTZ,
    usuario_anulador TEXT,
    fecha_inicio_contrato DATE,
    limite_contrato DATE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLA DE CONTADORES CORRELATIVOS
CREATE TABLE IF NOT EXISTS public.correlativo_contadores (
    id TEXT PRIMARY KEY, -- 'correlativo_counters_2026'
    cp INTEGER NOT NULL DEFAULT 0,
    inf INTEGER NOT NULL DEFAULT 0,
    ini INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABLA DE FACILITADORES (DOCENTES / COORDINADORES GUARDADOS)
CREATE TABLE IF NOT EXISTS public.facilitadores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    ci_num TEXT NOT NULL,
    ci_comp TEXT,
    ci_completa TEXT NOT NULL,
    celular TEXT,
    tipo TEXT NOT NULL DEFAULT 'docente' CHECK (tipo IN ('docente', 'coordinador')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. REINICIO TOTAL DE CONTADORES
INSERT INTO public.correlativo_contadores (id, cp, inf, ini)
VALUES ('correlativo_counters_2026', 0, 0, 0)
ON CONFLICT (id) DO UPDATE SET cp = 0, inf = 0, ini = 0, updated_at = NOW();

-- 8. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cronogramas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.correlativos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.correlativo_contadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilitadores ENABLE ROW LEVEL SECURITY;

-- 9. POLÍTICAS DE ACCESO PÚBLICO / ANON PARA PERMITIR OPERACIONES DE LA APP
DROP POLICY IF EXISTS "Permitir lectura y escritura publica anonima a usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Permitir lectura y escritura publica anonima a cronogramas" ON public.cronogramas;
DROP POLICY IF EXISTS "Permitir lectura y escritura publica anonima a correlativos" ON public.correlativos;
DROP POLICY IF EXISTS "Permitir lectura y escritura publica anonima a contadores" ON public.correlativo_contadores;
DROP POLICY IF EXISTS "Permitir lectura y escritura publica anonima a facilitadores" ON public.facilitadores;

CREATE POLICY "Permitir lectura y escritura publica anonima a usuarios" ON public.usuarios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir lectura y escritura publica anonima a cronogramas" ON public.cronogramas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir lectura y escritura publica anonima a correlativos" ON public.correlativos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir lectura y escritura publica anonima a contadores" ON public.correlativo_contadores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir lectura y escritura publica anonima a facilitadores" ON public.facilitadores FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- SCRIPT RÁPIDO DE VACIADO / PURGA TOTAL (EJECUTAR SI YA TENÍAS DATOS DE PRUEBA):
-- ==============================================================================
-- TRUNCATE TABLE public.cronogramas;
-- TRUNCATE TABLE public.correlativos;
-- UPDATE public.correlativo_contadores SET cp = 0, inf = 0, ini = 0 WHERE id = 'correlativo_counters_2026';
