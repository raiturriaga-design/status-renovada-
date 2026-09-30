import test from 'node:test';
import assert from 'node:assert/strict';
import { aggregatePlayer, totalRebounds } from '../src/domain/statistics.js';
import { advanceQuarter, finalizeMatch, newMatch, recordAction, startMatch, toggleOnCourt, undoLastAction } from '../src/domain/matches.js';

function fixture() {
  const teams = [{ id: 'home', name: 'Equipo Local' }, { id: 'away', name: 'Equipo Visitante' }];
  const players = [
    ...Array.from({ length: 6 }, (_, index) => ({ id: `h${index + 1}`, teamId: 'home', name: `Local ${index + 1}`, number: index + 1, position: 'Alero' })),
    ...Array.from({ length: 5 }, (_, index) => ({ id: `a${index + 1}`, teamId: 'away', name: `Visita ${index + 1}`, number: index + 1, position: 'Base' }))
  ];
  const match = newMatch({ homeTeamId: 'home', awayTeamId: 'away', date: '2026-09-30' }, teams);
  startMatch(match, teams, players);
  return { match, teams, players };
}

test('crea el encuentro con dos equipos distintos y exige cinco jugadores por equipo', () => {
  const { match } = fixture();
  assert.equal(match.status, 'live');
  assert.equal(match.players.length, 11);
  assert.equal(match.players.filter(line => line.teamId === 'home' && line.onCourt).length, 5);
  assert.equal(match.players.filter(line => line.teamId === 'away' && line.onCourt).length, 5);
  assert.throws(() => newMatch({ homeTeamId: 'home', awayTeamId: 'home', date: '2026-09-30' }, [{ id: 'home' }]), /distintos/);
});

test('registra puntos, tiros, rebotes y faltas en jugador y marcador', () => {
  const { match } = fixture();
  for (const type of ['twoMade', 'threeMade', 'freeThrowMade', 'freeThrowMissed', 'offRebound', 'defRebound', 'assist', 'steal', 'block', 'turnover', 'foul']) {
    recordAction(match, type, 'h1');
  }
  const line = match.players.find(item => item.playerId === 'h1');
  assert.equal(match.score.home, 6);
  assert.equal(match.periodScores.home[0], 6);
  assert.equal(match.teamFouls.home[0], 1);
  assert.equal(line.stats.points, 6);
  assert.equal(line.stats.twoMade, 1);
  assert.equal(line.stats.twoAttempted, 1);
  assert.equal(line.stats.threeMade, 1);
  assert.equal(line.stats.freeThrowsMade, 1);
  assert.equal(line.stats.freeThrowsAttempted, 2);
  assert.equal(totalRebounds(line.stats), 2);
  assert.equal(line.stats.assists, 1);
  assert.equal(line.stats.steals, 1);
  assert.equal(line.stats.blocks, 1);
  assert.equal(line.stats.turnovers, 1);
  assert.equal(line.stats.fouls, 1);
});

test('deshace la última jugada sin perder minutos ya jugados', () => {
  const { match } = fixture();
  recordAction(match, 'twoMade', 'h1');
  match.players[0].secondsPlayed = 90;
  recordAction(match, 'foul', 'h1');
  assert.equal(undoLastAction(match), true);
  assert.equal(match.score.home, 2);
  assert.equal(match.teamFouls.home[0], 0);
  assert.equal(match.players[0].secondsPlayed, 90);
  assert.equal(undoLastAction(match), true);
  assert.equal(match.score.home, 0);
  assert.equal(undoLastAction(match), false);
});

test('mantiene cinco jugadores en cancha y permite sustituciones', () => {
  const { match } = fixture();
  assert.throws(() => toggleOnCourt(match, 'h6'), /cinco/);
  toggleOnCourt(match, 'h1');
  assert.equal(toggleOnCourt(match, 'h6'), true);
  assert.equal(match.players.filter(line => line.teamId === 'home' && line.onCourt).length, 5);
});

test('abre prórrogas de cinco minutos y registra el marcador en el período correcto', () => {
  const { match } = fixture();
  advanceQuarter(match, 1);
  advanceQuarter(match, 1);
  advanceQuarter(match, 1);
  assert.equal(match.quarter, 4);
  advanceQuarter(match, 1);
  assert.equal(match.quarter, 5);
  assert.equal(match.clockSeconds, 300);
  recordAction(match, 'threeMade', 'a1');
  assert.equal(match.score.away, 3);
  assert.equal(match.periodScores.away[4], 3);
});

test('suma estadísticas acumuladas y promedios solo al finalizar el partido', () => {
  const { match } = fixture();
  recordAction(match, 'twoMade', 'h1');
  recordAction(match, 'offRebound', 'h1');
  match.players.find(line => line.playerId === 'h1').secondsPlayed = 120;
  assert.equal(aggregatePlayer('h1', [match]).totals.games, 0);
  finalizeMatch(match);
  const result = aggregatePlayer('h1', [match]);
  assert.equal(result.totals.games, 1);
  assert.equal(result.totals.points, 2);
  assert.equal(result.totals.offRebounds, 1);
  assert.equal(result.perGame.points, 2);
  assert.equal(result.perGame.minutes, 2);
  assert.equal(result.history.length, 1);
});
