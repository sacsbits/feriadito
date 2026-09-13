/**
 * Utilidades de fecha para feriadito.
 *
 * Regla central: TODO se calcula en `America/Santiago` y comparando **fechas de
 * calendario**, nunca timestamps. El sitio es estático y cacheado, así que el
 * mismo HTML lo ve alguien en Santiago a las 23:50 y alguien en Madrid a las
 * 05:50 del día siguiente: si se restan milisegundos, a uno de los dos le sale
 * mal la cuenta.
 *
 * (La versión anterior del sitio restaba milisegundos y compensaba con
 * `setDate(getDate() - 1)` y `Math.ceil`. El número cambiaba durante el día.)
 */

export const ZONA = 'America/Santiago';

/** Fecha de hoy en Chile, como `AAAA-MM-DD`. */
export function hoyEnChile(ahora: Date = new Date()): string {
  // `en-CA` formatea como AAAA-MM-DD, que es justo ISO 8601.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(ahora);
}

/** Convierte `AAAA-MM-DD` a un instante de medianoche UTC. */
function aMedianocheUTC(iso: string): number {
  const [anio, mes, dia] = iso.split('-').map(Number);
  return Date.UTC(anio!, mes! - 1, dia!);
}

/**
 * Días de calendario entre dos fechas ISO. Positivo si `hasta` es futuro.
 * Al anclar ambas a medianoche UTC, el horario de verano no altera el cálculo.
 */
export function diasEntre(desde: string, hasta: string): number {
  return Math.round((aMedianocheUTC(hasta) - aMedianocheUTC(desde)) / 86_400_000);
}

/** Año en curso según la hora de Chile. */
export function anioActual(ahora: Date = new Date()): number {
  return Number(hoyEnChile(ahora).slice(0, 4));
}

/** Construye un `Date` en UTC para formatear sin que se corra el día. */
function comoUTC(iso: string): Date {
  return new Date(iso + 'T12:00:00Z');
}

const mayuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** `2026-09-18` → `Viernes, 18 de septiembre` */
export function fechaLarga(iso: string): string {
  return mayuscula(
    new Intl.DateTimeFormat('es-CL', {
      timeZone: 'UTC',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(comoUTC(iso))
  );
}

/** `2026-09-18` → `Viernes, 18 de septiembre de 2026` */
export function fechaLargaConAnio(iso: string): string {
  return mayuscula(
    new Intl.DateTimeFormat('es-CL', {
      timeZone: 'UTC',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(comoUTC(iso))
  );
}

/** `2026-09-18` → `{ diaSemana: 'vie', diaMes: '18', mes: 'sep' }` — para el móvil */
export function fechaCompacta(iso: string): { diaSemana: string; diaMes: string; mes: string } {
  const fmt = (opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat('es-CL', { timeZone: 'UTC', ...opts }).format(comoUTC(iso));
  return {
    diaSemana: fmt({ weekday: 'short' }).replace('.', ''),
    diaMes: fmt({ day: 'numeric' }),
    mes: fmt({ month: 'short' }).replace('.', ''),
  };
}

/** Texto del contador: "Quedan 6 días", "Han pasado 162 días", "Hoy es feriado". */
export function textoContador(dias: number): { encabezado: string; pie: string } {
  if (dias === 0) return { encabezado: '', pie: '' };
  return dias > 0
    ? { encabezado: 'Quedan', pie: 'Días para' }
    : { encabezado: 'Han pasado', pie: 'Días desde' };
}
