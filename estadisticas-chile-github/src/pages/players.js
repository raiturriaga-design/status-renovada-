import { pageHeading, playerAvatar, emptyState } from '../components/ui.js';
import { escapeHtml } from '../utils/dom.js';

const positions = ['Base', 'Escolta', 'Alero', 'Ala-pívot', 'Pívot'];

export function renderPlayers(store, editId = null) {
  const player = store.players.find(item => item.id === editId) || null;
  const canCreate = store.teams.length > 0;
  const teamOptions = store.teams.map(team => `<option value="${team.id}" ${player?.teamId === team.id ? 'selected' : ''}>${escapeHtml(team.name)} · ${escapeHtml(team.city)}</option>`).join('');
  const form = canCreate ? `<form class="form-grid" data-form="player" data-id="${player?.id || ''}">
    <label class="field field-full"><span>Nombre completo</span><input name="name" required maxlength="70" placeholder="Ej. Martina González" value="${escapeHtml(player?.name || '')}"></label>
    <label class="field"><span>Número</span><input name="number" type="number" min="0" max="99" required value="${player?.number ?? ''}" placeholder="7"></label>
    <label class="field"><span>Posición</span><select name="position" required><option value="">Seleccionar</option>${positions.map(position => `<option ${player?.position === position ? 'selected' : ''}>${position}</option>`).join('')}</select></label>
    <label class="field"><span>Edad</span><input name="age" type="number" min="1" max="99" value="${player?.age ?? ''}" placeholder="Opcional"></label>
    <label class="field"><span>Altura (cm)</span><input name="heightCm" type="number" min="100" max="250" value="${player?.heightCm ?? ''}" placeholder="Opcional"></label>
    <label class="field field-full"><span>Equipo</span><select name="teamId" required><option value="">Seleccionar equipo</option>${teamOptions}</select></label>
    <label class="field field-full"><span>Foto <small>Opcional · imagen JPG, PNG o WebP</small></span><input name="photo" type="file" accept="image/png,image/jpeg,image/webp"><small class="field-help">${player?.photo ? 'La foto actual se conserva si no seleccionas otra.' : 'Puedes agregar una foto más tarde.'}</small></label>
    <div class="form-actions field-full"><button class="button button-primary" type="submit">${player ? 'Guardar cambios' : 'Crear jugador'}</button>${player ? '<a class="button button-secondary" href="#players">Cancelar</a>' : ''}</div>
    <div class="form-message field-full" role="status"></div>
  </form>` : emptyState('Primero crea un equipo', 'Cada jugador debe pertenecer a un equipo.', '<a class="button button-secondary" href="#teams">Crear equipo</a>');

  const list = store.players.length ? `<div class="table-scroll"><table class="data-table"><thead><tr><th>Jugador</th><th>Equipo</th><th>N.º</th><th>Posición</th><th></th></tr></thead><tbody>${store.players.slice().sort((a,b)=>a.name.localeCompare(b.name,'es')).map(item => {
    const team = store.teams.find(candidate => candidate.id === item.teamId);
    return `<tr><td><a class="person-link" href="#player/${item.id}">${playerAvatar(item,'small')}<b>${escapeHtml(item.name)}</b></a></td><td>${escapeHtml(team?.name || 'Equipo eliminado')}</td><td>${item.number}</td><td>${escapeHtml(item.position)}</td><td><a class="text-link" href="#players/edit/${item.id}">Editar</a></td></tr>`;
  }).join('')}</tbody></table></div>` : emptyState('Aún no hay jugadores', 'Crea un jugador y asígnalo a uno de tus equipos.');

  return `${pageHeading('GESTIÓN', 'Jugadores', 'Registra jugadores y consulta sus fichas y estadísticas.')}
    <div class="two-column-layout"><section class="card content-card"><div class="section-header"><div><h2>${player ? 'Editar jugador' : 'Crear jugador'}</h2><p>La foto, edad y altura son opcionales.</p></div></div>${form}</section>
    <section class="card content-card"><div class="section-header"><div><h2>Jugadores registrados</h2><p>${store.players.length} jugador${store.players.length === 1 ? '' : 'es'}.</p></div></div>${list}</section></div>`;
}
