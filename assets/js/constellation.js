/* Constellation GD Réseau : chaque point est un métier du réseau.
   Simulation commune, rendu WebGL (OGL) ou Canvas 2D en secours. */
import { Renderer, Program, Geometry, Mesh } from './vendor/ogl.min.mjs';
import { GD_POINTS } from './gd-points.js';

export const METIERS = [
  'Chefs de projet', 'Concepteurs', 'Rédacteurs', 'Directeurs artistiques', 'Web designers',
  'Infographistes multimédia', 'Designers graphiques', 'Photographes', 'Réalisateurs',
];
const NM = METIERS.length;
const PROJET = NM; // index du point « projet »

const COL = {
  givre: [0.93, 0.95, 0.97],
  cyan: [0.11, 0.71, 0.84],
  cyanPale: [0.55, 0.86, 0.93],
  corail: [1.0, 0.42, 0.34],
};

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

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl') || c.getContext('experimental-webgl'));
  } catch (e) {
    return false;
  }
}

export function createConstellation({ canvas, labelsEl, reduced = false, force2D = false, mobile = false }) {
  const useGL = !force2D && hasWebGL();
  const N = useGL ? (mobile ? 380 : 720) : (mobile ? 200 : 300);
  const SKY = Math.min(N - NM - 1, mobile ? 110 : 170); // points reliés dans le ciel
  const rand = rng(1971);

  // --- état
  const px = new Float32Array(N), py = new Float32Array(N);
  const vx = new Float32Array(N), vy = new Float32Array(N);
  const tx = new Float32Array(N), ty = new Float32Array(N);
  const ux = new Float32Array(N), uy = new Float32Array(N); // position « ciel » normalisée
  const gx = new Float32Array(N), gy = new Float32Array(N); // gaussienne pour les amas
  const k = new Float32Array(N), ph = new Float32Array(N), tw = new Float32Array(N);
  const base = new Float32Array(N), sz = new Float32Array(N), act = new Float32Array(N);
  const tint = new Float32Array(N); // 0 givre -> 1 cyan

  let W = window.innerWidth, H = window.innerHeight;
  for (let i = 0; i < N; i++) {
    ux[i] = rand(); uy[i] = rand();
    const a = rand() * Math.PI * 2, r = Math.sqrt(-2 * Math.log(rand() + 1e-6));
    gx[i] = Math.cos(a) * r; gy[i] = Math.sin(a) * r;
    k[i] = 0.028 + rand() * 0.05;
    ph[i] = rand() * Math.PI * 2;
    tw[i] = 0.6 + rand() * 1.6;
    base[i] = 0.35 + rand() * 0.65;
    sz[i] = mobile ? 5 + rand() * 6 : 6 + rand() * 8;
    tint[i] = rand() < 0.35 ? 1 : 0;
    px[i] = (rand() * 1.4 - 0.2) * W;
    py[i] = (rand() * 1.4 - 0.2) * H;
  }
  for (let i = 0; i < NM; i++) { base[i] = 1; tint[i] = 1; k[i] = 0.05; }
  base[PROJET] = 1;

  // --- état de mise en page
  const st = {
    layout: 'sky',
    opts: {},
    active: new Set(),
    labelAlpha: 0,
    labelTarget: 0,
    global: 1,
    globalTarget: 1,
    drift: 14,
    mouse: { x: -9999, y: -9999, on: false },
    time: 0,
    running: true,
  };

  const setLayout = (name, opts = {}) => {
    st.layout = name;
    st.opts = opts;
    st.active = new Set(opts.active || []);
    st.labelTarget = opts.labels ?? (name === 'team' ? 1 : name === 'sky' && !mobile ? 0.55 : 0);
    st.globalTarget = opts.dim ?? 1;
    st.drift = { sky: mobile ? 9 : 14, logo: 1.2, team: 5, rives: 7, converge: 3, point: 0 }[name] ?? 10;
    if (reduced) snap();
  };
  const setActive = (list) => { st.active = new Set(list); };

  // --- cibles
  function anchorOf(o, fallback) {
    const v = typeof o === 'function' ? o() : o;
    return v || fallback;
  }

  function computeTargets() {
    const L = st.layout, o = st.opts;
    const minWH = Math.min(W, H);
    if (L === 'logo') {
      const cx = W * 0.5, cy = H * 0.46, s = minWH * (mobile ? 0.62 : 0.5);
      const n = GD_POINTS.length / 2;
      for (let i = 0; i < N; i++) {
        const j = (i * 7) % n;
        tx[i] = cx + GD_POINTS[j * 2] * s;
        ty[i] = cy + GD_POINTS[j * 2 + 1] * s;
      }
      return;
    }
    if (L === 'point') {
      const p = anchorOf(o.anchor, { x: W / 2, y: H / 2 });
      for (let i = 0; i < N; i++) { tx[i] = p.x + gx[i] * 4; ty[i] = p.y + gy[i] * 4; }
      return;
    }
    // ciel par défaut
    for (let i = NM + 1; i < N; i++) { tx[i] = ux[i] * W; ty[i] = uy[i] * H; }
    if (L === 'sky') {
      const cx = mobile ? W * 0.5 : W * 0.72, cy = mobile ? H * 0.3 : H * 0.42, r = minWH * (mobile ? 0.3 : 0.24);
      for (let i = 0; i < NM; i++) {
        const a = -Math.PI / 2 + (i / NM) * Math.PI * 2 + 0.35 * Math.sin(i * 2.1);
        const rr = r * (0.75 + 0.35 * ((i * 37) % 10) / 10);
        tx[i] = cx + Math.cos(a) * rr; ty[i] = cy + Math.sin(a) * rr;
      }
      tx[PROJET] = cx; ty[PROJET] = cy;
      return;
    }
    if (L === 'team') {
      const a0 = anchorOf(o.anchor, { x: W * 0.72, y: H * 0.5, r: minWH * 0.28 });
      for (let i = 0; i < NM; i++) {
        const a = -Math.PI / 2 + (i / NM) * Math.PI * 2;
        const on = st.active.has(i);
        const rr = a0.r * (on ? 0.78 : 1);
        tx[i] = a0.x + Math.cos(a) * rr; ty[i] = a0.y + Math.sin(a) * rr;
      }
      tx[PROJET] = a0.x; ty[PROJET] = a0.y;
      // quelques points se rassemblent autour de l'équipe
      for (let i = NM + 1; i < Math.min(N, NM + 1 + 70); i++) {
        const a = (i * 2.399963) % (Math.PI * 2);
        const rr = a0.r * (1.18 + 0.5 * ux[i]);
        tx[i] = a0.x + Math.cos(a) * rr; ty[i] = a0.y + Math.sin(a) * rr;
      }
      return;
    }
    if (L === 'rives') {
      const A = anchorOf(o.a, { x: W * 0.3, y: H * 0.35 });
      const B = anchorOf(o.b, { x: W * 0.7, y: H * 0.7 });
      const spread = mobile ? 34 : 56;
      for (let i = 0; i < N; i++) {
        if (i > NM + 1 + SKY + 60) continue; // le reste garde le ciel
        const P = i % 2 ? A : B;
        tx[i] = P.x + gx[i] * spread; ty[i] = P.y + gy[i] * spread * 0.8;
      }
      return;
    }
    if (L === 'converge') {
      const c = anchorOf(o.anchor, { x: W / 2, y: H / 2, r: 160 });
      const M = Math.min(N, NM + 1 + SKY);
      for (let i = 0; i < M; i++) {
        const a = (i / M) * Math.PI * 2;
        const rr = c.r * (1 + 0.09 * Math.sin(i * 1.7)) + (i % 3) * 6;
        tx[i] = c.x + Math.cos(a) * rr * (c.ex || 1); ty[i] = c.y + Math.sin(a) * rr;
      }
    }
  }

  function snap() {
    computeTargets();
    for (let i = 0; i < N; i++) { px[i] = tx[i]; py[i] = ty[i]; vx[i] = vy[i] = 0; }
  }

  // --- segments (lignes)
  const MAXSEG = useGL ? 4200 : 1600;
  const seg = new Float32Array(MAXSEG * 4); // x1 y1 x2 y2
  const segA = new Float32Array(MAXSEG); // alpha
  const segC = new Uint8Array(MAXSEG); // 0 cyan, 1 corail, 2 givre
  let nseg = 0;
  const pushSeg = (x1, y1, x2, y2, a, c = 0) => {
    if (nseg >= MAXSEG || a < 0.01) return;
    const j = nseg * 4;
    seg[j] = x1; seg[j + 1] = y1; seg[j + 2] = x2; seg[j + 3] = y2;
    segA[nseg] = a; segC[nseg] = c; nseg++;
  };

  // grille pour la recherche de voisins
  const grid = new Map();
  function linkByDistance(from, to, dmax, amp, c = 0, maxPer = 4) {
    grid.clear();
    const cs = dmax;
    for (let i = from; i < to; i++) {
      const key = ((px[i] / cs) | 0) * 73856093 ^ ((py[i] / cs) | 0) * 19349663;
      let b = grid.get(key);
      if (!b) grid.set(key, (b = []));
      b.push(i);
    }
    const d2max = dmax * dmax;
    for (let i = from; i < to; i++) {
      const gx0 = (px[i] / cs) | 0, gy0 = (py[i] / cs) | 0;
      let count = 0;
      for (let ox = -1; ox <= 1 && count < maxPer; ox++) {
        for (let oy = -1; oy <= 1 && count < maxPer; oy++) {
          const b = grid.get(((gx0 + ox) * 73856093) ^ ((gy0 + oy) * 19349663));
          if (!b) continue;
          for (let m = 0; m < b.length; m++) {
            const j = b[m];
            if (j <= i) continue;
            const dx = px[j] - px[i], dy = py[j] - py[i];
            const d2 = dx * dx + dy * dy;
            if (d2 < d2max) {
              const a = (1 - Math.sqrt(d2) / dmax) * amp;
              pushSeg(px[i], py[i], px[j], py[j], a, c);
              if (++count >= maxPer) break;
            }
          }
        }
      }
    }
  }

  function buildSegments() {
    nseg = 0;
    const L = st.layout, g = st.global;
    const skyFrom = NM + 1, skyTo = NM + 1 + SKY;
    if (L === 'logo') {
      linkByDistance(0, N, Math.min(W, H) * (mobile ? 0.034 : 0.03), 0.55 * g, 0, 3);
    } else if (L === 'sky') {
      linkByDistance(skyFrom, skyTo, mobile ? 95 : 135, 0.34 * g);
      // métiers reliés en anneau léger
      for (let i = 0; i < NM; i++) {
        const j = (i + 1) % NM;
        pushSeg(px[i], py[i], px[j], py[j], 0.22 * g, 0);
        pushSeg(px[i], py[i], px[PROJET], py[PROJET], 0.08 * g, 2);
      }
    } else if (L === 'team') {
      linkByDistance(skyFrom, skyTo, mobile ? 80 : 110, 0.16 * g);
      const act = [...st.active].sort((a, b) => a - b);
      for (let i = 0; i < NM; i++) {
        const on = st.active.has(i);
        pushSeg(px[i], py[i], px[PROJET], py[PROJET], (on ? 0.85 : 0.07) * g, on ? 0 : 2);
      }
      for (let m = 0; m < act.length; m++) {
        const a = act[m], b = act[(m + 1) % act.length];
        if (act.length > 1) pushSeg(px[a], py[a], px[b], py[b], 0.45 * g, 0);
      }
    } else if (L === 'rives') {
      linkByDistance(0, NM + 1 + SKY + 60, mobile ? 40 : 52, 0.4 * g, 0, 3);
      const A = anchorOf(st.opts.a, null), B = anchorOf(st.opts.b, null);
      if (A && B) {
        const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
        const dx = B.x - A.x, dy = B.y - A.y;
        const cx = mx - dy * 0.35, cy = my + dx * 0.35;
        const S = 56;
        let lx = A.x, ly = A.y;
        const pulse = (st.time * 0.22) % 1;
        for (let s = 1; s <= S; s++) {
          const t = s / S, it = 1 - t;
          const x = it * it * A.x + 2 * it * t * cx + t * t * B.x;
          const y = it * it * A.y + 2 * it * t * cy + t * t * B.y;
          const dp = Math.abs(t - pulse);
          const hot = reduced ? 0 : Math.max(0, 1 - dp * 9);
          pushSeg(lx, ly, x, y, (0.45 + hot * 0.55) * g, hot > 0.25 ? 1 : 0);
          lx = x; ly = y;
        }
      }
    } else if (L === 'converge') {
      const M = Math.min(N, NM + 1 + SKY);
      for (let i = 0; i < M; i++) {
        const j = (i + 1) % M;
        pushSeg(px[i], py[i], px[j], py[j], 0.5 * g, i % 9 === 0 ? 1 : 0);
        if (i % 7 === 0) { const q = (i + 11) % M; pushSeg(px[i], py[i], px[q], py[q], 0.12 * g, 2); }
      }
    }
    // le curseur se relie aux points proches
    if (st.mouse.on && !reduced && L !== 'logo' && L !== 'point') {
      const R = mobile ? 0 : 150;
      let c = 0;
      for (let i = 0; i < N && c < 6; i++) {
        const dx = px[i] - st.mouse.x, dy = py[i] - st.mouse.y;
        const d = Math.hypot(dx, dy);
        if (d < R) { pushSeg(st.mouse.x, st.mouse.y, px[i], py[i], (1 - d / R) * 0.6 * g, 0); c++; }
      }
    }
  }

  // --- simulation
  let last = performance.now();
  function step(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    st.time += dt;
    const e6 = 1 - Math.pow(0.94, dt * 60), e8 = 1 - Math.pow(0.9, dt * 60);
    st.global += (st.globalTarget - st.global) * e6;
    st.labelAlpha += (st.labelTarget - st.labelAlpha) * e8;
    computeTargets();
    const t = st.time, dA = st.drift, m = st.mouse;
    const f = dt * 60;
    for (let i = 0; i < N; i++) {
      let gxT = tx[i], gyT = ty[i];
      if (!reduced && dA > 0) {
        gxT += Math.sin(t * 0.35 * tw[i] + ph[i]) * dA;
        gyT += Math.cos(t * 0.28 * tw[i] + ph[i] * 1.3) * dA;
      }
      if (reduced) { px[i] = gxT; py[i] = gyT; continue; }
      vx[i] += (gxT - px[i]) * k[i] * f;
      vy[i] += (gyT - py[i]) * k[i] * f;
      if (m.on && st.layout !== 'logo') {
        const dx = px[i] - m.x, dy = py[i] - m.y, d2 = dx * dx + dy * dy;
        if (d2 < 12100 && d2 > 1) {
          const d = Math.sqrt(d2), p = (1 - d / 110) ** 2 * 1.6 * f;
          vx[i] += (dx / d) * p; vy[i] += (dy / d) * p;
        }
      }
      const damp = Math.pow(0.8, f);
      vx[i] *= damp; vy[i] *= damp;
      px[i] += vx[i] * f; py[i] += vy[i] * f;
      const on = i < NM && st.active.has(i) ? 1 : 0;
      act[i] += (on - act[i]) * e8;
    }
    buildSegments();
  }

  // --- couleurs/tailles par point
  function pointStyle(i, out) {
    const g = st.global;
    const twk = reduced ? 1 : 0.72 + 0.28 * Math.sin(st.time * tw[i] * 1.4 + ph[i]);
    let a = base[i] * twk * g, s = sz[i], c = tint[i] ? COL.cyanPale : COL.givre;
    const L = st.layout;
    if (i < NM) {
      c = COL.cyan;
      s = (mobile ? 14 : 18) + act[i] * 16;
      a = (L === 'team' ? 0.45 + 0.55 * act[i] : 0.9) * g;
      if (L === 'logo' || L === 'converge' || L === 'rives' || L === 'point') { s = sz[i] + 2; a = 0.8 * g; }
    } else if (i === PROJET) {
      c = COL.corail;
      s = L === 'team' ? 30 : L === 'sky' ? 12 : sz[i];
      a = (L === 'team' || L === 'sky' ? 1 : base[i]) * g;
    } else if (L === 'team' && i > NM + 70) {
      a *= 0.5;
    }
    if (L === 'logo') { c = i % 5 ? COL.cyan : COL.givre; a = (0.75 + 0.25 * base[i]) * g; s = Math.min(s, 9); }
    out[0] = c[0]; out[1] = c[1]; out[2] = c[2]; out[3] = a; out[4] = s;
  }

  // --- étiquettes des métiers
  const labels = [];
  const lws = [];
  if (labelsEl) {
    labelsEl.innerHTML = '';
    METIERS.forEach((m) => {
      const s = document.createElement('span');
      s.className = 'c-label';
      s.textContent = m;
      labelsEl.appendChild(s);
      labels.push(s);
    });
  }
  function drawLabels() {
    if (!labels.length) return;
    const A = st.labelAlpha;
    labelsEl.style.opacity = A.toFixed(3);
    if (A < 0.01) return;
    const cx = st.opts.anchor ? anchorOf(st.opts.anchor, { x: W / 2 }).x : (mobile ? W * 0.5 : W * 0.72);
    for (let i = 0; i < NM; i++) {
      const l = labels[i];
      const on = act[i];
      const left = px[i] < cx - 4;
      const lw = lws[i] || (lws[i] = l.offsetWidth);
      let x = left ? px[i] - 14 - lw : px[i] + 14;
      x = Math.max(6, Math.min(W - 6 - lw, x));
      l.style.transform = `translate3d(${x.toFixed(1)}px, ${(py[i] - 9).toFixed(1)}px, 0)`;
      l.classList.toggle('is-on', on > 0.5);
    }
  }

  // --- rendu WebGL
  let render;
  if (useGL) {
    const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
    const renderer = new Renderer({ canvas, dpr, alpha: true, premultipliedAlpha: true, antialias: false, depth: false });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    const uRes = { value: [W, H] };
    const uDpr = { value: dpr };

    const pPos = new Float32Array(N * 2), pCol = new Float32Array(N * 4), pSize = new Float32Array(N);
    const pGeo = new Geometry(gl, {
      position: { size: 2, data: pPos, usage: gl.DYNAMIC_DRAW },
      color: { size: 4, data: pCol, usage: gl.DYNAMIC_DRAW },
      size: { size: 1, data: pSize, usage: gl.DYNAMIC_DRAW },
    });
    const pProg = new Program(gl, {
      vertex: `attribute vec2 position; attribute vec4 color; attribute float size;
        uniform vec2 uRes; uniform float uDpr; varying vec4 vC;
        void main(){ vec2 c = position / uRes * 2.0 - 1.0; c.y = -c.y; gl_Position = vec4(c, 0.0, 1.0); gl_PointSize = size * uDpr; vC = color; }`,
      fragment: `precision mediump float; varying vec4 vC;
        void main(){ float r = length(gl_PointCoord - 0.5); float core = smoothstep(0.2, 0.11, r); float halo = pow(smoothstep(0.5, 0.0, r), 3.0) * 0.55; float a = (core + halo) * vC.a; gl_FragColor = vec4(vC.rgb * a, a); }`,
      uniforms: { uRes, uDpr },
      transparent: true, depthTest: false, depthWrite: false,
    });
    pProg.setBlendFunc(gl.ONE, gl.ONE);
    const points = new Mesh(gl, { geometry: pGeo, program: pProg, mode: gl.POINTS });

    const lPos = new Float32Array(MAXSEG * 4), lCol = new Float32Array(MAXSEG * 8);
    const lGeo = new Geometry(gl, {
      position: { size: 2, data: lPos, usage: gl.DYNAMIC_DRAW },
      color: { size: 4, data: lCol, usage: gl.DYNAMIC_DRAW },
    });
    const lProg = new Program(gl, {
      vertex: `attribute vec2 position; attribute vec4 color; uniform vec2 uRes; varying vec4 vC;
        void main(){ vec2 c = position / uRes * 2.0 - 1.0; c.y = -c.y; gl_Position = vec4(c, 0.0, 1.0); vC = color; }`,
      fragment: `precision mediump float; varying vec4 vC; void main(){ gl_FragColor = vec4(vC.rgb * vC.a, vC.a); }`,
      uniforms: { uRes },
      transparent: true, depthTest: false, depthWrite: false,
    });
    lProg.setBlendFunc(gl.ONE, gl.ONE);
    const lines = new Mesh(gl, { geometry: lGeo, program: lProg, mode: gl.LINES });

    const tmp = new Float32Array(5);
    const segCol = [COL.cyan, COL.corail, COL.givre];
    render = () => {
      for (let i = 0; i < N; i++) {
        pointStyle(i, tmp);
        pPos[i * 2] = px[i]; pPos[i * 2 + 1] = py[i];
        pCol[i * 4] = tmp[0]; pCol[i * 4 + 1] = tmp[1]; pCol[i * 4 + 2] = tmp[2]; pCol[i * 4 + 3] = tmp[3];
        pSize[i] = tmp[4];
      }
      pGeo.attributes.position.needsUpdate = true;
      pGeo.attributes.color.needsUpdate = true;
      pGeo.attributes.size.needsUpdate = true;
      for (let s = 0; s < nseg; s++) {
        lPos.set(seg.subarray(s * 4, s * 4 + 4), s * 4);
        const c = segCol[segC[s]], a = Math.min(1, segA[s]);
        const o = s * 8;
        lCol[o] = lCol[o + 4] = c[0]; lCol[o + 1] = lCol[o + 5] = c[1]; lCol[o + 2] = lCol[o + 6] = c[2];
        lCol[o + 3] = lCol[o + 7] = a;
      }
      lGeo.attributes.position.needsUpdate = true;
      lGeo.attributes.color.needsUpdate = true;
      lGeo.setDrawRange(0, nseg * 2);
      renderer.render({ scene: lines });
      renderer.render({ scene: points, clear: false });
    };
    render.resize = () => { renderer.setSize(W, H); uRes.value = [W, H]; };
  } else {
    // --- secours Canvas 2D
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 64;
    const sc = sprite.getContext('2d');
    const gr = sc.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.18, 'rgba(255,255,255,0.9)');
    gr.addColorStop(0.3, 'rgba(255,255,255,0.25)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    sc.fillStyle = gr; sc.fillRect(0, 0, 64, 64);
    const tinted = {};
    const tintSprite = (key, c) => {
      if (tinted[key]) return tinted[key];
      const t = document.createElement('canvas'); t.width = t.height = 64;
      const x = t.getContext('2d');
      x.drawImage(sprite, 0, 0);
      x.globalCompositeOperation = 'source-in';
      x.fillStyle = `rgb(${c.map((v) => Math.round(v * 255)).join(',')})`;
      x.fillRect(0, 0, 64, 64);
      return (tinted[key] = t);
    };
    const tmp = new Float32Array(5);
    const segStyle = ['29,181,213', '255,107,87', '238,242,248'];
    render = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineWidth = 1;
      for (let s = 0; s < nseg; s++) {
        const j = s * 4;
        ctx.strokeStyle = `rgba(${segStyle[segC[s]]},${Math.min(1, segA[s]).toFixed(2)})`;
        ctx.beginPath(); ctx.moveTo(seg[j], seg[j + 1]); ctx.lineTo(seg[j + 2], seg[j + 3]); ctx.stroke();
      }
      for (let i = 0; i < N; i++) {
        pointStyle(i, tmp);
        const key = tmp[0] > 0.9 && tmp[1] < 0.6 ? 'corail' : tmp[0] < 0.2 ? 'cyan' : tmp[0] < 0.7 ? 'cyanPale' : 'givre';
        ctx.globalAlpha = Math.min(1, tmp[3]);
        const s = tmp[4];
        ctx.drawImage(tintSprite(key, COL[key]), px[i] - s / 2, py[i] - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
    };
    render.resize = () => {
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    };
  }

  function resize() {
    const ow = W, oh = H;
    W = window.innerWidth; H = window.innerHeight;
    if (ow && oh) for (let i = 0; i < N; i++) { px[i] *= W / ow; py[i] *= H / oh; }
    render.resize();
    lws.length = 0;
    if (reduced) snap();
  }
  resize();

  let raf = 0;
  const visible = () => st.running && !document.hidden && parseFloat(getComputedStyle(canvas).opacity || '1') > 0.01;
  let frameSkip = 0;
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!st.running || document.hidden) { last = now; return; }
    if ((frameSkip++ & 15) === 0 && !visible()) { st.hidden = true; } else if ((frameSkip & 15) === 1) { st.hidden = !visible(); }
    if (st.hidden) { last = now; return; }
    step(now);
    render();
    drawLabels();
  }
  raf = requestAnimationFrame(loop);

  window.addEventListener('resize', () => { resize(); }, { passive: true });
  if (!mobile) {
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      st.mouse.x = e.clientX; st.mouse.y = e.clientY; st.mouse.on = true;
    }, { passive: true });
    document.addEventListener('pointerleave', () => { st.mouse.on = false; });
  }

  if (reduced) snap();

  return {
    renderer: useGL ? 'webgl' : 'canvas2d',
    setLayout,
    setActive,
    setDim: (v) => { st.globalTarget = v; },
    setLabels: (v) => { st.labelTarget = v; },
    get layout() { return st.layout; },
    snap,
    stop: () => { st.running = false; cancelAnimationFrame(raf); },
  };
}
