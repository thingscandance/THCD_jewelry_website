// POSTER engine: a poster is a list of elements (text boxes, image slots, colour blocks) built by a layout,
// then painted at time t by a motion preset. Text is fitted once per build (fit.js), so it can never leave its box.
import { fitJustify, fitWrap, drawRun, fontStr } from './fit.js';

export const FORMATS = { '3x4': [1080, 1440, 'feed 3:4, fills the profile grid'], '4x5': [1080, 1350, 'feed 4:5'], '9x16': [1080, 1920, 'reels / stories 9:16'], '1x1': [1080, 1080, 'square 1:1'] };
export const FPS = 30;
export const FONTS = {
  anton: { name: 'Anton', family: '"Anton", Impact, "Arial Narrow", sans-serif', weight: 400 },
  shoulders: { name: 'Big Shoulders', family: '"Big Shoulders Display", "Arial Narrow", sans-serif', weight: 900, light: 300 },
  league: { name: 'League Gothic', family: '"League Gothic", "Arial Narrow", sans-serif', weight: 400 },
  oswald: { name: 'Oswald', family: '"Oswald", "Arial Narrow", sans-serif', weight: 700, light: 300 },
  bebas: { name: 'Bebas Neue', family: '"Bebas Neue", "Arial Narrow", sans-serif', weight: 400 },
  sixcaps: { name: 'Six Caps', family: '"Six Caps", "Arial Narrow", sans-serif', weight: 400 },
  doto: { name: 'Doto (dots)', family: '"Doto", "Geist Mono", monospace', weight: 900 },
  barlow: { name: 'Barlow Condensed 800', family: '"Barlow Condensed", "Arial Narrow", sans-serif', weight: 800 },
  serif: { name: 'Instrument Serif', family: '"Instrument Serif", Georgia, serif', weight: 400, style: 'normal' },
};
export const INFO_FONTS = {
  space: { name: 'Space Mono', family: '"Space Mono", "Geist Mono", ui-monospace, monospace', weight: 400 },
  barlow: { name: 'Barlow Condensed', family: '"Barlow Condensed", "Arial Narrow", sans-serif', weight: 600 },
  oswald: { name: 'Oswald', family: '"Oswald", "Arial Narrow", sans-serif', weight: 500 },
  mono: { name: 'Geist Mono', family: '"Geist Mono", ui-monospace, monospace', weight: 500 },
  geist: { name: 'Geist', family: '"Geist", system-ui, sans-serif', weight: 500 },
};
// own set first (built for night flash photos: concrete, sodium light, bleach, chlorine); the reference club colours after
export const PALETTES = [
  { id: 'acid', name: 'THCD acid', bg: '#0A0A08', ink: '#B8FF00', acc: '#B8B8B8' },
  { id: 'gold', name: 'THCD gold', bg: '#0A0A08', ink: '#C8A96A', acc: '#B8FF00' },
  { id: 'concrete', name: 'concrete', bg: '#CFCBC1', ink: '#151515', acc: '#FF3D00' },
  { id: 'flash', name: 'night flash', bg: '#0B0F0D', ink: '#E9FF3B', acc: '#A9B4AE' },
  { id: 'sodium', name: 'sodium lamp', bg: '#1C0E05', ink: '#FF8A00', acc: '#F3E3C8' },
  { id: 'chlorine', name: 'chlorine', bg: '#BDEDE2', ink: '#06302A', acc: '#FF2E63' },
  { id: 'bleach', name: 'bleach', bg: '#F3F2EC', ink: '#E10600', acc: '#0A0A0A' },
  { id: 'uv', name: 'ultraviolet', bg: '#140A2E', ink: '#C3A8FF', acc: '#FF4FD8' },
  { id: 'moss', name: 'moss', bg: '#26311F', ink: '#E4E9CB', acc: '#FF5C1A' },
  { id: 'xerox', name: 'xerox blue', bg: '#FFFFFF', ink: '#0038FF', acc: '#0A0A0A' },
  { id: 'rust', name: 'rust', bg: '#8A2A0E', ink: '#F6D9C6', acc: '#1B1B1B' },
  { id: 'thcd', name: 'studio pink', bg: '#000000', ink: '#E61E9C', acc: '#E9ECEA' },
  { id: 'drip', name: 'ref: pink coral', ref: true, bg: '#F8C9EF', ink: '#FF5B4F', acc: '#1A1A1A' },
  { id: 'futur', name: 'ref: coral violet', ref: true, bg: '#FF5F52', ink: '#7A14F0', acc: '#F8C9EF' },
  { id: 'dry', name: 'ref: mint blue', ref: true, bg: '#C4F8C3', ink: '#1F18E6', acc: '#FF5F52' },
  { id: 'club', name: 'ref: blue pink', ref: true, bg: '#2510EE', ink: '#F8C9EF', acc: '#C4F8C3' },
  { id: 'roundup', name: 'ref: plum orange', ref: true, bg: '#5B2470', ink: '#FF9B2F', acc: '#C4F8C3' },
];
export const TREATMENTS = {
  original: 'original colour', flash: 'flash · punchy contrast, real colour', grade: 'grade · colour pulled to the palette', mono: 'mono · soft black and white', bw: 'black and white, hard',
  duo: 'duotone · ink to paper', tone3: '3 tones · ink, accent, paper',
  riso: 'riso · two inks over the photo', halftone: 'halftone · dots over the photo', xerox: 'xerox · photocopy edges', dither: 'dither · fine pixel grid', burn: 'burnt · crushed blacks, grain',
};
export const TEXTURED = new Set(['riso', 'halftone', 'xerox', 'dither', 'tone3']);
// echo copies step: fraction of the figure size per copy; negative = copies go left / up
export const ECHO_DIRS = { diag: [-.3, -.16], side: [-.42, 0], up: [0, -.2], down: [.08, .2] };
export const TYPE_STYLES = { fill: 'solid', stroke: 'outline', mix: 'solid and outline, alternating', photo: 'photo inside the letters' };
export const LAYOUTS = {
  stack: 'STACK — headline repeated down the page',
  split: 'SPLIT — headline, photo box, list, big name',
  figure: 'FIGURE — type between the photo and the person',
  behind: 'BEHIND — giant words behind the figure',
  collage: 'COLLAGE — pieces over a wall of type',
  lineup: 'LINEUP — dated rows with photos',
};
export const MOTIONS = {
  build: 'BUILD — type assembles from slices, glitches, falls apart',
  scroll: 'SCROLL — headlines run like tickers',
  flip: 'FLIP — colours swap on the beat',
  boil: 'BOIL — stop-motion collage, pieces slam in',
  letters: 'LETTERS — letters drop and climb in a wave',
  cut: 'CUT — headline rows switch solid, outline and colour on the beat',
  echo: 'ECHO — outlined copies trail behind the headline',
  still: 'STILL — no motion, for a PNG',
};

const rng = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const hash = (...a) => rng(a.reduce((h, x) => Math.imul(h ^ Math.round(x * 997), 2654435761) >>> 0, 0x9E3779B9))();
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const easeOut = p => 1 - Math.pow(1 - p, 3);
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const luma = h => { const [r, g, b] = hex(h); return (r * .3 + g * .59 + b * .11) / 255; };

