/* ==========================================================
   Cafe HINOKI — 共通スクリプト
   お店の情報は js/config.js にまとめています
   ========================================================== */
(() => {
  const REDUCE_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const WEEK = ['日', '月', '火', '水', '木', '金', '土'];

  /* ---------- 日本時間の「今」 ---------- */
  const nowInJapan = () => {
    const parts = new Intl.DateTimeFormat('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(new Date());
    const get = (type) => Number(parts.find((p) => p.type === type).value);
    return { y: get('year'), m: get('month'), d: get('day'), min: get('hour') * 60 + get('minute') };
  };
  const toMin = (hhmm) => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  };
  const toHHMM = (min) => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`;
  const dateKey = (date) => {
    const p = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
  };
  const hoursOf = (date) => {
    if (typeof SHOP === 'undefined') return null;
    if (SHOP.closedDates.includes(dateKey(date))) return null;
    return SHOP.hours[date.getDay()];
  };

  /* ---------- いまの時間帯（モーニング／ランチ／カフェタイム） ---------- */
  const currentSlot = () => {
    if (typeof SHOP === 'undefined') return null;
    const now = nowInJapan();
    const today = new Date(now.y, now.m - 1, now.d);
    if (!hoursOf(today)) return null;
    return SHOP.timeSlots.find((s) => now.min >= toMin(s.start) && now.min < toMin(s.end)) || null;
  };

  /* ---------- スマホのメニュー ---------- */
  const initNav = () => {
    const btn = document.querySelector('.menu-btn');
    const nav = document.getElementById('site-nav');
    if (!btn || !nav) return;
    const close = () => {
      btn.setAttribute('aria-expanded', 'false');
      nav.classList.remove('is-open');
    };
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
    });
    nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));
    // メニューの外をタップしても閉じる
    document.addEventListener('click', (e) => {
      if (nav.classList.contains('is-open') && !nav.contains(e.target) && !btn.contains(e.target)) close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        close();
        btn.focus();
      }
    });
  };

  /* ---------- トップのスライド（今の時間帯から始める） ---------- */
  const initHero = () => {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    const slides = [...hero.querySelectorAll('.hero-slide')];
    const dots = [...hero.querySelectorAll('.hero-dot')];
    const pause = hero.querySelector('.hero-pause');
    const stage = hero.querySelector('.hero-stage');
    const prev = hero.querySelector('.hero-arrow--prev');
    const next = hero.querySelector('.hero-arrow--next');
    if (slides.length < 2) return;

    let index = 0;
    const slot = currentSlot();
    if (slot) {
      const found = slides.findIndex((s) => s.dataset.slot === slot.id);
      if (found >= 0) index = found;
    }
    let timer = null;
    let playing = !REDUCE_MOTION;

    const imgOf = (n) => slides[n].querySelector('img');
    const show = (i) => {
      const next = (i + slides.length) % slides.length;
      slides.forEach((s, n) => {
        s.classList.toggle('is-prev', n === index && n !== next); // 前の写真は下に残しておく
        s.classList.toggle('is-active', n === next);
        s.setAttribute('aria-hidden', String(n !== next));
        s.inert = n !== next; // 見えていないスライドのリンクに、キーボードで移動しないように
      });
      dots.forEach((d, n) => d.setAttribute('aria-current', n === next ? 'true' : 'false'));
      index = next;
    };
    // 写真の読み込みが終わってから切り替える（途中で暗い背景が見えないように）
    const showWhenReady = (i) => {
      const n = (i + slides.length) % slides.length;
      const img = imgOf(n);
      if (img.complete && img.naturalWidth) {
        show(n);
        return;
      }
      img.loading = 'eager';
      (img.decode ? img.decode() : Promise.resolve()).catch(() => {}).then(() => show(n));
    };
    // ページが表示されたら、残りの写真も先に読み込んでおく
    window.addEventListener('load', () => slides.forEach((s, n) => {
      if (n !== index) imgOf(n).loading = 'eager';
    }), { once: true });

    const start = () => {
      stop();
      if (playing) timer = setInterval(() => showWhenReady(index + 1), 7000);
    };
    function stop() {
      if (timer) clearInterval(timer);
      timer = null;
    }
    const setPause = () => {
      hero.classList.toggle('is-paused', !playing);
      // 自動で切り替わる間は読み上げない。止めているときは、切り替えたスライドを読み上げる
      if (stage) stage.setAttribute('aria-live', playing ? 'off' : 'polite');
      pause.setAttribute('aria-pressed', String(!playing));
      pause.setAttribute('aria-label', playing ? 'スライドを一時停止' : 'スライドを再生');
    };

    dots.forEach((d, n) => d.addEventListener('click', () => {
      showWhenReady(n);
      start();
    }));
    if (prev) prev.addEventListener('click', () => {
      showWhenReady(index - 1);
      start();
    });
    if (next) next.addEventListener('click', () => {
      showWhenReady(index + 1);
      start();
    });
    pause.addEventListener('click', () => {
      playing = !playing;
      setPause();
      start();
    });
    // 開いたときは、今の時間帯のスライドを切り替えの動きなしで表示
    hero.classList.add('is-init');
    const first = index;
    imgOf(first).loading = 'eager';
    index = slides.findIndex((s) => s.classList.contains('is-active'));
    show(first);
    slides.forEach((s) => s.classList.remove('is-prev'));
    requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.remove('is-init')));
    setPause();
    start();
  };

  /* ---------- 文節ごとに区切った文を入れる（| の所だけで折り返す） ---------- */
  const setPhrases = (el, text) => {
    el.textContent = '';
    text.split('|').forEach((part, i) => {
      if (i > 0) el.appendChild(document.createElement('wbr'));
      el.appendChild(document.createTextNode(part));
    });
  };

  /* ---------- 今日の営業状況 ---------- */
  const initStatus = () => {
    const el = document.querySelector('[data-shop-status]');
    if (!el || typeof SHOP === 'undefined') return;
    const now = nowInJapan();
    const today = new Date(now.y, now.m - 1, now.d);
    const h = hoursOf(today);

    const nextOpenDay = () => {
      for (let i = 1; i <= 14; i += 1) {
        const d = new Date(now.y, now.m - 1, now.d + i);
        const dh = hoursOf(d);
        if (dh) return `${d.getMonth() + 1}月${d.getDate()}日|（${WEEK[d.getDay()]}）|${dh.open}から`;
      }
      return '';
    };

    let state = 'closed';
    let text = '';
    if (!h) {
      const special = SHOP.closedDates.includes(dateKey(today));
      text = `本日は|${special ? '臨時休業' : '定休日'}です。|次の営業は|${nextOpenDay()}です。`;
    } else {
      const open = toMin(h.open);
      const close = toMin(h.close);
      const lo = toHHMM(close - SHOP.lastOrderBefore);
      if (now.min < open) {
        text = `本日は|${h.open}から|営業します|（${h.open}〜${h.close}／|L.O. ${lo}）。`;
      } else if (now.min < close) {
        state = 'open';
        const slot = currentSlot();
        text = `ただいま|営業中です|（本日 ${h.open}〜${h.close}／|L.O. ${lo}）。${slot ? `|いまは|${slot.label}の|時間です。` : ''}`;
      } else {
        text = `本日の|営業は|終了しました。|次の営業は|${nextOpenDay()}です。`;
      }
    }
    setPhrases(el, text);
    el.dataset.state = state;
  };

  /* ---------- 「ただいまの時間」の印 ---------- */
  const initSlotMark = () => {
    const slot = currentSlot();
    if (!slot) return;
    const row = document.querySelector(`.time-row[data-slot="${slot.id}"]`);
    if (!row) return;
    row.classList.add('is-now');
    const mark = row.querySelector('.time-now');
    if (mark) mark.hidden = false;
  };

  /* ---------- スクロールで静かに表示 ---------- */
  const initReveal = () => {
    if (REDUCE_MOTION || !('IntersectionObserver' in window)) return;
    const targets = document.querySelectorAll('[data-reveal]');
    document.documentElement.classList.add('js-reveal');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-shown');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -60px 0px' });
    targets.forEach((t) => io.observe(t));
  };

  /* ---------- ページ内リンク：セクションの先頭をヘッダーのすぐ下にぴったり合わせる ----------
     フォントや写真があとから読み込まれて位置がずれても、止まったあとにもう一度合わせ直す */
  const initJump = (onArrive = () => {}) => {
    const header = document.querySelector('.header');
    // 上の余白（112pxなど）はそのまま見せず、どこへ飛んでもヘッダーと中身のあいだが --jump-gap になるようにする
    const gapOf = (el) => {
      const pad = parseFloat(getComputedStyle(el).paddingTop) || 0;
      const gap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--jump-gap')) || 0;
      return pad - gap;
    };
    const topOf = (el) => el.getBoundingClientRect().top + window.scrollY - (header ? header.offsetHeight : 0) + gapOf(el);
    const align = (el, smooth) => {
      window.scrollTo({ top: Math.max(0, topOf(el)), behavior: smooth && !REDUCE_MOTION ? 'smooth' : 'instant' }); // 'auto' だとCSSの smooth が効いてしまう
    };
    const settle = (el) => {
      let done = false;
      const fix = () => {
        if (done) return;
        done = true;
        if (Math.abs(topOf(el) - window.scrollY) > 1) align(el, false);
        onArrive(); // ナビの下線を、着いた場所に合わせる
      };
      window.addEventListener('scrollend', fix, { once: true });
      setTimeout(fix, 1200); // scrollend に対応していないブラウザ用
    };
    const go = (el, smooth) => {
      // スクロールで表示する要素は先に出しておく（ふわっと出る前の空白が見えないように）
      // 動きの途中（16px下にずれた状態）で位置を測るとずれるので、ここはふわっとさせずにすぐ出す
      const reveals = [el, ...el.querySelectorAll('[data-reveal]')].filter((r) => r.matches('[data-reveal]:not(.is-shown)'));
      reveals.forEach((r) => {
        r.style.transition = 'none';
        r.classList.add('is-shown');
      });
      void document.body.offsetHeight; // ここで一度、出した状態の位置を確定させる
      reveals.forEach((r) => (r.style.transition = ''));
      align(el, smooth);
      settle(el);
      // 読み上げソフトやキーボード操作でも、移動先から読み進められるように
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
      el.focus({ preventScroll: true });
    };

    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href]');
      if (!a) return;
      const url = new URL(a.href, location.href);
      if (url.pathname !== location.pathname || !url.hash) return;
      const el = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!el) return;
      e.preventDefault();
      if (location.hash !== url.hash) history.pushState(null, '', url.hash);
      go(el, true);
    });

    // 別のページから index.html#news のように来たとき：フォントと写真がそろってから合わせる
    if (location.hash) {
      const el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (el) {
        const ready = document.fonts ? document.fonts.ready : Promise.resolve();
        window.addEventListener('load', () => ready.then(() => go(el, false)), { once: true });
      }
    }
  };

  /* ---------- いま見ている場所をナビで示す（ABOUT・NEWS・ACCESS） ---------- */
  const initHere = () => {
    const nav = document.getElementById('site-nav');
    if (!nav) return;
    const links = [...nav.querySelectorAll('a[href^="#"]')];
    const sections = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
    if (!sections.length) return;
    const update = () => {
      // 画面の高さ45%の線にかかっているセクションを「今の場所」にする（どれにもかからなければ下線はHOMEのまま）
      const line = window.innerHeight * 0.45;
      const current = sections.find((s) => {
        const r = s.getBoundingClientRect();
        return r.top <= line && r.bottom > line;
      });
      links.forEach((a) => {
        const here = Boolean(current) && a.getAttribute('href') === `#${current.id}`;
        a.classList.toggle('is-here', here);
        if (here) a.setAttribute('aria-current', 'location');
        else if (a.getAttribute('aria-current') === 'location') a.removeAttribute('aria-current');
      });
      nav.classList.toggle('has-here', Boolean(current));
    };
    window.addEventListener('scroll', update, { passive: true }); // 位置を3つ読むだけなので軽い
    window.addEventListener('resize', update);
    update();
    return update;
  };

  /* ---------- ページの上へ戻るボタン（画面1枚ぶん下がったら表示） ---------- */
  const initToTop = () => {
    const btn = document.querySelector('[data-to-top]');
    if (!btn) return;
    const update = () => btn.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.8);
    window.addEventListener('scroll', update, { passive: true });
    update();
  };

  /* ---------- フッターの年 ---------- */
  const initYear = () => {
    const el = document.querySelector('[data-year]');
    if (el) el.textContent = nowInJapan().y;
  };

  initNav();
  initHero();
  initStatus();
  initSlotMark();
  initReveal();
  initJump(initHere());
  initToTop();
  initYear();
})();
