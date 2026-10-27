// STROBE engine: turns an ordered list of media into a frame list (compile) and paints any frame (Renderer).
// Everything is laid out on a 1080x1920 grid at 24 fps; output canvases are scaled from it.
export const W = 1080, H = 1920, FPS = 24;

// ---------- small deterministic random ----------
export function rng(seed) {
  let s = (seed >>> 0) || 1;
  const r = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  r.int = (a, b) => a + Math.floor(r() * (b - a + 1));
  r.pick = arr => arr[Math.floor(r() * arr.length)];
  return r;
}

// times (seconds) for a video segment, sped up with a fast-slow-fast ramp
function rampTimes(dur, r, v = [2.4, 1.3, 2.4], k = 1) {
  v = v.map(x => x * k);
  const a = dur * (0.12 + r() * 0.08), b = Math.min(dur * 0.9, a + 3.6);
  const out = []; let pos = a;
  while (pos <= b && out.length < 60) {
    out.push(pos);
    const t = (pos - a) / Math.max(1e-6, b - a);
    const u = t < .5 ? (1 - Math.cos(Math.PI * t * 2)) / 2 : (1 - Math.cos(Math.PI * (t - .5) * 2)) / 2;
    const sp = t < .5 ? v[0] + (v[1] - v[0]) * u : v[1] + (v[2] - v[1]) * u;
    pos += sp / FPS;
  }
  return out;
}

