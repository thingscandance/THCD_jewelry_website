import { Poster, FORMATS, FONTS, INFO_FONTS, PALETTES, LAYOUTS, MOTIONS, TREATMENTS, TYPE_STYLES, FPS } from './engine.js';
import { clearMetrics } from './fit.js';
import { cutOut, fromAlpha, alphaOf } from './mask.js';
import { encodeMP4, recordWebM, canMP4 } from './export.js';

const $ = id => document.getElementById(id);
const P = new Poster();
const S = {
  fmt: '4x5', layout: 'stack', mode: 'frame', font: 'anton', font2: 'barlow', info: 'space', labels: true, scatter: false, fx: .45, caps: true, customFont: null,
  pal: { ...PALETTES.find(p => p.id === 'acid') }, palId: 'acid', tr: 'original', tstyle: 'mix', track: -0.01, lead: .04, side: false, grain: true, trFig: '', contour: 'off', contourColor: 'acc',
  outline: true, outlineColor: '#ffffff', outlineW: 12, contourW: 3, contourN: 5, contourGap: 1, ptOn: false, ptDark: '#0A0A08', ptMid: '#5F6F22', ptLight: '#E4F7A0', shadow: false, echo: '', echoN: 3, echoDir: 'auto', stretch: true, motion: 'build', loop: 6, bpm: 120, feel: 0, cycle: true, shotBeats: 2, seed: 1,
  images: [],
  text: { title: 'GRAVITY', name: '', sub: 'night session 01', lines: '21.11 | stairwell jumps\n22.11 | concrete gaps\n23.11 | no net, no lights', date: '21.11', time: '23:00', place: 'Tbilisi · Vake 14', footer: 'things can dance · thcd.monster' },
};
const FIELDS = ['title', 'name', 'sub', 'lines', 'date', 'time', 'place', 'footer'];
let playing = true, t0 = performance.now(), tNow = 0, exporting = false, nextId = 1;
const status = (s, warn) => { $('status').textContent = s; $('status').classList.toggle('warn', !!warn); };

// ---------- build controls ----------
$('screen').appendChild(P.c);
for (const [k, d] of Object.entries(LAYOUTS)) { const [a, b] = d.split(' — '); const btn = document.createElement('button'); btn.className = 'btn'; btn.type = 'button'; btn.dataset.layout = k; btn.innerHTML = `<b>${a}</b><span>${b}</span>`; $('layouts').appendChild(btn); }
for (const [k, d] of Object.entries(MOTIONS)) { const [a, b] = d.split(' — '); const btn = document.createElement('button'); btn.className = 'btn'; btn.type = 'button'; btn.dataset.motion = k; btn.innerHTML = `<b>${a}</b><span>${b}</span>`; $('motions').appendChild(btn); }
for (const [k, f] of Object.entries(FONTS)) { $('font').add(new Option(f.name, k)); $('font2').add(new Option(f.name, k)); }
for (const [k, f] of Object.entries(INFO_FONTS)) $('info').add(new Option(f.name, k));
for (const [k, v] of Object.entries(TREATMENTS)) { $('tr').add(new Option(v, k)); $('trFig').add(new Option(v, k)); }
for (const [k, v] of Object.entries(TYPE_STYLES)) $('tstyle').add(new Option(v, k));
for (const p of PALETTES) { const b = document.createElement('button'); b.className = 'pal'; b.type = 'button'; b.dataset.pal = p.id; b.title = p.name; b.innerHTML = `<i style="background:${p.bg}"></i><i style="background:${p.ink}"></i><em style="background:${p.acc}"></em>`; $(p.ref ? 'palsref' : 'pals').appendChild(b); }
FIELDS.forEach(f => { const el = $('t_' + f); el.value = S.text[f]; el.addEventListener('input', () => { S.text[f] = el.value; rebuild(); }); });

