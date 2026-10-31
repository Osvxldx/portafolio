/* You matter. Osvaldo's portfolio
   Plain JavaScript. GSAP, ScrollTrigger and Lenis are optional upgrades:
   if they fail to load, every part of the page still works. */
(function () {
  "use strict";

  var root = document.documentElement;
  // ?motion=full forces every animation on (handy for testing on machines with reduced motion turned on)
  var forceMotion = /[?&]motion=full\b/.test(location.search);
  if (forceMotion) root.classList.add("force-motion");
  var reduceMotion = !forceMotion && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  var hasGsap = !!window.gsap;
  if (hasGsap && window.ScrollTrigger) window.gsap.registerPlugin(window.ScrollTrigger);
  var hasST = hasGsap && !!window.ScrollTrigger;

  if (!reduceMotion) root.classList.add("motion");

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function store(key, value) {
    try {
      if (value === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, value);
    } catch (e) { return null; }
  }
  function cssVar(name) { return getComputedStyle(root).getPropertyValue(name).trim(); }

  /* ---------------- Theme ---------------- */
  var toggle = $(".theme-toggle");
  function currentTheme() { return root.getAttribute("data-theme") === "dark" ? "dark" : "light"; }
  function syncToggle() {
    var dark = currentTheme() === "dark";
    toggle.setAttribute("aria-pressed", String(dark));
    toggle.setAttribute("aria-label", dark ? "Switch to sunrise mode" : "Switch to night mode");
  }
  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    store("theme", theme);
    syncToggle();
    motes.setMode(theme);
  }
  toggle.addEventListener("click", function () {
    var next = currentTheme() === "dark" ? "light" : "dark";
    if (!document.startViewTransition || reduceMotion) { applyTheme(next); return; }
    var r = toggle.getBoundingClientRect();
    var x = r.left + r.width / 2, y = r.top + r.height / 2;
    var radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    var t = document.startViewTransition(function () { applyTheme(next); });
    t.ready.then(function () {
      root.animate(
        { clipPath: ["circle(0px at " + x + "px " + y + "px)", "circle(" + radius + "px at " + x + "px " + y + "px)"] },
        { duration: 750, easing: "cubic-bezier(0.22, 1, 0.36, 1)", pseudoElement: "::view-transition-new(root)" }
      );
    }).catch(function () {});
  });

  /* ---------------- Light motes (background particles) ---------------- */
  var motes = (function () {
    var canvas = $(".motes");
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0, list = [], mode = currentTheme(), mouse = { x: -9999, y: -9999 }, running = false, color = "255,170,60";

    function resize() {
      w = innerWidth; h = innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = w < 700 ? 26 : 52;
      list = [];
      for (var i = 0; i < n; i++) list.push(make(true));
    }
    function make(anywhere) {
      return {
        x: Math.random() * w,
        y: anywhere ? Math.random() * h : h + 10,
        r: 0.8 + Math.random() * 2.4,
        vx: (Math.random() - 0.5) * 0.25,
        vy: -(0.12 + Math.random() * 0.35),
        a: 0.25 + Math.random() * 0.45,
        phase: Math.random() * Math.PI * 2,
        speed: 0.6 + Math.random() * 1.6,
        ox: 0, oy: 0
      };
    }
    function frame(t) {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      var time = t / 1000;
      for (var i = 0; i < list.length; i++) {
        var p = list[i];
        if (mode === "dark") {
          // fireflies: wander and blink
          p.vx += (Math.random() - 0.5) * 0.02;
          p.vy += (Math.random() - 0.5) * 0.02;
          p.vx *= 0.98; p.vy *= 0.98;
        }
        p.x += p.vx; p.y += p.vy;
        // gently move away from the cursor
        var dx = p.x + p.ox - mouse.x, dy = p.y + p.oy - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < 14400) {
          var d = Math.sqrt(d2) || 1, f = (120 - d) / 120;
          p.ox += (dx / d) * f * 2.2; p.oy += (dy / d) * f * 2.2;
        }
        p.ox *= 0.94; p.oy *= 0.94;
        if (p.y < -20) { var n = make(false); p.x = n.x; p.y = n.y; }
        if (p.x < -20) p.x = w + 20; if (p.x > w + 20) p.x = -20;
        if (p.y > h + 20) p.y = -20;

        var alpha = mode === "dark" ? p.a * (0.35 + 0.65 * Math.max(0, Math.sin(time * p.speed + p.phase))) : p.a * 0.75;
        var x = p.x + p.ox, y = p.y + p.oy;
        ctx.beginPath();
        ctx.fillStyle = "rgba(" + color + "," + (alpha * 0.18).toFixed(3) + ")";
        ctx.arc(x, y, p.r * 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = "rgba(" + color + "," + alpha.toFixed(3) + ")";
        ctx.arc(x, y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(frame);
    }
    function start() { if (!running && !reduceMotion) { running = true; requestAnimationFrame(frame); } }
    function stop() { running = false; }

    if (!reduceMotion) {
      resize();
      color = cssVar("--mote") || color;
      addEventListener("resize", resize);
      addEventListener("pointermove", function (e) { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
      document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
      start();
    }
    return {
      setMode: function (m) { mode = m; color = cssVar("--mote") || color; }
    };
  })();
  syncToggle();

  /* ---------------- Click sparks ---------------- */
  var sparks = (function () {
    var canvas = $(".sparks");
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var items = [], running = false;
    function resize() {
      canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function loop() {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (var i = items.length - 1; i >= 0; i--) {
        var s = items[i];
        s.life -= 1; s.vy += 0.09; s.vx *= 0.97; s.vy *= 0.97;
        s.x += s.vx; s.y += s.vy;
        if (s.life <= 0) { items.splice(i, 1); continue; }
        var a = s.life / s.max;
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rot += 0.1);
        ctx.fillStyle = "rgba(" + s.c + "," + a.toFixed(3) + ")";
        // small four-point star
        var r = s.r * (0.6 + a * 0.4);
        ctx.beginPath();
        ctx.moveTo(0, -r); ctx.lineTo(r * 0.3, -r * 0.3); ctx.lineTo(r, 0); ctx.lineTo(r * 0.3, r * 0.3);
        ctx.lineTo(0, r); ctx.lineTo(-r * 0.3, r * 0.3); ctx.lineTo(-r, 0); ctx.lineTo(-r * 0.3, -r * 0.3);
        ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      if (items.length) requestAnimationFrame(loop); else { running = false; ctx.clearRect(0, 0, innerWidth, innerHeight); }
    }
    function burst(x, y, count) {
      if (reduceMotion) return;
      var colors = [cssVar("--spark") || "255,160,40", "238,93,120", "255,210,120"];
      count = count || 14;
      for (var i = 0; i < count; i++) {
        var ang = (Math.PI * 2 * i) / count + Math.random() * 0.5;
        var sp = 2 + Math.random() * 3.5;
        var life = 38 + Math.random() * 22;
        items.push({ x: x, y: y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 1.5, r: 3 + Math.random() * 4, life: life, max: life, rot: Math.random() * 3, c: colors[i % colors.length] });
      }
      if (!running) { running = true; requestAnimationFrame(loop); }
    }
    resize();
    addEventListener("resize", resize);
    return { burst: burst };
  })();

  /* ---------------- Custom cursor ---------------- */
  (function () {
    document.addEventListener("pointerdown", function (e) {
      if (e.target.closest("input[type=text], textarea")) return;
      sparks.burst(e.clientX, e.clientY);
    });
    if (!finePointer || reduceMotion) return;
    root.classList.add("has-cursor");
    var cursor = $(".cursor"), dot = $(".cursor-dot"), ring = $(".cursor-ring");
    var mx = -100, my = -100, rx = -100, ry = -100;
    addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      mx = e.clientX; my = e.clientY;
      dot.style.transform = "translate3d(" + mx + "px," + my + "px,0)";
      cursor.classList.remove("is-hidden");
    }, { passive: true });
    (function follow() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = "translate3d(" + rx + "px," + ry + "px,0)";
      requestAnimationFrame(follow);
    })();
    document.addEventListener("pointerover", function (e) {
      var t = e.target;
      cursor.classList.toggle("is-text", !!t.closest("input[type=text], textarea"));
      cursor.classList.toggle("is-hover", !!t.closest("a, button, label, .tilt, .chain-link"));
    });
    document.addEventListener("pointerdown", function () { cursor.classList.add("is-down"); });
    document.addEventListener("pointerup", function () { cursor.classList.remove("is-down"); });
    document.addEventListener("pointerleave", function () { cursor.classList.add("is-hidden"); });
  })();

  /* ---------------- Header + scroll progress ---------------- */
  var header = $(".site-header");
  var bar = $(".scroll-progress span");
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 30);
    var max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = "scaleX(" + (max > 0 ? Math.min(1, y / max) : 0) + ")";
  }
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------------- Smooth scroll (Lenis) ---------------- */
  var lenis = null;
  if (window.Lenis && !reduceMotion) {
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
    window.__lenis = lenis;
    if (hasST) {
      lenis.on("scroll", window.ScrollTrigger.update);
      window.gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      window.gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
    }
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute("href");
    var target = id === "#top" ? document.body : document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(id === "#top" ? 0 : target, { offset: -70, duration: 1.4 });
    else target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    if (id !== "#top") {
      var focusEl = target.matches("section") ? target.querySelector("h1, h2") || target : target;
      focusEl.setAttribute("tabindex", "-1");
      focusEl.focus({ preventScroll: true });
    }
    history.replaceState(null, "", id);
  });

  /* ---------------- Reveal on scroll ---------------- */
  if (!reduceMotion && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        var siblings = $$(".reveal", el.parentElement);
        el.style.transitionDelay = Math.min(siblings.indexOf(el), 5) * 80 + "ms";
        el.classList.add("is-in");
        io.unobserve(el);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    $$(".reveal").forEach(function (el) { io.observe(el); });
  } else {
    $$(".reveal").forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------------- Hero: sunrise intro, letter by letter ---------------- */
  var hero = $(".hero");
  var title = $(".hero-title");
  function splitTitle() {
    $$(".line", title).forEach(function (line) {
      var text = line.textContent;
      line.textContent = "";
      Array.prototype.forEach.call(text, function (ch) {
        var s = document.createElement("span");
        s.className = "char";
        s.textContent = ch;
        line.appendChild(s);
      });
    });
    title.classList.add("is-split");
    paintTitle();
  }
  // Give every letter the slice of the gradient it would have had as a whole word
  // (uses layout offsets, so it stays correct while letters are mid-animation)
  function paintTitle() {
    var tw = title.offsetWidth, th = title.offsetHeight, tl = title.offsetLeft, tt = title.offsetTop;
    $$(".char", title).forEach(function (c) {
      c.style.backgroundSize = tw + "px " + th + "px";
      c.style.backgroundPosition = (tl - c.offsetLeft) + "px " + (tt - c.offsetTop) + "px";
    });
  }
  if (!reduceMotion) {
    splitTitle();
    addEventListener("resize", paintTitle);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(paintTitle);
    if (hasGsap) {
      var gsap = window.gsap;
      var tl = gsap.timeline({ delay: 0.35, defaults: { ease: "power3.out" } });
      tl.from(".hero-hi", { y: 20, opacity: 0, duration: 0.8 })
        .from(".hero-title .char", { yPercent: 70, opacity: 0, rotate: 6, duration: 0.9, stagger: 0.06, ease: "back.out(1.8)", clearProps: "transform" }, "-=0.4")
        .from(".hero-sub", { y: 18, opacity: 0, duration: 0.8 }, "-=0.4")
        .from(".hero-actions > *", { y: 16, opacity: 0, duration: 0.7, stagger: 0.1 }, "-=0.5")
        .from(".hero-counter", { y: 12, opacity: 0, duration: 0.6 }, "-=0.4")
        .from(".hero-hint", { opacity: 0, duration: 0.8 }, "-=0.2");
    }
  }

  // The sky follows the mouse, and the sun drifts a little against it
  if (!reduceMotion && finePointer) {
    var sun = $(".hero-sun"), inner = $(".hero-inner");
    var tx = 0, ty = 0, cx = 0, cy = 0, heroVisible = true;
    new IntersectionObserver(function (en) { heroVisible = en[0].isIntersecting; }).observe(hero);
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      hero.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
      hero.style.setProperty("--my", (py * 100).toFixed(1) + "%");
      tx = px - 0.5; ty = py - 0.5;
    });
    (function drift() {
      if (heroVisible) {
        cx += (tx - cx) * 0.06; cy += (ty - cy) * 0.06;
        sun.style.transform = "translate3d(" + (cx * -40).toFixed(2) + "px," + (cy * -20).toFixed(2) + "px,0)";
        inner.style.transform = "translate3d(" + (cx * 14).toFixed(2) + "px," + (cy * 8).toFixed(2) + "px,0)";
      }
      requestAnimationFrame(drift);
    })();
  }

  /* ---------------- Card tilt ---------------- */
  if (!reduceMotion && finePointer) {
    $$(".tilt").forEach(function (card) {
      card.addEventListener("pointerenter", function () { card.style.transition = "transform 0.15s ease-out"; });
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = "perspective(1000px) rotateX(" + (py * -4).toFixed(2) + "deg) rotateY(" + (px * 5).toFixed(2) + "deg) translateY(-3px)";
      });
      card.addEventListener("pointerleave", function () {
        card.style.transition = "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)";
        card.style.transform = "";
      });
    });
  }

  /* ---------------- Journey: a path from night to sunrise ---------------- */
  (function journey() {
    var section = $(".journey");
    var track = $(".journey-track");
    var svg = $(".journey-line");
    var path = $(".journey-path");
    var pathBg = $(".journey-path-bg");
    var items = $$(".milestone", track);
    var spark = $(".milestone.spark", track);
    var length = 0;

    function build() {
      var h = track.offsetHeight;
      var points = items.map(function (li) {
        var cs = getComputedStyle(li, "::before");
        var size = parseFloat(cs.width) || 18;
        return { x: li.offsetLeft + parseFloat(cs.left) + size / 2, y: li.offsetTop + parseFloat(cs.top) + size / 2 };
      });
      var x0 = points[0].x;
      var amp = innerWidth < 600 ? 10 : 18;
      var d = "M " + x0 + " 0";
      var prevY = 0;
      points.forEach(function (p, i) {
        var side = i % 2 === 0 ? 1 : -1;
        d += " Q " + (p.x + side * amp) + " " + ((prevY + p.y) / 2) + " " + p.x + " " + p.y;
        prevY = p.y;
      });
      d += " L " + x0 + " " + h;
      svg.setAttribute("viewBox", "0 0 " + svg.clientWidth + " " + h);
      path.setAttribute("d", d);
      pathBg.setAttribute("d", d);
      length = path.getTotalLength();
      path.style.strokeDasharray = length;
      // move the sunrise in the background to the "I found my passion" moment
      var sparkY = track.offsetTop + spark.offsetTop + spark.offsetHeight / 2;
      section.style.setProperty("--dawn-at", ((sparkY / section.offsetHeight) * 100).toFixed(1) + "%");
    }
    build();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { build(); if (hasST) window.ScrollTrigger.refresh(); });

    if (reduceMotion || !hasST) {
      path.style.strokeDashoffset = 0;
      if ("IntersectionObserver" in window && !reduceMotion) {
        var lit = new IntersectionObserver(function (en) {
          en.forEach(function (e) { if (e.isIntersecting) e.target.classList.add("is-lit"); });
        }, { rootMargin: "0px 0px -35% 0px" });
        items.forEach(function (li) { lit.observe(li); });
      } else {
        items.forEach(function (li) { li.classList.add("is-lit"); });
      }
      addEventListener("resize", build);
      return;
    }

    var ST = window.ScrollTrigger;
    var progress = { v: 0 };
    function draw() { path.style.strokeDashoffset = length * (1 - progress.v); }
    draw();
    ST.create({
      trigger: track,
      start: "top 65%",
      end: "bottom 65%",
      scrub: 0.6,
      onUpdate: function (self) { progress.v = self.progress; draw(); }
    });
    items.forEach(function (li) {
      ST.create({
        trigger: li,
        start: "top 65%",
        onEnter: function () { li.classList.add("is-lit"); },
        onLeaveBack: function () { li.classList.remove("is-lit"); }
      });
    });
    window.gsap.utils.toArray(".milestone, .year", track).forEach(function (el) {
      window.gsap.from(el, { opacity: 0, x: 24, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 85%" } });
    });
    ST.addEventListener("refreshInit", build);
    addEventListener("resize", function () { ST.refresh(); });
  })();

  /* ---------------- The story behind my smile ---------------- */
  (function story() {
    var btn = $(".btn-story");
    var body = $("#story-body");
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      if (open) {
        body.hidden = true;
      } else {
        body.hidden = false;
        if (hasGsap && !reduceMotion) {
          window.gsap.from($$("p", body), { y: 18, opacity: 0, duration: 1, stagger: 0.35, ease: "power3.out" });
          var r = btn.getBoundingClientRect();
          setTimeout(function () { sparks.burst(r.left + r.width / 2, r.top + r.height / 2, 22); }, 50);
        }
      }
      if (hasST) window.ScrollTrigger.refresh();
    });
  })();

  /* ---------------- Kindness chain ---------------- */
  (function chain() {
    var API = (window.CHAIN_API_URL || "").replace(/\/+$/, "");
    var PRESETS = {
      thank: "Thank someone who helped me",
      listen: "Listen to someone without judging",
      message: "Send a kind message to a friend",
      help: "Help a classmate or coworker",
      smile: "Smile at a stranger",
      matter: "Tell someone they matter"
    };
    // The first link of the chain is Osvaldo's own
    var FIRST = { id: "first", name: "Osvaldo", text: "Listen to someone without judging", first: true };
    var PAGE = 24;

    var form = $(".chain-form");
    var nameInput = $("#chain-name");
    var customField = $(".custom-field");
    var customInput = $("#chain-custom");
    var customCount = $(".custom-count");
    var status = $(".form-status");
    var submitBtn = $("button[type=submit]", form);
    var list = $(".chain");
    var moreBtn = $(".chain-more");

    var links = [];      // newest first
    var total = 0;
    var shown = PAGE;
    var mine = JSON.parse(store("myLinkIds") || "[]");

    /* ---- shared validation (the server checks the same rules) ---- */
    var WORDS = ("puta puto putas putos putita putito puton culo culos pito pitos joto jotos zorra zorras perra perras pinche pinches " +
      "mamada mamadas mamon mamona idiota idiotas imbecil imbeciles estupido estupida estupidos polla hdp ptm alv kys " +
      "dick dicks cock cocks slut sluts whore whores retard retards nazi nazis ass pussy bastard bastards panocha ojete " +
      "nalgas verga vergas marica maricas maricon maricones").split(" ");
    var STEMS = ["fuck", "shit", "bitch", "asshole", "cunt", "nigg", "fagg", "motherf", "pendej", "chinga",
      "chingu", "cabron", "culer", "mierd", "gilipoll", "putaz", "punet", "malparid", "hijodeput", "chingad"];
    var SQUASHED = ["fuck", "nigger", "pendejo", "pendeja", "chingada", "mierda", "hijodeputa", "killyourself", "motherfucker"];
    function normalize(s) {
      return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
        .replace(/0/g, "o").replace(/1/g, "i").replace(/3/g, "e").replace(/4/g, "a")
        .replace(/5/g, "s").replace(/7/g, "t").replace(/@/g, "a").replace(/\$/g, "s");
    }
    function isRude(s) {
      var n = normalize(s);
      var tokens = n.split(/[^a-z]+/).filter(Boolean);
      for (var i = 0; i < tokens.length; i++) {
        var t = tokens[i];
        if (WORDS.indexOf(t) !== -1) return true;
        for (var j = 0; j < STEMS.length; j++) if (t.indexOf(STEMS[j]) === 0) return true;
      }
      var squashed = n.replace(/[^a-z]/g, "");
      for (var k = 0; k < SQUASHED.length; k++) if (squashed.indexOf(SQUASHED[k]) !== -1) return true;
      return false;
    }
    var URLISH = /(https?:|www\.|\.(com|net|org|io|xyz|ru|mx|co|info|biz|me|ly|gg|app|dev|site|online|link)\b|@\w|\d{7,})/i;
    var NAME_RE = /^[\p{L}][\p{L}\p{M} .'\-]{0,29}$/u;

    function validate(name, actionId, custom) {
      if (!name) return { field: nameInput, msg: "Add your first name so your link has an owner." };
      if (!NAME_RE.test(name)) return { field: nameInput, msg: "Use only letters in your name, up to 30 characters." };
      if (isRude(name)) return { field: nameInput, msg: "That name can't go on the chain. Try your first name." };
      if (actionId === "custom") {
        if (custom.length < 3) return { field: customInput, msg: "Write your kind action, at least 3 characters." };
        if (URLISH.test(custom)) return { field: customInput, msg: "Links, emails and phone numbers can't go on the chain." };
        if (isRude(custom)) return { field: customInput, msg: "Keep it kind, please. Try different words." };
      } else if (!PRESETS[actionId]) {
        return { field: null, msg: "Pick one of the kind actions." };
      }
      return null;
    }

    /* ---- rendering ---- */
    function setCount(n) {
      $$(".chain-count").forEach(function (el) {
        var from = parseInt(el.textContent, 10) || 0;
        if (!hasGsap || reduceMotion || from === n) { el.textContent = n; return; }
        var o = { v: from };
        window.gsap.to(o, { v: n, duration: 1.2, ease: "power2.out", onUpdate: function () { el.textContent = Math.round(o.v); } });
      });
      $$(".chain-count-label").forEach(function (el) { el.textContent = n === 1 ? "kind action" : "kind actions"; });
    }
    function linkEl(l) {
      var li = document.createElement("li");
      li.className = "chain-link" + (mine.indexOf(l.id) !== -1 || l.local ? " is-mine" : "") + (l.first ? " is-first" : "");
      li.style.setProperty("--d", (-Math.random() * 6).toFixed(2) + "s");
      var who = document.createElement("p");
      who.className = "chain-name";
      who.textContent = l.name;
      var what = document.createElement("p");
      what.className = "chain-text";
      what.textContent = l.text;
      li.title = (l.first ? "Osvaldo" : l.name) + ": " + l.text;
      li.appendChild(who);
      li.appendChild(what);
      return li;
    }
    function render() {
      list.textContent = "";
      var all = links.concat([FIRST]);
      all.slice(0, shown).forEach(function (l) { list.appendChild(linkEl(l)); });
      moreBtn.hidden = all.length <= shown;
      setCount(total + 1);
      if (hasST) window.ScrollTrigger.refresh();
    }
    moreBtn.addEventListener("click", function () { shown += PAGE; render(); });

    function addToTop(l) {
      links.unshift(l);
      total += 1;
      var el = linkEl(l);
      list.insertBefore(el, list.firstChild);
      setCount(total + 1);
      if (hasGsap && !reduceMotion) {
        window.gsap.from(el, { y: -90, rotate: -10, opacity: 0, duration: 1.1, ease: "bounce.out" });
        setTimeout(function () {
          var r = el.getBoundingClientRect();
          sparks.burst(r.left + r.width / 2, r.top + r.height / 2, 24);
        }, 650);
      }
      if (hasST) window.ScrollTrigger.refresh();
    }

    /* ---- local preview storage (used when the API isn't set or can't be reached) ---- */
    function localLinks() { try { return JSON.parse(store("localLinks") || "[]"); } catch (e) { return []; } }
    function saveLocal(l) { var arr = localLinks(); arr.unshift(l); store("localLinks", JSON.stringify(arr.slice(0, 20))); }

    /* ---- load ---- */
    function load() {
      if (!API) {
        links = localLinks();
        total = links.length;
        render();
        return;
      }
      fetch(API + "/links", { headers: { Accept: "application/json" } })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (data) {
          links = (data.links || []).concat(localLinks());
          total = (typeof data.count === "number" ? data.count : (data.links || []).length) + localLinks().length;
          render();
        })
        .catch(function () {
          links = localLinks();
          total = links.length;
          render();
        });
    }
    load();

    /* ---- form behaviour ---- */
    form.addEventListener("change", function (e) {
      if (e.target.name !== "action") return;
      var own = e.target.value === "custom";
      customField.hidden = !own;
      if (own) customInput.focus();
    });
    customInput.addEventListener("input", function () { customCount.textContent = customInput.value.length; });
    [nameInput, customInput].forEach(function (inp) {
      inp.addEventListener("input", function () { inp.removeAttribute("aria-invalid"); });
    });

    function say(msg, isError) {
      status.textContent = msg;
      status.classList.toggle("is-error", !!isError);
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = nameInput.value.trim().replace(/\s+/g, " ");
      var actionId = (form.querySelector("input[name=action]:checked") || {}).value;
      var custom = customInput.value.trim().replace(/\s+/g, " ");
      var problem = validate(name, actionId, custom);
      if (problem) {
        say(problem.msg, true);
        if (problem.field) { problem.field.setAttribute("aria-invalid", "true"); problem.field.focus(); }
        return;
      }
      var text = actionId === "custom" ? custom : PRESETS[actionId];
      var payload = { name: name, actionId: actionId === "custom" ? null : actionId, customText: actionId === "custom" ? custom : null };

      function done(link, localOnly) {
        addToTop(link);
        say(localOnly
          ? "Your link is on the chain on this device. The shared chain will show it once it's connected."
          : "Your link is on the chain. Thank you, " + name + ".");
        customInput.value = ""; customCount.textContent = "0";
      }

      if (!API) {
        var local = { id: "local-" + Date.now(), name: name, text: text, local: true };
        saveLocal(local);
        done(local, true);
        return;
      }

      submitBtn.disabled = true;
      say("Adding your link…");
      fetch(API + "/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (r) {
          return r.json().catch(function () { return {}; }).then(function (data) { return { ok: r.ok, status: r.status, data: data }; });
        })
        .then(function (res) {
          if (res.ok && res.data.link) {
            mine.push(res.data.link.id);
            store("myLinkIds", JSON.stringify(mine.slice(-20)));
            done(res.data.link, false);
          } else if (res.status === 429) {
            say("You just added a link. Wait a minute, then add another.", true);
          } else {
            say(res.data.message || "That link couldn't be added. Check your name and action, then try again.", true);
          }
        })
        .catch(function () {
          var local = { id: "local-" + Date.now(), name: name, text: text, local: true };
          saveLocal(local);
          done(local, true);
        })
        .then(function () { submitBtn.disabled = false; });
    });
  })();
})();
