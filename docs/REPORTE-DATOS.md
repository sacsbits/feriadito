# Reporte de datos de feriados

> Generado automáticamente por `scripts/sync-feriados.mjs` el 2026-09-13.
> **No editar a mano** — se regenera en cada sincronización.

## Fuentes

| Fuente | Estado | Cobertura | Aporta |
|---|---|---|---|
| `apis.digital.gob.cl` (oficial) | ❌ **Caída** — el subdominio ya no tiene registro DNS | — | — |
| `api.boostr.cl` | ✅ Operativa | 2022–2026 | nombres, tipo, irrenunciabilidad, feriados extraordinarios |
| `date.nager.at` | ✅ Operativa | 2022–2027+ | fechas (aplica bien la Ley 19.973 de traslado a lunes), marca los regionales |

La API oficial del Estado dejó de existir. Esto **valida la decisión de arquitectura**:
los datos se hornean en el build y viven versionados en el repo, así que la caída de un
tercero no afecta al sitio.

## Resumen por año

| Año | Feriados | Irrenunciables | Fuentes |
|---|---|---|---|
| 2022 | 18 | 6 | boostr + nager |
| 2023 | 17 | 5 | boostr + nager |
| 2024 | 20 | 7 | boostr + nager |
| 2025 | 17 | 6 | boostr + nager |
| 2026 | 16 | 5 | boostr + nager |
| 2027 | 17 | 5 | boostr + nager |

## Incidencias

