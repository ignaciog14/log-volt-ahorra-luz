# Auditoría Técnica - LogVolt MVP
> Rama: `refactor/notion-audit-logvolt` | Fecha: 2026-04-16

## Resumen Ejecutivo

El MVP fue generado con Lovable (AI-assisted), lo que resultó en componentes monolíticos, lógica de negocio mezclada con UI, tipos `any` dispersos, datos mock hardcodeados y sin políticas RLS en Supabase.

---

## 1. Deuda Técnica por Archivo

### `src/pages/Dashboard.tsx` — 676 líneas ❌ CRÍTICO
| Problema | Descripción |
|---|---|
| Tamaño excesivo | 676 líneas — 4x el límite de 150 |
| Lógica en componente | `fetchHogares`, `fetchDashboardData` inline sin hook |
| Datos mock | Consumo diario generado con `Math.random()` (línea 207) — no proviene de BD |
| Meta hardcodeada | `monthlyGoal = 400` hardcodeado — tabla `metas_consumo` existe pero no se usa |
| Tarifa hardcodeada | `estimatedCost = totalConsumption * 150` — tabla `tarifas_electricas` ignorada |
| `error: any` | Catch blocks sin tipo (líneas 87, 214) |
| Botón duplicado | "Gestionar Hogares" aparece en navbar Y en header del page |
| Navbar duplicada | Nav idéntica a `Homes.tsx` y `Profile.tsx` — sin componente compartido |
| Filter ineficiente | `.eq("habitaciones.hogar_id", selectedHogar)` en join (línea 125) puede no funcionar correctamente con Supabase PostgREST |

### `src/pages/HomeDetails.tsx` — 552 líneas ❌ CRÍTICO
| Problema | Descripción |
|---|---|
| Tamaño excesivo | 552 líneas — 3.7x el límite |
| Estado complejo | 10+ variables de estado (`roomDialogOpen`, `applianceDialogOpen`, `editDialogOpen`, etc.) |
| `confirm()` nativo | Línea 183 usa `window.confirm()` — inconsistente con el resto del UI |
| `error: any` | Múltiples catch blocks sin tipo |
| Dialogs duplicados | `<Dialog>` para RoomForm aparece dos veces (líneas 317–330 y 339–352) |
| Sin hook | Lógica de datos Supabase completamente inline |

### `src/pages/RoomDetails.tsx` — 351 líneas ⚠️ MODERADO
| Problema | Descripción |
|---|---|
| `error: any` | Catch blocks sin tipo |
| `value: any` | `onValueChange={(value: any) => setSortBy(value)}` — cast innecesario |
| Sin protección de auth | No verifica redirect si `!user` (a diferencia de Dashboard y Homes) |
| Sin hook | Lógica de datos inline |

### `src/pages/Profile.tsx` — 373 líneas ⚠️ MODERADO
| Problema | Descripción |
|---|---|
| `saving` compartido | Una sola variable `saving` para 3 formularios independientes — race condition potencial |
| Sin hook | Lógica Supabase inline |

### `src/pages/Homes.tsx` — 198 líneas ✅ Aceptable
| Problema | Descripción |
|---|---|
| `error: any` | Catch block sin tipo |
| Navbar duplicada | Mismo nav que Dashboard/Profile |
| Sin hook | `fetchHogares` inline |

### `src/hooks/useAuth.tsx` — 127 líneas ⚠️ MODERADO
| Problema | Descripción |
|---|---|
| Navegación en hook | `navigate("/dashboard")` y `navigate("/auth")` dentro del hook de auth — acopla auth a rutas |
| `useNavigate` en provider | El `AuthProvider` depende de React Router — no puede usarse fuera de `<Router>` |

### Componentes Form (`ApplianceForm`, `HomeForm`, `RoomForm`, etc.)
| Problema | Descripción |
|---|---|
| Todos >150 líneas | `HomeEditForm` 217l, `HomeForm` 204l, `ApplianceForm` 204l |
| `error: any` | En todos los catch blocks |

---

## 2. Problemas de Arquitectura

### Sin separación features/UI
```
src/components/
├── ui/           ✅ Componentes base (shadcn)
├── ApplianceForm.tsx  ❌ Debería estar en features/
├── HomeForm.tsx       ❌ Debería estar en features/
└── ...
```

