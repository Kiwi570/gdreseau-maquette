/* GD Réseau — comportements communs et propres à chaque page */
import { createConstellation, METIERS } from './constellation.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const html = document.documentElement;
const page = document.body.dataset.page;
const calm = html.classList.contains('is-calm');
const mobile = matchMedia('(max-width: 900px)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const params = new URLSearchParams(location.search);
const ss = {
  get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} },
  del(k) { try { sessionStorage.removeItem(k); } catch (e) {} },
};

const { gsap } = window;
const ScrollTrigger = window.ScrollTrigger;
gsap.registerPlugin(ScrollTrigger, window.SplitText, window.DrawSVGPlugin);
if (calm) gsap.globalTimeline.timeScale(1);

/* ---------------- visuels provisoires ---------------- */
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
/* affiche typographique en attendant le vrai film Wopé */
let posterN = 0;
function paintPoster(el) {
  const id = 'pf' + (posterN++);
  el.classList.add('ph--poster');
  let stars = '';
  const r = rng(7 + posterN);
  for (let i = 0; i < 70; i++) {
    stars += `<circle cx="${(r() * 800).toFixed(1)}" cy="${(48 + r() * 354).toFixed(1)}" r="${(0.5 + r() * 1.4).toFixed(2)}" fill="${r() < 0.35 ? '#1db5d5' : '#eef2f8'}" opacity="${(0.25 + r() * 0.6).toFixed(2)}"/>`;
  }
  el.innerHTML = `<svg viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs><radialGradient id="${id}" cx="72%" cy="30%" r="70%"><stop offset="0" stop-color="#1db5d5" stop-opacity=".35"/><stop offset=".6" stop-color="#2a2650" stop-opacity=".25"/><stop offset="1" stop-color="#0e0c24" stop-opacity="0"/></radialGradient></defs>
    <rect width="800" height="450" fill="#0b0a1d"/><rect width="800" height="450" fill="url(#${id})"/>
    ${stars}
    <rect x="0" y="0" width="800" height="48" fill="#000" opacity=".9"/><rect x="0" y="402" width="800" height="48" fill="#000" opacity=".9"/>
    <text x="120" y="31" font-family="Manrope, sans-serif" font-size="15" font-weight="700" fill="#ff6b57" letter-spacing="1">00:00:00:00</text>
    <text x="116" y="248" font-family="Unbounded, sans-serif" font-size="124" font-weight="600" fill="#eef2f8" letter-spacing="-7">Wopé</text>
    <text x="122" y="294" font-family="Manrope, sans-serif" font-size="22" font-weight="600" fill="#1db5d5">Un film pour Sémittel, avec Yello</text>
    <text x="122" y="370" font-family="Manrope, sans-serif" font-size="17" font-weight="700" fill="#eef2f8" opacity=".8">3e prix, catégorie Films, Creatives 2021</text>
    <g transform="translate(620 225)"><circle r="44" fill="none" stroke="#eef2f8" stroke-opacity=".8" stroke-width="2"/><path d="M-11 -19 L21 0 L-11 19 Z" fill="#eef2f8"/></g>
  </svg><span class="ph-cap">Affiche provisoire : le film sera fourni par le client</span>`;
}
function paintPlaceholders() {
  $$('.ph').forEach((el) => {
    if (el.dataset.painted) return;
    el.dataset.painted = '1';
    const name = (mobile && el.dataset.phM) || el.dataset.ph || 'visuel';
    const kind = el.dataset.phKind || '';
    if (kind === 'film') { paintPoster(el); return; }
    const r = rng(hash(name));
    const id = 'g' + hash(name).toString(36);
    const gx = (20 + r() * 60).toFixed(0), gy = (15 + r() * 50).toFixed(0);
    let dots = '', lines = '';
    const n = kind === 'ciel' ? 160 : 34 + Math.floor(r() * 18);
    const pts = [];
    for (let i = 0; i < n; i++) {
      const x = r() * 400, y = kind === 'ciel' ? r() * 270 : r() * 400;
      const s = kind === 'ciel' ? 0.4 + r() * 1.1 : 0.8 + r() * 2.2;
      pts.push([x, y]);
      dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${s.toFixed(2)}" fill="${r() < 0.3 ? '#1db5d5' : '#eef2f8'}" opacity="${(0.35 + r() * 0.6).toFixed(2)}"/>`;
    }
    if (kind !== 'ciel') {
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]);
          if (d < 70) lines += `<line x1="${pts[i][0].toFixed(1)}" y1="${pts[i][1].toFixed(1)}" x2="${pts[j][0].toFixed(1)}" y2="${pts[j][1].toFixed(1)}" stroke="#1db5d5" stroke-opacity="${(0.5 * (1 - d / 70)).toFixed(2)}" stroke-width=".6"/>`;
        }
      }
    }
    const hx = 200 + (r() - 0.5) * 160, hy = 200 + (r() - 0.5) * 160, hs = 60 + r() * 90, rot = r() * 60;
    const hex = Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i + Math.PI / 6;
      return `${(hx + Math.cos(a) * hs).toFixed(1)},${(hy + Math.sin(a) * hs).toFixed(1)}`;
    }).join(' ');
    let extra = '';
    if (kind === 'ciel') {
      extra = `<rect x="0" y="268" width="400" height="132" fill="#0b0a1d"/><ellipse cx="200" cy="270" rx="260" ry="10" fill="url(#h${id})"/>`;
    }
    if (kind === 'film') {
      extra = `<rect x="0" y="0" width="400" height="44" fill="#000" opacity=".85"/><rect x="0" y="356" width="400" height="44" fill="#000" opacity=".85"/><circle cx="200" cy="200" r="34" fill="none" stroke="#eef2f8" stroke-opacity=".7"/><path d="M190 184 L216 200 L190 216 Z" fill="#eef2f8" fill-opacity=".85"/>`;
    }
    const cap = el.closest('.backdrop')
      ? ''
      : `<span class="ph-cap">${kind === 'film' ? 'Film Wopé à fournir par le client' : 'Visuel provisoire, image à venir : ' + name}</span>`;
    el.innerHTML = `<svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <radialGradient id="${id}" cx="${gx}%" cy="${gy}%" r="75%"><stop offset="0" stop-color="#1db5d5" stop-opacity="${kind === 'ciel' ? 0.22 : 0.42}"/><stop offset=".55" stop-color="#2a2650" stop-opacity=".35"/><stop offset="1" stop-color="#0e0c24" stop-opacity="0"/></radialGradient>
        <radialGradient id="c${id}" cx="${(100 - gx)}%" cy="${(100 - gy * 0.6).toFixed(0)}%" r="40%"><stop offset="0" stop-color="#ff6b57" stop-opacity=".22"/><stop offset="1" stop-color="#ff6b57" stop-opacity="0"/></radialGradient>
        <radialGradient id="h${id}"><stop offset="0" stop-color="#1db5d5" stop-opacity=".55"/><stop offset="1" stop-color="#1db5d5" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="400" height="400" fill="url(#${id})"/><rect width="400" height="400" fill="url(#c${id})"/>
      ${kind === 'ciel' ? '' : `<polygon points="${hex}" fill="none" stroke="#eef2f8" stroke-opacity=".08" stroke-width="1.2" transform="rotate(${rot.toFixed(0)} ${hx.toFixed(0)} ${hy.toFixed(0)})"/>`}
      ${lines}${dots}${extra}
    </svg>${cap}`;
  });
}

