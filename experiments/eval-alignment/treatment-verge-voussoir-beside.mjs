#!/usr/bin/env node
/**
 * T-179-01 (story S-179, epic E-44) — the WITNESS for the two closed E-43 leaks: the RAKING VERGE (a sloped
 * line) and the VOUSSOIR ARCH HEAD (a curve). T-176-01 found the wall row/column/corner vocabulary could not
 * name either; this run proves the PROFILE primitive (deriveRakingVerge / deriveArchHead) reads on the
 * gatehouse render via the SAME compositor.
 *
 * It loads the faithful gatehouse, sources the treatment spec (no hand-authoring), sets the voussoir head
 * material (the dark-timber arch surround the concept calls for), composes the WALL treatment (incl. the
 * voussoir recolor through the injected opening-dressing seam), then the ROOF treatment (incl. the rake
 * verge), and renders the gate azimuths beside the concept. The −x gable elevation carries BOTH edges (ridge
 * runs x, the arched passage faces −x). Glance over score: NO judge, NO chain, NO pin write. Asserts closure
 * is NOT regressed on every build, and prints the rake-cell / voussoir glance log.
 *
 *   node experiments/eval-alignment/treatment-verge-voussoir-beside.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { artifactOccupancy, occupancyFromCells } from "../../src/view/occupancy.mjs";
import { renderViews } from "../../src/view/multi-angle.mjs";
import { MULTI_ANGLE_GATE } from "../../src/config.mjs";
import { TREATMENT_GRAMMAR_SCHEMA } from "../../src/view/treatment-grammar.mjs";
import { composeTreatment, composeRoofTreatment, deriveRakingVerge, deriveRoofEdges,
  deriveOpeningEdges, deriveArchHead } from "../../src/view/treatment-grammar.mjs";
import { sourceTreatment } from "../../src/recognition/treatment-source.mjs";
import { loadStylePack } from "../../src/pack/style-pack.mjs";
import { extractApertures, dressOpenings } from "../../src/view/opening-dressing.mjs";
import { rebuildArtifact } from "../../src/view/shell-integrity.mjs";
import { renderBesideConcept } from "../../src/view/render-beside.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const BASE = join(ROOT, "builds/gatehouse/faithful/artifact.json");
const PROGRAM = join(ROOT, "benchmarks/sculpture/recognition/gatehouse.program.json");
const PACK = join(ROOT, "packs/rustic.json");
const CONCEPT = join(ROOT, "benchmarks/sculpture/runs/015-vBuilding-a-stone-gatehouse-with-a-peaked-gable-roof-and-an-arched-gate/concept.png");
const OUT = join(ROOT, "docs/active/work/T-179-01");

const FACES = ["+x", "-x", "+z", "-z"];
const FLOOR = 0, EAVE_Y = 19, RIDGE_Y = 28, RIDGE_AXIS = "x";

function assertClosure(tag, closure) {
  console.error(`[${tag}] closure ok=${closure.ok} before=${closure.before.toFixed(4)} after=${closure.after.toFixed(4)} dropped=${closure.droppedColumns.length}`);
  if (!closure.ok) { console.error(`FATAL: ${tag} closure regressed`, closure.droppedColumns); process.exit(2); }
}

async function main() {
  const raw = JSON.parse(readFileSync(BASE, "utf8"));
  const program = JSON.parse(readFileSync(PROGRAM, "utf8"));
  const pack = loadStylePack(PACK);
  const occ0 = artifactOccupancy(raw);

  // SOURCE the spec; add the voussoir head material (the timber arch surround) — sourced from the same
  // opening frame role the concept calls "dark-timber-surrounded". This keeps the spec serializable + S-176
  // consistent (no hand geometry, only a role-block).
  const spec = sourceTreatment(program, pack);
  if (spec.edges?.opening?.frame) spec.edges.opening.voussoir = spec.edges.opening.frame;
  console.error(`base: ${occ0.cells.size} cells | field=${spec.field?.material} corners=${spec.edges?.corners?.material} roof.edge=${spec.roof?.edge?.material} voussoir=${spec.edges?.opening?.voussoir}`);
  writeFileSync(join(OUT, "gatehouse.vergehead.treatment.json"), JSON.stringify(spec, null, 2) + "\n");

  // GLANCE LOG: the rake profile (sloped line) + per-aperture arch head (curve) the render must show.
  const rake = deriveRakingVerge(occ0, { ridgeAxis: RIDGE_AXIS, eaveY: EAVE_Y, ridgeY: RIDGE_Y });
  const oldBand = new Set(deriveRoofEdges(occ0, { ridgeAxis: RIDGE_AXIS, eaveY: EAVE_Y, ridgeY: RIDGE_Y }).vergeColumns);
  console.error(`[verge] rakeCells=${rake.rakeCells.length} curve=${rake.curve} faces=${rake.faces.join(",")} | old heavy-band columns=${oldBand.size} (the T-176 leak)`);
  const apertures = extractApertures(occ0);
  let arches = 0;
  for (const a of apertures) {
    const oe = deriveOpeningEdges(a);
    if (oe.isArch) { arches++; const h = deriveArchHead(a); console.error(`[arch] dir=${a.dir} crown=${h.crown.length} voussoirs=${h.voussoirs.length} curve=${h.curve}`); }
  }
  console.error(`[opening] ${apertures.length} apertures, ${arches} arched (voussoir head dressed on these)`);
  if (arches === 0) console.error("[opening] NOTE: the faithful gate is not marked isArch — the voussoir recolor no-ops on THIS build; the derivation is proven by TG24 on synthetic arch geometry.");

  // COMPOSE: wall treatment (incl. the voussoir recolor via the injected seam), then the roof rake verge.
  const wall = composeTreatment(occ0, spec, { faces: FACES, floor: FLOOR, eaveY: EAVE_Y, extractApertures, dressOpenings });
  console.error(`[wall] layers: ${wall.report.layers.map((l) => `${l.layer}=${l.placed}`).join(" ")} | opening voussoirs=${wall.report.byLayer.opening?.voussoirs ?? 0}`);
  assertClosure("wall", wall.closure);

  const roofSpec = spec.roof ?? { edge: { material: "stone_bricks", amplitude: { eaveDepth: 1, ridgeCourses: 1 } } };
  const roof = composeRoofTreatment(wall.occ, roofSpec, { faces: FACES, ridgeAxis: RIDGE_AXIS, eaveY: EAVE_Y, ridgeY: RIDGE_Y });
  const verge = roof.report.layers.find((l) => l.layer === "verge");
  console.error(`[roof] layers: ${roof.report.layers.map((l) => `${l.layer}=${l.placed}`).join(" ")} | verge profile=${verge?.profile} curve=${verge?.curve} placed=${verge?.placed}`);
  assertClosure("roof", roof.closure);

  const art = rebuildArtifact(roof.occ, raw);
  const out = join(OUT, "verge-voussoir-beside.png");
  await renderBesideConcept(art, CONCEPT, out, { label: "gatehouse-verge-voussoir" });
  console.error(`[render] ${occ0.cells.size} → ${roof.occ.cells.size} cells → ${out}`);

  // ── SYNTHETIC ARCH-HEAD WITNESS ─────────────────────────────────────────────────────────────
  // The faithful gatehouse carries NO arched aperture (its gate is not detected as a -x opening; the four
  // windows are rectangular slits), so the voussoir head no-ops on it — a BUILD gap (S-177), not a grammar
  // gap. To let the glance judge the HEAD TREATMENT itself, render it on a synthetic arched door, before vs
  // after, through the SAME composeTreatment compositor. Honestly labelled synthetic.
  await renderArchHead();
}

/** A stone block with a 3-wide ARCHED passage carved THROUGH it on -z (a true see-through hole so
 *  `openings` detects it; the top corners (3,4)(5,4) stay solid → a curved crown the head must dress). */
