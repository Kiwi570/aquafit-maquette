// Boucle musicale composée en direct par le navigateur (Web Audio), sans fichier ni droits.
// Elle démarre uniquement après un clic et peut être remplacée par un morceau libre de droits.
export function creerSon({ surTemps } = {}) {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  let ctx = null, maitre = null, echo = null, bruit = null;
  let enMarche = false, minuterie = 0, prochain = 0, pas = 0;
  const BPM = 122, DOUBLE = 60 / BPM / 4; // durée d'une double croche

  const ACCORDS = [
    { basse: 110.0, notes: [220.0, 261.63, 329.63, 440.0] },   // la mineur
    { basse: 87.31, notes: [174.61, 220.0, 261.63, 349.23] },  // fa
    { basse: 130.81, notes: [261.63, 329.63, 392.0, 523.25] }, // do
    { basse: 98.0, notes: [196.0, 246.94, 293.66, 392.0] },    // sol
  ];

  function preparer() {
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 3;
    maitre = ctx.createGain(); maitre.gain.value = 0;
    maitre.connect(comp).connect(ctx.destination);
    // Écho d'une croche pointée, filtré : un son « sous l'eau ».
    echo = ctx.createDelay(1); echo.delayTime.value = DOUBLE * 3;
    const retour = ctx.createGain(); retour.gain.value = 0.32;
    const filtreEcho = ctx.createBiquadFilter(); filtreEcho.type = "lowpass"; filtreEcho.frequency.value = 1800;
    echo.connect(filtreEcho).connect(retour).connect(echo);
    filtreEcho.connect(maitre);
    const len = ctx.sampleRate * 0.5;
    bruit = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = bruit.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }

  function grosseCaisse(t) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.18);
    g.gain.setValueAtTime(0.7, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
    o.connect(g).connect(maitre); o.start(t); o.stop(t + 0.4);
  }
  function charleston(t, fort) {
    const s = ctx.createBufferSource(); s.buffer = bruit;
    const f = ctx.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 7500;
    const g = ctx.createGain();
    g.gain.setValueAtTime(fort ? 0.12 : 0.045, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    s.connect(f).connect(g).connect(maitre); s.start(t); s.stop(t + 0.06);
  }
  function basse(t, freq) {
    const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = "sawtooth"; o.frequency.value = freq;
    f.type = "lowpass"; f.frequency.setValueAtTime(520, t); f.frequency.exponentialRampToValueAtTime(160, t + 0.22);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22, t + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
    o.connect(f).connect(g).connect(maitre); o.start(t); o.stop(t + 0.3);
  }
  function nappe(t, notes, duree) {
    notes.slice(0, 3).forEach((freq, i) => {
      [-6, 6].forEach((detune) => {
        const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
        o.type = "sawtooth"; o.frequency.value = freq; o.detune.value = detune;
        f.type = "lowpass"; f.frequency.value = 900;
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.018, t + 0.6); g.gain.linearRampToValueAtTime(0.0001, t + duree);
        o.connect(f).connect(g).connect(maitre); o.start(t); o.stop(t + duree + 0.05);
      });
    });
  }
  function goutte(t, freq) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "triangle"; o.frequency.setValueAtTime(freq * 2, t); o.frequency.exponentialRampToValueAtTime(freq * 2.02, t + 0.2);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.06, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0008, t + 0.32);
    o.connect(g); g.connect(maitre); g.connect(echo); o.start(t); o.stop(t + 0.34);
  }

  const ARPEGE = [0, 2, 1, 3, 2, 1, 3, 0];
  function jouerPas(t, n) {
    const mesure = Math.floor(n / 16) % ACCORDS.length;
    const p = n % 16;
    const acc = ACCORDS[mesure];
    if (p % 4 === 0) {
      grosseCaisse(t);
      if (surTemps) setTimeout(() => surTemps(p === 0 ? 1 : 0.6), Math.max(0, (t - ctx.currentTime) * 1000));
    }
    if (p % 4 === 2) charleston(t, true); else if (p % 2 === 1) charleston(t, false);
    if ([0, 3, 6, 10, 11, 14].includes(p)) basse(t, acc.basse * (p === 11 ? 2 : 1));
    if (p === 0) nappe(t, acc.notes, DOUBLE * 16);
    if (p % 2 === 0 && n % 64 >= 16) goutte(t, acc.notes[ARPEGE[(p / 2) % 8]]);
  }

  function planifier() {
    while (prochain < ctx.currentTime + 0.12) {
      jouerPas(prochain, pas);
      prochain += DOUBLE; pas++;
    }
  }

  return {
    get enMarche() { return enMarche; },
    async demarrer() {
      if (!ctx) preparer();
      if (ctx.state === "suspended") await ctx.resume();
      enMarche = true;
      prochain = ctx.currentTime + 0.08; pas = 0;
      maitre.gain.cancelScheduledValues(ctx.currentTime);
      maitre.gain.setValueAtTime(maitre.gain.value, ctx.currentTime);
      maitre.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 1.5);
      clearInterval(minuterie);
      minuterie = setInterval(planifier, 25);
    },
    arreter() {
      if (!ctx) return;
      enMarche = false;
      maitre.gain.cancelScheduledValues(ctx.currentTime);
      maitre.gain.setValueAtTime(maitre.gain.value, ctx.currentTime);
      maitre.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
      setTimeout(() => { if (!enMarche) clearInterval(minuterie); }, 650);
    },
  };
}
