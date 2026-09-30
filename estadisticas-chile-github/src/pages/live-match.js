import { ACTIONS, formatQuarter } from '../domain/matches.js';
import { totalRebounds, formatMinutes } from '../domain/statistics.js';
import { pageHeading, teamMark, playerAvatar, emptyState } from '../components/ui.js';
import { escapeHtml, formatClock, formatDate, safeColor } from '../utils/dom.js';

const quickScoringActions = ['point1', 'twoMade', 'threeMade'];
const shotActions = ['freeThrowMade', 'freeThrowMissed', 'twoMissed', 'threeMissed'];
const otherActions = ['offRebound', 'defRebound', 'assist', 'steal', 'block', 'turnover', 'foul'];

export function renderLiveMatch(store, match) {
  if (!match) return `${pageHeading('PARTIDO', 'Partido no encontrado', 'No existe un partido con este identificador.')}${emptyState('No encontramos el partido', 'Vuelve al historial de partidos.', '<a class="button button-secondary" href="#matches">Ver partidos</a>')}`;
  const home = store.teams.find(team => team.id === match.homeTeamId);
  const away = store.teams.find(team => team.id === match.awayTeamId);
  if (!home || !away) return `${pageHeading('PARTIDO', 'Equipos no disponibles', 'No podemos abrir este partido porque falta uno de los equipos.')}`;
  if (match.status === 'scheduled') return renderScheduledMatch(match, home, away);
  if (match.status === 'final') return renderFinalMatch(match, home, away);
  const selected = match.players.find(line => line.playerId === match.selectedPlayerId) || match.players[0];
  const homeFouls = match.teamFouls.home[match.quarter - 1] || 0;
  const awayFouls = match.teamFouls.away[match.quarter - 1] || 0;

  return `${pageHeading('MESA DE PARTIDO', `${home.name} vs ${away.name}`, `${formatDate(match.date)} · Partido en curso`, '<a class="button button-secondary" href="#matches">Volver a partidos</a>')}
    <div class="live-match-console" style="--home-color:${safeColor(home.color)};--away-color:${safeColor(away.color)}">
      <section class="live-scoreboard card" aria-label="Marcador del partido">
        <div class="score-side home-score-side"><div class="score-team-meta">${teamMark(home)}<div><span>LOCAL</span><strong>${escapeHtml(home.name)}</strong><small>Faltas del período <b>${homeFouls}</b></small></div></div><b class="score-value">${match.score.home}</b></div>
        <div class="score-center"><span class="quarter-label">${formatQuarter(match.quarter)}</span><strong id="match-clock">${formatClock(match.clockSeconds)}</strong><span class="clock-state">${match.clockRunning ? 'Reloj en marcha' : 'Reloj detenido'}</span><div class="score-controls"><button class="button button-small button-secondary" data-match-action="previous-quarter" aria-label="Período anterior">− período</button><button class="button button-small ${match.clockRunning ? 'button-warning' : 'button-primary'}" data-match-action="toggle-clock">${match.clockRunning ? 'Pausar' : 'Iniciar reloj'}</button><button class="button button-small button-secondary" data-match-action="next-quarter">+ período</button></div></div>
        <div class="score-side away-score-side"><div class="score-team-meta">${teamMark(away)}<div><span>VISITANTE</span><strong>${escapeHtml(away.name)}</strong><small>Faltas del período <b>${awayFouls}</b></small></div></div><b class="score-value">${match.score.away}</b></div>
      </section>
      <div class="live-columns" id="live-board">
        ${renderLiveRoster(match,'home',home)}
        <section class="live-center-column">
          ${renderCourtLineup(match,home,away)}
          ${renderActionPanel(match,selected)}
          ${renderSelectedSummary(selected,home,away)}
          <section class="card period-score-card"><div class="section-header"><div><h2>Marcador por período</h2><p>Resultado de cada cuarto y prórroga.</p></div></div>${renderPeriodScores(match,home,away)}</section>
          <section class="card recent-events-card"><div class="section-header"><div><h2>Últimas jugadas</h2><p>${match.events.length === 1 ? '1 acción registrada.' : `${match.events.length} acciones registradas.`}</p></div></div>${renderEvents(match,home,away)}</section>
        </section>
        ${renderLiveRoster(match,'away',away)}
      </div>
    </div>`;
}

function actionButton(type) {
  const action = ACTIONS[type];
  const group = quickScoringActions.includes(type) ? 'score-action' : '';
  return `<button class="live-action ${group}" data-stat-action="${type}" aria-label="${escapeHtml(action.label)}"><b>${escapeHtml(action.short)}</b><span>${escapeHtml(action.label)}</span></button>`;
}