| Año | Severidad | Feriado | Detalle |
|---|---|---|---|
| 2022 | 🔧 Corregido | Día de las Glorias del Ejercito | Renombrado a "Día de las Glorias del Ejército" por corrección manual. Falta la tilde en los datos de boostr para 2022. Sin corregir genera dos slugs distintos para el mismo feriado y rompe la página perenne. |
| 2022 | 🔧 Corregido | Plebiscito Constitucional | Agregado manualmente el 2022-09-04. Feriado legal e irrenunciable por la Ley 21.451. boostr lo omite; date.nager.at sí lo lista. PENDIENTE DE CONFIRMACIÓN por el dueño del proyecto. |
| 2022 | ℹ️ Informativo | 16 de Septiembre | boostr lo lista el 2022-09-16, nager no. Normal en feriados extraordinarios (elecciones, plebiscitos), que nager no cubre. |
| 2022 | ℹ️ Informativo | Plebiscito Constitucional | Marcado como extraordinario: aparece solo en 2022. No tendrá página perenne. Si en realidad es recurrente, revisar el nombre. |
| 2022 | ℹ️ Informativo | 16 de Septiembre | Marcado como extraordinario: aparece solo en 2022. No tendrá página perenne. Si en realidad es recurrente, revisar el nombre. |
| 2022 | ⚠️ Revisar | Plebiscito nacional | nager lo lista el 2022-09-04, boostr no lo tiene. Verificar si corresponde agregarlo. |
| 2023 | ℹ️ Informativo | Año Nuevo | boostr lo lista el 2023-01-01, nager no. Normal en feriados extraordinarios (elecciones, plebiscitos), que nager no cubre. |
| 2023 | ℹ️ Informativo | Feriado Adicional | Marcado como extraordinario: aparece solo en 2023. No tendrá página perenne. Si en realidad es recurrente, revisar el nombre. |
| 2024 | ℹ️ Informativo | Elecciones Primarias Alcaldes y Gobernadores | boostr lo lista el 2024-06-09, nager no. Normal en feriados extraordinarios (elecciones, plebiscitos), que nager no cubre. |
| 2024 | ℹ️ Informativo | Feriado Adicional Fiestas Patrias | boostr lo lista el 2024-09-20, nager no. Normal en feriados extraordinarios (elecciones, plebiscitos), que nager no cubre. |
| 2024 | ℹ️ Informativo | Elecciones Municipales, Consejeros Regionales y Gobernadores Regionales | boostr lo lista el 2024-10-27, nager no. Normal en feriados extraordinarios (elecciones, plebiscitos), que nager no cubre. |
| 2024 | ℹ️ Informativo | Segunda Vuelta Elección Gobernadores Regionales | boostr lo lista el 2024-11-24, nager no. Normal en feriados extraordinarios (elecciones, plebiscitos), que nager no cubre. |
| 2024 | ℹ️ Informativo | Elecciones Primarias Alcaldes y Gobernadores | Marcado como extraordinario: aparece solo en 2024. No tendrá página perenne. Si en realidad es recurrente, revisar el nombre. |
| 2024 | ℹ️ Informativo | Elecciones Municipales, Consejeros Regionales y Gobernadores Regionales | Marcado como extraordinario: aparece solo en 2024. No tendrá página perenne. Si en realidad es recurrente, revisar el nombre. |
| 2024 | ℹ️ Informativo | Segunda Vuelta Elección Gobernadores Regionales | Marcado como extraordinario: aparece solo en 2024. No tendrá página perenne. Si en realidad es recurrente, revisar el nombre. |
| 2025 | ℹ️ Informativo | Elecciones Presidenciales y Parlamentarias | boostr lo lista el 2025-11-16, nager no. Normal en feriados extraordinarios (elecciones, plebiscitos), que nager no cubre. |
| 2025 | ℹ️ Informativo | Elecciones Presidenciales y Parlamentarias | Marcado como extraordinario: aparece solo en 2025. No tendrá página perenne. Si en realidad es recurrente, revisar el nombre. |
| 2026 | 🔧 Corregido | Viernes Santo | boostr entregó tipo "Civil"; se corrigió a "Religioso" por consistencia con 4 año(s). |
| 2026 | 🔧 Corregido | San Pedro y San Pablo | boostr entregó tipo "Civil"; se corrigió a "Religioso" por consistencia con 4 año(s). |
| 2026 | 🔧 Corregido | Día de la Virgen del Carmen | boostr entregó tipo "Civil"; se corrigió a "Religioso" por consistencia con 4 año(s). |
| 2026 | 🔧 Corregido | Asunción de la Virgen | boostr entregó tipo "Civil"; se corrigió a "Religioso" por consistencia con 4 año(s). |
| 2026 | 🔧 Corregido | Día de las Iglesias Evangélicas y Protestantes | boostr entregó tipo "Civil"; se corrigió a "Religioso" por consistencia con 4 año(s). |
| 2026 | 🔧 Corregido | Día de Todos los Santos | boostr entregó tipo "Civil"; se corrigió a "Religioso" por consistencia con 4 año(s). |
| 2026 | 🔧 Corregido | Inmaculada Concepción | boostr entregó tipo "Civil"; se corrigió a "Religioso" por consistencia con 4 año(s). |
| 2026 | 🔧 Corregido | Navidad | boostr entregó tipo "Civil"; se corrigió a "Religioso" por consistencia con 4 año(s). |
| 2026 | 🔧 Corregido | Sábado Santo | boostr entregó tipo "Civil"; se corrigió a "Religioso" por consistencia con 3 año(s). |
| 2027 | 🔧 Corregido | Viernes Santo | boostr entregó tipo "Civil"; se corrigió a "Religioso" por consistencia con 4 año(s). |
| 2027 | 🔧 Corregido | San Pedro y San Pablo | boostr entregó tipo "Civil"; se corrigió a "Religioso" por consistencia con 4 año(s). |
| 2027 | 🔧 Corregido | Día de la Virgen del Carmen | boostr entregó tipo "Civil"; se corrigió a "Religioso" por consistencia con 4 año(s). |
| 2027 | 🔧 Corregido | Asunción de la Virgen | boostr entregó tipo "Civil"; se corrigió a "Religioso" por consistencia con 4 año(s). |
| 2027 | 🔧 Corregido | Día de las Iglesias Evangélicas y Protestantes | boostr entregó tipo "Civil"; se corrigió a "Religioso" por consistencia con 4 año(s). |
| 2027 | 🔧 Corregido | Día de Todos los Santos | boostr entregó tipo "Civil"; se corrigió a "Religioso" por consistencia con 4 año(s). |
| 2027 | 🔧 Corregido | Inmaculada Concepción | boostr entregó tipo "Civil"; se corrigió a "Religioso" por consistencia con 4 año(s). |
| 2027 | 🔧 Corregido | Navidad | boostr entregó tipo "Civil"; se corrigió a "Religioso" por consistencia con 4 año(s). |
| 2027 | 🔧 Corregido | Sábado Santo | boostr entregó tipo "Civil"; se corrigió a "Religioso" por consistencia con 3 año(s). |
| 2027 | ℹ️ Informativo | Feriado Adicional Fiestas Patrias | boostr lo lista el 2027-09-17, nager no. Normal en feriados extraordinarios (elecciones, plebiscitos), que nager no cubre. |

### Qué significa cada severidad

- **🔧 Corregido** — se detectó y arregló automáticamente. No requiere acción.
- **⚠️ Revisar** — necesita validación humana antes de publicar.
- **ℹ️ Informativo** — diferencia esperada entre fuentes, sin acción.

## Notas

- **Feriados regionales excluidos.** nager.date incluye "Asalto y Toma del Morro de Arica"
  (7 de junio, solo región de Arica y Parinacota). Se filtra por el campo `counties`,
  porque el sitio lista feriados **nacionales**.
- **Feriados extraordinarios.** Elecciones y plebiscitos son feriados por ley y ninguna
  regla los predice. Solo boostr los tiene, así que los años sin boostr quedan marcados
  como `provisional`.
- **Irrenunciables.** La lista cambió por ley con el tiempo — no extrapolar hacia atrás.
