#!/usr/bin/env node
/**
 * T-174-01 (story S-174, epic E-43) — ARTICULATION-APPROACH SPIKE on the gatehouse.
 *
 * THROWAWAY SCOUTING SCRIPT. Builds rough versions of the E-43 candidate articulation approaches on the
 * material-faithful gatehouse and renders each BESIDE the concept, so a human can pick the glance-winner.
 * Glance over score — NO judge, NO chain, NO pin write. Lives under experiments/ (unswept by the brush-door
 * tripwire, so it may import opening-dressing and inject the dressing seam).
 *
 * Candidates (see docs/active/work/T-174-01/design.md):
 *   baseline — token (E-42 "before"): quoin run=4 headerDepth=1.
 *   A grammar    — edges-from-geometry, uniform moderate amplitude: full-height quoins (hd2) + eave & verge
 *                  band + arch reveal. Systematic, no per-subject tuning.
 *   B patternbook— curated rustic-gatehouse recipe, bolder + per-edge tuned: full-height quoins (hd3) +
 *                  2-course eave band + water-table string course + arch reveal.
 *   D critique   — start token, apply 2 deterministic amplitude bumps (deepen quoins → add arch); render
 *                  final, log the round-by-round proudCell progression. Converges to A's quoins+arch BUT
 *                  without the band layers (the critique never flagged them) — the method-vs-amplitude probe.
 *   C concept-driven is DEFERRED to S-176 (most expensive, least reusable — see design.md).
 *
 * The brushes already exist and are charter-bound (proud cells only in front of existing shell; additive, so
 * closure cannot reopen). The spike only varies amplitude + composition.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { artifactOccupancy, occupancyFromCells } from "../../src/view/occupancy.mjs";
import { quoin, eaveOverhang } from "../../src/view/facade-articulation.mjs";
import { extractApertures, dressOpenings } from "../../src/view/opening-dressing.mjs";
import { rebuildArtifact } from "../../src/view/shell-integrity.mjs";
import { renderBesideConcept } from "../../src/view/render-beside.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const BASE = join(ROOT, "builds/gatehouse/faithful/artifact.json");
const CONCEPT = join(ROOT, "benchmarks/sculpture/runs/015-vBuilding-a-stone-gatehouse-with-a-peaked-gable-roof-and-an-arched-gate/concept.png");
const OUT = join(ROOT, "docs/active/work/T-174-01");

const FACES = ["+x", "-x", "+z", "-z"];
const FLOOR = 0, EAVE_Y = 19;
const RUN = EAVE_Y - FLOOR + 1; // full wall height
const QUOIN = "cobblestone";    // rustic wall.field.ground — the rubble corner the concept shows
const BAND = "stone_bricks";    // rustic wall.dressing — the lighter cornice/string course
const TIMBER = "dark_oak_log";  // rustic frame.timber — the arch frame

const occToCells = (occ) => {
  const out = [];
  for (const [k, b] of occ.cells) out.push({ pos: k.split(",").map(Number), block: b, form: occ.forms.get(k), state: occ.states.get(k) });
  return out;
};
/** fold placements onto an occupancy (last-writer-wins by position). */
const fold = (occ, placements) =>
  occupancyFromCells([...occToCells(occ), ...placements.map((p) => ({ pos: p.pos, block: p.block, ...(p.state ? { state: p.state } : {}) }))]);

/** Arch/opening reveal: timber frame + door leaf via the injected dressing seam. Returns {occ, placed}. */
function dressArch(occ) {
  const apertures = extractApertures(occ);
  if (!apertures.length) return { occ, placed: 0, note: "no apertures found" };
  const { placements } = dressOpenings(occ, apertures, {
    slots: { door: { block: "spruce_door" }, frame: { block: TIMBER }, light: { block: "lantern" } },
  });
  return { occ: placements.length ? fold(occ, placements) : occ, placed: placements.length, apertures: apertures.length };
}

const log = (name, parts) => console.error(`[${name}] ` + parts.join(" | "));

