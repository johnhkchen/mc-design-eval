#!/usr/bin/env node
/**
 * THE CLIMB (E-38, 2026-06-15) + ROOF-AS-CONSTRUCTION (E-42 / S-172 / T-172-01, 2026-06-16).
 *
 * Original climb: carve the blobby GLB-voxelized roof (above the eave) and replace it with a CRISP
 * PARAMETRIC GABLE (generateRoof), isolating FORM from colour, then re-render/re-score.
 *
 * T-172-01 makes that gable a CONSTRUCTION rather than a solid material prism:
 *   1. COVERING, not fill — generateRoof(..., {covering:true}) hollows the wedge interior so the roof
 *      reads as a roof, not a ~72%-of-build plank mountain. Census printed before/after.
 *   2. MULTI-RIDGE — one gable per recognized mass (recognition/{subject}.program.json), registered to
 *      the build frame with registerRect. The cottage's two perpendicular masses → two gables with a
 *      valley; the barn's single mass → one gable. Falls back to a single-bbox gable (still covering)
 *      when no program / an ambiguous registration (logged).
 *   3. NO CLOSURE REGRESSION — closureOf of the kept wall-band ring is reported (the roof change never
 *      touches the walls, so it must hold; we prove it).
 *
 * Output goes to builds/{subject}/roof-covering/ (the committed new-roof build is preserved). Metered
 * baseline-vs-new scoring is gated behind --score (the matched≫wrong-style crater is T-173-01); this
 * ticket's witnesses are the render-beside-concept + the offline census. FALSIFIABLE: a per-mass ridge
 * may not register, a steep narrow roof may reopen a coverage seam, or the form may not read — all
 * reported where they land; the render is the witness.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { artifactOccupancy, occupancyFromCells } from "../../src/view/occupancy.mjs";
import { gableRecord, generateRoof, roofMaterialFraction } from "../../src/view/roof-generate.mjs";
import { registerRect, closureOf } from "../../src/view/wall-generate.mjs";
import { rebuildArtifact } from "../../src/view/shell-integrity.mjs";
import { renderViews } from "../../src/view/multi-angle.mjs";
import { renderBesideConcept } from "../../src/view/render-beside.mjs";
import { requestTextWithImage } from "../../src/sdk-binding.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const FAMILY = { field: "spruce_planks", stairs: "spruce_stairs", slab: "spruce_slab", findings: [] };
const EVAL_MODEL = "claude-opus-4-8";
// per-subject config: eaveY (walls constant below; roof blob above) + ridgeAxis (= the LONGER footprint axis)
const SUBJECTS = {
  cottage: { artifact: "builds/cottage/final-artifact.json", concept: "benchmarks/sculpture/runs/014-vConcept-a-cottage/concept.png", eaveY: 13, ridgeAxis: "z" },
  barn: { artifact: "builds/barn/final-artifact.json", concept: "benchmarks/sculpture/runs/017-vBuilding-a-rectangular-stone-tithe-barn-with-a-steep-gabled-roof-and-large-timber-wagon-doors/concept.png", eaveY: 12, ridgeAxis: "x" },
  // 3rd building subject — peaked gable roof, ~square footprint; baseline rendered fresh (no builds/ dir)
  gatehouse: { artifact: "benchmarks/sculpture/generated/gatehouse/artifact.json", concept: "benchmarks/sculpture/runs/015-vBuilding-a-stone-gatehouse-with-a-peaked-gable-roof-and-an-arched-gate/concept.png", eaveY: 18, ridgeAxis: "z" },
};
const SUBJECT = process.argv.slice(2).find((a) => !a.startsWith("--")) || "cottage";
const CFG = SUBJECTS[SUBJECT];
if (!CFG) throw new Error(`unknown subject ${SUBJECT}`);
const EAVE_Y = CFG.eaveY;
const CONCEPT = CFG.concept;

const PROMPT = [
  "You measure how well a Minecraft build realizes a CONCEPT. Image 1 is the CONCEPT (the target).",
  "Image 2 is the BUILD (one camera angle).",
  "Quality is DEFECT-DOMINATED: a build is only as good as its SINGLE WORST defect relative to the",
  "concept. A glaring error (missing/wrong roof, broken massing, holes, chaotic geometry) CAPS the",
  "score; many tiny imperfections do NOT sink a build whose major elements are present and correct.",
  "Defect axes: massing/proportion; roof form & presence; structural integrity; palette/material; detail.",
  "Name the SINGLE worst defect; set quality 0-100 = the cap that defect imposes.",
  'Output ONE JSON: {"worstDefect":{"axis":"<axis>","what":"<short>"},"quality":<int>,"rationale":"<one sentence>"}',
].join("\n");

function img(p) { return { data: readFileSync(join(ROOT, p)), mediaType: "image/png" }; }
function parse(t) { const s = t.indexOf("{"), e = t.lastIndexOf("}"); return JSON.parse(t.slice(s, e + 1)); }
async function score(viewRel) {
  const { text } = await requestTextWithImage({ prompt: PROMPT, images: [img(CONCEPT), img(viewRel)], model: EVAL_MODEL });
  return parse(text);
}

const FLAGS = process.argv.slice(2).filter((a) => a.startsWith("--"));
const WANT_SCORE = FLAGS.includes("--score");
const ROOF_FIELD = [FAMILY.field, FAMILY.stairs, FAMILY.slab]; // the prism material (census)

/** Modal (most-common) block among kept cells at the eave layer — the wall material the gable-end
 *  envelope should match. Falls back to the global modal kept block. */
