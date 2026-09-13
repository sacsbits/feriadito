# CLAUDE.md — feriadito.cl

Contexto completo del proyecto. **Léelo entero antes de tocar nada.**
Última actualización: 2026-09-12 (cierre de la fase de planificación, antes de la fase 0).

---

## 1. Qué es

**feriadito.cl** muestra cuántos días faltan para el próximo feriado en Chile, más un
listado de todos los feriados del año (pasados y futuros). Al tocar cualquier feriado
del listado, el cuadro de la izquierda se actualiza y muestra los días que faltan —o los
que pasaron— para ese feriado.

Nació como alternativa a feriados.cl, que es lento, anticuado y está lleno de publicidad.

- **Dominio:** feriadito.cl (registrado en **NIC Chile directo**)
- **Dueño:** Tombu SpA
- **Autor:** Stefano Corsi
- **Tráfico actual:** < 100 visitas/mes. Prácticamente solo amigos y conocidos.
  El objetivo central del proyecto es hacerlo crecer.

## 2. Por qué la reescritura

La versión en producción es **Vue 3 + Vuetify**, construida sobre la plantilla comercial
**"Modernize"** (el `package.json` todavía dice `"name": "modernize"`). Arrastra
apexcharts, tiptap, vue-flow, v-calendar, recaptcha, i18n, vuedraggable, un mock backend
completo y un store de autenticación — para una página con una tabla y un contador.

Problemas concretos detectados en el código viejo:

| Problema | Detalle |
|---|---|
| SPA vacío | Sirve `<div id="app">` vacío y recién ahí pide los datos a Firebase RTDB. Peor problema de SEO. |
| `lang="en"` | En un sitio 100% en español de Chile. |
| Sin meta description | Y `<title>` **hardcodeado por año** (se edita a mano cada enero). |
| Sitemap muerto | Una sola URL, `lastmod` de mayo 2025, `changefreq: daily`. |
| Bug de countdown | `today.setDate(today.getDate() - 1)` + `Math.ceil` sobre milisegundos. El número **cambia según la hora del día** y da mal desde otro huso horario. |
| Tabla duplicada | Cada celda se renderiza **dos veces** (`hidden-md-and-down` + `hidden-lg-and-up`) solo para cambiar el tamaño de letra. |
| Tooltip inservible | El del candado es un hack de `:hover` en CSS → **invisible en celular**, que es donde está la mayoría de los usuarios. |
| Logo remoto | Se carga desde Firebase Storage con URL con token: DNS + TLS + request extra en cada visita. |
| Datos en Firebase RTDB | Overkill absoluto para ~18 filas por año. |

**Repo viejo (solo referencia, NO se modifica):** `../feriadito-old-vue`
Archivos clave ahí: `src/views/Home.vue` (toda la lógica y el markup),
`src/main.ts` (config de Firebase y fetch de datos), `src/theme/LightTheme.ts` (paletas).

## 3. Stack

| Pieza | Decisión | Razón |
|---|---|---|
| Framework | **Astro 5** | HTML estático, 0 KB de JS por defecto, content collections para el blog, integración de sitemap. |
| Interactividad | **TypeScript vanilla** (~50 líneas) | Click en fila → actualiza el cuadro. No amerita framework. Si crece, Astro permite una isla de Preact sin migrar. |
| Estilos | **CSS a mano con custom properties** | El diseño ya existe; se está traduciendo, no inventando. Tailwind agregaría config + purge para nada. |
| Tipografía | **Plus Jakarta Sans** vía Fontsource (self-hosted, subset latino) | Elimina la request a fonts.googleapis.com. También simplifica lo legal (hotlinkear Google Fonts transfiere la IP del visitante a un tercero). |
| Iconos | **SVG inline** | Solo se usa el candado. El font de MDI pesa cientos de KB. |
| Hosting | **Cloudflare Pages** | Gratis, ancho de banda ilimitado, 500 builds/mes, preview por branch. |
| Gestor | **npm** | Node v25.9.0 / npm 11.12.1 en la máquina. |

