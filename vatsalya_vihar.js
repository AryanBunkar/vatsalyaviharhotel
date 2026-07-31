// ── SMOOTH SCROLL (LENIS) ──
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;
let lenis = null;

if (!prefersReducedMotion && window.Lenis) {
  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // cinematic ease-out
    smoothWheel: true,
    smoothTouch: false, // native momentum feels better on touch devices
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
}

// Hooks a scroll-driven function directly to Lenis's interpolated position
// (falls back to native scroll if Lenis didn't load, so nothing breaks)
function onSmoothScroll(fn) {
  fn();
  if (lenis) {
    lenis.on("scroll", fn);
  } else {
    window.addEventListener("scroll", () => requestAnimationFrame(fn), {
      passive: true,
    });
  }
}

// ── HAMBURGER MENU ──
const hamburger = document.querySelector(".hero__hamburger");
const mobileMenu = document.querySelector(".hero__mobile-menu");

if (hamburger && mobileMenu) {
  hamburger.addEventListener("click", () => {
    const isOpen = mobileMenu.classList.toggle("open");
    hamburger.classList.toggle("open", isOpen);
    hamburger.setAttribute("aria-expanded", isOpen);
  });

  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mobileMenu.classList.remove("open");
      hamburger.classList.remove("open");
      hamburger.setAttribute("aria-expanded", false);
    });
  });
}

//hero title
function fitTitle(animate = false) {
  const title = document.querySelector(".hero__title");
  const hero = document.querySelector(".hero");
  if (!title || !hero) return;

  const availableWidth = hero.clientWidth * 0.95;

  // reset
  title.style.animation = "none";
  title.style.fontSize = "100px";
  title.style.opacity = animate ? "0" : "1";
  title.style.transform = animate
    ? "translateX(-50%) translateY(40px)"
    : "translateX(-50%) translateY(0)";

  requestAnimationFrame(() => {
    const titleWidth = title.scrollWidth;
    const ratio = availableWidth / titleWidth;

    title.style.fontSize = 100 * ratio + "px";

    if (animate) {
      void title.offsetHeight; // force reflow
      requestAnimationFrame(() => {
        title.style.animation =
          "titleReveal 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards";
      });
    }
  });
}
document.fonts.ready.then(() => {
  const revealDone = 1900;
  const elapsed = performance.now();
  const remaining = Math.max(0, revealDone - elapsed);
  setTimeout(() => fitTitle(true), remaining);
});
window.addEventListener("resize", () => fitTitle(false));

// ── PARALLAX ON IMAGE ONLY (no delay) ──
// ── PARALLAX ON IMAGE/VIDEO (desktop + mobile) ──
const heroBgDesktop = document.querySelector(".hero__bg-desktop");
const heroBgMobile = document.querySelector(".hero__bg-mobile");
let ticking = false;

function onScroll() {
  if (!ticking) {
    requestAnimationFrame(() => {
      const offset = window.scrollY * 0.2;
      const isMobile = window.innerWidth <= 768;

      const activeEl = isMobile ? heroBgMobile : heroBgDesktop;
      if (activeEl) {
        activeEl.style.transform = `translateY(${offset}px)`;
      }

      ticking = false;
    });
    ticking = true;
  }
}

window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", onScroll);
// ── HOUSE SECTION IMAGE PARALLAX + SCALE (combined) ──
document.querySelectorAll(".house-section").forEach((section) => {
  const img = section.querySelector(".house-section__img");
  if (!img) return;

  function update() {
    const rect = section.getBoundingClientRect();
    const total = window.innerHeight + section.offsetHeight; // never zero
    const scrolled = window.innerHeight - rect.top;
    const progress = Math.max(0, Math.min(1, scrolled / total));

    const offset = (progress - 0.5) * 100; // slide
    const scale = 1 + progress * 0.2; // zoom

    img.style.transform = `translateY(${offset}px) scale(${scale})`;
  }

  window.addEventListener("scroll", () => requestAnimationFrame(update), {
    passive: true,
  });
  update();
});

const textEls = document.querySelectorAll(".house-section__text");
const houseSections = document.querySelectorAll(".house-section");

