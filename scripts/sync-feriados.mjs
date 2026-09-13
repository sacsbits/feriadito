#!/usr/bin/env node
/**
 * Sincroniza y reconcilia los feriados de Chile desde múltiples fuentes.
 *
 * Genera `data/feriados/AAAA.json` y un reporte de discrepancias en
 * `docs/REPORTE-DATOS.md`.
 *
 * Contexto: la API oficial del Estado (apis.digital.gob.cl) dejó de existir
 * —el subdominio ya no tiene registro DNS—, así que se reconcilian dos fuentes
 * públicas más una verificación de consistencia entre años.
 *
 * Uso:  node scripts/sync-feriados.mjs [--desde 2022] [--hasta 2027] [--dry-run]
 */

import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Fecha de hoy en Chile, como AAAA-MM-DD.
 * No se usa toISOString(): es UTC, y de noche en Chile daría el día siguiente.
 * Todo el proyecto fecha en America/Santiago.
 */
const hoyEnChile = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());

// ─────────────────────────── Configuración ───────────────────────────

const FUENTES = {
  boostr: (anio) => `https://api.boostr.cl/holidays/${anio}.json`,
  nager: (anio) => `https://date.nager.at/api/v3/PublicHolidays/${anio}/CL`,
};

/**
 * nager.date usa otra nomenclatura. Se mapea explícitamente en vez de hacer
 * fuzzy matching: son pocos casos y así queda auditable.
 * La nomenclatura canónica es la de Boostr, que es la que ya muestra el sitio.
 */
const ALIAS_NAGER = {
  'Día del Trabajo': 'Día Nacional del Trabajo',
  'Virgen del Carmen': 'Día de la Virgen del Carmen',
  'Fiestas Patrias': 'Independencia Nacional',
  'Día del Descubrimiento de Dos Mundos': 'Encuentro de Dos Mundos',
  'Día Nacional de las Iglesias Evangélicas y Protestantes':
    'Día de las Iglesias Evangélicas y Protestantes',
  'Navidad / Natividad del Señor': 'Navidad',
};

// ─────────────────────────── Utilidades ───────────────────────────

/** "Día de la Virgen del Carmen" → "dia-de-la-virgen-del-carmen" */
function aSlug(texto) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // saca tildes
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const CACHE = resolve(RAIZ, 'scripts/.cache');
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Trae una URL con caché en disco y reintentos con backoff exponencial.
 * Boostr responde 429 si se le pega seguido, así que la caché no es una
 * optimización: es lo que hace que el script sea re-ejecutable.
 */
