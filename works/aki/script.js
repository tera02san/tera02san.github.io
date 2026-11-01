// ------------------------------
// 動きのオン・オフ（前回の設定を覚えておく）
// ------------------------------
const root = document.documentElement;
const motionBtn = document.querySelector('.motionToggle');

const setStill = (still) => {
	root.classList.toggle('is-still', still);
	if (motionBtn) {
		motionBtn.textContent = still ? 'アニメーションを再開する' : 'アニメーションを止める';
	}
};

let savedStill = false;
try {
	savedStill = localStorage.getItem('inko-still') === '1';
} catch (e) {}
setStill(savedStill);

if (motionBtn) {
	motionBtn.addEventListener('click', () => {
		const still = !root.classList.contains('is-still');
		setStill(still);
		try {
			localStorage.setItem('inko-still', still ? '1' : '0');
		} catch (e) {}
	});
}

// ------------------------------
// ハンバーガーメニュー
// ------------------------------
const menuBtn = document.querySelector('.menuBtn');
const gnav = document.querySelector('.gnav');

const setMenu = (open) => {
	menuBtn.setAttribute('aria-expanded', String(open));
	menuBtn.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
	gnav.classList.toggle('is-open', open);
};

if (menuBtn && gnav) {
	menuBtn.addEventListener('click', () => {
		setMenu(menuBtn.getAttribute('aria-expanded') !== 'true');
	});

	gnav.querySelectorAll('a').forEach((a) => {
		a.addEventListener('click', () => setMenu(false));
	});

	// Escキーで閉じて、ボタンにフォーカスを戻す
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') {
			setMenu(false);
			menuBtn.focus();
		}
	});
}

// ------------------------------
// ハートがぽわっと飛ぶ（動きを止めている人には出さない）
// ------------------------------
const motionOff = () =>
	root.classList.contains('is-still') || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const popHearts = (target) => {
	if (motionOff()) return;
	const marks = ['♡', '♪', '♡', '✿', '♡'];
	marks.forEach((mark, i) => {
		const heart = document.createElement('span');
		heart.className = 'popHeart';
		heart.setAttribute('aria-hidden', 'true');
		heart.textContent = mark;
		heart.style.left = `${30 + Math.random() * 40}%`;
		heart.style.setProperty('--x', `${(Math.random() - 0.5) * 120}px`);
		heart.style.animationDelay = `${i * 0.06}s`;
		target.append(heart);
		heart.addEventListener('animationend', () => heart.remove());
	});
};

// ------------------------------
// 看板インコ：スマホ（900px以下）は横にスワイプして見る
// 位置の目印（点）を押すと、そのインコまで移動する
// ------------------------------
const memberList = document.querySelector('.members__list');
const memberDots = document.querySelector('.members__dots');

if (memberList && memberDots) {
	const cards = [...memberList.querySelectorAll('.member')];
	const swipeMq = window.matchMedia('(max-width: 900px)');

	const dots = cards.map((card, i) => {
		const name = card.querySelector('.member__name').firstChild.textContent.trim();
		const dot = document.createElement('button');
		dot.type = 'button';
		dot.className = 'members__dot';
		dot.setAttribute('aria-label', `${name}を表示`);
		dot.addEventListener('click', () => {
			const pad = parseFloat(getComputedStyle(memberList).scrollPaddingLeft) || 0;
			const left = card.getBoundingClientRect().left - memberList.getBoundingClientRect().left + memberList.scrollLeft - pad;
			memberList.scrollTo({ left, behavior: motionOff() ? 'auto' : 'smooth' });
		});
		memberDots.append(dot);
		return dot;
	});

	// いま見えているカードの点を「選択中」にする
	const setCurrent = (index) => {
		dots.forEach((dot, i) => dot.setAttribute('aria-current', i === index ? 'true' : 'false'));
	};
	setCurrent(0);
	const seen = new IntersectionObserver((entries) => {
		entries.forEach((entry) => {
			if (entry.isIntersecting) setCurrent(cards.indexOf(entry.target));
		});
	}, { root: memberList, threshold: 0.6 });
	cards.forEach((card) => seen.observe(card));

	// スワイプのときだけ、キーボードの矢印キーで動かせるようにする（PCでは余計なフォーカスを作らない）
	const applyMode = () => {
		if (swipeMq.matches) {
			memberList.tabIndex = 0;
			memberList.setAttribute('role', 'region');
			memberList.setAttribute('aria-label', '看板インコとスタッフインコの紹介（横にスクロールできます）');
		} else {
			memberList.removeAttribute('tabindex');
			memberList.removeAttribute('role');
			memberList.removeAttribute('aria-label');
		}
	};
	applyMode();
	swipeMq.addEventListener('change', applyMode);
}