// ---------- compile: media list -> frames + cut marks ----------
// opt: { tempo (2..4), glitch (0..1), splits, sheet, punch, seed }
export function compile(list, opt) {
  const r = rng(opt.seed || 7);
  const frames = [], cuts = [];
  if (!list.length) return { frames, cuts };
  const imgs = list.filter(m => m.type === 'image');
  let end = list.find(m => m.flags.end) || [...list].reverse().find(m => m.type === 'image') || list[list.length - 1];
  const body = list.filter(m => m !== end);
  const push = (arr, mark = {}) => { cuts.push({ frame: frames.length, ...mark }); arr.forEach((f, i) => frames.push({ ...f, k: cuts.length, i, n: arr.length })); };
  const still = (m, n, extra = {}) => Array.from({ length: n }, () => ({ t: 'img', m, ...extra }));
  // tempo 1..10 sets how long a still holds (1: one or two frames, 10: about a third of a second and more);
  // shape bends it over the reel: 'middle' holds longer in the middle and strobes at both ends, 'build' starts slow
  // and speeds up, 'release' starts as a strobe and slows down, 'even' keeps one pace
  const T = Math.max(1, Math.min(10, opt.tempo || 4)), base = T <= 1 ? .55 : T <= 2 ? .85 : 1.05 + (T - 3) * .95;   // 1: one frame a picture
  const shapeAt = p => ({ middle: .35 + 1.65 * Math.sin(Math.PI * p), build: 1.7 - 1.4 * p, release: .3 + 1.4 * p }[opt.shape] ?? 1);
  const bodyN = Math.max(1, list.length - 1); let posI = 0;
  const hold = (p, mul = 1) => Math.max(1, Math.round(base * shapeAt(p) * mul * (.85 + r() * .3)));
  const vk = T <= 1 ? 1.9 : T <= 2 ? 1.55 : 1.3 - (T - 3) * .07;   // clips play faster at a fast tempo
  const clip = (m, extra = {}) => rampTimes(m.dur, r, [2.4, 1.3, 2.4], vk).map(time => ({ t: 'vid', m, time, ...extra }));
  const tempo = () => hold(posI / bodyN);
  const glitchy = () => r() < opt.glitch * .45;

  if (opt.logoOn !== false) push(Array.from({ length: 10 }, () => ({ t: 'black', intro: true })), { intro: true });   // without a logo the reel starts on the first picture
  const nA = Math.max(1, Math.ceil(body.length * .38));
  const A = body.slice(0, nA), B = body.slice(nA);
  let last = null;
  // section A: establishing hold, then a quick strobe
  A.forEach((m, j) => {
    posI++;
    if (m.type === 'video') { push(clip(m), { clip: true, hiss: m.flags.hiss }); last = m; return; }
    const lock = m.flags.ownLogo;
    const n = j === 0 ? Math.max(T <= 2 ? 3 : 8, hold(0, 3)) : lock ? Math.max(T <= 2 ? 4 : 6, tempo() + 4) : tempo();
    push(still(m, n, { nologo: lock, zoom: j === 0 ? .03 : 0 }), { lock, hiss: m.flags.hiss });
    last = m;
  });
  const aImgs = A.filter(m => m.type === 'image');
  for (let j = 0; j < Math.min(3, aImgs.length); j++) {
    const m = aImgs[(j * 2 + 1) % aImgs.length]; if (m === last && aImgs.length > 1) continue;
    push(still(m, Math.max(1, Math.min(3, hold(.15, .7))), { nologo: m.flags.ownLogo })); last = m;
  }
  if (B.length) push([{ t: 'flash' }], { flash: true });
  // section B: richer devices
  // contact sheet: the frames tagged 'sheet', otherwise a random handful of all images; it always appears when switched on
  let sheetPool = (opt.sheetPool && opt.sheetPool.length ? opt.sheetPool : imgs).slice();
  if (!(opt.sheetPool && opt.sheetPool.tagged)) { for (let i = sheetPool.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [sheetPool[i], sheetPool[j]] = [sheetPool[j], sheetPool[i]]; } }
  sheetPool = sheetPool.slice(0, 12);
  const sheetOn = opt.sheet && sheetPool.length >= 2;
  const sheetFrames = () => Array.from({ length: 10 }, (_, i) => ({ t: 'sheet', items: sheetPool, hl: Math.floor(i * sheetPool.length / 10), nologo: true }));
  const sheetAt = sheetOn && B.length ? Math.floor(B.length * .65) : -1; let sheetDone = false;
  for (let j = 0; j < B.length; j++) {
    const m = B[j]; posI++;
    if (!sheetDone && sheetAt >= 0 && j >= sheetAt) { push(sheetFrames(), { shutter: 5, every: 2 }); sheetDone = true; }   // >=: a split may jump over the exact index
    if (m.type === 'video') { push(clip(m, { glitch: glitchy() ? 1 : 0 }), { clip: true, hiss: m.flags.hiss }); last = m; continue; }
    const nxt = B[j + 1];
    if (opt.splits && nxt && nxt.type === 'image' && r() < .3) {
      push(Array.from({ length: 8 }, (_, i) => ({ t: 'split', a: m, b: nxt, swap: i >= 4 })), { shutter: 3, every: 3 });
      j++; last = nxt; continue;
    }
    const n = m.flags.ownLogo ? Math.max(6, tempo() + 4) : tempo();
    push(still(m, n, { nologo: m.flags.ownLogo, glitch: glitchy() ? 1 : 0 }), { lock: m.flags.ownLogo, hiss: m.flags.hiss });
    if (opt.punch && r() < .45) push(still(m, 2, { nologo: true, punch: [1.8 + r() * .5, .3 + r() * .4, .3 + r() * .4], glitch: glitchy() ? 2 : 0 }));
    last = m;
  }
  if (sheetOn && !sheetDone) push(sheetFrames(), { shutter: 5, every: 2 });   // short reels (or a sheet the loop missed): before the ending
  // ending: fast mix, flash, packshot, black
  const mixPool = body.filter(m => m.type === 'image');
  if (mixPool.length) {
    let prev = null;
    for (let j = 0; j < 6; j++) {
      let m = r.pick(mixPool); if (m === prev && mixPool.length > 1) m = mixPool[(mixPool.indexOf(m) + 1) % mixPool.length];
      push(still(m, Math.max(1, Math.min(3, hold(1, .7))), { nologo: m.flags.ownLogo, glitch: j === 2 && opt.glitch > .3 ? 2 : 0 })); prev = m;
    }
  }
  push([{ t: 'flash' }], { flash: true });
  if (end.type === 'video') push(clip(end), { end: true, clip: true });
  else push(still(end, 58, { zoom: .03, nologo: end.flags.ownLogo, end: true }), { end: true, lock: end.flags.ownLogo });   // a calm packshot, ~2.4 s
  push(Array.from({ length: 30 }, () => ({ t: 'black', outro: true })), { outro: true });                                   // the logo stays on black ~1.25 s while the sound runs out
  return { frames, cuts };
}

