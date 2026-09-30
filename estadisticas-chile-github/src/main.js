import { renderShell } from './components/shell.js';
import { emptyState, pageHeading } from './components/ui.js';
import { readStore, writeStore, updateStore, makeId } from './data/repository.js';
import { newMatch, startMatch, recordAction, undoLastAction, toggleOnCourt, advanceQuarter, finalizeMatch } from './domain/matches.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderTeams } from './pages/teams.js';
import { renderPlayers } from './pages/players.js';
import { renderMatches } from './pages/matches.js';
import { renderLiveMatch } from './pages/live-match.js';
import { renderPlayerProfile } from './pages/player-profile.js';
import { currentRoute, navigate } from './router.js';
import { formatClock } from './utils/dom.js';

const app = document.querySelector('#app');
let clockInterval = null;
let clockMatchId = null;
let toastTimeout = null;

function showToast(message, kind = 'success') {
  let toast = document.querySelector('#app-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    document.body.append(toast);
  }
  toast.textContent = message;
  toast.dataset.kind = kind;
  toast.classList.add('visible');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('visible'), 2600);
}

function pageContent(route, store) {
  switch (route.name) {
    case 'dashboard': return renderDashboard(store);
    case 'teams': return renderTeams(store, route.mode === 'edit' ? route.id : null);
    case 'players': return renderPlayers(store, route.mode === 'edit' ? route.id : null);
    case 'matches': return renderMatches(store);
    case 'match': return renderLiveMatch(store, store.matches.find(match => match.id === route.id));
    case 'profile': return renderPlayerProfile(store, route.id);
    default: return `${pageHeading('V1', 'Página no encontrada', 'La dirección no corresponde a una sección de ESTADÍSTICAS CHILE.')} ${emptyState('Ruta no disponible', 'Usa el menú principal para continuar.', '<a class="button button-secondary" href="#dashboard">Volver al inicio</a>')}`;
  }
}

function renderRoute() {
  const route = currentRoute();
  app.innerHTML = renderShell(route.name === 'profile' ? 'players' : route.name === 'match' ? 'matches' : route.name);
  document.querySelector('#page-content').innerHTML = pageContent(route, readStore());
  if (route.name === 'match') {
    const match = readStore().matches.find(item => item.id === route.id);
    if (match?.status === 'live' && match.clockRunning) startClock(match.id);
  }
}

function stopClock(persist = true) {
  if (clockInterval) clearInterval(clockInterval);
  clockInterval = null;
  const oldMatchId = clockMatchId;
  clockMatchId = null;
  if (persist && oldMatchId) {
    try {
      updateStore(store => {
        const match = store.matches.find(item => item.id === oldMatchId);
        if (match) match.clockRunning = false;
      });
    } catch (error) {
      showToast(error.message, 'error');
    }
  }
}

function startClock(matchId) {
  if (clockInterval && clockMatchId === matchId) return;
  if (clockInterval) stopClock(false);
  clockMatchId = matchId;
  clockInterval = setInterval(() => {
    try {
      let ended = false;
      updateStore(store => {
        const match = store.matches.find(item => item.id === matchId);
        if (!match || match.status !== 'live' || !match.clockRunning) { ended = true; return; }
        if (match.clockSeconds <= 0) { match.clockRunning = false; ended = true; return; }
        match.clockSeconds -= 1;
        for (const line of match.players) if (line.onCourt) line.secondsPlayed += 1;
        if (match.clockSeconds === 0) { match.clockRunning = false; ended = true; }
      });
      if (currentRoute().name === 'match' && currentRoute().id === matchId) updateClockDisplay(matchId);
      if (ended) {
        stopClock(false);
        showToast('Terminó el tiempo del período. Avanza al siguiente cuarto cuando estés listo.');
      }
    } catch (error) {
      stopClock(false);
      showToast(error.message, 'error');
    }
  }, 1000);
}

function updateClockDisplay(matchId) {
  const store = readStore();
  const match = store.matches.find(item => item.id === matchId);
  if (!match) return;
  const clock = document.querySelector('#match-clock');
  if (clock) clock.textContent = formatClock(match.clockSeconds);
  for (const line of match.players) {
    const minuteLabels = document.querySelectorAll(`[data-player-minutes="${CSS.escape(line.playerId)}"]`);
    const mins = Math.floor(line.secondsPlayed / 60);
    const secs = line.secondsPlayed % 60;
    minuteLabels.forEach(label => { label.textContent = `${mins}:${String(secs).padStart(2, '0')}`; });
  }
  const status = document.querySelector('.clock-state');
  if (status) status.textContent = match.clockRunning ? 'Reloj en marcha' : 'Reloj detenido';
  const toggle = document.querySelector('[data-match-action="toggle-clock"]');
  if (toggle) {
    toggle.textContent = match.clockRunning ? 'Pausar' : 'Iniciar reloj';
    toggle.classList.toggle('button-warning', match.clockRunning);
    toggle.classList.toggle('button-primary', !match.clockRunning);
  }
}