export class Poster {
  constructor() { this.c = document.createElement('canvas'); this.g = this.c.getContext('2d'); this.els = []; this.cache = new Map(); this.setFormat('4x5'); }
  setFormat(f) { const [w, h] = FORMATS[f]; this.fmt = f; this.W = this.c.width = w; this.H = this.c.height = h; }
  // auto: the direction that lets the person be biggest in this slot
  echoDir(src, b) { const S = this.S, N = S.echoN || 3; if (S.echoDir && S.echoDir !== 'auto') return ECHO_DIRS[S.echoDir] || ECHO_DIRS.diag; let best = ECHO_DIRS.diag, bs = 0;
    for (const k of ['diag', 'side', 'up']) { const [fx, fy] = ECHO_DIRS[k], sc = Math.min(b.w / (src.width * (1 + N * Math.abs(fx))), b.h / (src.height * (1 + N * Math.abs(fy)))); if (sc > bs * 1.08) { bs = sc; best = ECHO_DIRS[k]; } } return best; }
  // eraser: remove a round patch from a cut-out and from every cached copy of it, so the change shows at once
  erase(im, u, v, r) { const hit = c => { const x = c.getContext('2d'); x.save(); x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.arc(u * c.width / im.cut.width, v * c.height / im.cut.height, r * c.width / im.cut.width, 0, 7); x.fill(); x.restore(); };
    hit(im.cut); for (const [k, c] of [...this.cache]) { if (!k.startsWith(im.id + '|')) continue; if (k.includes('|ring|')) { this.cache.delete(k); continue; } if (k.includes('|cut|') || k.includes('|sil|')) { if (c.a) { hit(c.a); hit(c.b); } else if (c.getContext) hit(c); } } im.dist = null; }
  forget(id) { for (const k of this.cache.keys()) if (k.startsWith(id + '|')) this.cache.delete(k); }

  // ---------- images ----------
  lum(src) { // luminance 0..1 per pixel, plus alpha
    const x = src.getContext ? src.getContext('2d') : null, w = src.width, h = src.height; let d;
    if (x) d = x.getImageData(0, 0, w, h).data; else { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.drawImage(src, 0, 0); d = g.getImageData(0, 0, w, h).data; }
    const L = new Float32Array(w * h), A = new Uint8Array(w * h), hist = new Uint32Array(256); let n = 0;
    for (let i = 0; i < L.length; i++) { L[i] = (d[i * 4] * .3 + d[i * 4 + 1] * .59 + d[i * 4 + 2] * .11) / 255; A[i] = d[i * 4 + 3]; if (A[i] > 128) { hist[Math.min(255, L[i] * 255 | 0)]++; n++; } }
    // auto levels: night flash photos are mostly dark, so stretch the 1%..99% range to full before any print look
    let lo = 0, hi = 255, acc = 0; for (let k = 0; k < 256; k++) { acc += hist[k]; if (acc > n * .01) { lo = k; break; } } acc = 0; for (let k = 255; k >= 0; k--) { acc += hist[k]; if (acc > n * .01) { hi = k; break; } }
    const a = lo / 255, span = Math.max(.08, (hi - lo) / 255), mid = (() => { let c = 0; for (let k = 0; k < 256; k++) { c += hist[k]; if (c > n / 2) return (k / 255 - a) / span; } return .5; })(), gam = Math.log(.5) / Math.log(clamp(mid, .05, .95));
    for (let i = 0; i < L.length; i++) L[i] = Math.pow(clamp((L[i] - a) / span), gam);
    return { L, A, w, h };
  }
  // halftone screen of one ink: dots grow with darkness; angle in degrees, cell in px
  screen(Lm, dark, ang, cell, rgb) { const { L, A, w, h } = Lm, c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'), im = x.createImageData(w, h), D = im.data, ca = Math.cos(ang * Math.PI / 180), sa = Math.sin(ang * Math.PI / 180);
    for (let y = 0; y < h; y++) for (let q = 0; q < w; q++) { const u = q * ca + y * sa, v = -q * sa + y * ca, cu = (Math.floor(u / cell) + .5) * cell, cv = (Math.floor(v / cell) + .5) * cell;
      const sx = Math.round(cu * ca - cv * sa), sy = Math.round(cu * sa + cv * ca), j = (Math.min(h - 1, Math.max(0, sy)) * w + Math.min(w - 1, Math.max(0, sx)));
      const r = Math.sqrt(Math.max(0, dark(L[j]))) * cell * .74, dist = Math.hypot(u - cu, v - cv), cov = Math.max(0, Math.min(1, r - dist + .5)); if (!cov) continue; const i = (y * w + q) * 4; D[i] = rgb[0]; D[i + 1] = rgb[1]; D[i + 2] = rgb[2]; D[i + 3] = cov * A[y * w + q]; }
    x.putImageData(im, 0, 0); return c; }
  // riso: two ink layers kept apart so their register can drift in the loop
  riso(im, which, pal) { const key = `${im.id}|${which}|riso|${pal.ink}|${pal.acc}`; let r = this.cache.get(key); if (r) return r; const src = which === 'cut' ? im.cut : im.src, Lm = this.lum(src), cell = Math.max(3, Math.round(Math.max(src.width, src.height) / 320)), con = v => clamp((v - .5) * 1.5 + .5);
    const dark = luma(pal.bg) < .45, tone = v => dark ? con(v) : 1 - con(v); // on dark paper the inks print the light parts
    r = { dark, a: this.screen(Lm, v => Math.pow(tone(v), dark ? 2.2 : 1.6), 15, cell, hex(pal.ink)), b: this.screen(Lm, v => { const k = tone(v); return k * (1 - k) * 3.2 + k * .25; }, 75, cell * 1.08, hex(pal.acc)) }; this.cache.set(key, r); return r; }
  // every print look sits on a continuous-tone version of the photo, so the picture stays readable;
  // strength (S.fx, 0..1) decides how much of the print texture is laid over it
  treated(im, which, tr, pal) {
    const src = which === 'cut' ? im.cut : im.src; if (tr === 'original' || !src) return src;
    const fx = this.S.fx ?? .5, key = `${im.id}|${which}|${tr}|${pal.bg}|${pal.ink}|${pal.acc}|${fx}`; let c = this.cache.get(key); if (c) return c;
    if (this.cache.size > 300) this.cache.clear();
    const Lm = this.lum(src), { L, A, w, h } = Lm; c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
    const sorted = [pal.ink, pal.acc, pal.bg].sort((p, q) => luma(p) - luma(q)), dk = hex(luma(sorted[0]) < .3 ? sorted[0] : '#0a0a0a'), lt = hex(sorted[2]), inv = luma(pal.bg) < .45;
    const sd = x.getContext ? null : null, s0 = (() => { const t = document.createElement('canvas'); t.width = w; t.height = h; const g = t.getContext('2d'); g.drawImage(src, 0, 0); return g.getImageData(0, 0, w, h).data; })();
    const d = x.createImageData(w, h), D = d.data, P3 = sorted.map(hex), R = rng(7), B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5], ink = hex(pal.ink), paper = hex(pal.bg);
    const nz = tr === 'xerox' ? (() => { const n = new Float32Array(w * h); for (let i = 0; i < n.length; i++) n[i] = R(); return n; })() : null, px = Math.max(1, Math.round(Math.max(w, h) / 700));
    const lerp = (p, q, k) => [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k, p[2] + (q[2] - p[2]) * k], S3 = v => v * v * (3 - 2 * v);
    // continuous tone in the palette: darkest colour to lightest colour
    const tone = v => lerp(dk, lt, S3(clamp((v - .5) * 1.15 + .5)));
    for (let y = 0; y < h; y++) for (let q = 0; q < w; q++) { const j = y * w + q, i = j * 4, v = L[j], r0 = s0[i], g0 = s0[i + 1], b0 = s0[i + 2]; let out;
      if (tr === 'flash') { const k = c0 => 255 * S3(clamp(((c0 / 255 - .5) * 1.3 + .52))); const m = (r0 + g0 + b0) / 3; out = [k(m + (r0 - m) * 1.2), k(m + (g0 - m) * 1.2), k(m + (b0 - m) * 1.2)]; }
      else if (tr === 'grade') { const t = tone(v), o = [r0, g0, b0].map(c0 => 255 * S3(clamp((c0 / 255 - .5) * 1.15 + .5))); out = lerp(o, t, .55); }
      else if (tr === 'mono') { const g = 255 * S3(clamp((v - .5) * 1.1 + .5)); out = [g, g, g]; }
      else if (tr === 'bw') { const g = 255 * S3(clamp((v - .5) * 1.6 + .5)); out = [g, g, g]; }
      else if (tr === 'duo') out = tone(v);
      else if (tr === 'tint') out = lerp([8, 8, 8], ink, S3(clamp((v - .5) * 1.2 + .5)));
      else if (tr === 'burn') { let u = clamp((v - .42) * 1.6 + .42); u = u * u; u = clamp(u + (R() - .5) * .09); out = lerp([0, 0, 0], [236, 232, 222], u); }
      else if (tr === 'tone3') { const u = clamp((v - .5) * 1.2 + .5), hard = u < .36 ? P3[0] : u < .66 ? P3[1] : P3[2], soft = u < .5 ? lerp(P3[0], P3[1], S3(u / .5)) : lerp(P3[1], P3[2], S3((u - .5) / .5)); out = lerp(soft, hard, fx); }
      else if (tr === 'xerox') { const u = clamp((v - .5) * 1.8 + .55), bit = (u + (nz[j] - .5) * .3 + (nz[(j * 7) % nz.length] - .5) * .15 < .5) !== inv ? ink : paper; out = lerp(tone(v), bit, fx * .85); }
      else if (tr === 'dither') { const sx = Math.floor(q / px), sy = Math.floor(y / px), u = clamp((v - .5) * 1.2 + .5), bit = (u * 16 > B4[(sy & 3) * 4 + (sx & 3)] + .5) !== inv ? paper : ink; out = lerp(tone(v), bit, fx); }
      else out = tone(v); // halftone / riso base
      D[i] = out[0]; D[i + 1] = out[1]; D[i + 2] = out[2]; D[i + 3] = A[j]; }
    x.putImageData(d, 0, 0);
    if (tr === 'halftone') { x.globalAlpha = fx; x.drawImage(this.screen(Lm, u => Math.pow(inv ? clamp((u - .5) * 1.3 + .5) : 1 - clamp((u - .5) * 1.3 + .5), 1.3), 45, Math.max(3, Math.round(Math.max(w, h) / 300)), hex(inv ? pal.ink : sorted[0])), 0, 0); x.globalAlpha = 1; if (which === 'cut') { x.globalCompositeOperation = 'destination-in'; x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-over'; } }
    this.cache.set(key, c); return c;
  }
  // moving paper grain: 6 noise tiles cycled at 12 fps, so it boils without breaking the loop
  grain() { if (this._grain) return this._grain; const R = rng(99); this._grain = Array.from({ length: 6 }, () => { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), d = x.createImageData(256, 256); for (let i = 0; i < d.data.length; i += 4) { const v = R() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } x.putImageData(d, 0, 0); return c; }); return this._grain; }
  sil(im, color) { const key = `${im.id}|sil|${color}`; let c = this.cache.get(key); if (c) return c; const s = im.cut;
    c = document.createElement('canvas'); c.width = s.width; c.height = s.height; const x = c.getContext('2d'); x.drawImage(s, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height); this.cache.set(key, c); return c; }

