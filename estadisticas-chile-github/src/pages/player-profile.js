import { pageHeading, playerAvatar, teamMark, emptyState } from '../components/ui.js';
import { aggregatePlayer, formatAverage, formatMinutes, totalRebounds } from '../domain/statistics.js';
import { formatDate, escapeHtml } from '../utils/dom.js';

export function renderPlayerProfile(store, playerId) {
  const player = store.players.find(item => item.id === playerId);
  if (!player) return `${pageHeading('FICHA', 'Jugador no encontrado', 'Este jugador no está registrado.')}${emptyState('No encontramos la ficha', 'Vuelve a la lista de jugadores.', '<a class="button button-secondary" href="#players">Ver jugadores</a>')}`;

  const team = store.teams.find(item => item.id === player.teamId);
  const { totals, perGame, history } = aggregatePlayer(player.id, store.matches);
  const statCards = [
    ['Partidos', totals.games, formatAverage(perGame.points) + ' pts / partido'],
    ['Minutos', formatMinutes(totals.secondsPlayed), formatAverage(perGame.minutes) + ' min / partido'],
    ['Puntos', totals.points, formatAverage(perGame.points) + ' por partido'],
    ['Rebotes', totalRebounds(totals), formatAverage(perGame.rebounds) + ' por partido'],
    ['Asistencias', totals.assists, formatAverage(perGame.assists) + ' por partido'],
    ['Robos', totals.steals, formatAverage(perGame.steals) + ' por partido']
  ];
  const stats = statCards.map(([label, total, average]) => `<article class="card profile-stat"><span>${label}</span><strong>${total}</strong><small>${average}</small></article>`).join('');
  const shotData = [
    ['Dobles', totals.twoMade, 'twoMade', 'twoAttempted'],
    ['Triples', totals.threeMade, 'threeMade', 'threeAttempted'],
    ['Tiros libres', totals.freeThrowsMade, 'freeThrowsMade', 'freeThrowsAttempted']
  ].map(([label, made, madeKey, attemptedKey]) => `<div class="detail-stat"><span>${label}</span><b>${made} / ${totals[attemptedKey]}</b><small>${totals[attemptedKey] ? formatAverage(totals[madeKey] / totals[attemptedKey] * 100) + '%' : '—'} · ${formatAverage(perGame[madeKey])} conv./partido</small></div>`).join('');
  const additionalStats = [
    ['Rebotes ofensivos', 'offRebounds'],
    ['Rebotes defensivos', 'defRebounds'],
    ['Tapones', 'blocks'],
    ['Pérdidas', 'turnovers'],
    ['Faltas', 'fouls']
  ].map(([label, key]) => `<div class="detail-stat"><span>${label}</span><b>${totals[key]}</b><small>${formatAverage(perGame[key])} por partido</small></div>`).join('');
  const historyRows = history.slice().reverse().map(({ match, line }) => {
    const opponentId = line.teamId === 'home' ? match.awayTeamId : match.homeTeamId;
    const opponent = store.teams.find(item => item.id === opponentId);
    return `<tr><td>${formatDate(match.date)}</td><td>${escapeHtml(opponent?.name || 'Rival')}</td><td>${formatMinutes(line.secondsPlayed)}</td><td>${line.stats.points}</td><td>${totalRebounds(line.stats)}</td><td>${line.stats.assists}</td><td>${line.stats.steals}</td><td>${line.stats.blocks}</td></tr>`;
  }).join('');

  return `${pageHeading('FICHA DEL JUGADOR', player.name, 'Estadísticas acumuladas de partidos finalizados.', `<a class="button button-secondary" href="#players/edit/${player.id}">Editar ficha</a>`)}
    <section class="card player-identity">${playerAvatar(player,'large')}<div class="identity-main"><div class="eyebrow">${team ? escapeHtml(team.name) : 'Sin equipo'}</div><h2>${escapeHtml(player.name)}</h2><p>${escapeHtml(player.position)} · N.º ${player.number}${player.age ? ` · ${player.age} años` : ''}${player.heightCm ? ` · ${player.heightCm} cm` : ''}</p></div>${team ? teamMark(team,'profile-team-mark') : ''}</section>
    <section class="profile-stats-grid">${stats}</section>
    <section class="card content-card"><div class="section-header"><div><h2>Detalle de tiro y juego</h2><p>Totales y promedios por partido finalizado.</p></div></div><div class="detail-stats-grid">${shotData}${additionalStats}</div></section>
    <section class="card content-card"><div class="section-header"><div><h2>Historial</h2><p>Rendimiento por partido finalizado.</p></div></div>${historyRows ? `<div class="table-scroll"><table class="data-table"><thead><tr><th>Fecha</th><th>Rival</th><th>MIN</th><th>PTS</th><th>REB</th><th>AST</th><th>ROB</th><th>TAP</th></tr></thead><tbody>${historyRows}</tbody></table></div>` : emptyState('Sin partidos finalizados', 'Cuando finalices un partido, sus estadísticas aparecerán aquí.')}</section>`;
}