if (houseSections.length > 0) {
  const firstSection = houseSections[0];
  const lastSection = houseSections[houseSections.length - 1];

  const firstLeft = firstSection.querySelector(".house-section__left");
  const firstText = firstSection.querySelector(".house-section__text");
  const lastLeft = lastSection.querySelector(".house-section__left");
  const lastText = lastSection.querySelector(".house-section__text");

  let firstLocked = false;
  let lastLocked = false;
  let lastScrollY = window.scrollY;

  function updateActiveLeftPanel() {
    if (window.innerWidth <= 768) return;

    const viewH = window.innerHeight;
    const middle = viewH / 2;
    const maxDistance = viewH * 0.5;

    const firstRect = firstSection.getBoundingClientRect();
    const lastRect = lastSection.getBoundingClientRect();

    const scrollingUp = window.scrollY < lastScrollY;
    lastScrollY = window.scrollY;

    // ── FIRST SECTION LOCK (scroll UP) — mirrors last section logic ──
    // ── FIRST SECTION LOCK (scroll UP) ──
    if (scrollingUp && firstRect.bottom >= viewH * 1.25 && !firstLocked) {
      firstLocked = true;

      firstLeft.style.position = "absolute";
      firstLeft.style.top = "50%";
      firstLeft.style.transform = "translateY(-50%)";
      firstLeft.style.opacity = "1";
      firstLeft.style.pointerEvents = "auto";

      firstText.style.opacity = "1";
    }

    if (firstRect.bottom < viewH * 1.25 && firstLocked) {
      firstLocked = false;

      firstLeft.style.cssText = "";
      firstText.style.cssText = "";

      firstLeft.classList.remove("active");
      firstText.classList.remove("visible");
    }
    // ── LAST SECTION LOCK (scroll DOWN) ──
    if (lastRect.top <= -(viewH * 0.25) && !lastLocked) {
      lastLocked = true;
      lastLeft.style.position = "absolute";
      lastLeft.style.top = "50%";
      lastLeft.style.transform = "translateY(-50%)";
      lastLeft.style.opacity = "1";
      lastLeft.style.pointerEvents = "auto";
      lastText.style.opacity = "1";
    }

    if (lastRect.top > -(viewH * 0.25) && lastLocked) {
      lastLocked = false;
      lastLeft.style.cssText = "";
      lastText.style.cssText = "";
    }

    // ── HIDE ALL PANELS WHILE FIRST IS LOCKED ──
    if (firstLocked || lastLocked) {
      houseSections.forEach((section) => {
        if (section === firstSection || section === lastSection) return;

        const leftPanel = section.querySelector(".house-section__left");
        const textEl = section.querySelector(".house-section__text");

        if (leftPanel) leftPanel.classList.remove("active");
        if (textEl) textEl.classList.remove("visible");
      });

      return;
    }

    // ── NORMAL LOGIC FOR ALL SECTIONS ──
    let closestSection = null;
    let closestDistance = Infinity;

    houseSections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      const sectionCenter = rect.top + rect.height / 2;
      const distance = Math.abs(sectionCenter - middle);

      if (rect.top < viewH && rect.bottom > 0 && distance < closestDistance) {
        closestDistance = distance;
        closestSection = section;
      }
    });

    if (closestDistance > maxDistance) closestSection = null;

    if (closestSection === firstSection) {
      const rect = firstSection.getBoundingClientRect();
      if (rect.top > middle) closestSection = null;
    }

    houseSections.forEach((section) => {
      if (section === lastSection && lastLocked) return;

      const leftPanel = section.querySelector(".house-section__left");
      const textEl = section.querySelector(".house-section__text");
      const isActive = section === closestSection;
      if (leftPanel) leftPanel.classList.toggle("active", isActive);
      if (textEl) textEl.classList.toggle("visible", isActive);
    });
  }
  window.addEventListener(
    "scroll",
    () => requestAnimationFrame(updateActiveLeftPanel),
    { passive: true },
  );
  updateActiveLeftPanel();
}

// ── QUOTE SECTION PARALLAX ──
const quoteImg = document.getElementById("quoteImg");
const quoteSection = document.getElementById("quoteSection");

if (quoteImg && quoteSection) {
  function updateQuoteParallax() {
    const rect = quoteSection.getBoundingClientRect();
    const total = window.innerHeight + quoteSection.offsetHeight;
    const scrolled = window.innerHeight - rect.top;
    const progress = scrolled / total;

    const offset = (progress - 0.5) * 200; // 200 = intensity, increase if needed
    quoteImg.style.transform = `translateY(${offset}px)`;
  }

  window.addEventListener(
    "scroll",
    () => requestAnimationFrame(updateQuoteParallax),
    { passive: true },
  );
  updateQuoteParallax();
}
(function () {
  const l1 = document.getElementById("quoteLine1");
  const l2 = document.getElementById("quoteLine2");
  if (!l1 || !l2) return;

  const LINE1_PLAIN = "A ";
  const LINE1_ITALIC = "luxury hideaway";
  const LINE2 = "immersed in nature";

  function buildChars(el, text, isItalic) {
    text.split("").forEach((ch) => {
      const s = document.createElement("span");
      s.className = "quote-char" + (isItalic ? " quote-char--italic" : "");
      s.innerHTML = ch === " " ? "&nbsp;" : ch;
      el.appendChild(s);
    });
  }

  buildChars(l1, LINE1_PLAIN, false);
  buildChars(l1, LINE1_ITALIC, true);
  buildChars(l2, LINE2, false);

  const prefersReducedMotionQuote = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  function revealLine(lineEl, startDelay, charDelay) {
    lineEl.querySelectorAll(".quote-char").forEach((ch, i) => {
      setTimeout(
        () => ch.classList.add("revealed"),
        startDelay + i * charDelay,
      );
    });
  }

  let hasAnimated = false;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !hasAnimated) {
          hasAnimated = true;
          if (prefersReducedMotionQuote) {
            document
              .querySelectorAll(".quote-char")
              .forEach((c) => c.classList.add("revealed"));
          } else {
            revealLine(l1, 200, 52);
            const l1End = 200 + (LINE1_PLAIN + LINE1_ITALIC).length * 52 + 300;
            revealLine(l2, l1End, 46);
          }
          observer.disconnect();
        }
      });
    },
    { threshold: 0.35 },
  );

  observer.observe(quoteSection);
})();