**Objetivo de peso:** de ~600 KB–1 MB de JS a **< 15 KB**, con HTML completo en la primera respuesta.

### Descartado a propósito

- **Next.js / Nuxt / SvelteKit** — runtime y SSR para contenido que no es dinámico.
- **Tailwind** — ver arriba.
- **Firebase (todo)** — RTDB, Storage, Analytics y Hosting se eliminan.
- **Cloudflare Images** (US$5/mes) — innecesario.
- **AdSense / cualquier publicidad** — ver §8.
- **Google Analytics / GA4** — ver §8.
- **Vercel** — ambigüedad del tier hobby con sitios que llevan publicidad.

## 4. Arquitectura de datos

**Regla de oro: los datos se hornean en el build. Nunca se consulta una API en runtime.**

```
data/feriados/2022.json … 20XX.json   ← fuente de verdad, versionada en git
```

Son ~18 filas por año, ~2 KB por archivo. No es una base de datos.

### Por qué no consultar la API en cada request
- Le regala el uptime del sitio a un tercero (la API oficial tiene historial de caídas).
- Suma 200–800 ms a cada carga, para datos que cambian una vez al año.
- Rompe el renderizado estático, que es justo la ventaja de SEO.

### Por qué no calcular los feriados con reglas
La mayoría son deterministas (fecha fija + Pascua), pero Chile tiene la ley de traslado
de feriados a lunes, feriados regionales, y **feriados ad-hoc por ley** (elecciones,
plebiscitos) que ninguna regla predice. Las reglas sirven solo como verificación cruzada.

### ⚠️ La API oficial del Estado está MUERTA (verificado 2026-09-12)

`apis.digital.gob.cl` **ya no tiene registro DNS**. No es un problema de red: el dominio
padre `digital.gob.cl` resuelve y responde HTTP 200; el subdominio de la API desapareció.
No perder tiempo intentando usarla.

Fuentes que sí funcionan:

| Fuente | Cobertura | Aporta |
|---|---|---|
| `api.boostr.cl/holidays/{año}.json` | 2022–2027 | nombres, tipo, irrenunciabilidad, feriados extraordinarios |
| `date.nager.at/api/v3/PublicHolidays/{año}/CL` | 2022–2028+ | fechas. Aplica **correctamente** la Ley 19.973 de traslado a lunes. Marca los regionales en `counties` |

⚠️ **Boostr responde HTTP 429 si se le pega seguido.** El script cachea en
`scripts/.cache/` — sin eso no es re-ejecutable.

⚠️ **nager.date incluye feriados REGIONALES** (ej. "Asalto y Toma del Morro de Arica",
7 de junio, solo CL-AP). Se filtran por `global === false || counties != null`.

### Errores conocidos de las fuentes (ya corregidos por el pipeline)
1. **Boostr clasifica mal el `tipo` en 2026 y 2027**: marca como `Civil` 9 feriados por año
   que son `Religioso` en 2022–2025. Se corrige por **votación entre años** — no hace falta
   una tercera API para detectarlo.
2. **A Boostr le falta el Plebiscito Constitucional del 2022-09-04**, que fue feriado legal
   e irrenunciable (Ley 21.451). nager sí lo tiene.
3. **Boostr escribe "Ejercito" sin tilde en 2022**, lo que generaba dos slugs distintos
   para el mismo feriado.

Las correcciones manuales viven en **`data/correcciones.json`**, con justificación por
entrada, y se aplican *después* de la reconciliación automática — así sobreviven a cada
sincronización.

### ⚠️ El build necesita Chrome — por eso NO se usa la integración Git de Cloudflare

`npm run build` encadena `scripts/generar-og.mjs`, que captura rutas reales del sitio con
Puppeteer. El entorno de build de Cloudflare Pages **no garantiza un navegador**; los
runners `ubuntu-latest` de GitHub Actions **sí lo traen preinstalado**.

Por eso el flujo es: **GitHub Actions construye → despliega a Cloudflare Pages con
wrangler** (subida directa). El proyecto de Pages debe llamarse exactamente `feriadito`.

