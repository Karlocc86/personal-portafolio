export type Theme = 'light' | 'dark';

/** Tema cuando el visitante aún no ha elegido uno. */
export const DEFAULT_THEME: Theme = 'dark';

export const site = {
  url: 'https://kscc.tech',
  domain: 'kscc.tech',
  name: 'Karlo Sebastián Cadena Cota',
  givenName: 'Karlo Sebastián',
  familyName: 'Cadena Cota',
  email: 'sebastian.cota86@gmail.com',
  github: 'https://github.com/Karlocc86',
  githubUser: 'Karlocc86',
  linkedin: 'https://www.linkedin.com/in/karlo-sebastian-cadena-cota',
  /** Estados destacados en el mapa 3D (id ISO 3166-2 de mexico-states.json). */
  originState: { id: 'MX-BCS', name: 'Baja California Sur' },
  /** Lugar exacto de la casa (clave de `places` en mexico-states.json). */
  hometown: { name: 'Todos Santos', place: 'tds' },
  schoolState: { id: 'MX-JAL', name: 'Jalisco' },
} as const;

/**
 * Se ejecuta en <head> antes del primer pintado: aplica el tema guardado (o el
 * predeterminado) sin parpadeo y activa las animaciones de scroll. Si React no
 * hidrata en 3 s, se quita la clase `js` para que el contenido nunca quede oculto.
 */
export const themeScript = `(function(){var d=document.documentElement;var t='${DEFAULT_THEME}';try{var s=localStorage.getItem('theme');if(s==='light'||s==='dark'){t=s;}}catch(e){}d.classList.toggle('dark',t==='dark');d.style.colorScheme=t;d.classList.add('js');setTimeout(function(){if(!window.__reveal){d.classList.remove('js');}},3000);})();`;
