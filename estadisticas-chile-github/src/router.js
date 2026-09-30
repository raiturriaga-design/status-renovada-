export function currentRoute() {
  const parts = window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (!parts.length) return { name: 'dashboard', id: null, mode: null };
  if (parts[0] === 'teams') return { name: 'teams', id: parts[2] || null, mode: parts[1] || null };
  if (parts[0] === 'players' && parts[1] === 'edit') return { name: 'players', id: parts[2] || null, mode: 'edit' };
  if (parts[0] === 'player') return { name: 'profile', id: parts[1] || null, mode: null };
  if (parts[0] === 'match') return { name: 'match', id: parts[1] || null, mode: null };
  if (['dashboard', 'players', 'matches'].includes(parts[0])) return { name: parts[0], id: null, mode: null };
  return { name: 'not-found', id: null, mode: null };
}

export function navigate(hash) {
  const next = hash.startsWith('#') ? hash : `#${hash}`;
  if (window.location.hash === next) window.dispatchEvent(new HashChangeEvent('hashchange'));
  else window.location.hash = next;
}
