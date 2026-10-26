#!/usr/bin/env node
// A rotating dolly shot: chunky-shot renders each frame from a camera circling a point, the world loaded once (frame 0's
// octree reused), then ffmpeg makes an MP4 sized to fit an upload limit (Discord's free tier: 10 MB).
//   node bin/chunky-orbit.mjs <place> <name> --center x,y,z --radius 500 --height 220 [--frames 240] [--fps 24]
//     [--degrees 360] [--start 0] (the arc, from that bearing: 0 = the camera north of the centre, 90 = east)
//     [--fade near,far] (the circular distance fade, src/fade.mjs: blocks from the world's middle) [--lift] (the tone balance, src/lift.mjs: shadows opened, highlights held)
//     [--size 1280x720] [--spp 100] [--target-mb 9.5] [--codec h264|hevc|av1] [--encode-only]
//   or a flight: --path "ex,ey,ez>lx,ly,lz; ..." (keyframes of eye > look point; a Catmull-Rom curve through them, paced by the
//     eye's distance travelled and eased in and out, so the flight starts and lands gently), no --center needed
//     and any chunky-shot option (--sun, --sun-sampling, --sun-color, --water-plane, --fov, --chunks ...), the same on every frame
// Frames go to out/<place>/shots/<name>/NNNN.png; a rerun renders only the frames that are missing (resumable overnight).
import { existsSync, mkdirSync, renameSync, readdirSync, unlinkSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { readFileSync, writeFileSync } from "node:fs";
import { PNG } from "pngjs";
import { loadHeights, fadeImage } from "../src/fade.mjs";
import { liftImage } from "../src/lift.mjs";

const HERE = dirname(dirname(fileURLToPath(import.meta.url)));
const argv = process.argv.slice(2), [place, name] = argv;
if (!place || !name) throw new Error("usage: chunky-orbit.mjs <place> <name> --center x,y,z --radius r --height y");
const OWN = new Set(["--path", "--center", "--radius", "--height", "--frames", "--fps", "--degrees", "--start", "--target-mb", "--codec", "--size", "--spp", "--chunks", "--fade"]);
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const [cx, cy, cz] = (opt("--center") ?? "0,0,0").split(",").map(Number), R = +opt("--radius", 500), eyeY = +opt("--height", cy + 150);
const N = +opt("--frames", 240), fps = +opt("--fps", 24), arc = +opt("--degrees", 360), start = +opt("--start", 0);
const size = opt("--size", "1280x720"), spp = opt("--spp", "100");
// every frame shares frame 0's world, so it is the whole world (each frame looks a different way) unless --chunks says
// otherwise: Mont-Saint-Michel's 4480 square loads in about 4 minutes in a 16 GB heap
const chunks = opt("--chunks", "-1000000,-1000000,1000000,1000000");
const pass = []; for (let i = 2; i < argv.length; i++) { if (OWN.has(argv[i])) { i++; continue; } if (argv[i] === "--encode-only" || argv[i] === "--lift") continue; pass.push(argv[i]); }

const out = `${HERE}/out/${place}`, shots = `${out}/shots`, frames = `${shots}/${name}`, sceneDir = `${out}/chunky`;
mkdirSync(frames, { recursive: true });
const pad = (i) => String(i).padStart(4, "0"), first = `${name}-${pad(0)}`;
// a closed loop (360) leaves out the last frame, which would repeat the first
const step = arc / (arc % 360 === 0 ? N : Math.max(1, N - 1));

// --path: eye and look at frame i, along the keyframes' curve
const keys = opt("--path")?.split(";").map((k) => k.split(">").map((v) => v.split(",").map(Number)));
const cr = (p0, p1, p2, p3, t) => p1.map((_, j) => 0.5 * (2 * p1[j] + (p2[j] - p0[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t * t + (3 * p1[j] - p0[j] - 3 * p2[j] + p3[j]) * t * t * t));
const onPath = (k, u) => { const n = keys.length - 1, s = Math.min(n - 1e-9, u * n), i = Math.floor(s), P = (j) => keys[Math.max(0, Math.min(n, j))][k];
  return cr(P(i - 1), P(i), P(i + 1), P(i + 2), s - i); };
// the curve's length by sample, so equal steps of time cover equal distance (else it rushes the long legs)
const arcU = (() => { if (!keys) return null; const M = 2000, L = [0]; for (let m = 1; m <= M; m++) { const a = onPath(0, (m - 1) / M), b = onPath(0, m / M); L.push(L[m - 1] + Math.hypot(...a.map((v, j) => v - b[j]))); }
  return (f) => { const t = L[M] * f; let m = 1; while (m < M && L[m] < t) m++; return (m - 1 + (t - L[m - 1]) / Math.max(1e-9, L[m] - L[m - 1])) / M; }; })();
const ease = (f) => f * f * (3 - 2 * f);
const lift = argv.includes("--lift");
const fade = opt("--fade")?.split(",").map(Number), heights = fade ? loadHeights(`${out}/heights.bin`) : null;
if (!argv.includes("--encode-only")) {
  const t0 = Date.now();
  for (let i = 0; i < N; i++) {
    if (existsSync(`${frames}/${pad(i)}.png`)) continue;
    const b = ((start + i * step) * Math.PI) / 180, u = keys && arcU(ease(i / Math.max(1, N - 1)));
    const eye = (keys ? onPath(0, u) : [cx + R * Math.sin(b), eyeY, cz - R * Math.cos(b)]).map((v) => v.toFixed(2)), look = keys ? onPath(1, u).map((v) => v.toFixed(2)).join(",") : `${cx},${cy},${cz}`;
    const scene = `${name}-${pad(i)}`, reuse = i > 0 && existsSync(`${sceneDir}/${first}.octree2`) ? ["--reuse-octree", first] : [];
    execFileSync("node", [`${HERE}/bin/chunky-shot.mjs`, place, scene, "--eye", eye.join(","), "--look", look,
      "--size", size, "--spp", spp, "--chunks", chunks, ...reuse, ...pass], { stdio: ["ignore", "ignore", "inherit"] });
    if (fade || lift) { const img = PNG.sync.read(readFileSync(`${shots}/${scene}.png`)), sc = JSON.parse(readFileSync(`${sceneDir}/${scene}.json`, "utf8"));
      if (fade) fadeImage(img, sc, heights, { near: fade[0], far: fade[1], seaY: sc.waterWorldEnabled ? sc.waterWorldHeight : 0 });
      if (lift) liftImage(img); writeFileSync(`${shots}/${scene}.png`, PNG.sync.write(img)); }
    renameSync(`${shots}/${scene}.png`, `${frames}/${pad(i)}.png`);
    // each frame's scene files (a dump is ~100 MB) go; frame 0's octree stays for the others
    for (const f of readdirSync(sceneDir)) if (f.startsWith(`${scene}.`) && !(i === 0 && f.endsWith(".octree2")) && !(i === 0 && f.endsWith(".json"))) unlinkSync(`${sceneDir}/${f}`);
    const done = i + 1, s = (Date.now() - t0) / 1000;
    process.stdout.write(`\r${name}: frame ${done}/${N} (${(s / 60).toFixed(1)} min, ~${((s / done) * (N - done) / 60).toFixed(0)} min left)   `);
  }
  process.stdout.write("\n");
}

// encode: two passes at the bitrate that lands the file just under the target size (audio: none)
const target = +opt("--target-mb", 9.5), secs = readdirSync(frames).filter((f) => /^\d{4}\.png$/.test(f)).length / fps;
const kbps = Math.floor((target * 8 * 1024 * 1024 * 0.97) / secs / 1000);
const codec = { h264: ["libx264", "-preset", "slow", "-profile:v", "high"], hevc: ["libx265", "-preset", "slow", "-tag:v", "hvc1"], av1: ["libsvtav1", "-preset", "6"] }[opt("--codec", "h264")];
const mp4 = `${shots}/${name}.mp4`, log = `${frames}/ffmpeg2pass`;
const base = ["-y", "-hide_banner", "-loglevel", "error", "-framerate", String(fps), "-i", `${frames}/%04d.png`, "-c:v", ...codec, "-b:v", `${kbps}k`, "-pix_fmt", "yuv420p", "-an"];
if (opt("--codec", "h264") === "av1") execFileSync("ffmpeg", [...base, "-movflags", "+faststart", mp4], { stdio: "inherit" });
else {
  execFileSync("ffmpeg", [...base, "-pass", "1", "-passlogfile", log, "-f", "mp4", "/dev/null"], { stdio: "inherit" });
  execFileSync("ffmpeg", [...base, "-pass", "2", "-passlogfile", log, "-movflags", "+faststart", mp4], { stdio: "inherit" });
}
for (const f of readdirSync(frames)) if (f.startsWith("ffmpeg2pass")) unlinkSync(`${frames}/${f}`);
console.log(`${place}: ${name}.mp4 (${secs.toFixed(1)} s at ${fps} fps, ${kbps} kb/s, ${(statSync(mp4).size / 1048576).toFixed(2)} MB)`);
