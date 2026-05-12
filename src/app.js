import { IslandView } from './components/island-view.js';
import { makeIsland } from './data.js';
import { copyCanvasToClipboard } from './lib/clipboard.js';

const canvas = document.getElementById('island-canvas');
const copyBtn = document.getElementById('copy-btn');
const copyStatusEl = document.getElementById('copy-status');
const deskCountInputs = document.querySelectorAll('input[name="deskCount"]');

// ①（会場ビュー）が入ったら、ここで選択された島の情報を受け取って差し替える。
let view = null;

function applyDeskCount(deskCount) {
  const island = makeIsland({ id: 'A', deskCount });
  if (!view) {
    view = new IslandView(canvas, island);
    view.on('seat-selected', () => {
      copyBtn.disabled = false;
      copyStatusEl.textContent = '';
      copyStatusEl.classList.remove('error');
    });
  } else {
    view.setIsland(island);
  }
  copyBtn.disabled = true;
  copyStatusEl.textContent = '';
  copyStatusEl.classList.remove('error');
}

const initialDeskCount = parseInt(
  document.querySelector('input[name="deskCount"]:checked')?.value ?? '3',
  10
);
applyDeskCount(initialDeskCount);

deskCountInputs.forEach((input) => {
  input.addEventListener('change', (e) => {
    if (e.target.checked) {
      applyDeskCount(parseInt(e.target.value, 10));
    }
  });
});

copyBtn.addEventListener('click', async () => {
  if (!view || !view.getSelectedSeat()) return;
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