// ── FIND US PARALLAX ──
const findusImg = document.getElementById("findusImg");
const findusContent = document.querySelector(".findus__content");
const findusWrap = findusImg ? findusImg.closest(".findus__img-wrap") : null;

if (findusImg && findusWrap) {
  function updateFindusParallax() {
    const rect = findusWrap.getBoundingClientRect();
    const total = window.innerHeight + findusWrap.offsetHeight;
    const scrolled = window.innerHeight - rect.top;
    const progress = scrolled / total;

    // Image moves more (background layer)
    const imgOffset = (progress - 0.5) * 120;
    findusImg.style.transform = `translateY(${imgOffset}px)`;

    // Content card moves opposite and less (foreground layer, creates depth)
    if (findusContent) {
      const contentOffset = (progress - 0.5) * -30;
      findusContent.style.transform = `translateY(${contentOffset}px)`;
    }
  }

  window.addEventListener(
    "scroll",
    () => requestAnimationFrame(updateFindusParallax),
    { passive: true },
  );
  updateFindusParallax();
}

// ── FOOTER FORM ──
const footerInput = document.querySelector(".footer-section__input");
const footerCta = document.querySelector(".footer-section__cta");

if (footerInput && footerCta) {
  footerCta.addEventListener("click", (e) => {
    e.preventDefault();

    const email = footerInput.value.trim();

    if (!email || !email.includes("@")) {
      footerInput.style.borderBottomColor = "#e74c3c";
      footerInput.placeholder = "Please enter a valid email";
      return;
    }

    // reset border
    footerInput.style.borderBottomColor = "#1a1a18";

    // success state
    footerCta.innerHTML =
      'Thank you! <span class="footer-section__cta-arrow">✓</span>';
    footerInput.value = "";
    footerInput.placeholder = "Email address";
  });

  // reset border on type
  footerInput.addEventListener("input", () => {
    footerInput.style.borderBottomColor = "#1a1a18";
  });
}

function fitBrandText() {
  const wrapper = document.querySelector(".site-footer__brand");
  const text = document.querySelector(".site-footer__brand-text");
  if (!wrapper || !text) return;

  const availableWidth = wrapper.clientWidth;
  if (availableWidth === 0) return;

  text.style.fontSize = "100px"; // reset to known baseline before measuring
  const textWidth = text.scrollWidth; // includes letter-spacing automatically — no manual math needed
  if (textWidth === 0) return;

  const newSize = 100 * (availableWidth / textWidth) * 0.99; // tiny safety margin only
  text.style.fontSize = newSize + "px";
}

function initFit() {
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      requestAnimationFrame(fitBrandText); // ensure layout has settled post-font-swap
    });
  } else {
    fitBrandText();
  }
}

document.addEventListener("DOMContentLoaded", initFit);
window.addEventListener("resize", fitBrandText);
window.addEventListener("load", fitBrandText);
setTimeout(fitBrandText, 300); // catch any late font swap stragglers

///slider
const slider = document.querySelector(".services__grid");
const fill = document.getElementById("sliderFill");

if (slider && fill) {
  slider.addEventListener("scroll", () => {
    const max = slider.scrollWidth - slider.clientWidth;
    const progress = slider.scrollLeft / max;
    const maxTranslate = (100 / 33.33) * 100 - 100;
    fill.style.transform = `translateX(${progress * maxTranslate}%)`;
  });
}

//the retreat
// ── ANCHOR LINKS (SMOOTH SCROLL TO SECTION) ──
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (e) => {
    const id = link.getAttribute("href").slice(1);
    if (!id) return; // ignore placeholder href="#" links elsewhere on the site
    const target = document.getElementById(id);
    if (!target) return;

    e.preventDefault();
    if (lenis) {
      lenis.scrollTo(target, { duration: 1.5 });
    } else {
      target.scrollIntoView({ behavior: "smooth" });
    }
  });
});

// ── SITE REVEAL ──
(function () {
  const overlay = document.getElementById("siteReveal");
  const logo = document.getElementById("siteReveal__logo");
  if (!overlay || !logo) return;

  document.body.classList.add("reveal-active");

  // Logo fades in
  setTimeout(() => logo.classList.add("visible"), 150);

  // Logo exits
  setTimeout(() => logo.classList.add("exit"), 900);

  // Curtain slides up
  setTimeout(() => overlay.classList.add("curtain-up"), 1150);

  // Unlock scroll + remove
  setTimeout(() => {
    document.body.classList.remove("reveal-active");
    overlay.remove();
  }, 1900);
})();

// video sound
// ── HERO SOUND TOGGLE ──
(function () {
  const toggleBtn = document.getElementById("heroSoundToggle");
  const mobileVideo = document.getElementById("heroMobileVideo");
  const desktopVideo = document.getElementById("heroDesktopVideo");
  if (!toggleBtn) return;

  let muted = true;

  toggleBtn.addEventListener("click", () => {
    muted = !muted;
    toggleBtn.classList.toggle("is-on", !muted);

    if (mobileVideo) mobileVideo.muted = muted;
    if (desktopVideo) desktopVideo.muted = muted;
  });
})();