function persistThenRender(mutator) {
  updateStore(mutator);
  renderRoute();
}

async function readImage(file, maxDimension = 480) {
  if (!file) return '';
  if (!file.type.startsWith('image/')) throw new Error('Selecciona un archivo de imagen válido.');
  if (file.size > 8 * 1024 * 1024) throw new Error('La imagen debe pesar menos de 8 MB.');
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d');
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/webp', 0.78);
}

function setFormMessage(form, text, isError = false) {
  const message = form.querySelector('.form-message');
  if (!message) return;
  message.textContent = text;
  message.classList.toggle('error', isError);
}

async function submitTeamForm(form) {
  const values = new FormData(form);
  const id = form.dataset.id;
  const name = String(values.get('name') || '').trim();
  const city = String(values.get('city') || '').trim();
  const color = String(values.get('color') || '#176b52');
  if (!name || !city) throw new Error('Escribe el nombre del equipo y la ciudad.');
  const file = values.get('logo');
  const old = readStore().teams.find(team => team.id === id);
  const logo = file?.size ? await readImage(file, 320) : (old?.logo || '');
  updateStore(store => {
    const duplicate = store.teams.find(team => team.id !== id && team.name.localeCompare(name, 'es', { sensitivity: 'base' }) === 0);
    if (duplicate) throw new Error('Ya existe un equipo con ese nombre.');
    if (id) {
      const team = store.teams.find(item => item.id === id);
      if (!team) throw new Error('El equipo que intentas editar ya no existe.');
      Object.assign(team, { name, city, color, logo, updatedAt: new Date().toISOString() });
    } else {
      store.teams.push({ id: makeId('team'), name, city, color, logo, createdAt: new Date().toISOString() });
    }
  });
  navigate('#teams');
  showToast(id ? 'Equipo actualizado' : 'Equipo creado');
}

async function submitPlayerForm(form) {
  const values = new FormData(form);
  const id = form.dataset.id;
  const name = String(values.get('name') || '').trim();
  const teamId = String(values.get('teamId') || '');
  const number = Number(values.get('number'));
  const position = String(values.get('position') || '');
  const ageValue = String(values.get('age') || '').trim();
  const heightValue = String(values.get('heightCm') || '').trim();
  if (!name || !teamId || !position || !Number.isInteger(number) || number < 0 || number > 99) {
    throw new Error('Completa nombre, equipo, posición y un dorsal entre 0 y 99.');
  }
  const file = values.get('photo');
  const storeBefore = readStore();
  if (!storeBefore.teams.some(team => team.id === teamId)) throw new Error('Selecciona un equipo existente.');
  const duplicate = storeBefore.players.find(player => player.id !== id && player.teamId === teamId && Number(player.number) === number);
  if (duplicate) throw new Error(`El dorsal ${number} ya está asignado en ese equipo.`);
  const old = storeBefore.players.find(player => player.id === id);
  const photo = file?.size ? await readImage(file, 520) : (old?.photo || '');
  const playerData = {
    name, teamId, number, position,
    age: ageValue ? Number(ageValue) : null,
    heightCm: heightValue ? Number(heightValue) : null,
    photo
  };
  updateStore(store => {
    if (id) {
      const player = store.players.find(item => item.id === id);
      if (!player) throw new Error('El jugador que intentas editar ya no existe.');
      Object.assign(player, playerData, { updatedAt: new Date().toISOString() });
    } else {
      store.players.push({ id: makeId('player'), ...playerData, createdAt: new Date().toISOString() });
    }
  });
  navigate('#players');
  showToast(id ? 'Jugador actualizado' : 'Jugador creado');
}

function submitMatchForm(form) {
  const values = new FormData(form);
  const match = newMatch({
    homeTeamId: String(values.get('homeTeamId') || ''),
    awayTeamId: String(values.get('awayTeamId') || ''),
    date: String(values.get('date') || '')
  }, readStore().teams);
  updateStore(store => store.matches.push(match));
  navigate('#matches');
  showToast('Partido creado. Revisa las plantillas y pulsa Iniciar partido.');
}

async function onSubmit(event) {
  const form = event.target.closest('form[data-form]');
  if (!form) return;
  event.preventDefault();
  setFormMessage(form, '');
  try {
    if (form.dataset.form === 'team') await submitTeamForm(form);
    if (form.dataset.form === 'player') await submitPlayerForm(form);
    if (form.dataset.form === 'match') submitMatchForm(form);
  } catch (error) {
    setFormMessage(form, error.message || 'No se pudo guardar. Revisa los datos e inténtalo otra vez.', true);
  }
}