`scripts/lib/chrome.mjs` resuelve la ruta del navegador en macOS y Linux, y respeta
`CHROME_PATH`.

### GitHub Action diario de sincronización
1. Consulta `api.boostr.cl` y `date.nager.at`.
2. Compara contra el JSON del repo.
3. **Si las fuentes coinciden y hay un cambio** (ej. apareció un año nuevo) → commit
   automático + rebuild.
4. **Si se contradicen** → abre un **PR** para revisión humana. **No publica nada.**
5. **Si el script falla** (fuente caída) → abre un issue. El sitio no se afecta.

La decisión la toma `scripts/.cache/resumen.json` (campo `requiereRevisionHumana`), que el
script escribe al final.

⚠️ **Dos trampas de idempotencia ya resueltas — no reintroducirlas:**
- El campo `actualizado` de cada año **solo avanza si los feriados cambiaron de verdad**.
  Si se pusiera la fecha de hoy en cada corrida, habría un commit de ruido diario.
- El workflow decide **solo mirando `data/`**, nunca el reporte: `docs/REPORTE-DATOS.md`
  lleva la fecha de generación y cambia todos los días por diseño.
- `contrastarFuentes` conoce `data/correcciones.json`: sin eso, una omisión ya arreglada a
  mano se reportaría como pendiente para siempre y nunca se publicaría solo.

Esto da las tres propiedades pedidas a la vez: se actualiza sola, nunca muestra datos
incorrectos, y si el gobierno se cae el sitio ni se entera.

### Esquema de los datos

Claves en español, consistente con el resto del proyecto. Un archivo por año:

```json
{
  "anio": 2026, "cantidad": 16, "provisional": false,
  "actualizado": "2026-09-13", "fuentes": ["api.boostr.cl", "date.nager.at"],
  "feriados": [
    { "fecha": "2026-01-01", "nombre": "Año Nuevo", "slug": "ano-nuevo",
      "tipo": "Civil", "irrenunciable": true }
  ]
}
```

- `slug` — identificador estable, agrupa el mismo feriado entre años. Base de las
  páginas perennes `/feriados/[slug]`.
- `extraordinario: true` — feriado de una sola vez (elecciones, plebiscitos). **No lleva
  página perenne.** Se detecta automáticamente: el slug aparece en un solo año.
- `provisional: true` (a nivel de año) — sin fuente autorizada todavía.

Estado actual: **2022–2027, 105 feriados, 17 recurrentes + 7 extraordinarios**, sin
inconsistencias de tipo.

**Formato de fecha: ISO 8601 (`AAAA-MM-DD`), siempre.** La base vieja de Firebase usaba
`MM/DD/YYYY` (formato de EEUU), que es ambiguo —`04/03/2026` se puede leer como 4 de marzo—
y no se ordena alfabéticamente. No reintroducirlo en ninguna parte.

**Validación del pipeline (2026-09-13):** el export de la RTDB de Firebase (data curada a
mano, la que el sitio muestra hoy) se contrastó contra `data/feriados/2026.json`:
**16/16 coinciden exactamente** en fecha, nombre, tipo e irrenunciabilidad. La corrección
automática por votación entre años llegó al mismo resultado que la curación humana.
El export también confirma que "Ejercito" sin tilde es un error de boostr, no del dato real.

### Rango histórico: 2022 en adelante
Se descartó partir en 2020 porque 2020–21 son un campo minado (plebiscito de octubre 2020,
elecciones de constituyentes de mayo 2021 que fueron **dos días**, etc.). 2022–2025 aún
trae feriados extraordinarios (plebiscito sept. 2022, plebiscito dic. 2023, elecciones 2025
con segunda vuelta) pero son pocos y bien documentados.

⚠️ **La lista de feriados irrenunciables cambió por ley con el tiempo.** No copiar el flag
hacia atrás a ciegas.

### Countdown — cómo calcularlo bien
- Calcular en **`America/Santiago`**, no en la hora local del navegador.
- Comparar **fechas de calendario** (medianoche a medianoche), no timestamps.
  Así el número es estable todo el día y correcto desde cualquier huso.