/// ── SMART NAV: HIDE ON SCROLL DOWN, SHOW ON SCROLL UP ──
(function () {
  const logo = document.getElementById("heroLogo");
  const nav = document.getElementById("heroNav");
  if (!logo || !nav) return;

  let lastScrollY = window.scrollY;
  let hidden = false;
  const REVEAL_ZONE = 80; // px from top — always show nav in this zone
  const SCROLL_BUFFER = 6; // ignore tiny scroll jitters

  function setHidden(next) {
    if (next === hidden) return;
    hidden = next;
    logo.classList.toggle("is-hidden", hidden);
    nav.classList.toggle("is-hidden", hidden);
  }

  function updateNavVisibility() {
    if (window.innerWidth <= 768) {
      // Mobile: hamburger/menu CSS handles everything, nav stays visible
      setHidden(false);
      lastScrollY = window.scrollY;
      return;
    }

    const currentY = window.scrollY;
    const delta = currentY - lastScrollY;

    if (currentY <= REVEAL_ZONE) {
      setHidden(false);
    } else if (Math.abs(delta) > SCROLL_BUFFER) {
      setHidden(delta > 0); // scrolling down → hide, scrolling up → show
    }

    lastScrollY = currentY;
  }

  window.addEventListener(
    "scroll",
    () => requestAnimationFrame(updateNavVisibility),
    { passive: true },
  );
  window.addEventListener("resize", updateNavVisibility);
  updateNavVisibility();
})();

// ── LUXURY CAROUSEL (reusable) ──
function initLuxCarousel({
  trackId,
  carouselId,
  prevId,
  nextId,
  images,
  startIndex = 0,
}) {
  const track = document.getElementById(trackId);
  const carousel = document.getElementById(carouselId);
  const prevBtn = document.getElementById(prevId);
  const nextBtn = document.getElementById(nextId);
  if (!track || !carousel || !prevBtn || !nextBtn) return;

  const n = images.length;
  let activeIndex = startIndex;
  let slides = [];

  images.forEach((item, i) => {
    const slide = document.createElement("div");
    slide.className = "lux-slide";
    slide.dataset.index = i;
    slide.innerHTML = `
      <div class="lux-slide__inner">
        <img class="lux-slide__img" src="${item.src}" alt="${item.title}" loading="lazy" />
        <div class="lux-slide__overlay"></div>
        <div class="lux-slide__caption"><span class="lux-slide__dot"></span>${item.title}</div>
      </div>
    `;
    slide.addEventListener("click", () => {
      if (parseInt(slide.dataset.index, 10) !== activeIndex) {
        goTo(parseInt(slide.dataset.index, 10));
      }
    });
    track.appendChild(slide);
    slides.push(slide);
  });

  function getPeek() {
    const w = window.innerWidth;
    if (w <= 576) return 0;
    if (w <= 900) return 13;
    return 20;
  }

  function layout() {
    const peek = getPeek();

    slides.forEach((slide, i) => {
      let diff = i - activeIndex;
      if (diff > n / 2) diff -= n;
      if (diff < -n / 2) diff += n;
      const absDiff = Math.abs(diff);

      let left, width;
      if (diff === 0) {
        left = peek;
        width = 100 - peek * 2;
      } else if (diff > 0) {
        left = 100 - peek + peek * (diff - 1);
        width = peek;
      } else {
        left = -peek * (Math.abs(diff) - 1);
        width = peek;
      }

      const visible = (absDiff <= 1 && peek > 0) || diff === 0;

      slide.style.left = left + "%";
      slide.style.width = width + "%";
      slide.style.opacity = visible ? "1" : "0";
      slide.style.zIndex = diff === 0 ? 3 : absDiff === 1 ? 2 : 1;
      slide.style.pointerEvents = visible ? "auto" : "none";
      slide.classList.toggle("is-active", diff === 0);

      const img = slide.querySelector(".lux-slide__img");
      if (img) {
        img.style.objectPosition = diff === 0 ? "center" : "right center";
      }
    });
  }

  function goTo(index) {
    activeIndex = ((index % n) + n) % n;
    layout();
  }
  function next() {
    goTo(activeIndex + 1);
  }
  function prev() {
    goTo(activeIndex - 1);
  }

  nextBtn.addEventListener("click", () => {
    next();
    resetAutoplay();
  });
  prevBtn.addEventListener("click", () => {
    prev();
    resetAutoplay();
  });

  window.addEventListener("resize", layout);

  carousel.setAttribute("tabindex", "0");
  carousel.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") {
      next();
      resetAutoplay();
    }
    if (e.key === "ArrowLeft") {
      prev();
      resetAutoplay();
    }
  });

  let touchStartX = 0;
  carousel.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.touches[0].clientX;
    },
    { passive: true },
  );
  carousel.addEventListener(
    "touchend",
    (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 40) {
        dx < 0 ? next() : prev();
        resetAutoplay();
      }
    },
    { passive: true },
  );

  let autoplayTimer = null;
  function startAutoplay() {
    autoplayTimer = setInterval(next, 5000);
  }
  function resetAutoplay() {
    clearInterval(autoplayTimer);
    startAutoplay();
  }
  carousel.addEventListener("mouseenter", () => clearInterval(autoplayTimer));
  carousel.addEventListener("mouseleave", startAutoplay);

  layout();
  startAutoplay();
}