function syncUI() {
  document.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('on', b.dataset.mode === S.mode));
  document.querySelectorAll('[data-layout]').forEach(b => b.classList.toggle('on', b.dataset.layout === S.layout));
  document.querySelectorAll('[data-motion]').forEach(b => b.classList.toggle('on', b.dataset.motion === S.motion));
  document.querySelectorAll('[data-pal]').forEach(b => b.classList.toggle('on', b.dataset.pal === S.palId));
  $('format').value = S.fmt; $('font').value = S.font; $('font2').value = S.font2; $('info').value = S.info; $('caps').checked = S.caps;
  $('c_bg').value = S.pal.bg; $('c_ink').value = S.pal.ink; $('c_acc').value = S.pal.acc;
  for (const k of ['tr', 'trFig', 'contour', 'loop', 'bpm', 'feel', 'shotBeats', 'tstyle', 'track', 'lead', 'fx', 'echo']) $(k).value = S[k];
  $('echoN').value = S.echoN; $('echoDir').value = S.echoDir; $('outlineColor').value = S.outlineColor; $('outlineW').value = S.outlineW;
  const cc = S.contourColor || 'acc'; $('contourSel').value = cc[0] === '#' ? 'custom' : cc; $('contourHex').value = cc[0] === '#' ? cc : (cc === 'ink' ? S.pal.ink : cc === 'white' ? '#ffffff' : S.pal.acc);
  for (const k of ['contourW', 'contourN', 'contourGap']) $(k).value = S[k]; $('ptOn').checked = S.ptOn; for (const k of ['ptDark', 'ptMid', 'ptLight']) $(k).value = S[k];
  for (const k of ['outline', 'shadow', 'cycle', 'stretch', 'side', 'grain', 'labels', 'scatter']) $(k).checked = S[k];
  $('fmtinfo').textContent = `${FORMATS[S.fmt][0]}×${FORMATS[S.fmt][1]} · ${FORMATS[S.fmt][2]}`;
  $('safewrap').hidden = S.fmt !== '9x16';
}
function rebuild() {
  P.setFormat(S.fmt); const rep = P.build(S); let bad = 0, tight = 0;
  document.querySelectorAll('[data-st]').forEach(el => { const r = rep[el.dataset.st]; const st = r ? r.state : 'empty';
    el.className = 'st ' + st; el.textContent = { ok: 'fits', tight: 'at minimum', cut: `cut · ${r && r.hidden} chars hidden`, empty: S.text[el.dataset.st]?.trim() ? 'not in this layout' : 'empty' }[st];
    if (st === 'cut') bad++; if (st === 'tight') tight++; });
  $('fitsum').textContent = bad ? `${bad} text${bad > 1 ? 's' : ''} cut — shorten` : tight ? 'all fits · some at minimum size' : 'all text fits';
  $('fitsum').style.color = bad ? '#ff5050' : tight ? '#ffb000' : '';
  const { beat, nb } = P.timing(); $('loopinfo').textContent = `${S.loop}s loop · ${nb} beats of ${beat.toFixed(2)}s`;
  if (!playing) draw();
}
const set = (k, v) => { S[k] = v; syncUI(); rebuild(); };
document.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.mode) { set('mode', b.dataset.mode); if (S.mode === 'cut') runCuts(); }
  else if (b.dataset.layout) set('layout', b.dataset.layout);
  else if (b.dataset.motion) { set('motion', b.dataset.motion); t0 = performance.now(); }
  else if (b.dataset.pal) { const p = PALETTES.find(x => x.id === b.dataset.pal); S.palId = p.id; S.pal = { ...p }; P.cache.clear(); syncUI(); rebuild(); } });
