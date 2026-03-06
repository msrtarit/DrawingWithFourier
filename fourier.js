// ═══════════════════════════════════════════
// Discrete Fourier Transform
// Original: Daniel Shiffman (CodingTrain)
// ═══════════════════════════════════════════

function dft(x) {
  const X = [];
  const N = x.length;

  for (let k = 0; k < N; k++) {
    let re = 0;
    let im = 0;

    for (let n = 0; n < N; n++) {
      const phi = (TWO_PI * k * n) / N;
      re += x[n] * cos(phi);
      im -= x[n] * sin(phi);
    }

    re /= N;
    im /= N;

    X[k] = {
      re,
      im,
      freq: k,
      amp: sqrt(re * re + im * im),
      phase: atan2(im, re)
    };
  }

  return X;
}
