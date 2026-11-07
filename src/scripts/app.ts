// @ts-nocheck
/* Osvaldo's portfolio: a night garden. Sketches light up into paintings as the firefly finds them,
   and every visitor plants a flower in the meadow at the end. */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin, MorphSVGPlugin);

const root = document.documentElement;
const calm = root.classList.contains("calm");
const R = JSON.parse(document.getElementById("runtime").textContent);
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
const store = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } };
const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
const rand = gsap.utils.random;
const narrow = () => matchMedia("(max-width: 760px)").matches;

/* ---------------- Smooth scroll (Lenis on GSAP's clock) ---------------- */
let lenis = null;
if (!calm) {
  lenis = new Lenis({ lerp: 0.1, anchors: { offset: -72 }, autoRaf: false });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ---------------- Theme ---------------- */
const toggle = $(".theme-toggle");
const isDark = () => root.getAttribute("data-theme") !== "light";
function syncToggle() {
  toggle.setAttribute("aria-pressed", String(isDark()));
  toggle.setAttribute("aria-label", isDark() ? R.toggles.toDay : R.toggles.toNight);
}
syncToggle();
toggle.addEventListener("click", () => {
  const next = isDark() ? "light" : "dark";
  const apply = () => { root.setAttribute("data-theme", next); store("theme", next); syncToggle(); };
  if (!document.startViewTransition || calm) return apply();
  const r = toggle.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  document.startViewTransition(apply).ready.then(() => {
    root.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      { duration: 800, easing: "cubic-bezier(0.16, 1, 0.3, 1)", pseudoElement: "::view-transition-new(root)" });
  }).catch(() => {});
});

/* ---------------- Header ---------------- */
const header = $(".site-header");
const onScroll = () => header.classList.toggle("is-scrolled", scrollY > innerHeight * 0.6);
addEventListener("scroll", onScroll, { passive: true });
lenis?.on("scroll", onScroll);
onScroll();

/* ---------------- Intro: random letters settle into my name ---------------- */
function introGrid() {
  if (calm) return Promise.resolve();
  try { if (sessionStorage.getItem("introSeen")) return Promise.resolve(); sessionStorage.setItem("introSeen", "1"); } catch (e) {}
  const NAME = "OSVALDO CASIMIRO", ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const pad = 4, cols = NAME.length + pad * 2, rows = 5, mid = 2;
  const el = document.createElement("div");
  el.className = "intro-grid"; el.setAttribute("aria-hidden", "true");
  const letters = [];
  for (let r = 0; r < rows; r++) {
    const row = document.createElement("div"); row.className = "row";
    for (let c = 0; c < cols; c++) {
      const s = document.createElement("span");
      const keep = r === mid && c >= pad && c < pad + NAME.length;
      s.textContent = keep ? NAME[c - pad] : ABC[Math.floor(Math.random() * 26)];
      if (keep) s.className = "keep"; else letters.push(s);
      if (keep && NAME[c - pad] === " ") s.innerHTML = "&nbsp;";
      row.appendChild(s);
    }
    el.appendChild(row);
  }
  document.body.appendChild(el);
  lenis?.stop();
  return new Promise((done) => {
    let shuffles = 0;
    const shuffle = setInterval(() => { letters.forEach((s) => (s.textContent = ABC[Math.floor(Math.random() * 26)])); if (++shuffles > 6) clearInterval(shuffle); }, 90);
    gsap.timeline({ delay: 0.25, onComplete: () => { el.remove(); lenis?.start(); done(); } })
      .from(".intro-grid .keep", { opacity: 0, duration: 0.5, stagger: 0.03 }, 0)
      .to(letters, { opacity: 0, duration: 0.5, stagger: { each: 0.006, from: "random" } }, 0.55)
      .to(".intro-grid .keep", { letterSpacing: "0.5em", duration: 0.8, ease: "expo.out" }, 0.7)
      .to(el, { opacity: 0, duration: 0.6, ease: "power2.inOut" }, 1.35);
  });
}

/* ---------------- Petals: they come loose in the light and tumble down ---------------- */
function dropPetal({ layer, x, y, size = rand(14, 22) }) {
  const p = document.createElement("span");
  p.className = "petal";
  p.style.width = size + "px"; p.style.height = size * 0.68 + "px";
  layer.appendChild(p);
  const endY = layer.clientHeight + 40;
  const dur = gsap.utils.clamp(2.4, 9, (endY - y) / (calm ? 160 : 80));
  const drift = rand(-60, 140);
  gsap.set(p, { x, y, rotation: rand(0, 360), opacity: 0 });
  const tl = gsap.timeline({ onComplete: () => p.remove() });
  tl.to(p, { opacity: 1, duration: 0.4 }, 0).to(p, { y: endY, duration: dur, ease: "sine.in" }, 0);
  if (calm) tl.to(p, { x: x + drift * 0.3, duration: dur, ease: "sine.inOut" }, 0);
  else tl.to(p, { keyframes: { x: [x, x + drift * 0.3 + 26, x + drift * 0.5 - 18, x + drift * 0.8 + 22, x + drift] }, duration: dur, ease: "none" }, 0)
    .to(p, { rotation: `+=${rand(160, 420)}`, rotationX: `+=${rand(360, 1080)}`, rotationY: `+=${rand(-180, 180)}`, duration: dur, ease: "none" }, 0);
  tl.to(p, { opacity: 0, duration: 0.8 }, dur - 0.8);
}

/* ---------------- Hero: the sketch lights up into the painting ---------------- */
const hero = $(".hero"), fx = $(".fx", hero), paint = $(".hero-paint"), sketch = $(".hero-sketch");
let heroVisible = true;
ScrollTrigger.create({ trigger: hero, start: "top bottom", end: "bottom top", onToggle: (s) => (heroVisible = s.isActive) });

// Floating bokeh and gold dust, drawn on one small canvas
(function bokeh() {
  const c = $(".bokeh"), ctx = c.getContext("2d");
  let w = 0, h = 0, parts = [];
  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    w = c.clientWidth; h = c.clientHeight; c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = narrow() ? 26 : 46;
    parts = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, r: Math.random() < 0.25 ? rand(6, 16) : rand(0.8, 2.2), vx: rand(-0.08, 0.12), vy: rand(-0.25, -0.05), a: rand(0.15, 0.7), ph: Math.random() * 6.28, pink: Math.random() < 0.3 }));
  };
  resize(); addEventListener("resize", resize);
  const draw = (t) => {
    ctx.clearRect(0, 0, w, h);
    for (const p of parts) {
      if (!calm) { p.x += p.vx; p.y += p.vy; if (p.y < -20) { p.y = h + 10; p.x = Math.random() * w; } }
      const a = p.a * (0.6 + 0.4 * Math.sin(t * 0.0012 + p.ph));
      const col = p.pink ? "255,190,205" : "255,214,150";
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2);
      g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 2, 0, 6.283); ctx.fill();
    }
  };
  if (calm) { draw(0); return; }
  gsap.ticker.add(() => { if (heroVisible && !document.hidden) draw(performance.now()); });
})();

