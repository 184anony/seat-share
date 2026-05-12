// 島と席のデータ定義。
//
// 島の形状は long-desk 2 or 3 個で構成される:
//   - 3机: 上に横机1つ + 下に縦机2つ（中央で隣接、隙間なし）
//   - 2机: 横机を縦方向に2段重ね（向かい合わせ）
//
// 各長机の長辺1つに椅子を2脚配置する。
//
// 班名や席番号などの「ラベル」は ① 会場ビューが入って実値が確定するまで持たない。
// ここでは id のみ持ち、UI 側はラベルを描画しない。

export function makeIsland({ id, deskCount = 3 } = {}) {
  const seat = (n) => ({ id: `${id}-s${n}` });

  if (deskCount === 2) {
    return {
      id,
      deskCount: 2,
      desks: [
        {
          id: `${id}-d1`,
          orientation: 'horizontal',
          position: 'top',
          seats: [seat(1), seat(2)],
        },
        {
          id: `${id}-d2`,
          orientation: 'horizontal',
          position: 'bottom',
          seats: [seat(3), seat(4)],
        },
      ],
    };
  }

  return {
    id,
    deskCount: 3,
    desks: [
      {
        id: `${id}-d1`,
        orientation: 'horizontal',
        position: 'top',
        seats: [seat(1), seat(2)],
      },
      {
        id: `${id}-d2`,
        orientation: 'vertical',
        position: 'bottom-left',
        seats: [seat(3), seat(4)],
      },
      {
        id: `${id}-d3`,
        orientation: 'vertical',
        position: 'bottom-right',
        seats: [seat(5), seat(6)],
      },
    ],
  };
}
