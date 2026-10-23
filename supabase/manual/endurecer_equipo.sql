-- Limpieza opcional. Ejecútala una vez en Supabase → SQL Editor.
-- (Desde el asistente no se pudieron aplicar sentencias DROP en este proyecto.)

-- 1. Política antigua del equipo. Ya no tiene efecto: los usuarios no tienen permiso de escritura
--    sobre momo.members (migración 20261023000004) y el equipo se gestiona con la función momo-usuarios.
drop policy if exists "owner y admin gestionan el equipo" on momo.members;

-- 2. Funciones que quedaron sin uso (admin_overview fue reemplazada por admin_resumen).
drop function if exists momo.admin_overview();
drop function if exists momo.zz_prueba();
