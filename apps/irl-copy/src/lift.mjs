// A tone balance for a Chunky photograph, done after the render: the ACES tonemap and a daylight scene's little bounce light
// leave the shade too dark to read, while sunlit stone sits near white. On each pixel's perceptual (sRGB) luminance p:
//   p + S·p·(1−p)⁶ − H·(1−p)·p⁴
// the first term opens the darks (its peak is at p ≈ 0.14 and it is nearly gone by mid-grey, so sunlit surfaces keep their
// brightness); the second pulls the brightest tones down a little so lit stone keeps its texture. The pixel's colour is
// kept by scaling its linear RGB by the luminance ratio.
const lin = (v) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const srgb = (v) => 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
const T = new Float64Array(256).map((_, i) => lin(i));

/** balance an image's tones in place: img {width, height, data RGBA}; shadows S, highlights H */
export function liftImage(img, { shadows = 1.0, highlights = 0.15 } = {}) {
  const d = img.data;
  for (let o = 0; o < d.length; o += 4) {
    const r = T[d[o]], g = T[d[o + 1]], b = T[d[o + 2]], L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (L <= 0) continue;
    const p = srgb(L) / 255, q = Math.min(1, Math.max(0, p + shadows * p * (1 - p) ** 6 - highlights * (1 - p) * p ** 4)), k = lin(q * 255) / L;
    d[o] = Math.min(255, Math.round(srgb(r * k))); d[o + 1] = Math.min(255, Math.round(srgb(g * k))); d[o + 2] = Math.min(255, Math.round(srgb(b * k)));
  }
  return img;
}
