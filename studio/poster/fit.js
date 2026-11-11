// POSTER text fitting: every text block lives in a box and is sized so it never leaves it.
// justify: each line is scaled to fill the box width (the club-poster look); the whole stack shrinks if it gets too tall.
// wrap: words wrap inside the box; the largest size that fits wins; below the minimum the text is condensed, then cut with "…".
const cache = new Map();
export function clearMetrics() { cache.clear(); }
export function fontStr(f, size) { return `${f.style || 'normal'} ${f.weight} ${Math.max(1, size).toFixed(2)}px ${f.family}`; }
// tracking in em: negative pulls big type together, positive opens small caps
export function setFont(ctx, f, size, track = 0) { ctx.font = fontStr(f, size); if ('letterSpacing' in ctx) ctx.letterSpacing = track ? (track * size).toFixed(2) + 'px' : '0px'; }
export function metrics(ctx, f) {
  const key = f.family + '|' + f.weight + '|' + (f.style || '');
  let m = cache.get(key); if (m) return m;
  ctx.save(); ctx.font = fontStr(f, 100);
  const H = ctx.measureText('H'), d = ctx.measureText('gjpqy'), a = ctx.measureText('dfhklÁ');
  m = { cap: (H.actualBoundingBoxAscent || 70) / 100, asc: Math.max(a.actualBoundingBoxAscent, H.actualBoundingBoxAscent || 72) / 100, desc: (d.actualBoundingBoxDescent || 20) / 100 };
  ctx.restore(); cache.set(key, m); return m;
}
const hasLower = s => /[a-zа-яё]/.test(s), hasDesc = s => /[gjpqyQуфдрз,;]/.test(s);
// glyph box of one line at size s: top offset from baseline, height
function vbox(m, s, text) { const top = hasLower(text) || /[ÁÉÍÓÚÀÈÌÒÙÄËÏÖÜ]/.test(text) ? m.asc : m.cap; return { top: top * s, h: (top + (hasDesc(text) ? m.desc : 0)) * s }; }
function ink(ctx, f, text, track = 0) { setFont(ctx, f, 100, track); const r = ctx.measureText(text); const l = r.actualBoundingBoxLeft || 0, w = (r.actualBoundingBoxRight || r.width) + l; return { l: l / 100, w: Math.max(1e-3, w / 100), adv: r.width / 100 }; }

// a long single headline is tried on 1, 2 and 3 rows; the version with the biggest letters wins
function splitBalanced(t, k) { const w = t.split(/\s+/).filter(Boolean); if (k <= 1 || w.length < k) return [t]; const total = t.length, out = []; let cur = [];
  for (const x of w) { cur.push(x); const done = out.join(' ').length + cur.join(' ').length; if (out.length < k - 1 && done >= total * (out.length + 1) / k) { out.push(cur.join(' ')); cur = []; } } if (cur.length) out.push(cur.join(' ')); return out; }