$('format').onchange = e => set('fmt', e.target.value);
$('font').onchange = e => { S.customFont = null; $('fontname').textContent = ''; $('fontclear').hidden = true; set('font', e.target.value); };
$('info').onchange = e => set('info', e.target.value);
$('font2').onchange = e => set('font2', e.target.value);
$('echo').onchange = e => set('echo', e.target.value);
$('echoN').onchange = e => set('echoN', +e.target.value);
$('echoDir').onchange = e => set('echoDir', e.target.value);
$('outlineColor').oninput = e => { S.outline = true; set('outlineColor', e.target.value); };
$('outlineW').oninput = e => { S.outline = true; set('outlineW', +e.target.value); };
$('contourSel').onchange = e => { const v = e.target.value; if (S.contour === 'off') S.contour = 'still'; set('contourColor', v === 'custom' ? $('contourHex').value : v); };
$('contourHex').oninput = e => { if (S.contour === 'off') S.contour = 'still'; set('contourColor', e.target.value); };
['contourW', 'contourN', 'contourGap'].forEach(k => $(k).oninput = e => { if (S.contour === 'off') S.contour = 'still'; set(k, +e.target.value); });
$('ptOn').onchange = e => { P.cache.clear(); set('ptOn', e.target.checked); };
['ptDark', 'ptMid', 'ptLight'].forEach(k => $(k).oninput = e => { S.ptOn = true; P.cache.clear(); set(k, e.target.value); });
$('fx').oninput = e => { S.fx = +e.target.value; P.cache.clear(); rebuild(); };
$('caps').onchange = e => set('caps', e.target.checked);
['c_bg', 'c_ink', 'c_acc'].forEach(id => $(id).oninput = e => { S.pal[id.slice(2)] = e.target.value; S.palId = ''; syncUI(); rebuild(); });
['tr', 'trFig', 'contour', 'shotBeats', 'tstyle'].forEach(k => $(k).onchange = e => set(k, e.target.value));
['track', 'lead'].forEach(k => $(k).oninput = e => set(k, +e.target.value));
['outline', 'shadow', 'cycle', 'stretch', 'side', 'grain', 'labels', 'scatter'].forEach(k => $(k).onchange = e => set(k, e.target.checked));
$('loop').onchange = e => set('loop', +e.target.value); $('feel').onchange = e => set('feel', +e.target.value);
$('bpm').onchange = e => set('bpm', Math.max(60, Math.min(200, +e.target.value || 120)));
$('seed').onclick = () => set('seed', S.seed + 1);

// own font: used for the headlines
$('fontpick').onclick = () => $('fontfile').click();
$('fontfile').onchange = async e => { const f = e.target.files[0]; if (!f) return; try { const fam = 'PosterUser' + Date.now(), ff = new FontFace(fam, await f.arrayBuffer()); await ff.load(); document.fonts.add(ff);
  S.customFont = { name: f.name, family: `"${fam}", sans-serif`, weight: 400 }; $('fontname').textContent = f.name; $('fontclear').hidden = false; clearMetrics(); rebuild(); } catch (err) { status('That font file could not be read.', true); } e.target.value = ''; };
$('fontclear').onclick = () => { S.customFont = null; $('fontname').textContent = ''; $('fontclear').hidden = true; rebuild(); };