// ── Instance 1: existing house carousel ──
initLuxCarousel({
  trackId: "luxTrack",
  carouselId: "luxCarousel",
  prevId: "luxPrev",
  nextId: "luxNext",
  startIndex: 2, // starts on "The Entrance"
  images: [
    {
      title: "Kitchen",
      src: "https://picsum.photos/seed/vv-kitchen/1600/1000",
    },
    {
      title: "King Bedroom",
      src: "https://picsum.photos/seed/vv-king-bedroom/1600/1000",
    },
    {
      title: "The Entrance",
      src: "https://picsum.photos/seed/vv-entrance/1600/1000",
    },
    {
      title: "Hot Tub",
      src: "https://picsum.photos/seed/vv-hot-tub/1600/1000",
    },
    {
      title: "Indoor Pool",
      src: "https://picsum.photos/seed/vv-indoor-pool/1600/1000",
    },
    {
      title: "Downstairs Bedroom",
      src: "https://picsum.photos/seed/vv-downstairs-bedroom/1600/1000",
    },
    {
      title: "Living Area",
      src: "https://picsum.photos/seed/vv-living-area/1600/1000",
    },
  ],
});

// ── Instance 2: suite/stables carousel ──
initLuxCarousel({
  trackId: "luxTrack2",
  carouselId: "luxCarousel2",
  prevId: "luxPrev2",
  nextId: "luxNext2",
  startIndex: 0,
  images: [
    {
      title: "The Executive Suite",
      src: "https://picsum.photos/seed/vv-executive-suite/1600/1000",
    },
    {
      title: "Sea View Room from the Lounge",
      src: "https://picsum.photos/seed/vv-sea-view-lounge/1600/1000",
    },
    {
      title: "Loft Style Bedroom",
      src: "https://picsum.photos/seed/vv-loft-bedroom/1600/1000",
    },
    {
      title: "Cozy Lounge with View",
      src: "https://picsum.photos/seed/vv-cozy-lounge/1600/1000",
    },
    {
      title: "Equipped Kitchenette",
      src: "https://picsum.photos/seed/vv-kitchenette/1600/1000",
    },
    {
      title: "Mezzanine Bedroom",
      src: "https://picsum.photos/seed/vv-mezzanine-bedroom/1600/1000",
    },
  ],
});

// ── ROOMS SHOWCASE (crossfade + active dot) ──
(function () {
  const nav = document.getElementById("roomsNav");
  const titleEl = document.getElementById("roomsTitle");
  const bgA = document.getElementById("roomsBgA");
  const bgB = document.getElementById("roomsBgB");
  if (!nav || !titleEl || !bgA || !bgB) return;

  const ROOMS = [
    {
      label: "Indoor Pool",
      title: "<em>Unwind</em> in the warmth<br />of the indoor heated pool",
      src: "https://picsum.photos/seed/vv-indoor-pool/1900/1000",
    },
    {
      label: "Hot Tub",
      title: "<em>Soak</em> beneath the stars<br />in the private hot tub",
      src: "https://picsum.photos/seed/vv-hot-tub-showcase/1900/1000",
    },
    {
      label: "Bedroom",
      title: "<em>Rest</em> easy in rooms<br />built for quiet mornings",
      src: "https://picsum.photos/seed/vv-bedroom-showcase/1900/1000",
    },
    {
      label: "Kitchen",
      title: "<em>Gather</em> around the table<br />in the heart of the house",
      src: "https://picsum.photos/seed/vv-kitchen-showcase/1900/1000",
    },
    {
      label: "Living Room",
      title: "<em>Settle</em> into the warmth<br />of the living room",
      src: "https://picsum.photos/seed/vv-living-showcase/1900/1000",
    },
    {
      label: "Media Room",
      title: "<em>Wind</em> down with a film<br />in the media room",
      src: "https://picsum.photos/seed/vv-media-showcase/1900/1000",
    },
  ];

  const items = Array.from(nav.querySelectorAll(".rooms-section__item"));
  let activeIndex = 0;
  let showingA = true; // tracks which <img> layer is currently on top

  function goTo(index) {
    if (index === activeIndex) return;
    const room = ROOMS[index];

    // fade the title text out/in
    titleEl.style.opacity = "0";
    setTimeout(() => {
      titleEl.innerHTML = room.title;
      titleEl.style.opacity = "1";
    }, 250);

    // crossfade: load new image into the hidden layer, then swap
    const nextLayer = showingA ? bgB : bgA;
    const currentLayer = showingA ? bgA : bgB;

    nextLayer.src = room.src;
    nextLayer.onload = () => {
      nextLayer.classList.add("rooms-section__bg--active");
      currentLayer.classList.remove("rooms-section__bg--active");
      showingA = !showingA;
    };

    // update active states
    items.forEach((item, i) => {
      item.classList.toggle("is-active", i === index);
    });

    activeIndex = index;
  }

  items.forEach((item) => {
    item.addEventListener("click", () => {
      const index = parseInt(item.dataset.room, 10);
      goTo(index);
    });
  });
})();

