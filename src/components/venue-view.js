// 会場ビュー（①）。
// 複数の島をミニ表示で並べ、クリック/タップで島を選ぶ。
// 描画は island-view.js の純粋関数を縮小オプションで呼び出して再利用。

import { computeIslandLayout, drawIsland } from './island-view.js';

const MINI_OPTS = {
  deskLong: 80,
  deskShort: 18,
  chairRadius: 7,
  chairToDeskGap: 2,
  padding: 10,
};

export class VenueView {
  constructor(container, venue) {
    this.container = container;
    this.listeners = { 'island-selected': [] };
    this.setVenue(venue);
  }

  setVenue(venue) {
    this.venue = venue;
    this.render();
  }

  render() {
    this.container.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'venue-grid';
    for (const island of this.venue.islands) {
      grid.appendChild(this.renderTile(island));
    }
    this.container.appendChild(grid);
  }

  renderTile(island) {
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'venue-tile';
    tile.dataset.islandId = island.id;
    tile.setAttribute('aria-label', `${island.name}を選択`);

    const label = document.createElement('div');
    label.className = 'venue-tile-label';
    label.textContent = island.name;

    const canvasWrap = document.createElement('div');
    canvasWrap.className = 'venue-tile-canvas-wrap';

    const canvas = document.createElement('canvas');
    canvas.className = 'venue-tile-canvas';
    const layout = computeIslandLayout(island, MINI_OPTS);
    const dpr = window.devicePixelRatio || 1;
    canvas.width = layout.width * dpr;
    canvas.height = layout.height * dpr;
    canvas.style.width = layout.width + 'px';
    canvas.style.height = layout.height + 'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawIsland(ctx, layout, null, { showSeatLabels: false, deskStroke: 1.2 });

    canvasWrap.appendChild(canvas);
    tile.appendChild(label);
    tile.appendChild(canvasWrap);

    tile.addEventListener('click', () => {
      this.emit('island-selected', { island });
    });
    return tile;
  }

  on(event, cb) {
    if (this.listeners[event]) this.listeners[event].push(cb);
  }
  emit(event, payload) {
    (this.listeners[event] || []).forEach((cb) => cb(payload));
  }
}