export function fitJustify(ctx, f, lines, box, o = {}) {
  const src = lines.filter(s => s && s.trim());
  if (o.autoBreak && src.length === 1 && /\s/.test(src[0].trim())) { let best = null;
    for (let k = 1; k <= 3; k++) { const L = splitBalanced(src[0].trim(), k); if (L.length !== k) break; const r = fitJustify1(ctx, f, L, box, o), score = r.size * Math.pow(.88, k - 1) * (o.stretch > 1 ? Math.min(...r.runs.map(q => q.scaleY || 1)) ** .5 : 1); if (!best || score > best.score) best = { r, score }; }
    return best.r; }
  return fitJustify1(ctx, f, src, box, o);
}
function fitJustify1(ctx, f, lines, box, o = {}) {
  const gap = o.gap ?? .09, maxSize = o.maxSize ?? box.h, minSize = o.minSize ?? 10, m = metrics(ctx, f);
  lines = lines.map(s => o.upper ? s.toUpperCase() : s).filter(s => s.trim());
  if (!lines.length) return { runs: [], state: 'empty', size: 0 };
  const tr = o.track || 0, info = lines.map(t => { const k = ink(ctx, f, t, tr); let s = Math.min(box.w / k.w, maxSize); return { t, k, s }; });
  const total = () => info.reduce((a, r, i) => a + vbox(m, r.s, r.t).h + (i ? gap * Math.min(r.s, info[i - 1].s) : 0), 0);
  let T = total();
  if (T > box.h) { const k = box.h / T; info.forEach(r => r.s *= k); T = total(); }
  // lines that were capped by maxSize, or shrunk to fit the height, get centred/aligned in the free width
  let y = box.y + (o.valign === 'bottom' ? box.h - T : o.valign === 'center' ? (box.h - T) / 2 : 0);
  let extra = 0; if (o.valign === 'spread' && info.length > 1) { extra = (box.h - T) / (info.length - 1); y = box.y; }
  // stretch: tall condensed type, glyphs grow vertically (up to o.stretch) to fill a box that is taller than the text
  let sy = 1; if (o.stretch > 1 && T < box.h) { sy = Math.min(o.stretch, box.h / T); T *= sy; if (o.valign === 'spread') { extra = 0; y = box.y; } else y = box.y + (o.valign === 'bottom' ? box.h - T : o.valign === 'center' ? (box.h - T) / 2 : 0); }
  const runs = []; let minS = Infinity;
  info.forEach((r, i) => { const v0 = vbox(m, r.s, r.t), v = { top: v0.top * sy, h: v0.h * sy }; if (i) y += gap * Math.min(r.s, info[i - 1].s) * sy + extra; const w = r.k.w * r.s; const free = box.w - w;
    const x = box.x + (o.align === 'right' ? free : o.align === 'center' ? free / 2 : 0) + r.k.l * r.s;
    runs.push({ text: r.t, size: r.s, x, y: y + v.top, w, top: y, h: v.h, scaleX: 1, scaleY: sy, track: tr }); y += v.h; minS = Math.min(minS, r.s); });
  return { runs, state: minS < minSize ? 'tight' : 'ok', size: minS, font: f };
}

