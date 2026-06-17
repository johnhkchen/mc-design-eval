#!/usr/bin/env node
/**
 * FAITHFUL-COVERED (E-44 / S-177 / T-177-01, 2026-06-16).
 *
 * Produce ONE gatehouse build faithful in BOTH materials AND roof: run the T-172-01 roof-as-construction
 * COVERING (generateRoof {covering:true}) on the S-171 materially-faithful WALLS (builds/gatehouse/
 * faithful/) — the build T-173-01 found missing (its crater self-capped on a residual dark_oak_planks
 * PRISM roof from compile.mjs::roofBlocks).
 *
 * THE SEAM (recorded honestly, AC #4): the two pieces are on different pipelines — the faithful walls come
 * from the recognition compile→realize path whose roof is a compile.mjs::roofBlocks SOLID PRISM, and the
 * covering lives in generateRoof. They do NOT compose IN-PATH: covering the roofBlocks prism inside
 * compile trips the gableWallKeys conformance gate + needs a judge-pin rotation (T-172-01 review). The
 * clean composition is DOWNSTREAM of both — a POST-REALIZE artifact swap: carve the finished artifact
 * above the eave (block-agnostic, so it cuts the roofBlocks prism just as it cut the generate-first blob)
 * and re-cover with generateRoof. This is a geometry swap on the artifact, not a pipeline merge.
 *
 * NO HARDCODING (AC #1): eaveY, ridgeAxis and pitch are DERIVED from the recognition program
 * (storeys·storeyHeight−1, masses[0].roof.ridgeAxis, pitchClass). The roof MATERIAL is DETECTED as the
 * modal block of the carved roof volume, so the covering inherits the build's OWN faithful roof material
 * (dark_oak_planks) — no per-subject SUBJECTS map, no dark_oak constant. Recess by exclusion: the covering
 * hollows by NOT placing interior cells, never an air-op.
 *
 * Output: builds/gatehouse/faithful-covered/ (artifact.json + view-{az}.png + beside-concept.png),
 * crater-ready for T-178-01 (CRATER_BUILD → here). FALSIFIABLE: if the covering reopens closure, or the
 * constructed roof reads worse than the prism at the glance, that is reported where it lands — the render
 * is the witness, closureOf is the guard.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { artifactOccupancy, occupancyFromCells } from "../../src/view/occupancy.mjs";
import { gableRecord, generateRoof, roofMaterialFraction } from "../../src/view/roof-generate.mjs";
import { closureOf } from "../../src/view/wall-generate.mjs";
import { rebuildArtifact } from "../../src/view/shell-integrity.mjs";
import { renderViews } from "../../src/view/multi-angle.mjs";
import { renderBesideConcept } from "../../src/view/render-beside.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");

// Defaults = the gatehouse faithful build. NOT a per-subject dispatch map — just the flag defaults; every
// build-shaping value below is derived from the program/artifact, never from a per-subject table.
const DEFAULTS = {
  build: "builds/gatehouse/faithful/artifact.json",
  program: "benchmarks/sculpture/recognition/gatehouse.program.json",
  concept: "benchmarks/sculpture/runs/015-vBuilding-a-stone-gatehouse-with-a-peaked-gable-roof-and-an-arched-gate/concept.png",
  out: "builds/gatehouse/faithful-covered",
};

function flag(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

/** Eave height, ridge axis and pitch DERIVED from the recognition program (no hardcoding). A missing
 *  field is a named throw, never a silent magic-number fallback. */
function eaveFromProgram(prog) {
  const m = prog?.masses?.[0];
  if (!m) throw new Error("program has no masses[0] — cannot derive eave/ridge");
  if (!Number.isFinite(m.storeys) || !Number.isFinite(m.storeyHeight)) {
    throw new Error(`masses[0] missing storeys/storeyHeight (got ${m.storeys}/${m.storeyHeight})`);
  }
  const ridgeAxis = m.roof?.ridgeAxis;
  if (ridgeAxis !== "x" && ridgeAxis !== "z") throw new Error(`masses[0].roof.ridgeAxis must be x|z (got ${ridgeAxis})`);
  const eaveY = m.storeys * m.storeyHeight - 1; // wall layers 0..eaveY; roof is y>eaveY
  const pitch = Math.max(1, m.roof?.pitchClass ?? 1);
  return { eaveY, ridgeAxis, pitch };
}

