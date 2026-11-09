import './style.css';

const arrow = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const external = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

interface Project {
  number: string;
  category: string;
  title: string;
  description: string;
  status: string;
  stack: string[];
  details: string[];
  icon: string;
  theme: string;
}

const projects: Project[] = [
  {
    number: '01', category: 'VOLUNTARIADO · FULL-STACK',
    title: 'Tecnología para quienes<br />nos cuidan.',
    description: 'Plataforma bilingüe de donaciones para el Patronato de Bomberos Voluntarios de Todos Santos.',
    status: 'Lanzamiento público pendiente',
    stack: ['Next.js', 'TypeScript', 'Stripe', 'Supabase'],
    details: [
      'Donaciones únicas y recurrentes en MXN, con confirmación de pagos mediante webhooks firmados y manejo idempotente de eventos.',
      'Panel administrativo protegido, base de datos PostgreSQL y experiencia en español e inglés.',
      'Desarrollo voluntario desde 2026, en colaboración directa con la dirección del patronato.',
    ],
    icon: '<path d="M24 8c2 8-5 9-2 16 4-1 6-5 6-8 6 5 11 12 7 20-5 10-22 8-24-3-1-7 3-13 8-17-1 6 0 8 2 9 5-5 1-9 3-17Z"/>',
    theme: 'forest',
  },
  {
    number: '02', category: 'IMPACTO SOCIAL · BACKEND',
    title: 'Menos hojas de cálculo.<br />Más impacto.',
    description: 'Sistema de facturación y cobranza para la fundación de terapias Juntos por los Demás.',
    status: 'En pruebas',
    stack: ['Next.js', 'Prisma', 'Auth.js', 'Vitest'],
    details: [
      'Reconstrucción de un prototipo para gestionar recargos, descuentos y conciliación de transferencias bancarias.',
      'Acceso por roles de administración, personal y contabilidad, con procesamiento mensual automatizado.',
      'Más de 200 pruebas con Vitest e integración continua en GitHub Actions.',
    ],
    icon: '<rect x="12" y="8" width="24" height="32" rx="3"/><path d="M19 17h10M19 24h10M19 31h5m10-1 4 4 7-8"/>',
    theme: 'sand',
  },
  {
    number: '03', category: 'RETO ACADÉMICO · FINTECH',
    title: 'Crédito, dentro de<br />la experiencia.',
    description: 'Extensión de Chrome para un reto de Kueski en el Tec de Monterrey: opciones de pago durante la compra.',
    status: 'Prototipo académico',
    stack: ['React', 'Vite', 'Supabase', 'Chrome MV3'],
    details: [
      'Detección de productos y precios en páginas de comercios mediante content scripts.',
      'Calculadora de pagos a plazos adaptada al puntaje crediticio del usuario.',
      'Esquema PostgreSQL de cinco tablas con políticas de seguridad a nivel de fila para aislar la información de cada usuario.',
    ],
    icon: '<rect x="6" y="12" width="36" height="26" rx="5"/><path d="M6 21h36M13 30h8m12-23-5 10h8l-5 10"/>',
    theme: 'clay',
  },
];

