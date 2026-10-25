// A shadow lift for a Chunky photograph, done after the render: the ACES tonemap and a daylight scene's little bounce light
// leave the shade too dark to read. The curve p + A·p·(1−p)³ on each pixel's perceptual (sRGB) luminance raises the dark
// quarter most and white not at all; the pixel's colour is kept by scaling its linear RGB by the luminance ratio.
// A 1.6 is the owner's pick ("strong lift", 2026-10-25).
const lin = (v) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const srgb = (v) => 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
const T = new Float64Array(256).map((_, i) => lin(i));

/** lift an image's shadows in place: img {width, height, data RGBA} */
export function liftImage(img, A = 1.6) {
  const d = img.data;
  for (let o = 0; o < d.length; o += 4) {
    const r = T[d[o]], g = T[d[o + 1]], b = T[d[o + 2]], L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (L <= 0) continue;
    const p = srgb(L) / 255, k = lin(Math.min(1, p + A * p * (1 - p) ** 3) * 255) / L;
    d[o] = Math.min(255, Math.round(srgb(r * k))); d[o + 1] = Math.min(255, Math.round(srgb(g * k))); d[o + 2] = Math.min(255, Math.round(srgb(b * k)));
  }
  return img;
}