  // ---------- layout ----------
  build(S) {
    this.S = S; const { W, H } = this, g = this.g, T = S.text, M = Math.round(W * (S.side ? .068 : .04)), G = Math.round(W * .016);
    const F = S.customFont || FONTS[S.font] || FONTS.anton, FN = FONTS[S.font2] || FONTS.barlow, FI = INFO_FONTS[S.info] || INFO_FONTS.space, FD = F;
    const cut = S.mode === 'cut', imgs = S.images, n = imgs.length, els = []; let order = 0;
    const minBig = Math.round(W * .03), hasName = !!T.name.trim();
    // three levels, one scale for the whole poster: display (fills its frame), secondary (FN), utility mono (fixed small size)
    const SZ = W * .023, SZL = W * .0135, LBL = S.labels !== false, VH = ml => SZ * 1.3 * ml, RH = (ml = 1) => (LBL ? SZL * 1.6 : 0) + VH(ml);
    let nTitle = 0; const text = (field, mode, value, box, o = {}) => { const f = o.font || FD, disp = f !== FI; const el = { kind: 'text', field, mode, value, box, f, o: { upper: S.caps, autoBreak: mode === 'justify' && field !== 'lines', minSize: minBig, track: disp ? (S.track || 0) : .14, ...o }, color: o.color || 'ink', layer: o.layer ?? 2, order: order++, group: o.group, role: o.role || 'info', alpha: o.alpha }; if (mode === 'justify' && S.lead != null && !o.keepGap) el.o.gap = S.lead;
      if (el.role === 'title' && f === FD) { const st = S.tstyle || 'fill', k = nTitle++; el.style = st === 'mix' ? (k % 2 ? 'stroke' : 'fill') : st; }
      els.push(el); return el; };
    const info = (field, value, box, o = {}) => text(field, 'wrap', value, box, { font: FI, minSize: SZ * .72, maxSize: SZ, lh: 1.3, maxLines: o.maxLines || 1, upper: true, ...o });
    const LABEL = { date: 'when', place: 'where', sub: 'what', lines: 'program', footer: 'info' };
    const label = (f, box, o) => text('_label', 'wrap', LABEL[f], box, { font: FI, minSize: SZL * .8, maxSize: SZL, maxLines: 1, upper: true, track: .18, alpha: .55, ...o });
    const img = (idx, box, o = {}) => { if (!n) return; const el = { kind: 'img', idx: idx % n, box, cut, clip: o.clip ?? !cut, layer: o.layer ?? 1, order: order++, rot: o.rot || 0, card: o.card, plate: o.plate, full: o.full, cycle: o.cycle }; els.push(el); return el; };
    const rect = (box, color, o = {}) => els.push({ kind: 'rect', box, color, layer: o.layer ?? 0, order: o.static ? -1 : order++, static: o.static, alpha: o.alpha });
    const rule = (y, layer = 2, x = M, w = W - 2 * M) => rect({ x, y, w, h: Math.max(1.5, W * .0016) }, 'ink', { layer, alpha: .5, static: true });
    // a row of label/value cells on the column grid, with a hairline above it
    const row = (y, cells, o = {}) => { cells = cells.filter(c => (c[1] || '').trim()); const k = cells.length; if (!k) return 0; const ml = o.lines || 1, w = (W - 2 * M - G * (k - 1)) / k;
      if (o.rule !== false) rule(y - G * .7, o.layer);
      cells.forEach(([f, v], i) => { const x = M + i * (w + G), al = k === 1 ? 'left' : i === 0 ? 'left' : i === k - 1 ? 'right' : 'center'; let yy = y;
        if (LBL) { label(f, { x, y: yy, w, h: SZL * 1.2 }, { align: al, layer: o.layer, color: o.color }); yy += SZL * 1.6; }
        info(f, v, { x, y: yy, w, h: VH(ml) }, { align: al, group: o.group, layer: o.layer, color: o.color, maxLines: ml }); });
      return RH(ml); };
    // a column of label/value blocks (SPLIT side panel)
    const stack = (x, y, w, h, cells, o = {}) => { cells = cells.filter(c => (c[1] || '').trim()); const each = RH(2) + G; let yy = o.bottom ? y + h - each * cells.length + G : y;
      cells.forEach(([f, v]) => { rule(yy - G * .7, o.layer, x, w); if (LBL) { label(f, { x, y: yy, w, h: SZL * 1.2 }, { layer: o.layer }); } info(f, v, { x, y: yy + (LBL ? SZL * 1.6 : 0), w, h: VH(2) }, { maxLines: 2, group: 'side', layer: o.layer }); yy += each; }); };
    const when = [T.date, T.time].filter(Boolean).join(' · '), titleLines = T.title.split('\n').filter(s => s.trim()), lines = T.lines.split('\n').filter(s => s.trim()), plain = lines.map(s => s.replace(/\s*\|\s*/, '  ')), plainText = plain.join('\n');
    const fmt = this.fmt, top3 = [['date', when], ['place', T.place], ['sub', T.sub]], bottom2 = [['lines', plain.join(' / ')], ['footer', T.footer]];
    const stretchMax = S.stretch ? 1.6 : 1;

    if (S.layout === 'stack') {
      const rows = fmt === '9x16' ? 3 : 2, fh = RH(), avail = H - 2 * M - fh - 2 * G, block = avail / rows;
      const hn = hasName ? (block - RH() - 3 * G) * .24 : 0, ht = block - RH() - hn - G * (hasName ? 4 : 3);
      for (let r = 0; r < rows; r++) { const y = M + r * block, lay = cut ? (r % 2 ? 2 : 0) : 2;
        text('title', 'justify', titleLines, { x: M, y, w: W - 2 * M, h: ht }, { role: 'title', layer: lay, gap: .04, stretch: stretchMax, valign: 'center' });
        row(y + ht + G * 1.6, [['place', T.place], ['date', when], ['sub', T.sub]], { group: 'row', layer: lay });
        if (hn) text('name', 'justify', [T.name], { x: M, y: y + ht + RH() + G * 2.6, w: W - 2 * M, h: hn }, { role: 'name', layer: lay, font: FN }); }
      row(H - M - fh, [['footer', T.footer]], { group: 'foot' });
      if (cut) { const k = Math.min(n, 3); for (let i = 0; i < k; i++) { const w = (W * 1.15) / k; img(i, { x: -W * .075 + i * w * .87, y: H * .06, w: k === 1 ? W * 1.15 : w * 1.15, h: H - M - fh - G - H * .06 }); } }
      else img(0, { x: 0, y: 0, w: W, h: H }, { layer: 0, full: true, cycle: true });
    }
    else if (S.layout === 'split') {
      const ht = H * .14, hn = hasName ? H * .11 : 0, y0 = M + ht + G * 2, y1 = H - M - (hn ? hn + G * 2 : 0), mh = y1 - y0, cw = (W - 2 * M - G * 2) * .5;
      text('title', 'justify', titleLines.length ? [titleLines.join(' ')] : [], { x: M, y: M, w: W - 2 * M, h: ht }, { role: 'title', gap: .04 });
      const hs = mh * .14, hl = mh * .42;
      text('sub', 'justify', [T.sub], { x: M, y: y0, w: cw, h: hs }, { role: 'name', font: FN, valign: 'top', autoBreak: false });
      text('lines', 'wrap', plainText, { x: M, y: y0 + hs + G * 1.5, w: cw, h: hl }, { role: 'name', font: FN, minSize: minBig * .9, lh: 1.0, maxLines: 8 });
      stack(M, y0 + hs + hl + G * 4, cw, mh - hs - hl - G * 4, [['place', T.place], ['date', when], ['footer', T.footer]], { bottom: true });
      const pb = { x: M + cw + G * 2, y: y0, w: W - 2 * M - cw - G * 2, h: mh };
      if (cut) rect(pb, 'acc', { layer: 1 }); img(0, pb, { clip: true, cycle: true });
      if (hn) text('name', 'justify', [T.name], { x: M, y: H - M - hn, w: W - 2 * M, h: hn }, { role: 'title', valign: 'bottom' });
    }
    else if (S.layout === 'figure' || S.layout === 'behind') {
      // FIGURE: the whole frame behind, the type on it, the same person cut out back on top, exactly in place
      // BEHIND: giant words on paper colour, the cut-out person in front
      const fig = S.layout === 'figure', lay = fig ? 3 : 2, th = row(M, top3, { group: 'row', layer: lay, rule: false }), fh = RH(2);
      let tl = titleLines; if (tl.length === 1 && tl[0].trim().includes(' ')) tl = tl[0].trim().split(/\s+/);
      const ty = M + th + G * 2, tb = H - M - fh - G * 2.5, hn = hasName ? (tb - ty) * .12 : 0, tt = tb - hn - (hn ? G * 1.5 : 0);
      text('title', 'justify', tl, { x: M, y: ty, w: W - 2 * M, h: tt - ty }, { role: 'title', layer: fig ? 1 : 0, valign: 'center', gap: .03, maxSize: (tt - ty) / Math.max(1, tl.length) * 1.3, stretch: stretchMax });
      if (hn) text('name', 'justify', [T.name], { x: M, y: tb - hn, w: W - 2 * M, h: hn }, { role: 'name', layer: lay, color: 'acc', font: FN });
      row(H - M - fh, bottom2, { group: 'foot', layer: lay, lines: 2 });
      if (fig) { const fb = { x: 0, y: 0, w: W, h: H }; if (n) { els.push({ kind: 'img', idx: 0, box: fb, cut: false, clip: true, layer: 0, order: order++, full: true, cycle: true });
        if (cut) els.push({ kind: 'img', idx: 0, box: fb, cut: true, inplace: true, clip: true, layer: 2, order: order++, full: true, cycle: true }); } }
      else { if (cut) { const fy = H * (fmt === '9x16' ? .3 : .16); img(0, { x: W * .04, y: fy, w: W * .92, h: tb - fy + (hn ? hn * .5 : 0) }, { cycle: true }); } else img(0, { x: 0, y: 0, w: W, h: H }, { layer: 0, full: true, cycle: true }); }
    }
    else if (S.layout === 'collage') {
      const bt = RH(), fh = RH(2), hn = hasName ? H * .09 : 0, bb = fh + hn + (hn ? G * 2 : 0) + G, k = fmt === '9x16' ? 6 : fmt === '1x1' ? 3 : 4, ry0 = M + bt + G * 2, ry1 = H - M - bb - G, rh = (ry1 - ry0 - G * (k - 1)) / k, word = titleLines.join(' ');
      for (let r = 0; r < k; r++) text('title', 'justify', [word], { x: M, y: ry0 + r * (rh + G), w: W - 2 * M, h: rh }, { role: 'title', layer: 0, color: r % 2 ? 'acc' : 'ink', valign: 'center', stretch: stretchMax, autoBreak: false });
      rect({ x: 0, y: 0, w: W, h: M + bt + G }, 'bg', { layer: 2 });
      row(M, top3, { group: 'row', rule: false });
      rect({ x: 0, y: H - M - bb, w: W, h: bb + M }, 'bg', { layer: 2 });
      if (hn) text('name', 'justify', [T.name], { x: M, y: H - M - bb + G, w: W - 2 * M, h: hn }, { role: 'name', font: FN });
      row(H - M - fh, bottom2, { group: 'foot', lines: 2 });
      const R = rng(S.seed * 7919 + 13), k2 = Math.min(n, 5), top = M + bt + G * 2, bot = H - M - bb - G;
      for (let i = 0; i < k2; i++) { const u = k2 === 1 ? .5 : i / (k2 - 1);
        if (cut) { const big = k2 <= 2, h = (bot - top) * (big ? .75 + R() * .25 : .45 + R() * .2), w = W * (k2 === 1 ? .9 : big ? .6 : .5), row2 = !big && i % 2, yb = big ? bot : row2 ? top + (bot - top) * .55 : bot; img(i, { x: M + u * (W - 2 * M - w) + (R() - .5) * W * .06, y: Math.max(top, yb - h) + (R() - .3) * H * .02, w, h }, { rot: (R() - .5) * 10, layer: row2 ? 1 : 2 }); }
        else { const w = W * (k2 === 1 ? .7 : .44 + R() * .1), a = imgs[i].src.height / imgs[i].src.width, h = Math.min(w * clamp(a, .7, 1.45), (bot - top) * (k2 > 2 ? .55 : .85));
          const col = k2 <= 2 ? u : (i % 2 ? 1 : 0) * .9 + R() * .1, yy = top + (k2 === 1 ? (bot - top - h) / 2 : u * (bot - top - h));
          img(i, { x: M + col * (W - 2 * M - w), y: yy, w, h }, { rot: (R() - .5) * 9, card: true, clip: true }); } }
    }
    else if (S.layout === 'lineup') {
      const ht = H * .1, fh = RH();
      text('title', 'justify', titleLines.length ? [titleLines.join(' ')] : [], { x: M, y: M, w: W - 2 * M, h: ht }, { role: 'title' });
      const rh0 = row(M + ht + G * 2.2, [['sub', T.sub], ['place', T.place]], { group: 'row', rule: false });
      row(H - M - fh, [['date', when], ['footer', T.footer]], { group: 'foot' });
      const y0 = M + ht + G * 2.2 + rh0 + G * 2.5, y1 = H - M - fh - G * 2, items = (lines.length ? lines : ['']).slice(0, 6), k = items.length, rh = (y1 - y0 - G * (k - 1)) / k;
      items.forEach((s, i) => { const y = y0 + i * (rh + G), m = s.match(/^\s*([\d][\d.:/-]*)\s*[|·—-]?\s*(.*)$/), d = m ? m[1] : '', t = m ? m[2] : s;
        rule(y - G / 2 - 1, 0);
        const dw = d ? W * .2 : 0, tw = n ? Math.min(rh - G, W * .2) : 0;
        if (d) text('lines', 'justify', [d], { x: M, y: y + G * .4, w: dw, h: rh - G * .8 }, { role: 'title', color: 'acc', valign: 'center', maxSize: rh * .8 });
        if (n) { const b = { x: M + dw + G, y: y + G * .4, w: tw, h: rh - G * .8 }; if (cut) rect(b, 'acc', { layer: 1 }); img(i, b, { clip: true }); }
        text('lines', 'wrap', t, { x: M + dw + tw + 2 * G, y: y + G * .4, w: W - 2 * M - dw - tw - 2 * G, h: rh - G * .8 }, { role: 'name', font: FN, minSize: minBig * .8, maxLines: 3, lh: .98, valign: 'center' }); });
    }

    // scatter words (THCD annotation grid): small mono words at low opacity in the empty space, decoration only
    if (S.scatter) { const R2 = rng(S.seed * 31 + 5), pool = [...T.title.split(/\s+/), T.place, T.date, T.time, 'THCD', 'THINGS', 'CAN', 'DANCE', 'HAND', 'CUT', 'NO.' + String(S.seed).padStart(2, '0')].filter(Boolean), boxes = els.filter(e => e.kind === 'text').map(e => e.box), hit = (b) => boxes.some(q => b.x < q.x + q.w && b.x + b.w > q.x && b.y < q.y + q.h && b.y + b.h > q.y);
      let placed = 0; for (let tries = 0; tries < 400 && placed < 16; tries++) { const wd = pool[Math.floor(R2() * pool.length)], bw = W * (.08 + R2() * .14), b = { x: M + R2() * (W - 2 * M - bw), y: M + R2() * (H - 2 * M - SZL * 1.4), w: bw, h: SZL * 1.3 }; if (hit(b)) continue; boxes.push(b);
        text('_scatter', 'wrap', wd, b, { font: FI, minSize: SZL * .7, maxSize: SZL, maxLines: 1, upper: true, track: .18, alpha: .4, layer: 0, color: R2() < .7 ? 'ink' : 'acc', align: R2() < .5 ? 'left' : 'right' }); placed++; } }
    if (S.side) { const sw = M * .42, sh = H - 2 * M, msg = [T.place, when].filter(Boolean).join('   ·   '), msg2 = [T.footer, T.sub].filter(Boolean).join('   ·   ');
      [[(M - sw) / 2, -1, msg], [W - M + (M - sw) / 2, 1, msg2]].forEach(([x, v, m]) => { const el = text(v < 0 ? 'place' : 'footer', 'wrap', m, { x, y: M, w: sw, h: sh }, { font: FI, maxLines: 1, minSize: SZL * .8, maxSize: Math.min(sw * .9, SZ), align: 'center', upper: true, track: .18, layer: 3 }); el.vert = v; }); }
    if (S.tstyle === 'photo' && n < 2) for (let i = els.length - 1; i >= 0; i--) if (els[i].kind === 'img' && els[i].full && !els[i].cut && S.layout !== 'figure') els.splice(i, 1);
    // fit every text box; boxes in the same group share one size so rows of small type line up
    const fitOne = (el, cap) => { const o = cap ? { ...el.o, maxSize: Math.min(el.o.maxSize ?? Infinity, cap) } : el.o;
      const bx = el.vert ? { x: 0, y: 0, w: el.box.h, h: el.box.w } : el.box; el.fit = el.mode === 'justify' ? fitJustify(g, el.f, el.value, bx, o) : fitWrap(g, el.f, el.value || '', bx, o); };
    els.filter(e => e.kind === 'text').forEach(e => fitOne(e));
    const groups = {}; els.forEach(e => { if (e.kind === 'text' && e.group && e.fit.size) (groups[e.group] = groups[e.group] || []).push(e); });
    for (const k in groups) { const s = Math.min(...groups[k].map(e => e.fit.size)); groups[k].forEach(e => { if (e.fit.size > s * 1.001) fitOne(e, s); }); }
    els.forEach(e => { if (e.kind !== 'text') return; const r = e.fit.runs; if (e.vert) { e.bb = e.box; return; } e.bb = r.length ? { x: Math.min(...r.map(q => q.x)) - 2, y: Math.min(...r.map(q => q.top)) - 2, w: Math.max(...r.map(q => q.x + q.w)) - Math.min(...r.map(q => q.x)) + 4, h: Math.max(...r.map(q => q.top + q.h)) - Math.min(...r.map(q => q.top)) + 4 } : e.box; });
    this.els = els.map((e, i) => ({ ...e, i })).sort((a, b) => a.layer - b.layer || a.i - b.i);
    this.nOrder = order;
    const rank = { empty: 0, ok: 1, tight: 2, cut: 3 }, rep = {};
    els.forEach(e => { if (e.kind !== 'text' || e.field[0] === '_') return; const r = rep[e.field] || (rep[e.field] = { state: 'empty', hidden: 0 }); if (rank[e.fit.state] > rank[r.state]) r.state = e.fit.state; r.hidden = Math.max(r.hidden, e.fit.hidden || 0); });
    this.report = rep; return rep;
  }