// ---------- drawing helpers ----------
function cover(ctx, src, sw, sh, x, y, w, h, z = 1, cx = .5, cy = .5) {
  // fill the box, optional zoom z around the point (cx, cy) of the source, never showing an edge
  const s = Math.max(w / sw, h / sh) * z, dw = sw * s, dh = sh * s;
  let dx = x + w / 2 - cx * dw, dy = y + h / 2 - cy * dh;
  dx = Math.min(x, Math.max(x + w - dw, dx)); dy = Math.min(y, Math.max(y + h - dh, dy));
  ctx.drawImage(src, dx, dy, dw, dh);
}

function seek(v, t) {
  return new Promise(res => {
    t = Math.max(0, Math.min(v.duration - 0.04, t));
    if (Math.abs(v.currentTime - t) < 0.002 && v.readyState >= 2) return res();
    const done = () => { v.removeEventListener('seeked', done); res(); };
    v.addEventListener('seeked', done);
    v.currentTime = t;
  });
}

export function makeLogo(text, file, font, weight = '200') {
  // returns { white, ink } canvases, 480 px wide
  const build = async () => {
    let src;
    if (file) {
      src = await createImageBitmap(file);
    } else {
      const c = document.createElement('canvas'); const g = c.getContext('2d');
      const size = 140; g.font = `${weight} ${size}px ${font}`;
      const spacing = size * .12; const chars = [...text];
      const widths = chars.map(ch => g.measureText(ch).width);
      const tw = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
      c.width = Math.ceil(tw) + 20; c.height = Math.ceil(size * 1.25);
      g.font = `${weight} ${size}px ${font}`; g.fillStyle = '#000'; g.textBaseline = 'alphabetic';
      let x = 10; chars.forEach((ch, i) => { g.fillText(ch, x, size * .98); x += widths[i] + spacing; });
      src = c;
    }
    const w = 480, h = Math.round(480 * src.height / src.width);
    const tint = col => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(src, 0, 0, w, h); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, w, h); return c; };
    return { white: tint('#ffffff'), ink: tint('#111214'), h };
  };
  return build();
}

// ---------- renderer ----------
export class Renderer {
  constructor(opt) { this.opt = opt; this.scratch = document.createElement('canvas'); this.scratch.width = W; this.scratch.height = H; this.g = this.scratch.getContext('2d', { willReadFrequently: true }); this.g.imageSmoothingEnabled = true; this.g.imageSmoothingQuality = 'high'; }

  async frameSource(m, time) {
    if (m.type === 'image') return [m.bmp, m.w, m.h];
    await seek(m.el, time ?? m.dur * .4);
    return [m.el, m.w, m.h];
  }

