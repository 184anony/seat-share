import { IslandView } from './components/island-view.js';
import { VenueView } from './components/venue-view.js';
import { makeVenue } from './data.js';
import { copyCanvasToClipboard } from './lib/clipboard.js';

const STORAGE_KEY = 'seat-share/venue-config/v2';
const DEFAULTS = {
  islandCount: 6,
  deskCount: 3,
  horizontalPosition: 'top',
  positions: null,
};

function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}
function saveConfig(c) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(c)); } catch {}
}

const stackEl = document.getElementById('views-stack');
const venueViewEl = document.getElementById('view-venue');
const islandViewEl = document.getElementById('view-island');
const venueContainer = document.getElementById('venue-container');
const islandCanvas = document.getElementById('island-canvas');
const backBtn = document.getElementById('back-btn');
const copyBtn = document.getElementById('copy-btn');
const copyStatus = document.getElementById('copy-status');
const currentIslandName = document.getElementById('current-island-name');
const editBtn = document.getElementById('edit-btn');
const editBtnLabel = editBtn.querySelector('.chip-btn-label');
const resetPositionsBtn = document.getElementById('reset-positions-btn');
const settingsBtn = document.getElementById('settings-btn');
const settingsDialog = document.getElementById('settings-dialog');
const settingsForm = document.getElementById('settings-form');
const inputIslandCount = document.getElementById('input-island-count');
const fieldHorizPos = document.getElementById('field-horizontal-position');
const settingsApply = document.getElementById('settings-apply');
const settingsCancel = document.getElementById('settings-cancel');

let config = loadConfig();
let venue = makeVenue(config);
const venueView = new VenueView(venueContainer, venue, config.positions);
config.positions = venueView.getPositions();
saveConfig(config);

const islandView = new IslandView(islandCanvas, venue.islands[0]);
let lastIslandId = null;

function setCopyStatus(text, isError = false) {
  copyStatus.textContent = text;
  copyStatus.classList.toggle('error', isError);
  copyStatus.classList.toggle('success', !isError && !!text);
}

function setOriginFromTile(tileEl) {
  if (!tileEl) {
    stackEl.style.removeProperty('--ox');
    stackEl.style.removeProperty('--oy');
    return;
  }
  const tileRect = tileEl.getBoundingClientRect();
  const stackRect = stackEl.getBoundingClientRect();
  if (stackRect.width === 0 || stackRect.height === 0) return;
  const ox = ((tileRect.left + tileRect.width / 2 - stackRect.left) / stackRect.width) * 100;
  const oy = ((tileRect.top + tileRect.height / 2 - stackRect.top) / stackRect.height) * 100;
  stackEl.style.setProperty('--ox', ox + '%');
  stackEl.style.setProperty('--oy', oy + '%');
}

function replay(el, className) {
  el.classList.remove(className);
  // reflow を強制してアニメーションをリスタート
  void el.offsetWidth;
  el.classList.add(className);
}

function showVenue() {
  setOriginFromTile(venueView.tileEls[lastIslandId]);
  islandViewEl.hidden = true;
  islandViewEl.classList.remove('entering');
  venueViewEl.hidden = false;
  replay(venueViewEl, 'entering');
  setCopyStatus('');
}

function showIsland(island, tileEl) {
  lastIslandId = island.id;
  setOriginFromTile(tileEl);
  currentIslandName.textContent = island.name;
  islandView.setIsland(island);
  copyBtn.disabled = true;
  setCopyStatus('');
  venueViewEl.hidden = true;
  venueViewEl.classList.remove('entering');
  islandViewEl.hidden = false;
  replay(islandViewEl, 'entering');
}

venueView.on('island-selected', ({ island, tileEl }) => showIsland(island, tileEl));
venueView.on('positions-changed', ({ positions }) => {
  config = { ...config, positions };
  saveConfig(config);
});

islandView.on('seat-selected', () => {
  copyBtn.disabled = false;
  setCopyStatus('');
});

backBtn.addEventListener('click', () => showVenue());

copyBtn.addEventListener('click', async () => {
  if (!islandView.getSelectedSeat()) return;
  setCopyStatus('コピー中…');
  try {
    await copyCanvasToClipboard(islandView.toExportCanvas());
    setCopyStatus('✓ コピーしました。Slack に貼り付けてください');
  } catch (err) {
    setCopyStatus(`エラー: ${err.message || err}`, true);
  }
});

// Edit mode
function setEditMode(on) {
  venueView.setEditMode(on);
  editBtn.classList.toggle('active', on);
  editBtnLabel.textContent = on ? '完了' : '配置を編集';
  resetPositionsBtn.hidden = !on;
}

editBtn.addEventListener('click', () => setEditMode(!venueView.editMode));

resetPositionsBtn.addEventListener('click', () => {
  if (!confirm('配置をデフォルトに戻しますか？')) return;
  venueView.resetPositions();
});

// Settings
function syncSettingsForm() {
  inputIslandCount.value = String(config.islandCount);
  for (const r of settingsForm.elements['deskCount']) {
    r.checked = parseInt(r.value, 10) === config.deskCount;
  }
  for (const r of settingsForm.elements['horizontalPosition']) {
    r.checked = r.value === (config.horizontalPosition || 'top');
  }
  fieldHorizPos.hidden = config.deskCount !== 3;
}

settingsBtn.addEventListener('click', () => {
  syncSettingsForm();
  settingsDialog.showModal();
});

settingsForm.addEventListener('change', (e) => {
  if (e.target.name === 'deskCount') {
    fieldHorizPos.hidden = parseInt(e.target.value, 10) !== 3;
  }
});

settingsApply.addEventListener('click', (e) => {
  e.preventDefault();
  const data = new FormData(settingsForm);
  const islandCount = Math.max(
    1,
    Math.min(20, parseInt(data.get('islandCount'), 10) || DEFAULTS.islandCount)
  );
  const deskCount = parseInt(data.get('deskCount'), 10);
  const horizontalPosition =
    deskCount === 3 ? data.get('horizontalPosition') || 'top' : 'top';

  config = { ...config, islandCount, deskCount, horizontalPosition };
  venue = makeVenue(config);
  venueView.setVenue(venue, config.positions);
  config.positions = venueView.getPositions();
  saveConfig(config);
  setEditMode(false);
  settingsDialog.close();
  showVenue();
});

settingsCancel.addEventListener('click', (e) => {
  e.preventDefault();
  settingsDialog.close();
});

// Init: 会場ビューを表示
venueViewEl.hidden = false;
islandViewEl.hidden = true;
venueViewEl.classList.add('entering');
