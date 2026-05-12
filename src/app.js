import { IslandView } from './components/island-view.js';
import { SAMPLE_ISLAND } from './data.js';
import { copyCanvasToClipboard } from './lib/clipboard.js';

const canvas = document.getElementById('island-canvas');
const islandNameEl = document.getElementById('island-name');
const selectedSeatEl = document.getElementById('selected-seat');
const copyBtn = document.getElementById('copy-btn');
const copyStatusEl = document.getElementById('copy-status');

// ①（会場）が実装されたら、ここで選択された島を受け取って差し替える。
const island = SAMPLE_ISLAND;
islandNameEl.textContent = island.name;

const view = new IslandView(canvas, island);

view.on('seat-selected', ({ seat }) => {
  selectedSeatEl.textContent = `${island.name} - ${seat.label}番席`;
  copyBtn.disabled = false;
  copyStatusEl.textContent = '';
  copyStatusEl.classList.remove('error');
});

copyBtn.addEventListener('click', async () => {
  copyStatusEl.classList.remove('error');
  copyStatusEl.textContent = 'コピー中...';
  try {
    await copyCanvasToClipboard(view.toExportCanvas());
    copyStatusEl.textContent = '✓ クリップボードにコピーしました。Slackに貼り付けてください。';
  } catch (err) {
    copyStatusEl.textContent = `エラー: ${err.message}`;
    copyStatusEl.classList.add('error');
  }
});
