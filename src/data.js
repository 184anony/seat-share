// 島と会場のデータ定義。
//
// 島の形状:
//   - 2 desk : 縦机を左右に2つ並べる（中央で隣接）。椅子は外側の長辺、各2脚。
//   - 3 desk : 縦机2つ + 横机1つ。横机は上 or 下を選べる。
//
// 各長机の長辺1つに椅子を2つ配置。
//
// ① 会場ビューが入ったので、班名（班A, 班B, ...）と席番号(1〜)もここで割り当てる。
// 実際の研修会場の名付けと一致しない可能性はあるが、デフォルトとして安定したラベルを返す。

const ISLAND_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function makeIsland({ id, name, deskCount = 3, horizontalPosition = 'top' } = {}) {
  const seat = (n) => ({ id: `${id}-s${n}`, label: String(n) });
  const _name = name ?? `班${id}`;

  if (deskCount === 2) {
    return {
      id,
      name: _name,
      deskCount: 2,
      horizontalPosition: null,
      desks: [
        {
          id: `${id}-d1`,
          orientation: 'vertical',
          position: 'left',
          seats: [seat(1), seat(2)],
        },
        {
          id: `${id}-d2`,
          orientation: 'vertical',
          position: 'right',
          seats: [seat(3), seat(4)],
        },
      ],
    };
  }

  if (horizontalPosition === 'bottom') {
    return {
      id,
      name: _name,
      deskCount: 3,
      horizontalPosition: 'bottom',
      desks: [
        {
          id: `${id}-d1`,
          orientation: 'vertical',
          position: 'top-left',
          seats: [seat(1), seat(2)],
        },
        {
          id: `${id}-d2`,
          orientation: 'vertical',
          position: 'top-right',
          seats: [seat(3), seat(4)],
        },
        {
          id: `${id}-d3`,
          orientation: 'horizontal',
          position: 'bottom',
          seats: [seat(5), seat(6)],
        },
      ],
    };
  }

  return {
    id,
    name: _name,
    deskCount: 3,
    horizontalPosition: 'top',
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

export function makeVenue({
  islandCount = 6,
  deskCount = 3,
  horizontalPosition = 'top',
} = {}) {
  const count = Math.max(1, Math.min(ISLAND_LETTERS.length, islandCount | 0));
  const islands = [];
  for (let i = 0; i < count; i++) {
    const id = ISLAND_LETTERS[i];
    islands.push(makeIsland({ id, deskCount, horizontalPosition }));
  }
  return {
    islands,
    config: { islandCount: count, deskCount, horizontalPosition },
  };
}