// ---------- photos ----------
const MAXPX = 1600;
async function addFiles(files) {
  for (const f of files) { if (!f.type.startsWith('image/')) continue; try {
    const bmp = await createImageBitmap(f), k = Math.min(1, MAXPX / Math.max(bmp.width, bmp.height)), c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k); c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height); bmp.close();
    const im = { id: 'i' + nextId++, name: f.name, src: c, cut: null, cutBox: null, pan: { x: 0, y: 0, z: 1 }, state: 'frame' };
    const a = f.type === 'image/png' || f.type === 'image/webp' ? alphaOf(c) : null; if (a) { Object.assign(im, fromAlpha(c, a)); im.state = 'ready'; im.ownAlpha = true; }
    S.images.push(im); } catch (err) { status(`${f.name} could not be opened.`, true); } }
  tiles(); rebuild(); if (S.mode === 'cut') runCuts();
}
function tiles() {
  const box = $('tiles'); box.innerHTML = ''; $('photoinfo').textContent = S.images.length ? `${S.images.length} photo${S.images.length > 1 ? 's' : ''}` : 'no photos';
  S.images.forEach((im, i) => { const t = document.createElement('div'); t.className = 'tile'; const th = document.createElement('div'); th.className = 'th'; const c = document.createElement('canvas'); const s = im.cut && S.mode === 'cut' ? im.cut : im.src, k = 220 / Math.max(s.width, s.height); c.width = Math.max(1, s.width * k); c.height = Math.max(1, s.height * k); c.getContext('2d').drawImage(s, 0, 0, c.width, c.height); th.appendChild(c);
    const st = im.state === 'ready' ? (im.ownAlpha ? 'own cut-out' : 'cut out ✓') : im.state === 'busy' ? 'cutting…' : im.state === 'failed' ? 'no person found' : 'frame';
    t.innerHTML = `<div class="meta"><b>${String(i + 1).padStart(2, '0')}</b><span class="s ${im.state}">${st}</span></div>`; t.prepend(th);
    if (im.cut) { const fx = document.createElement('div'); fx.className = 'ctl'; fx.innerHTML = `<button type="button">${erasing === i ? 'erasing…' : 'erase'}</button><button type="button" ${im.cutBackup ? '' : 'disabled'}>undo</button>`; const [eb, ub] = fx.children;
      eb.onclick = () => startErase(erasing === i ? -1 : i); ub.onclick = () => { if (!im.cutBackup) return; im.cut = im.cutBackup; im.cutBackup = null; im.dist = null; P.forget(im.id); tiles(); rebuild(); }; t.appendChild(fx); }
    const ctl = document.createElement('div'); ctl.className = 'ctl'; ctl.innerHTML = `<button type="button" title="move earlier" aria-label="move earlier">←</button><button type="button" title="move later" aria-label="move later">→</button><button type="button" title="remove" aria-label="remove">×</button>`;
    const [l, r, x] = ctl.children; l.onclick = () => { if (i) { [S.images[i - 1], S.images[i]] = [S.images[i], S.images[i - 1]]; tiles(); rebuild(); } };
    r.onclick = () => { if (i < S.images.length - 1) { [S.images[i + 1], S.images[i]] = [S.images[i], S.images[i + 1]]; tiles(); rebuild(); } };
    x.onclick = () => { P.forget(im.id); S.images.splice(i, 1); tiles(); rebuild(); };
    t.appendChild(ctl); box.appendChild(t); });
}
let cutting = false;
async function runCuts() {
  if (cutting) return; cutting = true; const todo = () => S.images.filter(im => im.state === 'frame');
  try { while (todo().length && S.mode === 'cut') { const im = todo()[0], left = todo().length; im.state = 'busy'; tiles(); $('cutwrap').hidden = false;
      try { const r = await cutOut(im.src, (s, p) => { $('cuttxt').textContent = s; $('cutbar').style.width = Math.round((p || 0) * 100) + '%'; });
        if (r && r.cutBox.w * r.cutBox.h > im.src.width * im.src.height * .01) { Object.assign(im, r); im.state = 'ready'; im.dist = null; P.forget(im.id); } else im.state = 'failed';
        $('cuttxt').textContent = `cut-out: ${left - 1} left`; }
      catch (err) { console.error(err); im.state = 'frame'; $('cuttxt').textContent = `cut-out did not work here: ${String(err.message || err).slice(0, 120)}. You can drop PNGs that already have a transparent background.`; tiles(); break; }
      tiles(); rebuild(); }
    if (!todo().length) $('cutwrap').hidden = true; } finally { cutting = false; }
}
$('pick').onclick = () => $('file').click();
$('file').onchange = e => { addFiles([...e.target.files]); e.target.value = ''; };
const drop = $('drop');
['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
drop.addEventListener('drop', e => addFiles([...e.dataTransfer.files]));

// ---------- drag / zoom photos in the preview ----------
const toCanvas = e => { const r = P.c.getBoundingClientRect(); return [(e.clientX - r.left) * P.W / r.width, (e.clientY - r.top) * P.H / r.height]; };
const hitAt = (x, y) => { const h = (P.hits || []).filter(h => x >= h.box.x && x <= h.box.x + h.box.w && y >= h.box.y && y <= h.box.y + h.box.h); return h[h.length - 1]; };
let drag = null;
let erasing = -1, painting = false;
function startErase(i) { erasing = i; $('erasebar').hidden = i < 0; if (i >= 0) { if (S.mode !== 'cut') set('mode', 'cut'); $('erasetxt').textContent = `erasing from photo ${String(i + 1).padStart(2, '0')}: paint over what is not the person`; playing = false; $('play').textContent = 'play'; draw(); } P.c.style.cursor = i >= 0 ? 'crosshair' : ''; tiles(); }
$('erasedone').onclick = () => startErase(-1);
function eraseAt(e) { const [x, y] = toCanvas(e), im = S.images[erasing]; if (!im || !im.cut) return; const f = (P.figs || []).filter(f => f.idx === erasing).pop(); if (!f) { status('This photo is not on the poster in this layout. Pick a layout that shows it.', true); return; }
  let px = x, py = y; if (f.rot) { const cx = f.box.x + f.box.w / 2, cy = f.box.y + f.box.h / 2, a = -f.rot * Math.PI / 180, ddx = x - cx, ddy = y - cy; px = cx + ddx * Math.cos(a) - ddy * Math.sin(a); py = cy + ddx * Math.sin(a) + ddy * Math.cos(a); }
  if (!im.cutBackup) { const b = document.createElement('canvas'); b.width = im.cut.width; b.height = im.cut.height; b.getContext('2d').drawImage(im.cut, 0, 0); im.cutBackup = b; }
  const k = im.cut.width / f.w; P.erase(im, (px - f.x) * k, (py - f.y) * k, +$('brush').value / 2 * P.W / P.c.getBoundingClientRect().width * k); draw(); }
P.c.addEventListener('pointerdown', e => { if (erasing >= 0) { painting = true; P.c.setPointerCapture(e.pointerId); eraseAt(e); return; } const [x, y] = toCanvas(e), h = hitAt(x, y); if (!h) return; drag = { h, x, y, pan: { ...S.images[h.idx].pan } }; P.c.setPointerCapture(e.pointerId); P.c.classList.add('drag'); });
P.c.addEventListener('pointermove', e => { if (painting) { eraseAt(e); return; } if (!drag) return; const [x, y] = toCanvas(e), im = S.images[drag.h.idx]; if (!im) return; im.pan.x = drag.pan.x + (x - drag.x) / drag.h.box.w; im.pan.y = drag.pan.y + (y - drag.y) / drag.h.box.h; if (!playing) draw(); });
P.c.addEventListener('pointerup', () => { if (painting) { painting = false; tiles(); } drag = null; P.c.classList.remove('drag'); });
P.c.addEventListener('wheel', e => { const [x, y] = toCanvas(e), h = hitAt(x, y); if (!h) return; e.preventDefault(); const p = S.images[h.idx].pan; p.z = Math.max(.3, Math.min(4, p.z * Math.exp(-e.deltaY * .0015))); if (!playing) draw(); }, { passive: false });
P.c.addEventListener('dblclick', e => { const [x, y] = toCanvas(e), h = hitAt(x, y); if (h) { S.images[h.idx].pan = { x: 0, y: 0, z: 1 }; if (!playing) draw(); } });

// ---------- playback ----------
const ov = () => ({ frames: $('frames').checked, safe: $('safe').checked });
function draw() { P.render(tNow, ov()); $('tinfo').textContent = `${tNow.toFixed(2)} / ${S.loop}s`; }
function tick(now) { if (playing && !exporting) { tNow = ((now - t0) / 1000) % S.loop; $('scrub').value = Math.round(tNow / S.loop * 1000); draw(); } requestAnimationFrame(tick); }
$('play').onclick = () => { playing = !playing; $('play').textContent = playing ? 'pause' : 'play'; if (playing) t0 = performance.now() - tNow * 1000; };
$('scrub').oninput = e => { playing = false; $('play').textContent = 'play'; tNow = e.target.value / 1000 * S.loop * .999; draw(); };
['frames', 'safe'].forEach(k => $(k).onchange = () => { if (!playing) draw(); });

// ---------- presets ----------
const NOT_LOOK = new Set(['images', 'text', 'customFont']);
const BUILTIN = {
  'echo · b/w cut-outs': { layout: 'split', mode: 'cut', fmt: '4x5', palId: 'concrete', tr: 'original', trFig: 'mono', outline: true, outlineColor: '#ffffff', outlineW: 12, contourW: 3, contourN: 5, contourGap: 1, ptOn: false, ptDark: '#0A0A08', ptMid: '#5F6F22', ptLight: '#E4F7A0', echo: 'copies', echoN: 3, echoDir: 'auto', contour: 'off', tstyle: 'fill', motion: 'build', feel: 12, grain: true },
  'acid figure': { layout: 'figure', mode: 'cut', fmt: '4x5', palId: 'acid', tr: 'grade', trFig: 'flash', outline: false, echo: '', contour: 'move', contourColor: 'acc', tstyle: 'fill', motion: 'letters', feel: 0, grain: true },
  'riso collage': { layout: 'collage', mode: 'cut', fmt: '4x5', palId: 'bleach', tr: 'riso', trFig: '', fx: .45, outline: true, outlineColor: '#ffffff', echo: '', contour: 'off', tstyle: 'mix', motion: 'boil', feel: 12, grain: true },
  'mono stack': { layout: 'stack', mode: 'frame', fmt: '4x5', palId: 'acid', tr: 'mono', tstyle: 'mix', motion: 'cut', feel: 0, grain: true },
};
const store = { get() { try { return JSON.parse(localStorage.getItem('thcd-poster-presets') || '{}'); } catch (e) { return {}; } }, set(v) { try { localStorage.setItem('thcd-poster-presets', JSON.stringify(v)); return true; } catch (e) { return false; } } };
function snapshot(withText) { const o = {}; for (const k in S) if (!NOT_LOOK.has(k)) o[k] = JSON.parse(JSON.stringify(S[k])); if (withText) o.text = { ...S.text }; return o; }
function apply(p) { const pal = p.palId && PALETTES.find(x => x.id === p.palId); for (const k in p) if (k !== 'text' && k !== 'images') S[k] = JSON.parse(JSON.stringify(p[k])); if (pal && !p.pal) S.pal = { ...pal };
  if (p.text) { Object.assign(S.text, p.text); FIELDS.forEach(f => $('t_' + f).value = S.text[f]); } P.cache.clear(); syncUI(); rebuild(); tiles(); if (S.mode === 'cut') runCuts(); t0 = performance.now(); }
function presetList() { const sel = $('presetSel'), mine = store.get(); sel.innerHTML = ''; const g1 = document.createElement('optgroup'); g1.label = 'yours'; for (const k of Object.keys(mine)) g1.appendChild(new Option(k, 'u:' + k));
  const g2 = document.createElement('optgroup'); g2.label = 'built in'; for (const k of Object.keys(BUILTIN)) g2.appendChild(new Option(k, 'b:' + k)); if (g1.children.length) sel.appendChild(g1); sel.appendChild(g2); }
$('presetSave').onclick = () => { const name = $('presetName').value.trim() || `look ${new Date().toLocaleString()}`, all = store.get(); all[name] = snapshot($('presetText').checked); if (store.set(all)) { presetList(); $('presetSel').value = 'u:' + name; status(`preset "${name}" saved in this browser.`); } else status('This browser does not allow saving here. Use "save file" instead.', true); };
$('presetLoad').onclick = () => { const v = $('presetSel').value; if (!v) return; const p = v.startsWith('b:') ? BUILTIN[v.slice(2)] : store.get()[v.slice(2)]; if (p) { apply(p); status(`preset "${v.slice(2)}" loaded.`); } };
$('presetDel').onclick = () => { const v = $('presetSel').value; if (!v.startsWith('u:')) { status('Built-in presets cannot be deleted.', true); return; } const all = store.get(); delete all[v.slice(2)]; store.set(all); presetList(); status('preset deleted.'); };
$('presetFile').onclick = async () => { const name = $('presetName').value.trim() || 'poster-look', blob = new Blob([JSON.stringify({ poster: 1, name, look: snapshot($('presetText').checked) }, null, 2)], { type: 'application/json' }); await save(blob, name.replace(/[^\w.-]+/g, '_') + '.json'); status('preset file saved.'); };
$('presetPick').onclick = () => $('presetImp').click();
$('presetImp').onchange = async e => { const f = e.target.files[0]; e.target.value = ''; if (!f) return; try { const j = JSON.parse(await f.text()), look = j.look || j; apply(look); const name = j.name || f.name.replace(/\.json$/, ''), all = store.get(); all[name] = look; store.set(all); presetList(); status(`preset "${name}" loaded from file.`); } catch (err) { status('That file is not a POSTER preset.', true); } };
presetList();

// ---------- export ----------
async function save(blob, name) {
  try { if (window.claude && window.claude.use) { const d = await window.claude.use('downloads'); if (d) { await d.save({ filename: name, data: blob }); return; } } } catch (e) { console.warn(e); }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
const stamp = () => `poster_${S.layout}_${S.fmt}_${new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '')}`;
$('png').onclick = async () => { P.render(tNow, {}); const blob = await new Promise(r => P.c.toBlob(r, 'image/png')); draw(); await save(blob, stamp() + '.png'); status('PNG saved: the frame in the preview, without the guides.'); };
$('mp4').onclick = async () => {
  if (exporting) return; exporting = true; $('mp4').disabled = $('png').disabled = true; const n = Math.round(S.loop * FPS), bar = $('expbar');
  try { const paint = async i => { const c = P.render(i / FPS, {}); if (i % 6 === 0) await new Promise(r => setTimeout(r)); return c; };
    let out; if (await canMP4(P.W, P.H)) out = await encodeMP4(n, paint, null, P.W, P.H, p => { bar.style.width = p * 100 + '%'; status(`encoding ${Math.round(p * 100)}%`); });
    else { status('this browser has no MP4 encoder, recording WebM in real time…'); out = await recordWebM(n, paint, null, P.W, P.H, p => bar.style.width = p * 100 + '%'); }
    await save(out.blob, stamp() + '.' + out.type); status(`${out.type.toUpperCase()} saved: ${S.loop} s, ${P.W}×${P.H}, loops seamlessly.`); }
  catch (err) { console.error(err); status('Export failed: ' + String(err.message || err).slice(0, 160), true); }
  finally { exporting = false; $('mp4').disabled = $('png').disabled = false; bar.style.width = '0'; t0 = performance.now() - tNow * 1000; }
};

// fonts arrive late: measure again once they are in
document.fonts.addEventListener('loadingdone', () => { clearMetrics(); rebuild(); });
Promise.all(Object.values({ ...FONTS, ...INFO_FONTS }).map(f => document.fonts.load(`${f.weight} 40px ${f.family}`).catch(() => {}))).then(() => { clearMetrics(); rebuild(); });
syncUI(); rebuild(); tiles(); requestAnimationFrame(tick);
window.__poster = { P, S, rebuild, syncUI, addFiles, tiles };
