// Fixture test-card runner (T-097-01, story S-097, epic E-26) — prove the fixture path end-to-end.
//
// The verification LADDER (deterministic steps 1–3 gate; step 4 is evidence):
//   1. GATE      — the card passes the live AJV validator (assertArtifact).
//   2. MAPPING   — buildWorldFromVoxels places every voxel; `unmapped` MUST be empty (every illegal
//                  block/state throws into `unmapped` — render/src/world.mjs).
//   3. READ-BACK — for every card row, the world's stored state id decodes (decodeStateId — the
//                  inverse radix walk in render/src/version.mjs) back to the row's block AND every
//                  specified property. Right block, right facing, proven from the world alone.
//   4. RENDER    — best-effort GL renders at the four config gate azimuths + front, committed with
//                  sha256 as the visual regression reference (`reproducibility-excludes-gl-from-
//                  decisions`: render absence is recorded, never fatal; mis-rendering is a named
//                  residual for S-099, not a gate).
//
// THE SEAM INVARIANT: this file is impure wiring only (file I/O, world build, GL). The card rows,
// layout, and artifact assembly live in the PURE module (src/form/fixture-card.mjs); the unit suite
// already pins the gate acceptance and the encode→decode round-trip offline.
//
// Usage: npm run card:fixtures   (exit 0 ⇔ ladder steps 1–3 all pass)

import { writeFile, mkdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

import { assertArtifact } from "../../src/artifact.mjs";
import { expandArtifact } from "../../src/expand.mjs";
import { MULTI_ANGLE_GATE } from "../../src/config.mjs";
import { CARD_SCHEMA, CARD_ROWS, cardLayout, fixtureCard } from "../../src/form/fixture-card.mjs";
import { renderViews } from "../../src/view/multi-angle.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(here, "fixture-card");
const ROOT = join(here, "..", "..");
// vec3 lives in render/'s node_modules (the render package owns the prismarine stack).
const renderRequire = createRequire(join(ROOT, "render", "src", "world.mjs"));
const { Vec3 } = renderRequire("vec3");

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

/** Named residuals (Rule 7): defects of the LENS, not the placement path — placement is proven by
 *  read-back; these stay listed until the viewer is fixed and the reference re-cut.
 *  RETIRED (T-107-01) "stairs-invisible": root cause was getModelVariants' SUBSTRING air-check —
 *  `block.name.includes('air')` matches every *_stairs name ("st-AIR-s") — fixed on disk by
 *  render/scripts/patch-viewer-lens.mjs (postinstall; lens-guard THROWS unpatched). The stair
 *  rows in this card render now; the re-cut card below is the proof. */
const NAMED_RESIDUALS = [];

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  // ---- 1. GATE -------------------------------------------------------------------------------------
  const card = assertArtifact(fixtureCard());
  const cardJson = JSON.stringify(card, null, 2) + "\n";
  await writeFile(join(OUT_DIR, "card.json"), cardJson);
  console.error(`gate: card passes the live AJV validator (${card.placements.length} placements)`);

  // ---- 2. MAPPING ----------------------------------------------------------------------------------
  const { buildWorldFromVoxels } = await import("../../render/src/world.mjs");
  const { decodeStateId } = await import("../../render/src/version.mjs");
  const voxels = expandArtifact(card);
  const build = await buildWorldFromVoxels(voxels);
  console.error(`mapping: placed ${build.placed}/${voxels.length}, unmapped ${build.unmapped.length}`);
  for (const u of build.unmapped) console.error(`  UNMAPPED [${u.pos}] ${u.block}: ${u.reason}`);

  // ---- 3. READ-BACK --------------------------------------------------------------------------------
  const { cells } = cardLayout(CARD_ROWS);
  const rows = [];
  for (const cell of cells) {
    const stored = await build.world.getBlockStateId(new Vec3(cell.pos[0], cell.pos[1], cell.pos[2]));
    let verdict;
    try {
      const dec = decodeStateId(stored);
      const bare = cell.block.replace(/^minecraft:/, "");
      const wrong = [];
      if (dec.name !== bare) wrong.push(`block ${dec.name} ≠ ${bare}`);
      for (const [k, v] of Object.entries(cell.state ?? {})) {
        if (dec.properties[k] !== v) wrong.push(`${k} ${dec.properties[k]} ≠ ${v}`);
      }
      verdict = { pass: wrong.length === 0, stored, decoded: dec, wrong };
    } catch (err) {
      verdict = { pass: false, stored, wrong: [err.message] };
    }
    rows.push({ id: cell.id, family: cell.family, block: cell.block, state: cell.state, pos: cell.pos, ...verdict });
  }
  const failures = rows.filter((r) => !r.pass);
  console.error(`read-back: ${rows.length - failures.length}/${rows.length} rows verified`);
  for (const f of failures) console.error(`  FAIL ${f.id}: ${f.wrong.join("; ")}`);

  // ---- 4. RENDER (evidence) ------------------------------------------------------------------------
  const angles = [...MULTI_ANGLE_GATE.azimuths, "front"];
  let renders = [];
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

  // ---- record + markdown ---------------------------------------------------------------------------
  const ok = build.unmapped.length === 0 && failures.length === 0;
  const record = {
    schema: CARD_SCHEMA,
    ticket: "T-097-01",
    verdict: { ok, gate: "pass", unmapped: build.unmapped.length, rowsVerified: rows.length - failures.length, rows: rows.length },
    rows,
    unmapped: build.unmapped,
    evidence: { renders, renderError }, // GL-dependent: evidence, never part of the verdict
    namedResiduals: NAMED_RESIDUALS,
  };
  await writeFile(join(OUT_DIR, "record.json"), JSON.stringify(record, null, 2) + "\n");

  const md = [
    "# Fixture test-card (T-097-01)",
    "",
    `Verdict: **${ok ? "PASS" : "FAIL"}** — gate pass, unmapped ${build.unmapped.length}, read-back ` +
      `${rows.length - failures.length}/${rows.length}.`,
    "",
    "| row | block | state | pos | read-back |",
    "|---|---|---|---|---|",
    ...rows.map((r) =>
      `| ${r.id} | ${r.block.replace(/^minecraft:/, "")} | ${r.state ? Object.entries(r.state).map(([k, v]) => `${k}=${v}`).join(" ") : "(default)"} | ${r.pos.join(",")} | ${r.pass ? "ok" : `FAIL: ${r.wrong.join("; ")}`} |`
    ),
    "",
    renders.length
      ? ["Renders (regression reference):", ...renders.map((r) => `- \`${r.path}\` (${r.angle}) sha256 ${r.sha256.slice(0, 16)}…`)].join("\n")
      : `Renders unavailable: ${renderError}`,
    "",
    "Named residuals (lens, not placement):",
    ...NAMED_RESIDUALS.map((r) => `- ${r}`),
    "",
  ].join("\n");
  await writeFile(join(OUT_DIR, "fixture-card.md"), md);

  console.error(`record: ${join(OUT_DIR, "record.json")}`);
  if (!ok) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
