// A circular distance fade for a Chunky photograph, done after the render: Chunky's fog is uniform (it greys the near
// ground as much as the far), so the square world's straight edges show. Each pixel's ray is marched over the world's
// height map (heights.bin, written beside the world); where it meets the ground, or the sea plane past the world's edge,
// the point's horizontal distance from a centre (the world's middle by default) sets how far the pixel blends towards the
// sky just over the horizon in its own column: none inside `near`, all of it past `far`. The world reads as a disc
// fading into haze, the same way round from any camera (an orbit's frames all match).
import { readFileSync } from "node:fs";

export function loadHeights(file) {
  const b = readFileSync(file), X = b.readUInt32LE(0), Z = b.readUInt32LE(4);
  return { X, Z, h: new Uint16Array(b.buffer.slice(b.byteOffset + 8, b.byteOffset + 8 + X * Z * 2)) };
}

/** the camera's ray through full-frame pixel (px, py), from a Chunky scene (pinhole; fov is the vertical angle) */
export function cameraOf(scene) {
  const { x, y, z } = scene.camera.position, { yaw, pitch } = scene.camera.orientation;
  const W = scene.fullWidth || scene.width, H = scene.fullHeight || scene.height, t = Math.tan((scene.camera.fov * Math.PI) / 360);
  const e = -(pitch + Math.PI / 2), f = [-Math.cos(yaw) * Math.cos(e), Math.sin(e), Math.sin(yaw) * Math.cos(e)];
  const rl = Math.hypot(f[2], f[0]), r = [-f[2] / rl, 0, f[0] / rl];               // forward x up, level
  const u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];
  return { eye: [x, y, z], W, H, ox: scene.fullWidth ? scene.cropX : 0, oy: scene.fullHeight ? scene.cropY : 0,
    ray(px, py) { const a = ((2 * (px + 0.5)) / W - 1) * t * (W / H), b = (1 - (2 * (py + 0.5)) / H) * t;
      const d = [f[0] + a * r[0] + b * u[0], f[1] + a * r[1] + b * u[1], f[2] + a * r[2] + b * u[2]], l = Math.hypot(...d); return d.map((v) => v / l); } };
}

/** where the ray from eye along d first meets the ground (or the sea plane at seaY past the edge): [x, z], or null (sky) */
function hit(eye, d, H, seaY, top) {
  const [ex, ey, ez] = eye, hz = Math.hypot(d[0], d[2]);
  if (d[1] >= 0 && ey >= top) return null;
  let t = d[1] < 0 && ey > top ? (top - ey) / d[1] : 0;                                // start where the ray comes down to the tallest block
  const step = 0.75 / Math.max(hz, 1e-6), tMax = d[1] < 0 ? (ey - seaY) / -d[1] : 1e9;
  for (; t <= tMax; t += step) {
    const x = ex + d[0] * t, z = ez + d[2] * t, y = ey + d[1] * t, ix = Math.floor(x), iz = Math.floor(z);
    if (ix < 0 || iz < 0 || ix >= H.X || iz >= H.Z) { if (d[1] >= 0) return null; continue; }   // past the edge: on to the sea plane
    if (H.h[iz * H.X + ix] >= y) return [x, z];
  }
  return d[1] < 0 ? [ex + d[0] * tMax, ez + d[2] * tMax] : null;
}

/** fade an image in place: img {width, height, data RGBA}; opts {near, far, seaY, center: [x, z], strength 0..1, scale (march every nth pixel)} */
export function fadeImage(img, scene, H, { near, far, seaY, center = [H.X / 2, H.Z / 2], strength = 1, scale = 4 } = {}) {
  const cam = cameraOf(scene), { width: w, height: h, data } = img, top = H.h.reduce((m, v) => (v > m ? v : m), 0) + 1;
  // the sky just over the horizon, per column: the mean of the pixels whose ray climbs 0.3 to 1.5 degrees (else the frame's)
  const sky = new Float64Array(w * 3), n = new Float64Array(w);
  for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) { const el = (Math.asin(cam.ray(px + cam.ox, py + cam.oy)[1]) * 180) / Math.PI;
    if (el < 0.3 || el > 1.5) continue; const o = (py * w + px) * 4; sky[px * 3] += data[o]; sky[px * 3 + 1] += data[o + 1]; sky[px * 3 + 2] += data[o + 2]; n[px]++; }
  const tot = [0, 0, 0]; let N = 0; for (let px = 0; px < w; px++) if (n[px]) { for (let k = 0; k < 3; k++) tot[k] += sky[px * 3 + k]; N += n[px]; }
  if (!N) throw new Error("no sky over the horizon in this frame to fade into");
  for (let px = 0; px < w; px++) for (let k = 0; k < 3; k++) sky[px * 3 + k] = n[px] ? sky[px * 3 + k] / n[px] : tot[k] / N;
  // the fade, marched on a coarse grid and interpolated (it is smooth by construction)
  const gw = Math.ceil(w / scale) + 1, gh = Math.ceil(h / scale) + 1, A = new Float32Array(gw * gh);
  const smooth = (v) => (v <= 0 ? 0 : v >= 1 ? 1 : v * v * (3 - 2 * v));
  for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) {
    const p = hit(cam.eye, cam.ray(Math.min(w - 1, gx * scale) + cam.ox, Math.min(h - 1, gy * scale) + cam.oy), H, seaY, top);
    A[gy * gw + gx] = p ? strength * smooth((Math.hypot(p[0] - center[0], p[1] - center[1]) - near) / (far - near)) : -1; }
  for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
    const fx = px / scale, fy = py / scale, x0 = Math.floor(fx), y0 = Math.floor(fy), ax = fx - x0, ay = fy - y0;
    const c = [A[y0 * gw + x0], A[y0 * gw + x0 + 1], A[(y0 + 1) * gw + x0], A[(y0 + 1) * gw + x0 + 1]];
    // a sky corner (-1) counts as fully faded so the horizon line blends instead of keeping a hard edge
    const [a00, a10, a01, a11] = c.map((v) => (v < 0 ? strength : v)); if (c.every((v) => v < 0)) continue;
    const a = (a00 * (1 - ax) + a10 * ax) * (1 - ay) + (a01 * (1 - ax) + a11 * ax) * ay, o = (py * w + px) * 4;
    for (let k = 0; k < 3; k++) data[o + k] = Math.round(data[o + k] * (1 - a) + sky[px * 3 + k] * a);
  }
  return img;
}