(function () {
  const img = document.getElementById("kitchenImg");
  const wrap = img ? img.closest(".kitchen-section__media") : null;
  const sideImg = document.getElementById("kitchenSideImg");
  const sideWrap = sideImg ? sideImg.closest(".kitchen-section__side") : null;
  const content = document.getElementById("kitchenContent");

  if (!wrap && !sideWrap && !content) return;

  function update() {
    const isMobile = window.innerWidth <= 768;

    if (wrap && img) {
      const rect = wrap.getBoundingClientRect();
      const total = window.innerHeight + wrap.offsetHeight;
      const scrolled = window.innerHeight - rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / total));
      img.style.transform = `translateY(${(progress - 0.5) * 80}px)`;

      if (content) {
        content.style.transform = isMobile
          ? "none"
          : `translateY(${(progress - 0.5) * -25}px)`;
      }
    }
    if (sideWrap && sideImg) {
      const rect = sideWrap.getBoundingClientRect();
      const total = window.innerHeight + sideWrap.offsetHeight;
      const scrolled = window.innerHeight - rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / total));
      sideImg.style.transform = `translateY(${(progress - 0.5) * 60}px)`;
    }
  }

  window.addEventListener("scroll", () => requestAnimationFrame(update), {
    passive: true,
  });
  update();
})();

(function () {
  const img = document.getElementById("kitchenImg");
  const wrap = img ? img.closest(".kitchen-section__media") : null;
  const sideImg = document.getElementById("kitchenSideImg");
  const sideWrap = sideImg ? sideImg.closest(".kitchen-section__side") : null;
  const content = document.getElementById("kitchenContent");

  if (!wrap && !sideWrap && !content) return;

  function update() {
    const isMobile = window.innerWidth <= 768;

    if (wrap && img) {
      const rect = wrap.getBoundingClientRect();
      const total = window.innerHeight + wrap.offsetHeight;
      const scrolled = window.innerHeight - rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / total));
      img.style.transform = `translateY(${(progress - 0.5) * 100}px)`;

      if (content) {
        content.style.transform = isMobile
          ? "none"
          : `translateY(${(progress - 0.5) * -25}px)`;
      }
    }
    if (sideWrap && sideImg) {
      const rect = sideWrap.getBoundingClientRect();
      const total = window.innerHeight + sideWrap.offsetHeight;
      const scrolled = window.innerHeight - rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / total));
      sideImg.style.transform = `translateY(${(progress - 0.5) * 60}px)`;
    }
  }

  window.addEventListener("scroll", () => requestAnimationFrame(update), {
    passive: true,
  });
  update();
})();

// ── BOOK YOUR STAY: TEXT REVEAL + PARALLAX ──
(function () {
  const line = document.getElementById("bookLine1");
  const section = document.getElementById("bookSection");
  const img = document.getElementById("bookImg");
  const cta = document.getElementById("bookCta");
  if (!line || !section) return;

  const ITALIC_PART = "Book ";
  const PLAIN_PART = "your stay";

  function buildChars(el, text, isItalic) {
    text.split("").forEach((ch) => {
      const s = document.createElement("span");
      s.className = "quote-char" + (isItalic ? " quote-char--italic" : "");
      s.innerHTML = ch === " " ? "&nbsp;" : ch;
      el.appendChild(s);
    });
  }

  buildChars(line, ITALIC_PART, true);
  buildChars(line, PLAIN_PART, false);

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  function revealLine(lineEl, startDelay, charDelay, onDone) {
    const chars = lineEl.querySelectorAll(".quote-char");
    chars.forEach((ch, i) => {
      setTimeout(
        () => ch.classList.add("revealed"),
        startDelay + i * charDelay,
      );
    });
    if (onDone) {
      setTimeout(onDone, startDelay + chars.length * charDelay + 200);
    }
  }

  let hasAnimated = false;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !hasAnimated) {
          hasAnimated = true;
          if (prefersReducedMotion) {
            line
              .querySelectorAll(".quote-char")
              .forEach((c) => c.classList.add("revealed"));
            if (cta) cta.classList.add("is-visible");
          } else {
            revealLine(line, 200, 48, () => {
              if (cta) cta.classList.add("is-visible");
            });
          }
          observer.disconnect();
        }
      });
    },
    { threshold: 0.35 },
  );

  observer.observe(section);

  // Parallax on background image
  if (img) {
    function updateParallax() {
      const rect = section.getBoundingClientRect();
      const total = window.innerHeight + section.offsetHeight;
      const scrolled = window.innerHeight - rect.top;
      const progress = scrolled / total;
      const offset = (progress - 0.5) * 200;
      img.style.transform = `translateY(${offset}px)`;
    }
    window.addEventListener(
      "scroll",
      () => requestAnimationFrame(updateParallax),
      { passive: true },
    );
    updateParallax();
  }
})();

// ── BEACH SECTION PARALLAX (both images, independent) ──
(function () {
  function setupParallax(imgId, wrapSelector, intensity) {
    const img = document.getElementById(imgId);
    const wrap = img ? img.closest(wrapSelector) : null;
    if (!img || !wrap) return;

    function update() {
      const rect = wrap.getBoundingClientRect();
      const total = window.innerHeight + wrap.offsetHeight;
      const scrolled = window.innerHeight - rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / total));
      const offset = (progress - 0.5) * intensity;
      img.style.transform = `translateY(${offset}px)`;
    }

    window.addEventListener("scroll", () => requestAnimationFrame(update), {
      passive: true,
    });
    window.addEventListener("resize", () => requestAnimationFrame(update));
    update();
  }

  setupParallax("beachImgLeft", ".beach-section__media-left", 120);
  setupParallax("beachImgSmall", ".beach-section__media-small", 60);
})();

