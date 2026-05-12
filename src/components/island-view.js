// 島の描画とクリック処理。
//
// 構造:
//   computeIslandLayout(island, opts) → 純粋関数。長机と椅子の座標を計算。
//   drawIsland(ctx, layout, selectedSeatId, opts) → 純粋関数。任意の ctx に描く。
//   IslandView クラス → キャンバスに上記を結びつけ、クリックで席を選ぶラッパー。
//
// 島の形状は island.deskCount と island.horizontalPosition で分岐:
//   - 2 desk         : 縦机×2 を左右に隣接、椅子は外側
//   - 3 desk top     : 横机1（上） + 縦机×2（下、中央で隣接）
//   - 3 desk bottom  : 縦机×2（上、中央で隣接） + 横机1（下）
//
// VenueView もこの純粋関数を縮小 opts で呼び出してミニ表示している。

const COLORS = {
  desk: '#d2b48c',
  deskBorder: '#8b6f47',
  chair: '#ffffff',
  chairBorder: '#3a3a3c',
  chairSelected: '#ff3b30',
  label: '#1d1d1f',
  labelSelected: '#ffffff',
};

export const DEFAULT_OPTS = {
  deskLong: 200,
  deskShort: 50,
  chairRadius: 18,
  chairToDeskGap: 5,
  padding: 28,
};

export function computeIslandLayout(island, opts = {}) {
  const o = { ...DEFAULT_OPTS, ...opts };
  const { deskLong, deskShort, chairRadius, chairToDeskGap, padding } = o;
  const chairD = chairRadius * 2;
  const chairOff = chairRadius + chairToDeskGap;

  if (island.deskCount === 2) {
    // 縦机×2: 左右並列、椅子は左外側と右外側
    const innerLeft = padding + chairD + chairToDeskGap;
    const desksY = padding;
    const leftDX = innerLeft;
    const rightDX = innerLeft + deskShort;
    const width = innerLeft + deskShort * 2 + chairToDeskGap + chairD + padding;
    const height = desksY + deskLong + padding;

    const q1Y = desksY + deskLong * 0.25;
    const q3Y = desksY + deskLong * 0.75;
    const leftCX = leftDX - chairOff;
    const rightCX = rightDX + deskShort + chairOff;

    return {
      width,
      height,
      desks: [
        { id: island.desks[0].id, x: leftDX, y: desksY, w: deskShort, h: deskLong },
        { id: island.desks[1].id, x: rightDX, y: desksY, w: deskShort, h: deskLong },
      ],
      seats: [
        { seat: island.desks[0].seats[0], cx: leftCX, cy: q1Y, r: chairRadius },
        { seat: island.desks[0].seats[1], cx: leftCX, cy: q3Y, r: chairRadius },
        { seat: island.desks[1].seats[0], cx: rightCX, cy: q1Y, r: chairRadius },
        { seat: island.desks[1].seats[1], cx: rightCX, cy: q3Y, r: chairRadius },
      ],
    };
  }

  // 3 desks 共通
  const width = padding + deskLong + padding;
  const horizX = padding;
  const vertBlockX = horizX + (deskLong - deskShort * 2) / 2;
  const leftDX = vertBlockX;
  const rightDX = vertBlockX + deskShort;
  const hQ1X = horizX + deskLong * 0.25;
  const hQ3X = horizX + deskLong * 0.75;

  if (island.horizontalPosition === 'bottom') {
    const vertY = padding;
    const horizY = vertY + deskLong;
    const height = horizY + deskShort + chairToDeskGap + chairD + padding;

    const vQ1Y = vertY + deskLong * 0.25;
    const vQ3Y = vertY + deskLong * 0.75;
    const leftCX = leftDX - chairOff;
    const rightCX = rightDX + deskShort + chairOff;
    const botCY = horizY + deskShort + chairOff;

    return {
      width,
      height,
      desks: [
        { id: island.desks[0].id, x: leftDX, y: vertY, w: deskShort, h: deskLong },
        { id: island.desks[1].id, x: rightDX, y: vertY, w: deskShort, h: deskLong },
        { id: island.desks[2].id, x: horizX, y: horizY, w: deskLong, h: deskShort },
      ],
      seats: [
        { seat: island.desks[0].seats[0], cx: leftCX, cy: vQ1Y, r: chairRadius },
        { seat: island.desks[0].seats[1], cx: leftCX, cy: vQ3Y, r: chairRadius },
        { seat: island.desks[1].seats[0], cx: rightCX, cy: vQ1Y, r: chairRadius },
        { seat: island.desks[1].seats[1], cx: rightCX, cy: vQ3Y, r: chairRadius },
        { seat: island.desks[2].seats[0], cx: hQ1X, cy: botCY, r: chairRadius },
        { seat: island.desks[2].seats[1], cx: hQ3X, cy: botCY, r: chairRadius },
      ],
    };
  }

  // 3 desks horizontal-top (default)
  const horizY = padding + chairD + chairToDeskGap;
  const vertY = horizY + deskShort;
  const height = vertY + deskLong + padding;

  const topCY = horizY - chairOff;
  const vQ1Y = vertY + deskLong * 0.25;
  const vQ3Y = vertY + deskLong * 0.75;
  const leftCX = leftDX - chairOff;
  const rightCX = rightDX + deskShort + chairOff;

  return {
    width,
    height,
    desks: [
      { id: island.desks[0].id, x: horizX, y: horizY, w: deskLong, h: deskShort },
      { id: island.desks[1].id, x: leftDX, y: vertY, w: deskShort, h: deskLong },
      { id: island.desks[2].id, x: rightDX, y: vertY, w: deskShort, h: deskLong },
    ],
    seats: [
      { seat: island.desks[0].seats[0], cx: hQ1X, cy: topCY, r: chairRadius },
      { seat: island.desks[0].seats[1], cx: hQ3X, cy: topCY, r: chairRadius },
      { seat: island.desks[1].seats[0], cx: leftCX, cy: vQ1Y, r: chairRadius },
      { seat: island.desks[1].seats[1], cx: leftCX, cy: vQ3Y, r: chairRadius },
      { seat: island.desks[2].seats[0], cx: rightCX, cy: vQ1Y, r: chairRadius },
      { seat: island.desks[2].seats[1], cx: rightCX, cy: vQ3Y, r: chairRadius },
    ],
  };
}

