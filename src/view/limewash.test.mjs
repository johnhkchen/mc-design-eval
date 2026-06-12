// surface.limewash unit tests (T-132-01) — the promoted saltcrag draft's test plan: aspect
// containment, landward untouched, preserve list, deterministic partial coverage in runs,
// idempotency, report.

import { test } from "node:test";
import assert from "node:assert/strict";

import { occupancyFromCells } from "./occupancy.mjs";
import { limewashAspect } from "./limewash.mjs";

/** A gabled cottage shell: 7×5 footprint walls 4 high, rubble field with two quoin columns.
 *  The -z wall is the seaward (weather) face; +z/±x are landward. Hollow interior. */
function cottageShell() {
  const cells = [];
  for (let x = 0; x <= 6; x++) {
    for (let z = 0; z <= 4; z++) {
      const onWall = x === 0 || x === 6 || z === 0 || z === 4;
      if (!onWall) continue;
      for (let y = 0; y <= 3; y++) {
        const quoin = (x === 0 || x === 6) && z === 0;
        cells.push({ pos: [x, y, z], block: quoin ? "stone_bricks" : "cobblestone" });
      }
    }
  }
  return cells;
}

const OPTS = Object.freeze({
  block: "white_terracotta", aspects: ["-z"], coverage: 1, minRun: 2, preserve: ["stone_bricks"],
});

test("LW1 every placement lands on the weather aspect's exterior cells", () => {
  const occ = occupancyFromCells(cottageShell());
  const { placements } = limewashAspect(occ, OPTS);
  assert.ok(placements.length > 0);
  for (const p of placements) {
    assert.equal(p.pos[2], 0, "the seaward wall only");
    assert.ok(!occ.has(p.pos[0], p.pos[1], p.pos[2] - 1), "the painted face is exposed toward the weather");
  }
});

test("LW2 landward walls keep their field — zero placements off-aspect", () => {
  const occ = occupancyFromCells(cottageShell());
  const { placements } = limewashAspect(occ, OPTS);
  assert.ok(placements.every((p) => p.pos[2] === 0), "no placement on +z or ±x walls");
});

test("LW3 preserved materials (the dressed quoins) are never overpainted", () => {
  const occ = occupancyFromCells(cottageShell());
  const { placements, report } = limewashAspect(occ, OPTS);
  for (const p of placements) {
    assert.ok(p.pos[0] !== 0 && p.pos[0] !== 6, "quoin columns untouched");
  }
  assert.ok(report.preservedSkipped > 0, "the skipped quoins are reported");
});

test("LW4 coverage=1 coats every eligible cell; coverage=0.5 coats ~half in runs ≥ minRun", () => {
  const occ = occupancyFromCells(cottageShell());
  const full = limewashAspect(occ, OPTS);
  assert.equal(full.report.painted, full.report.eligible, "full coverage = every eligible cell");

  const half = limewashAspect(occ, { ...OPTS, coverage: 0.5 });
  const ratio = half.report.painted / half.report.eligible;
  assert.ok(ratio > 0.3 && ratio < 0.7, `~half painted (${ratio.toFixed(2)})`);
  // contiguity: painted cells of each row form runs of length ≥ minRun (rows are along x)
  const byRow = new Map();
  for (const p of half.placements) {
    if (!byRow.has(p.pos[1])) byRow.set(p.pos[1], []);
    byRow.get(p.pos[1]).push(p.pos[0]);
  }
  for (const [y, xs] of byRow) {
    xs.sort((a, b) => a - b);
    let run = 1;
    const runs = [];
    for (let i = 1; i <= xs.length; i++) {
      if (xs[i] === xs[i - 1] + 1) run++;
      else { runs.push(run); run = 1; }
    }
    assert.ok(runs.every((r) => r >= OPTS.minRun), `row y=${y} runs ${runs} all ≥ minRun`);
  }
});

test("LW5 idempotent: the second pass emits zero placements (stable chunk grid)", () => {
  const base = cottageShell();
  const occ = occupancyFromCells(base);
  const half = limewashAspect(occ, { ...OPTS, coverage: 0.5 });
  const washed = occupancyFromCells(base.map((c) => {
    const hit = half.placements.find((p) => p.pos.join() === c.pos.join());
    return hit ? { ...c, block: "white_terracotta" } : c;
  }));
  const second = limewashAspect(washed, { ...OPTS, coverage: 0.5 });
  assert.equal(second.placements.length, 0, "re-run is a no-op");
  assert.ok(second.report.alreadyCoated > 0, "the existing coat is recognized, not repainted");
});

test("LW6 report counts eligible/painted/preserved; fail-loud opts gates", () => {
  const occ = occupancyFromCells(cottageShell());
  const r = limewashAspect(occ, OPTS).report;
  assert.deepEqual(r.aspects, ["-z"]);
  assert.ok(r.eligible >= r.painted && r.painted > 0);
  assert.throws(() => limewashAspect(occ, { ...OPTS, block: "" }), /block/);
  assert.throws(() => limewashAspect(occ, { ...OPTS, aspects: [] }), /aspects/);
  assert.throws(() => limewashAspect(occ, { ...OPTS, aspects: ["+y"] }), /unknown direction/);
  assert.throws(() => limewashAspect(occ, { ...OPTS, coverage: 0 }), /coverage/);
  assert.throws(() => limewashAspect(occ, { ...OPTS, minRun: 0 }), /minRun/);
});