// Petals fall through the beam on their own, and wherever you click
(function heroPetals() {
  const inBeam = () => {
    const w = fx.clientWidth, h = fx.clientHeight;
    return narrow() ? [rand(0.05, 0.45) * w, rand(0.3, 0.5) * h] : [rand(0.16, 0.36) * w, rand(-0.02, 0.25) * h];
  };
  hero.addEventListener("click", (e) => {
    if (e.target.closest("a, button, input")) return;
    const r = fx.getBoundingClientRect();
    for (let i = 0; i < 3; i++) dropPetal({ layer: fx, x: e.clientX - r.left + rand(-14, 14), y: e.clientY - r.top + rand(-10, 10) });
  });
  if (calm) return;
  (function loop() {
    if (heroVisible && !document.hidden) { const [x, y] = inBeam(); dropPetal({ layer: fx, x, y }); }
    gsap.delayedCall(rand(0.9, 2.2), loop);
  })();
})();

// Parallax: the painting leans toward the mouse and sinks as you scroll away
if (!calm) {
  const px = gsap.quickTo(".hero-depth", "x", { duration: 1.6, ease: "power3.out" });
  const py = gsap.quickTo(".hero-depth", "y", { duration: 1.6, ease: "power3.out" });
  const bx = gsap.quickTo(".beam", "x", { duration: 2, ease: "power3.out" });
  hero.addEventListener("pointermove", (e) => {
    const dx = e.clientX / innerWidth - 0.5, dy = e.clientY / innerHeight - 0.5;
    px(dx * -18); py(dy * -12); bx(dx * 26);
  });
  gsap.to(".hero-media", { yPercent: 16, scale: 1.04, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
  gsap.to(".hero-copy", { yPercent: -12, opacity: 0.2, ease: "none", scrollTrigger: { trigger: hero, start: "40% top", end: "bottom top", scrub: true } });
  gsap.fromTo(".beam", { opacity: 0.45 }, { opacity: 0.95, duration: 3.2, ease: "sine.inOut", yoyo: true, repeat: -1 });
}

function heroIntro() {
  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  if (calm) { tl.from(".hero-copy > *, .hero-hint", { opacity: 0, duration: 0.8, stagger: 0.06 }); return; }
  const split = SplitText.create(".hero-title", { type: "chars", charsClass: "char", aria: "auto" });
  gsap.set(sketch, { opacity: 1, clipPath: "inset(0% 100% 0% 0%)" });
  gsap.set(paint, { "--r": "0%" });
  tl.to(sketch, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, ease: "power2.inOut" }, 0)
    .to(paint, { "--r": "140%", duration: 2.6, ease: "power2.inOut" }, 0.9)
    .to(sketch, { opacity: 0.14, duration: 2, ease: "power1.inOut" }, 1.4)
    .from(".hero-hi", { opacity: 0, y: 12, duration: 1 }, 0.5)
    .from(split.chars, { opacity: 0, yPercent: 50, filter: "blur(10px)", duration: 1.4, stagger: 0.06 }, 0.6)
    .from(".hero-sub, .hero-actions, .hero-count", { opacity: 0, y: 16, duration: 1, stagger: 0.1 }, 1.1)
    .from(".hero-note", { opacity: 0, rotation: -14, scale: 0.8, duration: 1.2, ease: "back.out(2)" }, 1.8)
    .from(".hero-hint, .petal-hint", { opacity: 0, duration: 1.2 }, 2.2);
}

/* ---------------- The firefly that guides you ---------------- */
const ff = $(".firefly");
const lights = $$("[data-light]");
let ffTarget = hero;
function anchorOf(el) {
  const pick = (s) => { const n = $(s, el); return n ? n.getBoundingClientRect() : el.getBoundingClientRect(); };
  if (el === hero) { const r = hero.getBoundingClientRect(); return [r.left + r.width * (narrow() ? 0.3 : 0.26), r.top + r.height * (narrow() ? 0.62 : 0.32)]; }
  let r;
  if (el.id === "about") r = pick(".bloom");
  else if (el.id === "skills") r = pick(".bouquet");
  else if (el.id === "work") r = pick(".pressed");
  else if (el.id === "journey") { const lit = $$(".milestone.is-lit .bud", el).pop(); r = lit ? lit.getBoundingClientRect() : pick(".track"); }
  else if (el.classList.contains("story")) r = pick(".jar");
  else if (el.id === "your-turn") r = pick(".meadow");
  else r = el.getBoundingClientRect();
  return [r.left + r.width * 0.5, r.top + Math.min(r.height * 0.4, 160)];
}
function lightUp(el) {
  if (el.classList.contains("is-lit")) return;
  el.classList.add("is-lit");
  el.dispatchEvent(new CustomEvent("lit"));
}
if (calm) {
  lights.forEach(lightUp);
} else {
  const fxTo = gsap.quickTo(ff, "x", { duration: 1.3, ease: "power3.out" });
  const fyTo = gsap.quickTo(ff, "y", { duration: 1.3, ease: "power3.out" });
  let arrived = 0;
  gsap.ticker.add((time) => {
    if (document.hidden) return;
    let [x, y] = narrow() ? [innerWidth - 34, innerHeight - 110] : anchorOf(ffTarget);
    x = gsap.utils.clamp(24, innerWidth - 24, x) + Math.sin(time * 1.3) * 22 + Math.sin(time * 3.1) * 6;
    y = gsap.utils.clamp(80, innerHeight - 40, y) + Math.cos(time * 0.9) * 16;
    fxTo(x); fyTo(y);
    // Once the firefly has stayed near its section for a moment, the section lights up
    const cx = gsap.getProperty(ff, "x"), cy = gsap.getProperty(ff, "y");
    if (Math.hypot(cx - x, cy - y) < 70) { if (++arrived > 30) lightUp(ffTarget); } else arrived = 0;
  });
  lights.forEach((el) => ScrollTrigger.create({
    trigger: el, start: "top 62%", end: "bottom 38%",
    onToggle: (s) => { if (s.isActive) { ffTarget = el; arrived = 0; if (narrow()) gsap.delayedCall(0.6, () => lightUp(el)); } },
  }));
  gsap.set(ff, { x: innerWidth * 0.26, y: innerHeight * 0.3 });
}

/* ---------------- Night air: gold dust and falling petals over the whole page ---------------- */
(function ambient() {
  const c = $(".ambient");
  if (calm || !c) return;
  const ctx = c.getContext("2d");
  let w = 0, h = 0, motes = [], petals = [], lastY = scrollY, push = 0;
  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    w = innerWidth; h = innerHeight; c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const few = narrow();
    motes = Array.from({ length: few ? 22 : 48 }, () => ({ x: Math.random() * w, y: Math.random() * h, z: rand(0.3, 1), r: rand(0.6, 1.8), vy: rand(-0.12, -0.03), vx: rand(-0.05, 0.05), ph: Math.random() * 6.28, pink: Math.random() < 0.25 }));
    petals = Array.from({ length: few ? 5 : 11 }, () => newPetal(true));
  };
  function newPetal(anywhere) {
    return { x: rand(-0.1, 1) * w, y: anywhere ? Math.random() * h : -20, z: rand(0.5, 1), size: rand(7, 13), vx: rand(0.15, 0.55), vy: rand(0.35, 0.8), rot: rand(0, 6.28), spin: rand(-0.03, 0.03), flip: Math.random() * 6.28, ph: Math.random() * 6.28 };
  }
  resize(); addEventListener("resize", resize);
  gsap.ticker.add((time) => {
    if (document.hidden) return;
    // Scrolling stirs the air: everything drifts against the scroll, nearer things more
    const dy = scrollY - lastY; lastY = scrollY;
    push += (gsap.utils.clamp(-40, 40, dy) - push) * 0.15;
    const light = !isDark();
    ctx.clearRect(0, 0, w, h);
    for (const m of motes) {
      m.x += m.vx + Math.sin(time * 0.6 + m.ph) * 0.08; m.y += m.vy - push * 0.12 * m.z;
      if (m.y < -10) { m.y = h + 10; m.x = Math.random() * w; } if (m.y > h + 10) { m.y = -10; m.x = Math.random() * w; }
      const a = (0.25 + 0.55 * (0.5 + 0.5 * Math.sin(time * 1.6 + m.ph))) * m.z;
      const col = light ? (m.pink ? "196,96,124" : "196,130,50") : (m.pink ? "255,196,210" : "255,218,160");
      const rr = m.r * (1 + m.z) * 2.2;
      const g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, rr);
      g.addColorStop(0, `rgba(${col},${a * (light ? 0.6 : 1)})`); g.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(m.x, m.y, rr, 0, 6.283); ctx.fill();
    }
    for (let i = 0; i < petals.length; i++) {
      const p = petals[i];
      p.x += p.vx + Math.sin(time * 0.9 + p.ph) * 0.45; p.y += p.vy * p.z - push * 0.18 * p.z;
      p.rot += p.spin; p.flip += 0.035;
      if (p.y > h + 30 || p.x > w + 30 || p.y < -60) { petals[i] = newPetal(false); continue; }
      const sx = Math.max(0.15, Math.abs(Math.cos(p.flip))); // the petal tumbles, so it narrows and widens
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(sx, 1);
      ctx.globalAlpha = 0.75 * p.z;
      const s = p.size * p.z;
      const g = ctx.createLinearGradient(-s, -s, s, s);
      g.addColorStop(0, "#FFE4EA"); g.addColorStop(0.7, "#F49DB2"); g.addColorStop(1, "#DE6F8B");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(0, -s * 0.7); ctx.bezierCurveTo(s * 0.9, -s * 0.5, s * 0.6, s * 0.6, 0, s * 0.75); ctx.bezierCurveTo(-s * 0.6, s * 0.6, -s * 0.9, -s * 0.5, 0, -s * 0.7); ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  });
})();

