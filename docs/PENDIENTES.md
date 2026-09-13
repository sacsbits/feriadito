# Checklist de pendientes

Todo lo que hace falta de parte del dueño del proyecto para avanzar, con especificaciones
exactas. **Se pide de a uno, en la fase que corresponde** — no hay que juntarlo todo ahora.

Leyenda: ⬜ pendiente · 🔵 pedido, esperando · ✅ listo · ⏸️ todavía no corresponde

---

## Fase 0 — Datos

### 🔵 1. Export de la base de datos actual (Firebase RTDB)

**Para qué:** contrastar los datos reconciliados contra los que el sitio muestra hoy.
Sirve sobre todo para validar el campo `tipo` de 2026 —que las fuentes públicas traen
mal— y para confirmar que la nomenclatura de los feriados calce con la que la gente ya ve.

**Cómo obtenerlo:**
1. Entrar a [console.firebase.google.com](https://console.firebase.google.com) → proyecto **feriadito**
2. Menú lateral → **Realtime Database**
3. Menú **⋮** (arriba a la derecha del panel de datos) → **Exportar JSON**
4. Se descarga un archivo `.json`

**Formato:** JSON, tal cual lo exporta Firebase. No hay que editarlo ni limpiarlo.

**Dónde dejarlo:** copiarlo a la raíz del proyecto:
```
/Users/sacsbits/Desktop/sacsbits/feriadito/firebase-export.json
```
Está en `.gitignore`, así que no se va a commitear.

### ⬜ 2. Confirmar el Plebiscito Constitucional de 2022

El 4 de septiembre de 2022 fue feriado legal e irrenunciable (Ley 21.451), pero boostr
lo omite. Se agregó a mano en [`data/correcciones.json`](../data/correcciones.json).

**Solo hace falta confirmar que corresponde incluirlo.** Si se prefiere no listar
plebiscitos y elecciones como feriados, se saca — pero entonces habría que sacar también
los de 2024 y 2025 por consistencia.

---

## Fase 1 — Sitio

### ✅ 3. Logo y mascota (el ciervo)

**Para qué:** header, logo grande de escritorio, favicon, iconos de PWA e imágenes de
Instagram y WhatsApp.

**Formato ideal — en orden de preferencia:**

| Opción | Formato | Por qué |
|---|---|---|
| 🥇 Mejor | **SVG** o el archivo original de Figma / Illustrator | Escala infinita, pesa nada, y permite recolorear para el modo oscuro |
| 🥈 Sirve | **PNG con fondo transparente**, ≥ 1024 px de lado | Suficiente para todo menos el recoloreo |
| 🥉 Último recurso | El PNG que está hoy en Firebase Storage | Baja resolución, y probablemente con fondo blanco |

⚠️ **Importante:** si el logo tiene **fondo blanco**, en modo oscuro se va a ver como un
parche blanco. Se necesita transparencia o vector.

**Hacen falta dos piezas** (pueden venir en el mismo archivo si están separadas por capas):
- El **wordmark** — "feriadito.cl" con la carita del ciervo al lado (lo del header)
- La **mascota sola** — el ciervo grande con las estrellitas (lo de la columna izquierda)

**Entregado** (PNG con transparencia real, verificada):

| Archivo | Origen | Uso |
|---|---|---|
| `src/assets/mascota.png` | 1400×1222 | header, columna de escritorio, favicons, iconos de PWA |
| `src/assets/wordmark.png` | 1000×250 | reservado (ver nota) |
| `src/assets/logo-cuadrado.png` | 1400×1400 | base de las imágenes OG e Instagram |

⚠️ **Nota de diseño:** el wordmark y el logo cuadrado **no se usan en la interfaz**. Su
texto café oscuro da 1.94:1 sobre el fondo del modo oscuro — ilegible. En su lugar se usa
la mascota sola como imagen y "feriadito.cl" como texto HTML, que se recolorea con el tema.
Los PNG con texto sí sirven para OG e Instagram, donde el fondo siempre es claro.

Si algún día aparece el vector, se puede volver al wordmark original recoloreándolo.

### 🔔 4. Enlaces personales para el footer — PENDIENTE, RECORDAR

⚠️ Sigue pendiente: el pie dice «Hecho por Stefano Corsi» sin enlace, y los artículos del
blog van firmados con su nombre. Falta decidir a dónde apuntan: ¿GitHub, LinkedIn, sitio
personal? Puede ser más de uno.

Para la línea "Hecho por Stefano Corsi": ¿a dónde apunta? ¿GitHub, LinkedIn, sitio
personal? Puede ser más de uno.

---

## Fase 2 — Legal y SEO

### ✅ 5. Datos del responsable de tratamiento
- Razón social: **Tombu SpA**
- RUT: **78.507.077-1**
- Email de contacto: **contacto@tombu.cl**

### ⚠️ 5b. Al activar analítica, actualizar la política

`/privacidad` dice hoy que el sitio no tiene analítica ni recolecta nada. Cuando se active
**Cloudflare Web Analytics** en la fase 4, hay que actualizar esa página **en el mismo
commit**. No es un trámite: publicar una política que no refleja lo que hace el sitio es
exactamente el problema que estamos evitando.

### ✅ 6. Correo del dominio — decidido: NO se crea casilla en feriadito.cl

Las páginas legales citan **`contacto@tombu.cl`**, que ya funciona con Email Routing en el
dominio tombu.cl. No hace falta una casilla en feriadito.cl.

En su lugar se declara que el dominio **no envía correo**, que protege contra suplantación
sin sumar nada que mantener:

| Dominio | Tipo | Nombre | Contenido |
|---|---|---|---|
| feriadito.cl | TXT | `@` | `v=spf1 -all` |
| feriadito.cl | TXT | `_dmarc` | `v=DMARC1; p=reject; rua=mailto:contacto@tombu.cl` |
| **tombu.cl** | TXT | `feriadito.cl._report._dmarc` | `v=DMARC1` |

⚠️ El tercero es obligatorio: los informes DMARC van a otro dominio, y sin esa
autorización explícita los servidores no los envían.

⚠️ Si algún día se quiere `contacto@feriadito.cl`, hay que **revertir el SPF y bajar el
DMARC a `p=none`** antes, o los envíos van a rebotar.

### ⏸️ 7. Verificación en Google Search Console

Hay que hacerlo **antes** del cambio de DNS, para tener línea base de comparación.
Se entregan las instrucciones cuando toque.

---

## Fase 3 — Bot de Instagram

### ⏸️ 8. Cuenta de Instagram

**Requisitos previos** (conviene empezar temprano, el App Review de Meta demora días):
1. La cuenta de Instagram debe ser **Business** o **Creator**, no personal
2. Debe estar **vinculada a una página de Facebook**
3. Crear una app en [developers.facebook.com](https://developers.facebook.com)
4. Solicitar el permiso **`instagram_content_publish`** → pasa por App Review

**Hace falta después:** App ID, App Secret, ID de la cuenta de Instagram y un token de
larga duración. Van a **GitHub Secrets**, nunca al código.

⚠️ El token de larga duración **expira cada ~60 días**. Se va a automatizar el refresh
con una alerta si falla — es el error que mata a la mayoría de estos bots.

---

## Fase 4 — Despliegue

### 🔵 8b. Cuenta de Cloudflare y credenciales de despliegue

**Para qué:** publicar el sitio. Todo lo demás ya está listo y esperando estos dos secretos.

**Paso a paso:**

1. Crear cuenta gratuita en [dash.cloudflare.com](https://dash.cloudflare.com) (si no tienes).
   Usa un correo de Tombu, no personal.

2. **Crear el proyecto de Pages**, en modo *subida directa* (no conectado a Git — nosotros
   construimos en GitHub Actions porque el build necesita Chrome):
   - Menú lateral → **Workers & Pages** → **Create** → pestaña **Pages**
   - **Upload assets** → nombre del proyecto: **`feriadito`** (exacto, así lo espera el workflow)
   - Sube cualquier archivo para que se cree; el primer despliegue real lo hace el workflow

3. **Crear el token de API:**
   - Arriba a la derecha → **My Profile** → **API Tokens** → **Create Token**
   - Plantilla **«Edit Cloudflare Workers»**, o una personalizada con el permiso
     **Account → Cloudflare Pages → Edit**
   - Copia el token: **se muestra una sola vez**

4. **Copiar el Account ID:** está en la barra lateral derecha de la página principal del
   dashboard, o en la URL (`dash.cloudflare.com/<ESTE-ES-EL-ID>`).

5. **Guardar ambos en GitHub**, en
   `github.com/tombu-spa/feriadito` → **Settings** → **Secrets and variables** → **Actions**
   → **New repository secret**:

   | Nombre del secreto | Valor |
   |---|---|
   | `CLOUDFLARE_API_TOKEN` | el token del paso 3 |
   | `CLOUDFLARE_ACCOUNT_ID` | el ID del paso 4 |

⚠️ Los nombres tienen que ser **exactamente** esos. Y nunca pegues estos valores en el
código ni en un mensaje: el repo es público.

Cuando estén los dos, el despliegue corre solo con cada push a `main` y todos los días.

### ⏸️ 9. Acceso a NIC Chile

Para apuntar `feriadito.cl` a los nameservers de Cloudflare.
El dominio está registrado **directo en NIC Chile**. Se entregan los pasos cuando toque.

---

## Fase 7 — Apagar Firebase

### ⏸️ 10. Confirmación para desmantelar

Recién después de que el sitio nuevo lleve un par de semanas estable.
Se apagan: Hosting, Realtime Database, Storage y Analytics del proyecto `feriadito`.