/* ---------------- horloges ---------------- */
const fmtCache = {};
const fmtTime = (tz) => (fmtCache[tz] ||= new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: tz })).format(new Date());
function reunionHour() {
  const p = new Intl.DateTimeFormat('fr-FR', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Indian/Reunion' }).format(new Date());
  return parseInt(p, 10);
}
function tickClocks() {
  $$('[data-clock]').forEach((t) => { t.textContent = fmtTime(t.dataset.clock); });
  const h = reunionHour();
  const open = h >= 9 && h < 17;
  $$('[data-open]').forEach((el) => {
    el.classList.toggle('is-open', open);
    el.textContent = open ? 'Dans les horaires du siège : 9h – 17h, heure de La Réunion' : 'Hors des horaires du siège : 9h – 17h, heure de La Réunion';
    el.title = 'Jours d’ouverture à confirmer.';
  });
}

/* ---------------- défilement fluide ---------------- */
let lenis = null;
if (!calm && window.Lenis) {
  lenis = new window.Lenis({ lerp: 0.095, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
let keepHeaderUntil = 0;
function scrollToTarget(target, immediate = false, focus = false) {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) return;
  keepHeaderUntil = performance.now() + (immediate ? 400 : 1900);
  header?.classList.remove('is-hidden');
  const off = -(parseFloat(getComputedStyle(html).getPropertyValue('--header-h')) || 70) - 8;
  if (lenis) lenis.scrollTo(el, { offset: el.id === 'contenu' || el.id === 'intro' ? 0 : off, duration: immediate ? 0 : 1.5, immediate });
  else el.scrollIntoView({ behavior: calm || immediate ? 'auto' : 'smooth' });
  if (focus) {
    if (!el.matches('a, button, input, textarea, select, [tabindex]')) el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  }
}

/* ---------------- en-tête et menu ---------------- */
const header = $('.site-header');
const menu = $('#menu');
const menuBtn = $('.menu-toggle');
let menuOpen = false;
function setMenu(open) {
  if (!menu) return;
  menuOpen = open;
  menu.hidden = !open;
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.textContent = open ? 'Fermer' : 'Menu';
  document.body.style.overflow = open ? 'hidden' : '';
  $$('main, .site-footer, .site-header .brand').forEach((el) => { el.inert = open; });
  if (lenis) open ? lenis.stop() : lenis.start();
  const links = $$('nav a', menu);
  if (open && !calm) gsap.fromTo(links, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: 0.05, duration: 0.6, ease: 'power3.out', overwrite: true });
  else gsap.set(links, { clearProps: 'opacity,transform' });
  if (open) links[0]?.focus();
}
matchMedia('(min-width: 901px)').addEventListener('change', (e) => { if (e.matches && menuOpen) setMenu(false); });
menuBtn?.addEventListener('click', () => setMenu(!menuOpen));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOpen) { setMenu(false); menuBtn.focus(); } });

ScrollTrigger.create({
  start: 0, end: 'max',
  onUpdate(self) {
    const y = self.scroll();
    header.classList.toggle('is-scrolled', y > 30);
    header.classList.toggle('is-hidden', !menuOpen && performance.now() > keepHeaderUntil && self.direction === 1 && y > 520);
  },
});

/* ---------------- préférence d'animation ---------------- */
$$('.calm-toggle').forEach((b) => {
  b.setAttribute('aria-pressed', String(calm));
  b.addEventListener('click', () => {
    try {
      localStorage.setItem('gd-anim', calm ? 'normal' : 'calme');
    } catch (e) {}
    location.reload();
  });
});

/* ---------------- constellation ---------------- */
const C = createConstellation({
  canvas: $('#constellation'),
  labelsEl: $('#constellation-labels'),
  reduced: calm,
  force2D: params.has('nowebgl'),
  mobile: matchMedia('(max-width: 760px)').matches,
});
html.dataset.renderer = C.renderer;
const canvasEl = $('#constellation');

const rectAnchor = (el) => {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, r: Math.min(r.width, r.height) / 2 };
};
const pointOf = (el) => {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};

let teamActive = [];
let currentScene = null;
const backdropItems = $$('.backdrop-item');
function setBackdrop(key) {
  backdropItems.forEach((it) => {
    const on = it.dataset.backdrop === key;
    if (calm) { it.style.opacity = on ? 1 : 0; return; }
    gsap.to(it, { opacity: on ? 1 : 0, duration: 1.1, ease: 'power2.out', overwrite: true });
  });
}
let introRunning = false;
function applyScene(section, force = false) {
  if (!section || (currentScene === section && !force)) return;
  currentScene = section;
  const scene = section.dataset.scene;
  setBackdrop(section.dataset.backdropKey || null);
  if (introRunning) return;
  gsap.to(canvasEl, { opacity: scene === 'hide' ? 0 : 1, duration: calm ? 0 : 0.6, overwrite: true });
  if (scene === 'sky') C.setLayout('sky', { dim: 1, labels: 0 });
  else if (scene === 'sky-quiet') C.setLayout('sky', { dim: 0.7, labels: 0 });
  else if (scene === 'dim') C.setLayout('sky', { dim: 0.4, labels: 0 });
  else if (scene === 'hide') C.setLayout('sky', { dim: 0, labels: 0 });
  else if (scene === 'team') {
    const anchorEl = $('[data-anchor="team"]', section);
    C.setLayout('team', { anchor: () => rectAnchor(anchorEl), active: teamActive, labels: 1 });
  } else if (scene === 'rives') {
    const a = $('.pt-paris .map-pt', section), b = $('.pt-reunion .map-pt', section);
    C.setLayout('rives', { a: () => pointOf(a), b: () => pointOf(b), labels: 0 });
  } else if (scene === 'converge') {
    const el = $('[data-anchor="converge"]', section);
    C.setLayout('converge', {
      labels: 0,
      anchor: () => {
        const r = el.getBoundingClientRect();
        const ry = r.height / 2 + (mobile ? 36 : 60);
        const rx = r.width / 2 + (mobile ? 10 : 70);
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, r: ry, ex: rx / ry };
      },
    });
  }
}
function setTeam(list) {
  teamActive = list;
  C.setActive(list);
}
function bindScenes() {
  const sections = $$('[data-scene]');
  sections.forEach((s, i) => {
    ScrollTrigger.create({
      trigger: s,
      start: i === 0 ? 'top top' : 'top 55%',
      end: 'bottom 45%',
      onToggle: (self) => { if (self.isActive) applyScene(s); },
    });
  });
  // scène de départ
  const y = window.scrollY + innerHeight * 0.5;
  const first = sections.find((s) => s.offsetTop <= y && s.offsetTop + s.offsetHeight > y) || sections[0];
  applyScene(first);
}

/* ---------------- curseur, aimants, inclinaisons ---------------- */
function initPointer() {
  if (!finePointer || calm) return;
  html.classList.add('has-cursor');
  const cur = $('.cursor'), dot = $('.cursor-dot', cur), line = $('.cursor-tether line', cur);
  const qx = gsap.quickTo(dot, 'x', { duration: 0.16, ease: 'power3' });
  const qy = gsap.quickTo(dot, 'y', { duration: 0.16, ease: 'power3' });
  let mx = -200, my = -200, lastMove = 0;
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    mx = e.clientX; my = e.clientY; qx(mx); qy(my); lastMove = performance.now();
  }, { passive: true });
  window.addEventListener('scroll', () => { lastMove = performance.now(); }, { passive: true });
  document.addEventListener('pointerover', (e) => {
    cur.classList.toggle('is-hover', !!e.target.closest('a, button, [role="button"], .choice, .slot, [tabindex="0"]'));
  });
  const mags = $$('[data-magnetic]').map((el) => ({
    el,
    x: gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.45)' }),
    y: gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.45)' }),
  }));
  gsap.ticker.add(() => {
    if (performance.now() - lastMove > 900) return;
    let best = null, bd = 150;
    for (const m of mags) {
      const r = m.el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight || r.width === 0) continue;
      const cx = r.left + r.width / 2 - (gsap.getProperty(m.el, 'x') || 0);
      const cy = r.top + r.height / 2 - (gsap.getProperty(m.el, 'y') || 0);
      const dx = mx - cx, dy = my - cy;
      const reach = Math.max(r.width, r.height) / 2;
      const d = Math.max(0, Math.hypot(dx, dy) - reach);
      if (d < 70) { m.x(dx * 0.22); m.y(dy * 0.32); } else { m.x(0); m.y(0); }
      if (d < bd) { bd = d; best = { cx, cy }; }
    }
    if (best && bd > 2) {
      line.setAttribute('x1', mx); line.setAttribute('y1', my);
      line.setAttribute('x2', best.cx); line.setAttribute('y2', best.cy);
      cur.classList.add('is-near');
    } else cur.classList.remove('is-near');
  });
  $$('[data-tilt], .plaque').forEach((el) => {
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'power3' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: 'power3' });
    gsap.set(el, { transformPerspective: 900 });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      ry(px * 14); rx(-py * 12);
    });
    el.addEventListener('pointerleave', () => { rx(0); ry(0); });
  });
}

