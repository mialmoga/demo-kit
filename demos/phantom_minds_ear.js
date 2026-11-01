// ──👂PHANTOM · The Mind's Ear ──
// Demo Kit procedural experiment: auditory completion, metric displacement,
// and a Shepard-like endless ascent. No samples; everything is synthesized.
// BPM = 88 | BARS = 16

async function renderPhantom(sr, onProg) {
  const BPM = 88, BARS = 16;
  const K = demoKit.metric(sr, BPM, BARS, 4.0, 20261101);
  const { beat, bar, T } = K;

  const midiHz = m => K.hz(m);
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

  // A small five-note identity. The missing notes in later phrases are intentional:
  // the listener has already learned the contour and may mentally complete it.
  const motif = [69, 72, 76, 74, 71, 67, 69];
  const motifSteps = [0, 0.5, 1.5, 2, 3, 4.5, 6];

  // Phase I — Recognition: establish a memorable contour, then leave gaps.
  for (let b = 0; b < 4; b++) {
    for (let i = 0; i < motif.length; i++) {
      const t = T(b, motifSteps[i]);
      const missing = (b === 2 && (i === 2 || i === 5)) ||
                      (b === 3 && (i === 1 || i === 4));
      if (!missing) {
        K.bell(t, motif[i], b < 2 ? 0.17 : 0.13,
          i % 2 ? 0.28 : -0.28, 1.05);
      }
    }
    // A quiet tonal anchor gives the ear a stable reference.
    K.syn(K.mu, T(b, 0), bar * 0.92, midiHz(45), 0.105, 0,
      { w: 2, atk: 0.25, rel: 0.35, lp: 180 });
  }

  // Phase II — Displacement: 7-step and 8-step cycles drift against each other.
  // The cycles share a pitch vocabulary but never land in the same place for long.
  const cycleA = [69, 76, 72, 79, 74, 81, 76];
  const cycleB = [57, 64, 60, 67, 62, 69, 64, 71];
  for (let n = 0; n < 64; n++) {
    const t = T(4, n * 0.5);
    const a = cycleA[n % 7];
    const b = cycleB[n % 8];
    K.bell(t, a, 0.075, -0.42, 0.62);
    if (n % 2 === 0) K.bell(t + beat * 0.17, b, 0.052, 0.42, 0.48);
    // A soft pulse marks time without becoming a conventional beat.
    if (n % 4 === 0) K.snap(t, 0.075, n % 8 ? -0.6 : 0.6);
  }

  // Phase III — Vertigo: Shepard-like ascent.
  // Three octave-spaced sine tones rise chromatically; a Gaussian spectral
  // envelope fades the low layer out as the high layer fades in.
  // The pitch class loops, while the perceived register keeps climbing.
  for (let n = 0; n < 48; n++) {
    const t = T(8, n * (1 / 3));
    const semitone = n % 12;
    const center = (n / 48) * 2.35 + 0.45; // moves the spectral window upward
    for (let octave = -1; octave <= 2; octave++) {
      const register = octave + semitone / 12;
      const distance = register - center;
      const weight = Math.exp(-(distance * distance) / (2 * 0.72 * 0.72));
      const midi = 48 + semitone + octave * 12;
      if (weight > 0.018) {
        K.syn(K.mu, t, beat * 0.78, midiHz(midi),
          0.105 * weight, octave % 2 ? 0.32 : -0.32,
          { w: 2, atk: 0.025, rel: 0.11, lp: 5200 });
      }
    }
    // The original motif peeks through, increasingly displaced.
    if (n % 5 === 0) {
      const idx = Math.floor(n / 5) % motif.length;
      K.bell(t + beat * 0.08, motif[idx] + 12, 0.09, 0, 0.8);
    }
  }

  // Phase IV — Phantom: remove the apparent source, preserve its implications.
  // Sparse echoes outline the motif; a 7:8 cross-rhythm continues underneath.
  for (let n = 0; n < 56; n++) {
    const t = T(12, n * (1 / 3));
    const stepA = n % 7;
    const stepB = n % 8;
    if (n % 3 !== 1) {
      const note = motif[stepA];
      K.bell(t, note, 0.065 * (1 - n / 70), -0.38, 1.35);
    }
    if (n % 4 === 0) {
      K.bell(t + beat * 0.19, cycleB[stepB], 0.045, 0.42, 1.8);
    }
    // A faint subharmonic pulse gives the fading pattern a bodily reference.
    if (n % 7 === 0) {
      K.syn(K.mu, t, beat * 1.8, midiHz(33), 0.055, 0,
        { w: 2, atk: 0.12, rel: 0.5, lp: 95 });
    }
  }

  // Long, quiet tonal floor. No kick-driven sidechain: the pulse should feel
  // unstable rather than dance-oriented. A gentle final fade is handled by mix.
  for (let b = 4; b < 16; b += 2) {
    K.syn(K.mu, T(b, 0), bar * 1.9, midiHz(40), 0.045, 0,
      { w: 2, atk: 0.8, rel: 0.9, lp: 130 });
  }

  if (onProg) onProg(1);
  return K.mix(0, 0.13);
}
