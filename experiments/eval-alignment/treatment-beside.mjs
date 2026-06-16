#!/usr/bin/env node
/**
 * T-175-01 (story S-175, epic E-43) — RENDER THE COMPOSITIONAL TREATMENT GRAMMAR on the gatehouse.
 *
 * Proves candidate A (the chosen approach) at readable amplitude on the material-faithful gatehouse, beside
 * the concept, against the token baseline (the before). The engine is the production module
 * src/view/treatment-grammar.mjs (unit-tested); this impure runner loads the build, the serialized rustic
 * spec, injects the opening-dressing seam (it lives under experiments/, unswept by the brush-door tripwire,
 * so it MAY import opening-dressing and inject it), composes, and renders. Glance over score — NO judge, NO
 * chain, NO pin write. Asserts closure is NOT regressed (recess-by-exclusion guard).
 *
 *   node experiments/eval-alignment/treatment-beside.mjs            # both panels
 *   node experiments/eval-alignment/treatment-beside.mjs baseline   # just the token before
 *   node experiments/eval-alignment/treatment-beside.mjs treated    # just the treated build
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { artifactOccupancy, occupancyFromCells } from "../../src/view/occupancy.mjs";
import { composeTreatment } from "../../src/view/treatment-grammar.mjs";
import { applyArticulation } from "../../src/recognition/compile.mjs";
import { extractApertures, dressOpenings } from "../../src/view/opening-dressing.mjs";
import { reliefNoRegress } from "../../src/view/surface-relief.mjs";
import { rebuildArtifact } from "../../src/view/shell-integrity.mjs";
import { renderBesideConcept } from "../../src/view/render-beside.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const BASE = join(ROOT, "builds/gatehouse/faithful/artifact.json");
const SPEC = join(ROOT, "docs/active/work/T-175-01/rustic-gatehouse.treatment.json");
const CONCEPT = join(ROOT, "benchmarks/sculpture/runs/015-vBuilding-a-stone-gatehouse-with-a-peaked-gable-roof-and-an-arched-gate/concept.png");
const OUT = join(ROOT, "docs/active/work/T-175-01");

const FACES = ["+x", "-x", "+z", "-z"];
const FLOOR = 0, EAVE_Y = 19;

/** fold placements onto an occupancy (last-writer-wins by position). */
const fold = (occ, placements) => {
  const byKey = new Map();
  for (const [k, b] of occ.cells) byKey.set(k, { pos: k.split(",").map(Number), block: b, form: occ.forms.get(k), state: occ.states.get(k) });
  for (const p of placements) byKey.set(p.pos.join(","), { pos: [...p.pos], block: p.block, ...(p.state ? { state: p.state } : {}) });
  return occupancyFromCells([...byKey.values()]);
};

/** The token baseline (the E-42 "before"): quoin run=4 headerDepth=1 through the registry door. */
function baseline(occ) {
  const { placements } = applyArticulation(occ, [{ brush: "quoin", params: { material: "cobblestone", faces: FACES, run: 4, headerDepth: 1 } }]);
  console.error(`[baseline] token quoins proud=${placements.length} (run=4 hd=1)`);
  return fold(occ, placements);
}

/** The treated build: the full compositional grammar at A's restraint, dressing seam injected. */
function treated(occ, spec) {
  const { occ: out, placements, edges, report, closure } = composeTreatment(occ, spec, {
    faces: FACES, floor: FLOOR, eaveY: EAVE_Y, extractApertures, dressOpenings,
  });
  console.error(`[treated] corners=${edges.cornerKey.length} | layers:`);
  for (const l of report.layers) console.error(`  - ${l.layer.padEnd(8)} ${l.brush ?? "(recess)"} placed=${l.placed}${l.skipped ? ` (${l.skipped})` : ""}`);
  console.error(`[treated] closure ok=${closure.ok} before=${closure.before.toFixed(4)} after=${closure.after.toFixed(4)} dropped=${closure.droppedColumns.length}`);
  // in-plane no-regress per face (proud relief widens the PERPENDICULAR extent — honest visible relief —
  // so a full-perimeter treatment widens; report the verdict, the closure guard is the gate).
  const nr = reliefNoRegress(occ, placements, { faces: FACES });
  console.error(`[treated] reliefNoRegress inPlanePerFace=${nr.perFace.map((p) => `${p.face}:${p.maskEqual ? "kept" : "widened"}`).join(" ")} ratiosPreserved=${nr.ratiosPreserved}`);
  if (!closure.ok) { console.error("FATAL: closure regressed — recess reopened holes:", closure.droppedColumns); process.exit(2); }
  return out;
}

const PANELS = { baseline, treated };

async function main() {
  const only = process.argv.slice(2).find((a) => !a.startsWith("--"));
  const queue = only ? [only] : Object.keys(PANELS);
  const raw = JSON.parse(readFileSync(BASE, "utf8"));
  const spec = JSON.parse(readFileSync(SPEC, "utf8"));
  const occ0 = artifactOccupancy(raw);
  console.error(`base: ${occ0.cells.size} cells, floor=${FLOOR} eaveY=${EAVE_Y}`);
  for (const name of queue) {
    const occN = name === "treated" ? treated(occ0, spec) : baseline(occ0);
    const art = rebuildArtifact(occN, raw);
    const out = join(OUT, `${name}-beside.png`);
    await renderBesideConcept(art, CONCEPT, out, { label: `gatehouse-${name}` });
    console.error(`[${name}] ${occ0.cells.size} → ${occN.cells.size} cells → ${out}\n`);
  }
}
main().catch((e) => { console.error("FATAL:", e.message, "\n", e.stack); process.exit(1); });