  // ---------- motion ----------
  timing() { const S = this.S, L = S.loop, nb = Math.max(2, Math.round(L / (60 / S.bpm) / 2) * 2); return { L, beat: L / nb, nb }; }
  anim(el, t) {
    const S = this.S, { L, beat, nb } = this.timing(), P = t / L, A = { show: true, slice: null, dx: 0, dy: 0, rot: 0, sc: 1, scroll: null, flip: false }, k = el.order / Math.max(1, this.nOrder);
    if (el.static) return A;
    if (S.motion === 'build') {
      const s0 = .03 + k * .3, p = clamp((P - s0) / .09), q = clamp((P - (.86 + k * .06)) / .05);
      if (p <= 0 || q >= 1) A.show = false; else if (p < 1) A.slice = { p: easeOut(p), seed: el.i }; else if (q > 0) A.slice = { p: 1 - q, seed: el.i + 50 };
      else { const b = Math.floor(t / beat), fb = (t - b * beat) * FPS; if (fb < 2.5 && hash(b, S.seed) < .55 && Math.floor(hash(b, 3, S.seed) * this.els.length) === this.els.indexOf(el)) A.slice = { p: .78, seed: b * 31 + el.i }; }
    } else if (S.motion === 'scroll') {
      if (el.kind === 'text' && (el.role === 'title' || el.role === 'name') && el.mode === 'justify' && !el.vert) A.scroll = (el.order % 2 ? -1 : 1) * P;
    } else if (S.motion === 'flip') {
      const b0 = Math.floor(t / beat + 1e-6), fb = (t - b0 * beat) * FPS, b = b0 % nb; A.flip = b % 2 === 1;
      if (fb < 2 && hash(b, el.i, S.seed) < .5) A.slice = { p: .7, seed: b * 7 + el.i };
    } else if (S.motion === 'letters' || S.motion === 'echo') {
      if (el.kind === 'text' && el.role === 'title' && el.mode === 'justify' && !el.vert) A[S.motion] = P;
    } else if (S.motion === 'cut') {
      if (el.kind === 'text' && el.role === 'title' && !el.vert) { const b = Math.floor(t / beat + 1e-6) % nb, r = hash(b, el.order, S.seed); A.cutStyle = b === 0 ? null : r < .4 ? 'stroke' : r < .7 ? 'acc' : null; }
    } else if (S.motion === 'boil') {
      const st = Math.floor(t * 8), j = this.W / 1080, r = (a) => hash(st, el.i, a, S.seed) - .5;
      A.dx = r(1) * 5 * j; A.dy = r(2) * 5 * j; A.rot = r(3) * (el.kind === 'img' ? 1.6 : .5);
      const inT = (P - (.012 + k * .27)) * L / beat, outT = (P - (.84 + k * .07)) * L / beat;
      // stop-motion: pieces cut in and out, with a one-frame kick sideways on arrival; nothing is scaled
      if (inT < 0 || outT > .5) A.show = false; else if (inT < .12) { A.dx += (hash(el.i, S.seed) < .5 ? -1 : 1) * this.W * .02; }
    }
    return A;
  }