/* ---------------- Words arrive like Eugenia's lines: one at a time ---------------- */
function titles() {
  if (calm) return;
  $$(".title, .turn-title, .footer-title").forEach((t) => {
    const split = SplitText.create(t, { type: "lines", mask: "lines", linesClass: "ln" });
    gsap.from(split.lines, { yPercent: 105, duration: 1.2, ease: "expo.out", stagger: 0.1, scrollTrigger: { trigger: t, start: "top 86%", once: true } });
  });
  $$(".lead, .intro").forEach((p) => gsap.from(p, { opacity: 0, y: 24, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: p, start: "top 88%", once: true } }));
  gsap.set(".rise", { opacity: 0, y: 18 });
  ScrollTrigger.batch(".rise", { start: "top 90%", once: true, onEnter: (b) => gsap.to(b, { opacity: 1, y: 0, duration: 1, ease: "expo.out", stagger: 0.08 }) });
  $$(".about-copy > p:not(.lead)").forEach((p, i) => gsap.from(p, { opacity: 0, y: 20, duration: 1, delay: i * 0.05, ease: "expo.out", scrollTrigger: { trigger: p, start: "top 90%", once: true } }));
}

/* ---------------- Section transitions: the next part opens like a petal ---------------- */
// Coloured sections fade in and out at their edges (CSS mask); as one arrives, its night deepens from the top
if (!calm) $$(".skills, .journey").forEach((el) => {
  gsap.fromTo(el, { "--edge": "420px" }, { "--edge": "160px", ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "top 30%", scrub: true } });
});

/* ---------------- Sketches that light up (about) ---------------- */
$$(".lightable").forEach((fig) => {
  const sec = fig.closest("[data-light]"), sk = $(".sb-sketch", fig), pt = $(".sb-paint", fig);
  if (calm) return;
  gsap.set(pt, { "--r": "0%" });
  gsap.set(sk, { opacity: 1, clipPath: "inset(100% 0% 0% 0%)" });
  gsap.to(sk, { clipPath: "inset(0% 0% 0% 0%)", ease: "none", scrollTrigger: { trigger: fig, start: "top 90%", end: "center 60%", scrub: 0.8 } });
  sec.addEventListener("lit", () => {
    gsap.to(pt, { "--r": "130%", duration: 2.4, ease: "power2.inOut" });
    gsap.to(sk, { opacity: 0.12, duration: 2.2, delay: 0.4 });
  });
  gsap.fromTo(fig, { rotation: -1.5 }, { rotation: 1.5, duration: 5, ease: "sine.inOut", yoyo: true, repeat: -1, transformOrigin: "50% 100%" });
});

/* ---------------- Skills: loose strokes gather into a bouquet ---------------- */
(function skills() {
  const sec = $(".skills"), wrap = $(".bouquet-wrap"), svg = $(".bouquet"), label = $(".sk-label");
  const flowers = $$(".sk", svg), groups = $$(".skill-group", sec), tags = $$(".tags li", sec);
  const parts = $$(".stem, .leaf, .ribbon, .sk", svg);
  if (!calm) {
    gsap.set(parts, { x: () => rand(-240, 240), y: () => rand(-160, 200), rotation: () => rand(-120, 120), opacity: 0.35, transformOrigin: "50% 50%" });
    gsap.set($$(".stem, .ribbon", svg), { drawSVG: "0%" });
    gsap.timeline({ scrollTrigger: { trigger: sec, start: "top 75%", end: "center 55%", scrub: 0.9 } })
      .to(parts, { x: 0, y: 0, rotation: 0, opacity: 1, ease: "power2.out", stagger: { each: 0.02, from: "random" } }, 0)
      .to($$(".stem, .ribbon", svg), { drawSVG: "100%", ease: "none" }, 0.1);
    // Flowers lean away from the cursor, then settle back
    const pushers = flowers.map((f) => {
      const b = f.getBBox();
      const kids = $$(".petals, .core", f);
      return { cx: b.x + b.width / 2, cy: b.y + b.height / 2, xs: kids.map((k) => gsap.quickTo(k, "x", { duration: 0.8, ease: "power3.out" })), ys: kids.map((k) => gsap.quickTo(k, "y", { duration: 0.8, ease: "power3.out" })) };
    });
    svg.addEventListener("pointermove", (e) => {
      const m = svg.getScreenCTM(); if (!m) return;
      const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
      pushers.forEach((f) => {
        const dx = f.cx - p.x, dy = f.cy - p.y, d = Math.hypot(dx, dy), k = d < 90 ? (90 - d) / 90 : 0;
        f.xs.forEach((q) => q((dx / (d || 1)) * k * 22)); f.ys.forEach((q) => q((dy / (d || 1)) * k * 22));
      });
    });
    svg.addEventListener("pointerleave", () => pushers.forEach((f) => { f.xs.forEach((q) => q(0)); f.ys.forEach((q) => q(0)); }));
  }
  let on = null;
  function show(f) {
    if (on) on.classList.remove("is-on");
    tags.forEach((t) => t.classList.remove("is-on")); groups.forEach((g) => g.classList.remove("is-on"));
    on = f;
    if (!f) { label.hidden = true; sec.classList.remove("is-focus"); return; }
    f.classList.add("is-on");
    const g = f.closest(".stem-group").dataset.g, name = f.dataset.name;
    const group = groups.find((x) => x.dataset.g === g); group?.classList.add("is-on");
    tags.find((t) => t.textContent === name)?.classList.add("is-on");
    sec.classList.add("is-focus");
    const r = f.getBoundingClientRect(), w = wrap.getBoundingClientRect();
    label.textContent = name; label.hidden = false;
    label.style.left = r.left - w.left + r.width / 2 + "px"; label.style.top = r.top - w.top + "px";
  }
  flowers.forEach((f) => {
    f.addEventListener("pointerenter", () => show(f));
    f.addEventListener("click", () => show(f));
  });
  svg.addEventListener("pointerleave", () => show(null));
  tags.forEach((t) => t.addEventListener("pointerenter", () => { const f = flowers.find((x) => x.dataset.name === t.textContent); if (f) show(f); }));
  $(".skill-groups", sec).addEventListener("pointerleave", () => show(null));
})();