- El HTML es estático y cacheado, así que el número lo ajusta JS al cargar.
- **Rebuild diario programado** para que el HTML servido ya traiga el número correcto
  para los crawlers y el `<meta description>`. Sin esto Google indexa un número congelado.
- El rebuild lo dispara un GitHub Action que le pega un `curl` a un **Deploy Hook** de
  Cloudflare Pages → el build consume minutos de Cloudflare, no de GitHub.

## 5. Diseño

### Paleta

La identidad (naranjo cálido, va con la mascota del ciervo) **se mantiene**. Lo que se
corrigió es que el tema viejo no era una paleta diseñada: era Modernize con el primario
cambiado a mano, y el resto quedó en los defaults de Vuetify.

Contrastes medidos sobre blanco en el diseño viejo:

| Elemento | Color | Contraste | WCAG AA |
|---|---|---|---|
| Nombre del feriado (~18px) | `#c67d46` | 3.27:1 | ❌ necesita 4.5:1 |
| "Irrenunciables" + candados | `#FA896B` | 2.37:1 | ❌ falla incluso el 3:1 de íconos |
| Número gris (64px) | `#929292` | 3.11:1 | ⚠️ pasa raspando |
| Fila seleccionada (`#703418` sobre `#f6c38c`) | | 5.98:1 | ✅ |

`#FA896B` ni siquiera era una decisión de diseño: es el color `error` por defecto de
Vuetify, que quedó ahí porque el código usa `text-error` para los candados.

**Rampa tonal acordada** (derivada del color de marca):

```
--brand-50   #fdf6ef    fondos sutiles, hover de filas
--brand-100  #f9e6d2    bordes suaves
--brand-200  #f6c38c    acento — fila seleccionada        (se mantiene)
--brand-300  #e9a469
--brand-400  #c67d46    primario — SOLO uso grande/decorativo (se mantiene)
--brand-500  #a85f2c    primario para TEXTO normal   4.84:1 ✅  (NUEVO)
--brand-700  #703418    texto sobre fila seleccionada     (se mantiene)
--brand-900  #3d1c0c
```

Técnica de marca a dos tonos: el color vivo para lo grande (número gigante, h1), y una
versión oscurecida del **mismo tono** para texto corriente.

**Neutros y semánticos:**

| Rol | Antes | Ahora | Contraste |
|---|---|---|---|
| Texto general | `#2A3547` (azul frío) | `#3b302a` | 12.8:1 ✅ |
| Texto secundario | — | `#7a6a5f` | 5.18:1 ✅ |
| Irrenunciable | `#FA896B` | `#b0392c` | 6.02:1 ✅ |
| Número "han pasado" | `#929292` | `#8a7a6e` | 4.13:1 ✅ |

Otros tokens: `--radius: 7px`. Fuente Plus Jakarta Sans, pesos 400/500/600/700.

**Jerarquía:** en el diseño viejo el número gigante, el nombre del feriado y el título
usaban *el mismo* naranjo — tres niveles de importancia gritando igual. Con la rampa se
ordena: número en `brand-400`, títulos en `brand-500`, cuerpo en neutro cálido.

### Modo oscuro

**Siempre claro por defecto, salvo que el usuario lo active.** NO se respeta
`prefers-color-scheme` para el default — decisión explícita del dueño.

- Toggle en el header, preferencia en `localStorage`.
- **Script inline bloqueante en el `<head>`** que aplica el tema antes del primer
  pintado. Sin esto hay flashazo blanco al entrar en modo oscuro.
- Paleta oscura: fondo cálido `#1a1613` (no negro puro), tarjetas `#221d18`,
  texto `#f0e9e3`, marca `#e0a068`. La fila seleccionada se invierte: fondo ámbar
  oscuro con texto claro.

⚠️ Si la mascota es un PNG con fondo blanco, en modo oscuro se verá como un parche
blanco. Se necesita vector o PNG con transparencia.

### Móvil — es EL caso de uso, no un breakpoint

