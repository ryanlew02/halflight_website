/* HalfLight marketing site — small progressive-enhancement layer.
   Mirrors the app's NightSkyBackground: a sparse, deterministic star field
   plus gentle scroll reveals and nav behavior. No dependencies. */

(function () {
  "use strict";

  // Signal that JS is active so reveal styles apply (see styles.css).
  document.documentElement.classList.add("js");

  /* ---------- Current year in footer ---------- */
  var yr = document.getElementById("year");
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- Nav: shadow on scroll + mobile toggle ---------- */
  var nav = document.getElementById("nav");
  var toggle = document.getElementById("navToggle");
  var links = document.getElementById("navLinks");

  function onScroll() {
    if (window.scrollY > 12) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (toggle && links) {
    toggle.addEventListener("click", function () {
      links.classList.toggle("open");
    });
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") links.classList.remove("open");
    });
  }

  /* ---------- Activity heatmap (decorative, deterministic) ---------- */
  var heat = document.getElementById("heat");
  if (heat) {
    var seed = 7;
    function rnd() { // small LCG so the grid is stable, not random per load
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    }
    var frag = document.createDocumentFragment();
    for (var i = 0; i < 70; i++) {
      var cell = document.createElement("i");
      var r = rnd();
      if (r > 0.86) cell.className = "l3";
      else if (r > 0.66) cell.className = "l2";
      else if (r > 0.42) cell.className = "l1";
      frag.appendChild(cell);
    }
    heat.appendChild(frag);
  }

  /* ---------- Scroll reveal ---------- */
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var revealEls = document.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });

    // Safety net: if anything hasn't revealed shortly after load (e.g. the
    // page opened at a deep anchor and some elements never intersected),
    // reveal it so content is never stuck hidden.
    setTimeout(function () {
      revealEls.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add("in");
      });
    }, 1200);
  }

  /* ---------- Star field on canvas (mirrors NightSkyBackground) ---------- */
  var canvas = document.querySelector(".stars");
  if (canvas && !reduce) {
    var ctx = canvas.getContext("2d");
    var stars = [];
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    // palette echoes the app's accents
    var palette = ["#F4ECDD", "#F4ECDD", "#F4ECDD", "#E8A95C", "#D98B6B"];

    function build() {
      var w = window.innerWidth, h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var count = Math.round((w * h) / 16000); // density scales with viewport
      count = Math.max(40, Math.min(140, count));
      stars = [];
      for (var i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1.1 + 0.4,
          base: Math.random() * 0.3 + 0.18,
          amp: Math.random() * 0.25 + 0.05,
          phase: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.0012 + 0.0004,
          color: palette[(Math.random() * palette.length) | 0]
        });
      }
    }

    function draw(t) {
      var w = canvas.width / dpr, h = canvas.height / dpr;
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var tw = s.base + s.amp * Math.sin(t * s.speed + s.phase);
        ctx.globalAlpha = Math.max(0, Math.min(1, tw));
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(draw);
    }

    build();
    requestAnimationFrame(draw);

    var rsz;
    window.addEventListener("resize", function () {
      clearTimeout(rsz);
      rsz = setTimeout(build, 200);
    });
  }
})();
