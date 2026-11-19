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
  es.json, en.json          Todo el contenido visible, por idioma (mismas claves en ambos)
src/
  proxy.ts                  Detección de idioma y redirección / → /es | /en (next-intl)
  i18n/routing.ts           Idiomas disponibles (es por defecto)
  i18n/request.ts           Carga los mensajes del idioma activo
  lib/site.ts               Correo, redes, URL del sitio, estados del mapa y tema predeterminado
  app/
    globals.css             Tokens de color (claro/oscuro), variantes (fx, hpin, tall), animaciones y base
    [locale]/layout.tsx     <html lang>, metadata por idioma, hreflang, canonical, OG/Twitter
    [locale]/page.tsx       Secciones + JSON-LD (Person)
    [locale]/opengraph-image.tsx  Imagen Open Graph 1200×630 por idioma
    [locale]/not-found.tsx  404 localizado
    sitemap.ts, robots.ts   /sitemap.xml y /robots.txt
    icon.svg, favicon.ico, apple-icon.png
  components/
    Header.tsx (+ HeaderShell, ThemeToggle)   Barra fija: secciones, idioma, tema y Contacto
    Hero.tsx (+ HeroGear, gear-scene.js)      Nombre, engrane 3D y remolino
    Where.tsx (+ MexicoMap, mexico-scene.js)  “Sobre mí”: mapa 3D de México narrado
    Tools.tsx                                 “Con qué trabajo”: pila de cinco capas
    Portfolio.tsx                             Galería de proyectos
    Contact.tsx (+ CopyEmail)                 Correo y botón “Copiar correo”
    Footer.tsx (+ FooterName)                 Nombre, navegación, redes y copyright
    ScrollFx.tsx (+ scroll-fx.js)             Efectos ligados al scroll
    RevealObserver.tsx                        Aparición de textos al entrar en pantalla
public/geo/                 Geometría del mapa de México
```

## Editar contenido

- **Textos:** `messages/es.json` y `messages/en.json`. Mantén las mismas claves en ambos.
- **Herramientas:** `Tools.layers`. Cada capa tiene `title`, `body` e `items` (las herramientas).
- **Proyectos:** `Projects.items`. Cada proyecto tiene `eyebrow`, `status`, `name`, `tagline`, `problem`, `how`, `result`, `metrics[]` (`value` y `label`), `stack[]`, `link` (o `null`) y, opcionalmente, `image`. El botón dice “Ver en GitHub” si el enlace es de github.com y “Ver proyecto” en cualquier otro caso.
- **Capturas:** deja la imagen en `public/projects/` y pon su ruta en `image` (por ejemplo `"/projects/cobranza.webp"`), en proporción 16:10. Sin `image` se muestra un marco rayado neutro.
- **Correo y redes:** `src/lib/site.ts`.
- **Tema predeterminado:** `DEFAULT_THEME` en `src/lib/site.ts` (`'dark'` o `'light'`). La elección del visitante se guarda en `localStorage`.
- **Idioma:** el visitante que entra a `/` va al idioma de su navegador; si no es español ni inglés, a `/es`. Para mandar siempre a `/es`, agrega `localeDetection: false` en `src/i18n/routing.ts`.

## Hero: engrane 3D y remolino

- `gear-scene.js`: modelo y render en WebGL puro (sin three.js ni otras dependencias), basado en el icono de engrane con monitor `< >`. Sus tipos están en `gear-scene.d.ts`.
- `HeroGear.tsx` carga la escena cuando el navegador está libre, después del primer pintado, para no afectar el LCP. El engrane queda detrás del titular y se inclina levemente hacia el cursor.
- **Salida con el remolino:**
  - Al bajar, el lienzo queda fijo y la pantalla del monitor suelta “<” y “>”, cada uno por su lado.
  - El texto también queda fijo. Cada letra del nombre y del subtítulo, y cada botón, entra al remolino en una órbita que se cierra: gira cada vez más rápido, se ladea, se encoge y se desvanece en el centro. Los elementos más cercanos al remolino caen primero.
  - La cámara entra por el monitor y todo termina en pantalla negra, de donde nace el mapa.
- **Marcado que necesita `scroll-fx.js`:**
  - El contenido del hero va en un contenedor con `data-hero-content` y altura de pantalla completa.
  - Cada letra es un `<span data-ch>` y cada botón lleva `data-ch`.
  - El `h1` lleva `aria-label` con el nombre completo y las letras sueltas van con `aria-hidden`.
- Para el portal, `HeroGear` le pasa a la escena la sección siguiente (`#where`) y el hero lleva `z-[2]`.
- Con `prefers-reduced-motion` no hay portal ni remolino y el engrane queda quieto. Sin WebGL, el engrane simplemente no aparece.

## Sobre mí: mapa 3D de México narrado

