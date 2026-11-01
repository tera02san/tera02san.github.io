$(function () {
  // 動きを減らす設定（prefers-reduced-motion）の方には、スクロールのアニメーションを行わない
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const duration = reduceMotion ? 0 : 300;

  // ページ内リンク（ページトップへ戻るボタンを含む）
  // 固定ヘッダーの高さ分を差し引いて、見出しがヘッダーに隠れない位置まで移動する
  $('a[href^="#"]').on('click', function (e) {
    const href = $(this).attr('href');
    const isTop = href === '#' || href === '';
    const $target = isTop ? $('html') : $(href);
    if (!$target.length) return;

    e.preventDefault();
    const headerHeight = $('.header').outerHeight() || 0;
    const top = isTop ? 0 : $target.offset().top - headerHeight;
    $('html, body').animate({ scrollTop: top }, duration, 'swing');
  });
});