// ------------------------------
// 看板インコ：ごあいさつ
// ------------------------------
document.querySelectorAll('.member').forEach((card) => {
	const voice = card.querySelector('.member__voice');
	const btn = card.querySelector('.member__hello');
	let timer;

	const talk = () => {
		popHearts(card);
		voice.textContent = card.dataset.voice;
		card.classList.add('is-talking');
		clearTimeout(timer);
		timer = setTimeout(() => card.classList.remove('is-talking'), 2600);
	};

	if (btn) btn.addEventListener('click', talk);
	// カードのどこをタップしても反応（マウス・タッチ用）
	card.addEventListener('click', (e) => {
		if (e.target !== btn) talk();
	});
});

// ------------------------------
// インコ図鑑のタブ
// ------------------------------
const tabs = [...document.querySelectorAll('[role="tab"]')];

const selectTab = (tab) => {
	tabs.forEach((t) => {
		const active = t === tab;
		t.classList.toggle('is-active', active);
		t.setAttribute('aria-selected', String(active));
		t.tabIndex = active ? 0 : -1;
		const panel = document.getElementById(t.getAttribute('aria-controls'));
		if (panel) {
			panel.hidden = !active;
			panel.classList.toggle('is-active', active);
		}
	});
};

tabs.forEach((tab, i) => {
	tab.addEventListener('click', () => selectTab(tab));
	tab.addEventListener('keydown', (e) => {
		let next = null;
		if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
		if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
		if (e.key === 'Home') next = tabs[0];
		if (e.key === 'End') next = tabs[tabs.length - 1];
		if (!next) return;
		e.preventDefault();
		selectTab(next);
		next.focus();
	});
});

// ------------------------------
// 写真の拡大表示
// ------------------------------
const lightbox = document.querySelector('.lightbox');

if (lightbox) {
	// 空の src は HTML として正しくないので、画像要素は JS で用意し、開くときに入れる
	const lbImg = document.createElement('img');
	const lbCap = lightbox.querySelector('.lightbox__cap');

	document.querySelectorAll('.polaroid, .js-zoom').forEach((p) => {
		p.addEventListener('click', () => {
			const img = p.querySelector('img');
			const label = p.querySelector('span');
			lbImg.src = p.dataset.src;
			if (!lbImg.isConnected) lightbox.prepend(lbImg);
			lbImg.alt = img.alt || p.dataset.cap || '';
			lbCap.textContent = p.dataset.cap || (label ? label.textContent : '');
			lightbox.showModal();
		});
	});

	lightbox.querySelector('.lightbox__close').addEventListener('click', () => lightbox.close());
	// 写真の外側をタップしても閉じる
	lightbox.addEventListener('click', (e) => {
		if (e.target === lightbox) lightbox.close();
	});
}

// ------------------------------
// スクロールでふわっと表示
// ------------------------------
const fadeTargets = document.querySelectorAll(
	'.secTitle, .concept__points li, .staffPhoto, .member, .story__item, .panel, .plan, .dish, .gallery__list li, .rules__list li, .insta__card, .access__card, .subTitle, .recommend li, .flow li, .infoTable, .drinks li, .notice, .faq details, .otherPlan, .ctaBox, .roomMap__list li, .feat, .scrap__item, .news__box, .reserveSteps li, .dmTemplate, .lunch'
);

if ('IntersectionObserver' in window) {
	const io = new IntersectionObserver((entries) => {
		entries.forEach((entry) => {
			if (entry.isIntersecting) {
				entry.target.classList.add('is-show');
				io.unobserve(entry.target);
			}
		});
	}, { rootMargin: '0px 0px -60px 0px' });

	fadeTargets.forEach((el) => {
		el.classList.add('js-fade');
		// 並んだカードは、少しずつ時間をずらして順番に出てくる
		const siblings = [...el.parentElement.children].filter((c) => c.matches(el.tagName));
		const index = Math.max(0, siblings.indexOf(el));
		el.style.setProperty('--d', `${Math.min(index, 5) * 0.08}s`);
		io.observe(el);
	});
}

