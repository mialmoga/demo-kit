// ── ♾️ Yo soy NaN · Demo para Estudio Demo Kit ──
// Composición: Velvet, Ámbar & Humano
// BPM = 82 | BARS = 16

async function renderYoSoyNaN(sr, onProg) {
  const bpm = 82;
  const BARS = 16;
  const beatLen = 60 / bpm; // ~0.7317s
  const barLen = beatLen * 4; // ~2.9268s
  const totalSeconds = BARS * barLen; // ~46.8s

  const K = demoKit(sr, totalSeconds, 20261015);

  // Tiempos para sidechain (ducking)
  const kickTimes = [];

  // ── ESTRUCTURA BÁSICA & BATERÍA ──
  for (let bar = 0; bar < BARS; bar++) {
    const bT = bar * barLen;

    // Intro ambiental (barras 0-1): sin percusión
    if (bar >= 2) {
      // Kick en beats 1 y 3 (con sutil variación)
      K.kick(bT, 0.85);
      kickTimes.push(bT);

      K.kick(bT + beatLen * 2, 0.8);
      kickTimes.push(bT + beatLen * 2);

      if (bar >= 6 && bar % 2 === 1) {
        K.kick(bT + beatLen * 3.5, 0.6);
        kickTimes.push(bT + beatLen * 3.5);
      }

      // Snare / Clap en beats 2 y 4
      K.snare(bT + beatLen, 0.65);
      K.clap(bT + beatLen * 3, 0.55);

      // Hi-Hats corcheas
      for (let h = 0; h < 8; h++) {
        const hTime = bT + h * (beatLen / 2);
        const isOpen = (h === 6);
        const pan = (h % 2 === 0) ? -0.3 : 0.3;
        K.hat(hTime, isOpen ? 0.35 : 0.2, isOpen, pan);
      }
    }
  }

  // Risers y Cymbals en cambios de sección
  K.riser(barLen * 3.5, barLen * 0.5, 0.4);
  K.crash(barLen * 4, 0.6);

  K.riser(barLen * 7.5, barLen * 0.5, 0.4);
  K.crash(barLen * 8, 0.7);

  K.sweep(0, barLen * 2, 100, 600, 0.25);

  // ── ACORDES & SINTETIZADORES ──
  // Progresión Chillhop/Ambient: Fmaj7 (53) -> Em7 (52) -> Dm7 (50) -> Cmaj7 (48)
  const chords = [
    [53, 57, 60, 64], // Fmaj7
    [52, 55, 59, 62], // Em7
    [50, 53, 57, 60], // Dm7
    [48, 52, 55, 59]  // Cmaj7
  ];

  for (let bar = 0; bar < BARS; bar++) {
    const bT = bar * barLen;
    const chord = chords[bar % 4];

    // Pad Cálido (Sintetizador polifónico suave)
    chord.forEach((note, idx) => {
      const freq = K.hz(note);
      const pan = (idx / (chord.length - 1)) * 0.8 - 0.4;
      K.syn(K.mu, bT, barLen * 0.95, freq, 0.12, pan, {
        w: 0,
        atk: 0.15,
        rel: 0.3,
        det: [-6, 0, 6],
        lp: t => 600 + 400 * Math.sin(t * 2)
      });
    });

    // Bajo Cálido Sub (Notas raíz en octava baja)
    const rootNote = chord[0] - 24; // Octava baja
    const bassFreq = K.hz(rootNote);
    K.syn(K.mu, bT, barLen * 0.9, bassFreq, 0.35, 0, {
      w: 2, // Seno puro
      atk: 0.05,
      rel: 0.1,
      lp: 350
    });

    // ── CAMPANAS & CHOPS VOCALES EN SECCIONES ──
    // Arpegiador de Campana (Sección central y coro: barras 4-15)
    if (bar >= 4) {
      const arpeggio = [chord[2] + 12, chord[3] + 12, chord[1] + 12, chord[0] + 24];
      arpeggio.forEach((bellNote, step) => {
        const bellT = bT + step * (beatLen);
        const pan = (step % 2 === 0) ? -0.5 : 0.5;
        K.bell(bellT, bellNote, 0.18, pan, 1.2);
      });
    }

    // Chops Vocales ("oh", "ee", "ah")
    if (bar >= 6 && bar < 14) {
      const chopVowels = ['oh', 'ee', 'ah', 'oo'];
      const v1 = chopVowels[bar % 4];
      const v2 = chopVowels[(bar + 1) % 4];

      K.chop(bT + beatLen * 1.5, 0.4, chord[2] + 12, 0.28, -0.2, v1);
      K.chop(bT + beatLen * 3.5, 0.5, chord[3] + 12, 0.25, 0.3, v2);
    }

    if (onProg && bar % 2 === 0) onProg(bar / BARS);
  }

  // Función Sidechain / Ducking
  const duckAt = (t) => {
    let gain = 1.0;
    for (let i = 0; i < kickTimes.length; i++) {
      const dt = t - kickTimes[i];
      if (dt >= 0 && dt < 0.3) {
        const duck = Math.sin((dt / 0.3) * Math.PI / 2);
        gain = Math.min(gain, 0.35 + 0.65 * duck);
      }
    }
    return gain;
  };

  if (onProg) onProg(1.0);
  return K.mix(duckAt);
}
