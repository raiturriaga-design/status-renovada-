import { pageHeading, statusBadge, teamMark, emptyState } from '../components/ui.js';
import { formatDate, localDateValue, escapeHtml } from '../utils/dom.js';

export function renderMatches(store) {
  const selectableTeams = store.teams.length >= 2;
  const form = selectableTeams ? `<form class="form-grid match-form" data-form="match">
    <label class="field"><span>Equipo local</span><select name="homeTeamId" required><option value="">Seleccionar equipo</option>${store.teams.map(team => `<option value="${team.id}">${escapeHtml(team.name)}</option>`).join('')}</select></label>
    <label class="field"><span>Equipo visitante</span><select name="awayTeamId" required><option value="">Seleccionar equipo</option>${store.teams.map(team => `<option value="${team.id}">${escapeHtml(team.name)}</option>`).join('')}</select></label>
    <label class="field"><span>Fecha</span><input name="date" type="date" required value="${localDateValue()}"></label>
    <div class="form-actions field-full"><button class="button button-primary" type="submit">Crear partido</button></div><div class="form-message field-full" role="status"></div>
  </form>` : emptyState('Faltan equipos', 'Crea al menos dos equipos para programar un partido.', '<a class="button button-secondary" href="#teams">Ir a equipos</a>');
  const matches = store.matches.slice().sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  const list = matches.length ? `<div class="match-list">${matches.map(match => matchCard(match,store.teams,store.players)).join('')}</div>` : emptyState('Aún no hay partidos', 'Programa un encuentro entre dos equipos para empezar.');
  return `${pageHeading('COMPETICIÓN', 'Partidos', 'Programa encuentros, lleva el marcador y guarda resultados.')}
    <section class="card content-card match-create-card"><div class="section-header"><div><h2>Crear partido</h2><p>El partido comenzará con los jugadores asignados a cada equipo.</p></div></div>${form}</section>
    <section class="card content-card"><div class="section-header"><div><h2>Historial de partidos</h2><p>${matches.length} partido${matches.length === 1 ? '' : 's'}.</p></div></div>${list}</section>`;
}

function matchCard(match, teams, players) {
  const home = teams.find(team => team.id === match.homeTeamId);
  const away = teams.find(team => team.id === match.awayTeamId);
  if (!home || !away) return '';
  const rosterCount = teamId => players.filter(player => player.teamId === teamId).length;
  const startButton = match.status === 'scheduled'
    ? `<button class="button button-small button-primary" data-action="start-match" data-id="${match.id}">Iniciar partido</button>`
    : `<a class="button button-small ${match.status === 'live' ? 'button-primary' : 'button-secondary'}" href="#match/${match.id}">${match.status === 'live' ? 'Continuar' : 'Ver estadísticas'}</a>`;
  const score = match.status === 'scheduled' ? '<span class="match-score pending">VS</span>' : `<span class="match-score">${match.score.home} <i>:</i> ${match.score.away}</span>`;
  const rosterNote = match.status === 'scheduled' ? `<small>Plantilla: ${rosterCount(home.id)} local · ${rosterCount(away.id)} visita</small>` : '';
  return `<article class="match-card"><div class="match-card-meta"><span>${formatDate(match.date)}</span>${statusBadge(match.status)}</div><div class="match-card-teams"><div class="match-side">${teamMark(home)}<div><b>${escapeHtml(home.name)}</b><small>LOCAL</small></div></div>${score}<div class="match-side visitor">${teamMark(away)}<div><b>${escapeHtml(away.name)}</b><small>VISITANTE</small></div></div></div><div class="match-card-footer">${rosterNote}${startButton}</div></article>`;
}
