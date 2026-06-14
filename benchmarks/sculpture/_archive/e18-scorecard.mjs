// E-18 consolidation scorecard + before/after composites runner — the human-facing terminal verdict
// (T-061-01, story S-061, epic E-18). The I/O edge over the pure cores (src/form/e18-scorecard.mjs,
// src/form/montage.mjs).
//
// Reads the T-060-01 data spine (e18-remeasure.json) and emits, into the TRACKED pr/assets/ bundle:
//   • pr/assets/surface-and-thin.md     — the scorecard (Levels + Marginal Δ + per-fix attribution +
//                                         routing + honesty notes) with the E-12 handoff + sword/routing
//                                         prose appended.
//   • pr/assets/e18-scorecard.json      — the structured e18-scorecard/v1 record (small; for E-12).
//   • pr/assets/frames/speckle-<subj>.png, thin-bow-and-arrow.png — before/after composites.
//
// The source renders are GITIGNORED (root .gitignore), so the composites MUST be committed here — that
// is why pr/assets/ is a self-contained, tracked bundle (frames/README.md). A missing source render is
// logged + skipped (the scorecard still writes).
//
//   node benchmarks/sculpture/e18-scorecard.mjs            # scorecard + json + 3 before/after composites
//   node benchmarks/sculpture/e18-scorecard.mjs --no-frames # scorecard md + json only (no PNG stitch)

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { PNG } from "pngjs";

import { assembleE18Scorecard } from "../../src/form/e18-scorecard.mjs";
import { montageRow } from "../../src/form/montage.mjs";
import { RENDER_BG } from "../../src/form/form-fidelity.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..");
const SPINE = join(HERE, "e18-remeasure.json");
const ASSETS = join(REPO, "pr", "assets");
const FRAMES = join(ASSETS, "frames");

/** The before/after pairs to stitch. Sources are all gitignored; the composites are committed. */
const PAIRS = [
  {
    out: "speckle-heart.png",
    before: join(HERE, "glb-voxel-clean", "heart", "render-3q.png"),
    after: join(HERE, "e18-build", "heart", "render-3q.png"),
    caption: "heart speckle — R2 material-clean (before) → E18 segmented (after)",
  },
  {
    out: "speckle-koi.png",
    before: join(HERE, "glb-voxel-clean", "koi", "render-3q.png"),
    after: join(HERE, "e18-build", "koi", "render-3q.png"),
    caption: "koi speckle — R2 material-clean (before) → E18 segmented (after)",
  },
  {
    out: "thin-bow-and-arrow.png",
    before: join(HERE, "glb-voxel-thin", "bow-and-arrow", "render-base-3q.png"),
    after: join(HERE, "glb-voxel-thin", "bow-and-arrow", "render-thin-3q.png"),
    caption: "bow-and-arrow form — base voxelization (4 components, before) → thin (1 component, after)",
  },
];

/** Decode a PNG to the {width,height,data} shape montageRow expects. */
async function decodePng(path) {
  const png = PNG.sync.read(await readFile(path));
  return { width: png.width, height: png.height, data: png.data };
}

/** Stitch one before/after pair into pr/assets/frames/<out>. Returns true if written. */
async function stitchPair(pair) {
  const missing = [pair.before, pair.after].filter((p) => !existsSync(p));
  if (missing.length) {
    console.error(`  ${pair.out}: SKIP — missing source render(s); regen the upstream build first`);
    return false;
  }
  const panels = await Promise.all([decodePng(pair.before), decodePng(pair.after)]);
  const row = montageRow(panels, { gap: 6, bg: [...RENDER_BG.dropColor, 255] });
  const out = new PNG({ width: row.width, height: row.height });
  row.data.copy(out.data);
  await writeFile(join(FRAMES, pair.out), PNG.sync.write(out));
  console.error(`  ${pair.out}: ${row.width}×${row.height} (before | after)`);
  return true;
}

/** The E-12 handoff + form-type-routing rule + sword boundary — the qualitative deliverable. */
function handoffSection(written, routing) {
  const helped = routing.thinHelped.map((e) => e.subject).join(", ") || "none";
  const hurt = routing.solidHurt.map((e) => e.subject).join(", ") || "none";
  const index = PAIRS.map((p) => `- \`frames/${p.out}\` — ${p.caption}`).join("\n");
  return [
    "",
    "---",
    "",
    '## E-12 handoff — "cleaner materials & the form-routing story"',
    "",
    "Two beats for the showcase. **(1) Surface coherence** — the `speckle-*.png` before/after pairs show",
    "the noisy R2 material-clean surface (independent per-voxel snap, smoothed) resolving into clean",
    "material regions under E18 segmentation; pair each with its scorecard row (speckle halved, all 7).",
    "**(2) Thin form** — `thin-bow-and-arrow.png` shows the bowstave/string/shaft severing into fragments",
    "at base voxelization (4 components) and coalescing into one connected form under thin preservation",
    "(form IoU 0.473 → 0.526).",
    "",
    `Before/after composites (${written}/${PAIRS.length} stitched this run; all committed):`,
    "",
    index,
    "",
    "### The form-type-routing rule (the boundary, stated)",
    "",
    `Form IoU is a **routed tradeoff**, not a uniform win. Thin preservation helped the organic/thin`,
    `subjects (${helped}) and hurt the already-solid ones (${hurt}) — the conservative surface trace adds a`,
    "~1-voxel shell to every subject, recovering severed members on thin forms and over-thickening solid",
    "ones. And one subject never makes it into the voxel pipeline at all: **sword has no GLB** — TRELLIS",
    "500s on the thin blade across 4 attempts (incl. after trimming to fill the frame; `glb/README.md`) —",
    "yet sword's **text→JSON** build was one of the better E-13 ones (the faithful cruciform). So the",
    "pipeline routes by form type:",
    "",
    "- **bulky / organic** (heart, koi, mushroom, moai, pineapple, dancing-man) → **image→3D → voxelize**",
    "  (with thin preservation where members are sub-voxel).",
    "- **thin / angular** (sword, and the thin extremes) → **text→JSON** — image→3D either drops the form",
    "  or fails outright.",
    "",
    "This is the deliverable, not a gap: the instrument now knows which path each subject belongs on.",
    "",
    "**Slots into the showcase** after the E-17 march strips (`sweep.md`): the speckle pairs are the",
    "surface-coherence beat, the thin pair is the geometry beat, and the routing rule is the closing card.",
    "No new renders, no re-run judge — a pure read of the committed E-18 spine.",
    "",
  ].join("\n");
}

async function main() {
  const argv = process.argv.slice(2);
  const noFrames = argv.includes("--no-frames");

  const spine = JSON.parse(await readFile(SPINE, "utf8"));
  await mkdir(FRAMES, { recursive: true });

  let written = 0;
  if (!noFrames) {
    console.error("stitching before/after composites:");
    for (const pair of PAIRS) {
      if (await stitchPair(pair)) written += 1;
    }
  }

  const { md, json } = assembleE18Scorecard(spine);
  await writeFile(join(ASSETS, "surface-and-thin.md"), md + handoffSection(written, json.routing));
  await writeFile(join(ASSETS, "e18-scorecard.json"), JSON.stringify(json, null, 2) + "\n");
  console.error(`wrote pr/assets/surface-and-thin.md + e18-scorecard.json (${spine.subjects.length} subjects) + ${written} composite(s)`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("e18-scorecard failed:\n  " + (err?.message || err));
    process.exit(1);
  });
}

export { stitchPair, handoffSection, PAIRS };