La mayoría de los usuarios entra desde el celular. **CSS mobile-first**, no
desktop-con-breakpoints.

Bugs verificados en un iPhone 13 (390px) sobre el sitio actual:

1. **La tabla se corta.** "Religioso" se ve como "Religiosc" — overflow horizontal, la
   columna "Tipo" queda cortada contra el borde de la tarjeta.
2. **Las fechas parten en dos líneas** de forma inconsistente ("Jueves, 1 de / enero"),
   lo que da filas de altura dispareja.
3. **Solo se ven 2 filas antes del fold.** La tarjeta del countdown ocupa media pantalla,
   más un hueco vacío de ~100px entre el header y la tarjeta.
4. Filas de ~180px de alto por el texto en dos líneas.

**Diseño acordado** — bloque de fecha tipo calendario, que elimina la tercera columna
y con ella el overflow:

```
Antes (se corta):                      Ahora:
┌──────────────┬────────────┬───────┐  ┌────────┬──────────────────────┐
│ Jueves, 1 de │ Año Nuevo🔒│ Civil │✂ │  jue   │  Año Nuevo  🔒       │
│ enero        │            │       │  │ 1 ene  │  Civil               │
└──────────────┴────────────┴───────┘  └────────┴──────────────────────┘
```

El tipo baja como subtítulo en gris cálido. Filas de altura uniforme, cero corte,
de 2 filas visibles a ~6.

Además:
- **Barra sticky compacta** al hacer scroll más allá de la tarjeta: `6 días ·
  Independencia Nacional`. (La tarjeta completa es demasiado alta para dejarla pegada.)
- Targets táctiles ≥ 44px.
- Safe areas de iPhone (notch), cero scroll horizontal.
- **PWA**: manifest + iconos para "agregar a pantalla de inicio". La data es estática,
  así que funcionaría incluso sin conexión.

### Accesibilidad (arreglos pendientes del diseño viejo)
- Las filas son `<tr>` con `@click` → inusables con teclado o lector de pantalla.
  Convertir en botones reales (se ven igual).
- Estados `:focus-visible`.
- Respetar `prefers-reduced-motion`.
- El tooltip del candado debe funcionar **al tocar**, no solo al hacer hover.

## 6. Imágenes

Todas viven **en el repo** y las sirve Cloudflare Pages desde el mismo dominio.
Nada de Firebase Storage ni hosts externos.

Astro (`<Image>` / `<Picture>`, vía sharp) optimiza en el build: genera AVIF + WebP +
fallback, inyecta `width`/`height` para evitar CLS, y saca nombres con hash
(`logo.a3f9c.webp`) para caché inmutable.

| Uso | Formato | Nota |
|---|---|---|
| Logo / mascota | **SVG** si existe el vector | Escala infinita, y permite cambiar color en modo oscuro |
| Logo, si solo hay raster | AVIF + WebP + PNG fallback | Astro emite los tres |
| Favicon | SVG + PNG 180px (apple-touch) + 192/512 (manifest) | |
| **OG / WhatsApp** | **PNG 1200×630** | Obligatorio PNG: Meta y WhatsApp no manejan AVIF/WebP de forma confiable en previews |
| **Instagram** | **PNG 1080×1350** (vertical) | Vertical ocupa más feed que el cuadrado → mejor alcance |

Las imágenes generadas (OG + Instagram) se producen capturando **rutas reales del sitio**
(`/og/*`) con **Puppeteer**, en `scripts/generar-og.mjs`, encadenado a `npm run build`.

Se descartó **satori**: Fontsource solo distribuye `woff2` y satori no lo acepta (necesita
ttf/otf/woff), y además su CSS es un subconjunto que obligaría a redibujar el diseño aparte.
Capturando una ruta real, la imagen usa el mismo CSS y la misma tipografía que el sitio y no
puede quedar desalineada. **El mismo generador produce el vertical de Instagram**
(`/og/hoy?f=ig`, 1080×1350).

