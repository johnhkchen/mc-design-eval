#!/usr/bin/env node
/**
 * T-176-01 (story S-176, epic E-43) — SOURCE the treatment, REFINE it from a critique, GENERALIZE to roof +
 * openings, and render the evidence beside the concept. Closes the epic: the spec is no longer hand-authored
 * (sourceTreatment from the gatehouse program + rustic pack), the amplitude is raised by the structured
 * critique (refineAmplitude), and the same edges-from-geometry vocabulary treats the roof (eave/ridge/verge).
 *
 * The engines are the production modules (src/recognition/treatment-source.mjs, src/view/treatment-grammar.mjs,
 * both unit-tested). This impure runner loads the faithful gatehouse, sources the spec, injects the
 * opening-dressing seam (under experiments/, unswept by the brush-door tripwire), composes, and renders.
 * Glance over score — NO judge, NO chain, NO pin write. Asserts closure is NOT regressed on every build.
 *
 *   node experiments/eval-alignment/treatment-sourced-beside.mjs            # all witnesses
 *   node experiments/eval-alignment/treatment-sourced-beside.mjs sourced    # just one
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { artifactOccupancy, occupancyFromCells } from "../../src/view/occupancy.mjs";
import { composeTreatment, composeRoofTreatment, deriveRoofEdges, deriveOpeningEdges } from "../../src/view/treatment-grammar.mjs";
import { sourceTreatment, refineAmplitude } from "../../src/recognition/treatment-source.mjs";
import { loadStylePack } from "../../src/pack/style-pack.mjs";
import { extractApertures, dressOpenings } from "../../src/view/opening-dressing.mjs";
import { rebuildArtifact } from "../../src/view/shell-integrity.mjs";
import { renderBesideConcept } from "../../src/view/render-beside.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const BASE = join(ROOT, "builds/gatehouse/faithful/artifact.json");
const PROGRAM = join(ROOT, "benchmarks/sculpture/recognition/gatehouse.program.json");
const PACK = join(ROOT, "packs/rustic.json");
const HAND = join(ROOT, "docs/active/work/T-175-01/rustic-gatehouse.treatment.json");
const CONCEPT = join(ROOT, "benchmarks/sculpture/runs/015-vBuilding-a-stone-gatehouse-with-a-peaked-gable-roof-and-an-arched-gate/concept.png");
const OUT = join(ROOT, "docs/active/work/T-176-01");

const FACES = ["+x", "-x", "+z", "-z"];
const FLOOR = 0, EAVE_Y = 19, RIDGE_Y = 28, RIDGE_AXIS = "x";

// a gatehouse-flavored critique standing in for the Layer-A DiagnoseBuild (LIVE_DIAGNOSE=1 would call the
// model; here the loop is driven deterministically — the mechanism is identical). It reflects the GENUINE
// token-relief baseline: thin corner quoins, no plinth/cornice band, plain openings. The roof material is
// already correct (the faithful build's roof is dark_oak_planks), so there is NO roof replace to fabricate —
// the `replace` (wrong-material, noted-not-amplified) path is proven in the unit test TS7, not faked here.
const GATEHOUSE_CRITIQUE = { items: [
  { department: "WALL", kind: "add", severity: "major", present: "shallow corner nubs", missing: "the full-height rubble quoins, base plinth and eave cornice band" },
  { department: "OPENING", kind: "add", severity: "minor", present: "a plain arch hole", missing: "the timber arch reveal and door leaf" },
] };

const fold = (occ, placements) => {
  const byKey = new Map();
  for (const [k, b] of occ.cells) byKey.set(k, { pos: k.split(",").map(Number), block: b, form: occ.forms.get(k), state: occ.states.get(k) });
  for (const p of placements) byKey.set(p.pos.join(","), { pos: [...p.pos], block: p.block, ...(p.state ? { state: p.state } : {}) });
  return occupancyFromCells([...byKey.values()]);
};

function assertClosure(tag, closure) {
  console.error(`[${tag}] closure ok=${closure.ok} before=${closure.before.toFixed(4)} after=${closure.after.toFixed(4)} dropped=${closure.droppedColumns.length}`);
  if (!closure.ok) { console.error(`FATAL: ${tag} closure regressed`, closure.droppedColumns); process.exit(2); }
}

const wallCtx = { faces: FACES, floor: FLOOR, eaveY: EAVE_Y, extractApertures, dressOpenings };

function composeWall(occ, spec, tag) {
  const { occ: out, placements, report, closure } = composeTreatment(occ, spec, wallCtx);
  console.error(`[${tag}] wall layers: ${report.layers.map((l) => `${l.layer}=${l.placed}`).join(" ")}`);
  assertClosure(tag, closure);
  return out;
}

function panelSourced(occ, spec) { return composeWall(occ, spec, "sourced"); }

function panelRefined(occ, spec) {
  const { spec: refined, changes, notes } = refineAmplitude(spec, GATEHOUSE_CRITIQUE);
  console.error(`[refined] critique → ${changes.length} amplitude change(s):`);
  for (const c of changes) console.error(`  - ${c.layer}.${c.knob}: ${c.from} → ${c.to} (${c.why})`);
  for (const n of notes) console.error(`  - NOTE ${n.kind} [${n.dept}]: ${n.text} (material, not amplitude — pattern-book/recognition's job)`);
  return composeWall(occ, refined, "refined");
}

function panelRoof(occ, spec) {
  // sourced wall treatment first, then the roof band treatment on top (the generalization).
  const walled = composeWall(occ, spec, "roof(base)");
  const roofSpec = spec.roof ?? { edge: { material: "stone_bricks", amplitude: { eaveDepth: 1, ridgeCourses: 1 } } };
  const { occ: out, edges, report, closure } = composeRoofTreatment(walled, roofSpec, { faces: FACES, ridgeAxis: RIDGE_AXIS, eaveY: EAVE_Y, ridgeY: RIDGE_Y });
  console.error(`[roof] eaveRow=${edges.eaveRow} ridgeRow=${edges.ridgeRow} vergeCols=${edges.vergeColumns.length} | layers: ${report.layers.map((l) => `${l.layer}=${l.placed}`).join(" ")}`);
  const leak = report.layers.find((l) => l.leak);
  if (leak) console.error(`[roof] LEAK: ${leak.leak}`);
  assertClosure("roof", closure);
  return out;
}

const PANELS = { sourced: panelSourced, refined: panelRefined, roof: panelRoof };

async function main() {
  const only = process.argv.slice(2).find((a) => !a.startsWith("--"));
  const queue = only ? [only] : Object.keys(PANELS);
  const raw = JSON.parse(readFileSync(BASE, "utf8"));
  const program = JSON.parse(readFileSync(PROGRAM, "utf8"));
  const pack = loadStylePack(PACK);
  const occ0 = artifactOccupancy(raw);

  // SOURCE the spec (not hand-authored) and prove it reproduces the hand-authored materials.
  const spec = sourceTreatment(program, pack);
  const hand = JSON.parse(readFileSync(HAND, "utf8"));
  const same = spec.edges.corners.material === hand.edges.corners.material
    && spec.base.material === hand.base.material
    && spec.edges.top.material === hand.edges.top.material
    && spec.edges.opening.frame === hand.edges.opening.frame;
  console.error(`base: ${occ0.cells.size} cells | sourced spec field=${spec.field.material} edges=${spec.edges.corners.material} roof.edge=${spec.roof?.edge.material} | matches-hand-authored=${same}`);
  if (!same) { console.error("FATAL: sourced materials do not match the hand-authored spec — sourcing is wrong"); process.exit(3); }
  writeFileSync(join(OUT, "gatehouse.sourced.treatment.json"), JSON.stringify(spec, null, 2) + "\n");

  // report the opening edges derivation (the opening witness rides the sourced render's dressed gate).
  const apertures = extractApertures(occ0);
  for (const a of apertures.slice(0, 3)) {
    const oe = deriveOpeningEdges(a);
    console.error(`[opening] ${oe.kind} dir=${a.dir} reveal=${oe.reveal?.length ?? 0} head=${oe.head?.length ?? 0} isArch=${oe.isArch}`);
  }

  for (const name of queue) {
    const occN = PANELS[name](occ0, spec);
    const art = rebuildArtifact(occN, raw);
    const out = join(OUT, `${name}-beside.png`);
    await renderBesideConcept(art, CONCEPT, out, { label: `gatehouse-${name}` });
    console.error(`[${name}] ${occ0.cells.size} → ${occN.cells.size} cells → ${out}\n`);
  }
}
main().catch((e) => { console.error("FATAL:", e.message, "\n", e.stack); process.exit(1); });
