# Karlo Sebastian Cadena Cota

Página personal basada en el CV, hecha con TypeScript y Vite. Dominio previsto: **https://kscc.tech**. La versión de producción es estática e incluye un servidor HTTP opcional en Node.js.

## Ejecutar

Requiere Node.js 22.18 o posterior y npm. Desde la carpeta del proyecto:

```sh
npm install
npm run dev
```

Para compilar y ejecutar la versión de producción:

```sh
npm run build
npm start
```

`npm test` compila el proyecto y ejecuta las pruebas del servidor. `npm start` escucha en `http://127.0.0.1:8080`; usa `HOST` y `PORT` para cambiarlo. Recompila después de editar la página.

## Publicar en kscc.tech

En un hosting estático, sube **el contenido de `dist/`** a la raíz pública de `kscc.tech`, por ejemplo `public_html/`. No necesitas Node.js en ese hosting.

Para usar el servidor incluido, conserva `dist/`, `build-server/` y `package.json`, ejecuta `npm start` desde la carpeta del proyecto y configura el hosting o proxy para enviarle las solicitudes de `kscc.tech`. El servidor Node.js usa HTTP: **el certificado TLS se instala en el hosting o proxy que recibe las conexiones HTTPS**.

Configura los registros del dominio necesarios para apuntar al hosting. El registro de validación de ZeroSSL se configura por separado y no dirige el tráfico de la página.

## ZeroSSL: validación DNS

El método elegido para el certificado es **DNS (CNAME)**. No requiere publicar un archivo HTTP ni abrir el puerto 80 para validar el dominio.

1. Abre la solicitud de certificado para `kscc.tech` en ZeroSSL y elige **DNS (CNAME)**.
2. Copia los valores únicos **Name** y **Value** de esa solicitud al panel DNS de `kscc.tech`, usando el tipo **CNAME**. Conserva exactamente el valor de destino. ZeroSSL indica un TTL de 3600 segundos o menos.
3. Si el panel agrega `.kscc.tech` automáticamente al nombre, introduce solo el prefijo que te da ZeroSSL para evitar duplicar el dominio. Si pide el nombre completo, usa el nombre completo entregado por ZeroSSL.
4. Comprueba que una consulta CNAME al nombre completo devuelve el destino esperado y ejecuta la verificación en ZeroSSL.
5. Cuando ZeroSSL emita el certificado, instálalo con su cadena y clave privada en tu hosting o proxy HTTPS. Mantén la clave privada fuera del repositorio y de los archivos públicos.

Si tu DNS usa Cloudflare, el registro de validación debe estar en **DNS only**. Si el certificado incluye otros nombres, como `www.kscc.tech`, sigue las instrucciones que ZeroSSL muestre para cada uno.

Ejemplo de comprobación en PowerShell, sustituyendo el marcador por el nombre real de ZeroSSL:

```powershell
Resolve-DnsName -Type CNAME '_PREFIJO-REAL.kscc.tech'
```

No se dispone todavía de los valores CNAME de la solicitud. Este proyecto no modifica registros DNS ni solicita, instala o renueva certificados automáticamente. La URL indicada es el destino previsto; no confirma que el sitio esté publicado o que HTTPS ya funcione.

Referencias oficiales: [verificar dominios en ZeroSSL](https://help.zerossl.com/hc/en-us/articles/360058295354-Verify-Domains-for-an-SSL-Certificate) y [comprobar la validación CNAME](https://help.zerossl.com/hc/en-us/articles/360060120213-Troubleshooting-DNS-CNAME-Verification).

## Carpetas HTTP opcionales

Se conservan `public/.well-known/pki-validation/` y `public/.well-known/acme-challenge/` por si más adelante eliges una validación HTTP. **No se utilizan para la validación DNS actual.** El servidor incluido sirve los archivos presentes sin redirecciones y responde `404` si faltan. Si llegas a usarlos con hosting estático, inclúyelos al compilar y publicar `dist/`.

## Archivos principales

- `src/`: página y estilos.
- `public/`: archivos que Vite copia a `dist/`.
- `server/server.ts`: servidor HTTP de producción.
- `tests/server.test.mjs`: pruebas de rutas, validación HTTP y acceso a archivos.
