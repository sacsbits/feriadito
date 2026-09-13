/**
 * Calcula fines de semana largos y "puentes" a partir de los feriados.
 *
 * Un puente es un día hábil atrapado entre dos períodos libres: pidiéndolo de
 * vacaciones se obtienen varios días seguidos. Es la pregunta que la gente se
 * hace en enero —«¿cuándo conviene pedir vacaciones?»— y que ninguna tabla de
 * feriados responde.
 */

import { diasEntre } from './fecha.ts';
import type { Feriado } from './feriados.ts';

export interface Descanso {
  /** Primer día libre, ISO. */
  inicio: string;
  /** Último día libre, ISO. */
  fin: string;
  /** Total de días libres seguidos. */
  dias: number;
  /** Días hábiles que hay que pedir para lograrlo. 0 = sale gratis. */
  pedir: string[];
  /** Feriados que lo hacen posible. */
  feriados: Feriado[];
}

const DIA = 86_400_000;
const aUTC = (iso: string) => {
  const [a, m, d] = iso.split('-').map(Number);
  return Date.UTC(a!, m! - 1, d!);
};
const aISO = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const esFinDeSemana = (ms: number) => {
  const d = new Date(ms).getUTCDay();
  return d === 0 || d === 6;
};

/**
 * Encuentra los descansos de un año.
 *
 * @param feriados  Feriados del año, más los de los años vecinos para que los
 *                  puentes de fin de diciembre y principio de enero salgan bien.
 * @param maxPedir  Cuántos días de vacaciones se está dispuesto a gastar.
 */
export function calcularDescansos(
  anio: number,
  feriados: Feriado[],
  maxPedir = 2
): Descanso[] {
  const porFecha = new Map(feriados.map((f) => [f.fecha, f]));
  const esLibre = (ms: number) => esFinDeSemana(ms) || porFecha.has(aISO(ms));

  // Se recorre con margen a ambos lados para no cortar un descanso a fin de año
  const desde = aUTC(`${anio - 1}-12-01`);
  const hasta = aUTC(`${anio + 1}-01-31`);

  const descansos: Descanso[] = [];
  const vistos = new Set<string>();

  for (let ms = desde; ms <= hasta; ms += DIA) {
    if (!esLibre(ms)) continue;
    // Solo se procesa el comienzo de cada racha
    if (esLibre(ms - DIA)) continue;

    // Racha de días libres consecutivos
    let fin = ms;
    while (esLibre(fin + DIA)) fin += DIA;

    // Intenta encadenar con la siguiente racha pidiendo hasta `maxPedir` días
    for (let pedir = 0; pedir <= maxPedir; pedir++) {
      let finExtendido = fin;
      const pedidos: string[] = [];

      for (let i = 0; i < pedir; i++) {
        const siguiente = finExtendido + DIA;
        if (esLibre(siguiente)) break;
        pedidos.push(aISO(siguiente));
        finExtendido = siguiente;
      }
      if (pedidos.length !== pedir) continue;

      // Absorbe la racha libre que viene después de los días pedidos
      while (esLibre(finExtendido + DIA)) finExtendido += DIA;

      const inicioISO = aISO(ms);
      const finISO = aISO(finExtendido);
      const total = diasEntre(inicioISO, finISO) + 1;

      // Solo interesa si es fin de semana largo (3 días o más).
      if (total < 3) continue;
      // Si hay que pedir días, el canje tiene que valer la pena: al menos un
      // descanso de 3 días por sobre los días gastados. Con pedir = 1 eso es
      // el puente clásico —un día de vacaciones, cuatro libres seguidos.
      if (pedir > 0 && total < 3 + pedir) continue;

      const clave = `${inicioISO}|${finISO}|${pedir}`;
      if (vistos.has(clave)) continue;
      vistos.add(clave);

      const dentro = [...porFecha.values()].filter(
        (f) => diasEntre(inicioISO, f.fecha) >= 0 && diasEntre(f.fecha, finISO) >= 0
      );
      // Debe tocar el año consultado y apoyarse en al menos un feriado
      if (!dentro.some((f) => f.fecha.startsWith(String(anio)))) continue;

      descansos.push({
        inicio: inicioISO,
        fin: finISO,
        dias: total,
        pedir: pedidos,
        feriados: dentro.sort((a, b) => a.fecha.localeCompare(b.fecha)),
      });
    }
  }

  // Para un mismo inicio, deja la mejor opción de cada cantidad de días pedidos,
  // y descarta las que no mejoran nada respecto de no pedir ninguno.
  const mejores = new Map<string, Descanso>();
  for (const d of descansos) {
    const clave = `${d.inicio}|${d.pedir.length}`;
    const previo = mejores.get(clave);
    if (!previo || d.dias > previo.dias) mejores.set(clave, d);
  }

  const porInicio = new Map<string, Descanso[]>();
  for (const d of mejores.values()) {
    porInicio.set(d.inicio, [...(porInicio.get(d.inicio) ?? []), d]);
  }

  const resultado: Descanso[] = [];
  for (const grupo of porInicio.values()) {
    grupo.sort((a, b) => a.pedir.length - b.pedir.length);
    const base = grupo[0]!;
    resultado.push(base);
    for (const d of grupo.slice(1)) {
      if (d.dias > base.dias) resultado.push(d);
    }
  }

  return resultado.sort((a, b) => a.inicio.localeCompare(b.inicio));
}

/** Días libres ganados por cada día de vacaciones gastado. */
export function rendimiento(d: Descanso): number {
  return d.pedir.length === 0 ? Infinity : d.dias / d.pedir.length;
}
