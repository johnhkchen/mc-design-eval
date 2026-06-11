// Idiom render-card runner (T-124-01, story S-124, epic E-31) — every registry construct idiom
// realized from its committed synthetic spec, on one sheet. The fixture-card (T-097) ladder,
// minus per-cell read-back (the state vocabulary is already pinned by CARD_ROWS):
//   1. GATE    — the card passes the live AJV validator (assertArtifact).
//   2. MAPPING — buildWorldFromVoxels places every voxel; `unmapped` MUST be empty (the AC:
//                every milestone idiom realizes canonically, `unmapped` empty through the render).
//   3. RENDER  — best-effort GL at the four gate azimuths + front, committed with sha256 as the
//                pattern book's visual regression sheet (`reproducibility-excludes-gl-from-
//                decisions`: render absence is recorded, never fatal; the mapping verdict gates).
//
// THE SEAM INVARIANT: impure wiring only — specs, layout, and artifact assembly live in the PURE
// module (src/pack/idiom-card.mjs) under the unit glob.
//
// Usage: npm run idioms:card   (exit 0 ⇔ gate + mapping pass)

import { writeFile, mkdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { assertArtifact } from "../../src/artifact.mjs";
import { expandArtifact } from "../../src/expand.mjs";
import { MULTI_ANGLE_GATE } from "../../src/config.mjs";
import { IDIOM_CARD_SCHEMA, IDIOM_CARD_SPECS, idiomCard, idiomCardLayout, cardCoverage } from "../../src/pack/idiom-card.mjs";
import { renderViews } from "../../src/view/multi-angle.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(here, "idiom-card");
const ROOT = join(here, "..", "..");

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  // ---- coverage pin --------------------------------------------------------------------------------
  const { missing } = cardCoverage();
  if (missing.length) {
    console.error(`coverage: constructs missing from the card: ${missing.join(", ")}`);
    process.exit(1);
  }

  // ---- 1. GATE -------------------------------------------------------------------------------------
  const card = assertArtifact(idiomCard());
  await writeFile(join(OUT_DIR, "card.json"), JSON.stringify(card, null, 2) + "\n");
  console.error(`gate: card passes the live AJV validator (${card.placements.length} placements)`);

  // ---- 2. MAPPING ----------------------------------------------------------------------------------
  const { buildWorldFromVoxels } = await import("../../render/src/world.mjs");
  const voxels = expandArtifact(card);
  const build = await buildWorldFromVoxels(voxels);
  console.error(`mapping: placed ${build.placed}/${voxels.length}, unmapped ${build.unmapped.length}`);
  for (const u of build.unmapped) console.error(`  UNMAPPED [${u.pos}] ${u.block}: ${u.reason}`);

  // ---- 3. RENDER (evidence) ------------------------------------------------------------------------
  const angles = [...MULTI_ANGLE_GATE.azimuths, "front"];
  const renders = [];
  let renderError = null;
  try {
    const views = await renderViews(card, angles, { outDir: OUT_DIR, label: (a) => `card-${a}`, width: 1024, height: 1024 });
    for (const v of views) {
      const buf = await readFile(v.path);
      renders.push({ angle: v.angle, path: relative(ROOT, v.path), bytes: v.bytes, sha256: sha256(buf) });
      console.error(`render ${v.angle}: ${v.path}`);
    }
  } catch (err) {
    renderError = err.message;
    console.error(`render: unavailable (${renderError})`);
  }

  // ---- receipt + markdown --------------------------------------------------------------------------
  const { plots } = idiomCardLayout();
  const ok = build.unmapped.length === 0;
  const record = {
    schema: IDIOM_CARD_SCHEMA,
    ticket: "T-124-01",
    verdict: { ok, gate: "pass", unmapped: build.unmapped.length, plots: plots.length },
    plots,
    unmapped: build.unmapped,
    evidence: { renders, renderError }, // GL-dependent: evidence, never part of the verdict
  };
  await writeFile(join(OUT_DIR, "record.json"), JSON.stringify(record, null, 2) + "\n");

  const md = [
    "# Idiom render card (T-124-01)",
    "",
    `Verdict: **${ok ? "PASS" : "FAIL"}** — gate pass, unmapped ${build.unmapped.length}, ` +
      `${plots.length} construct realizations (${IDIOM_CARD_SPECS.length} specs).`,
    "",
    "| plot | idiom | origin | size |",
    "|---|---|---|---|",
    ...plots.map((p) => `| ${p.id} | ${p.idiom} | ${p.origin.join(",")} | ${p.size.join("×")} |`),
    "",
    renders.length
      ? ["Renders (the pattern book's regression sheet):", ...renders.map((r) => `- \`${r.path}\` (${r.angle}) sha256 ${r.sha256.slice(0, 16)}…`)].join("\n")
      : `Renders unavailable: ${renderError}`,
    "",
    "Pass idioms (timber-frame, opening-dressing, hollow, floorplan) are name-registered build",
    "transforms — exercised by their own suites, not carded (they need full build context).",
    "",
  ].join("\n");
  await writeFile(join(OUT_DIR, "idiom-card.md"), md);

  console.error(`record: ${join(OUT_DIR, "record.json")}`);
  if (!ok) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
