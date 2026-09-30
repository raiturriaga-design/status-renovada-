import { escapeHtml } from '../utils/dom.js';

const navigation = [
  ['dashboard', '⌂', 'Inicio'],
  ['teams', '◈', 'Equipos'],
  ['players', '♙', 'Jugadores'],
  ['matches', '◷', 'Partidos']
];

export function renderShell(routeName) {
  return `<div class="app-shell">
    <aside class="sidebar">
      <a class="brand" href="#dashboard"><span class="brand-mark">EC</span><span><b>ESTADÍSTICAS</b><small>CHILE · BÁSQUETBOL</small></span></a>
      <div class="nav-caption">GESTIÓN</div>
      <nav class="main-nav" aria-label="Navegación principal">${navigation.map(([route, icon, label]) => `<a class="nav-link ${routeName === route ? 'active' : ''}" href="#${route}"><span class="nav-icon">${icon}</span><span>${label}</span></a>`).join('')}</nav>
      <div class="sidebar-bottom"><span class="local-indicator"></span><div><b>Modo local</b><small>Datos guardados en este navegador</small></div></div>
    </aside>
    <main class="main-area"><header class="topbar"><button class="mobile-brand" data-action="toggle-menu" aria-label="Abrir menú" aria-expanded="false">☰</button><div><span class="topbar-kicker">PLATAFORMA DE GESTIÓN</span><strong>ESTADÍSTICAS CHILE</strong></div><span class="local-chip"><i></i> V1 · LOCAL</span></header><div class="page-content" id="page-content"></div></main>
  </div>`;
}

export function setActiveNavigation(routeName) {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === `#${routeName}`);
  });
}