const projectMarkup = projects.map((project) => `
  <article class="project-card ${project.theme}">
    <div class="project-top"><span class="eyebrow">${project.category}</span><span class="project-number">${project.number}</span></div>
    <svg class="project-icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${project.icon}</svg>
    <h3>${project.title}</h3>
    <p class="project-description">${project.description}</p>
    <div class="tags">${project.stack.map((item) => `<span>${item}</span>`).join('')}</div>
    <details>
      <summary>Explorar proyecto <span class="details-plus" aria-hidden="true">+</span></summary>
      <div class="project-details"><p class="project-status">${project.status}</p><ul>${project.details.map((detail) => `<li>${detail}</li>`).join('')}</ul></div>
    </details>
  </article>
`).join('');

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <a class="skip-link" href="#contenido">Ir al contenido</a>
  <header class="site-header wrap">
    <a class="brand" href="#inicio" aria-label="Karlo Cadena, inicio"><span class="brand-mark">kc<span>.</span></span><span class="brand-caption">KARLO CADENA<br /><span>DESARROLLO DE SOFTWARE</span></span></a>
    <nav aria-label="Navegación principal">
      <a href="#proyectos">Proyectos</a>
      <a href="#sobre-mi">Sobre mí</a>
      <a class="nav-contact" href="#contacto">Hablemos ${external}</a>
    </nav>
  </header>
  <main id="contenido">
    <section class="hero wrap" id="inicio" aria-labelledby="hero-title">
      <div class="hero-content">
        <div class="availability"><span class="status-dot"></span>Buscando internship · Verano 2027</div>
        <h1 id="hero-title">Karlo Sebastian<br /><span>Cadena Cota<span class="name-dot">.</span></span></h1>
        <p class="hero-intro">Construyo software.<br />Me mueve lo que puede <em>cambiar.</em></p>
        <p class="hero-description">Estudiante de tecnologías computacionales, desarrollador full-stack y curioso por la inteligencia artificial. De una idea a una solución que le sirve a alguien.</p>
        <div class="hero-actions"><a class="button button-dark" href="#proyectos">Conoce mi trabajo ${arrow}</a><a class="text-link" href="https://github.com/Karlocc86" target="_blank" rel="noopener noreferrer">GitHub ${external}<span class="sr-only"> (abre en otra pestaña)</span></a></div>
      </div>
      <aside class="hero-aside" aria-label="Mi enfoque">
        <div class="orbit-art" aria-hidden="true">
          <svg viewBox="0 0 360 350" fill="none">
            <path d="M180 20v310M25 175h310" stroke="currentColor" opacity=".13" stroke-dasharray="3 7"/>
            <circle cx="180" cy="175" r="134" stroke="currentColor" opacity=".18"/>
            <ellipse cx="180" cy="175" rx="134" ry="55" stroke="currentColor" opacity=".35" transform="rotate(-36 180 175)"/>
            <ellipse cx="180" cy="175" rx="134" ry="55" stroke="currentColor" opacity=".35" transform="rotate(36 180 175)"/>
            <circle cx="180" cy="175" r="70" fill="#e9e8dd" stroke="currentColor" opacity=".65"/>
            <path d="m158 153-23 22 23 22m44-44 23 22-23 22m-14-53-16 62" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="74" cy="94" r="8" fill="#a64c34"/><circle cx="280" cy="264" r="5" fill="#283e35"/><circle cx="301" cy="122" r="4" fill="#283e35"/>
          </svg>
          <span class="art-label art-label-top">IDEAS</span><span class="art-label art-label-bottom">IMPACTO REAL</span>
        </div>
        <div class="aside-note"><span class="small-cross" aria-hidden="true">+</span><p>La mejor parte de programar:<br /><strong>hacer que algo sea posible.</strong></p></div>
      </aside>
      <div class="hero-bottom"><span><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M16 8c0 5-6 10-6 10S4 13 4 8a6 6 0 1 1 12 0Z" stroke="currentColor"/><circle cx="10" cy="8" r="2" stroke="currentColor"/></svg>Guadalajara, México</span><span>Tec de Monterrey <i aria-hidden="true">/</i> ITC · Generación 2028</span><a href="#proyectos" aria-label="Bajar a proyectos">SIGUE EXPLORANDO <span aria-hidden="true">↓</span></a></div>
    </section>
    <section class="projects-section wrap" id="proyectos" aria-labelledby="projects-title">
      <div class="section-heading"><div><p class="eyebrow section-label">01 / TRABAJO SELECCIONADO</p><h2 id="projects-title">Código con <em>propósito.</em></h2></div><p>Proyectos para resolver problemas reales.<br />De lo social a lo financiero.</p></div>
      <div class="project-grid">${projectMarkup}</div>
    </section>
    <section class="about-section wrap" id="sobre-mi" aria-labelledby="about-title">
      <div class="about-copy"><p class="eyebrow section-label">02 / DETRÁS DEL CÓDIGO</p><h2 id="about-title">Curiosidad que<br />se vuelve <em>acción.</em></h2><p>Estudio Ingeniería en Tecnologías Computacionales en el Tecnológico de Monterrey, campus Guadalajara, con graduación prevista en julio de 2028.</p><p>Me interesa construir de principio a fin: entender un problema, diseñar sus datos y crear una experiencia que funcione. He llevado esa curiosidad a organizaciones sociales, retos de industria y hackathons.</p><div class="languages"><span>Español <strong>Nativo</strong></span><span>Inglés <strong>Fluido</strong></span></div></div>
      <div class="toolbox"><div class="toolbox-heading"><span class="eyebrow">MI CAJA DE HERRAMIENTAS</span><span aria-hidden="true">{ }</span></div><div class="skill-row"><h3>Lenguajes</h3><p>TypeScript · Python · C++ · SQL</p></div><div class="skill-row"><h3>Frontend & backend</h3><p>React · Next.js · Node.js · PostgreSQL · Prisma · REST APIs</p></div><div class="skill-row"><h3>Servicios & herramientas</h3><p>Supabase · Stripe · Vercel · GitHub Actions · Git · Linux · Vitest</p></div><div class="award"><span aria-hidden="true">✳</span><p><strong>Oro en la Olimpiada Estatal de Física</strong><br />Baja California Sur, 2022 · Delegación estatal en la Olimpiada Nacional</p></div></div>
    </section>
    <section class="hackathons-section wrap" aria-labelledby="hackathons-title">
      <div class="section-heading"><div><p class="eyebrow section-label">03 / APRENDER CONSTRUYENDO</p><h2 id="hackathons-title">Ideas contra el reloj.</h2></div><span class="section-note">COLABORAR. EXPERIMENTAR. CREAR.</span></div>
      <div class="event-list">
        <article class="event"><span class="event-date">MAY 2026</span><div><h3>GuadalaHacks <span>SOS360</span></h3><p>Asistencia de emergencias sin conexión, con modelos locales de IA y análisis geoespacial. Un prototipo en 24 horas.</p></div><span class="event-role">Participante</span></article>
        <article class="event"><span class="event-date">OCT 2025</span><div><h3>HackMTY <span>Reto gategroup</span></h3><p>Optimización de logística de catering con Python, un escáner Android e IA. Lideré un equipo de cuatro desarrolladores.</p></div><span class="event-role">Líder de equipo</span></article>
        <article class="event"><span class="event-date">MAY 2025</span><div><h3>BR41N.io <span>Equipo internacional</span></h3><p>Interfaz cerebro-computadora: procesamiento de señales EEG en tiempo real y una herramienta de accesibilidad geoespacial.</p></div><span class="event-role">Participante</span></article>
      </div>
    </section>
    <section class="contact-section" id="contacto" aria-labelledby="contact-title"><div class="contact-inner wrap"><div><p class="eyebrow">04 / SIGUIENTE PASO</p><h2 id="contact-title">Las buenas ideas<br />empiezan con un <em>hola.</em></h2><p>Busco una oportunidad de Software Engineering para verano de 2027.<br />También me encantará conocer lo que estás construyendo.</p><a class="contact-email" href="mailto:sebastian.cota86@gmail.com">sebastian.cota86@gmail.com ${external}</a></div><div class="contact-side"><span class="contact-asterisk" aria-hidden="true">✳</span><a href="https://www.linkedin.com/in/karlo-sebastian-cadena-cota" target="_blank" rel="noopener noreferrer">Conectemos en LinkedIn ${external}<span class="sr-only"> (abre en otra pestaña)</span></a></div></div></section>
  </main>
  <footer class="site-footer wrap"><a class="footer-name" href="#inicio">Karlo Sebastian Cadena Cota<span>.</span></a><span>Hecho con intención, desde México.</span><span>© ${new Date().getFullYear()}</span></footer>
`;