// ------------------------------
// 今日の営業状況（日本時間で判定）
// ------------------------------
const HOURS = {
	// 0:日 1:月 2:火 3:水 4:木 5:金 6:土 ／ null は定休日
	0: { open: 11, close: 18 },
	1: { open: 12, close: 18 },
	2: null,
	3: null,
	4: { open: 12, close: 18 },
	5: { open: 12, close: 18 },
	6: { open: 11, close: 18 },
};
// 祝日は土日と同じ営業時間
const HOLIDAY_HOURS = { open: 11, close: 18 };
// 定休日（火・水）と祝日が重なった日：false＝定休日としてお休み／true＝祝日として営業
const OPEN_ON_HOLIDAY_CLOSED_DAYS = false;
// 祝日の一覧（内閣府の発表をもとに、毎年ここへ追加してください）
const HOLIDAYS = [
	// 2026年
	'2026-01-01', '2026-01-12', '2026-02-11', '2026-02-23', '2026-03-20', '2026-04-29',
	'2026-05-03', '2026-05-04', '2026-05-05', '2026-05-06', '2026-07-20', '2026-08-11',
	'2026-09-21', '2026-09-22', '2026-09-23', '2026-10-12', '2026-11-03', '2026-11-23',
	// 2027年
	'2027-01-01', '2027-01-11', '2027-02-11', '2027-02-23', '2027-03-21', '2027-03-22',
	'2027-04-29', '2027-05-03', '2027-05-04', '2027-05-05', '2027-07-19', '2027-08-11',
	'2027-09-20', '2027-09-23', '2027-10-11', '2027-11-03', '2027-11-23',
];
const LAST_ENTRY = 17;
const NAP = { from: 13, to: 13.5 };
const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];

const getTokyoNow = () => {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone: 'Asia/Tokyo',
		year: 'numeric',
		month: 'numeric',
		day: 'numeric',
		weekday: 'short',
		hour: 'numeric',
		minute: 'numeric',
		hourCycle: 'h23',
	}).formatToParts(new Date());
	const get = (type) => parts.find((p) => p.type === type).value;
	const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
	// 日付の計算用（日本時間の「今日」を UTC の 0 時として持つ）
	const date = new Date(Date.UTC(Number(get('year')), Number(get('month')) - 1, Number(get('day'))));
	return { day, date, time: Number(get('hour')) + Number(get('minute')) / 60 };
};

const toKey = (date) => date.toISOString().slice(0, 10);
const isHoliday = (date) => HOLIDAYS.includes(toKey(date));

// その日の営業時間（定休日なら null）
const hoursOf = (date) => {
	const day = date.getUTCDay();
	if (isHoliday(date) && (HOURS[day] || OPEN_ON_HOLIDAY_CLOSED_DAYS)) return HOLIDAY_HOURS;
	return HOURS[day];
};

const nextOpenText = (date) => {
	for (let i = 1; i <= 7; i++) {
		const next = new Date(date.getTime() + i * 86400000);
		const hours = hoursOf(next);
		if (hours) {
			const label = i === 1 ? '明日' : `${DAY_NAMES[next.getUTCDay()]}曜日${isHoliday(next) ? '（祝）' : ''}`;
			return `次の営業は${label} ${hours.open}:00〜`;
		}
	}
	return '';
};

document.querySelectorAll('[data-open-status]').forEach((el) => {
	const text = el.querySelector('.openStatus__text');
	const { day, date, time } = getTokyoNow();
	const today = hoursOf(date);
	let state = 'is-closed';
	let msg;

	if (!today) {
		msg = `本日（${DAY_NAMES[day]}）は定休日です。${nextOpenText(date)}`;
	} else if (time < today.open) {
		msg = `本日は ${today.open}:00 から営業します`;
	} else if (time >= NAP.from && time < NAP.to) {
		state = 'is-break';
		msg = 'ただいまインコたちのお昼寝タイム（カフェスペースは営業中・インコ部屋は13:30から）';
	} else if (time < LAST_ENTRY) {
		state = 'is-open';
		msg = `ただいま営業中（最終受付 ${LAST_ENTRY}:00）`;
	} else if (time < today.close) {
		msg = `本日の受付は終了しました。${nextOpenText(date)}`;
	} else {
		msg = `本日の営業は終了しました。${nextOpenText(date)}`;
	}

	el.classList.add(state);
	text.textContent = msg;
});

