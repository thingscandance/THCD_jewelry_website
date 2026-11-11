// POSTER export (shared with SCAN): frames are painted one by one, then encoded to H.264 + AAC with WebCodecs, or recorded as WebM where H.264 is missing.
import { Muxer, ArrayBufferTarget } from './mp4-muxer.mjs';
import { FPS } from './engine.js';
async function vcfgFor(w, h) { for (const codec of ['avc1.640028', 'avc1.4d0028', 'avc1.42E028']) { const cfg = { codec, width: w, height: h, bitrate: 20_000_000, bitrateMode: 'variable', latencyMode: 'quality', framerate: FPS, avc: { format: 'avc' } }; try { if ((await VideoEncoder.isConfigSupported(cfg)).supported) return cfg; } catch (e) {} } return null; }
async function acfgFor() { const cfg = { codec: 'mp4a.40.2', sampleRate: 48000, numberOfChannels: 2, bitrate: 192000 }; try { if (typeof AudioEncoder !== 'undefined' && (await AudioEncoder.isConfigSupported(cfg)).supported) return cfg; } catch (e) {} return null; }
export async function canMP4(w = 1080, h = 1920) { return typeof VideoEncoder !== 'undefined' && !!(await vcfgFor(w, h)); }
export async function encodeMP4(n, paint, audio, w, h, onProgress) {
  const vcfg = await vcfgFor(w, h), acfg = audio ? await acfgFor() : null;
  const muxer = new Muxer({ target: new ArrayBufferTarget(), video: { codec: 'avc', width: w, height: h }, audio: acfg ? { codec: 'aac', numberOfChannels: 2, sampleRate: 48000 } : undefined, fastStart: 'in-memory' });
  let err = null; const ve = new VideoEncoder({ output: (c, m) => muxer.addVideoChunk(c, m), error: e => { err = e; } }); ve.configure(vcfg);
  for (let i = 0; i < n; i++) { if (err) throw err; const cv = await paint(i), vf = new VideoFrame(cv, { timestamp: Math.round(i * 1e6 / FPS), duration: Math.round(1e6 / FPS) }); ve.encode(vf, { keyFrame: i % Math.round(FPS * 2) === 0 }); vf.close(); while (ve.encodeQueueSize > 6) await new Promise(r => setTimeout(r, 4)); onProgress && onProgress((i + 1) / n); }
  await ve.flush();
  if (acfg) { const ae = new AudioEncoder({ output: (c, m) => muxer.addAudioChunk(c, m), error: e => { err = e; } }); ae.configure(acfg); const L = audio.getChannelData(0), R = audio.getChannelData(audio.numberOfChannels > 1 ? 1 : 0), total = Math.min(L.length, Math.round(n / FPS * 48000));
    for (let s = 0; s < total; s += 4800) { const len = Math.min(4800, total - s), data = new Float32Array(len * 2); data.set(L.subarray(s, s + len), 0); data.set(R.subarray(s, s + len), len); const ad = new AudioData({ format: 'f32-planar', sampleRate: 48000, numberOfFrames: len, numberOfChannels: 2, timestamp: Math.round(s / 48000 * 1e6), data }); ae.encode(ad); ad.close(); } await ae.flush(); }
  if (err) throw err; muxer.finalize(); return { blob: new Blob([muxer.target.buffer], { type: 'video/mp4' }), type: 'mp4', audioMissing: !!audio && !acfg };
}
export async function recordWebM(n, paint, audio, w, h, onProgress) {
  const out = document.createElement('canvas'); out.width = w; out.height = h; const g = out.getContext('2d'), frames = [];
  for (let i = 0; i < n; i++) { const cv = await paint(i); frames.push(await createImageBitmap(cv)); onProgress && onProgress(.8 * (i + 1) / n); }
  const stream = out.captureStream(FPS); let ac = null; if (audio) { ac = new AudioContext({ sampleRate: 48000 }); const dst = ac.createMediaStreamDestination(), s = ac.createBufferSource(); s.buffer = audio; s.connect(dst); dst.stream.getAudioTracks().forEach(t => stream.addTrack(t)); s.start(); }
  const mime = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find(m => MediaRecorder.isTypeSupported(m)) || ''; const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 }), parts = []; rec.ondataavailable = e => parts.push(e.data); const done = new Promise(r => rec.onstop = r); rec.start(); const t0 = performance.now();
  for (let i = 0; i < n; i++) { g.drawImage(frames[i], 0, 0); const wait = t0 + (i + 1) * 1000 / FPS - performance.now(); if (wait > 0) await new Promise(r => setTimeout(r, wait)); onProgress && onProgress(.8 + .2 * (i + 1) / n); }
  rec.stop(); await done; if (ac) ac.close(); frames.forEach(f => f.close()); return { blob: new Blob(parts, { type: 'video/webm' }), type: 'webm' };
}
