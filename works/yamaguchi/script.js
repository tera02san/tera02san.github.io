/**
 * 株式会社山口自動車. サイト共通スクリプト
 * 機能ごとに init 関数を分け、DOMContentLoaded でまとめて起動する。
 * 動きを減らす設定（prefers-reduced-motion）の利用者には、アニメーションを行わない。
 */

const REDUCE_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const EASE = 'cubic-bezier(0.22, 0.61, 0.36, 1)';

/** 要素が一度画面に入ったら callback を実行する */
const onceInView = (el, callback, options = { threshold: 0.3 }) => {
  if (!('IntersectionObserver' in window)) {
    callback();
    return;
  }
  const io = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    io.disconnect();
    callback();
  }, options);
  io.observe(el);
};

/* ---------- スマホ用メニュー ---------- */
function initMenu() {
  const hamburger = document.getElementById('js-hamburger');
  const nav = document.getElementById('js-nav');
  if (!hamburger || !nav) return;

  const setMenu = (open) => {
    hamburger.classList.toggle('is-active', open);
    nav.classList.toggle('is-active', open);
    hamburger.setAttribute('aria-expanded', String(open));
    hamburger.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
  };

  hamburger.addEventListener('click', () => setMenu(!nav.classList.contains('is-active')));

  // Escキーで閉じ、フォーカスをボタンに戻す
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-active')) {
      setMenu(false);
      hamburger.focus();
    }
  });

  // メニュー内のリンクを選んだら閉じる
  nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));

  // ヘッダーナビが展開される幅（CSSと同じ1100px）になったら閉じた状態に戻す
  window.matchMedia('(min-width: 1100px)').addEventListener('change', (e) => {
    if (e.matches) setMenu(false);
  });
}

/* ---------- スクロール連動：ヘッダーの影・トップへ戻るボタン ---------- */
function initScrollEffects() {
  const header = document.querySelector('.header');
  const totopBtn = document.getElementById('js-totop');

  let ticking = false;
  const update = () => {
    const y = window.scrollY;
    header?.classList.toggle('is-scrolled', y > 10);
    totopBtn?.classList.toggle('is-show', y > 300);
    ticking = false;
  };

  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  update();

  totopBtn?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: REDUCE_MOTION ? 'auto' : 'smooth' });
  });
}

/* ---------- メインビジュアルのスライドショー（一時停止ボタン付き） ---------- */
function initSlideshow() {
  const slides = document.querySelectorAll('.slide-img');
  if (slides.length < 2) return;

  const fv = document.querySelector('.fv');
  const toggle = document.getElementById('js-slide-toggle');
  const INTERVAL = 6000;
  let current = 0;
  let timer = null;

  const next = () => {
    slides[current].classList.remove('is-active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('is-active');
  };

  const setPaused = (paused) => {
    clearInterval(timer);
    timer = paused ? null : setInterval(next, INTERVAL);
    fv?.classList.toggle('is-paused', paused);
    if (toggle) {
      toggle.setAttribute('aria-pressed', String(paused));
      toggle.setAttribute('aria-label', paused ? 'スライドショーを再生' : 'スライドショーを一時停止');
    }
  };

  setPaused(REDUCE_MOTION); // 動きを減らす設定なら最初から停止
  toggle?.addEventListener('click', () => setPaused(timer !== null));
}

/* ---------- よくあるご質問：なめらかに開閉するアコーディオン ---------- */
function initFaq() {
  const running = new WeakMap(); // 開閉中のアニメーション

  const animate = (item, open) => {
    const body = item.querySelector('.faq-body');
    if (REDUCE_MOTION || !body.animate) {
      item.open = open;
      return;
    }
    running.get(item)?.cancel();
    if (open) item.open = true;

    const from = open ? 0 : body.offsetHeight;
    const to = open ? body.scrollHeight : 0;
    const anim = body.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: 450, easing: EASE });
    running.set(item, anim);
    anim.onfinish = () => {
      if (!open) item.open = false;
      running.delete(item);
    };
  };

  document.querySelectorAll('.faq').forEach((list) => {
    const items = list.querySelectorAll('.faq-item');

    items.forEach((item) => {
      item.querySelector('.faq-q').addEventListener('click', (e) => {
        e.preventDefault();
        const willOpen = !item.open;
        // 1つ開いたら、同じリストの他の質問は閉じる
        if (willOpen) items.forEach((other) => other !== item && other.open && animate(other, false));
        animate(item, willOpen);
      });
    });

    // 質問が並び終えたころに1問目を開き、開閉できることを伝える
    if (items[0]) {
      onceInView(list, () => {
        setTimeout(() => {
          if (!list.querySelector('.faq-item[open]')) animate(items[0], true);
        }, REDUCE_MOTION ? 0 : 900);
      });
    }
  });
}