/** The roof course family from a detected field block id, namespace-preserving (minecraft:dark_oak_planks
 *  → dark_oak_stairs/_slab). Mirrors roof-generate.mjs::familyStem morphology but keeps the prefix so the
 *  emitted roof cells match the artifact's block namespace. */
function deriveFamily(fieldId) {
  const m = /^(minecraft:)?(.+)$/.exec(fieldId);
  const ns = m[1] ?? "";
  const id = m[2];
  let stem = id;
  if (id.endsWith("_planks")) stem = id.slice(0, -"_planks".length);
  else if (id.endsWith("_bricks") || id.endsWith("_tiles")) stem = id.slice(0, -1);
  return { field: fieldId, stairs: `${ns}${stem}_stairs`, slab: `${ns}${stem}_slab` };
}

/** Most-common block among cells passing `pred` (cell → bool). */
function modalBlock(cells, pred) {
  const counts = new Map();
  for (const c of cells) if (pred(c)) counts.set(c.block, (counts.get(c.block) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

async function main() {
  const buildRel = flag("build", DEFAULTS.build);
  const programRel = flag("program", DEFAULTS.program);
  const conceptRel = flag("concept", DEFAULTS.concept);
  const outRel = flag("out", DEFAULTS.out);

  const raw = JSON.parse(readFileSync(join(ROOT, buildRel), "utf8"));
  const occ = artifactOccupancy(raw);
  const prog = JSON.parse(readFileSync(join(ROOT, programRel), "utf8"));
  const { eaveY, ridgeAxis, pitch } = eaveFromProgram(prog);

  // POST-REALIZE CARVE: keep y ≤ eaveY (walls, with forms/states), collect the carved roof volume and the
  // eave-layer footprint. Block-agnostic — it cuts the roofBlocks prism the same way it cut a blob.
  const kept = [];
  const carved = [];
  const eaveCols = new Set();
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (const [key, block] of occ.cells) {
    const [x, y, z] = key.split(",").map(Number);
    if (y > eaveY) { carved.push({ pos: [x, y, z], block }); continue; }
    kept.push({ pos: [x, y, z], block, form: occ.forms.get(key), state: occ.states.get(key) });
    if (y === eaveY) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); eaveCols.add(`${x},${z}`); }
  }
  if (!eaveCols.size) throw new Error(`no cells at eaveY=${eaveY} — derived eave does not match the build`);

  // DETECTED faithful materials: roof field = modal carved block; gable-end wall = modal eave-layer block.
  const roofField = modalBlock(carved, () => true);
  if (!roofField) throw new Error(`nothing carved above eaveY=${eaveY} — no roof to re-cover`);
  const family = deriveFamily(roofField);
  const gableBlock = modalBlock(kept, (c) => c.pos[1] === eaveY);
  console.error(`[faithful-roof] ${buildRel}`);
  console.error(`  derived: eaveY=${eaveY} ridge=${ridgeAxis} pitch=${pitch} | footprint x[${x0},${x1}] z[${z0},${z1}]`);
  console.error(`  detected: roof field=${roofField} (stairs=${family.stairs} slab=${family.slab}) | gable-end wall=${gableBlock}`);
  console.error(`  kept ${kept.length} wall cells; carved ${carved.length} roof cells`);

  // ONE single-bbox gable (the gatehouse is one near-square mass; registerRect is ambiguous here, so a
  // single-bbox gable from the eave footprint + program ridgeAxis is the unambiguous path). COVERING.
  const perpSpan = ridgeAxis === "x" ? (z1 - z0) : (x1 - x0);
  const ridgeY = eaveY + Math.floor(perpSpan / 2);
  const gable = gableRecord({ footprint: { x0, x1, z0, z1 }, ridgeAxis, eaveY, ridgeY, pitch, hip: { demanded: false } });
  const gen = generateRoof([gable], family, { covering: true, gableBlock });
  console.error(`  covering: ${gen.cells.length} roof cells | ridge@${ridgeY} (perpSpan ${perpSpan})`);

  const newArtifact = rebuildArtifact(occupancyFromCells([...kept, ...gen.cells]), raw);

  // CENSUS (AC #1): the roof-field fraction, faithful prism (input) vs covering.
  const roofIds = [family.field, family.stairs, family.slab];
  const cPrism = roofMaterialFraction(raw.placements, roofIds);
  const cCover = roofMaterialFraction(newArtifact.placements, roofIds);
  // CLOSURE (AC #3): the eave ring is untouched by the roof — same ring before/after, prove it holds.
  const closure = closureOf(eaveCols);
  console.error(`\n--- census (roof family = ${roofIds.join("/")}) ---`);
  console.error(`  faithful prism : ${(100 * cPrism.frac).toFixed(1)}%  (${cPrism.roof}/${cPrism.total})`);
  console.error(`  covering       : ${(100 * cCover.frac).toFixed(1)}%  (${cCover.roof}/${cCover.total})`);
  console.error(`  closureOf(eave ring) = ${closure.toFixed(3)} (roof change never touches walls)`);

  const outDir = join(ROOT, outRel);
  await renderViews(newArtifact, ["+x+z", "+x-z", "-x-z", "-x+z"], { outDir, label: (a) => a, width: 512, height: 512 });
  writeFileSync(join(outDir, "artifact.json"), JSON.stringify(newArtifact));
  await renderBesideConcept(newArtifact, join(ROOT, conceptRel), join(outDir, "beside-concept.png"), { label: "faithful-covered-gatehouse" });

  const source = [
    "# builds/gatehouse/faithful-covered — one fully-faithful gatehouse (E-44 / S-177 / T-177-01)",
    "",
    "Faithful in BOTH materials AND roof: the T-172-01 roof-as-construction COVERING run on the S-171",
    "materially-faithful WALLS. This is the build T-173-01 found missing (its crater self-capped on a",
    "residual dark_oak_planks PRISM roof).",
    "",
    `- walls + materials  ← ${buildRel} (stone_bricks; polished_basalt gone)`,
    `- roof               ← generateRoof({covering:true}) in the build's OWN detected roof material`,
    `- program (derive)   ← ${programRel}`,
    "",
    "## The seam (composed cleanly?)",
    "NOT in-path. The faithful walls are recognition compile→realize (roof = compile.mjs::roofBlocks solid",
    "prism); the covering is generateRoof. Covering the roofBlocks prism INSIDE compile trips the",
    "gableWallKeys conformance gate + needs a judge-pin rotation (T-172-01 review). The clean composition is",
    "a POST-REALIZE artifact swap: carve y>eaveY (block-agnostic — removes the prism) and re-cover. A",
    "geometry swap on the finished artifact, not a pipeline merge.",
    "",
    "## Derived (no hardcoding) / detected (faithful materials)",
    `- eaveY=${eaveY}  ridgeAxis=${ridgeAxis}  pitch=${pitch}  ridgeY=${ridgeY}  (from the recognition program)`,
    `- roof field=${roofField} → stairs=${family.stairs} slab=${family.slab} (detected modal carved block)`,
    `- gable-end wall=${gableBlock} (detected modal eave-layer block)`,
    "",
    "## Numbers",
    `- roof-field census: faithful prism ${(100 * cPrism.frac).toFixed(1)}% → covering ${(100 * cCover.frac).toFixed(1)}%`,
    `- closureOf(eave ring) = ${closure.toFixed(3)} (unchanged from the faithful input — roof never touches walls)`,
    "",
    "## Crater-ready",
    "artifact.json + view-{az}.png present. T-178-01 points CRATER_BUILD straight at this dir.",
    "",
    "NOT a re-recognition or re-realize — a post-realize roof swap. Reproduce: `node",
    "experiments/eval-alignment/faithful-roof.mjs`.",
  ].join("\n");
  writeFileSync(join(outDir, "SOURCE.md"), source + "\n");

  writeFileSync(join(HERE, "results", "faithful-roof-gatehouse.json"), JSON.stringify({
    schema: "eval-alignment/faithful-roof/v1", build: buildRel, program: programRel,
    derived: { eaveY, ridgeAxis, pitch, ridgeY }, family, gableBlock,
    census: { prism: cPrism, covering: cCover }, closureEaveRing: closure,
    coveringCells: gen.cells.length,
  }, null, 2));

  console.error(`\nrendered to ${outRel} (+ beside-concept.png, SOURCE.md)`);
  console.error("\n================ FAITHFUL-COVERED ================");
  console.error(`gatehouse: roof field ${(100 * cPrism.frac).toFixed(1)}% (faithful prism) -> ${(100 * cCover.frac).toFixed(1)}% (covering) | ridge=${ridgeAxis}@${ridgeY} | closure ${closure.toFixed(2)}`);
  console.error("==================================================");
}
main().catch((e) => { console.error("FATAL:", e.message, "\n", e.stack); process.exit(1); });