Las rutas `/og/*.html` se eliminan del build tras capturarlas y quedan excluidas del sitemap.
Los PNG se cuantizan con sharp: de ~230 KB a ~37 KB.

## 7. SEO

Con < 100 visitas/mes, SEO no es un extra: es el proyecto.

**Expectativa realista:** no se le gana a feriados.cl en la consulta "feriados chile" en
el corto plazo (20 años de autoridad de dominio, y Google responde eso con su propio panel).
Donde sí se puede ganar: **long-tail** y **ser lo compartible**.

Orden de impacto real dado el punto de partida:

| Palanca | Velocidad | Techo |
|---|---|---|
| Instagram / WhatsApp | Semanas | Alto y bajo control propio |
| Contenido long-tail | 3–6 meses | Alto |
| Fundación SEO técnica | Lenta, pero habilita todo lo demás | — |

### Estructura de URLs

```
/                              → año actual (canonical)
/feriados/2026                 → una URL indexable por año
/feriados/2027
/feriados/18-de-septiembre     → página por feriado (perenne)
/feriados/viernes-santo
/finde-largos/2027             → calculadora de puentes
/blog  +  /blog/[slug]
/acerca  /contacto
/privacidad  /terminos  /cookies
/404
/api/feriados.json             → JSON público (archivo estático)
```

**Canonical del año en curso:** `/` es canónica. `/feriados/2026` existe pero apunta su
canonical a `/` mientras 2026 sea el año actual, y pasa a ser autónoma cuando llegue 2027.
Evita contenido duplicado sin romper links.

**El selector de años son enlaces a páginas reales, no un dropdown de JS.** Cada año es su
propia URL indexable con su propio `<title>`. Un dropdown que filtra en cliente no rankea.

### Tácticas
1. **HTML renderizado en el servidor** — el 60% de la ganancia, solo por migrar a Astro.
2. **Responder la pregunta literal en el primer párrafo**: "El próximo feriado en Chile es
   el viernes 18 de septiembre de 2026 (Independencia Nacional), en 6 días." → featured snippets.
3. **JSON-LD**: `Event` por feriado, `FAQPage`, `BreadcrumbList`, `WebSite`, `Organization`.
4. **Imagen OG generada a diario** — en Chile esto circula por WhatsApp, el preview vende solo.
5. `sitemap.xml` automático (`@astrojs/sitemap`) + `robots.txt`.
6. `lang="es-CL"`, meta descriptions por página, canonicals.
7. **Core Web Vitals**: Astro estático deja casi perfecto. Sin ads, sin riesgo de CLS.
8. Enlazado interno: año ↔ feriado ↔ post.
9. **Posts firmados por Stefano Corsi** con byline y página de autor → E-E-A-T.
10. **`/api/feriados.json` gratis** → backlinks de otros devs.

### Ideas de contenido que rinden
- "¿Qué abre y qué cierra el 18 de septiembre?" (supermercados, malls, bancos)
- "Feriados irrenunciables 2027: qué significa y a quién aplica"
- **"Cómo pedir vacaciones para maximizar días libres en 2027"** ← calculadora de puentes,
  derivada de la misma data. Probablemente la mejor pieza de contenido.
- "Feriados regionales de Chile"
- "¿Me pagan doble si trabajo un feriado?"
- La historia de cada feriado (rinde menos que lo anterior, pero suma).

## 8. Legal y privacidad

### Ley 21.719 (Chile)
Entra en vigencia **alrededor del 1 de diciembre de 2026**. ⚠️ Verificar la fecha exacta
antes de publicar las páginas legales.

**Estrategia: no recolectar nada.** Si no se guardan datos personales, el cumplimiento es
casi gratis y no se necesita banner de consentimiento.

| Antes | Ahora |
|---|---|
| Firebase Analytics / GA4 (cookies → exige consentimiento) | **Cloudflare Web Analytics** (sin cookies, sin PII, sin banner) |
| Google Fonts hotlinkeado (transfiere IP a un tercero) | Self-hosted con Fontsource |
| Sin política de privacidad | `/privacidad` + `/terminos` |
| AdSense | **Eliminado** |

