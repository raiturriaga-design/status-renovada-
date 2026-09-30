import { pageHeading, teamMark, emptyState } from '../components/ui.js';
import { escapeHtml } from '../utils/dom.js';

export function renderTeams(store, editId = null) {
  const team = store.teams.find(item => item.id === editId) || null;
  const title = team ? 'Editar equipo' : 'Crear equipo';
  const form = `<form class="form-grid" data-form="team" data-id="${team?.id || ''}">
    <label class="field field-full"><span>Nombre del equipo</span><input name="name" required maxlength="60" placeholder="Ej. Cóndores BC" value="${escapeHtml(team?.name || '')}"></label>
    <label class="field"><span>Ciudad</span><input name="city" required maxlength="50" placeholder="Ej. Santiago" value="${escapeHtml(team?.city || '')}"></label>
    <label class="field"><span>Color principal</span><input name="color" type="color" value="${escapeHtml(team?.color || '#176b52')}"></label>
    <label class="field field-full"><span>Logo <small>Opcional · imagen JPG, PNG o WebP</small></span><input name="logo" type="file" accept="image/png,image/jpeg,image/webp"><small class="field-help">${team?.logo ? 'El logo actual se conserva si no seleccionas otro.' : 'Usaremos las iniciales del equipo si no agregas un logo.'}</small></label>
    <div class="form-actions field-full"><button class="button button-primary" type="submit">${team ? 'Guardar cambios' : 'Crear equipo'}</button>${team ? '<a class="button button-secondary" href="#teams">Cancelar</a>' : ''}</div>
    <div class="form-message field-full" role="status"></div>
  </form>`;
  const list = store.teams.length ? `<div class="entity-list">${store.teams.map(item => {
    const playerCount = store.players.filter(player => player.teamId === item.id).length;
    return `<article class="entity-row">${teamMark(item)}<div class="entity-main"><b>${escapeHtml(item.name)}</b><span>${escapeHtml(item.city)}</span></div><span class="entity-meta">${playerCount} jugador${playerCount === 1 ? '' : 'es'}</span><a class="button button-small button-secondary" href="#teams/edit/${item.id}">Editar</a></article>`;
  }).join('')}</div>` : emptyState('Todavía no hay equipos', 'Completa el formulario para agregar el primer equipo.');

  return `${pageHeading('GESTIÓN', 'Equipos', 'Crea los clubes que participarán en tus partidos.')}
    <div class="two-column-layout"><section class="card content-card"><div class="section-header"><div><h2>${title}</h2><p>Nombre, ciudad, color y logo opcional.</p></div></div>${form}</section>
    <section class="card content-card"><div class="section-header"><div><h2>Equipos creados</h2><p>${store.teams.length} equipo${store.teams.length === 1 ? '' : 's'} registrado${store.teams.length === 1 ? '' : 's'}.</p></div></div>${list}</section></div>`;
}