/* ---------------- Notebook: page edges are drawn, pressed flowers are laid in ---------------- */
$$(".page-card").forEach((card) => {
  if (calm) return;
  const edge = $(".page-edge path", card), pf = $(".pressed", card), badge = $(".badge", card);
  gsap.set(edge, { drawSVG: "0%" });
  const tl = gsap.timeline({ scrollTrigger: { trigger: card, start: "top 82%", once: true } });
  tl.to(edge, { drawSVG: "100%", duration: 1.8, ease: "power2.inOut" }, 0)
    .from(card.children, { opacity: 0, y: 18, duration: 0.9, stagger: 0.05, ease: "expo.out" }, 0.2);
  if (pf) tl.from(pf, { opacity: 0, scale: 0.6, rotation: "-=40", duration: 1.4, ease: "back.out(1.6)" }, 0.5);
  if (badge) tl.from(badge, { opacity: 0, scale: 1.8, rotation: -20, duration: 0.7, ease: "back.out(2.6)" }, 1.1);
});

/* ---------------- Journey: the stem grows, every seed opens into a flower ---------------- */
(function journey() {
  const track = $(".track"), svg = $(".track-line"), path = $(".track-path");
  const items = $$(".milestone", track);
  // Where each bud's centre sits inside the track, from layout alone (transforms and animations don't move it)
  const LINE = 0.62; // the height of the screen where the stem's tip grows and buds open
  let samples = [], total = 0;
  function build() {
    const h = track.offsetHeight;
    const tr = track.getBoundingClientRect();
    const pts = items.map((li) => {
      const b = $(".bud", li), br = b.getBoundingClientRect();
      const lx = gsap.getProperty(li, "x") || 0, ly = gsap.getProperty(li, "y") || 0;
      return { x: br.left - tr.left - lx + br.width / 2, y: br.top - tr.top - ly + br.height / 2 };
    });
    if (!pts.length) return;
    let d = `M ${pts[0].x} 0`, prev = 0;
    pts.forEach((p, i) => { d += ` Q ${p.x + (i % 2 ? -16 : 16)} ${(prev + p.y) / 2} ${p.x} ${p.y}`; prev = p.y; });
    svg.setAttribute("viewBox", `0 0 ${svg.clientWidth} ${h}`);
    path.setAttribute("d", d);
    // Sample the path so the tip can be placed at any height
    total = path.getTotalLength();
    samples = [];
    for (let l = 0; l <= total; l += 6) samples.push([l, path.getPointAtLength(l).y]);
    samples.push([total, path.getPointAtLength(total).y]);
  }
  const lengthAtY = (y) => {
    if (!samples.length || y <= 0) return 0;
    for (const [l, sy] of samples) if (sy >= y) return l;
    return total;
  };
  build();
  document.fonts?.ready.then(() => { build(); ScrollTrigger.refresh(); });
  ScrollTrigger.addEventListener("refreshInit", build);
  const bloom = (li, open) => {
    const s = $(".bud-shape", li);
    s.dataset.seed ||= s.getAttribute("d");
    if (calm) { s.setAttribute("d", open ? s.dataset.bloom : s.dataset.seed); return; }
    gsap.to(s, { morphSVG: open ? s.dataset.bloom : s.dataset.seed, duration: open ? 1 : 0.5, ease: open ? "back.out(1.7)" : "power2.in" });
    if (open) gsap.fromTo($(".bud", li), { rotation: -40 }, { rotation: 0, duration: 1.2, ease: "back.out(1.6)", transformOrigin: "50% 50%" });
  };
  if (calm) { items.forEach((li) => { li.classList.add("is-lit"); bloom(li, true); }); return; }
  // The tip of the stem is always at the line: it reaches each bud at the moment that bud opens
  const tip = { l: 0 };
  gsap.set(path, { drawSVG: "0 0" });
  const grow = () => {
    const y = innerHeight * LINE - track.getBoundingClientRect().top;
    gsap.to(tip, { l: lengthAtY(y), duration: 0.35, ease: "power2.out", overwrite: true, onUpdate: () => gsap.set(path, { drawSVG: `0 ${tip.l}` }) });
  };
  ScrollTrigger.create({ trigger: track, start: "top bottom", end: "bottom top", onUpdate: grow, onRefresh: grow });
  items.forEach((li) => ScrollTrigger.create({
    trigger: $(".bud", li), start: `center ${LINE * 100}%`,
    onEnter: () => { li.classList.add("is-lit"); bloom(li, true); },
    onLeaveBack: () => { li.classList.remove("is-lit"); bloom(li, false); },
  }));
  // Only the words slide in; the buds stay where the stem expects them
  gsap.utils.toArray(".milestone, .year").forEach((el) => gsap.from($$(":scope > :not(.bud)", el), { opacity: 0, x: 24, duration: 0.9, ease: "expo.out", stagger: 0.05, scrollTrigger: { trigger: el, start: "top 88%" } }));
})();

/* ---------------- The story behind my smile ---------------- */
(function story() {
  const btn = $(".btn-story"), body = $("#story-body"), sec = btn.closest(".story");
  btn.addEventListener("click", () => {
    const open = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", String(!open));
    body.hidden = open;
    sec.classList.toggle("is-open", !open);
    if (!open) gsap.from($$("p", body), { opacity: 0, y: calm ? 0 : 16, duration: 1.1, stagger: 0.3, ease: "expo.out" });
    ScrollTrigger.refresh();
  });
  if (!calm) gsap.fromTo(".jar", { rotation: -3 }, { rotation: 3, duration: 2.8, ease: "sine.inOut", yoyo: true, repeat: -1, transformOrigin: "50% 0%" });
})();