async function traer(url, { intentos = 4 } = {}) {
  const llave = resolve(CACHE, url.replace(/[^a-z0-9]+/gi, '_') + '.json');

  if (!process.env.SIN_CACHE) {
    try {
      return JSON.parse(await readFile(llave, 'utf8'));
    } catch {
      /* sin caché, se descarga */
    }
  }

  let ultimoError;
  for (let intento = 1; intento <= intentos; intento++) {
    try {
      const res = await fetch(url, {
        headers: { 'user-agent': 'feriadito.cl (+https://github.com/tombu-spa/feriadito)' },
        signal: AbortSignal.timeout(25_000),
      });
      if (res.status === 429 || res.status >= 500) {
        throw new Error(`HTTP ${res.status}`);
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      await mkdir(CACHE, { recursive: true });
      await writeFile(llave, JSON.stringify(json));
      return json;
    } catch (e) {
      ultimoError = e;
      if (intento < intentos) await dormir(1500 * 2 ** (intento - 1));
    }
  }
  throw new Error(`${ultimoError.message} en ${url} (tras ${intentos} intentos)`);
}

// ─────────────────────────── Carga de fuentes ───────────────────────────

async function cargarBoostr(anio) {
  try {
    const json = await traer(FUENTES.boostr(anio));
    const data = Array.isArray(json?.data) ? json.data : [];
    return data.map((h) => ({
      fecha: h.date,
      nombre: h.title,
      tipo: h.type,
      irrenunciable: Boolean(h.inalienable),
    }));
  } catch (e) {
    console.warn(`  ⚠ boostr ${anio}: ${e.message}`);
    return null;
  }
}

async function cargarNager(anio) {
  try {
    const data = await traer(FUENTES.nager(anio));
    return data
      // Filtra los feriados REGIONALES (ej. Morro de Arica, solo CL-AP).
      // El sitio lista feriados nacionales; los regionales son otra sección.
      .filter((h) => h.global !== false && !h.counties)
      .map((h) => ({
        fecha: h.date,
        nombre: ALIAS_NAGER[h.localName] ?? h.localName,
        nombreOriginal: h.localName,
      }));
  } catch (e) {
    console.warn(`  ⚠ nager ${anio}: ${e.message}`);
    return null;
  }
}

// ─────────────────────────── Reconciliación ───────────────────────────

/**
 * Boostr tiene el campo `tipo` corrupto en algunos años (en 2026 marca todo
 * como "Civil"). Se corrige por votación entre años: un feriado que es
 * Religioso en 4 años no pasa a ser Civil en el quinto.
 */
function corregirTipos(porAnio, incidencias) {
  const tiposPorNombre = {};
  for (const [anio, feriados] of Object.entries(porAnio)) {
    for (const f of feriados ?? []) {
      (tiposPorNombre[f.nombre] ||= []).push({ anio, tipo: f.tipo });
    }
  }

  const canonico = {};
  for (const [nombre, observaciones] of Object.entries(tiposPorNombre)) {
    const conteo = {};
    for (const o of observaciones) conteo[o.tipo] = (conteo[o.tipo] ?? 0) + 1;
    const [ganador] = Object.entries(conteo).sort((a, b) => b[1] - a[1])[0];
    canonico[nombre] = ganador;

    if (Object.keys(conteo).length > 1) {
      for (const o of observaciones.filter((o) => o.tipo !== ganador)) {
        incidencias.push({
          anio: Number(o.anio),
          severidad: 'corregido',
          feriado: nombre,
          detalle: `boostr entregó tipo "${o.tipo}"; se corrigió a "${ganador}" ` +
            `por consistencia con ${observaciones.filter((x) => x.tipo === ganador).length} año(s).`,
        });
      }
    }
  }

  for (const feriados of Object.values(porAnio)) {
    for (const f of feriados ?? []) f.tipo = canonico[f.nombre];
  }
  return canonico;
}

/**
 * Para los años que solo tiene nager (sin tipo ni irrenunciable), se heredan
 * esos atributos del mismo feriado en años anteriores.
 */
function completarDesdeCatalogo(feriadosNager, catalogo, anio, incidencias) {
  return feriadosNager.map((f) => {
    const conocido = catalogo[f.nombre];
    if (!conocido) {
      incidencias.push({
        anio,
        severidad: 'revisar',
        feriado: f.nombre,
        detalle: `Feriado desconocido (nager lo llama "${f.nombreOriginal}"). ` +
          `No aparece en años anteriores: verificar nombre, tipo e irrenunciabilidad a mano.`,
      });
      return { fecha: f.fecha, nombre: f.nombre, tipo: 'Civil', irrenunciable: false, _inferido: true };
    }
    return {
      fecha: f.fecha,
      nombre: f.nombre,
      tipo: conocido.tipo,
      irrenunciable: conocido.irrenunciable,
      _inferido: true,
    };
  });
}

/**
 * Compara fechas entre fuentes y registra lo que no calza.
 *
 * `yaResueltas` son las fechas que ya se agregaron a mano en correcciones.json:
 * sin eso, una omisión ya arreglada se seguiría reportando como pendiente para
 * siempre y la sincronización nunca podría publicarse sin intervención.
 */
function contrastarFuentes(anio, base, nager, incidencias, yaResueltas = new Set()) {
  if (!nager) return;
  const enBase = new Map(base.map((f) => [f.fecha, f]));
  const enNager = new Map(nager.map((f) => [f.fecha, f]));

  for (const [fecha, f] of enNager) {
    if (!enBase.has(fecha)) {
      const resuelta = yaResueltas.has(fecha);
      incidencias.push({
        anio,
        severidad: resuelta ? 'info' : 'revisar',
        feriado: f.nombre,
        detalle: resuelta
          ? `nager lo lista el ${fecha} y boostr no, pero ya está agregado a mano en correcciones.json.`
          : `nager lo lista el ${fecha}, boostr no lo tiene. Verificar si corresponde agregarlo.`,
      });
    }
  }
  for (const [fecha, f] of enBase) {
    if (!enNager.has(fecha)) {
      incidencias.push({
        anio, severidad: 'info', feriado: f.nombre,
        detalle: `boostr lo lista el ${fecha}, nager no. Normal en feriados extraordinarios ` +
          `(elecciones, plebiscitos), que nager no cubre.`,
      });
    }
  }
}

// ─────────────────────────── Principal ───────────────────────────

const args = process.argv.slice(2);
const valor = (bandera, def) => {
  const i = args.indexOf(bandera);
  return i >= 0 ? Number(args[i + 1]) : def;
};
const DESDE = valor('--desde', 2022);
const HASTA = valor('--hasta', new Date().getFullYear() + 1);
const DRY_RUN = args.includes('--dry-run');

console.log(`\n▶ Sincronizando feriados ${DESDE}–${HASTA}${DRY_RUN ? ' (dry-run)' : ''}\n`);

const incidencias = [];

// Overrides manuales (ver data/correcciones.json)
let correcciones = { renombrar: {}, agregar: [] };
try {
  correcciones = JSON.parse(await readFile(resolve(RAIZ, 'data/correcciones.json'), 'utf8'));
} catch {
  console.warn('  ⚠ Sin data/correcciones.json, se sigue sin overrides');
}
const anios = Array.from({ length: HASTA - DESDE + 1 }, (_, i) => DESDE + i);

// 1. Descargar todas las fuentes
const crudo = {};
for (const anio of anios) {
  process.stdout.write(`  ${anio} … `);
  const [boostr, nager] = await Promise.all([cargarBoostr(anio), cargarNager(anio)]);
  await dormir(400); // respeta el rate limit de boostr
  crudo[anio] = { boostr, nager };
  console.log(`boostr: ${boostr?.length ?? '✗'}  |  nager: ${nager?.length ?? '✗'}`);
}

// 2. Corregir tipos usando solo los años que tienen datos de boostr
const conBoostr = Object.fromEntries(
  Object.entries(crudo).filter(([, v]) => v.boostr?.length).map(([a, v]) => [a, v.boostr])
);
corregirTipos(conBoostr, incidencias);

// 3. Catálogo de feriados recurrentes (nombre → tipo + irrenunciable)
const catalogo = {};
for (const feriados of Object.values(conBoostr)) {
  for (const f of feriados) {
    catalogo[f.nombre] ||= { tipo: f.tipo, irrenunciable: f.irrenunciable };
  }
}

// 4. Consolidar por año
const resultado = {};
for (const anio of anios) {
  const { boostr, nager } = crudo[anio];
  let feriados;

  if (boostr?.length) {
    feriados = boostr;
    const yaResueltas = new Set((correcciones.agregar ?? []).map((c) => c.fecha));
    contrastarFuentes(anio, feriados, nager, incidencias, yaResueltas);
  } else if (nager?.length) {
    feriados = completarDesdeCatalogo(nager, catalogo, anio, incidencias);
    incidencias.push({
      anio, severidad: 'revisar', feriado: '(todo el año)',
      detalle: `Boostr todavía no publica ${anio}. Los datos vienen solo de nager.date y el ` +
        `tipo/irrenunciabilidad se infirió de años anteriores. Faltarían feriados ` +
        `extraordinarios (elecciones) si los hubiera. Revisar antes de publicar.`,
    });
  } else {
    console.log(`  ⏭  ${anio}: sin datos en ninguna fuente, se omite`);
    continue;
  }

  // Correcciones manuales: renombrar
  for (const f of feriados) {
    const fix = correcciones.renombrar?.[f.nombre];
    if (fix) {
      incidencias.push({
        anio, severidad: 'corregido', feriado: f.nombre,
        detalle: `Renombrado a "${fix.a}" por corrección manual. ${fix.razon}`,
      });
      f.nombre = fix.a;
    }
  }

  // Correcciones manuales: agregar feriados que las fuentes omiten
  for (const extra of correcciones.agregar ?? []) {
    if (extra.anio !== anio) continue;
    if (feriados.some((f) => f.fecha === extra.fecha)) continue;
    feriados.push({
      fecha: extra.fecha, nombre: extra.nombre,
      tipo: extra.tipo, irrenunciable: extra.irrenunciable,
    });
    incidencias.push({
      anio, severidad: 'corregido', feriado: extra.nombre,
      detalle: `Agregado manualmente el ${extra.fecha}. ${extra.razon}`,
    });
  }

  feriados.sort((a, b) => a.fecha.localeCompare(b.fecha));
  resultado[anio] = feriados.map((f) => ({
    fecha: f.fecha,
    nombre: f.nombre,
    slug: aSlug(f.nombre),
    tipo: f.tipo,
    irrenunciable: f.irrenunciable,
    ...(f._inferido ? { inferido: true } : {}),
  }));
}

// 4b. Marcar feriados extraordinarios (elecciones, plebiscitos, feriados puente).
// Criterio: el slug aparece en un solo año de todo el dataset. Los recurrentes
// tendrán página perenne en /feriados/[slug]; los extraordinarios no.
const aniosPorSlug = {};
for (const [anio, feriados] of Object.entries(resultado)) {
  for (const f of feriados) (aniosPorSlug[f.slug] ||= new Set()).add(anio);
}
for (const [anio, feriados] of Object.entries(resultado)) {
  for (const f of feriados) {
    if (aniosPorSlug[f.slug].size === 1) {
      f.extraordinario = true;
      incidencias.push({
        anio: Number(anio), severidad: 'info', feriado: f.nombre,
        detalle: `Marcado como extraordinario: aparece solo en ${anio}. ` +
          `No tendrá página perenne. Si en realidad es recurrente, revisar el nombre.`,
      });
    }
  }
}

// 5. Escribir archivos
if (!DRY_RUN) {
  await mkdir(resolve(RAIZ, 'data/feriados'), { recursive: true });
  for (const [anio, feriados] of Object.entries(resultado)) {
    const ruta = resolve(RAIZ, `data/feriados/${anio}.json`);

    // `actualizado` solo avanza cuando los feriados cambian de verdad. Si se
    // pusiera la fecha de hoy en cada corrida, la sincronización diaria
    // generaría un commit de ruido todos los días aunque no cambiara nada.
    let actualizado = hoyEnChile();
    try {
      const previo = JSON.parse(await readFile(ruta, 'utf8'));
      if (JSON.stringify(previo.feriados) === JSON.stringify(feriados)) {
        actualizado = previo.actualizado ?? actualizado;
      }
    } catch {
      /* archivo nuevo */
    }

    const esProvisional = feriados.some((f) => f.inferido);
    const payload = {
      anio: Number(anio),
      cantidad: feriados.length,
      // `provisional` = todavía no hay fuente autorizada para este año.
      // Las fechas fijas y las derivadas de Pascua son confiables; podrían
      // faltar feriados extraordinarios (elecciones, plebiscitos).
      provisional: esProvisional,
      actualizado,
      fuentes: crudo[anio].boostr?.length ? ['api.boostr.cl', 'date.nager.at'] : ['date.nager.at'],
      feriados,
    };
    await writeFile(ruta, JSON.stringify(payload, null, 2) + '\n');
  }
}

// 6. Resumen en consola
console.log(`\n▶ Resultado\n`);
for (const [anio, feriados] of Object.entries(resultado)) {
  const irr = feriados.filter((f) => f.irrenunciable).length;
  const inf = feriados.some((f) => f.inferido) ? '  ⚠ inferido' : '';
  console.log(`  ${anio}: ${String(feriados.length).padStart(2)} feriados, ${irr} irrenunciables${inf}`);
}

const porSeveridad = (s) => incidencias.filter((i) => i.severidad === s).length;
console.log(
  `\n▶ Incidencias: ${porSeveridad('corregido')} corregidas · ` +
  `${porSeveridad('revisar')} por revisar · ${porSeveridad('info')} informativas\n`
);

// 7. Reporte de discrepancias para revisión humana
if (!DRY_RUN) {
  const hoy = hoyEnChile();
  const sev = { corregido: '🔧 Corregido', revisar: '⚠️ Revisar', info: 'ℹ️ Informativo' };

  const filas = incidencias
    .sort((a, b) => a.anio - b.anio || a.severidad.localeCompare(b.severidad))
    .map((i) => `| ${i.anio} | ${sev[i.severidad]} | ${i.feriado} | ${i.detalle} |`)
    .join('\n');

  const resumen = Object.entries(resultado)
    .map(([anio, f]) => {
      const irr = f.filter((x) => x.irrenunciable).length;
      const prov = f.some((x) => x.inferido) ? ' ⚠️ **provisional**' : '';
      return `| ${anio} | ${f.length} | ${irr} | ${crudo[anio].boostr?.length ? 'boostr + nager' : 'solo nager'}${prov} |`;
    })
    .join('\n');

  const md = `# Reporte de datos de feriados

> Generado automáticamente por \`scripts/sync-feriados.mjs\` el ${hoy}.
> **No editar a mano** — se regenera en cada sincronización.

## Fuentes

| Fuente | Estado | Cobertura | Aporta |
|---|---|---|---|
| \`apis.digital.gob.cl\` (oficial) | ❌ **Caída** — el subdominio ya no tiene registro DNS | — | — |
| \`api.boostr.cl\` | ✅ Operativa | ${DESDE}–2026 | nombres, tipo, irrenunciabilidad, feriados extraordinarios |
| \`date.nager.at\` | ✅ Operativa | ${DESDE}–${HASTA}+ | fechas (aplica bien la Ley 19.973 de traslado a lunes), marca los regionales |

La API oficial del Estado dejó de existir. Esto **valida la decisión de arquitectura**:
los datos se hornean en el build y viven versionados en el repo, así que la caída de un
tercero no afecta al sitio.

## Resumen por año

| Año | Feriados | Irrenunciables | Fuentes |
|---|---|---|---|
${resumen}

## Incidencias

| Año | Severidad | Feriado | Detalle |
|---|---|---|---|
${filas || '| — | — | — | Sin incidencias |'}

### Qué significa cada severidad

- **🔧 Corregido** — se detectó y arregló automáticamente. No requiere acción.
- **⚠️ Revisar** — necesita validación humana antes de publicar.
- **ℹ️ Informativo** — diferencia esperada entre fuentes, sin acción.

## Notas

- **Feriados regionales excluidos.** nager.date incluye "Asalto y Toma del Morro de Arica"
  (7 de junio, solo región de Arica y Parinacota). Se filtra por el campo \`counties\`,
  porque el sitio lista feriados **nacionales**.
- **Feriados extraordinarios.** Elecciones y plebiscitos son feriados por ley y ninguna
  regla los predice. Solo boostr los tiene, así que los años sin boostr quedan marcados
  como \`provisional\`.
- **Irrenunciables.** La lista cambió por ley con el tiempo — no extrapolar hacia atrás.
`;

  await mkdir(resolve(RAIZ, 'docs'), { recursive: true });
  await writeFile(resolve(RAIZ, 'docs/REPORTE-DATOS.md'), md);
  console.log('▶ Reporte escrito en docs/REPORTE-DATOS.md\n');
}

// 8. Resumen legible por máquina, para que el workflow decida qué hacer:
// commitear directo o abrir un PR para revisión humana.
if (!DRY_RUN) {
  const porRevisar = incidencias.filter((i) => i.severidad === 'revisar');
  const resumen = {
    generado: new Date().toISOString(), // instante exacto, en UTC a propósito
    anios: Object.keys(resultado).map(Number),
    totalFeriados: Object.values(resultado).reduce((n, f) => n + f.length, 0),
    aniosProvisionales: Object.entries(resultado)
      .filter(([, f]) => f.some((x) => x.inferido))
      .map(([a]) => Number(a)),
    incidencias: {
      corregidas: incidencias.filter((i) => i.severidad === 'corregido').length,
      porRevisar: porRevisar.length,
      informativas: incidencias.filter((i) => i.severidad === 'info').length,
    },
    // Si algo quedó por revisar, el cambio NO debe publicarse solo.
    requiereRevisionHumana: porRevisar.length > 0,
    detallePorRevisar: porRevisar,
  };
  await mkdir(resolve(RAIZ, 'scripts/.cache'), { recursive: true });
  await writeFile(
    resolve(RAIZ, 'scripts/.cache/resumen.json'),
    JSON.stringify(resumen, null, 2)
  );
}

export { resultado, incidencias };
