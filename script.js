const root = document.documentElement;
const cursorLight = document.querySelector(".cursor-light");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(pointer: fine)").matches;

if (cursorLight && finePointer) {
  window.addEventListener("pointermove", (event) => {
    root.style.setProperty("--x", `${event.clientX}px`);
    root.style.setProperty("--y", `${event.clientY}px`);
  });
}

const revealItems = document.querySelectorAll("[data-reveal]");
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.04, rootMargin: "0px 0px -8% 0px" }
);

revealItems.forEach((item, index) => {
  item.style.transitionDelay = `${Math.min(index * 42, 260)}ms`;
  revealObserver.observe(item);
});

const ticker = document.querySelector(".ticker-track");
if (ticker) {
  ticker.innerHTML += ticker.innerHTML;
}

const stage = document.querySelector(".hero-stage");
if (stage && finePointer && !reduceMotion) {
  stage.addEventListener("pointermove", (event) => {
    const rect = stage.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    stage.style.setProperty("--stage-rx", `${y * -3}deg`);
    stage.style.setProperty("--stage-ry", `${x * 4}deg`);
  });

  stage.addEventListener("pointerleave", () => {
    stage.style.setProperty("--stage-rx", "0deg");
    stage.style.setProperty("--stage-ry", "0deg");
  });
}

const motionTracks = [...document.querySelectorAll(".motion-track")];
const screenCards = [...document.querySelectorAll(".screen-card")];
const heroSection = document.querySelector(".hero-section");
const motionSection = document.querySelector(".motion-section");
const motionFocus = document.querySelector(".motion-focus");
const titleMain = document.querySelector(".title-main");
const titleSub = document.querySelector(".title-sub");
const lead = document.querySelector(".lead");
const heroActions = document.querySelector(".hero-actions");
const heroStats = document.querySelector(".hero-stats");
const motionSticky = document.querySelector(".motion-sticky");
const kineticItems = [
  ...document.querySelectorAll(".sound-board, .shot, .social-tile, .review-card"),
];
const trackState = new WeakMap();

kineticItems.forEach((item, index) => {
  item.dataset.kineticIndex = String(index);
});

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function easeOut(value) {
  return 1 - Math.pow(1 - clamp(value), 3);
}

function centerPop(rect, viewport) {
  const center = rect.top + rect.height / 2;
  const distance = Math.abs(center - viewport * 0.52);
  const range = viewport * 0.58;
  return easeOut(1 - distance / range);
}

function screenCardPop(rect, viewport, width) {
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const x = Math.abs(centerX - width * 0.5) / (width * 0.58);
  const y = Math.abs(centerY - viewport * 0.58) / (viewport * 0.64);
  return easeOut(1 - Math.hypot(x * 0.92, y * 0.62));
}

function signedCenter(rect, viewport) {
  const center = rect.top + rect.height / 2;
  return clamp((viewport * 0.52 - center) / viewport, -1, 1);
}

let frameId = 0;

