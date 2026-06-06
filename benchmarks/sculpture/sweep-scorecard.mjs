// E-17 scorecard + march-of-progress runner — the human-facing consolidation (T-057-01, story S-057,
// epic E-17). The I/O edge over the pure cores (src/form/scorecard.mjs, src/form/montage.mjs).
//
// Reads the T-056-01 data spine (sweep-ablation.json) and emits, into the TRACKED pr/assets/ bundle:
//   • pr/assets/sweep.md                  — the scorecard (Levels + Marginal Δ + AVG/Δ attribution)
//                                           with the E-12 "bringing it all together" handoff appended.
//   • pr/assets/frames/march-<subj>.png   — per subject, the R0→R1→R2→R3 renders side by side.
//
// The four rung renders are GITIGNORED (root .gitignore), so the composites MUST be committed here —
// that is why pr/assets/frames is a self-contained, tracked bundle (frames/README.md). A missing source
// render is logged + skipped (the scorecard still writes); the march PNGs already on disk are durable.
//
//   node benchmarks/sculpture/sweep-scorecard.mjs            # scorecard + 7 march frames
//   node benchmarks/sculpture/sweep-scorecard.mjs --no-frames # scorecard md only (no PNG stitch)

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { PNG } from "pngjs";

import { assembleScorecard } from "../../src/form/scorecard.mjs";
import { montageRow } from "../../src/form/montage.mjs";
import { RENDER_BG } from "../../src/form/form-fidelity.mjs";
import { SUBJECTS } from "./glb-voxel-breadth.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..");
const SPINE = join(HERE, "sweep-ablation.json");
const ASSETS = join(REPO, "pr", "assets");
const FRAMES = join(ASSETS, "frames");

/** The four rung renders for a subject (R0→R3), in march order. All gitignored, regenerable. */
function rungRenders(key) {
  return [
    { id: "R0", path: join(HERE, "sweep-ablation", key, "r0-render-3q.png") },
    { id: "R1", path: join(HERE, "glb-voxel", key, "render-3q.png") },
    { id: "R2", path: join(HERE, "glb-voxel-clean", key, "render-3q.png") },
    { id: "R3", path: join(HERE, "glb-voxel-surgical-sweep", key, "after.png") },
  ];
}

/** Decode a PNG to the {width,height,data} shape montageRow expects. */
async function decodePng(path) {
  const png = PNG.sync.read(await readFile(path));
  return { width: png.width, height: png.height, data: png.data };
}

/** Stitch one subject's R0→R3 renders into pr/assets/frames/march-<key>.png. Returns true if written. */
async function stitchMarch(key) {
  const renders = rungRenders(key);
  const missing = renders.filter((r) => !existsSync(r.path));
  if (missing.length) {
    console.error(`  march ${key}: SKIP — missing ${missing.map((m) => m.id).join(",")} render(s); regen the rung build first`);
    return false;
  }
  const panels = await Promise.all(renders.map((r) => decodePng(r.path)));
  const row = montageRow(panels, { gap: 6, bg: [...RENDER_BG.dropColor, 255] });
  const out = new PNG({ width: row.width, height: row.height });
  row.data.copy(out.data);
  await writeFile(join(FRAMES, `march-${key}.png`), PNG.sync.write(out));
  console.error(`  march ${key}: ${row.width}×${row.height} (R0→R1→R2→R3)`);
  return true;
}

/** The E-12 handoff beat — appended to the scorecard so pr/assets/sweep.md is the whole story. */
function handoffSection(written) {
  const index = SUBJECTS.map((s) => `- \`frames/march-${s.key}.png\` — ${s.key} climbing R0→R1→R2→R3`).join("\n");
  return [
    "",
    "---",
    "",
    "## E-12 handoff — \"bringing it all together\"",
    "",
    "The showcase beat after the per-subject reveals: **7 subjects climbing one ladder**. Each",
    "`march-<subject>.png` is the four rung renders side by side, left→right `R0 text→JSON → R1 glb-voxel",
    "→ R2 +material-clean → R3 +surgical` — the *same* progression the scorecard quantifies, shown as one",
    "image. Pair the strip with its scorecard row and the eye reads what the numbers say: the big jump is",
    "R0→R1 (voxelization grounds the form), R1→R2 cleans the palette, R3 holds.",
    "",
    `Per-subject march frames (${written}/${SUBJECTS.length} stitched this run; all committed):`,
    "",
    index,
    "",
    "**Slots into the showcase** after the `pair-*` reveals (`sequence.md`) and before the rotations",
    "(`rotations/`): the scorecard is the title card, the march strips are the evidence wall, the AVG row",
    "is the takeaway. No new renders, no re-run judge — the honest arc, end to end.",
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
    console.error("stitching march-of-progress frames:");
    for (const s of SUBJECTS) {
      if (await stitchMarch(s.key)) written += 1;
    }
  }

  const { md } = assembleScorecard(spine);
  await writeFile(join(ASSETS, "sweep.md"), md + handoffSection(written));
  console.error(`wrote pr/assets/sweep.md (${spine.subjects.length} subjects) + ${written} march frame(s)`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("sweep-scorecard failed:\n  " + (err?.message || err));
    process.exit(1);
  });
}

export { rungRenders, stitchMarch };
