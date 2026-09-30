export const STAT_KEYS = [
  'points', 'twoMade', 'twoAttempted', 'threeMade', 'threeAttempted',
  'freeThrowsMade', 'freeThrowsAttempted', 'offRebounds', 'defRebounds',
  'assists', 'steals', 'blocks', 'turnovers', 'fouls'
];

export function emptyStats() {
  return Object.fromEntries(STAT_KEYS.map(key => [key, 0]));
}

export function totalRebounds(stats) {
  return Number(stats.offRebounds || 0) + Number(stats.defRebounds || 0);
}

export function appeared(line) {
  return Number(line.secondsPlayed || 0) > 0 || STAT_KEYS.some(key => Number(line.stats?.[key] || 0) > 0);
}

export function aggregatePlayer(playerId, matches) {
  const totals = { games: 0, secondsPlayed: 0, ...emptyStats() };
  const history = [];

  for (const match of matches) {
    if (match.status !== 'final') continue;
    const line = (match.players || []).find(item => item.playerId === playerId);
    if (!line || !appeared(line)) continue;

    totals.games += 1;
    totals.secondsPlayed += Number(line.secondsPlayed || 0);
    for (const key of STAT_KEYS) totals[key] += Number(line.stats?.[key] || 0);
    history.push({ match, line });
  }

  const perGame = {};
  for (const key of STAT_KEYS) perGame[key] = totals.games ? totals[key] / totals.games : 0;
  perGame.rebounds = totals.games ? totalRebounds(totals) / totals.games : 0;
  perGame.minutes = totals.games ? totals.secondsPlayed / 60 / totals.games : 0;

  return { totals, perGame, history };
}

export function formatMinutes(seconds) {
  const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

export function formatAverage(value, digits = 1) {
  return (Number(value) || 0).toLocaleString('es-CL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits
  });
}

export function percentage(made, attempted) {
  return attempted ? `${Math.round((made / attempted) * 100)}%` : '—';
}
