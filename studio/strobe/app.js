import { compile, Renderer, makeLogo, W, H, FPS } from './engine.js';
import { renderSound, wavBlob } from './sound.js';
import { encodeMP4, recordWebM, canMP4 } from './export.js';
import { loadClip, embedImage, embedText, cos } from './clip.js';

const $ = s => document.querySelector(s);
const media = [];            // every uploaded item
let cut = [];                // ordered ids for the reel (empty = all media in upload order)
let seed = 7;
let lastScores = null;
const FONT = '"Geist", ui-sans-serif, system-ui, sans-serif';
const MONO = '"Geist Mono", ui-monospace, monospace';

// ---------------- settings ----------------
const S = () => ({
  tempo: +$('#tempo').value, glitch: +$('#glitch').value / 100,
  splits: $('#splits').checked, sheet: $('#sheet').checked, punch: $('#punch').checked,
  marks: $('#marks').checked, safe: $('#safe').checked, sound: $('#sound').checked, seed,
});
let logoCache = { key: '', logo: null }, exampleLogo = null, customFont = null;
// "weight|family" values from the font menus; an uploaded font file becomes its own family
const fontOf = sel => { const v = $(sel).value; if (v === 'custom' && customFont) return ['400', `"${customFont}"`]; const [w, f] = v.split('|'); return [w, `"${f}", ui-sans-serif, sans-serif`]; };
async function logo() {
  const file = $('#logofile').files[0] || exampleLogo, text = $('#logo').value.trim() || 'STROBE';
  const [w, fam] = fontOf('#logofont');
  const key = text + '|' + w + fam + '|' + (file ? file.name + file.size : '');
  if (logoCache.key !== key) { try { await document.fonts.load(`${w} 140px ${fam}`, text); } catch (e) {} logoCache = { key, logo: await makeLogo(text, file, fam, w) }; }
  return logoCache.logo;
}
async function rendererOpt() {
  const [tw, tfam] = fontOf('#textfont');
  try { await document.fonts.load(`${tw} 22px ${tfam}`); } catch (e) {}
  return { gstyle: $('#gstyle').value, look: $('#look').value, font: tfam, fontWeight: tw, mono: MONO, logo: await logo(), tl: $('#tl').value, bl: $('#bl').value, br: $('#br').value, tag: $('#tag').value, marks: $('#marks').checked, safe: $('#safe').checked };
}