/* ---------------- transitions de page ---------------- */
const veil = $('.veil');
const norm = (p) => (p.replace(/index\.html$/, '').replace(/\.html$/, '').replace(/\/$/, '') || '/');
function leaveTo(url, x, y) {
  ss.set('gd-transition', '1');
  C.setLayout('point', { anchor: { x, y } });
  gsap.to(veil, { scaleY: 1, transformOrigin: '50% 100%', duration: 0.65, ease: 'power3.inOut', onComplete: () => { location.href = url; } });
}
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href]');
  if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  if (a.target === '_blank' || a.hasAttribute('download')) return;
  const u = new URL(a.getAttribute('href'), location.href);
  if (!/^https?:$/.test(u.protocol) && u.protocol !== 'file:') return;
  const same = u.origin === location.origin && norm(u.pathname) === norm(location.pathname);
  if (same && u.hash) {
    e.preventDefault();
    if (menuOpen) setMenu(false);
    scrollToTarget(u.hash, false, true);
    history.replaceState(null, '', u.hash);
    return;
  }
  if (same) {
    e.preventDefault();
    if (menuOpen) setMenu(false);
    const t = page === 'rencontrer' ? $('#brief-sec') : $('#contenu');
    scrollToTarget(t, false, true);
    return;
  }
  if (u.origin !== location.origin || location.protocol === 'file:' || calm) return;
  e.preventDefault();
  if (menuOpen) setMenu(false);
  leaveTo(u.href, e.clientX || innerWidth / 2, e.clientY || innerHeight / 2);
});
window.addEventListener('pageshow', (e) => {
  if (e.persisted) { gsap.set(veil, { scaleY: 0 }); html.classList.remove('is-arriving'); }
});
function arrive() {
  if (!html.classList.contains('is-arriving')) return false;
  ss.del('gd-transition');
  gsap.set(veil, { scaleY: 1 });
  html.classList.remove('is-arriving');
  if (calm) { gsap.set(veil, { scaleY: 0 }); return true; }
  C.setLayout('point', { anchor: { x: innerWidth / 2, y: innerHeight / 2 } });
  C.snap();
  gsap.to(veil, { scaleY: 0, transformOrigin: '50% 0%', duration: 0.8, ease: 'power3.inOut', delay: 0.05 });
  return true;
}