function archedDoorBox() {
  const cells = [];
  for (let x = 0; x <= 8; x++) for (let y = 0; y <= 7; y++) for (let z = 0; z <= 4; z++) {
    const inArch = (x >= 3 && x <= 5 && y >= 0 && y <= 3) || (x === 4 && y === 4); // arch profile (all z = through)
    if (inArch) continue;
    cells.push({ pos: [x, y, z], block: "stone_bricks" });
  }
  return occupancyFromCells(cells);
}

async function renderArchHead() {
  const raw = JSON.parse(readFileSync(BASE, "utf8")); // template for rebuildArtifact scaffolding
  const synth = archedDoorBox();
  const aps = extractApertures(synth);
  for (const a of aps) {
    const oe = deriveOpeningEdges(a);
    if (oe.isArch) { const h = deriveArchHead(a); console.error(`[synth-arch] dir=${a.dir} crown=${JSON.stringify(h.crown)} voussoirs=${JSON.stringify(h.voussoirs)} curve=${h.curve}`); }
  }
  const spec = { schema: TREATMENT_GRAMMAR_SCHEMA, edges: { opening: { frame: "dark_oak_log", door: "spruce_door", voussoir: "dark_oak_log" } } };
  const dressed = composeTreatment(synth, spec, { faces: FACES, floor: 0, eaveY: 6, extractApertures, dressOpenings });
  console.error(`[synth-arch] opening layer: voussoirs=${dressed.report.byLayer.opening?.voussoirs ?? 0} arches=${dressed.report.byLayer.opening?.arches ?? 0}`);
  assertClosure("synth-arch", dressed.closure);

  // before (bare void) as the left "concept" panel, dressed (voussoir surround) as the build panels.
  const bareArt = rebuildArtifact(synth, raw);
  const dressedArt = rebuildArtifact(dressed.occ, raw);
  const tmp = join(tmpdir(), "t179-arch-bare");
  const front = MULTI_ANGLE_GATE.azimuths.find((a) => String(a).includes("-z")) ?? MULTI_ANGLE_GATE.azimuths[0];
  const bare = await renderViews(bareArt, [front], { outDir: tmp, label: () => "bare" });
  const out = join(OUT, "arch-head-synthetic-beside.png");
  await renderBesideConcept(dressedArt, bare[0].path, out, { label: "synth-arch-head" });
  console.error(`[synth-arch] bare(left) vs voussoir-dressed(right) → ${out}`);
}
main().catch((e) => { console.error("FATAL:", e.message, "\n", e.stack); process.exit(1); });
