// Unit tests for idiom-card.mjs (T-124-01) — layout determinism, plot isolation, coverage, and
// the AJV gate on the assembled artifact (the offline half of the T-097 ladder).
import { test } from "node:test";
import assert from "node:assert/strict";

import { assertArtifact } from "../artifact.mjs";
import { IDIOM_CARD_SPECS, idiomCardLayout, idiomCard, cardCoverage } from "./idiom-card.mjs";

const PROVEN_STATE_KEYS = new Set(["facing", "half", "shape", "type"]);

test("every registry construct idiom appears on the card (completeness pin)", () => {
  const { missing, constructs } = cardCoverage();
  assert.deepEqual(missing, [], `constructs not carded: ${missing.join(", ")} of ${constructs.join(", ")}`);
  // and the orientation sweeps are present
  const ids = new Set(IDIOM_CARD_SPECS.map((s) => s.id));
  for (const want of ["dormer-px", "dormer-nx", "dormer-pz", "dormer-nz", "jetty-xp", "jetty-xn", "jetty-zp", "jetty-zn", "chimney-crown", "chimney-slab", "gable-ridge-x", "gable-ridge-z"]) {
    assert.ok(ids.has(want), `missing card spec ${want}`);
  }
});

test("layout: plots sit above the baseplate, do not overlap, and stay in their plot box", () => {
  const { cells, plots, baseplate } = idiomCardLayout();
  assert.equal(plots.length, IDIOM_CARD_SPECS.length);
  const seen = new Map();
  for (const c of cells) {
    assert.ok(c.pos[1] >= 1, `cell below the plot plane: ${c.pos}`);
    const k = c.pos.join(",");
    assert.ok(!seen.has(k), `overlapping plots at ${k} (${seen.get(k)} vs ${c.block})`);
    seen.set(k, c.block);
  }
  // every cell lies inside some plot's box (translated bbox)
  for (const c of cells) {
    const inside = plots.some((p) =>
      c.pos[0] >= p.origin[0] && c.pos[0] < p.origin[0] + p.size[0] &&
      c.pos[1] >= p.origin[1] && c.pos[1] < p.origin[1] + p.size[1] &&
      c.pos[2] >= p.origin[2] && c.pos[2] < p.origin[2] + p.size[2]);
    assert.ok(inside, `cell outside every plot: ${c.pos} ${c.block}`);
  }
  assert.equal(baseplate.from[1], 0);
  // determinism
  assert.deepEqual(idiomCardLayout(), { cells, plots, baseplate });
});

test("every emitted state is from the proven vocabulary", () => {
  const { cells } = idiomCardLayout();
  for (const c of cells) {
    if (!c.state) continue;
    for (const k of Object.keys(c.state)) assert.ok(PROVEN_STATE_KEYS.has(k), `${c.block}: ${k}`);
  }
});

test("the assembled card passes the live AJV artifact gate", () => {
  const card = assertArtifact(idiomCard());
  assert.equal(card.metadata.trial_id, "idiom-card");
  assert.ok(card.placements.length > 100);
  assert.ok(card.palette.manifest.every((b) => b.startsWith("minecraft:")));
  // byte-determinism of the assembly
  assert.deepEqual(idiomCard(), idiomCard());
});

test("a realization that produces no cells is a loud failure", () => {
  assert.throws(
    () => idiomCardLayout([{ id: "bad", idiom: "plinth", spec: { footprint: { x0: 0, x1: 1, z0: 0, z1: 1 }, y0: 0, courses: 0, block: "stone" } }]),
    /courses/,
  );
});