// ── Instance 3: farm carousel ──
initLuxCarousel({
  trackId: "luxTrack3",
  carouselId: "luxCarousel3",
  prevId: "luxPrev3",
  nextId: "luxNext3",
  startIndex: 0,
  images: [
    {
      title: "The Grounds",
      src: "https://picsum.photos/seed/vv-farm-grounds/1600/1000",
    },
    {
      title: "Cattle Enjoying the Views",
      src: "https://picsum.photos/seed/vv-farm-cattle/1600/1000",
    },
    {
      title: "The Estate",
      src: "https://picsum.photos/seed/vv-farm-estate/1600/1000",
    },
    {
      title: "Permaculture",
      src: "https://picsum.photos/seed/vv-farm-permaculture/1600/1000",
    },
  ],
});

// ── HECTARES SECTION PARALLAX ──
(function () {
  const img = document.getElementById("hectaresImg");
  const wrap = img ? img.closest(".hectares-section__media") : null;
  if (!img || !wrap) return;

  function update() {
    const rect = wrap.getBoundingClientRect();
    const total = window.innerHeight + wrap.offsetHeight;
    const scrolled = window.innerHeight - rect.top;
    const progress = Math.max(0, Math.min(1, scrolled / total));
    const offset = (progress - 0.5) * 80;
    img.style.transform = `translateY(${offset}px)`;
  }

  window.addEventListener("scroll", () => requestAnimationFrame(update), {
    passive: true,
  });
  window.addEventListener("resize", () => requestAnimationFrame(update));
  update();
})();

// ── LAND BACK SECTION PARALLAX (both images, independent) ──
(function () {
  function setupParallax(imgId, wrapSelector, intensity) {
    const img = document.getElementById(imgId);
    const wrap = img ? img.closest(wrapSelector) : null;
    if (!img || !wrap) return;

    function update() {
      const rect = wrap.getBoundingClientRect();
      const total = window.innerHeight + wrap.offsetHeight;
      const scrolled = window.innerHeight - rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / total));
      const offset = (progress - 0.5) * intensity;
      img.style.transform = `translateY(${offset}px)`;
    }

    window.addEventListener("scroll", () => requestAnimationFrame(update), {
      passive: true,
    });
    window.addEventListener("resize", () => requestAnimationFrame(update));
    update();
  }

  setupParallax("landBackImgLarge", ".land-back-section__media-large", 100);
  setupParallax("landBackImgSmall", ".land-back-section__media-small", 50);
})();

// ── Parallax effect for [data-parallax] elements ──
(function () {
  const parallaxEls = document.querySelectorAll("[data-parallax]");
  if (!parallaxEls.length) return;

  function updateParallax() {
    const viewportH = window.innerHeight;

    parallaxEls.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const speed = parseFloat(el.dataset.parallaxSpeed) || 0.1;

      // progress: -1 (element bottom at viewport top) to 1 (element top at viewport bottom)
      const elCenter = rect.top + rect.height / 2;
      const progress = (elCenter - viewportH / 2) / viewportH;

      const offset = progress * speed * 100; // percentage
      const img = el.querySelector(".cover-image");
      if (img) {
        img.style.transform = `translate3d(0px, ${offset}%, 0px)`;
      }
    });

    requestAnimationFrame(updateParallax);
  }

  requestAnimationFrame(updateParallax);
})();

// ── FAQ Accordion ──
(function () {
  const faqButtons = document.querySelectorAll(".faq__question");

  faqButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".faq__item");
      const answer = item.querySelector(".faq__answer");
      const isOpen = btn.getAttribute("aria-expanded") === "true";

      // close all other open items (accordion behavior — remove this loop for multi-open)
      faqButtons.forEach((otherBtn) => {
        if (otherBtn !== btn) {
          otherBtn.setAttribute("aria-expanded", "false");
          otherBtn
            .closest(".faq__item")
            .querySelector(".faq__answer").style.maxHeight = null;
        }
      });

      if (isOpen) {
        btn.setAttribute("aria-expanded", "false");
        answer.style.maxHeight = null;
      } else {
        btn.setAttribute("aria-expanded", "true");
        answer.style.maxHeight = answer.scrollHeight + "px";
      }
    });
  });
})();