function renderCourtLineup(match, home, away) {
  const playersFor = teamId => match.players.filter(line => line.teamId === teamId && line.onCourt)
    .slice().sort((a,b) => Number(a.number) - Number(b.number));
  const markersFor = (teamId, color) => playersFor(teamId).map(line => `<button class="court-player ${line.playerId === match.selectedPlayerId ? 'selected' : ''}" style="--marker-color:${color}" data-select-player="${line.playerId}" title="Seleccionar ${escapeHtml(line.displayName)}" aria-label="Seleccionar jugador número ${line.number}, ${escapeHtml(line.displayName)}" aria-pressed="${line.playerId === match.selectedPlayerId}">${line.number}</button>`).join('');
  return `<section class="card live-court-card"><div class="court-card-heading"><div><span class="eyebrow">QUINTETOS ACTIVOS</span><h2>Cancha en vivo</h2></div><small>Toca un dorsal para seleccionar jugador</small></div><div class="live-court" role="group" aria-label="Quintetos en cancha"><div class="court-side court-home"><span>LOCAL</span><div class="court-players">${markersFor('home','var(--home-color)')}</div></div><div class="court-midline"><i></i></div><div class="court-side court-away"><span>VISITA</span><div class="court-players">${markersFor('away','var(--away-color)')}</div></div></div><div class="court-key"><span><i class="home-dot"></i>${escapeHtml(home.name)}</span><span><i class="away-dot"></i>${escapeHtml(away.name)}</span></div></section>`;
}

function renderActionPanel(match, selected) {
  const selectedTeam = selected?.teamId === 'home' ? 'Local' : 'Visitante';
  return `<section class="card live-actions-card"><div class="section-header"><div><span class="eyebrow">ESTADÍSTICAS EN TIEMPO REAL</span><h2>Puntos y acciones</h2><p>${selected ? `Registrar para #${selected.number} ${escapeHtml(selected.displayName)} · ${selectedTeam}` : 'Selecciona un jugador desde las plantillas.'}</p></div><button class="button button-small button-secondary" data-match-action="undo" ${match.events.length ? '' : 'disabled'}>Deshacer</button></div>
      <div class="quick-point-actions">${quickScoringActions.map(type => actionButton(type)).join('')}</div>
      <div class="action-section"><h3>Tiros</h3><div class="live-action-grid">${shotActions.map(type => actionButton(type)).join('')}</div></div>
      <div class="action-section"><h3>Acciones de juego</h3><div class="live-action-grid">${otherActions.map(type => actionButton(type)).join('')}</div></div>
      <button class="button button-danger finish-button" data-match-action="finish">Finalizar partido</button>
    </section>`;
}

function renderSelectedSummary(selected, home, away) {
  if (!selected) return `<section class="card selected-live-player"><div class="eyebrow">JUGADOR SELECCIONADO</div><p>Selecciona un jugador desde una plantilla.</p></section>`;
  const team = selected.teamId === 'home' ? home : away;
  const stats = [
    ['PTS', selected.stats.points], ['REB', totalRebounds(selected.stats)],
    ['AST', selected.stats.assists], ['ROB', selected.stats.steals],
    ['TAP', selected.stats.blocks], ['FAL', selected.stats.fouls]
  ].map(([label,value]) => `<div><span>${label}</span><b>${value}</b></div>`).join('');
  return `<section class="card selected-live-player"><div class="selected-player-heading"><div><span class="eyebrow">SELECCIÓN ACTUAL</span><h2>Jugador seleccionado</h2></div><span class="selected-status ${selected.onCourt ? 'in-court' : ''}">${selected.onCourt ? 'EN CANCHA' : 'SUPLENTE'}</span></div><div class="selected-person">${playerAvatar(selected,'small')}<div><b>#${selected.number} ${escapeHtml(selected.displayName)}</b><small>${escapeHtml(team.name)} · ${escapeHtml(selected.position || 'Jugador')}</small></div><span class="selected-minutes"><b data-player-minutes="${selected.playerId}">${formatMinutes(selected.secondsPlayed)}</b><small>MIN</small></span></div><div class="selected-player-stats">${stats}</div></section>`;
}