// ---------------- loading media ----------------
const clean = n => n.replace(/\.[^.]+$/, '').replace(/[_\-.]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 28);
function thumbOf(src, w, h) {
  const c = document.createElement('canvas'); c.width = 216; c.height = 384; const g = c.getContext('2d'); g.imageSmoothingQuality = 'high';
  const s = Math.max(216 / w, 384 / h); g.drawImage(src, (216 - w * s) / 2, (384 - h * s) / 2, w * s, h * s); return c;
}
async function addFiles(files) {
  const list = [...files].filter(f => /^(image|video)\//.test(f.type));
  for (const file of list) {
    const m = { id: crypto.randomUUID(), idx: media.length, file, name: file.name, label: clean(file.name), flags: { ownLogo: false, end: false, hiss: false } };
    status(`reading ${file.name}…`);
    try {
      if (file.type.startsWith('image/')) {
        let bmp = await createImageBitmap(file);
        const long = Math.max(bmp.width, bmp.height);
        if (long > 2400) { const k = 2400 / long; const b2 = await createImageBitmap(bmp, { resizeWidth: Math.round(bmp.width * k), resizeHeight: Math.round(bmp.height * k), resizeQuality: 'high' }); bmp.close(); bmp = b2; }
        Object.assign(m, { type: 'image', bmp, w: bmp.width, h: bmp.height });
        m.thumb = thumbOf(bmp, m.w, m.h);
      } else {
        const v = document.createElement('video'); v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = URL.createObjectURL(file);
        await new Promise((res, rej) => { v.onloadeddata = res; v.onerror = () => rej(new Error('cannot read video')); });
        Object.assign(m, { type: 'video', el: v, w: v.videoWidth, h: v.videoHeight, dur: v.duration });
        await new Promise(r => { v.onseeked = r; v.currentTime = Math.min(v.duration * .4, v.duration - .05); });
        m.thumb = thumbOf(v, m.w, m.h);
      }
      media.push(m);
    } catch (e) { status(`skipped ${file.name}: ${e.message}`); }
  }
  status(`${media.length} items`);
  $('#pv').hidden = true; $('#pv').loop = false; $('#cv').hidden = false; $('#exlook').hidden = true;
  drawMedia(); refresh();
  if (clipReady) embedAll();
}

// ---------------- media grid ----------------
function drawMedia() {
  const box = $('#media'); box.innerHTML = '';
  $('#empty').hidden = media.length > 0;
  media.forEach(m => {
    const el = document.createElement('div'); el.className = 'tile' + (cut.includes(m.id) ? ' in' : '');
    const sc = lastScores ? lastScores.get(m.id) : null;
    el.innerHTML = `<div class="th"></div>
      <div class="meta"><span>${String(m.idx + 1).padStart(2, '0')}</span><span>${m.type === 'video' ? m.dur.toFixed(1) + ' s' : 'still'}</span>${sc != null ? `<span class="score">${sc.rank}</span>` : ''}</div>
      <input class="lab" value="${m.label.replace(/"/g, '&quot;')}" aria-label="label for frame ${m.idx + 1}">
      <div class="flags">
        <button data-f="ownLogo" title="the product already carries the logo here: hide the overlay and hit on it">logo on product</button>
        <button data-f="end" title="use as the packshot at the end">end</button>
        <button data-f="hiss" title="a hiss on this cut">hiss</button>
      </div>`;
    el.querySelector('.th').appendChild(m.thumb);
    el.querySelector('.th').onclick = () => { toggleCut(m.id); };
    el.querySelector('.lab').onchange = e => { m.label = e.target.value; refresh(); };
    el.querySelectorAll('.flags button').forEach(b => {
      b.classList.toggle('on', m.flags[b.dataset.f]);
      b.onclick = () => { const f = b.dataset.f; if (f === 'end') media.forEach(x => { if (x !== m) x.flags.end = false; }); m.flags[f] = !m.flags[f]; drawMedia(); refresh(); };
    });
    if (sc != null && sc.rank <= 4) el.classList.add('hit');
    box.appendChild(el);
  });
}

// ---------------- the cut list ----------------
function toggleCut(id) { const i = cut.indexOf(id); if (i >= 0) cut.splice(i, 1); else cut.push(id); drawMedia(); drawCut(); refresh(); }
function drawCut() {
  const box = $('#cut'); box.innerHTML = '';
  const ids = cut.length ? cut : media.map(m => m.id);
  $('#cutnote').textContent = cut.length ? `${cut.length} picked, in this order` : 'nothing picked: all frames in upload order';
  ids.forEach((id, i) => {
    const m = media.find(x => x.id === id); if (!m) return;
    const chip = document.createElement('div'); chip.className = 'chip'; chip.draggable = !!cut.length;
    const t = document.createElement('canvas'); t.width = 54; t.height = 96; t.getContext('2d').drawImage(m.thumb, 0, 0, 54, 96);
    chip.appendChild(t);
    const s = document.createElement('span'); s.textContent = String(i + 1).padStart(2, '0'); chip.appendChild(s);
    if (cut.length) {
      chip.ondragstart = e => { e.dataTransfer.setData('text/plain', String(i)); };
      chip.ondragover = e => e.preventDefault();
      chip.ondrop = e => { e.preventDefault(); const from = +e.dataTransfer.getData('text/plain'); const [x] = cut.splice(from, 1); cut.splice(i, 0, x); drawCut(); refresh(); };
      chip.ondblclick = () => toggleCut(id);
    }
    box.appendChild(chip);
  });
}
const listForReel = () => (cut.length ? cut : media.map(m => m.id)).map(id => media.find(m => m.id === id)).filter(Boolean);

// ---------------- search by description ----------------
let clipReady = false;
async function ensureClip() { if (!clipReady) { await loadClip(t => $('#sst').textContent = t); clipReady = true; } await embedAll(); }
async function embedAll() {
  const todo = media.filter(m => !m.emb);
  for (let i = 0; i < todo.length; i++) { $('#sst').textContent = `reading frames ${i + 1}/${todo.length}…`; todo[i].emb = await embedImage(todo[i].thumb); }
  if (todo.length) $('#sst').textContent = 'search ready';
}
async function search() {
  const q = $('#q').value.trim(); if (!q || !media.length) return;
  $('#go').disabled = true;
  try {
    await ensureClip();
    const e = await embedText(q);
    const ranked = media.map(m => ({ m, s: cos(e, m.emb) })).sort((a, b) => b.s - a.s);
    lastScores = new Map(ranked.map((x, i) => [x.m.id, { s: x.s, rank: i + 1 }]));
    drawMedia();
    $('#sst').textContent = `best match: ${String(ranked[0].m.idx + 1).padStart(2, '0')} · ${ranked[0].m.label}`;
  } catch (err) { $('#sst').textContent = 'search failed: ' + err.message; }
  $('#go').disabled = false;
}
function addTop() {
  if (!lastScores) return;
  [...lastScores.entries()].sort((a, b) => a[1].rank - b[1].rank).slice(0, 4).forEach(([id]) => { if (!cut.includes(id)) cut.push(id); });
  drawMedia(); drawCut(); refresh();
}
async function fromScript() {
  const lines = $('#script').value.split('\n').map(l => l.trim()).filter(Boolean);
  if (!lines.length || !media.length) return;
  $('#build').disabled = true;
  try {
    await ensureClip();
    const used = new Set(), picks = [];
    for (const line0 of lines) {
      const isEnd = /^end\b[:\s]*/i.test(line0), line = line0.replace(/^end\b[:\s]*/i, '') || line0;
      const e = await embedText(line);
      const ranked = media.map(m => ({ m, s: cos(e, m.emb) })).sort((a, b) => b.s - a.s);
      const best = ranked.find(x => !used.has(x.m.id)) || ranked[0];
      used.add(best.m.id); best.m.label = line.slice(0, 28);
      if (isEnd) { media.forEach(x => x.flags.end = false); best.m.flags.end = true; }
      picks.push(best.m.id);
    }
    cut = picks; drawMedia(); drawCut(); refresh();
    $('#sst').textContent = `script: ${picks.length} beats matched`;
  } catch (err) { $('#sst').textContent = 'script failed: ' + err.message; }
  $('#build').disabled = false;
}

// ---------------- preview, scrub, export ----------------
let plan = null, renderer = null;
async function refresh() {
  drawCut();
  const list = listForReel();
  plan = compile(list, S());
  renderer = new Renderer(await rendererOpt());
  const n = plan.frames.length;
  $('#scrub').max = Math.max(0, n - 1);
  $('#len').textContent = n ? `${(n / FPS).toFixed(1)} s · ${plan.cuts.length} cuts` : '—';
  $('#scrub').value = Math.min(+$('#scrub').value, Math.max(0, n - 1));
  drawFrame();
}
let drawing = false, again = false;
async function drawFrame() {
  if (!plan || !plan.frames.length) { const g = $('#cv').getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, 540, 960); return; }
  if (drawing) { again = true; return; }
  drawing = true;
  const i = +$('#scrub').value, f = plan.frames[i];
  const src = await renderer.paint(f, i, f.k, plan.cuts.length);
  { const cg = $('#cv').getContext('2d'); cg.imageSmoothingQuality = 'high'; cg.drawImage(src, 0, 0, W, H, 0, 0, 540, 960); }
  drawing = false;
  if (again) { again = false; drawFrame(); }
}
const progress = p => { $('#bar').style.width = (p * 100).toFixed(1) + '%'; };
async function make(full) {
  if (!plan || !plan.frames.length) return;
  const btns = [$('#prev'), $('#exp')]; btns.forEach(b => b.disabled = true);
  try {
    status('composing the sound…'); progress(0);
    const audio = S().sound ? await renderSound(plan.frames, plan.cuts, { seed }) : null;
    status(full ? 'rendering 1080×1920…' : 'rendering preview…');
    const paint = i => renderer.paint(plan.frames[i], i, plan.frames[i].k, plan.cuts.length);
    const [w, h] = full ? [1080, 1920] : [540, 960];
    const res = canMP4() ? await encodeMP4(plan.frames.length, paint, audio, w, h, progress) : await recordWebM(plan.frames.length, paint, audio, w, h, progress);
    const url = URL.createObjectURL(res.blob);
    if (full) {
      const a = document.createElement('a'); a.href = url; a.download = `strobe_${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.${res.type}`; a.click();
      status(`exported ${res.type.toUpperCase()}${res.audioMissing ? ' without sound (this browser cannot encode AAC): the sound is saved as WAV next to it' : ''}`);
      if (res.audioMissing && audio) { const b = document.createElement('a'); b.href = URL.createObjectURL(wavBlob(audio)); b.download = a.download.replace(/\.\w+$/, '.wav'); b.click(); }
    } else {
      const v = $('#pv'); v.src = url; v.hidden = false; $('#cv').hidden = true; v.play().catch(() => {});
      status(`preview ready${res.audioMissing ? ' (no sound in this browser)' : ''}`);
    }
  } catch (err) { status('render failed: ' + err.message); console.error(err); }
  btns.forEach(b => b.disabled = false); progress(0);
}
function status(t) { $('#status').textContent = t; }