/* ---------------- révélations communes ---------------- */
function reveals() {
  if (calm) {
    $$('[data-count]').forEach((el) => { el.textContent = new Intl.NumberFormat('fr-FR').format(+el.dataset.count); });
    return;
  }
  $$('[data-split]').forEach((el) => {
    const split = new window.SplitText(el, { type: 'lines', mask: 'lines', linesClass: 'split-line', aria: 'none' });
    gsap.from(split.lines, {
      yPercent: 105, duration: 1.1, ease: 'power4.out', stagger: 0.09,
      scrollTrigger: { trigger: el, start: 'top 86%', once: true },
    });
  });
  $$('[data-reveal]').forEach((el) => {
    gsap.to(el, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });
  const wipes = $$('[data-wipe]');
  ScrollTrigger.batch(wipes, {
    start: 'top 88%', once: true,
    onEnter: (b) => gsap.to(b, { clipPath: 'inset(0 0% 0 0)', duration: 1.3, ease: 'power4.inOut', stagger: 0.12 }),
  });
  $$('[data-parallax]').forEach((el) => {
    gsap.to(el, { yPercent: +el.dataset.parallax, ease: 'none', scrollTrigger: { trigger: el.closest('section') || el, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  $$('[data-count]').forEach((el) => {
    const end = +el.dataset.count, nf = new Intl.NumberFormat('fr-FR');
    const o = { v: 0 };
    el.textContent = '0';
    gsap.to(o, {
      v: end, duration: 2.2, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      onUpdate: () => { el.textContent = nf.format(Math.round(o.v)); },
    });
  });
}

/* ---------------- compte à rebours de pellicule ---------------- */
function leader(el, onDone) {
  if (!el) return;
  const num = $('.leader-n', el), sup = $('.prix-sup', el);
  const text = el.parentElement.querySelector('.prix-text');
  const finish = () => {
    num.textContent = '3';
    gsap.set(el, { '--sweep': '360deg' });
    gsap.to(sup, { opacity: 1, duration: 0.5 });
    if (text) gsap.to(text, { opacity: 1, duration: 0.9, ease: 'power3.out' });
    onDone && onDone();
  };
  if (calm) { finish(); return; }
  let n = 8;
  num.textContent = '8';
  gsap.set(el, { '--sweep': '0deg' });
  ScrollTrigger.create({
    trigger: el, start: 'top 80%', once: true,
    onEnter: () => {
      gsap.fromTo(el, { '--sweep': '0deg' }, {
        '--sweep': '360deg', duration: 0.44, ease: 'none', repeat: 5,
        onRepeat: () => { n -= 1; num.textContent = String(n); },
        onComplete: finish,
      });
    },
  });
}

/* ================= ACCUEIL ================= */
function home() {
  // ouverture
  const t1 = $('.hero-title .t1'), t2 = $('.hero-title .t2');
  const heroBits = $$('[data-hero]');
  const word = $('.intro-word');
  const arrived = arrive();
  if (calm) {
    C.setLayout('sky', { dim: 1, labels: 0 });
  } else {
    const s1 = new window.SplitText(t1, { type: 'chars', aria: 'none' });
    const s2 = new window.SplitText(t2, { type: 'chars', aria: 'none' });
    gsap.set([s1.chars, s2.chars], { yPercent: 115 });
    gsap.set(heroBits, { opacity: 0, y: 24 });
    const reveal = () => {
      const tl = gsap.timeline();
      tl.to(s1.chars, { yPercent: 0, duration: 1.05, ease: 'power4.out', stagger: 0.035 })
        .to(s2.chars, { yPercent: 0, duration: 0.9, ease: 'power4.out', stagger: 0.018 }, '-=0.8')
        .to(heroBits, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08 }, '-=0.7');
      return tl;
    };
    // l'ouverture est décidée dans la page avant l'affichage (pas d'ancre, pas de mode calme, première visite)
    if (html.classList.contains('is-intro') && !arrived) {
      ss.set('gd-intro', '1');
      introRunning = true;
      if (lenis) lenis.stop();
      C.setLayout('logo', { labels: 0 });
      const tl = gsap.timeline({
        onComplete: () => { if (lenis) lenis.start(); },
      });
      tl.to(word, { opacity: 1, duration: 0.5, ease: 'power2.out' }, 0.95)
        .add(() => { introRunning = false; applyScene(currentScene, true); }, 1.75)
        .to(word, { opacity: 0, duration: 0.35 }, 1.75)
        .add(() => { gsap.set(header, { opacity: 0 }); html.classList.remove('is-intro'); gsap.to(header, { opacity: 1, duration: 0.8 }); if (lenis) lenis.start(); }, 1.8)
        .add(reveal(), 1.8);
      // l'ouverture s'accélère dès que le visiteur veut avancer
      const skip = () => {
        if (tl.progress() < 1) tl.timeScale(4);
        ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((ev) => window.removeEventListener(ev, skip));
      };
      ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((ev) => window.addEventListener(ev, skip, { passive: true }));
    } else {
      C.setLayout('sky', { dim: 1, labels: 0 });
      reveal().delay(arrived ? 0.35 : 0.1);
    }
    // le ciel du fond se pose puis glisse au défilement
    const heroImg = $('.backdrop-item[data-backdrop="hero"] img');
    if (heroImg) {
      gsap.fromTo(heroImg, { scale: 1.14 }, { scale: 1, duration: 3.6, ease: 'power2.out' });
      gsap.to(heroImg, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: '#intro', start: 'top top', end: 'bottom top', scrub: true } });
    }
  }

  leader($('[data-leader]'));

  // défilé des logos clients
  const track = $('.marquee-track');
  if (track) {
    const items = Array.from(track.children);
    for (let k = 0; k < 3; k++) items.forEach((it) => { const c = it.cloneNode(true); c.setAttribute('aria-hidden', 'true'); c.querySelector('img').alt = ''; track.appendChild(c); });
    if (!calm) {
      const tw = gsap.to(track, { xPercent: -50, duration: 26, ease: 'none', repeat: -1 });
      ScrollTrigger.create({ trigger: track, start: 'top bottom', end: 'bottom top', onToggle: (s) => (s.isActive ? tw.play() : tw.pause()) });
      track.addEventListener('pointerenter', () => gsap.to(tw, { timeScale: 0.2, duration: 0.6 }));
      track.addEventListener('pointerleave', () => gsap.to(tw, { timeScale: 1, duration: 0.6 }));
    }
  }

  sectionNav();
  liquid();
  manifeste();
  services();
  faisons();
  pensons();
  realisations();
  reseau();
  rives();
  quote();
  footerWord();
}

/* navigation de sections : une petite constellation verticale */
function sectionNav() {
  const nav = $('.sec-nav');
  if (!nav) return;
  const links = $$('a', nav);
  links.forEach((a) => {
    const sec = $(a.getAttribute('href'));
    if (!sec) return;
    ScrollTrigger.create({
      trigger: sec, start: 'top 50%', end: 'bottom 50%',
      onToggle: (self) => {
        if (!self.isActive) return;
        links.forEach((l) => { l.classList.toggle('is-on', l === a); if (l === a) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current'); });
        nav.classList.toggle('is-light', sec.classList.contains('is-light'));
        nav.classList.toggle('is-muted', sec.id === 'realisations');
      },
    });
  });
}

/* reflet liquide au survol des réalisations (filtre SVG) */
function liquid() {
  if (calm || !finePointer) return;
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', '0'); svg.setAttribute('height', '0'); svg.setAttribute('aria-hidden', 'true');
  svg.style.position = 'absolute';
  svg.innerHTML = '<filter id="gd-liquid" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.012 0.02" numOctaves="2" seed="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="G"/></filter>';
  document.body.appendChild(svg);
  const disp = svg.querySelector('feDisplacementMap'), turb = svg.querySelector('feTurbulence');
  const st = { s: 0, f: 0.012 };
  const apply = () => { disp.setAttribute('scale', st.s.toFixed(1)); turb.setAttribute('baseFrequency', `${st.f.toFixed(4)} ${(st.f * 1.6).toFixed(4)}`); };
  $$('.clip .media img').forEach((img) => {
    const card = img.closest('.clip');
    card.addEventListener('pointerenter', () => {
      img.style.filter = 'url(#gd-liquid)';
      gsap.killTweensOf(st);
      gsap.fromTo(st, { s: 38, f: 0.02 }, { s: 0, f: 0.008, duration: 1.1, ease: 'power3.out', onUpdate: apply, onComplete: () => { img.style.filter = ''; } });
    });
  });
}

/* organigramme qui devient réseau */
function manifeste() {
  const svg = $('.org');
  if (!svg) return;
  const NS = 'http://www.w3.org/2000/svg';
  const org = [[300, 52], [130, 168], [300, 168], [470, 168], [62, 290], [178, 290], [250, 290], [350, 290], [422, 290], [538, 290]];
  const parent = [-1, 0, 0, 0, 1, 1, 2, 2, 3, 3];
  const net = [[70, 200], [160, 120], [215, 300], [305, 196], [392, 104], [430, 312], [512, 206], [566, 112], [250, 70], [112, 336]];
  const edges = [[0, 1], [0, 9], [1, 8], [1, 3], [9, 2], [2, 3], [3, 8], [3, 4], [3, 5], [4, 7], [4, 6], [5, 6], [6, 7], [2, 5], [8, 4], [0, 2]];
  const gO = $('.o-lines', svg), gN = $('.n-lines', svg), gNodes = $('.o-nodes', svg);
  const BW = 86, BH = 34, S = 18;
  const oPaths = [];
  org.forEach(([x, y], i) => {
    if (parent[i] < 0) return;
    const [px, py] = org[parent[i]];
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', `M${px} ${py + BH / 2} V${(py + y) / 2} H${x} V${y - BH / 2}`);
    p.setAttribute('class', 'o-line');
    gO.appendChild(p); oPaths.push(p);
  });
  const nLines = edges.map(([a, b]) => {
    const l = document.createElementNS(NS, 'line');
    l.setAttribute('x1', net[a][0]); l.setAttribute('y1', net[a][1]);
    l.setAttribute('x2', net[b][0]); l.setAttribute('y2', net[b][1]);
    l.setAttribute('class', 'n-line');
    gN.appendChild(l);
    return l;
  });
  const nodes = org.map(([x, y]) => {
    const r = document.createElementNS(NS, 'rect');
    r.setAttribute('x', x - BW / 2); r.setAttribute('y', y - BH / 2);
    r.setAttribute('width', BW); r.setAttribute('height', BH); r.setAttribute('rx', 4);
    r.setAttribute('class', 'o-node');
    gNodes.appendChild(r);
    return r;
  });
  const capA = $('.org-cap .o-cap-a'), capB = $('.org-cap .o-cap-b');
  const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } });
  tl.from(oPaths, { drawSVG: 0, duration: 1, stagger: 0.05 }, 0)
    .from(nodes, { opacity: 0, duration: 0.6, stagger: 0.05 }, 0.1)
    .to({}, { duration: 0.6 })
    .to(oPaths, { opacity: 0, duration: 0.6 }, 'morph')
    .to(capA, { opacity: 0, duration: 0.4 }, 'morph');
  nodes.forEach((n, i) => {
    tl.to(n, { attr: { x: org[i][0] - S / 2, y: org[i][1] - S / 2, width: S, height: S, rx: S / 2 }, duration: 0.7 }, 'morph')
      .to(n, { attr: { x: net[i][0] - S / 2, y: net[i][1] - S / 2 }, duration: 1.1, ease: 'power3.inOut' }, 'morph+=0.6');
  });
  tl.to(nodes, { fill: '#1db5d5', stroke: '#1db5d5', duration: 0.6 }, 'morph+=1.2')
    .from(nLines, { drawSVG: 0, duration: 0.9, stagger: 0.04 }, 'morph+=1.4')
    .to(capB, { opacity: 1, duration: 0.5 }, 'morph+=1.6');
  // l'image aérienne recule doucement pendant que le réseau se forme
  const mimg = $('.manifeste-image > *');
  if (mimg) tl.fromTo(mimg, { scale: 1.16, yPercent: -3 }, { scale: 1, yPercent: 0, ease: 'none', duration: tl.duration() }, 0);
  if (calm) { tl.progress(1); return; }
  const sec = $('#manifeste');
  const mmM = gsap.matchMedia();
  mmM.add('(min-width: 901px) and (min-height: 700px)', () => {
    ScrollTrigger.create({ trigger: sec, start: 'top top', end: 'bottom bottom', scrub: 0.8, animation: tl });
  });
  mmM.add('(max-width: 900px), (max-height: 699px)', () => {
    ScrollTrigger.create({ trigger: sec, start: 'top 75%', end: 'bottom 40%', scrub: 0.8, animation: tl });
  });
}

/* services : l'équipe se forme */
function services() {
  const svcs = $$('.svc');
  if (!svcs.length) return;
  const teamOf = (s) => s.dataset.team.split(',').map(Number);
  let open = svcs.findIndex((s) => s.classList.contains('is-open'));
  if (open < 0) open = 0;
  setTeam(teamOf(svcs[open]));
  const bodies = svcs.map((x) => $('.svc-body', x));
  const openSvc = (i) => {
    if (i === open) return;
    const prev = svcs[open], next = svcs[i];
    const pb = bodies[open], nb = bodies[i];
    gsap.killTweensOf(bodies);
    // tout autre élément encore ouvert (clics rapprochés) se referme net
    svcs.forEach((o, j) => {
      if (j === i || j === open) return;
      o.classList.remove('is-open', 'is-active');
      $('.svc-btn', o).setAttribute('aria-expanded', 'false');
      gsap.set(bodies[j], { clearProps: 'height' });
    });
    prev.classList.remove('is-active');
    $('.svc-btn', prev).setAttribute('aria-expanded', 'false');
    next.classList.add('is-active', 'is-open');
    $('.svc-btn', next).setAttribute('aria-expanded', 'true');
    open = i;
    if (calm) { prev.classList.remove('is-open'); }
    else {
      gsap.to(pb, { height: 0, duration: 0.55, ease: 'power3.inOut', onComplete: () => { if (svcs[open] !== prev) prev.classList.remove('is-open'); gsap.set(pb, { clearProps: 'height' }); } });
      gsap.fromTo(nb, { height: 0 }, { height: 'auto', duration: 0.7, ease: 'power3.inOut', onComplete: () => gsap.set(nb, { clearProps: 'height' }) });
    }
    setTeam(teamOf(next));
  };
  svcs.forEach((s, i) => {
    const b = $('.svc-btn', s);
    b.addEventListener('click', () => openSvc(i));
    b.addEventListener('pointerenter', () => { if (finePointer) { C.setActive(teamOf(s)); svcs.forEach((o) => o.classList.toggle('is-active', o === s)); } });
    b.addEventListener('focus', () => C.setActive(teamOf(s)));
  });
  $('.svc-list').addEventListener('pointerleave', () => {
    C.setActive(teamActive);
    svcs.forEach((o, j) => o.classList.toggle('is-active', j === open));
  });
}

/* nous faisons */
function faisons() {
  const seg = $('.seg');
  if (seg) {
    const outs = $$('.strat-out > div');
    $$('button', seg).forEach((b) => b.addEventListener('click', () => {
      const k = b.dataset.k;
      if (seg.dataset.v === k) return;
      seg.dataset.v = k;
      $$('button', seg).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      outs.forEach((o) => {
        const on = o.dataset.k === k;
        if (on) {
          o.hidden = false;
          if (!calm) gsap.fromTo(o, { opacity: 0, y: 18, clipPath: 'inset(0 0 100% 0)' }, { opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)', duration: 0.7, ease: 'power3.out' });
        } else o.hidden = true;
      });
    }));
  }
  // radar des savoir-faire
  const radar = $('.radar svg');
  const items = $$('.outils-list li');
  if (radar && items.length) {
    const g = $('.r-nodes', radar);
    const NS = 'http://www.w3.org/2000/svg';
    const angs = items.map((_, i) => i * 36 - 90);
    const nodes = angs.map((a, i) => {
      const rr = i % 2 ? 100 : 136;
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', (Math.cos((a * Math.PI) / 180) * rr).toFixed(1));
      c.setAttribute('cy', (Math.sin((a * Math.PI) / 180) * rr).toFixed(1));
      c.setAttribute('r', 5);
      c.setAttribute('class', 'r-node');
      g.appendChild(c);
      const l = document.createElementNS(NS, 'line');
      l.setAttribute('x1', 0); l.setAttribute('y1', 0);
      l.setAttribute('x2', c.getAttribute('cx')); l.setAttribute('y2', c.getAttribute('cy'));
      l.setAttribute('stroke', 'rgba(238,242,248,.12)');
      g.insertBefore(l, g.firstChild);
      return c;
    });
    const sweep = $('.r-sweep', radar);
    if (calm) { gsap.set(sweep, { opacity: 0 }); return; }
    const st = { a: -90 };
    const tw = gsap.to(st, {
      a: 270, duration: 9, ease: 'none', repeat: -1, paused: true,
      onUpdate: () => {
        sweep.setAttribute('transform', `rotate(${st.a.toFixed(1)})`);
        angs.forEach((a, i) => {
          const d = (((st.a - a) % 360) + 360) % 360;
          const on = d < 44;
          nodes[i].classList.toggle('is-on', on);
          items[i].classList.toggle('is-on', on);
        });
      },
    });
    ScrollTrigger.create({ trigger: radar, start: 'top bottom', end: 'bottom top', onToggle: (s) => (s.isActive ? tw.play() : tw.pause()) });
  }
}

/* nous pensons */
function pensons() {
  const en = $('.enjeux');
  if (en) {
    const lis = $$('li', en), path = $('path', en);
    const build = () => {
      const r0 = en.getBoundingClientRect();
      const pts = lis.map((l) => { const r = l.getBoundingClientRect(); return [r.left - r0.left + r.width / 2, r.top - r0.top + r.height / 2]; });
      let d = `M${pts[0][0]} ${pts[0][1]}`;
      for (let i = 1; i < pts.length; i++) {
        const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
        const mx = (x0 + x1) / 2;
        d += ` C${mx} ${y0 - 34}, ${mx} ${y1 + 34}, ${x1} ${y1}`;
      }
      path.setAttribute('d', d);
    };
    build();
    window.addEventListener('resize', build);
    if (calm) lis.forEach((l) => l.classList.add('is-on'));
    else {
      const tl = gsap.timeline({ scrollTrigger: { trigger: en, start: 'top 85%', end: 'bottom 45%', scrub: 0.6 } });
      tl.fromTo(path, { drawSVG: 0 }, { drawSVG: '100%', duration: 1, ease: 'none' }, 0);
      lis.forEach((l, i) => tl.add(() => l.classList.toggle('is-on', tl.scrollTrigger.direction > 0 || tl.progress() >= i / 3), i / 3.2));
      tl.eventCallback('onUpdate', () => lis.forEach((l, i) => l.classList.toggle('is-on', tl.progress() >= i / 3.4)));
    }
  }
  const ring = $('.ring360');
  if (ring) {
    const fg = $('.rg-fg', ring), num = $('.rg-num', ring);
    if (calm) return;
    const o = { v: 0 };
    gsap.timeline({ scrollTrigger: { trigger: ring, start: 'top 85%', once: true } })
      .fromTo(fg, { drawSVG: 0 }, { drawSVG: '100%', duration: 1.8, ease: 'power3.inOut' }, 0)
      .to(o, { v: 360, duration: 1.8, ease: 'power3.inOut', onUpdate: () => { num.textContent = Math.round(o.v); } }, 0);
  }
}

/* réalisations : banc de montage */
function realisations() {
  const sec = $('#realisations');
  if (!sec) return;
  const track = $('.tl-track', sec), vp = $('.tl-viewport', sec), tc = $('.tl-tc', sec);
  const fmtTC = (p) => {
    const total = Math.round(p * 92 * 25);
    const f = total % 25, s = Math.floor(total / 25) % 60, m = Math.floor(total / 1500) % 60;
    const z = (n) => String(n).padStart(2, '0');
    return `00:${z(m)}:${z(s)}:${z(f)}`;
  };
  const bars = $$('.clip-bar', sec);
  const medias = $$('.clip .media', sec);
  vp.addEventListener('scroll', () => {
    const p = vp.scrollLeft / Math.max(1, vp.scrollWidth - vp.clientWidth);
    tc.textContent = fmtTC(p);
  }, { passive: true });
  if (calm) return; // défilement horizontal natif (classe tl-native)
  const mm = gsap.matchMedia();
  const pinEl = $('.real-pin', sec);
  // la carte entière (image + légende) doit tenir dans la hauteur de l'écran
  const clipsEls = $$('.clip', sec);
  const capH = () => Math.max(...clipsEls.map((c) => c.offsetHeight - ($('.media', c)?.offsetHeight || 0)));
  const sizeClips = () => {
    sec.classList.remove('is-compact');
    const avail = () => innerHeight - (track.getBoundingClientRect().top - pinEl.getBoundingClientRect().top) - capH() - 18;
    const apply = (v) => sec.style.setProperty('--mh', Math.floor(Math.max(150, Math.min(v, innerWidth * 0.38 * 0.75, 440))) + 'px');
    apply(avail());
    if (avail() < 250) sec.classList.add('is-compact');
    // deux passes : la légende peut changer de hauteur avec la largeur de la carte
    apply(avail());
    apply(avail());
  };
  mm.add('(min-width: 901px) and (min-height: 480px)', () => {
    sec.classList.remove('tl-native');
    vp.scrollLeft = 0;
    sizeClips();
    ScrollTrigger.addEventListener('refreshInit', sizeClips);
    const dist = () => Math.max(0, track.scrollWidth - vp.clientWidth);
    const tween = gsap.to(track, { x: () => -dist(), ease: 'none' });
    const st = ScrollTrigger.create({
      trigger: pinEl, pin: pinEl, start: 'top top', end: () => '+=' + dist() * 1.05,
      scrub: 0.8, animation: tween, invalidateOnRefresh: true, anticipatePin: 1,
      onUpdate: (self) => { tc.textContent = fmtTC(self.progress); },
    });
    bars.forEach((b) => {
      gsap.fromTo(b, { scaleX: 0 }, {
        scaleX: 1, ease: 'none',
        scrollTrigger: { trigger: b, containerAnimation: tween, start: 'left 92%', end: 'left 45%', scrub: true },
      });
    });
    medias.forEach((m) => {
      gsap.fromTo(m, { clipPath: 'inset(0 0 0 100%)' }, {
        clipPath: 'inset(0 0 0 0%)', ease: 'power2.out',
        scrollTrigger: { trigger: m, containerAnimation: tween, start: 'left 100%', end: 'left 70%', scrub: true },
      });
    });
    // au clavier : la page défile jusqu'à la carte qui reçoit le focus
    const onFocus = (e) => {
      const clip = e.target.closest('.clip');
      if (!clip) return;
      vp.scrollLeft = 0;
      const p = Math.min(1, Math.max(0, (clip.offsetLeft - 40) / Math.max(1, dist())));
      const y = st.start + p * (st.end - st.start);
      if (lenis) lenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y);
    };
    sec.addEventListener('focusin', onFocus);
    return () => {
      ScrollTrigger.removeEventListener('refreshInit', sizeClips);
      sec.classList.remove('is-compact');
      sec.style.removeProperty('--mh');
      sec.removeEventListener('focusin', onFocus);
      sec.classList.add('tl-native');
      gsap.set(track, { clearProps: 'transform' });
      gsap.set(medias, { clearProps: 'clipPath' });
      gsap.set(bars, { clearProps: 'transform' });
    };
  });
}

/* le réseau : métiers reliés */
function reseau() {
  const wrap = $('.metiers-net');
  if (!wrap) return;
  const svg = $('svg', wrap), lis = $$('.metiers li', wrap);
  const NS = 'http://www.w3.org/2000/svg';
  let lines = [];
  const build = () => {
    svg.innerHTML = '';
    const r0 = wrap.getBoundingClientRect();
    const pts = lis.map((l) => { const r = l.getBoundingClientRect(); return [r.left - r0.left + r.width / 2, r.top - r0.top + r.height / 2]; });
    const seen = new Set();
    lines = [];
    pts.forEach((p, i) => {
      const near = pts.map((q, j) => [j, Math.hypot(q[0] - p[0], q[1] - p[1])]).filter(([j]) => j !== i).sort((a, b) => a[1] - b[1]).slice(0, 2);
      near.forEach(([j]) => {
        const key = i < j ? i + '-' + j : j + '-' + i;
        if (seen.has(key)) return;
        seen.add(key);
        const l = document.createElementNS(NS, 'line');
        l.setAttribute('x1', p[0]); l.setAttribute('y1', p[1]); l.setAttribute('x2', pts[j][0]); l.setAttribute('y2', pts[j][1]);
        l.dataset.a = i; l.dataset.b = j;
        svg.appendChild(l);
        lines.push(l);
      });
    });
  };
  build();
  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 200); });
  lis.forEach((li, i) => {
    const hot = (on) => lines.forEach((l) => { if (+l.dataset.a === i || +l.dataset.b === i) l.classList.toggle('is-hot', on); });
    li.addEventListener('pointerenter', () => hot(true));
    li.addEventListener('pointerleave', () => hot(false));
    li.addEventListener('focus', () => hot(true));
    li.addEventListener('blur', () => hot(false));
  });
  if (calm) return;
  gsap.from(lis, { opacity: 0, scale: 0.7, duration: 0.8, ease: 'back.out(1.6)', stagger: { each: 0.06, from: 'random' }, scrollTrigger: { trigger: wrap, start: 'top 80%', once: true } });
  ScrollTrigger.create({ trigger: wrap, start: 'top 75%', once: true, onEnter: () => gsap.from(lines, { drawSVG: 0, duration: 1.2, ease: 'power2.inOut', stagger: 0.04, delay: 0.3 }) });
}

