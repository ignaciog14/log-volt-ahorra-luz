-- Fix RLS 403 when soft-deleting electrodomésticos and habitaciones
-- Scope: allow authenticated owners to UPDATE even when setting activo=false
-- Strategy: add permissive UPDATE policies with proper USING/WITH CHECK that don't require activo=true on the new row

-- 1) Ensure RLS is enabled (safe if already enabled)
alter table public.habitaciones enable row level security;
alter table public.electrodomesticos enable row level security;

-- 2) Add UPDATE policy for electrodomesticos
-- USING is evaluated on the existing row (pre-update)
-- WITH CHECK is evaluated on the new row (post-update). We avoid requiring activo=true here.
create policy "upd_electros_owner_soft_delete_20251104"
  on public.electrodomesticos
  for update
  to authenticated
  using (
    public.user_owns_electrodomestico(id)
  )
  with check (
    public.user_owns_habitacion(habitacion_id)
  );

-- 3) Add UPDATE policy for habitaciones
create policy "upd_rooms_owner_soft_delete_20251104"
  on public.habitaciones
  for update
  to authenticated
  using (
    public.user_owns_habitacion(id)
  )
  with check (
    public.user_owns_hogar(hogar_id)
  );

-- 4) (Optional) Keep SELECT policies strict elsewhere; no changes here
-- We intentionally do not touch existing SELECT/INSERT policies to minimize blast radius.
