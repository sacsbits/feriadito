/** Carga y consulta de los feriados. Todo se resuelve en tiempo de build. */

import { anioActual, diasEntre, hoyEnChile } from './fecha.ts';

export interface Feriado {
  fecha: string;          // ISO 8601, AAAA-MM-DD
  nombre: string;
  slug: string;
  tipo: 'Civil' | 'Religioso';
  irrenunciable: boolean;
  extraordinario?: boolean;
  inferido?: boolean;
}

export interface AnioDeFeriados {
  anio: number;
  cantidad: number;
  provisional: boolean;
  actualizado: string;
  fuentes: string[];
  feriados: Feriado[];
}

// Vite resuelve esto en build: los JSON quedan incrustados en el HTML,
// no hay ninguna petición de red en tiempo de ejecución.
const archivos = import.meta.glob<AnioDeFeriados>('../../data/feriados/*.json', {
  eager: true,
  import: 'default',
});

const porAnio = new Map<number, AnioDeFeriados>(
  Object.values(archivos).map((a) => [a.anio, a])
);

/** Años disponibles, de menor a mayor. */
export const aniosDisponibles = [...porAnio.keys()].sort((a, b) => a - b);

export function feriadosDe(anio: number): AnioDeFeriados | undefined {
  return porAnio.get(anio);
}

/** Todos los feriados de todos los años, ordenados por fecha. */
export function todosLosFeriados(): Feriado[] {
  return aniosDisponibles.flatMap((a) => porAnio.get(a)!.feriados);
}

/**
 * El próximo feriado a partir de hoy. Un feriado que es HOY cuenta como el
 * próximo (diferencia 0), que es lo que corresponde mostrar: "Hoy es feriado".
 */
export function proximoFeriado(hoy: string = hoyEnChile()): Feriado | undefined {
  return todosLosFeriados().find((f) => diasEntre(hoy, f.fecha) >= 0);
}

/** El año que se muestra por defecto, acotado a los años que existen. */
export function anioPorDefecto(): number {
  const actual = anioActual();
  if (porAnio.has(actual)) return actual;
  return aniosDisponibles[aniosDisponibles.length - 1]!;
}

/** Feriados recurrentes, para las páginas perennes de /feriados/[slug]. */
export function feriadosRecurrentes(): Map<string, Feriado[]> {
  const agrupados = new Map<string, Feriado[]>();
  for (const f of todosLosFeriados()) {
    if (f.extraordinario) continue;
    const lista = agrupados.get(f.slug) ?? [];
    lista.push(f);
    agrupados.set(f.slug, lista);
  }
  return agrupados;
}
