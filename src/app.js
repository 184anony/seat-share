import { IslandView } from './components/island-view.js';
import { VenueView } from './components/venue-view.js';
import { makeVenue } from './data.js';
import { copyCanvasToClipboard } from './lib/clipboard.js';

const STORAGE_KEY = 'seat-share/venue-config/v1';
const DEFAULTS = { islandCount: 6, deskCount: 3, horizontalPosition: 'top' };

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

const venueViewEl = document.getElementById('view-venue');
const islandViewEl = document.getElementById('view-island');
const venueContainer = document.getElementById('venue-container');
const islandCanvas = document.getElementById('island-canvas');
const backBtn = document.getElementById('back-btn');
const copyBtn = document.getElementById('copy-btn');
const copyStatus = document.getElementById('copy-status');
const currentIslandName = document.getElementById('current-island-name');
const settingsBtn = document.getElementById('settings-btn');
const settingsDialog = document.getElementById('settings-dialog');
const settingsForm = document.getElementById('settings-form');
const inputIslandCount = document.getElementById('input-island-count');
const fieldHorizPos = document.getElementById('field-horizontal-position');
const settingsApply = document.getElementById('settings-apply');
const settingsCancel = document.getElementById('settings-cancel');

let config = loadConfig();
let venue = makeVenue(config);
const venueView = new VenueView(venueContainer, venue);
const islandView = new IslandView(islandCanvas, venue.islands[0]);

function setCopyStatus(text, isError = false) {
  copyStatus.textContent = text;
  copyStatus.classList.toggle('error', isError);
  copyStatus.classList.toggle('success', !isError && !!text);
}

function showVenue() {
  islandViewEl.hidden = true;
  venueViewEl.hidden = false;
  setCopyStatus('');
}

function showIsland(island) {
  venueViewEl.hidden = true;
  islandViewEl.hidden = false;
  currentIslandName.textContent = island.name;
  islandView.setIsland(island);
  copyBtn.disabled = true;
  setCopyStatus('');
}

venueView.on('island-selected', ({ island }) => showIsland(island));

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

// Settings
function syncSettingsForm() {
  inputIslandCount.value = String(config.islandCount);
  for (const r of settingsForm.elements['deskCount']) {
    r.checked = parseInt(r.value, 10) === config.deskCount;
  }
  for (const r of settingsForm.elements['horizontalPosition']) {
    r.checked = r.value === (config.horizontalPosition || 'top');
  }
  fieldHorizPos.disabled = config.deskCount !== 3;
}

settingsBtn.addEventListener('click', () => {
  syncSettingsForm();
  settingsDialog.showModal();
});

settingsForm.addEventListener('change', (e) => {
  if (e.target.name === 'deskCount') {
    fieldHorizPos.disabled = parseInt(e.target.value, 10) !== 3;
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
  config = { islandCount, deskCount, horizontalPosition };
  saveConfig(config);
  venue = makeVenue(config);
  venueView.setVenue(venue);
  showVenue();
  settingsDialog.close();
});

settingsCancel.addEventListener('click', (e) => {
  e.preventDefault();
  settingsDialog.close();
});

// 起動時は会場ビュー
showVenue();
