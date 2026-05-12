// 島と席のデータ定義。
//
// 標準の島形状: コ字型（U字型）
//   - 横向きの長机 1つ（上）
//   - 縦向きの長机 2つ（左下・右下）
//   - 各長机の長辺1つに椅子を2つ配置（外側、コの内側を向く形）
//
// 席番号: 横机 1,2 → 左縦机 3,4 → 右縦机 5,6
//
// 各机に orientation / position を持たせ、レンダラーが U字配置に展開する。
// ①（会場ビュー）からも同じ makeIsland() を使って島を量産できる。

export function makeIsland({ id, name }) {
  const seat = (n) => ({ id: `${id}-s${n}`, label: String(n) });
  return {
    id,
    name,
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

export const SAMPLE_ISLAND = makeIsland({ id: 'A', name: '班A' });