- `mexico-scene.js`: WebGL puro, con `earcut.js` para triangular. Sus tipos están en `mexico-scene.d.ts`. Para alzar un estado desde código: `scene.setHeight('MX-SON', 0.1)`.
- `public/geo/mexico-states.json` (v2, 191 KB): límites estatales de Natural Earth, proyectados y triangulados de antemano.
- Estados destacados (origen y universidad): `originState`, `hometown` y `schoolState` en `src/lib/site.ts`.
- La sección es `Where.tsx` (`#where`): mide 700svh y su escenario queda fijo. El enlace “Sobre mí” apunta a `#about`, un ancla dentro de la sección donde México ya llena la pantalla.
- Recorrido con el scroll:
  1. Sale de la pantalla negra del engrane.
  2. **Nace México:** los estados brotan uno por uno, del centro hacia afuera, con rebote, en unos 1.3 s. Solo se dibuja México, sin países vecinos.
  3. La cámara se acerca a Todos Santos y Baja California Sur se alza.
  4. Un avión vuela a Guadalajara y deja la ruta **punteada**, blanca en el tema oscuro.
  5. Jalisco se alza y la cámara vuelve al mapa completo.
- Los cuatro textos (`Where.*` en `messages/*.json`), las cuatro barras de progreso y el momento en que se alza cada estado salen de `CHAPTERS` en `mexico-scene.js`.
- En pantallas anchas y apaisadas los textos del medio van a la izquierda, sobre un velo que les da contraste. En el resto van arriba y centrados.
- Al pasar el cursor por un estado se ve su nombre; con un clic se alza.
- Con `prefers-reduced-motion`, o sin JavaScript, la sección no se ancla: los textos quedan apilados y visibles.

## Herramientas: la pila por capas

- `Tools.tsx`: “Con qué trabajo” como una pila isométrica de cinco capas: Interfaz, Lógica, Datos, Servicios y Entrega.
- La sección lleva `data-pin` y `data-steps="0.29,0.46,0.63,0.8"`, mide 380svh y su escenario queda fijo:
  - al entrar, la pila se inclina y crece;
  - al bajar, las capas se separan y se enciende **una sola a la vez**, mientras la lista muestra sus herramientas.
- `scroll-fx.js` publica `--a0…--a4` con valor 0 o 1, sin intermedios. Las transiciones CSS de 200 ms hacen el cambio sin parpadeo.
- Cada fila de la lista lleva `data-goto` y, con un clic, lleva el scroll a su capa.
- Desde 768 px hay dos columnas. En móvil la pila va arriba y es más chica.
- Sin JavaScript o con `prefers-reduced-motion`, la sección no se fija y todas las capas quedan abiertas.

## Portafolio: galería horizontal

- `Portfolio.tsx`: una portada y un panel por proyecto, con resumen, cómo está hecho, resultado, cifras, stack, enlace y captura.
- **Galería horizontal** con la variante `hpin` de `globals.css`: pantallas de al menos 1024 × 720 px (alcanza una ventana maximizada normal), con movimiento y con JavaScript.
  - La sección se fija y el scroll vertical recorre la galería.
  - En la portada, el título se queda trabado mientras se llena de color.
  - Después pasa un panel por proyecto, con parallax: el nombre se adelanta, la captura se queda atrás y se descubre con `clip-path`.
  - Abajo al centro hay una barra de progreso.
  - Con N proyectos, la sección mide `(N + 2.3) × 100svh`.
- En el resto de los casos, los paneles van apilados.

## Contacto y pie de página

- Contacto: el correo se “teclea” al entrar en pantalla. El botón “Copiar correo” cambia a “Copiado” durante 2 s; si el navegador no deja copiar, abre el cliente de correo.
- Pie de página:
  - **Nombre:** “Karlo Cadena”, con aspecto de metal grabado (tokens `--name-*`), sube al entrar en pantalla (`data-enter`, `--e`). `FooterName.tsx` le pone un destello cada 5.2 s con la Web Animations API; no se anima con movimiento reducido.
  - Debajo van la navegación, las redes en círculos de vidrio y la barra con el copyright y “Volver arriba”.

## Efectos de scroll

- `scroll-fx.js` no tiene dependencias y sus tipos están en `scroll-fx.d.ts`. Lo monta `ScrollFx.tsx` sobre `document.body`, porque el pie queda fuera de `<main>`. Con movimiento reducido no se monta.
  - En cada `[data-pin]` publica `--live`, `--p` (0–1 mientras está fija) e `--in` (0–1 mientras entra), además de `--a0…` si lleva `data-steps`.
  - En cada `[data-enter]` publica `--live` y `--e`.
  - El marcado decide qué pasa en cada tramo con `calc()` y `clamp()`. Sin `--live` (sin JavaScript), todo queda en su estado final y visible.
- Las versiones fijas solo se activan si `<html>` tiene la clase `js`, que pone `themeScript` en `site.ts` y quita si React no hidrata en 3 s. Son las variantes `fx` y `hpin` en `globals.css`.

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
