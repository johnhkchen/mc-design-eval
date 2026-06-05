// T-034-01 — Golden-Gate "vision" end-frame (F13) generator.
//
// Reuses the EXISTING concept tooling end-to-end: it drives `baml-concept.mts` exactly the way
// `benchmarks/temple-facade/conceptart.mjs`'s runCell() does (JSON job on stdin → BAML-composed
// prompt text → Nano Banana image out). The only new inputs are the Golden-Gate design doc and an
// `attached` instruction that overrides the template's generic "temple" noun. No reference image is
// attached (base variant) — we have no prior GG render to refine.
//
//   node pr/production/endframe.mjs
//
// Output: benchmarks/temple-facade/concepts/goldengate-base-flash.png (gitignored, the tool's home),
// then normalized → pr/assets/frames/concept-goldengate-vision.png (1080×1080, committed).
// Exits non-zero on failure — we never fabricate the frame.

import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const REPO = new URL("../../", import.meta.url).pathname;
const BAML_CELL = "benchmarks/temple-facade/baml-concept.mts";
const RAW_OUT = "benchmarks/temple-facade/concepts/goldengate-base-flash.png";
const NORM_OUT = "pr/assets/frames/concept-goldengate-vision.png";

const GG_ATTACHED =
  "No photo is attached — design purely from the document above. IMPORTANT: the subject is the " +
  "GOLDEN GATE BRIDGE, a bridge — NOT a temple. Realize the document's bridge massing (twin " +
  "Art-Deco towers, the main suspension cables as bold block catenaries, the roadway deck and the " +
  "central portal opening) and its International-Orange palette; ignore any generic 'temple' " +
  "phrasing in the instructions above. Keep the whole outer silhouette in bright International " +
  "Orange / warm stone so it segments cleanly against the solid black background.";

const JOB = {
  designDocPath: "pr/production/goldengate-designdoc.md",
  images: [], // base variant — no reference image
  targetBlocks: 48,
  model: "flash", // matches the committed concept-*-C-flash.png series
  outPath: RAW_OUT,
  attached: GG_ATTACHED,
};

function runCell(job) {
  return new Promise((resolve, reject) => {
    const c = spawn("npx", ["tsx", BAML_CELL], { cwd: REPO, stdio: ["pipe", "pipe", "inherit"] });
    let out = "";
    c.stdout.on("data", (d) => (out += d));
    c.on("error", reject);
    c.on("close", (code) => (code === 0 ? resolve(JSON.parse(out || "{}")) : reject(new Error(`cell exit ${code}`))));
    c.stdin.end(JSON.stringify(job));
  });
}

function magick(args) {
  const r = spawnSync("magick", args, { cwd: REPO, stdio: "inherit" });
  if (r.status !== 0) throw new Error(`magick failed: ${args.join(" ")}`);
}

function pixels(path) {
  const r = spawnSync("magick", ["identify", "-format", "%w %h", path], { cwd: REPO, encoding: "utf8" });
  const [w, h] = (r.stdout || "0 0").trim().split(/\s+/).map(Number);
  return { w, h };
}

async function main() {
  process.stdout.write(`goldengate [base/flash] … `);
  const res = await runCell(JOB);
  console.log(`ok ${res.ms}ms (${res.imageCount} img, ${res.promptChars} chars) → ${RAW_OUT}`);
  if (!existsSync(`${REPO}${RAW_OUT}`)) throw new Error(`expected ${RAW_OUT} on disk`);

  // Normalize → 1080×1080. Center-crop to square first if Nano Banana returned a non-square frame
  // (same handling the asset desk used for the 1376×768 mausoleum concept). Lanczos = continuous-tone.
  const { w, h } = pixels(RAW_OUT);
  if (w !== h) {
    const side = Math.min(w, h);
    magick([RAW_OUT, "-gravity", "center", "-crop", `${side}x${side}+0+0`, "+repage", "-filter", "Lanczos", "-resize", "1080x1080", NORM_OUT]);
  } else {
    magick([RAW_OUT, "-filter", "Lanczos", "-resize", "1080x1080", NORM_OUT]);
  }
  const out = pixels(NORM_OUT);
  console.log(`normalized → ${NORM_OUT} (${out.w}×${out.h})`);
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
