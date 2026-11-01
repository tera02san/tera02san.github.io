document.addEventListener("DOMContentLoaded", () => {
  // 1) スクロール演出
  const revealTargets = document.querySelectorAll(".js-reveal, .deco-bar");

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, {
    threshold: 0.2
  });

  revealTargets.forEach((target) => revealObserver.observe(target));

  // 2) トップへ戻るボタン：600pxを超えたら表示
  const backToTop = document.getElementById("backToTop");
  if (backToTop) {
    const toggleBackToTop = () => {
      backToTop.classList.toggle("is-visible", window.scrollY >= 600);
    };

    window.addEventListener("scroll", toggleBackToTop, { passive: true });
    toggleBackToTop();

    backToTop.addEventListener("click", () => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  // 3) 社員インタビュー モーダル
  const modal = document.getElementById("interviewModal");
  if (modal) {
    const modalCard = modal.querySelector(".modal-card");
    const modalImage = document.getElementById("modalImage");
    const modalName = document.getElementById("modalName");
    const modalDept = document.getElementById("modalDept");
    const modalComment = document.getElementById("modalComment");
    const interviewCards = document.querySelectorAll(".interview-card");
    const closeButtons = document.querySelectorAll("[data-modal-close]");

    let lastFocusedElement = null;

    const getFocusableElements = (container) =>
      Array.from(
        container.querySelectorAll(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );

    // モーダルを開いている間、Tabキーでの移動をモーダル内だけに留める
    const trapModalFocus = (event) => {
      if (event.key !== "Tab") return;
      const focusable = getFocusableElements(modalCard);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const openModal = (card) => {
      const image = card.querySelector("img");

      modalImage.src = image.currentSrc || image.src;
      modalImage.alt = image.alt;
      modalName.textContent = card.dataset.name || "";
      modalDept.textContent = card.dataset.dept || "";
      modalComment.textContent = card.dataset.comment || "";

      lastFocusedElement = document.activeElement;

      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");
      document.addEventListener("keydown", trapModalFocus);

      // is-open付与直後は visibility の変化がまだ反映されておらずフォーカスが乗らないことがあるため、
      // 次のフレームまで待ってからフォーカスを移す
      requestAnimationFrame(() => {
        const closeButton = modal.querySelector(".modal-close");
        if (closeButton) closeButton.focus();
      });
    };

    const closeModal = () => {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("modal-open");
      document.removeEventListener("keydown", trapModalFocus);

      if (lastFocusedElement) {
        lastFocusedElement.focus();
        lastFocusedElement = null;
      }
    };

    interviewCards.forEach((card) => {
      card.addEventListener("click", () => openModal(card));
    });

    closeButtons.forEach((button) => {
      button.addEventListener("click", closeModal);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && modal.classList.contains("is-open")) {
        closeModal();
      }
    });
  }

  // 4) 数字でみるセクション：スクロールで数字がカウントアップ
  const countTargets = document.querySelectorAll(".stats-grid strong[data-count]");

  const animateCount = (el) => {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || "";
    const duration = 1400;
    const startTime = performance.now();

    const step = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * eased);
      el.textContent = current.toLocaleString("en-US") + suffix;
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  };

  const countObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      animateCount(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.4 });

  countTargets.forEach((target) => countObserver.observe(target));

  // 5) モバイルメニュー（SPで使用）
  const menuButton = document.querySelector(".menu-button");
  const nav = document.querySelector(".pc-nav");

  if (menuButton && nav) {
    menuButton.addEventListener("click", () => {
      const isOpen = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", String(!isOpen));
      nav.classList.toggle("mobile-open", !isOpen);
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        menuButton.setAttribute("aria-expanded", "false");
        nav.classList.remove("mobile-open");
      });
    });
  }

  // 6) 遷移先が未確定のリンク（data-pending-link）は、クリックしてもページ先頭に飛ばないようにする
  document.querySelectorAll("[data-pending-link]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
    });
  });

  // 7) スクロール誘導の矢印：ファーストビューにいる間だけ表示する
  const scrollHint = document.querySelector(".scroll-hint");

  if (scrollHint) {
    const toggleScrollHint = () => {
      scrollHint.classList.toggle("is-hidden", window.scrollY > 80);
    };

    window.addEventListener("scroll", toggleScrollHint, { passive: true });
    toggleScrollHint();

    scrollHint.addEventListener("click", () => {
      window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
    });
  }

  // 8) エントリーフォーム：ポートフォリオのため実送信はせず、デモの完了表示のみ行う
  const entryForm = document.querySelector(".entry-form");
  if (entryForm) {
    // 未選択時はプレースホルダー色、選択済みは通常の文字色にするためクラスを切り替える
    entryForm.querySelectorAll("select").forEach((sel) => {
      const syncPlaceholderState = () => {
        sel.classList.toggle("is-placeholder", sel.value === "");
      };
      syncPlaceholderState();
      sel.addEventListener("change", syncPlaceholderState);
    });

    entryForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!entryForm.checkValidity()) {
        entryForm.reportValidity();
        return;
      }
      const successMsg = entryForm.querySelector(".entry-form-success");
      const submitBtn = entryForm.querySelector(".entry-form-submit");
      if (successMsg) successMsg.hidden = false;
      if (submitBtn) submitBtn.disabled = true;
      if (successMsg) successMsg.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  // 9) 動きの一時停止ボタン：流れる写真と背景の動きをまとめて止める
  //    動きを減らす設定の方には、最初から止めた状態で表示する
  const motionToggle = document.querySelector(".motion-toggle");
  if (motionToggle) {
    const setPaused = (paused) => {
      document.documentElement.classList.toggle("motion-paused", paused);
      motionToggle.setAttribute("aria-pressed", String(paused));
      motionToggle.setAttribute("aria-label", paused ? "写真の動きを再開" : "写真の動きを一時停止");
    };
    setPaused(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    motionToggle.addEventListener("click", () => {
      setPaused(!document.documentElement.classList.contains("motion-paused"));
    });
  }
});
