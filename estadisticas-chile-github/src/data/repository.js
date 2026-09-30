import { emptyStore, STORAGE_KEY } from './schema.js';

export function readStore() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return emptyStore();
    const data = JSON.parse(saved);
    if (data.version !== 1 || !Array.isArray(data.teams) || !Array.isArray(data.players) || !Array.isArray(data.matches)) {
      return emptyStore();
    }
    return data;
  } catch {
    return emptyStore();
  }
}

export function writeStore(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return { ok: true };
  } catch {
    return { ok: false, error: 'No se pudieron guardar los datos. Puede que el almacenamiento del navegador esté lleno.' };
  }
}

export function updateStore(mutator) {
  const data = readStore();
  const result = mutator(data);
  const saved = writeStore(data);
  if (!saved.ok) throw new Error(saved.error);
  return result;
}

export function makeId(prefix) {
  const randomId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${randomId}`;
}

export function getTeam(id) {
  return readStore().teams.find(team => team.id === id) || null;
}

export function getPlayer(id) {
  return readStore().players.find(player => player.id === id) || null;
}

export function getMatch(id) {
  return readStore().matches.find(match => match.id === id) || null;
}