/* ---------- お問い合わせフォーム（デモ：送信はせず結果を表示） ---------- */
function initForms() {
  document.querySelectorAll('form.form').forEach((form) => {
    const status = document.createElement('p');
    status.className = 'form-status';
    status.setAttribute('role', 'status'); // 読み上げソフトにも結果を伝える
    form.appendChild(status);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      status.textContent = 'デモサイトのため、実際には送信されません。お急ぎの方はお電話（0745-65-0704）でご相談ください。';
      status.classList.add('is-show');
    });
  });
}

/* ---------- スクロールに合わせたフェードイン ---------- */
function initReveal() {
  // head内のスクリプトで、動きを許可している環境にだけ js-anim が付いている
  if (!document.documentElement.classList.contains('js-anim')) return;

  // [セレクタ, 動きの種類（現在は下から浮かぶ up のみ）, 兄弟要素で時間差をつけるか]
  const targets = [
    ['.section-head', 'up'],
    ['.media-img', 'up'],
    ['.media-text', 'up'],
    ['.features > .feature', 'up', true],
    ['.note', 'up'],
    ['.text-link', 'up'],
    ['.video-frame', 'up'],
    ['.gallery > img', 'up', true],
    ['.zigzag > .zz-item', 'up'],
    ['.flow > .flow-step', 'up', true],
    ['.photo-steps > .photo-step', 'up', true],
    ['.banner-img', 'up'],
    ['.contact-side-tel', 'up'],
    ['.price-rows > .price-row', 'up', true],
    ['.faq > .faq-item', 'up', true],
    ['.cta-inner > *', 'up', true],
    ['.company-photo', 'up'],
    ['.info > div', 'up', true],
    ['.map', 'up'],
    ['.form', 'up'],
    ['.flow-actions', 'up'],
  ];

  // 見出しを行ごとに包み、下から滑り上がる演出にする
  document.querySelectorAll('.section-head .section-title').forEach((title) => {
    title.innerHTML = title.innerHTML
      .split(/<br\s*\/?>/i)
      .map((line, i) => `<span class="t-line"><span class="t-in" style="--ld:${i * 0.08}s">${line.trim()}</span></span>`)
      .join('');
  });

  const elements = [];
  targets.forEach(([selector, type, stagger]) => {
    document.querySelectorAll(selector).forEach((el) => {
      if (el.closest('.fv, .sub-hero')) return;
      el.dataset.anim = type;
      if (stagger) {
        const index = [...el.parentElement.children].indexOf(el);
        el.style.setProperty('--d', `${(index % 4) * 0.08}s`);
      }
      elements.push(el);
    });
  });

  // 表示し終えたら属性を外し、ホバーの動きに遅延が残らないようにする
  const cleanUp = (el) => {
    const done = (e) => {
      if (e.target !== el) return; // 子要素のトランジションは無視
      el.removeAttribute('data-anim');
      el.style.removeProperty('--d');
      el.removeEventListener('transitionend', done);
    };
    el.addEventListener('transitionend', done);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-inview');
      cleanUp(entry.target);
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

  elements.forEach((el) => observer.observe(el));
}

/* ---------- 地図：ネットにつながっていないときは、空白の枠の代わりに案内を出す ---------- */
function initMapOffline() {
  const map = document.querySelector('.map');
  const frame = map && map.querySelector('iframe');
  if (!frame) return;
  const note = document.createElement('p');
  note.className = 'map-offline';
  note.textContent = '地図は、インターネットに接続しているときに表示されます。';
  const update = () => {
    const offline = !navigator.onLine;
    frame.hidden = offline;
    if (offline && !note.isConnected) map.appendChild(note);
    if (!offline && note.isConnected) note.remove();
  };
  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  update();
}

document.addEventListener('DOMContentLoaded', () => {
  initMapOffline();
  initMenu();
  initScrollEffects();
  initSlideshow();
  initFaq();
  initForms();
  initReveal();
});