/* ---------------- The kindness meadow ---------------- */
(function tree() {
  const API = (window.CHAIN_API_URL || "").replace(/\/+$/, "");
  const PRESETS_EN = R.presetsEn; // what the API stores
  const TEXT_TO_ID = {};
  Object.keys(PRESETS_EN).forEach((k) => { if (k !== "custom") TEXT_TO_ID[PRESETS_EN[k]] = k; });
  const FIRST = { id: "first", name: "Osvaldo", text: PRESETS_EN.listen, first: true };
  const M = R.msg;

  const form = $(".chain-form"), nameInput = $("#chain-name"), customField = $(".custom-field"), customInput = $("#chain-custom");
  const customCount = $(".custom-count"), status = $(".form-status"), submitBtn = $("button[type=submit]", form);
  const meadow = $(".meadow"), canvas = $(".meadow-canvas"), card = $(".meadow-read"), list = $(".meadow-list"), pond = $(".tree-pond");
  let links = [], total = 0, newId = null;
  let mine = [];
  try { mine = JSON.parse(store("myLinkIds") || "[]"); } catch (e) {}

  /* ---- shared validation (the server checks the same rules) ---- */
  const WORDS = ("puta puto putas putos putita putito puton culo culos pito pitos joto jotos zorra zorras perra perras pinche pinches " +
    "mamada mamadas mamon mamona idiota idiotas imbecil imbeciles estupido estupida estupidos polla hdp ptm alv kys " +
    "dick dicks cock cocks slut sluts whore whores retard retards nazi nazis ass pussy bastard bastards panocha ojete " +
    "nalgas verga vergas marica maricas maricon maricones ctm csm vrg " +
    "stupid stupids idiot idiots moron morons dumbass loser losers twat wanker prick fag fags fck fk fuk stfu gtfo hitler kkk " +
    "matate muerete suicidate jodete jodanse tarado tarada tarados baboso babosa cagada cagado chupala chupamela mamala mamaguevo").split(" ");
  const STEMS = ["fuck", "shit", "bitch", "asshole", "cunt", "nigg", "fagg", "motherf", "pendej", "chinga",
    "chingu", "cabron", "culer", "mierd", "gilipoll", "putaz", "punet", "malparid", "hijodeput", "chingad"];
  const SQUASHED = ["fuck", "nigger", "nigga", "pendejo", "pendeja", "chingada", "mierda", "hijodeputa", "killyourself",
    "killurself", "motherfucker", "hitler"];
  function normalize(s) {
    return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/0/g, "o").replace(/1/g, "i").replace(/3/g, "e").replace(/4/g, "a")
      .replace(/5/g, "s").replace(/7/g, "t").replace(/@/g, "a").replace(/\$/g, "s");
  }
  const squeeze = (x) => x.replace(/(.)\1+/g, "$1"); // "fuuuuck" -> "fuck"
  function isRude(s) {
    const n = normalize(s);
    const tokens = n.split(/[^a-z]+/).filter(Boolean);
    for (const tk of tokens) {
      for (const w of [tk, squeeze(tk)]) {
        if (WORDS.indexOf(w) !== -1) return true;
        for (const st of STEMS) if (w.indexOf(st) === 0) return true;
      }
    }
    const squashed = n.replace(/[^a-z]/g, "");
    for (const b of [squashed, squeeze(squashed)]) for (const bad of SQUASHED) if (b.indexOf(bad) !== -1) return true;
    return false;
  }
  const URLISH = /(https?:|www\.|\.(com|net|org|io|xyz|ru|mx|co|info|biz|me|ly|gg|app|dev|site|online|link)\b|@\w|(\d[\s.\-()]*){7,})/i;
  // A first name: letters only, at most two words and 24 characters
  const NAME_RE = /^[\p{L}][\p{L}\p{M}.'\-]{0,23}( [\p{L}][\p{L}\p{M}.'\-]*)?$/u;
  function validate(name, actionId, custom) {
    if (!name) return { field: nameInput, msg: M.needName };
    if (name.length > 24 || !NAME_RE.test(name)) return { field: nameInput, msg: M.badName };
    if (isRude(name)) return { field: nameInput, msg: M.rudeName };
    if (actionId === "custom") {
      if (custom.length < 3) return { field: customInput, msg: M.shortCustom };
      if (URLISH.test(custom)) return { field: customInput, msg: M.linkCustom };
      if (isRude(custom)) return { field: customInput, msg: M.rudeCustom };
    } else if (!PRESETS_EN[actionId] || actionId === "custom") {
      return { field: null, msg: M.pickAction };
    }
    return null;
  }
  // What the API answers (always in English), in the visitor's language
  const SERVER = {
    "Use your first name, letters only, up to 24 characters.": "badName",
    "Pick one of the kind actions.": "pickAction",
    "Write your kind action in 3 to 80 characters.": "shortCustom",
    "Links, emails and phone numbers can't go on the chain.": "linkCustom",
    "Keep it kind, please. Try different words.": "rudeCustom",
    "You just added a link. Wait a minute, then add another.": "wait",
    "The chain couldn't be reached. Try again in a moment.": "unreachable",
  };

  /* ---- how a flower reads ---- */
  const shown = (l) => { const id = TEXT_TO_ID[l.text]; return id ? R.actions[id] : l.text; };
  const label = (l) => (l.first ? M.first + ", " : "") + l.name + ": " + shown(l) + (l.pending ? " (" + M.pending + ")" : "");
  function setCount(n) {
    $$(".chain-count").forEach((el) => {
      const from = parseInt(el.textContent, 10) || 0;
      if (from === n || calm || document.hidden) { el.textContent = n; return; }
      const o = { v: from };
      gsap.to(o, { v: n, duration: 1.2, ease: "power2.out", onUpdate: () => (el.textContent = Math.round(o.v)) });
    });
    $$(".chain-count-label").forEach((el) => (el.textContent = n === 1 ? el.dataset.one : el.dataset.many));
  }
  const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

  /* ---- the meadow, drawn on a canvas ---- */
  const ctx = canvas.getContext("2d");
  const img = (src) => { const i = new Image(); i.decoding = "async"; i.src = src; i.onload = () => (dirty = true); return i; };
  const SPR = {
    pink: img("/media/v4/cosmos-pink.webp"), white: img("/media/v4/cosmos-white.webp"),
    pinkS: img("/media/v4/cosmos-pink-sketch.webp"), whiteS: img("/media/v4/cosmos-white-sketch.webp"),
    first: img("/media/v4/azalea.webp"),
  };
  let W = 0, H = 0, dpr = 1, cam = 0, vel = 0, worldW = 0, dirty = true, visible = false, lastInput = 0;
  let flowers = [], extras = [], blades = [], flies = [], hover = null, selected = null;
  let palette = {};
  const readPalette = () => {
    const dark = isDark();
    palette = dark
      ? { blades: ["#132326", "#1A3324", "#24452F", "#0C1810"], tips: ["#2A4A44", "#3B6A4A", "#4F8A5E", "#1D3524"], stem: "#3F7550", mist: "rgba(120,150,190,0.08)", glow: "255,201,138" }
      : { blades: ["#B9C3A4", "#8EA67C", "#6A8A5C", "#4E6E45"], tips: ["#D5DCC0", "#AFC49A", "#8DAA78", "#6B8B5E"], stem: "#5E8752", mist: "rgba(255,255,255,0.25)", glow: "236,160,70" };
    dirty = true;
  };
  readPalette();
  new MutationObserver(readPalette).observe(root, { attributes: true, attributeFilter: ["data-theme"] });

  const SP = () => (narrow() ? 62 : 82);
  function layout() {
    const all = links.concat([FIRST]);
    const sp = SP();
    flowers = all.map((l, k) => {
      const seed = hash(String(l.id));
      const lane = (seed >>> 3) % 3; // 0 back, 1 middle, 2 front
      const depth = [0.62, 0.8, 1][lane];
      const base = 120 + k * sp + ((seed >>> 7) % 30) - 15;
      return {
        l, seed, depth, base, lane,
        // heads sit just above their own layer of grass, so every flower grows out of the meadow
        y: H * [0.56, 0.63, 0.7][lane] + ((seed >>> 11) % 18) - 9,
        size: (l.first ? 96 : 64) * (0.62 + depth * 0.45) * (narrow() ? 0.82 : 1),
        sprite: l.first ? "first" : (seed >>> 5) % 3 === 0 ? "white" : "pink",
        born: l.id === newId ? performance.now() : 0,
      };
    });
    const named = flowers.length, rest = Math.max(0, total + 1 - named);
    const lastX = 120 + named * sp;
    const shownRest = Math.min(rest, 900);
    extras = Array.from({ length: shownRest }, (_, i) => {
      const s = hash("x" + i);
      return { x: lastX * 0.42 + i * 16 + (s % 40), y: H * (0.56 + ((s >>> 6) % 100) / 800), r: 2.5 + ((s >>> 9) % 3), pink: (s >>> 4) % 3 !== 0, ph: (s % 628) / 100 };
    });
    worldW = Math.max(W * 1.15, lastX + 160, (lastX * 0.42 + shownRest * 16 + 200) / 0.42);
    // Grass in four layers: far, middle, near, and a few tall blades in front of the flowers
    blades = [0.42, 0.7, 1, 1.25].map((depth, li) => {
      const span = worldW * depth + W, step = [5, 5, 4.5, 16][li] * (narrow() ? 1.3 : 1);
      const n = Math.ceil(span / step);
      const tall = [0.6, 0.54, 0.46, 0.4][li];
      return { depth, li, list: Array.from({ length: n }, (_, i) => { const s = hash(li + ":" + i); return { x: i * step + (s % step), h: H * tall * (0.55 + ((s >>> 8) % 100) / 220), lean: (((s >>> 4) % 100) / 100 - 0.5) * 0.6, ph: (s % 628) / 100 }; }) };
    });
    flies = Array.from({ length: narrow() ? 14 : 26 }, () => ({ x: Math.random() * W, y: rand(0.2, 0.85) * H, vx: rand(-0.3, 0.3), vy: rand(-0.15, 0.15), ph: Math.random() * 6.28 }));
    clampCam(); dirty = true;
  }
  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    layout();
  }
  const maxCam = () => Math.max(0, worldW - W);
  const clampCam = () => { cam = gsap.utils.clamp(0, maxCam(), cam); };
  const screenX = (f) => f.base * f.depth - cam * f.depth + (W * (1 - f.depth)) * 0.15;

  function draw(t) {
    const time = t / 1000;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    // A low mist where the meadow meets the night
    const g = ctx.createLinearGradient(0, H * 0.25, 0, H);
    g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(0.5, palette.mist); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const wind = calm ? 0 : 1;
    // Each blade is darker at the root and lighter at the tip, so the meadow has depth instead of flat lines
    const drawBlades = (layer) => {
      const grad = ctx.createLinearGradient(0, H, 0, H * 0.45);
      grad.addColorStop(0, palette.blades[layer.li]); grad.addColorStop(1, palette.tips[layer.li]);
      ctx.strokeStyle = grad; ctx.lineWidth = [1.3, 1.7, 2.2, 3][layer.li]; ctx.lineCap = "round";
      ctx.beginPath();
      const off = cam * layer.depth;
      for (const b of layer.list) {
        const x = b.x - off; if (x < -30 || x > W + 30) continue;
        const sway = (Math.sin(time * 1.1 + b.ph + b.x * 0.004) * 6 + b.lean * 20) * wind + b.lean * 14;
        ctx.moveTo(x, H); ctx.quadraticCurveTo(x + sway * 0.3, H - b.h * 0.55, x + sway, H - b.h);
      }
      ctx.stroke();
    };
    drawBlades(blades[0]);
    // Unnamed flowers, far out in the meadow: small lights in the grass
    const offE = cam * 0.42;
    for (const e of extras) {
      const x = e.x - offE; if (x < -10 || x > W + 10) continue;
      const a = 0.55 + 0.35 * Math.sin(time * 1.5 + e.ph) * wind;
      ctx.fillStyle = e.pink ? `rgba(243,182,196,${a})` : `rgba(238,241,246,${a})`;
      ctx.beginPath(); ctx.arc(x, e.y + Math.sin(time + e.ph) * 1.5 * wind, e.r, 0, 6.283); ctx.fill();
    }
    // Named flowers, back to front: each lane grows out of its own layer of grass
    const byDepth = flowers.slice().sort((a, b) => a.depth - b.depth);
    let drawnLayer = 0;
    for (const f of byDepth) {
      while (drawnLayer < f.lane) drawBlades(blades[++drawnLayer]);
      const x = screenX(f); if (x < -f.size || x > W + f.size) continue;
      const bob = Math.sin(time * 1.2 + (f.seed % 100)) * 3 * wind;
      const y = f.y + bob, s = f.size * (f === hover || f === selected ? 1.18 : 1);
      // the stem bends with the same wind as the grass, and a leaf grows from it
      const sway = Math.sin(time * 1.1 + f.base * 0.004) * 6 * wind;
      ctx.strokeStyle = palette.stem; ctx.lineWidth = 1.6 + f.depth; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(x - sway * 0.6, H); ctx.quadraticCurveTo(x - sway * 0.3, (H + y) / 2, x + sway * 0.9, y + s * 0.15); ctx.stroke();
      const ly = y + (H - y) * 0.45, side = f.seed % 2 ? 1 : -1;
      ctx.fillStyle = palette.stem;
      ctx.beginPath(); ctx.moveTo(x - sway * 0.4, ly);
      ctx.quadraticCurveTo(x + side * s * 0.35, ly - s * 0.3, x + side * s * 0.5, ly - s * 0.08);
      ctx.quadraticCurveTo(x + side * s * 0.2, ly + s * 0.02, x - sway * 0.4, ly); ctx.fill();
      const haze = f.lane === 0 ? 0.82 : 1; // a little haze on the far ones
      // glow
      const lit = f === hover || f === selected || f.born;
      // the flower's light spills onto the grass around it
      const ga = (lit ? 0.5 : 0.2) * haze;
      const gr = ctx.createRadialGradient(x + sway * 0.9, y + s * 0.25, 0, x + sway * 0.9, y + s * 0.25, s * 1.5);
      gr.addColorStop(0, `rgba(${palette.glow},${ga})`); gr.addColorStop(0.5, `rgba(${palette.glow},${ga * 0.35})`); gr.addColorStop(1, `rgba(${palette.glow},0)`);
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x + sway * 0.9, y + s * 0.25, s * 1.5, 0, 6.283); ctx.fill();
      // a pending flower is still a sketch; a new one sketches in, then lights up
      let k = 1;
      if (f.born) { k = Math.min(1, (t - f.born) / 1800); if (k >= 1) f.born = 0; else dirty = true; }
      const sprite = SPR[f.sprite], sk = f.sprite === "white" ? SPR.whiteS : SPR.pinkS;
      ctx.save(); ctx.translate(x + sway * 0.9, y); ctx.rotate(sway * 0.012 + Math.sin(time * 0.8 + f.seed) * 0.03 * wind);
      const sc = f.born ? 0.4 + 0.6 * (1 - Math.pow(1 - k, 3)) : 1;
      ctx.scale(sc, sc);
      if (f.l.pending) { if (sk.complete) { ctx.globalAlpha = haze; ctx.drawImage(sk, -s / 2, -s / 2, s, s); } }
      else {
        if (k < 1 && sk.complete) { ctx.globalAlpha = (1 - k) * haze; ctx.drawImage(sk, -s / 2, -s / 2, s, s); }
        if (sprite.complete) { ctx.globalAlpha = k * haze; ctx.drawImage(sprite, -s / 2, -s / 2, s, s); }
      }
      ctx.restore(); ctx.globalAlpha = 1;
      // A tuft of grass in front of every flower: it hides the stem and the lower petals,
      // and its tips catch the flower's own light, so flower and meadow read as one
      const tuft = 9 + (f.seed % 4);
      for (let i = 0; i < tuft; i++) {
        const r1 = ((f.seed >>> (i % 24)) % 1000) / 1000, r2 = ((f.seed * (i + 7)) % 997) / 997;
        const bx = x + (r1 - 0.5) * s * 0.95;
        const top = y + s * (0.02 + r2 * 0.38);
        const bend = (Math.sin(time * 1.1 + bx * 0.004) * 6 * wind) + (r1 - 0.5) * 16;
        const gb = ctx.createLinearGradient(0, H, 0, top);
        gb.addColorStop(0, palette.blades[Math.min(3, f.lane + 1)]);
        gb.addColorStop(0.75, palette.tips[Math.min(3, f.lane + 1)]);
        gb.addColorStop(1, `rgba(${palette.glow},${0.55 * haze})`);
        ctx.strokeStyle = gb; ctx.lineWidth = 1.4 + f.depth * 1.2;
        ctx.beginPath(); ctx.moveTo(bx, H); ctx.quadraticCurveTo(bx + bend * 0.3, (H + top) / 2, bx + bend, top); ctx.stroke();
      }
      if (mine.includes(f.l.id) || f.l.local) {
        ctx.strokeStyle = `rgba(${palette.glow},0.9)`; ctx.lineWidth = 1.5; ctx.setLineDash([3, 4]);
        ctx.beginPath(); ctx.arc(x, y, s * 0.62, 0, 6.283); ctx.stroke(); ctx.setLineDash([]);
      }
    }
    while (drawnLayer < 3) drawBlades(blades[++drawnLayer]); // the last layer stands in front of the flowers
    // Fireflies
    for (const p of flies) {
      if (!calm) { p.x += p.vx + Math.sin(time + p.ph) * 0.2; p.y += p.vy + Math.cos(time * 0.7 + p.ph) * 0.15; if (p.x < -10) p.x = W + 10; if (p.x > W + 10) p.x = -10; if (p.y < H * 0.1 || p.y > H * 0.95) p.vy *= -1; }
      const a = 0.5 + 0.5 * Math.sin(time * 2.2 + p.ph * 3);
      const fg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 9);
      fg.addColorStop(0, `rgba(255,236,190,${a})`); fg.addColorStop(1, "rgba(255,214,150,0)");
      ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(p.x, p.y, 9, 0, 6.283); ctx.fill();
    }
    placeCard();
  }

  /* ---- reading a flower ---- */
  function placeCard() {
    if (!selected && !hover) return;
    const f = selected || hover;
    const x = screenX(f);
    card.style.left = gsap.utils.clamp(140, W - 140, x) + "px";
    card.style.top = f.y - f.size * 0.4 + "px";
    if (x < -40 || x > W + 40) card.hidden = true;
  }
  function read(f) {
    if (!f) { card.hidden = true; return; }
    const l = f.l;
    card.textContent = "";
    const b = document.createElement("b");
    b.textContent = (l.first ? M.first + ", " : "") + l.name;
    card.append(b, document.createTextNode(shown(l) + (l.pending ? " (" + M.pending + ")" : "")));
    card.hidden = false; placeCard();
  }
  function pick(px, py) {
    let best = null, bd = Infinity;
    for (const f of flowers) {
      const d = Math.hypot(screenX(f) - px, f.y - py);
      if (d < f.size * 0.6 && (f.depth > (best?.depth ?? 0) - 0.01 || d < bd)) { if (!best || f.depth >= best.depth || d < bd) { best = f; bd = d; } }
    }
    return best;
  }
  function focusOn(f) {
    const target = gsap.utils.clamp(0, maxCam(), (f.base * f.depth + (W * (1 - f.depth)) * 0.15 - W / 2) / f.depth);
    gsap.to({ c: cam }, { c: target, duration: calm ? 0 : 1, ease: "power3.inOut", onUpdate() { cam = this.targets()[0].c; dirty = true; } });
  }

  /* ---- walking the meadow: drag, horizontal wheel, buttons ---- */
  let down = null, moved = 0;
  canvas.addEventListener("pointerdown", (e) => { down = { x: e.clientX, cam }; moved = 0; vel = 0; lastInput = performance.now(); canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
    if (down) {
      const dx = e.clientX - down.x; moved = Math.max(moved, Math.abs(dx));
      if (moved > 4) meadow.classList.add("is-dragging");
      const prev = cam; cam = down.cam - dx; clampCam(); vel = cam - prev; dirty = true; lastInput = performance.now();
      return;
    }
    const f = pick(px, py);
    if (f !== hover) { hover = f; if (!selected) read(f); dirty = true; }
  });
  const release = (e) => {
    if (!down) return;
    meadow.classList.remove("is-dragging");
    if (moved < 6) {
      const r = canvas.getBoundingClientRect();
      const f = pick(e.clientX - r.left, e.clientY - r.top);
      selected = f; read(f); dirty = true;
    }
    down = null;
  };
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);
  canvas.addEventListener("pointerleave", () => { if (!down && hover) { hover = null; if (!selected) read(null); dirty = true; } });
  canvas.addEventListener("wheel", (e) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; // vertical wheel keeps scrolling the page
    e.preventDefault(); cam += e.deltaX; clampCam(); dirty = true; lastInput = performance.now();
  }, { passive: false });
  const walk = (dir) => { lastInput = performance.now(); gsap.to({ c: cam }, { c: gsap.utils.clamp(0, maxCam(), cam + dir * W * 0.6), duration: calm ? 0 : 0.9, ease: "power3.inOut", onUpdate() { cam = this.targets()[0].c; dirty = true; } }); };
  $(".meadow-prev").addEventListener("click", () => walk(-1));
  $(".meadow-next").addEventListener("click", () => walk(1));
  document.addEventListener("pointerdown", (e) => { if (!e.target.closest(".meadow")) { selected = null; read(hover); dirty = true; } });

  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(meadow);
  new ResizeObserver(resize).observe(canvas);
  gsap.ticker.add(() => {
    if (!visible || document.hidden) return;
    const now = performance.now();
    if (!down && Math.abs(vel) > 0.1) { cam += vel; vel *= 0.93; clampCam(); dirty = true; }
    // When nobody is walking, the meadow drifts slowly by
    if (!calm && !down && now - lastInput > 4000 && maxCam() > 0) { cam += 0.25; if (cam >= maxCam()) cam = 0; dirty = true; }
    if (!calm) dirty = true; // grass and fireflies always move
    if (dirty) { draw(now); dirty = false; }
  });

  // Newest first: they bloom closest to you; the rest of the count fills the meadow further out
  function render() {
    resize();
    const all = links.concat([FIRST]);
    list.textContent = "";
    all.forEach((l) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button"; btn.textContent = label(l);
      btn.addEventListener("focus", () => { const f = flowers.find((x) => x.l === l); if (f) { selected = f; focusOn(f); read(f); } });
      li.appendChild(btn); list.appendChild(li);
    });
    const rest = Math.max(0, total + 1 - all.length);
    pond.hidden = rest <= 0;
    pond.textContent = fill(pond.dataset.text, { n: rest });
    setCount(total + 1);
    dirty = true;
  }

  function addToTop(l) {
    links.unshift(l);
    if (!l.pending) total += 1; // flowers in review don't count until they're approved
    newId = l.id;
    render();
    newId = null;
    const f = flowers.find((x) => x.l === l);
    if (f) { selected = f; cam = 0; read(f); }
    meadow.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "center" });
  }

  /* ---- local preview storage (used when the API isn't set or can't be reached) ---- */
  const localLinks = () => { try { return JSON.parse(store("localLinks") || "[]"); } catch (e) { return []; } };
  const saveLocal = (l) => { const arr = localLinks(); arr.unshift(l); store("localLinks", JSON.stringify(arr.slice(0, 20))); };
  const pendingLinks = () => { try { return JSON.parse(store("pendingLinks") || "[]"); } catch (e) { return []; } };
  const savePending = (arr) => store("pendingLinks", JSON.stringify(arr.slice(0, 10)));

  function load() {
    if (!API) { links = localLinks(); total = links.length; render(); return; }
    fetch(API + "/links", { headers: { Accept: "application/json" } })
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then((data) => {
        const shared = data.links || [];
        const ids = shared.map((l) => l.id);
        // Drop the ones that were approved, and forget anything older than a week
        const weekAgo = Date.now() - 7 * 864e5;
        const waiting = pendingLinks().filter((l) => !ids.includes(l.id) && new Date(l.createdAt).getTime() > weekAgo);
        savePending(waiting);
        links = waiting.concat(shared, localLinks());
        total = (typeof data.count === "number" ? data.count : shared.length) + localLinks().length;
        render();
      })
      .catch(() => { links = localLinks(); total = links.length; render(); });
  }
  render();
  load();

  /* ---- form ---- */
  form.addEventListener("change", (e) => {
    if (e.target.name !== "action") return;
    const own = e.target.value === "custom";
    customField.hidden = !own;
    if (own) customInput.focus();
    ScrollTrigger.refresh();
  });
  customInput.addEventListener("input", () => (customCount.textContent = customInput.value.length));

  /* ---- the preview: a sketch of your flower that lights up as you write ---- */
  const preview = $(".flower-preview"), fpName = $(".fp-name"), fpText = $(".fp-text");
  function updatePreview() {
    const name = nameInput.value.trim();
    const id = (form.querySelector("input[name=action]:checked") || {}).value;
    const custom = customInput.value.trim();
    fpName.textContent = name || fpName.dataset.empty;
    fpName.classList.toggle("is-empty", !name);
    fpText.textContent = id === "custom" ? custom || R.actions.custom : R.actions[id] || "";
    preview.style.setProperty("--lit", Math.min(1, name.length / 4).toFixed(2));
  }
  form.addEventListener("input", updatePreview);
  form.addEventListener("change", updatePreview);
  updatePreview();
  [nameInput, customInput].forEach((inp) => inp.addEventListener("input", () => inp.removeAttribute("aria-invalid")));
  const say = (msg, err) => { status.textContent = msg; status.classList.toggle("is-error", !!err); };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = nameInput.value.trim().replace(/\s+/g, " ");
    const actionId = (form.querySelector("input[name=action]:checked") || {}).value;
    const custom = customInput.value.trim().replace(/\s+/g, " ");
    const problem = validate(name, actionId, custom);
    if (problem) {
      say(problem.msg, true);
      if (problem.field) { problem.field.setAttribute("aria-invalid", "true"); problem.field.focus(); }
      return;
    }
    const text = actionId === "custom" ? custom : PRESETS_EN[actionId];
    const payload = { name, actionId: actionId === "custom" ? null : actionId, customText: actionId === "custom" ? custom : null };
    const done = (link, localOnly) => {
      addToTop(link);
      say(localOnly ? M.addedLocal : link.pending ? fill(M.addedPending, { name }) : fill(M.added, { name }));
      customInput.value = ""; customCount.textContent = "0";
      preview.classList.remove("is-planted"); void preview.offsetWidth; preview.classList.add("is-planted");
    };
    if (!API) { const local = { id: "local-" + Date.now(), name, text, local: true }; saveLocal(local); done(local, true); return; }
    submitBtn.disabled = true;
    say(M.adding);
    fetch(API + "/links", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      .then((r) => r.json().catch(() => ({})).then((data) => ({ ok: r.ok, status: r.status, data })))
      .then((res) => {
        if (res.ok && res.data.link) {
          const link = res.data.link;
          mine.push(link.id);
          store("myLinkIds", JSON.stringify(mine.slice(-20)));
          if (res.data.pending) { link.pending = true; savePending([link].concat(pendingLinks())); }
          done(link, false);
        } else if (res.status === 429) {
          say(M.wait, true);
        } else {
          const key = SERVER[res.data.message];
          say(key ? M[key] : M.failed, true);
        }
      })
      .catch(() => { const local = { id: "local-" + Date.now(), name, text, local: true }; saveLocal(local); done(local, true); })
      .finally(() => (submitBtn.disabled = false));
  });
})();

/* ---------------- Start: intro, then the painting lights up, then the firefly appears ---------------- */
document.fonts?.ready.then(titles) ?? titles();
introGrid().then(() => {
  heroIntro();
  if (!calm) gsap.to(ff, { opacity: 1, duration: 1.2, delay: 1.6 });
  ScrollTrigger.refresh();
});
