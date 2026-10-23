-- Endurecimiento recomendado. Ejecútalo una vez en Supabase → SQL Editor.
-- (Desde el asistente no se pudieron aplicar sentencias DROP en este proyecto.)

-- 1. La política antigua permitía que un admin se nombrara dueño o quitara al dueño editando
--    la tabla directamente. Ahora el equipo se gestiona con la función momo-usuarios, que aplica
--    las reglas; esta política ya no es necesaria.
drop policy if exists "owner y admin gestionan el equipo" on momo.members;

-- 2. Funciones que quedaron sin uso.
drop function if exists momo.admin_overview();
drop function if exists momo.zz_prueba();
