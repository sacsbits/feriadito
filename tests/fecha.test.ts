import { hoyEnChile, diasEntre, fechaLarga, fechaCompacta, anioActual } from '../src/lib/fecha.ts';

let fallos = 0;
const test = (nombre: string, real: unknown, esperado: unknown) => {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) fallos++;
  console.log(`  ${ok ? '✓' : '✗'} ${nombre}`);
  if (!ok) console.log(`      esperado: ${JSON.stringify(esperado)}\n      real:     ${JSON.stringify(real)}`);
};

console.log('\n=== Zona horaria: el número NO debe cambiar durante el día ===');
// 12 sep 23:50 en Santiago = 13 sep 02:50 UTC (UTC-3)
test('23:50 en Chile sigue siendo el 12', hoyEnChile(new Date('2026-09-13T02:50:00Z')), '2026-09-12');
test('00:10 en Chile ya es el 13',        hoyEnChile(new Date('2026-09-13T03:10:00Z')), '2026-09-13');
test('mediodía en Chile',                  hoyEnChile(new Date('2026-09-12T15:00:00Z')), '2026-09-12');

console.log('\n=== Días entre fechas ===');
test('12 sep → 18 sep = 6',        diasEntre('2026-09-12', '2026-09-18'), 6);
test('mismo día = 0',              diasEntre('2026-09-18', '2026-09-18'), 0);
test('pasado es negativo',         diasEntre('2026-09-12', '2026-04-03'), -162);
test('cruza cambio de hora (sep)', diasEntre('2026-09-05', '2026-09-07'), 2);
test('cruza cambio de hora (abr)', diasEntre('2026-04-04', '2026-04-06'), 2);
test('cruza año nuevo',            diasEntre('2026-12-30', '2027-01-02'), 3);
test('año bisiesto',               diasEntre('2028-02-28', '2028-03-01'), 2);

console.log('\n=== Formato ===');
test('fecha larga',    fechaLarga('2026-09-18'), 'Viernes, 18 de septiembre');
test('fecha larga 2',  fechaLarga('2026-04-03'), 'Viernes, 3 de abril');
test('compacta',       fechaCompacta('2026-09-18'), { diaSemana: 'vie', diaMes: '18', mes: 'sept' });
test('compacta enero', fechaCompacta('2026-01-01'), { diaSemana: 'jue', diaMes: '1', mes: 'ene' });
test('año actual',     anioActual(new Date('2026-09-12T15:00:00Z')), 2026);

console.log(fallos ? `\n✗ ${fallos} fallos\n` : '\n✓ Todo correcto\n');
process.exit(fallos ? 1 : 0);