function handleStartMatch(matchId) {
  try {
    updateStore(store => {
      const match = store.matches.find(item => item.id === matchId);
      if (!match) throw new Error('No encontramos ese partido.');
      startMatch(match, store.teams, store.players);
    });
    navigate(`#match/${matchId}`);
    showToast('Partido iniciado. El marcador está listo.');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function handleMatchAction(matchId, action) {
  try {
    if (action === 'toggle-clock') {
      let running;
      updateStore(store => {
        const match = store.matches.find(item => item.id === matchId);
        if (!match || match.status !== 'live') throw new Error('El partido no está en curso.');
        match.clockRunning = !match.clockRunning;
        running = match.clockRunning;
      });
      if (running) startClock(matchId);
      else stopClock(false);
      renderRoute();
      return;
    }
    if (action === 'undo') {
      let undone = false;
      updateStore(store => {
        const match = store.matches.find(item => item.id === matchId);
        if (!match) throw new Error('No encontramos ese partido.');
        undone = undoLastAction(match);
      });
      renderRoute();
      showToast(undone ? 'Última acción deshecha' : 'No hay acciones para deshacer', undone ? 'success' : 'info');
      return;
    }
    if (action === 'next-quarter' || action === 'previous-quarter') {
      stopClock(true);
      updateStore(store => {
        const match = store.matches.find(item => item.id === matchId);
        if (!match) throw new Error('No encontramos ese partido.');
        advanceQuarter(match, action === 'next-quarter' ? 1 : -1);
        match.clockRunning = false;
      });
      renderRoute();
      return;
    }
    if (action === 'finish') {
      if (!window.confirm('¿Finalizar este partido? Las estadísticas quedarán guardadas en el historial del jugador.')) return;
      stopClock(false);
      updateStore(store => {
        const match = store.matches.find(item => item.id === matchId);
        if (!match) throw new Error('No encontramos ese partido.');
        finalizeMatch(match);
      });
      renderRoute();
      showToast('Partido finalizado. Las estadísticas ya están en el historial.');
    }
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function onClick(event) {
  const navLink = event.target.closest('.nav-link');
  if (navLink) {
    document.querySelector('.app-shell')?.classList.remove('menu-open');
    const menuButton = document.querySelector('[data-action="toggle-menu"]');
    menuButton?.setAttribute('aria-expanded', 'false');
    menuButton?.setAttribute('aria-label', 'Abrir menú');
    return;
  }

  const startButton = event.target.closest('[data-action="start-match"]');
  if (startButton) { handleStartMatch(startButton.dataset.id); return; }

  const selectButton = event.target.closest('[data-select-player]');
  if (selectButton) {
    const playerId = selectButton.dataset.selectPlayer;
    try {
      updateStore(store => {
        const match = store.matches.find(item => item.id === currentRoute().id);
        if (!match || match.status !== 'live') throw new Error('El partido no está en curso.');
        if (!match.players.some(player => player.playerId === playerId)) throw new Error('Jugador no disponible en este partido.');
        match.selectedPlayerId = playerId;
      });
      renderRoute();
    } catch (error) { showToast(error.message, 'error'); }
    return;
  }

  const toggleLineup = event.target.closest('[data-toggle-lineup]');
  if (toggleLineup) {
    try {
      updateStore(store => {
        const match = store.matches.find(item => item.id === currentRoute().id);
        if (!match) throw new Error('No encontramos ese partido.');
        toggleOnCourt(match, toggleLineup.dataset.toggleLineup);
      });
      renderRoute();
    } catch (error) { showToast(error.message, 'error'); }
    return;
  }

  const statButton = event.target.closest('[data-stat-action]');
  if (statButton) {
    try {
      updateStore(store => {
        const match = store.matches.find(item => item.id === currentRoute().id);
        if (!match) throw new Error('No encontramos ese partido.');
        recordAction(match, statButton.dataset.statAction, match.selectedPlayerId);
      });
      renderRoute();
    } catch (error) { showToast(error.message, 'error'); }
    return;
  }

  const matchButton = event.target.closest('[data-match-action]');
  if (matchButton) { handleMatchAction(currentRoute().id, matchButton.dataset.matchAction); return; }

  const menuButton = event.target.closest('[data-action="toggle-menu"]');
  if (menuButton) {
    const isOpen = document.querySelector('.app-shell')?.classList.toggle('menu-open') || false;
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
  }
}

function handleRouteChange() {
  const route = currentRoute();
  if (clockInterval && (route.name !== 'match' || route.id !== clockMatchId)) stopClock(true);
  renderRoute();
}

app.addEventListener('click', onClick);
app.addEventListener('submit', onSubmit);
window.addEventListener('hashchange', handleRouteChange);
window.addEventListener('pagehide', () => stopClock(true));
renderRoute();