  async paint(f, idx, cut, total) {
    const g = this.g, o = this.opt;
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    if (f.t === 'flash') { g.fillStyle = '#F6F5F2'; g.fillRect(0, 0, W, H); }
    else if (f.t === 'img' || f.t === 'vid') {
      const [src, sw, sh] = await this.frameSource(f.m, f.time);
      let z = 1;
      if (f.zoom) z = 1 + f.zoom * (f.i / Math.max(1, f.n - 1));
      if (f.punch) cover(g, src, sw, sh, 0, 0, W, H, f.punch[0], f.punch[1], f.punch[2]);
      else cover(g, src, sw, sh, 0, 0, W, H, z);
      if (o.look === 'xstrobe' && f.t === 'vid' && o.pool && o.pool.length && rng(idx * 977 + 11)() < .42) {   // clips get chopped by flashes of other frames
        const m2 = o.pool[Math.floor(rng(idx * 131 + 7)() * o.pool.length)]; cover(g, m2.bmp, m2.w, m2.h, 0, 0, W, H);
      }
      this.keepShot(f);
    } else if (f.t === 'split') {
      const [top, bot] = f.swap ? [f.b, f.a] : [f.a, f.b];
      for (const [m, y] of [[top, 0], [bot, 960]]) {
        const [src, sw, sh] = await this.frameSource(m);
        g.save(); g.beginPath(); g.rect(0, y, W, 960); g.clip(); cover(g, src, sw, sh, 0, y, W, 960); g.restore();
      }
      g.fillStyle = '#F6F5F2'; g.fillRect(0, 959, W, 2);
    } else if (f.t === 'sheet') {
      g.fillStyle = '#FAFAF9'; g.fillRect(0, 0, W, H);
      const nI = Math.min(12, f.items.length), cols = nI <= 4 ? 2 : 3, rows = Math.ceil(nI / cols);
      let tw = cols === 2 ? 440 : 300, th = tw * 4 / 3; const maxTh = (H - 120 - (rows + 1) * 44) / rows; if (th > maxTh) { th = maxTh; tw = th * 3 / 4; }
      const gx = (W - cols * tw) / (cols + 1), gy = (H - rows * th) / (rows + 1);
      for (let j = 0; j < nI; j++) {
        const m = f.items[j], x = gx + (j % cols) * (tw + gx), y = gy + Math.floor(j / cols) * (th + gy);
        g.save(); g.beginPath(); g.rect(x, y, tw, th); g.clip();
        if (j !== f.hl) g.filter = 'grayscale(1)';
        cover(g, m.bmp || m.thumb, m.w, m.h, x, y, tw, th); g.filter = 'none'; g.restore();
        g.fillStyle = '#111214'; g.font = `500 16px ${o.font}`; g.fillText(String(j + 1).padStart(2, '0'), x, y + th + 22);
        if (j === f.hl) { g.strokeStyle = '#E61E9C'; g.lineWidth = 9; g.strokeRect(x - 8, y - 8, tw + 16, th + 16); g.strokeStyle = '#FFFFFF'; g.lineWidth = 2; g.strokeRect(x - 2, y - 2, tw + 4, th + 4); }
      }
    }
    if (o.look === 'xstrobe' && f.t !== 'black' && f.t !== 'flash' && !f.end) this.xstrobe(idx);          // the packshot stays calm
    else if (o.look === 'invertmix') { if (f.t !== 'black' && f.t !== 'flash' && rng((f.k || 1) * 7919 + 5)() < .5) this.look(rng((f.k || 1) * 31 + 1)() < .5 ? 'invert' : 'xray', idx); }
    else if (o.look === 'mix') { if (f.t !== 'black' && f.t !== 'flash' && f.t !== 'sheet' && (f.t === 'vid' || rng((f.k || 1) * 7919 + 3)() < .5)) this.look('bwgrain', idx); }   // cut by cut: black and white or colour; clips always black and white
    else if (o.look && o.look !== 'clean' && f.t !== 'black' && f.t !== 'flash' && f.t !== 'sheet') this.look(o.look, idx);   // the sheet keeps its own b/w + pink frame
    if (f.glitch) this.glitch(f.glitch, idx);
    this.overlay(f, idx, cut, total);
    g.restore();
    return this.scratch;
  }

