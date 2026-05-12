// Canvas を PNG 画像としてクリップボードにコピー。
export async function copyCanvasToClipboard(canvas) {
  if (!navigator.clipboard || !window.ClipboardItem) {
    throw new Error('このブラウザは画像のクリップボードコピーに対応していません。');
  }
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('画像の生成に失敗しました。'))),
      'image/png'
    );
  });
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
}