function modalEaveBlock(kept) {
  const at = new Map(), all = new Map();
  for (const c of kept) {
    all.set(c.block, (all.get(c.block) ?? 0) + 1);
    if (c.pos[1] === EAVE_Y) at.set(c.block, (at.get(c.block) ?? 0) + 1);
  }
  const top = (m) => [...m].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  return top(at) ?? top(all);
}

/** One gableRecord per recognized mass, rects registered to the build frame. registerRect may SWAP
 *  axes, so the program's ridgeAxis is remapped through the chosen assignment. Pitch 1 (FORM
 *  isolation — same as the original climb). Returns [] when no usable program. */
function gablesFromProgram(masses, eaveCols) {
  const reg = registerRect(masses, eaveCols);
  if (!reg) { console.error("  registerRect: no fit (empty rects/cols)"); return { gables: [], reg: null }; }
  console.error(`  registerRect: ${reg.reason}`);
  if (reg.ambiguous) { console.error("  registration AMBIGUOUS — falling back to single-bbox gable"); return { gables: [], reg }; }
  const gables = [];
  for (const m of masses) {
    const r = m.rect;
    const c0 = reg.transform(r.x0, r.z0), c1 = reg.transform(r.x0 + r.w, r.z0 + r.d);
    const fx0 = Math.min(c0.x, c1.x), fx1 = Math.max(c0.x, c1.x);
    const fz0 = Math.min(c0.z, c1.z), fz1 = Math.max(c0.z, c1.z);
    const progAxis = m.roof?.ridgeAxis ?? (fx1 - fx0 >= fz1 - fz0 ? "z" : "x");
    const ridgeAxis = reg.axis === "swap" ? (progAxis === "z" ? "x" : "z") : progAxis;
    const perpSpan = ridgeAxis === "z" ? (fx1 - fx0) : (fz1 - fz0);
    const ridgeY = EAVE_Y + Math.floor(perpSpan / 2);
    gables.push(gableRecord({ footprint: { x0: fx0, x1: fx1, z0: fz0, z1: fz1 }, ridgeAxis, eaveY: EAVE_Y, ridgeY, pitch: 1, hip: { demanded: false } }));
    console.error(`  mass ${m.id}: build x[${fx0},${fx1}] z[${fz0},${fz1}] ridge=${ridgeAxis}@${ridgeY}`);
  }
  return { gables, reg };
}

