# kscc.tech

Página personal de **Karlo Sebastián Cadena Cota**: un one-page bilingüe (ES/EN) hecho con Next.js (App Router), TypeScript, Tailwind CSS v4 y next-intl. Todo es estático: sin base de datos ni backend.

## Requisitos

- Node.js 20.9 o superior
- npm

## Desarrollo local

```bash
npm install
npm run dev     # http://localhost:3000 → redirige a /es (o /en según el navegador)
npm run build   # compilación de producción (incluye la verificación de tipos)
npm start       # sirve la compilación
```

## Estructura

```
messages/
  es.json, en.json          Todo el contenido visible, por idioma
src/
  proxy.ts                  Detección de idioma y redirección / → /es | /en (next-intl)
  i18n/routing.ts           Idiomas disponibles (es por defecto)
  i18n/request.ts           Carga los mensajes del idioma activo
  lib/site.ts               Correo, redes, URL del sitio y tema predeterminado
  app/
    globals.css             Tokens de color (claro/oscuro), animaciones y base
    [locale]/layout.tsx     <html lang>, metadata por idioma, hreflang, canonical, OG/Twitter
    [locale]/page.tsx       Secciones + JSON-LD (Person)
    [locale]/opengraph-image.tsx  Imagen Open Graph 1200×630 por idioma
    [locale]/not-found.tsx  404 localizado
    sitemap.ts, robots.ts   /sitemap.xml y /robots.txt
    icon.svg, favicon.ico, apple-icon.png
  components/               Header, Hero, About, Tools, Education, Contact, Footer…
```

## Editar contenido

- **Textos:** `messages/es.json` y `messages/en.json` (mantén las mismas claves en ambos). Las frases entre `<strong>…</strong>` de la bio se resaltan.
- **Herramientas:** `Tools.groups.*.items`. Un detalle entre paréntesis, por ejemplo `Supabase (Auth, Row Level Security)`, se muestra en gris dentro de la píldora.
- **Correo y redes:** `src/lib/site.ts`.
- **Tema predeterminado:** `DEFAULT_THEME` en `src/lib/site.ts` (`'dark'` o `'light'`). La elección del visitante se guarda en `localStorage`.
- **Idioma:** el visitante que entra a `/` va al idioma de su navegador; si no es español ni inglés, a `/es`. Para mandar siempre a `/es`, agrega `localeDetection: false` en `src/i18n/routing.ts`.

## Engrane 3D del hero

- `src/components/gear-scene.js`: modelo y render en WebGL puro (sin three.js ni otras dependencias), basado en el icono de engrane con monitor `< >`.
- `src/components/HeroGear.tsx`: carga la escena cuando el navegador está libre, después del primer pintado, para no afectar el LCP.
- El engrane queda detrás del titular. Al hacer scroll gira y baja más lento que el contenido (parallax) mientras se atenúa.
- Con `prefers-reduced-motion` queda quieto. Sin WebGL, simplemente no aparece.
- Para quitarlo: borra `<HeroGear />` en `Hero.tsx`.

## Sobre mí: mapa 3D de México narrado

- `src/components/mexico-scene.js`: WebGL puro. Cada estado es un prisma extruido cuya altura se anima por separado. Para alzar un estado desde código: `scene.setHeight('MX-SON', 0.1)`.
- `public/geo/mexico-states.json` (49 KB): límites estatales de Natural Earth (vía `angelnmara/geojson`), proyectados en Mercator, simplificados y triangulados de antemano.
- Estados destacados (origen y universidad): `originState` y `schoolState` en `src/lib/site.ts`.
- La sección “Sobre mí” (`Where.tsx`, `#about`) narra el recorrido en cuatro textos (`Where.*` en `messages/*.json`), cada uno visible en su tramo de scroll (`captions` en `MexicoMap.tsx`). En pantallas anchas los textos del medio van a la izquierda y la cámara recorre el sujeto a la derecha.
- Recorrido con el scroll (sección de 600svh, escenario sticky; fases en `TL` de `mexico-scene.js`): zoom-in a México → zoom a Todos Santos (BCS, `hometown` en `site.ts`), donde se arma pieza por pieza (estilo LEGO) una cabaña de playa con terraza, palmeras y mar al frente → la cámara se aleja y sigue a un avión que vuela hasta Guadalajara dejando la ruta trazada → Jalisco se alza y la cámara vuelve al mapa completo. Hover muestra el nombre del estado; clic lo alza.

