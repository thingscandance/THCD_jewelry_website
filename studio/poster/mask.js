// POSTER cut-out: RMBG-1.4 in the browser through transformers.js, the same model SCAN uses.
// The model downloads once from the CDN and is cached; the photos never leave the browser.
const LIB = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.6/dist/transformers.min.js', MODEL = 'briaai/RMBG-1.4';
let T = null, model = null, proc = null, loading = null, tries = 0, chain = Promise.resolve();
function load(onStatus) {
  if (loading) return loading;
  loading = (async () => { T = await import(tries++ ? `${LIB}?retry=${tries}` : LIB); T.env.allowLocalModels = false; try { await caches.open('poster-probe'); } catch (e) { T.env.useBrowserCache = false; }
    const seen = {}, progress = p => { if (p.status === 'progress' && p.total) { seen[p.file] = [p.loaded, p.total]; const v = Object.values(seen), a = v.reduce((s, x) => s + x[0], 0), b = v.reduce((s, x) => s + x[1], 0); onStatus && onStatus(`cut-out: downloading the model, once, ${Math.round(a / b * 100)}% of ${Math.round(b / 1e6)} MB`, a / b); } };
    const opts = navigator.gpu ? { dtype: 'fp16', device: 'webgpu', progress_callback: progress } : { dtype: 'q8', device: 'wasm', progress_callback: progress };
    try { model = await T.AutoModel.from_pretrained(MODEL, opts); } catch (e) { console.warn(e); onStatus && onStatus('cut-out: switching to the slower processor mode…', 0); model = await T.AutoModel.from_pretrained(MODEL, { dtype: 'q8', device: 'wasm', progress_callback: progress }); }
    proc = await T.AutoProcessor.from_pretrained(MODEL); })().catch(e => { loading = null; throw e; });
  return loading;
}
// alpha 0..255 per pixel of src -> { cut: canvas cropped to the figure, cutBox: where it sits in src }
export function fromAlpha(src, alpha) {
  const w = src.width, h = src.height; let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (alpha[y * w + x] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) return null;
  const full = document.createElement('canvas'); full.width = w; full.height = h; const g = full.getContext('2d'); g.drawImage(src, 0, 0); const d = g.getImageData(0, 0, w, h);
  for (let i = 0; i < w * h; i++) d.data[i * 4 + 3] = Math.min(d.data[i * 4 + 3], alpha[i]); g.putImageData(d, 0, 0);
  const cb = { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 }, c = document.createElement('canvas'); c.width = cb.w; c.height = cb.h; c.getContext('2d').drawImage(full, -x0, -y0);
  return { cut: c, cutBox: cb };
}
// a PNG that already has transparency is used as its own cut-out
export function alphaOf(src) { const g = src.getContext('2d'), d = g.getImageData(0, 0, src.width, src.height).data, a = new Uint8Array(src.width * src.height); let clear = 0;
  for (let i = 0; i < a.length; i++) { a[i] = d[i * 4 + 3]; if (a[i] < 200) clear++; } return clear > a.length * .02 ? a : null; }
export function cutOut(src, onStatus) {
  const job = chain.then(async () => { await load(onStatus); onStatus && onStatus('cut-out: finding the figure…', .99);
    const img = T.RawImage.fromCanvas(src), inp = await proc(img), r = await model({ input: inp.pixel_values }), o = r.output || r[Object.keys(r)[0]], dd = o.dims, oh = dd[dd.length - 2], ow = dd[dd.length - 1], w = src.width, h = src.height, a = new Uint8Array(w * h), lo = .14 * 255, span = 40;
    for (let y = 0; y < h; y++) { const sy = Math.min(oh - 1, Math.floor((y + .5) * oh / h)) * ow; for (let x = 0; x < w; x++) { const v = o.data[sy + Math.min(ow - 1, Math.floor((x + .5) * ow / w))] * 255; a[y * w + x] = v <= lo ? 0 : v >= lo + span ? 255 : (v - lo) / span * 255; } }
    return fromAlpha(src, a); });
  chain = job.catch(() => {}); return job;
}