/* deux rives */
function rives() {
  const map = $('.rives-map svg');
  if (!map) return;
  const NS = 'http://www.w3.org/2000/svg';
  const W = 640, H = 440, L0 = -12, L1 = 72, A0 = -32, A1 = 60;
  const proj = (lon, lat) => [((lon - L0) / (L1 - L0)) * W, ((A1 - lat) / (A1 - A0)) * H];
  const g = $('.grat-g', map);
  for (let lon = -10; lon <= 70; lon += 10) {
    const [x] = proj(lon, 0);
    const l = document.createElementNS(NS, 'line');
    l.setAttribute('x1', x); l.setAttribute('x2', x); l.setAttribute('y1', 0); l.setAttribute('y2', H);
    l.setAttribute('class', 'grat'); g.appendChild(l);
  }
  for (let lat = -30; lat <= 60; lat += 10) {
    const [, y] = proj(0, lat);
    const l = document.createElementNS(NS, 'line');
    l.setAttribute('x1', 0); l.setAttribute('x2', W); l.setAttribute('y1', y); l.setAttribute('y2', y);
    l.setAttribute('class', 'grat' + (lat === 0 ? ' grat-eq' : '')); g.appendChild(l);
  }
  const P = proj(2.35, 48.86), R = proj(55.45, -20.88);
  $('.pt-paris', map).setAttribute('transform', `translate(${P[0].toFixed(1)} ${P[1].toFixed(1)})`);
  $('.pt-reunion', map).setAttribute('transform', `translate(${R[0].toFixed(1)} ${R[1].toFixed(1)})`);
  const mx = (P[0] + R[0]) / 2, my = (P[1] + R[1]) / 2, dx = R[0] - P[0], dy = R[1] - P[1];
  const arc = document.createElementNS(NS, 'path');
  arc.setAttribute('d', `M${P[0]} ${P[1]} Q${mx - dy * 0.35} ${my + dx * 0.35} ${R[0]} ${R[1]}`);
  arc.setAttribute('fill', 'none'); arc.setAttribute('stroke', 'rgba(29,181,213,.35)'); arc.setAttribute('stroke-dasharray', '2 6');
  g.appendChild(arc);
  if (calm) return;
  gsap.timeline({ scrollTrigger: { trigger: map, start: 'top 80%', once: true } })
    .from($$('.grat', g), { drawSVG: 0, duration: 1.2, stagger: 0.03, ease: 'power2.out' })
    .from(arc, { drawSVG: 0, duration: 1.2, ease: 'power2.inOut' }, 0.4)
    .from($$('.map-ring', map), { scale: 0, transformOrigin: '50% 50%', duration: 0.8, ease: 'back.out(2)', stagger: 0.2 }, 0.6);
  gsap.to($$('.map-ring', map), { scale: 1.9, opacity: 0, transformOrigin: '50% 50%', duration: 2.2, repeat: -1, ease: 'power1.out', stagger: 1.1, delay: 1.6 });
}

