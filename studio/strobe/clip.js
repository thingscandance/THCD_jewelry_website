// STROBE search: CLIP (ViT-B/32) running in the browser through transformers.js.
// Every frame is embedded once; a description is embedded and frames are ranked by cosine similarity.
const LIB = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.6/dist/transformers.min.js';
const MODEL = 'Xenova/clip-vit-base-patch32';
let T = null, tok, txt, proc, vis, loading = null;

export function loadClip(onStatus) {
  if (loading) return loading;
  loading = (async () => {
    onStatus && onStatus('loading the search model (once, about 90 MB)…');
    T = await import(LIB);
    T.env.allowLocalModels = false;
    const progress = p => { if (p.status === 'progress' && p.total) onStatus && onStatus(`loading the search model… ${Math.round(p.loaded / p.total * 100)}%`); };
    [tok, txt, proc, vis] = await Promise.all([
      T.AutoTokenizer.from_pretrained(MODEL),
      T.CLIPTextModelWithProjection.from_pretrained(MODEL, { progress_callback: progress }),
      T.AutoProcessor.from_pretrained(MODEL),
      T.CLIPVisionModelWithProjection.from_pretrained(MODEL, { progress_callback: progress }),
    ]);
    onStatus && onStatus('search ready');
  })();
  return loading;
}

const norm = v => { let s = 0; for (const x of v) s += x * x; s = Math.sqrt(s) || 1; return Float32Array.from(v, x => x / s); };

export async function embedImage(canvas) {
  const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', .9));
  const img = await T.RawImage.fromBlob(blob);
  const inputs = await proc(img);
  const { image_embeds } = await vis(inputs);
  return norm(image_embeds.data);
}

export async function embedText(text) {
  const inputs = tok([text], { padding: true, truncation: true });
  const { text_embeds } = await txt(inputs);
  return norm(text_embeds.data);
}

export const cos = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };
