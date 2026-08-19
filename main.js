/* ============================================================
   ulutas.co
   Progressive enhancement only. The page is fully readable
   with JavaScript disabled.
   ============================================================ */
(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer  = window.matchMedia('(hover: hover) and (pointer: fine)');

  /* ---------- 1. avatar fallback ----------
     No photo at assets/avatar.jpg yet: fall back to the monogram tile. */
  const avatar = document.getElementById('avatar-img');
  if (avatar) {
    const drop = () => avatar.remove();
    if (avatar.complete && avatar.naturalWidth === 0) drop();
    else avatar.addEventListener('error', drop, { once: true });
  }

  /* ---------- 2. scroll reveal ----------
     IntersectionObserver, not a scroll listener. Staggers each
     entry as the timeline comes into view. */
  const items = document.querySelectorAll('.timeline > li, .foot');
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    items.forEach((el, i) => {
      el.classList.add('reveal');
      el.style.setProperty('--i', String(i % 6));
    });
    const io = new IntersectionObserver((entries, obs) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('is-in');
        obs.unobserve(e.target);
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    items.forEach(el => io.observe(el));
  }

  /* ---------- 3. starfield ----------
     Multi-spectral, layered starfield with natural stellar temperatures:
     diamond white, stellar blue, pale amber, golden yellow, soft rose, and subtle aurora mint.
     Twinkles independently and drifts with subtle pointer parallax. */
  const canvas = document.getElementById('stars');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  const STAR_PALETTES = [
    { rgb: '245, 248, 255', glow: '210, 230, 255', weight: 40 }, // Crisp Diamond White
    { rgb: '180, 215, 255', glow: '150, 195, 255', weight: 22 }, // Celestial Blue
    { rgb: '145, 185, 255', glow: '120, 170, 255', weight: 12 }, // Deep Star Blue
    { rgb: '255, 232, 185', glow: '255, 215, 150', weight: 14 }, // Pale Amber / Solar Warmth
    { rgb: '255, 195, 140', glow: '255, 170, 110', weight: 6  }, // Soft Golden Orange
    { rgb: '255, 165, 150', glow: '255, 135, 120', weight: 3  }, // Gentle Red Giant
    { rgb: '160, 245, 210', glow: '110, 235, 185', weight: 3  }  // Subtle Mint Star
  ];

  const TOTAL_WEIGHT = STAR_PALETTES.reduce((sum, p) => sum + p.weight, 0);

  function pickColor() {
    let r = Math.random() * TOTAL_WEIGHT;
    for (const p of STAR_PALETTES) {
      if (r < p.weight) return p;
      r -= p.weight;
    }
    return STAR_PALETTES[0];
  }

  const LAYERS = [
    { count: 0.50, r: [0.25, 0.55], a: [0.15, 0.38], speed: 0.007, depth: 4  }, // Background star dust
    { count: 0.32, r: [0.55, 0.90], a: [0.30, 0.65], speed: 0.015, depth: 10 }, // Mid-range stars
    { count: 0.14, r: [0.90, 1.40], a: [0.50, 0.90], speed: 0.026, depth: 18 }, // Bright foreground stars
    { count: 0.04, r: [1.40, 2.10], a: [0.70, 0.98], speed: 0.038, depth: 28 }  // Hero glowing stars
  ];

  let stars = [], w = 0, h = 0, dpr = 1, raf = 0, last = 0;
  const ptr = { x: 0, y: 0, tx: 0, ty: 0 };

  const rand = (min, max) => min + Math.random() * (max - min);

  function build() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width  = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const total = Math.round((w * h) / 3200);
    stars = [];
    for (const L of LAYERS) {
      const n = Math.round(total * L.count);
      for (let i = 0; i < n; i++) {
        const color = pickColor();
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: rand(L.r[0], L.r[1]),
          a: rand(L.a[0], L.a[1]),
          speed: L.speed,
          depth: L.depth,
          rgb: color.rgb,
          glow: color.glow,
          phase: Math.random() * Math.PI * 2,
          twinkle: rand(0.12, 0.45),
          rate: rand(0.30, 1.20)
        });
      }
    }
  }

  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    ptr.x += (ptr.tx - ptr.x) * 0.045;
    ptr.y += (ptr.ty - ptr.y) * 0.045;

    for (const s of stars) {
      const alpha = Math.max(0, s.a * (1 - s.twinkle + s.twinkle * Math.sin(s.phase + t * s.rate)));
      const x = s.x + ptr.x * s.depth;
      const y = s.y + ptr.y * s.depth;

      // Soft colored atmospheric halo for larger/brighter stars
      if (s.r > 0.85) {
        const g = ctx.createRadialGradient(x, y, 0, x, y, s.r * 4.5);
        g.addColorStop(0, `rgba(${s.glow},${alpha * 0.45})`);
        g.addColorStop(1, `rgba(${s.glow},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, s.r * 4.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Star core
      ctx.fillStyle = `rgba(${s.rgb},${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function frame(now) {
    const t = now / 1000;
    const dt = Math.min(now - last, 48);
    last = now;
    for (const s of stars) {
      s.y -= s.speed * dt * 0.06;
      if (s.y < -4) { s.y = h + 4; s.x = Math.random() * w; }
    }
    draw(t);
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (raf) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    if (!raf) return;
    cancelAnimationFrame(raf);
    raf = 0;
  }

  function boot() {
    build();
    stop();
    if (reduceMotion.matches) draw(0);
    else start();
  }

  boot();

  /* resize: rebuild on a debounce (ResizeObserver, no scroll/resize thrash) */
  let rzT = 0;
  const ro = new ResizeObserver(() => {
    clearTimeout(rzT);
    rzT = setTimeout(boot, 180);
  });
  ro.observe(canvas);

  if (finePointer.matches) {
    window.addEventListener('pointermove', e => {
      ptr.tx = (e.clientX / w - 0.5) * -1;
      ptr.ty = (e.clientY / h - 0.5) * -1;
    }, { passive: true });
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (!reduceMotion.matches) start();
  });

  reduceMotion.addEventListener('change', boot);
})();

/* ---------- 4. bio read more toggle (mobile) ---------- */
(() => {
  const toggle = document.getElementById('bio-toggle');
  const more = document.getElementById('bio-more');
  if (!toggle || !more) return;

  toggle.addEventListener('click', () => {
    const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', !isExpanded);
    more.classList.toggle('is-open', !isExpanded);
    const span = toggle.querySelector('span');
    if (span) {
      span.textContent = isExpanded ? 'read more' : 'read less';
    }
  });
})();
