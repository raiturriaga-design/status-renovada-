import { escapeHtml, initials, safeColor } from '../utils/dom.js';

export function teamMark(team, className = '') {
  if (team?.logo) return `<span class="team-mark ${className}"><img src="${escapeHtml(team.logo)}" alt="Logo de ${escapeHtml(team.name)}"></span>`;
  return `<span class="team-mark ${className}" style="--team-color:${safeColor(team?.color)}">${escapeHtml(initials(team?.name))}</span>`;
}

export function playerAvatar(player, className = '') {
  if (player?.photo) return `<span class="player-avatar ${className}"><img src="${escapeHtml(player.photo)}" alt="Foto de ${escapeHtml(player.name)}"></span>`;
  return `<span class="player-avatar ${className}">${escapeHtml(initials(player?.name))}</span>`;
}

export function emptyState(title, description, action = '') {
  return `<div class="empty-state"><div class="empty-icon">◎</div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(description)}</p>${action}</div>`;
}

export function pageHeading(eyebrow, title, description, action = '') {
  return `<div class="page-heading"><div><div class="eyebrow">${escapeHtml(eyebrow)}</div><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p></div>${action ? `<div class="heading-action">${action}</div>` : ''}</div>`;
}

export function statusBadge(status) {
  const labels = { scheduled: 'Programado', live: 'En curso', final: 'Finalizado' };
  return `<span class="status-badge status-${status}"><i></i>${labels[status] || 'Desconocido'}</span>`;
}
