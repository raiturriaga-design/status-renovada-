import { pageHeading, statusBadge, teamMark, emptyState } from '../components/ui.js';
import { formatDate, escapeHtml } from '../utils/dom.js';

export function renderDashboard(store) {
  const live = store.matches.filter(match => match.status === 'live');
  const recent = store.matches.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4);
  const action = `<a class="button button-primary" href="#matches">＋ Crear partido</a>`;
  const recentMarkup = recent.length ? `<div class="match-list compact-list">${recent.map(match => matchRow(match, store.teams)).join('')}</div>` : emptyState('Aún no hay partidos', 'Crea el primer partido para comenzar a registrar estadísticas.', '<a class="button button-secondary" href="#matches">Ir a partidos</a>');
  return `${pageHeading('PANEL PRINCIPAL', 'Inicio', 'Resumen de equipos, jugadores y partidos.', action)}
    <section class="stat-cards">
      ${summaryCard('Equipos', store.teams.length, 'Registrados', '◈', '#dff5ea')}
      ${summaryCard('Jugadores', store.players.length, 'En la plataforma', '♙', '#e5eefc')}
      ${summaryCard('Partidos', store.matches.length, 'En total', '◷', '#fff2df')}
      ${summaryCard('En vivo', live.length, 'Partidos activos', '●', '#fde9e9')}
    </section>
    ${live.length ? `<section class="card live-banner"><div><span class="eyebrow">PARTIDO ACTIVO</span><h2>Hay ${live.length} partido${live.length === 1 ? '' : 's'} en curso</h2><p>Continúa registrando acciones y marcador.</p></div><a class="button button-primary" href="#match/${live[0].id}">Continuar partido</a></section>` : ''}
    <section class="card section-card"><div class="section-header"><div><h2>Actividad reciente</h2><p>Partidos creados y resultados recientes.</p></div><a class="text-link" href="#matches">Ver todos <span>→</span></a></div>${recentMarkup}</section>
    <section class="quick-links"><a class="quick-link" href="#teams"><span>◈</span><b>Crear equipo</b><small>Registra un club y sus datos</small></a><a class="quick-link" href="#players"><span>♙</span><b>Crear jugador</b><small>Asigna jugadores a un equipo</small></a><a class="quick-link" href="#matches"><span>◷</span><b>Crear partido</b><small>Prepara el siguiente encuentro</small></a></section>`;
}

function summaryCard(title, value, foot, icon, color) {
  return `<article class="card summary-card"><div class="summary-icon" style="--icon-bg:${color}">${icon}</div><div><span>${title}</span><strong>${value}</strong><small>${foot}</small></div></article>`;
}

export function matchRow(match, teams) {
  const home = teams.find(team => team.id === match.homeTeamId);
  const away = teams.find(team => team.id === match.awayTeamId);
  if (!home || !away) return '';
  const result = match.status === 'scheduled' ? '—' : `${match.score.home} : ${match.score.away}`;
  const action = match.status === 'scheduled'
    ? `<button class="button button-small button-primary" data-action="start-match" data-id="${match.id}">Iniciar</button>`
    : `<a class="button button-small ${match.status === 'live' ? 'button-primary' : 'button-secondary'}" href="#match/${match.id}">${match.status === 'live' ? 'Continuar' : 'Ver partido'}</a>`;
  return `<article class="match-row"><div class="match-date">${formatDate(match.date)}</div><div class="match-teams"><div>${teamMark(home,'mini')}<b>${escapeHtml(home.name)}</b></div><strong class="match-result">${result}</strong><div>${teamMark(away,'mini')}<b>${escapeHtml(away.name)}</b></div></div><div>${statusBadge(match.status)}</div><div>${action}</div></article>`;
}
