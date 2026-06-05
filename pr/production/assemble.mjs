// T-034-01 — rough-cut assembler for the evolution-showcase video.
//
// Resolves every storyboard frame F01–F15 to a 1080×1080 image (committed frames + 5-up concept
// montages + synthesized text cards + the Golden-Gate end-frame), burns caption / overlay chip /
// [concept] tag, holds each for its storyboard duration, and concats to pr/production/rough-cut.mp4.
//
//   node pr/production/assemble.mjs
//
// Reads ONLY the self-contained bundle in pr/assets/frames/ (never the gitignored benchmarks/ paths).
// Deterministic. Re-runnable. ~40s 1:1 1080×1080 H.264. Needs ffmpeg + magick on PATH.

import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const REPO = new URL("../../", import.meta.url).pathname;
const FRAMES_DIR = "pr/assets/frames";
const OUT = "pr/production/rough-cut.mp4";
const FONT = "/System/Library/Fonts/Supplemental/Arial Bold.ttf";
const W = 1080, H = 1080, FPS = 30;

const f = (name) => join(REPO, FRAMES_DIR, name);

// ── the frame plan (durations from storyboard.md; captions/overlays from script.md + sequence.md) ──
// overlay text is ASCII-sanitized so it burns without missing-glyph boxes; the rich glyph versions
// live in the docs. concept:true → amber [concept] tag (the honesty marker).
const FRAMES = [
  { id: "F01", dur: 3.0, caption: "Same model. Same game. The method changed.", overlay: "333 blocks  ->  STRONG 3/3",
    image: { kind: "file", path: "spine-r4-hero-oneplane-014.png" } },
  { id: "F02", dur: 2.5, caption: "+ a design doc to build from", overlay: "competent  ->   $1.08  .  1,372 blk",
    image: { kind: "file", path: "spine-r2-designdoc-003.png" } },
  { id: "F03", dur: 2.5, caption: "+ a reference photo", overlay: "->  up   .   20,311 blk",
    image: { kind: "file", path: "spine-r3-reference-008.png" } },
  { id: "F04", dur: 3.0, caption: "+ craft and color, split. One connected plane.", overlay: "prop.color.fidelity STRONG  .  detail competent  .  3/3",
    image: { kind: "file", path: "spine-r4-hero-oneplane-014.png" } },
  { id: "F05", dur: 1.5, caption: "We didn't trust our first metric. So we replaced it.", overlay: "mean~4 noise~0.4  X  ->  categorical judge",
    image: { kind: "file", path: "spine-r4-hero-oneplane-014.png" } },
  { id: "F06", dur: 3.0, caption: "26 builds in two days. The craft compounds.", overlay: "26 runs  .  2 days  .  ~$0.76-$2.13 each",
    image: { kind: "card", bg: "#101418", big: ["26 RUNS", "2 DAYS"] } },
  { id: "F07", dur: 1.5, caption: "Best-of-N cost 7x and gained nothing.", overlay: "$5.34 . ~29min -> 3.67    detail-stack 4.0 -> 3.33",
    image: { kind: "card", bg: "#1a1410", big: ["BEST-OF-N", "= one $0.76 shot"] } },
  { id: "F08", dur: 3.0, caption: "Text hit a ceiling. So we changed tools.", overlay: "text-JSON  ->  image -> 3D", concept: true,
    image: { kind: "file", path: "concept-taj-C-flash.png" } },
  { id: "F09", dur: 3.0, caption: "Then the floodgates opened.", overlay: "concept art, not the build", concept: true,
    image: { kind: "montage", tile: "3x2", paths: ["concept-taj-C-flash.png", "concept-horyuji-C-flash.png", "concept-chapelle-C-flash.png", "concept-arc-C-flash.png", "concept-mausoleum-C-flash.png"] } },
  { id: "F10", dur: 4.0, caption: "And it's real. Rotating in our own rig.", overlay: "REAL  .  prismarine-viewer + minecraft-assets  .  360",
    image: { kind: "file", path: "rotation-placeholder-002.png" } },
  { id: "F11", dur: 1.5, caption: "One dimension still won't climb: detail.", overlay: "detail: competent (held)",
    image: { kind: "file", path: "spine-r4-hero-oneplane-014.png" } },
  { id: "F12", dur: 3.0, caption: "Same method, four more landmarks. Still strong.", overlay: "4 landmarks  .  3/3", concept: true,
    image: { kind: "montage", tile: "2x2", paths: ["concept-horyuji-C-flash.png", "concept-chapelle-C-flash.png", "concept-arc-C-flash.png", "concept-mausoleum-C-flash.png"] } },
  { id: "F13", dur: 3.0, caption: "Where it's heading: the staged sculptor.", overlay: "where it's heading, not shipped", concept: true,
    image: { kind: "file", path: "concept-goldengate-vision.png" } },
  { id: "F14", dur: 2.5, caption: "We're the sculptor — not the 2-D-to-3-D tool.", overlay: "",
    image: { kind: "card", bg: "#0e0e0e", big: ["THE SCULPTOR"] } },
  { id: "F15", dur: 3.0, caption: "Following the method? The whole journal is open.", overlay: "follow + comment",
    image: { kind: "card", bg: "#0c1410", big: ["FOLLOW FOR", "THE METHOD"] } },
];