  xstrobe(idx) {
    // every frame decides on its own: plain, negative, or laid over the previous shot (negative, difference / overlay)
    const g = this.g, r = rng(idx * 7349 + 29);
    if (!this.copy) { this.copy = document.createElement('canvas'); this.copy.width = W; this.copy.height = H; this.cg = this.copy.getContext('2d'); }
    this.cg.drawImage(this.scratch, 0, 0);
    const v = r();
    if (v < .32) { g.filter = 'invert(1) contrast(1.1)'; g.drawImage(this.copy, 0, 0); g.filter = 'none'; }
    else if (v < .74 && this.hasPrev) {
      g.globalCompositeOperation = r() < .5 ? 'difference' : 'overlay'; g.globalAlpha = .85;
      g.filter = r() < .6 ? 'invert(1) contrast(1.2)' : 'contrast(1.2)'; g.drawImage(this.shotPrev, 0, 0, W, H);
      g.filter = 'none'; g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      if (r() < .4) { this.cg.drawImage(this.scratch, 0, 0); g.filter = 'invert(1)'; g.drawImage(this.copy, 0, 0); g.filter = 'none'; }
    }
    if (r() < .45) { const gs = this.opt.gstyle; this.opt.gstyle = 'invert'; this.glitch(1 + Math.floor(r() * 3), idx + 17); this.opt.gstyle = gs; }
  }

  keepShot(f) {
    // a small copy of every shot; when the cut changes, the last one becomes the 'previous shot'
    if (!this.shotNow) { const mk = () => { const c = document.createElement('canvas'); c.width = 540; c.height = 960; return c; }; this.shotNow = mk(); this.shotPrev = mk(); this.hasPrev = false; }
    if (this.shotK !== f.k) { if (this.shotK != null) { this.shotPrev.getContext('2d').drawImage(this.shotNow, 0, 0); this.hasPrev = true; } this.shotK = f.k; }
    this.shotNow.getContext('2d').drawImage(this.scratch, 0, 0, 540, 960);
  }

