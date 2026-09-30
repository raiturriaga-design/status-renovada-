import { emptyStats } from './statistics.js';
import { makeId } from '../data/repository.js';

const GAME_SECONDS = 10 * 60;
const OVERTIME_SECONDS = 5 * 60;

export const ACTIONS = {
  point1: { label: 'Punto manual (+1)', short: '+1', points: 1 },
  twoMade: { label: 'Doble convertido', short: '+2', points: 2 },
  threeMade: { label: 'Triple convertido', short: '+3', points: 3 },
  freeThrowMade: { label: 'Tiro libre convertido', short: 'TL +', points: 1 },
  freeThrowMissed: { label: 'Tiro libre fallado', short: 'TL —', points: 0 },
  twoMissed: { label: 'Doble fallado', short: '2P —', points: 0 },
  threeMissed: { label: 'Triple fallado', short: '3P —', points: 0 },
  offRebound: { label: 'Rebote ofensivo', short: 'RO', points: 0 },
  defRebound: { label: 'Rebote defensivo', short: 'RD', points: 0 },
  assist: { label: 'Asistencia', short: 'AS', points: 0 },
  steal: { label: 'Robo', short: 'ROB', points: 0 },
  block: { label: 'Tapón', short: 'TAP', points: 0 },
  turnover: { label: 'Pérdida', short: 'PER', points: 0 },
  foul: { label: 'Falta', short: 'FAL', points: 0 }
};

export function newMatch({ homeTeamId, awayTeamId, date }, teams) {
  if (!homeTeamId || !awayTeamId) throw new Error('Selecciona los dos equipos.');
  if (homeTeamId === awayTeamId) throw new Error('El equipo local y el visitante deben ser distintos.');
  const home = teams.find(team => team.id === homeTeamId);
  const away = teams.find(team => team.id === awayTeamId);
  if (!home || !away) throw new Error('No encontramos uno de los equipos seleccionados.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || Number.isNaN(new Date(`${date}T12:00:00`).getTime())) {
    throw new Error('Selecciona una fecha válida para el partido.');
  }
  return {
    id: makeId('match'), homeTeamId, awayTeamId, date,
    status: 'scheduled', quarter: 1, clockSeconds: GAME_SECONDS,
    score: { home: 0, away: 0 },
    periodScores: { home: [0, 0, 0, 0], away: [0, 0, 0, 0] },
    teamFouls: { home: [0, 0, 0, 0], away: [0, 0, 0, 0] },
    players: [], events: [], selectedPlayerId: null,
    createdAt: new Date().toISOString()
  };
}

export function startMatch(match, teams, players) {
  if (match.status !== 'scheduled') throw new Error('Este partido ya fue iniciado o finalizado.');
  const homeRoster = players.filter(player => player.teamId === match.homeTeamId);
  const awayRoster = players.filter(player => player.teamId === match.awayTeamId);
  if (homeRoster.length < 5 || awayRoster.length < 5) {
    throw new Error('Para iniciar un partido 5×5, cada equipo necesita al menos cinco jugadores asignados.');
  }
  const homeTeam = teams.find(team => team.id === match.homeTeamId);
  const awayTeam = teams.find(team => team.id === match.awayTeamId);
  if (!homeTeam || !awayTeam) throw new Error('Uno de los equipos ya no existe.');

  const snapshotRoster = (roster, teamId) => roster
    .slice()
    .sort((a, b) => Number(a.number) - Number(b.number))
    .map((player, index) => ({
      playerId: player.id,
      teamId,
      displayName: player.name,
      number: player.number,
      position: player.position,
      photo: player.photo || '',
      onCourt: index < 5,
      secondsPlayed: 0,
      stats: emptyStats()
    }));

  match.players = [
    ...snapshotRoster(homeRoster, 'home'),
    ...snapshotRoster(awayRoster, 'away')
  ];
  match.selectedPlayerId = match.players.find(player => player.teamId === 'home')?.playerId || null;
  match.status = 'live';
  match.startedAt = new Date().toISOString();
  return match;
}