/* témoignage qui s'écrit */
function quote() {
  const q = $('.quote-text');
  if (!q || calm) { $$('.quote-text .mark').forEach((m) => m.style.setProperty('--u', 1)); return; }
  const split = new window.SplitText(q, { type: 'words', aria: 'none' });
  const marks = $$('.mark', q);
  gsap.set(split.words, { opacity: 0.13 });
  const tl = gsap.timeline({ scrollTrigger: { trigger: q, start: 'top 78%', end: 'bottom 48%', scrub: 0.6 } });
  tl.to(split.words, { opacity: 1, duration: 0.25, stagger: 0.1, ease: 'none' });
  marks.forEach((m) => {
    const w = split.words.findIndex((x) => m.contains(x));
    tl.to(m, { '--u': 1, duration: 0.6, ease: 'power2.out' }, Math.max(0, w) * 0.1 + 0.2);
  });
}

/* grand mot du pied de page */
function footerWord() {
  const t = $('.f-word text');
  if (!t || calm) return;
  gsap.fromTo(t, { strokeDasharray: 900, strokeDashoffset: 900 }, {
    strokeDashoffset: 0, ease: 'none',
    scrollTrigger: { trigger: '.site-footer', start: 'top 85%', end: 'bottom bottom', scrub: 1 },
  });
}

