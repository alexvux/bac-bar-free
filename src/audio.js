// Every sound is synthesised with the Web Audio API: no audio files.
let ac = null, master = null, amb = null, noiseBuf = null;

function ctx() {
  if (!ac) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ac = new AC();
    master = ac.createGain();
    master.gain.value = audio.muted ? 0 : 0.6;
    master.connect(ac.destination);
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return ac;
}

function tone(freq, dur, { type = "sine", vol = 0.2, delay = 0, slide = 0, dest = null } = {}) {
  const a = ctx(); if (!a) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(dest || master);
  o.start(t); o.stop(t + dur + 0.05);
}

function noise(dur, { vol = 0.3, freq = 1000, q = 1, type = "lowpass", delay = 0, attack = 0.005 } = {}) {
  const a = ctx(); if (!a) return;
  const t = a.currentTime + delay;
  const s = a.createBufferSource(); s.buffer = noiseBuf;
  const f = a.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g).connect(master);
  s.start(t, Math.random()); s.stop(t + dur + 0.05);
}

// Looping layers for each shift's mood; replaced on every shift.
function startAmbience(kind) {
  const a = ctx(); if (!a) return;
  stopAmbience();
  const bus = a.createGain(); bus.gain.value = 0; bus.connect(master);
  bus.gain.linearRampToValueAtTime(1, a.currentTime + 2);
  const nodes = [];
  const pad = (freqs, vol, type = "triangle") => freqs.forEach((f, i) => {
    const o = a.createOscillator(), g = a.createGain(), lfo = a.createOscillator(), lg = a.createGain();
    o.type = type; o.frequency.value = f; g.gain.value = vol;
    lfo.frequency.value = 0.07 + i * 0.03; lg.gain.value = vol * 0.8;
    lfo.connect(lg).connect(g.gain);
    o.connect(g).connect(bus); o.start(); lfo.start();
    nodes.push(o, lfo);
  });
  const hiss = (freq, vol, type = "lowpass") => {
    const s = a.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const f = a.createBiquadFilter(); f.type = type; f.frequency.value = freq;
    const g = a.createGain(); g.gain.value = vol;
    s.connect(f).connect(g).connect(bus); s.start(); nodes.push(s);
    return g;
  };
  const moods = {
    school: () => { pad([196, 247, 294], 0.018); hiss(500, 0.015); },
    bank: () => { pad([110, 165], 0.02, "sine"); pad([880], 0.004, "sine"); hiss(3000, 0.006, "highpass"); },
    hospital: () => { pad([98, 147, 156], 0.02); hiss(250, 0.02); },
    tower: () => { pad([130.8, 196, 246.9, 329.6], 0.012, "sine"); hiss(800, 0.008); },
    storm: () => { pad([73.4, 110, 116.5], 0.025, "sawtooth"); hiss(1400, 0.16); hiss(300, 0.12); },
  };
  (moods[kind] || moods.school)();
  amb = { bus, nodes };
}

function stopAmbience() {
  if (!amb) return;
  const { bus, nodes } = amb;
  bus.gain.linearRampToValueAtTime(0, ac.currentTime + 0.8);
  setTimeout(() => nodes.forEach((n) => { try { n.stop(); } catch {} }), 1000);
  amb = null;
}

let pendingAmb = null;
export const audio = {
  muted: localStorage.getItem("bac-bao-ve-muted") === "1",
  unlock() {
    const a = ctx();
    if (a && a.state === "suspended") a.resume();
    if (pendingAmb && a) { startAmbience(pendingAmb); pendingAmb = null; }
  },
  setMuted(m) {
    audio.muted = m;
    localStorage.setItem("bac-bao-ve-muted", m ? "1" : "0");
    if (master) master.gain.value = m ? 0 : 0.6;
  },
  ambience(kind) {
    if (!ac || ac.state !== "running") { pendingAmb = kind; return; }
    startAmbience(kind);
  },
  blip(f = 660) { tone(f, 0.08, { type: "square", vol: 0.05 }); },
  step(run) { noise(0.07, { vol: run ? 0.12 : 0.07, freq: run ? 700 : 450 }); },
  paper() { noise(0.25, { vol: 0.08, freq: 3000, type: "bandpass", q: 0.7, attack: 0.05 }); },
  stamp() { noise(0.12, { vol: 0.4, freq: 300 }); tone(120, 0.12, { vol: 0.2, slide: -60 }); },
  deny() { tone(220, 0.15, { type: "square", vol: 0.06 }); tone(165, 0.25, { type: "square", vol: 0.06, delay: 0.15 }); },
  good() { [523, 659, 784].forEach((f, i) => tone(f, 0.25, { type: "triangle", vol: 0.1, delay: i * 0.09 })); },
  bad() { [330, 262].forEach((f, i) => tone(f, 0.35, { type: "triangle", vol: 0.1, delay: i * 0.15 })); },
  whistle() { tone(2900, 0.5, { type: "sine", vol: 0.12 }); tone(3100, 0.5, { type: "sine", vol: 0.06, delay: 0.02 }); },
  catchHit() { noise(0.2, { vol: 0.4, freq: 500 }); tone(90, 0.3, { vol: 0.25, slide: -40 }); },
  thunder() { noise(2.5, { vol: 0.7, freq: 180, attack: 0.02 }); noise(0.4, { vol: 0.5, freq: 1200 }); },
  beep() { tone(1046, 0.12, { type: "sine", vol: 0.08 }); },
  door() { noise(0.4, { vol: 0.15, freq: 220, attack: 0.05 }); tone(70, 0.3, { vol: 0.1 }); },
  fire() { noise(1.5, { vol: 0.25, freq: 900, type: "bandpass", q: 0.5, attack: 0.2 }); },
  ending(id) {
    const seq = { truth: [392, 494, 587, 784], quiet: [392, 349, 330, 294], storm: [220, 208, 196, 147] }[id] || [440];
    seq.forEach((f, i) => tone(f, 0.9, { type: "triangle", vol: 0.12, delay: i * 0.45 }));
    stopAmbience();
  },
};