export function drawIsland(ctx, layout, selectedSeatId, opts = {}) {
  const {
    offsetX = 0,
    offsetY = 0,
    showSeatLabels = true,
    labelSize = 14,
    deskStroke = 2,
  } = opts;

  for (const d of layout.desks) {
    ctx.fillStyle = COLORS.desk;
    ctx.fillRect(offsetX + d.x, offsetY + d.y, d.w, d.h);
    ctx.strokeStyle = COLORS.deskBorder;
    ctx.lineWidth = deskStroke;
    ctx.strokeRect(offsetX + d.x, offsetY + d.y, d.w, d.h);
  }

  for (const s of layout.seats) {
    const isSelected = s.seat.id === selectedSeatId;
    ctx.beginPath();
    ctx.arc(offsetX + s.cx, offsetY + s.cy, s.r, 0, Math.PI * 2);
    ctx.fillStyle = isSelected ? COLORS.chairSelected : COLORS.chair;
    ctx.fill();
    ctx.lineWidth = isSelected ? deskStroke + 1 : deskStroke;
    ctx.strokeStyle = isSelected ? COLORS.chairSelected : COLORS.chairBorder;
    ctx.stroke();

    if (showSeatLabels) {
      ctx.fillStyle = isSelected ? COLORS.labelSelected : COLORS.label;
      ctx.font = `bold ${labelSize}px system-ui, -apple-system, "Hiragino Sans", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(s.seat.label, offsetX + s.cx, offsetY + s.cy);
    }
  }
}

export class IslandView {
  constructor(canvas, island, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.opts = { ...DEFAULT_OPTS, ...opts };
    this.selectedSeatId = null;
    this.listeners = { 'seat-selected': [] };

    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    this.setIsland(island);
  }

  setIsland(island) {
    this.island = island;
    this.layout = computeIslandLayout(island, this.opts);
    this.selectedSeatId = null;
    this.fitCanvas();
    this.render();
  }

  fitCanvas() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.layout.width * dpr;
    this.canvas.height = this.layout.height * dpr;
    this.canvas.style.width = this.layout.width + 'px';
    this.canvas.style.height = this.layout.height + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) * this.layout.width) / rect.width;
    const y = ((e.clientY - rect.top) * this.layout.height) / rect.height;
    const hit = this.layout.seats.find((s) => {
      const dx = s.cx - x;
      const dy = s.cy - y;
      return dx * dx + dy * dy <= s.r * s.r;
    });
    if (hit) this.setSelectedSeat(hit.seat.id);
  }

  setSelectedSeat(seatId) {
    this.selectedSeatId = seatId;
    this.render();
    this.emit('seat-selected', {
      island: this.island,
      seat: this.findSeatById(seatId),
    });
  }

  getSelectedSeat() {
    return this.findSeatById(this.selectedSeatId);
  }

  findSeatById(id) {
    for (const d of this.island.desks) {
      for (const s of d.seats) if (s.id === id) return s;
    }
    return null;
  }

  render() {
    this.ctx.clearRect(0, 0, this.layout.width, this.layout.height);
    drawIsland(this.ctx, this.layout, this.selectedSeatId);
  }

  // クリップボード用: 白背景 + タイトル付きの独立した Canvas を返す。
  // 画像単独で「どの班のどの席か」が分かるよう、タイトル行を画像内に描く。
  toExportCanvas() {
    const titleHeight = 36;
    const margin = 6;
    const out = document.createElement('canvas');
    out.width = this.layout.width;
    out.height = this.layout.height + titleHeight + margin;
    const ctx = out.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, out.width, out.height);

    const seat = this.getSelectedSeat();
    const title = seat
      ? `${this.island.name} ・ 席${seat.label}`
      : this.island.name;
    ctx.fillStyle = '#1d1d1f';
    ctx.font = 'bold 17px system-ui, -apple-system, "Hiragino Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, out.width / 2, titleHeight / 2 + 2);

    drawIsland(ctx, this.layout, this.selectedSeatId, {
      offsetY: titleHeight + margin,
    });
    return out;
  }

  on(event, cb) {
    if (this.listeners[event]) this.listeners[event].push(cb);
  }
  emit(event, payload) {
    (this.listeners[event] || []).forEach((cb) => cb(payload));
  }
}
