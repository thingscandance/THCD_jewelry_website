// STROBE sound: rendered offline from the cut marks. Soft and dark, never toy-like:
// a low drone with tape wow, breathing air, faint hiss and crackle, felt taps on cuts, a deep hit with a dark glass
// resonance where the logo meets the product, tape-stops into flashes, shutters on splits and sheets, a snake hiss
// where asked, and a run-out on the packshot.
const SR = 48000, FPS = 24;

export async function renderSound(frames, cuts, opt = {}) {
  const dur = frames.length / FPS + 0.4;
  const ctx = new OfflineAudioContext(2, Math.ceil(dur * SR), SR);
  const at = f => f / FPS;
  const endF = (cuts.find(c => c.end) || { frame: frames.length }).frame;
  const flashes = cuts.filter(c => c.flash).map(c => c.frame);
  const rand = mulberry(opt.seed || 11);

  const noise = ctx.createBuffer(2, SR * 2, SR);
  for (let ch = 0; ch < 2; ch++) { const d = noise.getChannelData(ch); for (let i = 0; i < d.length; i++) d[i] = rand() * 2 - 1; }
  const master = new GainNode(ctx, { gain: 1 }); master.connect(ctx.destination);

  const noiseSrc = (t0, t1) => { const s = new AudioBufferSourceNode(ctx, { buffer: noise, loop: true }); s.start(t0, rand() * 1.5); s.stop(t1); return s; };
  const band = (lo, hi) => new BiquadFilterNode(ctx, { type: 'bandpass', frequency: Math.sqrt(lo * hi), Q: Math.sqrt(lo * hi) / (hi - lo) });
  const env = (t, peak, att, decay, len) => { const g = new GainNode(ctx, { gain: 0 }); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + att); g.gain.setTargetAtTime(0, t + att, decay); return g; };

  // --- drone with wow
  const root = opt.root || 41.2;
  const droneBus = new GainNode(ctx, { gain: 0 });
  const lp = new BiquadFilterNode(ctx, { type: 'lowpass', frequency: 800, Q: .4 });
  droneBus.connect(lp).connect(master);
  const wow = new OscillatorNode(ctx, { frequency: .33 }); wow.start(0); wow.stop(dur);
  const oscs = [[1, .5], [1.5, .22], [2.003, .14], [1.007, .3]].map(([m, a]) => {
    const o = new OscillatorNode(ctx, { type: 'sine', frequency: root * m });
    const wg = new GainNode(ctx, { gain: root * m * .004 }); wow.connect(wg).connect(o.frequency);
    const g = new GainNode(ctx, { gain: a }); o.connect(g).connect(droneBus); o.start(0); o.stop(dur); return [o, m];
  });
  droneBus.gain.setValueAtTime(0, 0); droneBus.gain.linearRampToValueAtTime(.22, 1.0);
  for (const ff of [...flashes, endF]) {                    // tape-stop: pitch dives over 0.3 s before the flash
    const t = at(ff);
    for (const [o, m] of oscs) { o.frequency.setValueAtTime(root * m, Math.max(0, t - .3)); o.frequency.exponentialRampToValueAtTime(root * m * .2, t); o.frequency.setValueAtTime(root * m, t + .1); }
    if (ff !== endF) { droneBus.gain.setValueAtTime(.22, t - .02); droneBus.gain.linearRampToValueAtTime(.03, t); droneBus.gain.linearRampToValueAtTime(.22, t + .12); }
  }
  droneBus.gain.setValueAtTime(.22, at(endF)); droneBus.gain.linearRampToValueAtTime(0, at(endF) + 1.1);

  // --- breathing air, faint hiss and crackle across the whole piece
  const air = noiseSrc(0, dur), airLp = new BiquadFilterNode(ctx, { type: 'lowpass', frequency: 520 }), airG = new GainNode(ctx, { gain: .08 });
  const airL = new OscillatorNode(ctx, { frequency: .11 }), airD = new GainNode(ctx, { gain: .03 }); airL.connect(airD).connect(airG.gain); airL.start(0); airL.stop(dur);
  air.connect(airLp).connect(airG).connect(master);
  airG.gain.setValueAtTime(.08, Math.max(0, dur - .7)); airG.gain.linearRampToValueAtTime(0, dur);
  const hs = noiseSrc(0, dur), hg = new GainNode(ctx, { gain: .004 }); hs.connect(band(1200, 6000)).connect(hg).connect(master);
  const cr = ctx.createBuffer(2, Math.ceil(dur * SR), SR);
  for (let ch = 0; ch < 2; ch++) { const d = cr.getChannelData(ch); for (let i = 0; i < d.length; i++) if (rand() < 16 / SR) d[i] = (rand() * 2 - 1) * (.2 + rand() * .8); }
  const crs = new AudioBufferSourceNode(ctx, { buffer: cr }); crs.connect(band(600, 4500)).connect(new GainNode(ctx, { gain: .06 })).connect(master); crs.start(0);

  // --- per-cut events
  const thump = (t, f0, f1, len, peak) => { const o = new OscillatorNode(ctx, { frequency: f0 }); o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + len); const g = env(t, peak, .004, len / 4, len); o.connect(g).connect(master); o.start(t); o.stop(t + len); };
  const burst = (t, lo, hi, peak, att, decay, len, pan = 0) => { const s = noiseSrc(t, t + len); const p = new StereoPannerNode(ctx, { pan }); s.connect(band(lo, hi)).connect(env(t, peak, att, decay, len)).connect(p).connect(master); };
  cuts.forEach((c, i) => {
    const t = at(c.frame);
    if (c.frame >= endF || i === 0) return;
    const pan = i % 2 ? .35 : -.35;
    burst(t, 900, 3800, .13, .002, .004, .06, pan); thump(t, 120, 60, .08, .18);             // felt tap
    if (c.lock || c.end) {                                                                  // deep hit + dark glass
      thump(t, 46, 32, .6, .5);
      [[986, .1, .11], [1613, .07, .08], [2871, .04, .06], [4290, .02, .045]].forEach(([fq, a, d]) => {
        const o = new OscillatorNode(ctx, { frequency: fq }); const g = env(t, a, .003, d, 1.2); o.connect(g).connect(master); o.start(t); o.stop(t + 1.2);
      });
    }
    if (c.shutter) for (let j = 0; j < c.shutter; j++) { const q = t + j * (c.every || 3) / FPS; burst(q, 700, 3500, .16, .001, .008, .05, pan * -1); burst(q + .03, 700, 3500, .1, .001, .006, .04, pan); }
    if (c.hiss) burst(t, 3200, 10500, .5, .03, .35, 1.2);
    if (c.flash) { burst(t, 200, 2500, .28, .002, .07, .25); }
  });
  const buf = await ctx.startRendering();
  // normalise and soften the peaks
  let pk = 1e-6; for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < d.length; i++) pk = Math.max(pk, Math.abs(d[i])); }
  const k = .9 / pk, th = Math.tanh(1.15);
  for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < d.length; i++) d[i] = Math.tanh(d[i] * k * 1.15) / th * .9; }
  return buf;
}

function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

export function wavBlob(buf) {
  const n = buf.length, ch = 2, out = new DataView(new ArrayBuffer(44 + n * ch * 2));
  const w = (o, s) => [...s].forEach((c, i) => out.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF'); out.setUint32(4, 36 + n * ch * 2, true); w(8, 'WAVE'); w(12, 'fmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true);
  out.setUint16(22, ch, true); out.setUint32(24, SR, true); out.setUint32(28, SR * ch * 2, true); out.setUint16(32, ch * 2, true); out.setUint16(34, 16, true);
  w(36, 'data'); out.setUint32(40, n * ch * 2, true);
  const L = buf.getChannelData(0), R = buf.getChannelData(1);
  for (let i = 0; i < n; i++) { out.setInt16(44 + i * 4, Math.max(-1, Math.min(1, L[i])) * 32767, true); out.setInt16(46 + i * 4, Math.max(-1, Math.min(1, R[i])) * 32767, true); }
  return new Blob([out], { type: 'audio/wav' });
}