// ── ENQUIRY SECTION: TEXT REVEAL + PARALLAX ──
(function () {
  const line = document.getElementById("enquiryLine1");
  const section = document.getElementById("enquirySection");
  const img = document.getElementById("enquiryImg");
  const subtext = document.getElementById("enquirySubtext");
  const cta = document.getElementById("enquiryCta");
  if (!line || !section) return;

  const ITALIC_PART = "Tell us ";
  const PLAIN_PART = "what you're planning";

  function buildChars(el, text, isItalic) {
    text.split("").forEach((ch) => {
      const s = document.createElement("span");
      s.className = "quote-char" + (isItalic ? " quote-char--italic" : "");
      s.innerHTML = ch === " " ? "&nbsp;" : ch;
      el.appendChild(s);
    });
  }

  buildChars(line, ITALIC_PART, true);
  buildChars(line, PLAIN_PART, false);

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  function revealLine(lineEl, startDelay, charDelay, onDone) {
    const chars = lineEl.querySelectorAll(".quote-char");
    chars.forEach((ch, i) => {
      setTimeout(
        () => ch.classList.add("revealed"),
        startDelay + i * charDelay,
      );
    });
    if (onDone) {
      setTimeout(onDone, startDelay + chars.length * charDelay + 200);
    }
  }

  let hasAnimated = false;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !hasAnimated) {
          hasAnimated = true;
          if (prefersReducedMotion) {
            line
              .querySelectorAll(".quote-char")
              .forEach((c) => c.classList.add("revealed"));
            if (subtext) subtext.classList.add("is-visible");
            if (cta) cta.classList.add("is-visible");
          } else {
            revealLine(line, 200, 42, () => {
              if (subtext) subtext.classList.add("is-visible");
              setTimeout(() => {
                if (cta) cta.classList.add("is-visible");
              }, 200);
            });
          }
          observer.disconnect();
        }
      });
    },
    { threshold: 0.35 },
  );

  observer.observe(section);

  // Parallax on background image (same pattern as book-section)
  if (img) {
    function updateParallax() {
      const rect = section.getBoundingClientRect();
      const total = window.innerHeight + section.offsetHeight;
      const scrolled = window.innerHeight - rect.top;
      const progress = scrolled / total;
      const offset = (progress - 0.5) * 200;
      img.style.transform = `translateY(${offset}px)`;
    }
    window.addEventListener(
      "scroll",
      () => requestAnimationFrame(updateParallax),
      { passive: true },
    );
    updateParallax();
  }
})();

// ── CONTACT FORM: validation + submit handling ──
(function () {
  const form = document.getElementById("contactForm");
  const submitBtn = document.getElementById("contactSubmit");
  const statusEl = document.getElementById("contactStatus");
  if (!form) return;

  const fields = {
    firstName: {
      el: document.getElementById("firstName"),
      label: "First name",
    },
    lastName: { el: document.getElementById("lastName"), label: "Last name" },
    email: { el: document.getElementById("email"), label: "Email" },
    phone: { el: document.getElementById("phone"), label: "Phone" },
    message: { el: document.getElementById("message"), label: "Message" },
  };

  function showError(key, msg) {
    const field = fields[key];
    const wrapper = field.el.closest(".contact-form__field");
    wrapper.classList.add("has-error");
    wrapper.querySelector(".contact-form__error").textContent = msg;
  }

  function clearError(key) {
    const field = fields[key];
    const wrapper = field.el.closest(".contact-form__field");
    wrapper.classList.remove("has-error");
    wrapper.querySelector(".contact-form__error").textContent = "";
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function validate() {
    let valid = true;

    Object.keys(fields).forEach((key) => {
      const value = fields[key].el.value.trim();
      clearError(key);

      if (!value) {
        showError(key, `${fields[key].label} is required`);
        valid = false;
      } else if (key === "email" && !isValidEmail(value)) {
        showError(key, "Enter a valid email address");
        valid = false;
      }
    });

    return valid;
  }

  // clear individual field error as the person types
  Object.keys(fields).forEach((key) => {
    fields[key].el.addEventListener("input", () => clearError(key));
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    statusEl.textContent = "";
    statusEl.className = "contact-form__status";

    if (!validate()) {
      statusEl.textContent = "Please fix the errors above.";
      statusEl.classList.add("is-error");
      return;
    }

    // ── Hook this up to your real form backend / email service ──
    // Example placeholder submit (replace with actual fetch to your endpoint):
    submitBtn.disabled = true;
    submitBtn.querySelector("span") && (submitBtn.innerHTML = "SENDING…");

    setTimeout(() => {
      // Simulated success — swap this block for a real fetch() call, e.g.:
      // fetch('/api/contact', { method: 'POST', body: new FormData(form) })
      //   .then(res => res.ok ? onSuccess() : onError())
      //   .catch(onError);

      statusEl.textContent = "Thanks — we'll be in touch shortly.";
      statusEl.classList.add("is-success");
      form.reset();
      submitBtn.disabled = false;
      submitBtn.innerHTML =
        'SUBMIT <span class="contact-form__submit-arrow">→</span>';
    }, 800);
  });
})();

// ── PAGE HERO TITLE REVEAL (bottom-left inner pages) ──
function revealPageHeroTitle() {
  const title = document.querySelector(".page-hero__title");
  if (!title) return;

  requestAnimationFrame(() => {
    title.classList.add("is-visible");
  });
}

(function () {
  const SITE_REVEAL_DURATION = 1900; // must match the site reveal timeout below

  Promise.resolve(document.fonts ? document.fonts.ready : null).then(() => {
    const elapsed = performance.now();
    const remaining = Math.max(0, SITE_REVEAL_DURATION - elapsed);
    setTimeout(revealPageHeroTitle, remaining);
  });
})();

// ── HIGHLIGHT CURRENT PAGE IN NAV ──
(function () {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  document
    .querySelectorAll(".hero__nav a, .hero__mobile-menu a")
    .forEach((link) => {
      const linkPage = link.getAttribute("href");
      if (linkPage === currentPage) {
        link.classList.add("nav--gold");
      }
    });
})();