function renderLiveRoster(match, teamId, team) {
  const lines = match.players.filter(line => line.teamId === teamId)
    .slice().sort((a,b) => Number(b.onCourt) - Number(a.onCourt) || Number(a.number) - Number(b.number));
  const totals = lines.reduce((sum,line) => ({
    points: sum.points + line.stats.points,
    rebounds: sum.rebounds + totalRebounds(line.stats),
    assists: sum.assists + line.stats.assists
  }), { points: 0, rebounds: 0, assists: 0 });
  const rows = lines.map(line => `<tr class="${line.playerId === match.selectedPlayerId ? 'selected' : ''}">
    <td>${line.number}</td><td><button class="live-player-select" data-select-player="${line.playerId}"><b>${escapeHtml(line.displayName)}</b><small>${escapeHtml(line.position || 'Jugador')}${line.onCourt ? ' · EN CANCHA' : ''}</small></button></td>
    <td>${line.stats.points}</td><td>${totalRebounds(line.stats)}</td><td>${line.stats.assists}</td><td><span data-player-minutes="${line.playerId}">${formatMinutes(line.secondsPlayed)}</span></td>
    <td><button class="lineup-toggle ${line.onCourt ? 'on' : ''}" data-toggle-lineup="${line.playerId}" title="${line.onCourt ? 'Sacar de cancha' : 'Poner en cancha'}" aria-label="${line.onCourt ? 'Sacar de cancha' : 'Poner en cancha'} a ${escapeHtml(line.displayName)}" aria-pressed="${line.onCourt}">${line.onCourt ? '●' : '○'}</button></td>
  </tr>`).join('');
  return `<section class="card live-roster ${teamId === 'away' ? 'visitor-roster' : ''}" style="--roster-color:${safeColor(team.color)}"><div class="live-roster-head">${teamMark(team,'small-mark')}<div><b>${escapeHtml(team.name)}</b><small>${teamId === 'home' ? 'LOCAL' : 'VISITANTE'} · ${lines.filter(line => line.onCourt).length} EN CANCHA / ${lines.length} JUGADORES</small></div></div><div class="table-scroll"><table class="live-roster-table"><thead><tr><th>#</th><th>Jugador</th><th>PTS</th><th>REB</th><th>AST</th><th>MIN</th><th>5</th></tr></thead><tbody>${rows}</tbody><tfoot><tr><th colspan="2">TOTALES</th><td>${totals.points}</td><td>${totals.rebounds}</td><td>${totals.assists}</td><td>—</td><td>—</td></tr></tfoot></table></div><div class="live-roster-foot">Selecciona jugador · ● en cancha · ○ suplente</div></section>`;
}

function renderPeriodScores(match, home, away) {
  const periodCount = Math.max(4, match.periodScores.home.length, match.periodScores.away.length);
  const headings = Array.from({length: periodCount}, (_, index) => `<th>${index < 4 ? `${index + 1}C` : `OT${index - 3}`}</th>`).join('');
  const cells = (teamId) => Array.from({length: periodCount}, (_, index) => `<td>${match.periodScores[teamId][index] || 0}</td>`).join('');
  return `<div class="table-scroll"><table class="data-table period-table"><thead><tr><th>Equipo</th>${headings}<th>Total</th></tr></thead><tbody><tr><th>${escapeHtml(home.name)}</th>${cells('home')}<td><b>${match.score.home}</b></td></tr><tr><th>${escapeHtml(away.name)}</th>${cells('away')}<td><b>${match.score.away}</b></td></tr></tbody></table></div>`;
}

function renderEvents(match, home, away) {
  if (!match.events.length) return emptyState('Sin acciones todavía', 'Cuando registres una acción aparecerá en esta lista.');
  return `<div class="event-list">${match.events.slice(-8).reverse().map(event => {
    const line = match.players.find(player => player.playerId === event.playerId);
    const team = event.teamId === 'home' ? home : away;
    return `<div class="event-row"><time>${formatClock(event.clockSeconds)}</time>${teamMark(team,'event-team-mark')}<span><b>${escapeHtml(line?.displayName || 'Jugador')}</b> · ${escapeHtml(ACTIONS[event.type]?.label || event.type)}</span><small>${event.quarter <= 4 ? `${event.quarter}C` : `OT${event.quarter - 4}`}</small></div>`;
  }).join('')}</div>`;
}

function renderScheduledMatch(match, home, away) {
  return `${pageHeading('PARTIDO PROGRAMADO', `${home.name} vs ${away.name}`, formatDate(match.date))}
    <section class="card scheduled-match"><div class="scheduled-teams"><div>${teamMark(home)}<b>${escapeHtml(home.name)}</b><small>LOCAL</small></div><strong>VS</strong><div>${teamMark(away)}<b>${escapeHtml(away.name)}</b><small>VISITANTE</small></div></div><p>Este partido aún no se ha iniciado. Puedes iniciarlo desde el historial de partidos.</p><a class="button button-primary" href="#matches">Volver a partidos</a></section>`;
}

function renderFinalMatch(match, home, away) {
  const scoringLine = teamId => match.players.filter(line => line.teamId === teamId).sort((a,b) => b.stats.points - a.stats.points).slice(0,5).map(line => `<div class="result-player">#${line.number} ${escapeHtml(line.displayName)} <b>${line.stats.points} pts</b></div>`).join('');
  return `${pageHeading('PARTIDO FINALIZADO', `${home.name} vs ${away.name}`, `${formatDate(match.date)} · Resultado guardado`, '<a class="button button-secondary" href="#matches">Volver a partidos</a>')}
    <section class="card final-result"><div>${teamMark(home)}<span>${escapeHtml(home.name)}</span><strong>${match.score.home}</strong></div><i>—</i><div>${teamMark(away)}<span>${escapeHtml(away.name)}</span><strong>${match.score.away}</strong></div></section>
    <div class="two-column-layout"><section class="card content-card"><h2>${escapeHtml(home.name)}</h2>${scoringLine('home') || '<p>No se registraron puntos.</p>'}</section><section class="card content-card"><h2>${escapeHtml(away.name)}</h2>${scoringLine('away') || '<p>No se registraron puntos.</p>'}</section></div>`;
}