export function recordAction(match, type, playerId) {
  if (match.status !== 'live') throw new Error('El partido no está en curso.');
  if (!ACTIONS[type]) throw new Error('Acción estadística desconocida.');
  const player = match.players.find(line => line.playerId === playerId);
  if (!player) throw new Error('Selecciona un jugador de este partido.');
  match.events.push({
    id: makeId('event'), type, playerId, teamId: player.teamId,
    quarter: match.quarter, clockSeconds: match.clockSeconds,
    createdAt: new Date().toISOString()
  });
  applyAction(match, match.events.at(-1));
  return match;
}

function applyAction(match, event) {
  const line = match.players.find(player => player.playerId === event.playerId);
  if (!line) return;
  const stats = line.stats;
  const team = event.teamId;
  const quarterIndex = Math.max(0, event.quarter - 1);
  ensurePeriod(match, quarterIndex);

  switch (event.type) {
    case 'point1': stats.points += 1; break;
    case 'twoMade': stats.points += 2; stats.twoMade += 1; stats.twoAttempted += 1; break;
    case 'threeMade': stats.points += 3; stats.threeMade += 1; stats.threeAttempted += 1; break;
    case 'freeThrowMade': stats.points += 1; stats.freeThrowsMade += 1; stats.freeThrowsAttempted += 1; break;
    case 'freeThrowMissed': stats.freeThrowsAttempted += 1; break;
    case 'twoMissed': stats.twoAttempted += 1; break;
    case 'threeMissed': stats.threeAttempted += 1; break;
    case 'offRebound': stats.offRebounds += 1; break;
    case 'defRebound': stats.defRebounds += 1; break;
    case 'assist': stats.assists += 1; break;
    case 'steal': stats.steals += 1; break;
    case 'block': stats.blocks += 1; break;
    case 'turnover': stats.turnovers += 1; break;
    case 'foul': stats.fouls += 1; match.teamFouls[team][quarterIndex] += 1; break;
  }
  const points = ACTIONS[event.type].points;
  match.score[team] += points;
  match.periodScores[team][quarterIndex] += points;
}

function ensurePeriod(match, index) {
  for (const team of ['home', 'away']) {
    while (match.periodScores[team].length <= index) match.periodScores[team].push(0);
    while (match.teamFouls[team].length <= index) match.teamFouls[team].push(0);
  }
}

export function undoLastAction(match) {
  if (match.status !== 'live' || !match.events.length) return false;
  match.events.pop();
  const secondsByPlayer = new Map(match.players.map(player => [player.playerId, player.secondsPlayed]));
  match.score = { home: 0, away: 0 };
  const periodCount = Math.max(4, match.quarter, ...match.periodScores.home.map((_, index) => index + 1));
  match.periodScores = { home: Array(periodCount).fill(0), away: Array(periodCount).fill(0) };
  match.teamFouls = { home: Array(periodCount).fill(0), away: Array(periodCount).fill(0) };
  for (const player of match.players) {
    player.stats = emptyStats();
    player.secondsPlayed = secondsByPlayer.get(player.playerId) || 0;
  }
  for (const event of match.events) applyAction(match, event);
  return true;
}

export function toggleOnCourt(match, playerId) {
  if (match.status !== 'live') throw new Error('El partido no está en curso.');
  const line = match.players.find(player => player.playerId === playerId);
  if (!line) throw new Error('Jugador no encontrado.');
  const onCourt = match.players.filter(player => player.teamId === line.teamId && player.onCourt);
  if (!line.onCourt && onCourt.length >= 5) throw new Error('Ya hay cinco jugadores en cancha. Quita uno antes de hacer el cambio.');
  line.onCourt = !line.onCourt;
  return line.onCourt;
}

export function advanceQuarter(match, direction = 1) {
  if (match.status !== 'live') throw new Error('El partido no está en curso.');
  match.quarter = Math.max(1, match.quarter + direction);
  match.clockSeconds = match.quarter > 4 ? OVERTIME_SECONDS : GAME_SECONDS;
  ensurePeriod(match, match.quarter - 1);
  return match;
}

export function finalizeMatch(match) {
  if (match.status !== 'live') throw new Error('Solo se puede finalizar un partido en curso.');
  match.status = 'final';
  match.clockRunning = false;
  match.finishedAt = new Date().toISOString();
  return match;
}

export function formatQuarter(quarter) {
  return quarter <= 4 ? `${quarter}° cuarto` : `${quarter - 4}° prórroga`;
}
