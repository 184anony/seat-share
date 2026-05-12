// 島の描画とクリック処理。
//
// 構造:
//   computeIslandLayout(island, opts) → 純粋関数。長机と椅子の座標を計算する。
//   drawIsland(ctx, layout, selectedSeatId, opts) → 純粋関数。任意の ctx に描く。
//   IslandView クラス → キャンバスに上記を結びつけ、クリックで席を選ぶラッパー。
//
// 島の形状は data.js の island.deskCount を見て分岐する:
//   - 3 机: 上に横机1つ + 下に縦机2つを中央寄せで隣接させる
//   - 2 机: 横机を縦方向に2段重ねる（向かい合わせ）
//
// 会場ビュー（①）を作るときは、純粋関数を直接呼び出して縮小表示・複数描画に流用できる。

const COLORS = {
  desk: '#d2b48c',
  deskBorder: '#8b6f47',
  chair: '#ffffff',
  chairBorder: '#3a3a3c',
  chairSelected: '#ff3b30',
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
  const chairOffset = chairRadius + chairToDeskGap;

  // 共通の canvas 幅: 横方向は左右に椅子分の余白を取らないとはみ出すので、
  //   ・3 机: 縦机は中央寄せ -> 椅子は横机の x 範囲内に収まる（後段で確認）
  //   ・2 机: 椅子は 1/4 と 3/4 位置で水平方向に余白不要
  // 横机を 1 つ置くだけの幅 = padding + deskLong + padding を共通の canvas 幅にする。
  const width = padding + deskLong + padding;

  if (island.deskCount === 2) {
    const deskX = padding;
    const desk1Y = padding + chairD + chairToDeskGap;
    const desk2Y = desk1Y + deskShort;
    const desk2BottomY = desk2Y + deskShort;
    const height = desk2BottomY + chairToDeskGap + chairD + padding;

    const desks = [
      { id: island.desks[0].id, x: deskX, y: desk1Y, w: deskLong, h: deskShort },
      { id: island.desks[1].id, x: deskX, y: desk2Y, w: deskLong, h: deskShort },
    ];

    const q1X = deskX + deskLong * 0.25;
    const q3X = deskX + deskLong * 0.75;
    const topCY = desk1Y - chairOffset;
    const botCY = desk2BottomY + chairOffset;

    const seats = [
      { seat: island.desks[0].seats[0], cx: q1X, cy: topCY, r: chairRadius },
      { seat: island.desks[0].seats[1], cx: q3X, cy: topCY, r: chairRadius },
      { seat: island.desks[1].seats[0], cx: q1X, cy: botCY, r: chairRadius },
      { seat: island.desks[1].seats[1], cx: q3X, cy: botCY, r: chairRadius },
    ];

    return { width, height, desks, seats };
  }

  // 3 机: 横机1 + 縦机2（中央で隣接、隙間なし）
  const horizDeskX = padding;
  const horizDeskY = padding + chairD + chairToDeskGap;

  const vertBlockWidth = deskShort * 2;
  const vertBlockX = horizDeskX + (deskLong - vertBlockWidth) / 2;
  const vertY = horizDeskY + deskShort;
  const leftDeskX = vertBlockX;
  const rightDeskX = vertBlockX + deskShort;

  const height = vertY + deskLong + padding;

  const desks = [
    { id: island.desks[0].id, x: horizDeskX, y: horizDeskY, w: deskLong, h: deskShort },
    { id: island.desks[1].id, x: leftDeskX, y: vertY, w: deskShort, h: deskLong },
    { id: island.desks[2].id, x: rightDeskX, y: vertY, w: deskShort, h: deskLong },
  ];

  const horizQ1X = horizDeskX + deskLong * 0.25;
  const horizQ3X = horizDeskX + deskLong * 0.75;
  const topChairCY = horizDeskY - chairOffset;
  const vertQ1Y = vertY + deskLong * 0.25;
  const vertQ3Y = vertY + deskLong * 0.75;
  const leftChairCX = leftDeskX - chairOffset;
  const rightChairCX = rightDeskX + deskShort + chairOffset;

  const seats = [
    { seat: island.desks[0].seats[0], cx: horizQ1X, cy: topChairCY, r: chairRadius },
    { seat: island.desks[0].seats[1], cx: horizQ3X, cy: topChairCY, r: chairRadius },
    { seat: island.desks[1].seats[0], cx: leftChairCX, cy: vertQ1Y, r: chairRadius },
    { seat: island.desks[1].seats[1], cx: leftChairCX, cy: vertQ3Y, r: chairRadius },
    { seat: island.desks[2].seats[0], cx: rightChairCX, cy: vertQ1Y, r: chairRadius },
    { seat: island.desks[2].seats[1], cx: rightChairCX, cy: vertQ3Y, r: chairRadius },
  ];

  return { width, height, desks, seats };
}

export function drawIsland(ctx, layout, selectedSeatId, opts = {}) {
  const { offsetX = 0, offsetY = 0 } = opts;
  const { desks, seats } = layout;

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

  // クリップボード用: DPR スケール無し、白背景の独立した Canvas を返す。
  toExportCanvas() {
    const out = document.createElement('canvas');
    out.width = this.layout.width;
    out.height = this.layout.height;
    const outCtx = out.getContext('2d');
    outCtx.fillStyle = '#ffffff';
    outCtx.fillRect(0, 0, out.width, out.height);
    drawIsland(outCtx, this.layout, this.selectedSeatId);
    return out;
  }

  on(event, cb) {
    if (this.listeners[event]) this.listeners[event].push(cb);
  }

  emit(event, payload) {
    (this.listeners[event] || []).forEach((cb) => cb(payload));
  }
}