/* ================= WOPÉ ================= */
function wope() {
  const arrived = arrive();
  C.setLayout('sky', { dim: 0.7, labels: 0 });
  const title = $('.page-title');
  if (!calm && title) {
    title.setAttribute('aria-label', title.textContent.trim());
    const s = new window.SplitText(title, { type: 'chars', aria: 'none' });
    gsap.from(s.chars, { yPercent: 110, duration: 1.1, ease: 'power4.out', stagger: 0.05, delay: arrived ? 0.35 : 0.15 });
    gsap.from('[data-hero]', { opacity: 0, y: 20, duration: 0.8, stagger: 0.08, delay: arrived ? 0.7 : 0.5 });
  }
  const tc = $('.tc-live');
  if (tc && !calm) {
    const t0 = performance.now();
    const z = (n) => String(n).padStart(2, '0');
    gsap.ticker.add(() => {
      const fr = Math.floor(((performance.now() - t0) / 1000) * 25);
      tc.textContent = `00:${z(Math.floor(fr / 1500) % 60)}:${z(Math.floor(fr / 25) % 60)}:${z(fr % 25)}`;
    });
  }
  setTeam([0, 1, 2, 8, 3]);
  leader($('[data-leader]'));
  // lecteur simulé
  const pl = $('.player');
  if (pl) {
    const btn = $('.player-play', pl), bar = $('.player-bar span', pl), ptc = $('.player-tc', pl), poster = $('.ph', pl);
    const setState = (playing, ended = false) => {
      pl.classList.toggle('is-playing', playing);
      btn.setAttribute('aria-label', playing ? 'Mettre en pause la démonstration' : ended ? 'Relancer la démonstration' : 'Lire la démonstration');
      $('.i-play', btn).style.display = playing ? 'none' : '';
      $('.i-pause', btn).style.display = playing ? '' : 'none';
    };
    const tw = gsap.to(bar, {
      width: '100%', duration: 14, ease: 'none', paused: true,
      onUpdate() {
        const fr = Math.floor(this.progress() * 14 * 25);
        ptc.textContent = `00:00:${String(Math.floor(fr / 25)).padStart(2, '0')}:${String(fr % 25).padStart(2, '0')}`;
      },
      onComplete() { setState(false, true); tw.pause(0); },
    });
    const toggle = () => {
      const playing = !pl.classList.contains('is-playing');
      setState(playing);
      if (playing) tw.play(); else tw.pause();
    };
    btn.addEventListener('click', toggle);
    poster?.addEventListener('click', toggle);
  }
  // frise de fabrication
  const steps = $('.steps');
  if (steps) {
    const lis = $$('li', steps);
    if (calm) { steps.style.setProperty('--p', 1); lis.forEach((l) => l.classList.add('is-on')); }
    else {
      gsap.to(steps, {
        '--p': 1, ease: 'none',
        scrollTrigger: {
          trigger: steps, start: 'top 80%', end: 'bottom 55%', scrub: 0.6,
          onUpdate: (s) => lis.forEach((l, i) => l.classList.toggle('is-on', s.progress >= i / lis.length)),
        },
      });
    }
  }
}