// ---------------- wiring ----------------
$('#logopick').onclick = () => $('#logofile').click();
$('#logofile').addEventListener('change', () => { exampleLogo = null; $('#logoname').textContent = $('#logofile').files[0] ? $('#logofile').files[0].name : 'none'; refresh(); });
$('#logoclear').onclick = () => { $('#logofile').value = ''; exampleLogo = null; $('#logoname').textContent = 'none'; refresh(); };
$('#fontpick').onclick = () => $('#fontfile').click();
$('#fontfile').addEventListener('change', async () => {
  const f = $('#fontfile').files[0]; if (!f) return;
  const name = 'Custom ' + f.name.replace(/\.[^.]+$/, '');
  try { const face = new FontFace(name, await f.arrayBuffer()); await face.load(); document.fonts.add(face); customFont = name;
    for (const sel of ['#logofont', '#textfont']) { const o = $(sel).querySelector('option[value=custom]'); o.disabled = false; o.textContent = 'uploaded: ' + f.name; }
    $('#logofont').value = 'custom'; refresh(); } catch (e) { status('could not read that font: ' + e.message); }
});
const fileIn = $('#files');
$('#pick').onclick = () => fileIn.click();
fileIn.onchange = () => { addFiles(fileIn.files); fileIn.value = ''; };
const dz = $('#drop');
['dragenter', 'dragover'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('over'); }));
['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove('over'); }));
dz.addEventListener('drop', e => addFiles(e.dataTransfer.files));
$('#go').onclick = search; $('#q').onkeydown = e => { if (e.key === 'Enter') search(); };
$('#top').onclick = addTop;
$('#build').onclick = fromScript;
$('#auto').onclick = () => { cut = []; drawMedia(); refresh(); };
$('#shuffle').onclick = () => { seed = (seed * 48271) % 2147483647; refresh(); };
$('#clear').onclick = () => { cut = []; lastScores = null; drawMedia(); refresh(); };
$('#scrub').oninput = () => { $('#pv').hidden = true; $('#pv').loop = false; $('#cv').hidden = false; $('#exlook').hidden = true; drawFrame(); };
$('#prev').onclick = () => make(false);
$('#exp').onclick = () => make(true);
document.querySelectorAll('#settings input, #settings select').forEach(i => i.addEventListener(i.type === 'text' || i.tagName === 'SELECT' ? 'change' : 'input', () => refresh()));
$('#mp4note').textContent = canMP4() ? 'exports MP4 (H.264 + AAC)' : 'this browser records WebM in real time; Chrome or Safari export MP4';
refresh();
// until frames are added, the preview plays an example cut made with the tool from the THCD silver pieces
(function example() {
  const v = $('#pv'), pick = $('#exlook');
  const set = l => { v.src = `./examples/example_${l}.mp4`; v.poster = './examples/example_poster.jpg'; v.muted = true; v.loop = true; v.hidden = false; $('#cv').hidden = true; v.play().catch(() => {}); };
  set('mix');
  pick.querySelectorAll('button').forEach(b => b.onclick = () => { pick.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); set(b.dataset.l); });
  status('example: silver pieces from thcd.monster, made here · unmute for sound');
})();
// for scripting the tool from the console
window.strobe = { get plan() { return plan; }, renderSound, wavBlob, seed: () => seed };
