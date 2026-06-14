// Unit tests for relief-presence.mjs (T-148-01, story S-148, epic E-35) — synthetic occupancies.
// The fixpoint anti-anchor (flat wall fails when the concept is articulated) and the articulated pass
// (the same wall, relief applied, passes) are proven here with no GL; the live anti-anchor flip over
// the REAL committed barn build is the calibration sweep (benchmarks/sculpture/relief-calibration.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";

import { occupancyFromCells } from "../view/occupancy.mjs";
import { surfaceRelief } from "../view/surface-relief.mjs";
import {
  RELIEF_PRESENCE_SCHEMA, RELIEF_AWARE_GATE_SCHEMA,
  reliefDemand, reliefPresence, composeReliefAwareVerdict,
} from "./relief-presence.mjs";

// A minimal rustic-shaped pack: just the palette roles the demand resolves.
const PACK = {
  palette: [
    { role: "wall.field", block: "cobblestone" },
    { role: "frame.timber", block: "dark_oak_log" },
    { role: "roof.course", block: "spruce_stairs" },
  ],
};

// A flat wall on the +z face: a solid rectangle of wall blocks at the same z plane. The +z exterior
// skin is the whole rectangle; surfaceRelief on a column rhythm will emit one proud cell per strip
// column (the residual) because none of those cells is the member block.
function flatWall({ w = 12, h = 6, z = 0, block = "cobblestone" } = {}) {
  const cells = [];
  for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) cells.push({ pos: [x, y, z], block });
  return occupancyFromCells(cells);
}

const COLUMN_FACADE = {
  masses: [{
    id: "m1",
    facade: {
      faces: [{
        wall: "+z", rhythm: { period: 4, phase: 0 }, memberRole: "frame.timber",
        evidence: { source: "concept", layoutOnly: false },
      }],
    },
  }],
};

test("RP1 reliefDemand: no facade → []; a column facade → one resolved demand", () => {
  assert.deepEqual(reliefDemand({ masses: [{ id: "m1" }] }, PACK), []);
  const d = reliefDemand(COLUMN_FACADE, PACK);
  assert.equal(d.length, 1);
  assert.equal(d[0].face, "+z");
  assert.equal(d[0].axis, "column");
  assert.equal(d[0].every, 4);
  assert.equal(d[0].material, "dark_oak_log"); // resolved via roleBlock, never derived
});

test("RP2 anti-anchor: a flat mono-fill wall FAILS when the concept is articulated", () => {
  const occ = flatWall();
  const demand = reliefDemand(COLUMN_FACADE, PACK);
  const r = reliefPresence(occ, { demand });
  assert.equal(r.schema, RELIEF_PRESENCE_SCHEMA);
  assert.equal(r.ran, true);
  assert.equal(r.passed, false); // the build lacks the demanded relief
  assert.ok(r.checks[0].missingCells > 0, "surfaceRelief would still emit proud cells");
  assert.equal(r.checks[0].demandedStrips > 0, true);
  assert.equal(r.residual.length, 1);
  assert.match(r.residual[0], /missing relief: dark_oak_log on \+z/);
});

test("RP3 articulated pass: the same wall, relief applied, PASSES (the fixpoint)", () => {
  const occ = flatWall();
  const demand = reliefDemand(COLUMN_FACADE, PACK);
  const d = demand[0];
  // build the articulated reference: apply surfaceRelief's own placements (S-146 supply op)
  const { placements } = surfaceRelief(occ, {
    material: d.material, faces: [d.face],
    rhythm: { axis: d.axis, every: d.every, span: d.span, phase: d.phase }, depth: d.depth,
  });
  assert.ok(placements.length > 0);
  const cells = [...occ.cells.entries()].map(([k, b]) => ({ pos: k.split(",").map(Number), block: b }));
  const occRelieved = occupancyFromCells([
    ...cells, ...placements.map((p) => ({ pos: p.pos, block: p.block })),
  ]);
  const r = reliefPresence(occRelieved, { demand });
  assert.equal(r.passed, true, "re-running surfaceRelief on its own output is a no-op (idempotent)");
  assert.equal(r.checks[0].missingCells, 0);
  assert.equal(r.residual.length, 0);
});

test("RP4 no-demand passthrough: ran:false, passed:true (legacy state)", () => {
  const r = reliefPresence(flatWall(), { demand: [] });
  assert.equal(r.ran, false);
  assert.equal(r.passed, true);
  assert.deepEqual(r.checks, []);
});

test("RP5 evidence: the build's own surface read (proud-cell fraction / field-frame contrast)", () => {
  const occ = flatWall();
  const r = reliefPresence(occ, { demand: reliefDemand(COLUMN_FACADE, PACK) });
  assert.equal(r.evidence.length, 1);
  const e = r.evidence[0];
  assert.equal(e.face, "+z");
  // a flat wall reads all-flush, no proud, no recessed
  assert.equal(e.proud, 0);
  assert.ok(e.flush > 0);
  assert.equal(e.recessed, 0);
});

test("RP6 compose: relief FAIL drops a kit-aware PASS to composite FAIL, both reported", () => {
  const kitAwarePass = { schema: "kit-aware-gate/v1", decided: true, passed: true };
  const reliefFail = { schema: RELIEF_PRESENCE_SCHEMA, ran: true, passed: false, residual: ["missing relief: x"] };
  const v = composeReliefAwareVerdict(kitAwarePass, reliefFail);
  assert.equal(v.schema, RELIEF_AWARE_GATE_SCHEMA);
  assert.equal(v.decided, true);
  assert.equal(v.passed, false);
  assert.equal(v.components.kitAware.passed, true); // legacy reported beside
  assert.equal(v.components.relief.passed, false);
  assert.deepEqual(v.components.relief.residual, ["missing relief: x"]);

  // relief not run → pure passthrough of the kit-aware verdict
  const pass = composeReliefAwareVerdict(kitAwarePass, { ran: false });
  assert.equal(pass.passed, true);
  assert.equal(pass.components.relief.ran, false);

  // a resemblance refusal stays a refusal (relief never substitutes)
  const refusal = composeReliefAwareVerdict(
    { decided: false, refusal: "unparsed:+x+z" }, reliefFail);
  assert.equal(refusal.decided, false);
  assert.equal(refusal.refusal, "unparsed:+x+z");
});
