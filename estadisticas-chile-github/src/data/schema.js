export const STORAGE_KEY = 'estadisticas-chile:v1';

export function emptyStore() {
  return { version: 1, teams: [], players: [], matches: [] };
}
