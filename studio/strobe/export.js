// STROBE export: frames are painted one by one (no real-time limit) and encoded to H.264 + AAC in an MP4 with
// WebCodecs; browsers without WebCodecs fall back to a real-time WebM recording.
import { Muxer, ArrayBufferTarget } from './mp4-muxer.mjs';
import { W, H, FPS } from './engine.js?v=20261027i';

async function pickVideoConfig(w, h) {
  const bitrate = w >= 1000 ? 20_000_000 : 5_000_000;   // grain and strobe need room; Instagram re-encodes anyway
  for (const codec of ['avc1.640028', 'avc1.4d0028', 'avc1.42E028', 'avc1.42E01F']) {
    const cfg = { codec, width: w, height: h, bitrate, bitrateMode: 'variable', latencyMode: 'quality', framerate: FPS, avc: { format: 'avc' } };
    try { if ((await VideoEncoder.isConfigSupported(cfg)).supported) return cfg; } catch (e) {}
  }
  return null;
}
async function pickAudioConfig() {
  const cfg = { codec: 'mp4a.40.2', sampleRate: 48000, numberOfChannels: 2, bitrate: 192000 };
  try { if (typeof AudioEncoder !== 'undefined' && (await AudioEncoder.isConfigSupported(cfg)).supported) return cfg; } catch (e) {}
  return null;
}

export function canMP4() { return typeof VideoEncoder !== 'undefined' && typeof VideoFrame !== 'undefined'; }

// paint(i) -> Promise<canvas 1080x1920>; returns { blob, type, audioMissing }
export async function encodeMP4(n, paint, audio, w, h, onProgress) {
  const vcfg = await pickVideoConfig(w, h);
  if (!vcfg) throw new Error('This browser cannot encode H.264.');
  const acfg = audio ? await pickAudioConfig() : null;
  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: 'avc', width: w, height: h },
    audio: acfg ? { codec: 'aac', numberOfChannels: 2, sampleRate: 48000 } : undefined,
    fastStart: 'in-memory',
  });
  let err = null;
  const ve = new VideoEncoder({ output: (c, m) => muxer.addVideoChunk(c, m), error: e => { err = e; } });
  ve.configure(vcfg);
  const out = document.createElement('canvas'); out.width = w; out.height = h;
  const g = out.getContext('2d'); g.imageSmoothingQuality = 'high';
  for (let i = 0; i < n; i++) {
    if (err) throw err;
    const src = await paint(i);
    g.drawImage(src, 0, 0, W, H, 0, 0, w, h);
    const vf = new VideoFrame(out, { timestamp: Math.round(i * 1e6 / FPS), duration: Math.round(1e6 / FPS) });
    ve.encode(vf, { keyFrame: i % (FPS * 2) === 0 }); vf.close();
    while (ve.encodeQueueSize > 6) await new Promise(r => setTimeout(r, 4));
    onProgress && onProgress((i + 1) / n);
  }
  await ve.flush();
  if (acfg) {
    const ae = new AudioEncoder({ output: (c, m) => muxer.addAudioChunk(c, m), error: e => { err = e; } });
    ae.configure(acfg);
    const L = audio.getChannelData(0), R = audio.getChannelData(1), total = Math.min(L.length, Math.round(n / FPS * 48000)), step = 4800;
    for (let s = 0; s < total; s += step) {
      const len = Math.min(step, total - s), data = new Float32Array(len * 2);
      data.set(L.subarray(s, s + len), 0); data.set(R.subarray(s, s + len), len);
      const ad = new AudioData({ format: 'f32-planar', sampleRate: 48000, numberOfFrames: len, numberOfChannels: 2, timestamp: Math.round(s / 48000 * 1e6), data });
      ae.encode(ad); ad.close();
    }
    await ae.flush();
  }
  if (err) throw err;
  muxer.finalize();
  return { blob: new Blob([muxer.target.buffer], { type: 'video/mp4' }), type: 'mp4', audioMissing: !!audio && !acfg };
}

// fallback: play the frames into a canvas in real time and record it together with the sound
export async function recordWebM(n, paint, audio, w, h, onProgress) {
  const out = document.createElement('canvas'); out.width = w; out.height = h; const g = out.getContext('2d');
  // pre-paint into small bitmaps so playback keeps time
  const frames = [];
  for (let i = 0; i < n; i++) { const src = await paint(i); g.drawImage(src, 0, 0, W, H, 0, 0, w, h); frames.push(await createImageBitmap(out)); onProgress && onProgress(.8 * (i + 1) / n); }
  const stream = out.captureStream(FPS);
  let ac = null;
  if (audio) { ac = new AudioContext({ sampleRate: 48000 }); const dst = ac.createMediaStreamDestination(); const s = ac.createBufferSource(); s.buffer = audio; s.connect(dst); dst.stream.getAudioTracks().forEach(t => stream.addTrack(t)); s.start(); }
  const mime = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find(m => MediaRecorder.isTypeSupported(m)) || '';
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 });
  const parts = []; rec.ondataavailable = e => parts.push(e.data);
  const done = new Promise(r => rec.onstop = r);
  rec.start();
  const t0 = performance.now();
  for (let i = 0; i < n; i++) {
    g.drawImage(frames[i], 0, 0);
    const wait = t0 + (i + 1) * 1000 / FPS - performance.now(); if (wait > 0) await new Promise(r => setTimeout(r, wait));
    onProgress && onProgress(.8 + .2 * (i + 1) / n);
  }
  rec.stop(); await done; if (ac) ac.close();
  frames.forEach(f => f.close());
  return { blob: new Blob(parts, { type: 'video/webm' }), type: 'webm', audioMissing: false };
}