### Publicidad: NINGUNA. Decisión cerrada.
Razones: con < 100 visitas/mes AdSense genera centavos; obliga a un banner de
consentimiento; daña CLS (o sea SEO); y **mata el diferenciador** — el sitio nació
precisamente porque la competencia está llena de publicidad.

La cuenta de AdSense **no se elimina**, queda dormida por si algún día el tráfico lo justifica.

Alternativas sin cookies si algún día se quiere retorno: link de "invítame un café"
(Ko-fi / Cafecito / MercadoPago), o un auspiciador directo con banner estático
(`<img>` + link, sin JS de terceros). Ninguna requiere consentimiento.

⚠️ **Acoplamiento importante:** `/privacidad` afirma hoy que el sitio **no tiene analítica**.
Cuando se active Cloudflare Web Analytics (fase 4), hay que **actualizar esa página en el
mismo commit**, o el documento queda falso.

### Datos del responsable (para `/privacidad` y `/terminos`)
- **Responsable del tratamiento:** Tombu SpA
- **RUT:** 78.507.077-1
- **Email de contacto:** contacto@tombu.cl
- Mecanismo para ejercer derechos ARCOP: basta el email en la política.

### Atribución
| Dónde | Quién |
|---|---|
| Páginas legales | **Tombu SpA** + RUT + email |
| Footer, línea 1 | "Un proyecto de **Tombu SpA**" |
| Footer, línea 2 | "Hecho por **Stefano Corsi**" → link a GitHub/LinkedIn |
| JSON-LD `Organization` | Tombu SpA |
| Autor de los posts | Stefano Corsi |

⚠️ En textos visibles del sitio escribir **"Tombu SpA"** (nombre legal). `tombu-spa` es
solo el handle de GitHub — la org `tombu` ya existía y es de otra persona.

## 9. Bot de Instagram

Genera a diario una imagen parecida al cuadro del countdown ("faltan X días para el
próximo feriado, y cuál es") y la publica.

- **Generación:** satori + @resvg/resvg-js, reutilizando el mismo markup/CSS del sitio
  → sale idéntico. Es **el mismo generador de las imágenes OG**.
- **Scheduling:** GitHub Actions cron diario (~08:00 hora de Chile). El cron de Actions es
  UTC y puede atrasarse unos minutos; irrelevante acá.
- **Publicación:** Instagram Graph API. Flujo: imagen en URL pública → crear media
  container → publicar. El PNG se hostea en Cloudflare Pages.

**Requisitos que hay que empezar temprano:**
- Cuenta de Instagram **Business o Creator**, vinculada a una página de Facebook.
- App de Meta con permiso `instagram_content_publish`, que pasa por **App Review**
  (días, no horas).
- Límite de 25 posts/24h. Sobra.

⚠️ **El gotcha que mata estos bots: el token de larga duración expira cada ~60 días.**
Automatizar el refresh **y** poner una alerta si falla.

**Contenido:** un cuadrado idéntico todos los días hace una grilla aburrida. Rotar color
de fondo o ilustración según mes/feriado, variar el copy, y cambiar el formato en días
especiales ("mañana es feriado", "hoy es feriado 🎉").

**Considerar también un Canal de WhatsApp** — para este contenido y este país
probablemente le gane a Instagram en alcance real, y la API es más simple.

## 10. Costos

**US$0/mes.** Lo único que se paga es el dominio `.cl` que ya se pagaba.

| Servicio | Plan | Uso estimado |
|---|---|---|
| GitHub Actions | Repo **público** → minutos ilimitados | ~90–120 min/mes |
| Cloudflare Pages | Free: 500 builds/mes | ~31 + pushes |
| Cloudflare Web Analytics | Free | — |
| Cloudflare Email Routing | Free | `contacto@feriadito.cl` → correo real |

> Si el repo fuera privado: 2.000 min/mes gratis, igual alcanzaría. Usar **siempre**
> runners Linux (macOS consume 10x, Windows 2x).

## 11. Plan por fases

| Fase | Qué | Estado |
|---|---|---|
| **Setup** | Org de GitHub, transferencia del repo, git config local | ✅ **Hecho** |
| **0** | `.gitignore`, estructura, README, LICENSE, `docs/PENDIENTES.md`, sondear APIs, generar `data/feriados/*.json`, reporte de discrepancias | ✅ **Hecho** |
| **1** | Astro + home idéntica al diseño + páginas por año | ✅ **Hecho** (falta el deploy de preview) |
| **2** | Legales, 404, robots, OG images | ✅ **Hecho** |
| **3** | **Bot de Instagram** | ⬜ **Pospuesto al final por decisión del dueño** (2026-09-12), pero se hará sí o sí: seguir desarrollando compatible con él |
| **4** | Despliegue a Cloudflare + cutover de DNS. Search Console configurado *antes* para tener línea base. | 🔵 Automatización lista; **falta que el dueño cree la cuenta y los secretos** (ver `docs/PENDIENTES.md` 8b) |
| **5** | GitHub Action de sincronización de datos + rebuild diario | ✅ **Hecho** |
| **6** | Blog + páginas por feriado + calculadora de puentes | ⬜ Siguiente |
| **7** | Apagar Firebase | ⬜ |

Las URLs no cambian (hoy todo vive en `/`), y con < 100 visitas/mes **no hay rankings que
proteger**. El cutover de DNS es de riesgo prácticamente cero.

## 12. Estado actual e infraestructura

```
repo        https://github.com/tombu-spa/feriadito   (PÚBLICO)
rama        main
autor       Stefano Corsi <142639758+sacsbits@users.noreply.github.com>  (config LOCAL)
org         tombu-spa   (único miembro: sacsbits)
gh CLI      v2.91, autenticado como sacsbits (scopes: repo, workflow — sin admin:org)
node        v25.9.0 / npm 11.12.1
```

⚠️ La identidad de git está seteada **local a este repo** a propósito. La config global de
la máquina apunta a `stefano.corsi@pervasivemind.net`, que no corresponde acá. **No usar
`--global`.**

**Producción actual:** todavía el sitio Vue en Firebase Hosting. No se toca hasta la fase 4.

**Firebase (a desmantelar en la fase 7):** proyecto `feriadito`, RTDB en
`feriadito-default-rtdb.firebaseio.com` (nodo `holidays`), Storage con el logo, Hosting.

### Pendientes del usuario

| Qué | Formato | Para qué fase |
|---|---|---|
El checklist completo, con especificaciones exactas y el paso a paso para obtener cada
cosa, está en **`docs/PENDIENTES.md`**. Se piden **de a una y en su momento**.

Entregados: export de la RTDB (validado, 16/16) y los tres PNG del logo.
Pendiente menor: a qué enlaces apunta "Hecho por Stefano Corsi" en el pie.

⚠️ **Los assets son PNG, no vector.** El wordmark y el logo cuadrado no se usan en la
interfaz porque su texto café da 1.94:1 en modo oscuro. Se usa la mascota sola + texto
HTML. Los PNG con texto quedan para OG e Instagram (fondo siempre claro).

## 13. Cómo trabajar en este repo

1. **Nunca empezar a programar sin confirmación explícita del dueño.** Lo pidió varias
   veces. Proponer, esperar el visto bueno, después ejecutar.
2. **Pedir los archivos y assets de a uno**, en el momento que corresponde, con formato y
   dimensiones exactas. No mandar listas largas que se olvidan.
3. **Recomendar, no enumerar opciones.** Prefiere una recomendación justificada con
   números y trade-offs explícitos antes que un menú de alternativas.
4. **Español** en todo: comunicación, contenido del sitio, comentarios de código.
5. **No tocar `../feriadito-old-vue`.** Es referencia de solo lectura.
6. El repo es **público**: los secretos van en GitHub Secrets (Settings → Secrets and
   variables → Actions), nunca en el código.
7. Licencia **MIT** para el código. Dejar explícito en el README que **los datos de
   feriados son información pública** (son ley) y por tanto de uso libre.