async function main() {
  const raw = JSON.parse(readFileSync(join(ROOT, CFG.artifact), "utf8"));
  const occ = artifactOccupancy(raw);

  // carve the roof blob (y > eave), keep walls with their forms/states (doors, windows, etc.)
  const kept = [];
  const eaveCols = new Set();
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (const [key, block] of occ.cells) {
    const [x, y, z] = key.split(",").map(Number);
    if (y >= EAVE_Y + 1) continue;
    kept.push({ pos: [x, y, z], block, form: occ.forms.get(key), state: occ.states.get(key) });
    if (y === EAVE_Y) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); eaveCols.add(`${x},${z}`); }
  }
  const gableBlock = modalEaveBlock(kept);
  console.error(`[${SUBJECT}] carved roof; kept ${kept.length} wall cells | footprint x[${x0},${x1}] z[${z0},${z1}] eave=${EAVE_Y} | gable-end wall=${gableBlock}`);

  // MULTI-RIDGE: one gable per recognized mass (registered to the build frame); else single-bbox.
  const progPath = join(ROOT, `benchmarks/sculpture/recognition/${SUBJECT}.program.json`);
  let gables = [];
  if (existsSync(progPath)) {
    const prog = JSON.parse(readFileSync(progPath, "utf8"));
    if (prog?.masses?.length) {
      console.error(`  program: ${prog.masses.length} mass(es) from ${SUBJECT}.program.json`);
      ({ gables } = gablesFromProgram(prog.masses, eaveCols));
    }
  }
  if (!gables.length) {
    const perpSpan = CFG.ridgeAxis === "z" ? (x1 - x0) : (z1 - z0);
    const ridgeY = EAVE_Y + Math.floor(perpSpan / 2);
    gables = [gableRecord({ footprint: { x0, x1, z0, z1 }, ridgeAxis: CFG.ridgeAxis, eaveY: EAVE_Y, ridgeY, pitch: 1, hip: { demanded: false } })];
    console.error(`  single-bbox fallback: ridge=${CFG.ridgeAxis}@${ridgeY}`);
  }

  // CONSTRUCTION: covering over the envelope (hollow), gable-end walls in the wall material.
  const gen = generateRoof(gables, FAMILY, { covering: true, gableBlock });
  // for the before/after census, also generate the OLD solid single-bbox prism
  const perpSpan = CFG.ridgeAxis === "z" ? (x1 - x0) : (z1 - z0);
  const solidGen = generateRoof([gableRecord({ footprint: { x0, x1, z0, z1 }, ridgeAxis: CFG.ridgeAxis, eaveY: EAVE_Y, ridgeY: EAVE_Y + Math.floor(perpSpan / 2), pitch: 1, hip: { demanded: false } })], FAMILY);
  console.error(`covering roof: ${gen.cells.length} cells (${gables.length} gable(s)) | prior solid prism: ${solidGen.cells.length} cells`);

  const newOcc = occupancyFromCells([...kept, ...gen.cells]);
  const newArtifact = rebuildArtifact(newOcc, raw);
  const solidArtifact = rebuildArtifact(occupancyFromCells([...kept, ...solidGen.cells]), raw);

  // CENSUS (AC #1): roof-field fraction of the whole build, covering vs the solid prism.
  const cNew = roofMaterialFraction(newArtifact.placements, ROOF_FIELD);
  const cOld = roofMaterialFraction(solidArtifact.placements, ROOF_FIELD);
  // CLOSURE (AC #3): the kept wall-band ring is untouched by the roof — prove it holds.
  const closure = closureOf(eaveCols);
  console.error(`\n--- census (roof field = ${ROOF_FIELD.join("/")}) ---`);
  console.error(`  solid prism : ${(100 * cOld.frac).toFixed(1)}%  (${cOld.roof}/${cOld.total})`);
  console.error(`  covering    : ${(100 * cNew.frac).toFixed(1)}%  (${cNew.roof}/${cNew.total})`);
  console.error(`  closureOf(wall-band ring) = ${closure.toFixed(3)} (roof change never touches walls)`);

  const outDir = join(ROOT, `builds/${SUBJECT}/roof-covering`);
  await renderViews(newArtifact, ["+x+z", "+x-z", "-x-z", "-x+z"], { outDir, label: (a) => a, width: 512, height: 512 });
  writeFileSync(join(outDir, "artifact.json"), JSON.stringify(newArtifact));
  await renderBesideConcept(newArtifact, join(ROOT, CONCEPT), join(outDir, "beside-concept.png"), { label: `roofcov-${SUBJECT}` });
  console.error(`rendered to ${outDir} (+ beside-concept.png)`);

  const result = {
    schema: "eval-alignment/roof-climb/v2", subject: SUBJECT, eaveY: EAVE_Y, gables: gables.length,
    census: { solidPrism: cOld, covering: cNew }, closureWallBand: closure,
    coveringCells: gen.cells.length, solidCells: solidGen.cells.length,
  };

  if (WANT_SCORE) {
    const baseDir = join(ROOT, `builds/${SUBJECT}/baseline`);
    await renderViews(raw, ["+x+z"], { outDir: baseDir, label: (a) => a, width: 512, height: 512 });
    console.error("\nscoring baseline (blob roof)...");
    const base = await score(`builds/${SUBJECT}/baseline/view-+x+z.png`);
    console.error(`  baseline q=${base.quality} | ${base.rationale}`);
    console.error("scoring roof-covering...");
    const neu = await score(`builds/${SUBJECT}/roof-covering/view-+x+z.png`);
    console.error(`  covering q=${neu.quality} | ${neu.rationale}`);
    result.baseline = base; result.newRoof = neu; result.delta = neu.quality - base.quality;
  } else {
    console.error("\n(scoring skipped — pass --score for the metered baseline-vs-new eval; crater is T-173-01)");
  }

  writeFileSync(join(HERE, "results", `roof-climb-${SUBJECT}.json`), JSON.stringify(result, null, 2));
  console.error("\n================ ROOF-AS-CONSTRUCTION ================");
  console.error(`${SUBJECT}: roof field ${(100 * cOld.frac).toFixed(1)}% (prism) -> ${(100 * cNew.frac).toFixed(1)}% (covering) | ${gables.length} ridge(s) | closure ${closure.toFixed(2)}`);
  console.error("=====================================================");
}
main().catch((e) => { console.error("FATAL:", e.message, "\n", e.stack); process.exit(1); });