function sh(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { cwd: REPO, stdio: ["ignore", "pipe", "pipe"], encoding: "utf8", ...opts });
  if (r.status !== 0) throw new Error(`${cmd} failed (${r.status}): ${(r.stderr || "").slice(-300)}`);
  return r.stdout || "";
}

// build the 1080×1080 base image for a frame into `out`
function ensureBase(frame, tmp, out) {
  const im = frame.image;
  if (im.kind === "file") {
    if (!existsSync(f(im.path))) throw new Error(`missing frame asset: ${im.path}`);
    sh("magick", [f(im.path), "-filter", "point", "-resize", `${W}x${H}`, "-gravity", "center", "-background", "black", "-extent", `${W}x${H}`, out]);
  } else if (im.kind === "montage") {
    const mont = join(tmp, `${frame.id}-mont.png`);
    sh("magick", ["montage", "-font", FONT, "-label", "", ...im.paths.map(f), "-tile", im.tile, "-geometry", "344x344+8+8", "-background", "#101010", mont]);
    sh("magick", [mont, "-background", "#101010", "-gravity", "center", "-resize", `${W}x${H}`, "-extent", `${W}x${H}`, out]);
  } else if (im.kind === "card") {
    sh("magick", ["-size", `${W}x${H}`, `xc:${im.bg}`, out]);
    // big center text as an auto-fit caption layer
    const text = im.big.join("\n");
    const layer = join(tmp, `${frame.id}-big.png`);
    sh("magick", ["-background", "none", "-fill", "#f2f2f2", "-font", FONT, "-size", "820x420", "-gravity", "center", `caption:${text}`, layer]);
    sh("magick", [out, layer, "-gravity", "center", "-geometry", "+0-40", "-composite", out]);
  } else throw new Error(`unknown image kind ${im.kind}`);
}

// burn caption band + overlay chip + [concept] tag onto the base
function burn(base, frame, tmp, out) {
  // translucent caption band (auto-wrapped) at the bottom
  const band = join(tmp, `${frame.id}-cap.png`);
  sh("magick", ["-background", "rgba(0,0,0,0.58)", "-fill", "white", "-font", FONT, "-size", `${W}x150`, "-gravity", "center", `caption:${frame.caption}`, band]);
  const args = [base, band, "-gravity", "South", "-composite", "-font", FONT];
  if (frame.overlay) {
    args.push("-gravity", "NorthWest", "-pointsize", "26", "-stroke", "black", "-strokewidth", "3", "-fill", "white",
      "-annotate", "+28+30", frame.overlay, "-stroke", "none", "-fill", "white", "-annotate", "+28+30", frame.overlay);
  }
  if (frame.concept) {
    args.push("-gravity", "NorthEast", "-pointsize", "34", "-stroke", "black", "-strokewidth", "3", "-fill", "#f5a623",
      "-annotate", "+28+26", "[concept]", "-stroke", "none", "-fill", "#f5a623", "-annotate", "+28+26", "[concept]");
  }
  args.push(out);
  sh("magick", args);
}

// still image → a held silent clip
function clip(img, dur, out) {
  sh("ffmpeg", ["-y", "-loop", "1", "-i", img, "-t", String(dur), "-r", String(FPS), "-c:v", "libx264",
    "-tune", "stillimage", "-pix_fmt", "yuv420p", "-vf", `scale=${W}:${H}:flags=neighbor`, out]);
}

function main() {
  const tmp = mkdtempSync(join(tmpdir(), "rough-cut-"));
  try {
    const clips = [];
    let total = 0;
    for (const frame of FRAMES) {
      const base = join(tmp, `${frame.id}-base.png`);
      const burned = join(tmp, `${frame.id}-burn.png`);
      const cv = join(tmp, `${frame.id}.mp4`);
      ensureBase(frame, tmp, base);
      burn(base, frame, tmp, burned);
      clip(burned, frame.dur, cv);
      clips.push(cv);
      total += frame.dur;
      console.log(`${frame.id}  ${frame.dur.toFixed(1)}s  ${frame.image.kind.padEnd(7)}  ${frame.caption}`);
    }
    const list = join(tmp, "concat.txt");
    writeFileSync(list, clips.map((c) => `file '${c}'`).join("\n"));
    sh("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", join(REPO, OUT)]);
    const probe = sh("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", join(REPO, OUT)]).trim();
    console.log(`\n→ ${OUT}  (planned ${total.toFixed(1)}s, actual ${Number(probe).toFixed(2)}s, ${W}x${H}@${FPS})`);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

main();