/* ================= SE RENCONTRER ================= */
const NEEDS = {
  btoc: { label: 'Stratégie BtoC : publicité, promotion', team: [0, 1] },
  btob: { label: 'Communication interne BtoB', team: [0, 2, 1] },
  print: { label: 'Création print', team: [3, 6, 5] },
  digital: { label: 'Digital et web', team: [4, 5, 3] },
  audiovisuel: { label: 'Audiovisuel : films, spots radio', team: [8, 1, 2] },
  evenementiel: { label: 'Événementiel', team: [0, 3, 7] },
  rp: { label: 'Relations publiques', team: [2, 0] },
  social: { label: 'Réseaux sociaux', team: [1, 2, 5, 7] },
};
function rencontrer() {
  const arrived = arrive();
  C.setLayout('sky', { dim: 0.7, labels: 0 });
  const title = $('.page-title');
  if (!calm && title) {
    const s = new window.SplitText(title, { type: 'lines', mask: 'lines', aria: 'none' });
    gsap.from(s.lines, { yPercent: 105, duration: 1.1, ease: 'power4.out', stagger: 0.1, delay: arrived ? 0.35 : 0.15 });
    gsap.from('[data-hero]', { opacity: 0, y: 20, duration: 0.8, stagger: 0.08, delay: arrived ? 0.7 : 0.5 });
  }
  const form = $('#brief');
  if (!form) return;
  const steps = $$('.step', form);
  const bar = $('.progress-bar span'), ptxt = $('.progress-txt');
  const prevB = $('[data-prev]', form), nextB = $('[data-next]', form);
  const teamList = $('.brief-team ul');
  let cur = 0;

  // créneaux simulés : jours ouvrés, dans les horaires de bureau du lieu choisi
  const slotsEl = $('.slots', form), moreB = $('.slots-more', form);
  const RUN = 'Indian/Reunion', PAR = 'Europe/Paris';
  const fmtH = { [RUN]: new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: RUN }), [PAR]: new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: PAR }) };
  const parts = (d, tz, opts) => Object.fromEntries(new Intl.DateTimeFormat('en-GB', { ...opts, timeZone: tz }).formatToParts(d).map((x) => [x.type, x.value]));
  const hourIn = (d, tz) => { const p = parts(d, tz, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }); return +p.hour + +p.minute / 60; };
  const zonedUTC = (y, m, d, h, mi, tz) => {
    const guess = Date.UTC(y, m, d, h, mi);
    const p = parts(new Date(guess), tz, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
    const wall = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
    return new Date(guess - (wall - guess));
  };
  function slotsFor(lieu, y, m, d) {
    if (lieu === 'À Paris') return [[9, 30], [11, 0], [14, 30], [16, 0]].map(([h, mi]) => zonedUTC(y, m, d, h, mi, PAR));
    if (lieu === 'À La Réunion') return [[9, 0], [10, 30], [14, 0], [15, 30]].map(([h, mi]) => zonedUTC(y, m, d, h, mi, RUN));
    // visioconférence : créneaux dans les horaires de bureau des deux côtés
    const all = [];
    for (let t = 9 * 60; t <= 16 * 60 + 30; t += 30) {
      const at = zonedUTC(y, m, d, Math.floor(t / 60), t % 60, RUN);
      const hp = hourIn(at, PAR);
      if (hp >= 9 && hp <= 16.5) all.push(at);
    }
    if (all.length <= 4) return all;
    return [0, 1, 2, 3].map((k) => all[Math.round((k * (all.length - 1)) / 3)]);
  }
  function renderSlots(lieu, days = 3) {
    slotsEl.innerHTML = '';
    if (!lieu) { slotsEl.innerHTML = '<p class="slots-empty">Choisissez d’abord le lieu pour voir les créneaux.</p>'; moreB.hidden = true; return; }
    const tz = lieu === 'À Paris' ? PAR : RUN, other = tz === PAR ? RUN : PAR;
    const zoneName = (z) => (z === PAR ? 'à Paris' : 'La Réunion');
    const fmtDay = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: tz });
    let day = new Date(Date.now() + 86400000), made = 0, guard = 0;
    while (made < days && guard++ < 14) {
      const p = parts(day, tz, { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' });
      if (p.weekday !== 'Sat' && p.weekday !== 'Sun') {
        const label = fmtDay.format(day);
        const box = document.createElement('div');
        box.innerHTML = `<p class="slot-day">${label.charAt(0).toUpperCase() + label.slice(1)}</p><div class="slot-list"></div>`;
        const list = $('.slot-list', box);
        slotsFor(lieu, +p.year, +p.month - 1, +p.day).forEach((at, k) => {
          const a = fmtH[tz].format(at), b = fmtH[other].format(at);
          const lab = document.createElement('label');
          lab.className = 'slot';
          lab.innerHTML = `<input type="radio" name="creneau" id="slot-${made}-${k}" value="${label}, ${a} ${zoneName(tz)} (${b} ${zoneName(other)})"><span>${a} ${zoneName(tz)}<small>${b} ${zoneName(other)}</small></span>`;
          list.appendChild(lab);
        });
        slotsEl.appendChild(box);
        made++;
      }
      day = new Date(day.getTime() + 86400000);
    }
    moreB.hidden = days > 3;
  }
  $$('[name="lieu"]', form).forEach((r) => r.addEventListener('change', () => renderSlots(r.value)));
  moreB?.addEventListener('click', () => { const l = val('lieu')[0]; renderSlots(l, 5); $$('.slot-day', slotsEl)[3]?.scrollIntoView({ block: 'nearest' }); });

  const val = (name) => $$(`[name="${name}"]`, form).filter((i) => i.checked).map((i) => i.value);
  const inline = $('.team-inline', form);
  function updateTeam() {
    const needs = val('besoin');
    const set = new Set();
    needs.forEach((n) => NEEDS[n].team.forEach((t) => set.add(t)));
    if (needs.length) set.add(0);
    const list = [...set].sort((a, b) => a - b);
    setTeam(list);
    teamList.innerHTML = list.length
      ? list.map((i) => `<li>${METIERS[i]}</li>`).join('')
      : '<li class="empty">Choisissez vos besoins pour voir l’équipe se former.</li>';
    if (inline) inline.innerHTML = list.length ? `<strong>Votre équipe :</strong> ${list.map((i) => METIERS[i].toLowerCase()).join(', ')}.` : '';
  }
  $$('[name="besoin"]', form).forEach((i) => i.addEventListener('change', updateTeam));
  updateTeam();

  // une erreur disparaît dès que le champ concerné change
  const clearErr = (e) => {
    const st = e.target.closest('.step');
    if (!st) return;
    $('.err', st).textContent = '';
    $$('[aria-invalid]', st).forEach((f) => f.removeAttribute('aria-invalid'));
  };
  form.addEventListener('input', clearErr);
  form.addEventListener('change', clearErr);
  const err = (step, msg, field) => {
    $('.err', step).textContent = msg || '';
    if (field) { field.setAttribute('aria-invalid', 'true'); field.focus(); }
  };
  const firstOf = (name) => $(`[name="${name}"]`, form);
  function validate(i) {
    const s = steps[i];
    err(s, '');
    if (i === 0 && !val('profil').length) { err(s, 'Choisissez le type de structure pour continuer.', firstOf('profil')); return false; }
    if (i === 1 && !val('besoin').length) { err(s, 'Choisissez au moins un besoin pour continuer.', firstOf('besoin')); return false; }
    if (i === 2 && !val('echeance').length) { err(s, 'Choisissez une échéance pour continuer.', firstOf('echeance')); return false; }
    if (i === 3 && !val('lieu').length) { err(s, 'Choisissez où vous souhaitez vous rencontrer.', firstOf('lieu')); return false; }
    if (i === 4) {
      const nom = $('#f-nom'), mail = $('#f-mail'), rgpd = $('#f-rgpd');
      if (!nom.value.trim()) { err(s, 'Indiquez votre nom.', nom); return false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail.value.trim())) { err(s, 'Indiquez une adresse e-mail valide, par exemple nom@entreprise.fr.', mail); return false; }
      if (!rgpd.checked) { err(s, 'Cochez la case pour accepter d’être recontacté au sujet de votre projet.', rgpd); return false; }
    }
    return true;
  }
  function show(i, dir = 1) {
    const from = steps[cur];
    cur = i;
    steps.forEach((s, j) => { s.hidden = j !== i; });
    bar.style.width = ((i + 1) / steps.length) * 100 + '%';
    ptxt.textContent = `Étape ${i + 1} sur ${steps.length}`;
    prevB.hidden = i === 0;
    nextB.textContent = i === steps.length - 1 ? 'Envoyer ma demande' : 'Continuer';
    if (from === steps[i]) return;
    if (!calm) gsap.fromTo(steps[i], { opacity: 0, x: 40 * dir }, { opacity: 1, x: 0, duration: 0.6, ease: 'power3.out' });
    // le haut du formulaire revient à l'écran à chaque étape
    const top = form.getBoundingClientRect().top;
    if (top < 70 || top > innerHeight * 0.6) scrollToTarget(form, calm);
    const lg = $('legend', steps[i]);
    if (lg) { lg.setAttribute('tabindex', '-1'); lg.focus({ preventScroll: true }); }
  }
  prevB.addEventListener('click', () => show(Math.max(0, cur - 1), -1));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate(cur)) return;
    if (cur < steps.length - 1) { show(cur + 1, 1); return; }
    // envoi simulé
    const recap = $('.recap', form);
    const lab = (name) => val(name).map((v) => {
      const inp = $(`[name="${name}"][value="${CSS.escape(v)}"]`, form);
      return inp?.closest('label')?.querySelector('.c-txt')?.firstChild?.textContent?.trim() || v;
    }).join(', ');
    const rows = [
      ['Structure', lab('profil')],
      ['Besoins', val('besoin').map((n) => NEEDS[n].label).join(' ; ')],
      ['Échéance', lab('echeance')],
      ['Rencontre', lab('lieu') + (val('creneau')[0] ? ', ' + val('creneau')[0] : ', créneau à convenir')],
      ['Contact', `${$('#f-nom').value.trim()}, ${$('#f-mail').value.trim()}`],
    ];
    recap.innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v.replace(/</g, '&lt;')}</dd></div>`).join('');
    form.classList.add('is-done');
    const stage = $('.brief-stage');
    if (stage) C.setLayout('converge', { labels: 0, anchor: () => { const r = stage.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, r: Math.min(r.width, r.height) * 0.36 }; } });
    $('.done h2', form).focus();
    if (!calm) gsap.from($('.done', form), { opacity: 0, y: 24, duration: 0.8, ease: 'power3.out' });
  });
  $('[data-edit]', form)?.addEventListener('click', () => { form.classList.remove('is-done'); currentScene = null; applyScene($('#brief-sec')); show(0, -1); });
  cur = 0;
  show(0);
}

/* ================= MENTIONS ================= */
function mentions() {
  arrive();
  C.setLayout('sky', { dim: 0.35, labels: 0 });
}

/* ================= démarrage ================= */
function start() {
  html.classList.add('is-ready');
  if (page === 'rencontrer') $$('.site-header .btn, .menu nav a[href="rencontrer.html"]').forEach((a) => a.setAttribute('aria-current', 'page'));
  paintPlaceholders();
  tickClocks();
  setInterval(tickClocks, 10000);
  initPointer();
  reveals();
  if (page === 'accueil') home();
  else if (page === 'wope') wope();
  else if (page === 'rencontrer') rencontrer();
  else mentions();
  bindScenes();
  ScrollTrigger.refresh();
  if (location.hash && $(location.hash)) setTimeout(() => scrollToTarget(location.hash, true), 60);
}
const fontsReady = document.fonts ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]) : Promise.resolve();
fontsReady.then(start);
window.addEventListener('load', () => ScrollTrigger.refresh());
