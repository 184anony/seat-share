// 島の描画とクリック処理（コ字型レイアウト）。
//
// 構造:
//   computeIslandLayout(island, opts) → 純粋関数。長机と椅子の座標を計算する。
//   drawIsland(ctx, island, layout, selectedSeatId, opts) → 純粋関数。任意の ctx に描く。
//   IslandView クラス → キャンバスに上記を結びつけ、クリックで席を選ぶラッパー。
//
// 会場ビュー（①）を作るときは、純粋関数を直接呼び出して縮小表示・複数描画に流用できる。

const COLORS = {
  desk: '#d2b48c',
  deskBorder: '#8b6f47',
  chair: '#ffffff',
  chairBorder: '#3a3a3c',
  chairSelected: '#ff3b30',
  label: '#1d1d1f',
  labelSelected: '#ffffff',
  title: '#1d1d1f',
};

export const DEFAULT_OPTS = {
  deskLong: 220,
  deskShort: 50,
  chairRadius: 20,
  chairToDeskGap: 6,
  padding: 16,
  titleHeight: 28,
};

// コ字型のレイアウトを計算。
// 椅子は各長机の外側の長辺に2脚並び、コの内側を向く想定。
export function computeIslandLayout(island, opts = {}) {
  const o = { ...DEFAULT_OPTS, ...opts };
  const {
    deskLong,
    deskShort,
    chairRadius,
    chairToDeskGap,
    padding,
    titleHeight,
  } = o;
  const chairD = chairRadius * 2;
  const chairCenterOffsetFromDesk = chairRadius + chairToDeskGap;

  // キャンバス全体のサイズ
  const width =
    padding + chairD + chairToDeskGap + deskLong + chairToDeskGap + chairD + padding;
  const height =
    padding +
    titleHeight +
    chairD +
    chairToDeskGap +
    deskShort +
    deskLong +
    padding;

  // 横机（上）
  const horizDeskX = padding + chairD + chairToDeskGap;
  const horizDeskY = padding + titleHeight + chairD + chairToDeskGap;

  // 縦机（左下・右下）
  const leftDeskX = horizDeskX;
  const leftDeskY = horizDeskY + deskShort;
  const rightDeskX = horizDeskX + deskLong - deskShort;
  const rightDeskY = leftDeskY;

  // 椅子の中心線
  const topChairCY = horizDeskY - chairCenterOffsetFromDesk;
  const leftChairCX = leftDeskX - chairCenterOffsetFromDesk;
  const rightChairCX = rightDeskX + deskShort + chairCenterOffsetFromDesk;

  // 各長辺に椅子を2脚、長辺の 1/4 と 3/4 の位置に配置
  const horizQ1X = horizDeskX + deskLong * 0.25;
  const horizQ3X = horizDeskX + deskLong * 0.75;
  const vertQ1Y = leftDeskY + deskLong * 0.25;
  const vertQ3Y = leftDeskY + deskLong * 0.75;

  const desks = [
    { id: island.desks[0].id, x: horizDeskX, y: horizDeskY, w: deskLong, h: deskShort },
    { id: island.desks[1].id, x: leftDeskX, y: leftDeskY, w: deskShort, h: deskLong },
    { id: island.desks[2].id, x: rightDeskX, y: rightDeskY, w: deskShort, h: deskLong },
  ];

  const seats = [
    { seat: island.desks[0].seats[0], cx: horizQ1X, cy: topChairCY, r: chairRadius },
    { seat: island.desks[0].seats[1], cx: horizQ3X, cy: topChairCY, r: chairRadius },
    { seat: island.desks[1].seats[0], cx: leftChairCX, cy: vertQ1Y, r: chairRadius },
    { seat: island.desks[1].seats[1], cx: leftChairCX, cy: vertQ3Y, r: chairRadius },
    { seat: island.desks[2].seats[0], cx: rightChairCX, cy: vertQ1Y, r: chairRadius },
    { seat: island.desks[2].seats[1], cx: rightChairCX, cy: vertQ3Y, r: chairRadius },
  ];

  return {
    width,
    height,
    title: { cx: width / 2, cy: padding + titleHeight / 2, text: island.name },
    desks,
    seats,
  };
}

export function drawIsland(ctx, island, layout, selectedSeatId, opts = {}) {
  const { offsetX = 0, offsetY = 0, showLabels = true, showTitle = true } = opts;
  const { title, desks, seats } = layout;

  if (showTitle) {
    ctx.fillStyle = COLORS.title;
    ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title.text, offsetX + title.cx, offsetY + title.cy);
  }

  for (const d of desks) {
    ctx.fillStyle = COLORS.desk;
    ctx.fillRect(offsetX + d.x, offsetY + d.y, d.w, d.h);
    ctx.strokeStyle = COLORS.deskBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(offsetX + d.x, offsetY + d.y, d.w, d.h);
  }

  for (const s of seats) {
    const isSelected = s.seat.id === selectedSeatId;
    ctx.beginPath();
    ctx.arc(offsetX + s.cx, offsetY + s.cy, s.r, 0, Math.PI * 2);
    ctx.fillStyle = isSelected ? COLORS.chairSelected : COLORS.chair;
    ctx.fill();
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.strokeStyle = isSelected ? COLORS.chairSelected : COLORS.chairBorder;
    ctx.stroke();

    if (showLabels) {
      ctx.fillStyle = isSelected ? COLORS.labelSelected : COLORS.label;
      ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
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
    this.island = island;
    this.opts = { ...DEFAULT_OPTS, ...opts };
    this.layout = computeIslandLayout(island, this.opts);
    this.selectedSeatId = null;
    this.listeners = { 'seat-selected': [] };

    this.fitCanvas();
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
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
    drawIsland(this.ctx, this.island, this.layout, this.selectedSeatId);
  }

  // クリップボード用: DPR スケール無し、白背景の独立した Canvas を返す。
  toExportCanvas() {
    const out = document.createElement('canvas');
    out.width = this.layout.width;
    out.height = this.layout.height;
    const outCtx = out.getContext('2d');
    outCtx.fillStyle = '#ffffff';
    outCtx.fillRect(0, 0, out.width, out.height);
    drawIsland(outCtx, this.island, this.layout, this.selectedSeatId);
    return out;
  }

  on(event, cb) {
    if (this.listeners[event]) this.listeners[event].push(cb);
  }

  emit(event, payload) {
    (this.listeners[event] || []).forEach((cb) => cb(payload));
  }
}
