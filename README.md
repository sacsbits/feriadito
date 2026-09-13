<div align="center">

# 🦌 feriadito.cl

**Cuántos días faltan para el próximo feriado en Chile.**

[feriadito.cl](https://feriadito.cl) · Rápido, sin publicidad, sin cookies, sin rastreo.

</div>

---

## Qué es

Una página que responde una sola pregunta bien: **¿cuánto falta para el próximo feriado?**

Muestra el countdown y el listado completo del año. Al tocar cualquier feriado de la
lista, el contador se actualiza y muestra los días que faltan —o los que pasaron— para ese.

Nació como alternativa a las páginas de feriados que ya existían: lentas, anticuadas y
llenas de publicidad. La idea acá es la contraria — que cargue instantáneo, no pida
consentimiento de cookies porque no guarda nada, y se lea bien en el celular.

> **Estado:** reescritura en curso. La versión en producción todavía es la implementación
> original en Vue + Vuetify. Este repo contiene la nueva, en Astro. Ver el
> [plan por fases](CLAUDE.md#11-plan-por-fases).

## API pública

Los datos de feriados están disponibles gratis, sin API key y sin límite de uso:

```
https://feriadito.cl/api/feriados.json          → todos los años
https://feriadito.cl/api/feriados/2026.json     → un año específico
```

```json
{
  "anio": 2026,
  "cantidad": 16,
  "actualizado": "2026-09-13",
  "feriados": [
    {
      "fecha": "2026-01-01",
      "nombre": "Año Nuevo",
      "slug": "ano-nuevo",
      "tipo": "Civil",
      "irrenunciable": true
    }
  ]
}
```

| Campo | Descripción |
|---|---|
| `fecha` | ISO 8601 (`AAAA-MM-DD`) |
| `nombre` | Nombre oficial del feriado |
| `slug` | Identificador estable, útil para agrupar el mismo feriado entre años |
| `tipo` | `Civil` o `Religioso` |
| `irrenunciable` | Si es feriado irrenunciable según la Ley 19.973 |
| `extraordinario` | Presente solo si es un feriado de una vez (elecciones, plebiscitos) |
| `provisional` | A nivel de año: `true` si todavía no hay fuente autorizada |

Son archivos estáticos servidos por CDN. Úsalos libremente — y si te sirven, un link de
vuelta se agradece.

## De dónde salen los datos

**La API oficial del Estado (`apis.digital.gob.cl`) dejó de existir**: el subdominio ya no
tiene registro DNS. Por eso los datos se reconcilian entre varias fuentes y viven
**versionados en este repo**, no se consultan en tiempo real.

| Fuente | Aporta |
|---|---|
| [api.boostr.cl](https://api.boostr.cl) | Nombres, tipo, irrenunciabilidad y feriados extraordinarios |
| [date.nager.at](https://date.nager.at) | Verificación de fechas. Aplica correctamente la Ley 19.973 de traslado a lunes |
| Consistencia entre años | Detecta errores que ninguna fuente reporta (ver abajo) |
| [`data/correcciones.json`](data/correcciones.json) | Overrides manuales justificados uno por uno |

Esto importa más de lo que parece. Ejemplos reales que el pipeline detectó y corrigió:

- **Boostr clasifica mal 18 feriados** en 2026 y 2027 — marca como `Civil` feriados que
  son `Religioso` en todos los años anteriores. Se corrige por votación entre años.
- **A Boostr le falta el Plebiscito Constitucional** del 4 de septiembre de 2022, que fue
  feriado legal e irrenunciable.
- **Boostr escribe "Ejercito" sin tilde** en 2022, lo que generaba dos identificadores
  distintos para el mismo feriado.

El detalle completo está en [`docs/REPORTE-DATOS.md`](docs/REPORTE-DATOS.md), que se
regenera en cada sincronización.

### Por qué no se consulta una API en cada visita

1. Le regalaría el uptime del sitio a un tercero — y la fuente oficial ya se cayó una vez,
   para siempre.
2. Sumaría cientos de milisegundos a cada carga, para datos que cambian una vez al año.
3. Rompería el renderizado estático.

Un GitHub Action corre el pipeline a diario: si todas las fuentes coinciden, commitea el
cambio solo. Si se contradicen, abre un issue y **no publica nada**.

## Stack

| | |
|---|---|
| **Astro** | HTML estático, sin JavaScript de framework en el cliente |
| **TypeScript vanilla** | ~50 líneas para la interactividad del countdown |
| **CSS a mano** | Custom properties, sin framework de UI |
| **Cloudflare Pages** | Hosting estático y CDN |
| **GitHub Actions** | Sincronización de datos y rebuild diario |

Sin base de datos, sin backend, sin cookies, sin analítica invasiva.
Costo de operación: **US$0/mes**.

## Desarrollo

```bash
npm install
npm run dev          # servidor local
npm run build        # build de producción
npm run sync         # re-sincroniza los datos de feriados
```

Para el pipeline de datos:

```bash
node scripts/sync-feriados.mjs                      # rango por defecto
node scripts/sync-feriados.mjs --desde 2022 --hasta 2028
node scripts/sync-feriados.mjs --dry-run            # no escribe archivos
SIN_CACHE=1 node scripts/sync-feriados.mjs          # ignora la caché en disco
```

El script cachea las respuestas en `scripts/.cache/` — Boostr responde `429` si se le pega
seguido, así que la caché es lo que lo hace re-ejecutable.

## Estructura

```
data/feriados/*.json      Fuente de verdad, un archivo por año
data/correcciones.json    Overrides manuales, cada uno justificado
scripts/sync-feriados.mjs Pipeline de reconciliación
docs/REPORTE-DATOS.md     Reporte de discrepancias (autogenerado)
docs/PENDIENTES.md        Checklist de assets del proyecto
CLAUDE.md                 Contexto técnico completo del proyecto
```

## ¿Encontraste un feriado mal?

Abre un [issue](https://github.com/tombu-spa/feriadito/issues) o manda un PR a
[`data/correcciones.json`](data/correcciones.json). Cada corrección necesita una razón
verificable — idealmente el número de la ley o el decreto.

## Licencia

Código bajo [MIT](LICENSE).

**Los datos de feriados son información pública** —están definidos por ley— así que
puedes usarlos sin restricción alguna.

---

<div align="center">

Un proyecto de **Tombu SpA** · Hecho por **[Stefano Corsi](https://github.com/sacsbits)**

</div>