function wrapAt(ctx, f, paras, s, maxW, sx, breakWords, tr = 0) {
  setFont(ctx, f, s, tr); const out = [], sp = ctx.measureText(' ').width * sx;
  for (const p of paras) { const raw = p.split(/\s+/).filter(Boolean), words = [];
    // keep short pieces with their neighbour: "VAKE 14", "TBILISI ·", "NO 3" never break apart
    // numbers and separators stay with the word before them; short words (no, a, de, в) go with the word after them
    let carry = ''; for (const w of raw) { if (words.length && !carry && (/^[·|/—–-]$/.test(w) || /^\d{1,3}$/.test(w))) { words[words.length - 1] += ' ' + w; continue; }
      if (w.length <= 2 && /^[^\d]/.test(w)) { carry += (carry ? ' ' : '') + w; continue; } words.push(carry ? carry + ' ' + w : w); carry = ''; }
    if (carry) { if (words.length) words[words.length - 1] += ' ' + carry; else words.push(carry); } if (!words.length) { out.push(''); continue; } let cur = '', cw = 0;
    for (let w of words) { let ww = ctx.measureText(w).width * sx;
      if (ww > maxW) { if (!breakWords) return null; // hard-break a word that can never fit
        if (cur) { out.push(cur); cur = ''; cw = 0; }
        let piece = ''; for (const ch of w) { const t = piece + ch; if (ctx.measureText(t).width * sx > maxW && piece) { out.push(piece); piece = ch; } else piece = t; } cur = piece; cw = ctx.measureText(piece).width * sx; continue; }
      if (!cur) { cur = w; cw = ww; } else if (cw + sp + ww <= maxW) { cur += ' ' + w; cw += sp + ww; } else { out.push(cur); cur = w; cw = ww; } }
    out.push(cur); }
  return out;
}
export function fitWrap(ctx, f, text, box, o = {}) {
  const lh = o.lh ?? 1.12, maxLines = o.maxLines ?? 99, minSize = o.minSize ?? 12, maxSize = Math.min(o.maxSize ?? box.h, box.h * 2), m = metrics(ctx, f);
  text = (o.upper ? text.toUpperCase() : text).replace(/\r/g, ''); const paras = text.split('\n').map(s => s.trim());
  if (!text.trim()) return { runs: [], state: 'empty', size: 0 };
  const lower = hasLower(text), glyph = s => (lower ? m.asc + m.desc : m.cap) * s;
  const tr = o.track || 0, fits = (s, sx, brk) => { const L = wrapAt(ctx, f, paras, s, box.w, sx, brk, tr); if (!L) return null; const h = (L.length - 1) * s * lh + glyph(s); return L.length <= maxLines && h <= box.h + .5 ? L : null; };
  let best = null, bs = 0, sx = 1, state = 'ok';
  for (const scale of [1, .9, .8]) { // condense only if the minimum size does not fit
    let lo = minSize, hi = Math.max(minSize, maxSize); if (!fits(lo, scale)) continue;
    for (let i = 0; i < 20; i++) { const mid = (lo + hi) / 2; if (fits(mid, scale)) lo = mid; else hi = mid; }
    best = fits(lo, scale); bs = lo; sx = scale; if (scale < 1 || lo <= minSize * 1.02) state = 'tight'; break; }
  let hidden = 0;
  if (!best) { // still too long at the minimum, condensed: show what fits and cut the rest
    sx = .8; bs = minSize; const all = wrapAt(ctx, f, paras, bs, box.w, sx, true, tr); const cap = Math.max(1, Math.min(maxLines, Math.floor((box.h - glyph(bs)) / (bs * lh)) + 1));
    best = all.slice(0, cap); const shown = best.join(' ').length; hidden = Math.max(1, all.join(' ').length - shown);
    setFont(ctx, f, bs, tr); let last = best[best.length - 1] || ''; while (last && ctx.measureText(last + '…').width * sx > box.w) last = last.slice(0, -1); best[best.length - 1] = last.trimEnd() + '…'; state = 'cut'; }
  setFont(ctx, f, bs, tr); const H = (best.length - 1) * bs * lh + glyph(bs);
  let y = box.y + (o.valign === 'bottom' ? box.h - H : o.valign === 'center' ? (box.h - H) / 2 : 0) + (lower ? m.asc : m.cap) * bs;
  const runs = best.map((t, i) => { const w = ctx.measureText(t).width * sx, free = box.w - w; const x = box.x + (o.align === 'right' ? free : o.align === 'center' ? free / 2 : 0);
    const r = { text: t, size: bs, x, y: y + i * bs * lh, w, top: y + i * bs * lh - (lower ? m.asc : m.cap) * bs, h: glyph(bs), scaleX: sx, track: tr }; return r; });
  return { runs, state, size: bs, hidden, font: f };
}
// mode: 'fill' | 'stroke'; glyph(i, n) -> {dx, dy, sy} moves single letters (per-letter motion)
export function drawRun(ctx, f, r, dx = 0, mode = 'fill', glyph = null) {
  setFont(ctx, f, r.size, r.track || 0); const sx = r.scaleX || 1, sy = r.scaleY || 1;
  const put = (t, x, y) => mode === 'stroke' ? ctx.strokeText(t, x, y) : ctx.fillText(t, x, y);
  ctx.save(); ctx.translate(r.x + dx, r.y); ctx.scale(sx, sy);
  if (mode === 'stroke') ctx.lineWidth = Math.max(1.5, r.size * .028) / Math.max(sx, sy);
  if (!glyph) put(r.text, 0, 0);
  else { if (!r.gx || r.gxf !== ctx.font) { r.gxf = ctx.font; r.gx = []; const ch = [...r.text]; for (let i = 0; i < ch.length; i++) r.gx.push(ctx.measureText(ch.slice(0, i).join('')).width); }
    const ch = [...r.text]; ctx.letterSpacing = '0px'; ch.forEach((c, i) => { if (c === ' ') return; const g = glyph(i, ch.length); if (g.sy && g.sy !== 1) { ctx.save(); ctx.translate(r.gx[i], g.dy || 0); ctx.scale(1, g.sy); put(c, 0, 0); ctx.restore(); } else put(c, r.gx[i] + (g.dx || 0), g.dy || 0); }); }
  ctx.restore();
}