### Sin Custom Hooks
Toda la lógica de Supabase vive inline en páginas. Faltan:
- `useHogares` — gestión de hogares con fetch/mutation
- `useDashboardData` — cálculo y fetch del dashboard
- `useHomeDetails` — datos de un hogar específico
- `useAppliances` — electrodomésticos de una habitación

### Navbar sin componente compartido
La misma navbar `<nav>` aparece copiada en: `Dashboard.tsx`, `Homes.tsx`, `Profile.tsx`

---

## 3. Problemas de Datos

### Datos Mock en Producción
```typescript
// Dashboard.tsx:200-213 — DATOS FALSOS CON RANDOM
const variation = (Math.random() - 0.5) * 0.3;
mockDailyData.push({ consumo: Math.round(dayConsumption * (1 + variation)) });
```
La tabla `consumo_diario` existe en Supabase pero no se consulta desde el dashboard.

### Tarifa Hardcodeada
```typescript
const estimatedCost = Math.round(totalConsumption * 150); // CLP hardcodeado
```
La tabla `tarifas_electricas` existe pero no se usa.

### Meta Hardcodeada
```typescript
const monthlyGoal = 400; // kWh hardcodeado
```
La tabla `metas_consumo` existe pero no se usa.

---

## 4. Seguridad

### RLS No Configurado
Las tablas de datos de usuario **no tienen Row Level Security activo**. Cualquier usuario autenticado podría leer/escribir datos de otros usuarios. Ver `LOGVOLT_RLS_POLICIES.sql` para las políticas necesarias.

Tablas afectadas:
- `hogares` — tiene `usuario_id` pero sin política RLS
- `habitaciones` — acceso vía `hogar_id` chain
- `electrodomesticos` — acceso vía `habitacion_id` chain
- `alertas`, `metas_consumo`, `recomendaciones` — acceso vía `hogar_id`
- `cambios_electrodomestico` — tiene `usuario_id` pero sin política
- `consumo_diario` — acceso vía cadena de FKs
- `profiles` — debería ser solo lectura propia

---

## 5. Acciones Tomadas en esta Refactorización

### Nuevos archivos creados
| Archivo | Descripción |
|---|---|
| `src/hooks/useDashboardData.ts` | Extrae toda la lógica de fetch del dashboard |
| `src/hooks/useHogares.ts` | Fetch y estado de la lista de hogares |
| `src/hooks/useHomeDetails.ts` | Datos de un hogar y sus habitaciones |
| `src/hooks/useAppliances.ts` | Electrodomésticos de una habitación |
| `src/components/shared/Navbar.tsx` | Navbar compartida para todas las páginas auth |
| `src/components/features/dashboard/StatsOverview.tsx` | Cards de métricas del dashboard |
| `src/components/features/dashboard/ConsumptionTables.tsx` | Tablas detalladas de consumo |
| `src/components/features/dashboard/RecommendationsCard.tsx` | Card de recomendaciones |
| `LOGVOLT_RLS_POLICIES.sql` | Políticas RLS para Supabase |

### Cambios en archivos existentes
| Archivo | Cambio |
|---|---|
| `Dashboard.tsx` | Reducido de 676 → ~120 líneas usando hooks y sub-componentes |
| `HomeDetails.tsx` | Reducido de 552 → ~200 líneas, eliminado `confirm()`, `error: any` |
| `RoomDetails.tsx` | Eliminado `error: any`, cast `any` en select, agregado guard auth |
| `Homes.tsx` | Extraído a `useHogares`, navbar → componente compartido |
| `Profile.tsx` | `saving` separado por formulario |

---

## 6. Trabajo Futuro (No implementado en esta rama)

- [ ] Conectar `consumo_diario` real al gráfico de línea en Dashboard
- [ ] Usar `metas_consumo` de Supabase en vez de `monthlyGoal = 400`
- [ ] Calcular `estimatedCost` con `tarifas_electricas` reales
- [ ] Aplicar las políticas RLS del archivo SQL en el dashboard de Supabase
- [ ] Tests unitarios para custom hooks
- [ ] Migrar `AuthProvider` para no depender de `useNavigate` internamente