// ------------------------------
// DMの文面をコピー
// ------------------------------
document.querySelectorAll('[data-copy]').forEach((btn) => {
	const target = document.getElementById(btn.dataset.copy);
	const done = btn.closest('.dmTemplate')?.querySelector('.dmTemplate__done');

	btn.addEventListener('click', async () => {
		try {
			await navigator.clipboard.writeText(target.textContent);
			if (done) done.textContent = 'コピーしました！InstagramのDMに貼りつけてね';
		} catch (e) {
			// コピーできない環境では、文面を選択状態にして手動コピーしてもらう
			const range = document.createRange();
			range.selectNodeContents(target);
			const sel = window.getSelection();
			sel.removeAllRanges();
			sel.addRange(range);
			if (done) done.textContent = '文面を選択しました。長押し（または Ctrl+C）でコピーしてね';
		}
	});
});

// ------------------------------
// 今日の日替わりランチを目立たせる
// ------------------------------
const lunchToday = document.querySelector('[data-lunch-today]');

if (lunchToday) {
	const { day, date } = getTokyoNow();
	const item = document.querySelector(`.lunch__list [data-day="${day}"]`);

	if (item && hoursOf(date)) {
		item.classList.add('is-today');
		item.insertAdjacentHTML('beforeend', '<span class="lunch__badge">今日</span>');
		// メニュー名の途中で改行しないよう、「〜」です はひとまとまりにする
		const name = document.createElement('span');
		name.className = 'nw';
		name.textContent = `「${item.querySelector('b').textContent}」です`;
		lunchToday.textContent = `今日（${DAY_NAMES[day]}）のランチは`;
		lunchToday.append(name);
	} else {
		lunchToday.textContent = `今日（${DAY_NAMES[day]}）は定休日のため、ランチはお休みです`;
	}
	lunchToday.hidden = false;
}

// ------------------------------
// 右下のページトップボタン：少しスクロールしたら表示
// ------------------------------
const floatTop = document.querySelector('.floatTop');

if (floatTop) {
	const toggleFloatTop = () => floatTop.classList.toggle('is-show', window.scrollY > 600);
	window.addEventListener('scroll', toggleFloatTop, { passive: true });
	toggleFloatTop();
}

// ------------------------------
// 見出しを文節で改行する（Safari など word-break: auto-phrase 未対応のブラウザ向け）
// 単語に区切り、助詞や句読点は前の語にくっつけて、その間にだけ改行できる位置（<wbr>）を入れる
// ------------------------------
if (!CSS.supports('word-break', 'auto-phrase') && 'Segmenter' in Intl) {
	const segmenter = new Intl.Segmenter('ja', { granularity: 'word' });
	// 前の語にくっつけるもの：ひらがな2文字以下（助詞など）・句読点・記号・小書き文字
	// 漢字1文字（「撮影｜会」の「会」など）も、前が漢字ならくっつける
	const isAttach = (s, prev) => /^[ぁ-ゖー]{1,2}$/.test(s) || /^[、。！？!?♡・〜）」』\s]+$/.test(s) || /^[ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮー]/.test(s) || (/^[一-龠]$/.test(s) && /[一-龠]$/.test(prev));
	const targets = document.querySelectorAll('h1, h2, h3, .hero__ja, .subHero__catch, .secTitle__ja, .subTitle__ja, .member__catch');

	targets.forEach((el) => {
		el.style.wordBreak = 'keep-all';
		el.style.overflowWrap = 'anywhere';
		el.querySelectorAll('*').forEach((child) => { child.style.wordBreak = 'keep-all'; });
		const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
		const nodes = [];
		while (walker.nextNode()) nodes.push(walker.currentNode);

		nodes.forEach((node) => {
			if (!/[ぁ-んァ-ヶ一-龠]/.test(node.data)) return;
			const phrases = [];
			let prefix = '';
			for (const { segment } of segmenter.segment(node.data)) {
				// 「ご紹介」「お部屋」の「ご・お」は、うしろの語にくっつける
				if (/^[ごお]$/.test(segment)) { prefix += segment; continue; }
				const word = prefix + segment;
				prefix = '';
				if (phrases.length && isAttach(word, phrases[phrases.length - 1])) phrases[phrases.length - 1] += word;
				else phrases.push(word);
			}
			if (prefix) phrases.push(prefix);
			const frag = document.createDocumentFragment();
			// 文節ごとに折り返さない span で包み、文節の間でだけ改行できるようにする
			phrases.forEach((p, i) => {
				if (i) frag.append(document.createElement('wbr'));
				const span = document.createElement('span');
				span.style.whiteSpace = 'nowrap';
				span.textContent = p;
				frag.append(span);
			});
			node.replaceWith(frag);
		});
	});
}
