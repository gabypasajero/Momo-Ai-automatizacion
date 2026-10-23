-- El plan y el estado de una empresa solo los cambia Momo AI (panel de administración):
-- las empresas editan nombre, contactos de derivación, marca y zona horaria.
revoke update on momo.organizations from authenticated;
grant update (name, handoff_contacts, brand, timezone) on momo.organizations to authenticated;

-- El equipo se gestiona solo con la función momo-usuarios (aplica las reglas de roles).
revoke insert, update, delete on momo.members from authenticated;

-- La función momo-usuarios (service_role) lee y actualiza estas tablas.
grant select, insert, update, delete on momo.ai_usage, momo.knowledge_gaps, momo.requests to service_role;
grant select, update on momo.platform_admins to service_role;