function baseline(occ) {
  const q = quoin(occ, { material: QUOIN, faces: FACES, run: 4, headerDepth: 1 });
  log("baseline", [`quoin corners=${q.report.corners} proud=${q.report.proudCells} (run=4 hd=1)`]);
  return fold(occ, q.placements);
}

function candidateA(occ) {
  const q = quoin(occ, { material: QUOIN, faces: FACES, run: RUN, headerDepth: 2 });
  let o = fold(occ, q.placements);
  const eave = eaveOverhang(o, { material: BAND, faces: FACES, depth: 1, eaveRow: EAVE_Y });
  o = fold(o, eave.placements);
  const verge = eaveOverhang(o, { material: BAND, faces: FACES, depth: 1, eaveRow: EAVE_Y - 1 });
  o = fold(o, verge.placements);
  const arch = dressArch(o);
  o = arch.occ;
  log("A grammar", [`quoin proud=${q.report.proudCells} (full hd2)`, `eaveBand=${eave.report.proudCells}`, `verge=${verge.report.proudCells}`, `arch placed=${arch.placed}`]);
  return o;
}

function candidateB(occ) {
  const q = quoin(occ, { material: QUOIN, faces: FACES, run: RUN, headerDepth: 3 }); // bolder rubble
  let o = fold(occ, q.placements);
  // 2-course eave band (a read-as-a-band cornice, not one course)
  const b1 = eaveOverhang(o, { material: BAND, faces: FACES, depth: 1, eaveRow: EAVE_Y });
  o = fold(o, b1.placements);
  const b2 = eaveOverhang(o, { material: BAND, faces: FACES, depth: 1, eaveRow: EAVE_Y - 1 });
  o = fold(o, b2.placements);
  // water-table string course at mid-height (a rustic dressed-stone belt over the rubble field)
  const wt = eaveOverhang(o, { material: BAND, faces: FACES, depth: 1, eaveRow: Math.round((FLOOR + EAVE_Y) / 2) });
  o = fold(o, wt.placements);
  const arch = dressArch(o);
  o = arch.occ;
  log("B patternbook", [`quoin proud=${q.report.proudCells} (full hd3 BOLD)`, `band=${b1.report.proudCells}+${b2.report.proudCells}`, `string=${wt.report.proudCells}`, `arch placed=${arch.placed}`]);
  return o;
}

function candidateD(occ) {
  // round 0: token
  let q = quoin(occ, { material: QUOIN, faces: FACES, run: 4, headerDepth: 1 });
  const r0 = q.report.proudCells;
  // round 1 (critique: "quoins thin → deepen, run full"): re-quoin from the ORIGINAL occ at higher amplitude
  q = quoin(occ, { material: QUOIN, faces: FACES, run: RUN, headerDepth: 2 });
  const r1 = q.report.proudCells;
  let o = fold(occ, q.placements);
  // round 2 (critique: "arch absent → add timber reveal")
  const arch = dressArch(o);
  o = arch.occ;
  log("D critique", [`round0 token proud=${r0}`, `round1 deepen proud=${r1}`, `round2 arch placed=${arch.placed}`, "(no band layer — never flagged)"]);
  return o;
}

const CANDIDATES = { baseline, candidateA, candidateB, candidateD };

async function main() {
  const only = process.argv.slice(2).find((a) => !a.startsWith("--"));
  const queue = only ? [only] : Object.keys(CANDIDATES);
  const raw = JSON.parse(readFileSync(BASE, "utf8"));
  const occ0 = artifactOccupancy(raw);
  console.error(`base: ${occ0.cells.size} cells, eaveY=${EAVE_Y}`);
  for (const name of queue) {
    const occN = CANDIDATES[name](occ0);
    const art = rebuildArtifact(occN, raw);
    const out = join(OUT, `${name}-beside.png`);
    await renderBesideConcept(art, CONCEPT, out, { label: `gatehouse-${name}` });
    console.error(`[${name}] ${occ0.cells.size} → ${occN.cells.size} cells → ${out}\n`);
  }
}
main().catch((e) => { console.error("FATAL:", e.message, "\n", e.stack); process.exit(1); });