function updateMotion() {
  frameId = 0;
  if (reduceMotion) return;

  const viewport = window.innerHeight || 1;
  const viewportWidth = window.innerWidth || 1;
  const pageY = window.scrollY || window.pageYOffset || 0;
  const mobile = window.matchMedia("(max-width: 720px)").matches;
  let keepFollowing = false;

  if (heroSection) {
    const heroProgress = clamp(pageY / Math.max(heroSection.offsetHeight, viewport));
    const lift = heroProgress * -54;

    if (titleMain) {
      titleMain.style.transform = `translate3d(0, ${heroProgress * 22}px, 0) scale(${1 - heroProgress * 0.035})`;
    }

    if (titleSub) {
      titleSub.style.transform = `translate3d(${heroProgress * -10}px, ${heroProgress * -8}px, 0)`;
    }

    if (lead) {
      lead.style.transform = `translate3d(0, ${heroProgress * -16}px, 0)`;
    }

    if (heroActions) {
      heroActions.style.transform = `translate3d(0, ${heroProgress * -22}px, 0)`;
    }

    if (heroStats) {
      heroStats.style.transform = `translate3d(0, ${heroProgress * -30}px, 0)`;
    }

    if (stage) {
      stage.style.setProperty("--stage-y", `${lift}px`);
      stage.style.setProperty("--stage-scale", `${1 + heroProgress * 0.028}`);
    }
  }

  if (motionSticky) {
    const rect = motionSticky.getBoundingClientRect();
    const local = clamp((viewport - rect.top) / Math.max(rect.height + viewport, 1));
    motionSticky.style.setProperty("--mx", `${28 + local * 56}%`);
    motionSticky.style.setProperty("--my", `${34 + Math.sin(local * Math.PI) * 20}%`);
  }

  if (motionSection && motionFocus) {
    const rect = motionSection.getBoundingClientRect();
    const progress = clamp((viewport - rect.top) / Math.max(rect.height, viewport));
    motionFocus.style.setProperty("--focus-y", `${Math.sin(progress * Math.PI) * -34}px`);
    motionFocus.style.setProperty("--focus-scale", `${0.96 + Math.sin(progress * Math.PI) * 0.08}`);
  }

  motionTracks.forEach((track) => {
    const section = track.closest(".motion-section");
    if (!section) return;

    const rect = section.getBoundingClientRect();
    const progress = clamp((viewport - rect.top) / Math.max(rect.height, viewport));
    const speed = Number(track.dataset.scrollSpeed || 0.2);
    const travel = mobile
      ? Math.min(window.innerWidth * 1.28, 620)
      : Math.min(window.innerWidth * 1.18, 1100);
    const base = track.classList.contains("reverse")
      ? (mobile ? -window.innerWidth * 0.24 : -window.innerWidth * 0.34)
      : (mobile ? window.innerWidth * 0.06 : window.innerWidth * 0.18);
    const target = base - progress * travel * speed;
    const state = trackState.get(track) || { x: target };
    const follow = mobile ? 0.62 : 0.46;

    state.x += (target - state.x) * follow;
    if (Math.abs(target - state.x) > 0.35) keepFollowing = true;
    trackState.set(track, state);
    track.style.setProperty("--track-x", `${state.x.toFixed(2)}px`);
  });

  screenCards.forEach((card) => {
    const rect = card.getBoundingClientRect();
    if (rect.bottom < -viewport * 0.25 || rect.top > viewport * 1.25) return;

    const pop = screenCardPop(rect, viewport, viewportWidth);
    card.style.setProperty("--pop", pop.toFixed(3));
    card.style.zIndex = pop > 0.52 ? String(20 + Math.round(pop * 10)) : "";
    card.classList.toggle("is-pop", pop > 0.48);
  });

  kineticItems.forEach((item) => {
    const rect = item.getBoundingClientRect();
    if (rect.bottom < -viewport * 0.25 || rect.top > viewport * 1.25) return;

    const pop = centerPop(rect, viewport);
    const signed = signedCenter(rect, viewport);
    const index = Number(item.dataset.kineticIndex || 0);
    const direction = index % 2 === 0 ? 1 : -1;
    const side = signed * direction * (mobile ? 10 : 16);
    const lift = pop * (mobile ? -18 : -25);
    const rotate = signed * direction * (mobile ? 0.9 : 1.35);
    const scale = 1 + pop * (mobile ? 0.045 : 0.065);

    item.style.transform = `translate3d(${side.toFixed(2)}px, ${lift.toFixed(2)}px, 0) rotate(${rotate.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
    item.style.setProperty("--shine", pop.toFixed(3));
    item.style.zIndex = pop > 0.58 ? String(8 + Math.round(pop * 10)) : "";
    item.classList.toggle("is-pop", pop > 0.62);
  });

  if (keepFollowing) {
    frameId = requestAnimationFrame(updateMotion);
  }
}

function requestMotion() {
  if (frameId) return;
  frameId = requestAnimationFrame(updateMotion);
}

requestMotion();
window.addEventListener("scroll", requestMotion, { passive: true });
window.addEventListener("resize", requestMotion);
