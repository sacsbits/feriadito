/**
 * Descripciones de los feriados recurrentes, para las páginas perennes.
 *
 * Se afirma solo lo verificable. Los patrones de traslado y de feriados
 * adicionales NO se enuncian como ley: cada página muestra la tabla de fechas
 * reales por año y el lector saca la conclusión. Las fechas vienen de
 * `data/feriados/`, así que la tabla no puede contradecir al sitio.
 */

export interface Descripcion {
  /** Frase de una línea, para el subtítulo y la meta description. */
  resumen: string;
  /** Párrafos del cuerpo. */
  cuerpo: string[];
}

export const DESCRIPCIONES: Record<string, Descripcion> = {
  'ano-nuevo': {
    resumen: 'El 1 de enero, feriado irrenunciable que abre el año.',
    cuerpo: [
      'El 1 de enero es feriado en Chile y además **irrenunciable**, lo que significa que el comercio debe cerrar y los trabajadores del retail no pueden ser obligados a trabajar.',
      'Al caer en fecha fija, el día de la semana cambia cada año. Cuando cae lunes o viernes arma fin de semana largo sin necesidad de ningún traslado.',
    ],
  },
  'viernes-santo': {
    resumen: 'Feriado religioso de Semana Santa, sin fecha fija: depende de la Pascua.',
    cuerpo: [
      'El Viernes Santo conmemora la crucifixión de Jesús y es parte de la Semana Santa.',
      'Es uno de los pocos feriados chilenos **sin fecha fija**: se calcula a partir de la Pascua de Resurrección, que a su vez depende del primer plenilunio tras el equinoccio de otoño del hemisferio norte. Por eso puede caer entre fines de marzo y fines de abril.',
      'Al caer siempre viernes, garantiza un fin de semana largo todos los años, extendido por el Sábado Santo.',
    ],
  },
  'sabado-santo': {
    resumen: 'El día siguiente al Viernes Santo, también feriado religioso.',
    cuerpo: [
      'El Sábado Santo es el día entre la crucifixión y la Resurrección, y en Chile también es feriado.',
      'Como sigue al Viernes Santo, su fecha depende igualmente de la Pascua. Al caer sábado, en la práctica no agrega un día libre para quienes ya descansan el fin de semana.',
    ],
  },
  'dia-nacional-del-trabajo': {
    resumen: 'El 1 de mayo, feriado irrenunciable.',
    cuerpo: [
      'El Día Nacional del Trabajo se conmemora el 1 de mayo, como en gran parte del mundo, y en Chile es **irrenunciable**.',
      'Es de fecha fija, así que el día de la semana rota año a año.',
    ],
  },
  'dia-de-las-glorias-navales': {
    resumen: 'El 21 de mayo, en memoria del Combate Naval de Iquique.',
    cuerpo: [
      'Conmemora el Combate Naval de Iquique de 1879, durante la Guerra del Pacífico, y la figura de Arturo Prat.',
      'Es de fecha fija y no se traslada, así que el día de la semana cambia cada año.',
    ],
  },
  'dia-nacional-de-los-pueblos-indigenas': {
    resumen: 'Alrededor del solsticio de invierno, en junio.',
    cuerpo: [
      'Reconoce a los pueblos originarios de Chile y coincide con el **solsticio de invierno**, fecha del año nuevo para varios de ellos: We Tripantu mapuche, Machaq Mara aymara, Inti Raymi quechua.',
      'Por eso su fecha no es completamente fija: sigue al solsticio, que cae el 20 o 21 de junio según el año. Es de los feriados más recientes del calendario chileno.',
    ],
  },
  'san-pedro-y-san-pablo': {
    resumen: 'Feriado religioso del 29 de junio, que a veces se adelanta al lunes.',
    cuerpo: [
      'Conmemora a los apóstoles Pedro y Pablo. Corresponde al 29 de junio.',
      'Es uno de los feriados **trasladables** de Chile: cuando la fecha cae a mitad de semana, se adelanta al lunes para formar un fin de semana largo. La tabla de abajo muestra qué pasó cada año.',
    ],
  },
  'dia-de-la-virgen-del-carmen': {
    resumen: 'El 16 de julio, día de la patrona de Chile.',
    cuerpo: [
      'La Virgen del Carmen es la patrona de Chile y de las Fuerzas Armadas. Se conmemora el 16 de julio.',
      'Es de fecha fija y no se traslada.',
    ],
  },
  'asuncion-de-la-virgen': {
    resumen: 'El 15 de agosto, feriado religioso de fecha fija.',
    cuerpo: [
      'Celebración católica de la Asunción de la Virgen María. Se conmemora el 15 de agosto y no se traslada.',
    ],
  },
  'independencia-nacional': {
    resumen: 'El 18 de septiembre, el feriado más importante del año en Chile.',
    cuerpo: [
      'El 18 de septiembre conmemora la Primera Junta Nacional de Gobierno de 1810 y es el feriado más significativo del calendario chileno. Es **irrenunciable**.',
      'Junto al 19 de septiembre forma el núcleo de las Fiestas Patrias. Según en qué día de la semana caiga el 18, se agrega además un **feriado adicional** para armar un fin de semana largo.',
    ],
  },
  'dia-de-las-glorias-del-ejercito': {
    resumen: 'El 19 de septiembre, con la Parada Militar. También irrenunciable.',
    cuerpo: [
      'El 19 de septiembre honra al Ejército de Chile y se realiza la Parada Militar. Es **irrenunciable**, igual que el 18.',
      'Ambos días juntos hacen que las Fiestas Patrias sean el período de mayor actividad del año para el turismo interno.',
    ],
  },
  'encuentro-de-dos-mundos': {
    resumen: 'El 12 de octubre, otro de los feriados que se trasladan a lunes.',
    cuerpo: [
      'Corresponde al 12 de octubre y conmemora el encuentro entre Europa y América. Antes se llamaba Día de la Raza.',
      'Es el otro feriado **trasladable** del calendario chileno: cuando cae a mitad de semana se adelanta al lunes. En la tabla de abajo se ve el patrón.',
    ],
  },
  'dia-de-las-iglesias-evangelicas-y-protestantes': {
    resumen: 'El 31 de octubre, reconocimiento a las iglesias evangélicas.',
    cuerpo: [
      'Reconoce el aporte de las iglesias evangélicas y protestantes en Chile, en la fecha en que se conmemora la Reforma Protestante.',
      'Es de fecha fija, el 31 de octubre.',
    ],
  },
  'dia-de-todos-los-santos': {
    resumen: 'El 1 de noviembre, día de visita a los cementerios.',
    cuerpo: [
      'Celebración católica en memoria de todos los santos. En Chile es tradicional visitar los cementerios ese día.',
      'Cae siempre el 1 de noviembre, justo después del Día de las Iglesias Evangélicas, así que cuando la combinación es favorable arma un fin de semana largo.',
    ],
  },
  'inmaculada-concepcion': {
    resumen: 'El 8 de diciembre, feriado religioso de fecha fija.',
    cuerpo: [
      'Celebración católica de la Inmaculada Concepción de María, el 8 de diciembre. No se traslada.',
    ],
  },
  navidad: {
    resumen: 'El 25 de diciembre, feriado irrenunciable.',
    cuerpo: [
      'La Navidad es feriado el 25 de diciembre y es **irrenunciable**: el comercio debe cerrar.',
      'Ojo con una confusión común: el **24 de diciembre no es feriado legal** en Chile, aunque muchos lugares cierran antes. Lo que sí existe es una regulación especial sobre el horario del comercio ese día.',
    ],
  },
  'feriado-adicional-fiestas-patrias': {
    resumen: 'Un día extra que se agrega en septiembre según cómo caiga el 18.',
    cuerpo: [
      'Algunos años se suma un feriado adicional en septiembre para que las Fiestas Patrias formen un fin de semana largo. No ocurre todos los años: depende del día de la semana en que caiga el 18.',
      'La tabla de abajo muestra exactamente en qué años apareció y en cuáles no, con el día de la semana de cada 18 de septiembre.',
    ],
  },
};