  // ---- looks: black and white, black and white with grain, VHS, negative, x-ray ----
  look(kind, idx) {
    const g = this.g;
    if (!this.copy) { this.copy = document.createElement('canvas'); this.copy.width = W; this.copy.height = H; this.cg = this.copy.getContext('2d'); this.cg.imageSmoothingQuality = 'high'; }
    const cg = this.cg, r = rng(idx * 104729 + 7);
    cg.drawImage(this.scratch, 0, 0);
    if (kind === 'bw' || kind === 'bwgrain') {
      g.filter = 'grayscale(1) contrast(1.18) brightness(1.02)'; g.drawImage(this.copy, 0, 0); g.filter = 'none';
      if (kind === 'bwgrain') this.grain(.2, r);
      return;
    }
    if (kind === 'invert') {                                     // colour negative
      g.filter = 'invert(1) contrast(1.08)'; g.drawImage(this.copy, 0, 0); g.filter = 'none'; return;
    }
    if (kind === 'xray') {                                       // grey negative, the previous shot shining through
      g.filter = 'invert(1) grayscale(1) contrast(1.45) brightness(1.05)'; g.drawImage(this.copy, 0, 0);
      if (this.hasPrev) { g.globalCompositeOperation = 'screen'; g.globalAlpha = .55; g.drawImage(this.shotPrev, 0, 0, W, H); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
      g.filter = 'none';
      g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgb(205,226,255)'; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over';
      this.grain(.12, r); return;
    }
    if (kind === 'bwvhs') { this.look('vhs', idx); cg.drawImage(this.scratch, 0, 0); g.filter = 'grayscale(1) contrast(1.15)'; g.drawImage(this.copy, 0, 0); g.filter = 'none'; return; }
    if (kind === 'vhs') {
      g.filter = 'saturate(1.3) contrast(1.06) blur(0.8px)'; g.drawImage(this.copy, 0, 0); g.filter = 'none';
      const img = g.getImageData(0, 0, W, H), d = img.data, src = new Uint8ClampedArray(d);
      const band0 = r() < .5 ? Math.floor(r() * H) : -1, bandH = 40 + Math.floor(r() * 160);
      for (let y = 0; y < H; y++) {
        let jit = 0;
        if (band0 >= 0 && y >= band0 && y < band0 + bandH) jit = Math.round((r() - .3) * 26);          // tracking band
        if (y > H - 70) jit = Math.round(18 + r() * 30);                                                // head-switching at the bottom
        const row = y * W * 4;
        for (let x = 0; x < W; x++) {
          const i = row + x * 4;
          const xr = Math.min(W - 1, Math.max(0, x - jit + 5)), xg = Math.min(W - 1, Math.max(0, x - jit)), xb = Math.min(W - 1, Math.max(0, x - jit - 4));
          d[i] = src[row + xr * 4]; d[i + 1] = src[row + xg * 4 + 1]; d[i + 2] = src[row + xb * 4 + 2];
        }
      }
      g.putImageData(img, 0, 0);
      g.fillStyle = 'rgba(0,0,0,.16)'; for (let y = 0; y < H; y += 4) g.fillRect(0, y, W, 2);           // scanlines
      g.fillStyle = 'rgba(255,255,255,.5)'; for (let k = 0; k < 6; k++) { const y = H - 70 + r() * 60; g.fillRect(r() * W * .6, y, 60 + r() * 300, 1 + r() * 2); }
      this.grain(.1, r);
      return;
    }
  }
  grain(amount, r) {
    if (!this.noise) {                                                             // a few grain tiles, made once
      this.noise = Array.from({ length: 4 }, () => { const c = document.createElement('canvas'); c.width = 540; c.height = 960; const x = c.getContext('2d'); const im = x.createImageData(540, 960);
        for (let i = 0; i < im.data.length; i += 4) { const v = 128 + (Math.random() + Math.random() + Math.random() - 1.5) * 150; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } x.putImageData(im, 0, 0); return c; });
    }
    const g = this.g, t = this.noise[Math.floor(r() * 4)];
    g.save(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = amount;
    const ox = -Math.floor(r() * 540), oy = -Math.floor(r() * 960);
    for (let x = ox; x < W; x += 540) for (let y = oy; y < H; y += 960) g.drawImage(t, x, y, 540, 960);
    g.restore();
  }

  glitch(n, seed) {
    // strips of the frame break away: 'mono' turns them black and white with grain, 'invert' turns them negative,
    // 'mix' picks one of the two for every strip
    const g = this.g, r = rng(seed * 7919 + 13), style = this.opt.gstyle || 'mono';
    for (let s = 0; s < n; s++) {
      const h = Math.floor(18 + r() * 200), y = Math.floor(r() * (H - h));
      const x0 = r() < .6 ? 0 : Math.floor(r() * W * .5), x1 = r() < .6 ? W : Math.min(W, x0 + 200 + Math.floor(r() * (W - x0 - 200)));
      const w = x1 - x0; if (w < 20) continue;
      const inv = style === 'invert' || (style === 'mix' && r() < .5);
      const img = g.getImageData(x0, y, w, h), d = img.data;
      for (let p = 0; p < d.length; p += 4) {
        if (inv) { d[p] = 255 - d[p]; d[p + 1] = 255 - d[p + 1]; d[p + 2] = 255 - d[p + 2]; continue; }
        let v = (d[p] + d[p + 1] + d[p + 2]) / 3; v = (v - 128) * 1.35 + 128 + (r() - .5) * 2 * 255 * .1;
        v = v < 0 ? 0 : v > 255 ? 255 : v; d[p] = d[p + 1] = d[p + 2] = v;
      }
      const sh = Math.floor((r() - .5) * 80);
      g.putImageData(img, x0 + sh, y);
    }
  }

  overlay(f, idx, cut, total) {
    const g = this.g, o = this.opt, L = o.logo;
    if (L) {                                                   // no logo: the centre stays empty, captions still run
      const LY = 960 - L.h / 2;
      const px = g.getImageData(300, Math.max(0, LY), 480, Math.max(1, Math.min(L.h, 120))).data;
      let sum = 0; for (let p = 0; p < px.length; p += 16) sum += px[p] + px[p + 1] + px[p + 2];
      const dark = sum / (px.length / 16 * 3) < 135, logo = dark ? L.white : L.ink;
      if (f.t === 'black' && f.intro) { g.drawImage(L.white, 300, LY); return; }          // the logo is simply there from the first frame
      if (!f.nologo && f.t !== 'flash') g.drawImage(logo, 300, LY);
      if (f.t === 'black' && f.outro) { g.drawImage(L.white, 300, LY); return; }
    } else if (f.t === 'black' && (f.intro || f.outro)) return;
    if (f.t === 'flash') return;
    const top = o.safe ? 316 : 60, bot = H - top;
    // each caption reads the picture under it and turns white on dark, black on light
    const lum = (x, y, w, h) => { x = Math.max(0, Math.min(W - 1, x)); y = Math.max(0, Math.min(H - 1, y)); w = Math.max(1, Math.min(W - x, w)); h = Math.max(1, Math.min(H - y, h));
      const d = g.getImageData(x, y, w, h).data; let s2 = 0, n = 0; for (let p = 0; p < d.length; p += 16) { s2 += .2126 * d[p] + .7152 * d[p + 1] + .0722 * d[p + 2]; n++; } return s2 / n; };
    const put = (txt, x, y, align, font) => {
      g.font = font; g.textAlign = align; const w = g.measureText(txt).width;
      const x0 = align === 'right' ? x - w : x;
      g.fillStyle = lum(x0 - 4, y - 24, w + 8, 30) < 140 ? '#FFFFFF' : '#111214'; g.fillText(txt, x, y);
    };
    const cap = `${o.fontWeight || 500} 22px ${o.font}`, mono = `400 17px ${o.mono}`;
    g.textBaseline = 'alphabetic';
    if (o.captions !== false) {
      put(o.tl, 44, top + 18, 'left', cap);
      put(`${String(cut).padStart(3, '0')} / ${String(total).padStart(3, '0')}`, W - 44, top + 18, 'right', cap);
      put(o.bl, 44, bot, 'left', cap);
      put(f.end ? o.tag : o.br, W - 44, bot, 'right', cap);
    }
    if (o.marks) {
      g.lineWidth = 1;
      for (const [x, y] of [[70, top - 126], [W - 70, top - 126], [70, bot + 126], [W - 70, bot + 126]]) {
        g.strokeStyle = lum(x - 22, y - 22, 44, 44) < 140 ? '#FFFFFF' : '#111214';
        g.beginPath(); g.arc(x, y, 11, 0, Math.PI * 2); g.moveTo(x - 20, y); g.lineTo(x + 20, y); g.moveTo(x, y - 20); g.lineTo(x, y + 20); g.stroke();
      }
      const s = Math.floor(idx / FPS), fr = idx % FPS;
      put(`TC 00:00:${String(s).padStart(2, '0')}:${String(fr).padStart(2, '0')}`, 44, top + 50, 'left', mono);
      if (o.ruler !== false) {
        g.strokeStyle = lum(18, 430, 24, 1070) < 140 ? '#FFFFFF' : '#111214';
        g.beginPath(); for (let j = 0, y = 430; y < 1500; y += 24, j++) { g.moveTo(22, y); g.lineTo(22 + (j % 5 ? 8 : 16), y); } g.stroke();
      }
      const lab = f.t === 'sheet' ? 'CONTACT SHEET' : f.t === 'split' ? 'FIG. — / —' : (f.m && f.m.label) ? `FIG. ${String(f.m.idx + 1).padStart(2, '0')} — ${f.m.label.toUpperCase()}` : '';
      if (lab) put(lab, W - 44, bot - 34, 'right', mono);
    }
  }
}
