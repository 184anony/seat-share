// 会場ビュー（①）。
// 複数の島をミニ表示でステージ上に配置し、クリックで島を選ぶ。
// 編集モードでは pointer events によるドラッグで島を自由配置できる。

import { computeIslandLayout, drawIsland } from './island-view.js';
import { getDefaultPositions } from '../data.js';

const MINI_OPTS = {
  deskLong: 80,
  deskShort: 18,
  chairRadius: 7,
  chairToDeskGap: 2,
  padding: 10,
};

const DRAG_THRESHOLD = 4; // px

export class VenueView {
  constructor(container, venue, positions = null) {
    this.container = container;
    this.editMode = false;
    this.tileEls = {};
    this.listeners = {
      'island-selected': [],
      'positions-changed': [],
    };
    this.setVenue(venue, positions);
  }

  setVenue(venue, positions = null) {
    this.venue = venue;
    this.positions = this.mergeWithDefaults(positions);
    this.render();
  }

  mergeWithDefaults(positions) {
    const defaults = getDefaultPositions(this.venue.islands.length);
    if (!positions) return defaults;
    const out = { ...defaults };
    for (const island of this.venue.islands) {
      if (positions[island.id]) out[island.id] = positions[island.id];
    }
    return out;
  }

  setEditMode(on) {
    if (this.editMode === on) return;
    this.editMode = on;
    this.render();
  }

  getPositions() {
    const out = {};
    for (const island of this.venue.islands) {
      out[island.id] = { ...this.positions[island.id] };
    }
    return out;
  }

  resetPositions() {
    this.positions = getDefaultPositions(this.venue.islands.length);
    this.render();
    this.emit('positions-changed', { positions: this.getPositions() });
  }

  render() {
    this.container.innerHTML = '';
    this.tileEls = {};
    this.container.classList.toggle('edit-mode', this.editMode);

    const stage = document.createElement('div');
    stage.className = 'venue-stage';
    this.stage = stage;

    for (const island of this.venue.islands) {
      const tile = this.renderTile(island);
      stage.appendChild(tile);
      this.tileEls[island.id] = tile;
    }

    this.container.appendChild(stage);
  }

  renderTile(island) {
    const tile = document.createElement('div');
    tile.className = 'venue-tile';
    tile.dataset.islandId = island.id;
    tile.setAttribute('aria-label', `${island.name}を選択`);
    if (!this.editMode) {
      tile.setAttribute('role', 'button');
      tile.setAttribute('tabindex', '0');
    }

    const pos = this.positions[island.id] || { x: 50, y: 50 };
    tile.style.left = pos.x + '%';
    tile.style.top = pos.y + '%';

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

    if (this.editMode) {
      this.attachDragHandlers(tile, island);
    } else {
      tile.addEventListener('click', () => {
        this.emit('island-selected', { island, tileEl: tile });
      });
      tile.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.emit('island-selected', { island, tileEl: tile });
        }
      });
    }

    return tile;
  }

  attachDragHandlers(tile, island) {
    let startX, startY, startPos, hasMoved, activePointerId;

    const onPointerDown = (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      e.preventDefault();
      activePointerId = e.pointerId;
      try { tile.setPointerCapture(e.pointerId); } catch {}
      startX = e.clientX;
      startY = e.clientY;
      startPos = { ...this.positions[island.id] };
      hasMoved = false;
    };

    const onPointerMove = (e) => {
      if (e.pointerId !== activePointerId) return;
      const dxpx = e.clientX - startX;
      const dypx = e.clientY - startY;
      if (!hasMoved) {
        if (Math.hypot(dxpx, dypx) < DRAG_THRESHOLD) return;
        hasMoved = true;
        tile.classList.add('dragging');
      }
      const stageRect = this.stage.getBoundingClientRect();
      const tileW = tile.offsetWidth;
      const tileH = tile.offsetHeight;
      const minX = (tileW / 2 / stageRect.width) * 100;
      const maxX = 100 - minX;
      const minY = (tileH / 2 / stageRect.height) * 100;
      const maxY = 100 - minY;
      const dx = (dxpx / stageRect.width) * 100;
      const dy = (dypx / stageRect.height) * 100;
      const newX = Math.max(minX, Math.min(maxX, startPos.x + dx));
      const newY = Math.max(minY, Math.min(maxY, startPos.y + dy));
      this.positions[island.id] = { x: newX, y: newY };
      tile.style.left = newX + '%';
      tile.style.top = newY + '%';
    };

    const onPointerUp = (e) => {
      if (e.pointerId !== activePointerId) return;
      try { tile.releasePointerCapture(e.pointerId); } catch {}
      tile.classList.remove('dragging');
      activePointerId = null;
      if (hasMoved) {
        this.emit('positions-changed', { positions: this.getPositions() });
      }
    };

    tile.addEventListener('pointerdown', onPointerDown);
    tile.addEventListener('pointermove', onPointerMove);
    tile.addEventListener('pointerup', onPointerUp);
    tile.addEventListener('pointercancel', onPointerUp);
  }

  on(event, cb) {
    if (this.listeners[event]) this.listeners[event].push(cb);
  }
  emit(event, payload) {
    (this.listeners[event] || []).forEach((cb) => cb(payload));
  }
}