  // ---------- paint ----------
  render(t, ov = {}) {
    const S = this.S, g = this.g, { W, H } = this; if (S.feel) t = Math.floor(t * S.feel + 1e-6) / S.feel;
    const { beat } = this.timing(), flipNow = S.motion === 'flip' && Math.floor(t / beat) % 2 === 1;
    const P = flipNow ? { bg: S.pal.ink, ink: S.pal.bg, acc: S.pal.acc } : S.pal; this.P = P;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.fillStyle = P.bg; g.fillRect(0, 0, W, H); this.hits = []; this.figs = [];
    this.photoSrc = null; if (S.tstyle === 'photo' && S.images.length) { const n = S.images.length, im = S.images[(this.shot(t) + (n > 1 ? 1 : 0)) % n]; this.photoSrc = this.treated(im, 'frame', S.tr === 'riso' ? 'duo' : S.tr, P); }
    for (const el of this.els) { const A = this.anim(el, t); if (!A.show) continue;
      const core = dx => this.core(el, A, dx, P, t);
      if (A.slice) this.sliced(el, A.slice, core); else core(0); }
    if (S.grain) { const tiles = this.grain(), k = (((Math.floor(t * 12) % tiles.length) + tiles.length) % tiles.length) || 0; g.save(); g.globalAlpha = .13; g.globalCompositeOperation = 'overlay'; const pat = g.createPattern(tiles[k], 'repeat'); g.fillStyle = pat; g.fillRect(0, 0, W, H); g.restore(); }
    if (ov.frames) this.overlayFrames(); if (ov.safe && this.fmt === '9x16') this.overlaySafe();
    return this.c;
  }
  sliced(el, s, core) { const g = this.g, b = el.kind === 'text' ? el.bb : el.box, n = el.kind === 'text' ? Math.max(3, Math.min(9, Math.round(b.h / (this.W * .03)))) : 7, R = rng(s.seed * 131 + 7);
    for (let i = 0; i < n; i++) { const r = R(), dir = R() < .5 ? -1 : 1, p = clamp(s.p * 1.7 - r * .7); if (p <= 0) continue;
      const y0 = b.y + b.h * i / n, y1 = b.y + b.h * (i + 1) / n; g.save(); g.beginPath(); g.rect(-this.W, y0, this.W * 3, y1 - y0 + .5); g.clip(); core((1 - p) * dir * b.w * .45); g.restore(); } }
  col(c, P) { return c === 'bg' ? P.bg : c === 'acc' ? P.acc : c === 'white' ? '#fff' : P.ink; }
  core(el, A, dx, P, t) {
    const g = this.g; g.save(); if (el.alpha != null) g.globalAlpha = el.alpha;
    if (A.dx || A.dy || A.rot || A.sc !== 1) { const b = el.kind === 'text' ? el.bb : el.box, cx = b.x + b.w / 2, cy = b.y + b.h / 2; g.translate(cx + A.dx, cy + A.dy); g.rotate(A.rot * Math.PI / 180); g.scale(A.sc, A.sc); g.translate(-cx, -cy); }
    if (el.kind === 'rect') { g.fillStyle = this.col(el.color, P); g.fillRect(el.box.x + dx, el.box.y, el.box.w, el.box.h); }
    else if (el.kind === 'text') { const col = this.col(A.cutStyle === 'acc' ? (el.color === 'acc' ? 'ink' : 'acc') : el.color, P); g.fillStyle = col; g.strokeStyle = col; g.textBaseline = 'alphabetic'; g.lineJoin = 'round';
      if (el.vert) { const b = el.box; if (el.vert < 0) { g.translate(b.x + dx, b.y + b.h); g.rotate(-Math.PI / 2); } else { g.translate(b.x + b.w + dx, b.y); g.rotate(Math.PI / 2); } dx = 0; }
      const style = A.cutStyle === 'stroke' ? (el.style === 'stroke' ? 'fill' : 'stroke') : (el.style || 'fill'), mode = style === 'stroke' ? 'stroke' : 'fill', runs = el.fit.runs, b = el.box, clipBox = () => { g.beginPath(); g.rect(b.x - 2, b.y - 2, b.w + 4, b.h + 4); g.clip(); };
      let draw; // draw(ctx) paints every run of this element on ctx
      if (A.scroll != null) { g.beginPath(); g.rect(b.x - 1, el.bb.y - 4, b.w + 2, el.bb.h + 8); g.clip();
        draw = c => { for (const r of runs) { const per = r.w + r.size * .35, off = ((A.scroll % 1) + 1) % 1 * per; for (let k = -1; k <= Math.ceil(b.w / per) + 1; k++) drawRun(c, el.f, r, dx - off + k * per, mode); } }; }
      else if (A.letters != null) { clipBox(); const ph = A.letters, o = el.order * .09;
        draw = c => runs.forEach((r, ri) => drawRun(c, el.f, r, dx, mode, (i, n) => { const w = Math.sin(2 * Math.PI * (ph * 2 - i / n * .6 - o - ri * .15)); return { dy: Math.max(0, w) ** 3 * r.h * 1.05 }; })); }
      else if (A.echo != null) { clipBox(); const ph = A.echo;
        draw = c => { const sv = c.strokeStyle; for (let k = 3; k >= 1; k--) { const off = (.5 - .5 * Math.cos(2 * Math.PI * ph * 2)) * k * (runs[0] ? runs[0].h * .22 : 0) * (el.order % 2 ? -1 : 1); c.globalAlpha = 1 - k * .18; for (const r of runs) drawRun(c, el.f, { ...r, y: r.y + off }, dx, 'stroke'); } c.globalAlpha = 1; c.strokeStyle = sv; for (const r of runs) drawRun(c, el.f, r, dx, mode); }; }
      else draw = c => { for (const r of runs) drawRun(c, el.f, r, dx, mode); };
      const photo = style === 'photo' && this.photoSrc;
      if (!photo) draw(g);
      else { const T = this.tmp || (this.tmp = document.createElement('canvas')); if (T.width !== this.W || T.height !== this.H) { T.width = this.W; T.height = this.H; } const tg = T.getContext('2d'), ps = this.photoSrc;
        tg.setTransform(1, 0, 0, 1, 0, 0); tg.clearRect(0, 0, T.width, T.height); tg.setTransform(g.getTransform()); tg.fillStyle = '#fff'; tg.strokeStyle = '#fff'; tg.lineJoin = 'round'; tg.textBaseline = 'alphabetic'; draw(tg);
        tg.setTransform(1, 0, 0, 1, 0, 0); tg.globalCompositeOperation = 'source-in'; const s = Math.max(this.W / ps.width, this.H / ps.height); tg.drawImage(ps, (this.W - ps.width * s) / 2, (this.H - ps.height * s) / 2, ps.width * s, ps.height * s); tg.globalCompositeOperation = 'source-over';
        g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(T, 0, 0); g.restore(); } }
    else if (el.kind === 'img') this.drawImg(el, A, dx, P, t);
    g.restore();
  }
  // photo changes: the number of shots in a loop is rounded to a multiple of the photo count, so the loop closes on the first photo
  shot(t) { const S = this.S, n = S.images.length; if (!S.cycle || n < 2 || S.motion === 'still') return 0; const { beat, L } = this.timing(), ns = n * Math.max(1, Math.round(L / (beat * (S.shotBeats || 2)) / n)); return Math.floor((((t % L) + L) % L) / (L / ns) + 1e-6); }
  // distance from the figure, on a small grid around the cut-out: used to draw contour lines that follow the body
  field(im) { if (im.dist) return im.dist; const c = im.cut, k = 260 / Math.max(c.width, c.height), cw = Math.max(4, Math.round(c.width * k)), ch = Math.max(4, Math.round(c.height * k)), pad = Math.round(Math.max(cw, ch) * .45), w = cw + 2 * pad, h = ch + 2 * pad;
    const t = document.createElement('canvas'); t.width = cw; t.height = ch; const x = t.getContext('2d'); x.drawImage(c, 0, 0, cw, ch); const a = x.getImageData(0, 0, cw, ch).data, d = new Float32Array(w * h).fill(1e6);
    for (let y = 0; y < ch; y++) for (let q = 0; q < cw; q++) if (a[(y * cw + q) * 4 + 3] > 110) d[(y + pad) * w + q + pad] = 0;
    const D1 = 1, D2 = 1.414; for (let y = 0; y < h; y++) for (let q = 0; q < w; q++) { const i = y * w + q; let v = d[i]; if (q) v = Math.min(v, d[i - 1] + D1); if (y) { v = Math.min(v, d[i - w] + D1); if (q) v = Math.min(v, d[i - w - 1] + D2); if (q < w - 1) v = Math.min(v, d[i - w + 1] + D2); } d[i] = v; }
    for (let y = h - 1; y >= 0; y--) for (let q = w - 1; q >= 0; q--) { const i = y * w + q; let v = d[i]; if (q < w - 1) v = Math.min(v, d[i + 1] + D1); if (y < h - 1) { v = Math.min(v, d[i + w] + D1); if (q < w - 1) v = Math.min(v, d[i + w + 1] + D2); if (q) v = Math.min(v, d[i + w - 1] + D2); } d[i] = v; }
    return im.dist = { d, w, h, pad, k, cw, ch };
  }
  contour(im, ph, color) { const key = `${im.id}|ring|${Math.round(ph * 24) % 24}|${color}`; let c = this.cache.get(key); if (c) return c; const F = this.field(im), { w, h } = F, sp = Math.max(F.cw, F.ch) * .075, lw = sp * .32, n = 5, [r, gg, b] = hex(color);
    c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'), im2 = x.createImageData(w, h), D = im2.data, p0 = (Math.round(ph * 24) % 24) / 24 * sp;
    for (let y = 0; y < h; y++) for (let q = 0; q < w; q++) { const dd = F.d[y * w + q]; if (dd <= sp * .35 || dd > sp * n) continue; const v = dd + Math.sin(q * .09 + y * .021) * sp * .14 + Math.cos(y * .07 - q * .03) * sp * .12 - p0, m = ((v % sp) + sp) % sp, e = Math.min(m, lw - m); if (e <= 0) continue; const i = (y * w + q) * 4; D[i] = r; D[i + 1] = gg; D[i + 2] = b; D[i + 3] = Math.min(255, e * 255 / 1.2) * (1 - dd / (sp * n) * .35); }
    x.putImageData(im2, 0, 0); if (this.cache.size > 400) this.cache.clear(); this.cache.set(key, c); return c; }
  drawImg(el, A, dx, P, t) {
    const S = this.S, g = this.g, n = S.images.length; if (!n) return; const idx = el.cycle ? (el.idx + this.shot(t)) % n : el.idx, im = S.images[idx]; if (!im) return;
    const b = el.box, useCut = el.cut && im.cut, pan = im.pan; if (el.inplace && !im.cut) return;
    if (el.rot) { const cx = b.x + b.w / 2, cy = b.y + b.h / 2; g.translate(cx, cy); g.rotate(el.rot * Math.PI / 180); g.translate(-cx, -cy); }
    let s, w, h, x, y, src;
    if (el.inplace) { const f = im.src, fs = Math.max(b.w / f.width, b.h / f.height) * pan.z, fx = b.x + (b.w - f.width * fs) / 2 + pan.x * b.w + dx, fy = b.y + (b.h - f.height * fs) / 2 + pan.y * b.h, cb = im.cutBox;
      src = this.treated(im, 'cut', S.trFig || S.tr, P); s = fs; x = fx + cb.x * fs; y = fy + cb.y * fs; w = cb.w * fs; h = cb.h * fs; }
    else if (useCut) { src = this.treated(im, 'cut', S.trFig || S.tr, P);
      if (S.echo === 'copies') { // the whole group (person + copies) is fitted into the slot and centred, front copy last
        const N = S.echoN || 3, [fx, fy] = this.echoDir(src, b), gw = src.width * (1 + N * Math.abs(fx)), gh = src.height * (1 + N * Math.abs(fy));
        s = Math.min(b.w / gw, b.h / gh) * .96 * pan.z; w = src.width * s; h = src.height * s; const gx = b.x + (b.w - gw * s) / 2, gy = b.y + (b.h - gh * s) / 2;
        x = gx + (fx < 0 ? N * -fx * w : 0) + pan.x * b.w + dx; y = gy + (fy < 0 ? N * -fy * h : 0) + pan.y * b.h; }
      else { s = Math.min(b.w / src.width, b.h / src.height) * pan.z; w = src.width * s; h = src.height * s; x = b.x + (b.w - w) / 2 + pan.x * b.w + dx; y = b.y + b.h - h + pan.y * b.h; } }
    else { src = this.treated(im, 'frame', S.tr, P); s = Math.max(b.w / src.width, b.h / src.height) * pan.z; w = src.width * s; h = src.height * s; x = b.x + (b.w - w) / 2 + pan.x * b.w + dx; y = b.y + (b.h - h) / 2 + pan.y * b.h; }
    const look = useCut || el.inplace ? (S.trFig || S.tr) : S.tr;
    if (useCut || el.inplace) this.figs.push({ idx, x, y, w, h, rot: el.rot || 0, box: b });
    if (!el.inplace) this.hits.push({ idx, box: b, layer: el.layer });
    const u = this.W / 1080;
    if (el.card) { const p = 14 * u, sh = 16 * u; g.fillStyle = P.ink; g.fillRect(b.x + dx + sh, b.y + sh, b.w, b.h); g.fillStyle = S.outline ? '#fff' : P.acc; g.fillRect(b.x + dx - p, b.y - p, b.w + 2 * p, b.h + 2 * p); }
    if (el.clip) { g.beginPath(); g.rect(b.x + dx, b.y, b.w, b.h); g.clip(); }
    if (useCut) {
      if (S.contour && S.contour !== 'off') { const F = this.field(im), sc = w / F.cw, ph = S.contour === 'move' && S.motion !== 'still' ? (t / S.loop * Math.max(1, Math.round(S.loop / 2))) % 1 : 0; g.save(); g.imageSmoothingEnabled = true; g.drawImage(this.contour(im, ph, S.contourColor === 'ink' ? P.ink : S.contourColor === 'white' ? '#ffffff' : P.acc), x - F.pad * sc, y - F.pad * sc, F.w * sc, F.h * sc); g.restore(); }
      const ring = (ox, oy) => { if (!S.outline) return; const sil = this.sil(im, '#ffffff'), r = 9 * u; for (let a = 0; a < 16; a++) g.drawImage(sil, ox + Math.cos(a / 16 * 6.283) * r, oy + Math.sin(a / 16 * 6.283) * r, w, h); };
      if (S.echo === 'flat') { const ph = S.motion === 'still' ? 1 : .55 + .45 * Math.sin(2 * Math.PI * t / S.loop * 2); for (let k = 3; k >= 1; k--) g.drawImage(this.sil(im, k % 2 ? P.acc : P.ink), x - k * 34 * u * ph, y - k * 10 * u * ph, w, h); }
      if (S.echo === 'copies' && !el.inplace) { // the person repeated, each copy whole and with its own edge, stepping away and back over the loop
        const N = S.echoN || 3, ph = S.motion === 'still' ? 1 : .35 + .65 * (.5 - .5 * Math.cos(2 * Math.PI * t / S.loop * 2)), [fx, fy] = this.echoDir(src, b), sx = fx * w * ph, sy = fy * h * ph;
        for (let k = N; k >= 1; k--) { const ox = x + sx * k, oy = y + sy * k; if (S.shadow) g.drawImage(this.sil(im, P.ink === P.bg ? '#000' : P.ink), ox + 18 * u, oy + 14 * u, w, h); ring(ox, oy); g.drawImage(look === 'riso' ? this.treated(im, 'cut', 'riso', P) : src, ox, oy, w, h); } }
      if (S.shadow) g.drawImage(this.sil(im, P.ink === P.bg ? '#000' : P.ink), x + 18 * u, y + 14 * u, w, h);
      ring(x, y);
    }
    if (look === 'riso') { const R = this.riso(im, useCut || el.inplace ? 'cut' : 'frame', P), ph = 2 * Math.PI * t / S.loop, m = this.W * .007 * (S.motion === 'still' ? .6 : 1), ax = Math.cos(ph) * m, ay = Math.sin(ph * 2) * m * .6;
      g.drawImage(this.treated(im, useCut || el.inplace ? 'cut' : 'frame', 'riso', P), x, y, w, h); // readable tone base
      g.globalAlpha = S.fx ?? .5; g.globalCompositeOperation = R.dark ? 'screen' : 'multiply'; g.drawImage(R.b, x - ax, y - ay, w, h); g.drawImage(R.a, x + ax, y + ay, w, h); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; }
    else g.drawImage(src, x, y, w, h);
  }
  overlayFrames() { const g = this.g, c = { ok: '#00d084', tight: '#ffb000', cut: '#ff2a2a', empty: '#888' }; g.save(); g.lineWidth = 3; g.setLineDash([10, 8]);
    for (const e of this.els) if (e.kind === 'text') { g.strokeStyle = c[e.fit.state]; g.strokeRect(e.box.x, e.box.y, e.box.w, e.box.h); } g.restore(); }
  overlaySafe() { const g = this.g; g.save(); g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(0, 0, this.W, 250); g.fillRect(0, this.H - 400, this.W, 400); g.fillRect(this.W - 140, 250, 140, this.H - 650);
    g.fillStyle = '#fff'; g.font = '500 26px "Geist Mono", monospace'; g.fillText('instagram ui covers this', 30, 60); g.fillText('instagram ui covers this', 30, this.H - 40); g.restore(); }
}