## Desplegar en Vercel

1. Sube el proyecto a un repositorio de GitHub.
2. En [vercel.com/new](https://vercel.com/new), importa el repositorio. Vercel detecta Next.js; no cambies el comando de build (`npm run build`) ni el directorio de salida.
3. Pulsa **Deploy**. Cada push a la rama principal publica una nueva versión; cada pull request genera una vista previa.

Alternativa por terminal:

```bash
npm i -g vercel
vercel          # vincula el proyecto y crea un preview
vercel --prod   # publica en producción
```

## Dominio: kscc.tech (y www con redirección)

### 1. En Vercel

1. Abre el proyecto → **Settings → Domains**.
2. Agrega `kscc.tech`. Cuando Vercel lo sugiera, agrega también `www.kscc.tech`.
3. En la tarjeta de `www.kscc.tech`, elige **Edit → Redirect to `kscc.tech`** con código **308 (permanente)**. Así el dominio principal es el apex, que coincide con el canonical `https://kscc.tech` del sitio.

### 2. En el registrador de kscc.tech

Crea estos registros en el panel DNS de tu registrador (GoDaddy, Namecheap, Porkbun, Cloudflare, etc.):

| Tipo  | Nombre / Host | Valor                                         |
| ----- | ------------- | --------------------------------------------- |
| A     | `@`           | `76.76.21.21` (o la IP que muestre Vercel)    |
| CNAME | `www`         | El destino que muestre Vercel para `www`, p. ej. `cname.vercel-dns.com` o `xxxxxxxx.vercel-dns-017.com` |

Notas:

- Vercel puede asignar una IP y un CNAME específicos por proyecto: usa siempre los valores que aparecen en **Settings → Domains**.
- Borra cualquier otro registro **A** o **AAAA** en `@` y cualquier registro previo en `www` (muchos registradores crean uno de “parking”). Si quedan, el tráfico se reparte entre servidores.
- Si tu dominio tiene registros **CAA**, añade uno que permita `letsencrypt.org`, o Vercel no podrá emitir el certificado SSL.
- No toques los registros **MX** o **TXT** de correo.
- La propagación suele tardar de minutos a unas horas (hasta 48 h). Vercel muestra **Valid Configuration** y emite el HTTPS automáticamente.

**Opción alternativa:** cambia los nameservers del dominio a `ns1.vercel-dns.com` y `ns2.vercel-dns.com` y administra el DNS desde Vercel. Antes, copia ahí cualquier registro de correo que ya tengas.

### 3. Comprobar

```bash
dig A kscc.tech +short          # 76.76.21.21 (o tu IP de Vercel)
dig CNAME www.kscc.tech +short  # el destino de Vercel
curl -I https://www.kscc.tech   # 308 → https://kscc.tech/
```

## SEO incluido

- `title` y `description` por idioma, Open Graph (`profile`) y Twitter `summary_large_image` con imagen generada por idioma.
- `<link rel="canonical">` a `https://kscc.tech/es` o `https://kscc.tech/en`, `hreflang` es/en y `x-default` → `https://kscc.tech`.
- `/sitemap.xml` con alternates por idioma y `/robots.txt`.
- JSON-LD `Person` con nombre, ubicación, universidad, idiomas, reconocimiento, herramientas y perfiles (`sameAs`).

## Accesibilidad y rendimiento

- HTML estático por idioma (`generateStaticParams`), sin librerías de animación: un único `IntersectionObserver`.
- La tipografía usa San Francisco en dispositivos Apple; en el resto se descarga Inter (solo ahí).
- Contraste AA en ambos temas, foco visible, enlace “Saltar al contenido”, `lang` correcto por página y en el selector de idioma.
- `prefers-reduced-motion` desactiva animaciones y el scroll suave. Si JavaScript falla, el contenido nunca queda oculto.

Para medir: `npm run build && npm start`, abre `http://localhost:3000/es` en una ventana de incógnito y corre Lighthouse desde Chrome DevTools.
