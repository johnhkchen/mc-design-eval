import { test } from "node:test";
import assert from "node:assert/strict";
import { occupancyFromCells } from "../view/occupancy.mjs";
import {
  PROVISION_FIT_SCHEMA, fitProvision, serializeProvisionFit, reviveProvisionFit,
} from "./provision-fit.mjs";

// ---- synthetic evidence shells (component-decompose.test.mjs fixture style) ---------------------

/** Solid box: x∈[0,w), z∈[0,d), y∈[0,h). */
function boxCells(w, h, d, { x0 = 0, y0 = 0, z0 = 0, block = "minecraft:stone" } = {}) {
  const out = [];
  for (let x = x0; x < x0 + w; x++) {
    for (let y = y0; y < y0 + h; y++) {
      for (let z = z0; z < z0 + d; z++) out.push({ pos: [x, y, z], block });
    }
  }
  return out;
}

/** Gabled box: walls to y=wallTop, symmetric ridge along z (drop 1 per x-step off center). */
function gabledBox({ w = 13, d = 9, wallTop = 4 } = {}) {
  const out = boxCells(w, wallTop + 1, d);
  const mid = (w - 1) / 2;
  for (let x = 0; x < w; x++) {
    const top = wallTop + Math.ceil(mid - Math.abs(x - mid));
    for (let y = wallTop + 1; y <= top; y++) {
      for (let z = 0; z < d; z++) out.push({ pos: [x, y, z], block: "minecraft:oak_planks" });
    }
  }
  return out;
}

/** 1-thick wall at z=0 over x∈[0..10], y∈[0..8], holes punched per skip(x,y). */
function wallWith(skip) {
  const cells = [];
  for (let x = 0; x <= 10; x++) {
    for (let y = 0; y <= 8; y++) {
      if (skip(x, y)) continue;
      cells.push({ pos: [x, y, 0], block: "minecraft:stone" });
    }
  }
  return occupancyFromCells(cells);
}

// ---- the fit ------------------------------------------------------------------------------------

test("fitProvision: gabled box → one primary mass, eave-fitted wallTop, a sane gable roof", () => {
  const fit = fitProvision({ occ: occupancyFromCells(gabledBox()) });
  assert.equal(fit.schema, PROVISION_FIT_SCHEMA);

  assert.equal(fit.masses.length, 1);
  const m = fit.masses[0];
  assert.equal(m.role, "primary");
  assert.equal(m.footprint.area, 13 * 9);
  assert.equal(m.baseY, 0);

  const roof = fit.roofs.find((r) => r.massId === m.id);
  assert.ok(roof, "the mass carries a roof entry");
  assert.equal(roof.kind, "gable");
  assert.ok(roof.gables.length >= 1 && roof.gables.every((g) => g.sane));

  assert.equal(m.wallTopSource, "eave-fit");
  assert.ok(m.wallTop <= m.massTop, "fitted wallTop sits at/below the blob mass top");
  assert.ok(!fit.findings.some((f) => f.code === "roof-unfitted"));
  // no GLB reference passed — the limitation is NAMED, never silent
  assert.ok(fit.findings.some((f) => f.code === "glb-reference-missing"));
});

test("fitProvision: flat box → no roof hypothesis, walltop-default is a NAMED finding", () => {
  const fit = fitProvision({ occ: occupancyFromCells(boxCells(8, 5, 6)) });
  assert.equal(fit.masses.length, 1);
  const m = fit.masses[0];
  assert.equal(m.wallTopSource, "mass-top");
  assert.equal(m.wallTop, 4, "walls generate to the blob mass top");
  assert.ok(m.findings.some((f) => f.code === "walltop-default"), "the default is registered");
  assert.ok(fit.roofs.every((r) => r.massId !== m.id || r.kind !== "gable"),
    "no gable invented over a flat top");
});

test("fitProvision: openings flow through the head fitter; refused heads carry their refusal", () => {
  const occ = wallWith((x, y) =>
    (y >= 4 && y <= 5 && ((x >= 2 && x <= 3) || (x >= 7 && x <= 8))) || // two 2×2 windows
    (x === 5 && y <= 2));                                               // a 1×3 door
  const fit = fitProvision({ occ });
  const all = fit.openings.flatMap((g) => g.openings);
  assert.ok(all.length >= 3, `windows + door detected (got ${all.length})`);
  for (const op of all) {
    assert.ok(["arch", "flat", "none"].includes(op.head.kind), `head fitted or refused (${op.head.kind})`);
  }
  // Rule 1 bookkeeping: every refused head has a named finding in the flat list
  const refused = all.filter((op) => op.head.kind === "none").length;
  const named = fit.findings.filter((f) => f.stage === "opening-head-fit").length;
  assert.equal(named, refused, "one named finding per refused head — never silent");
});

test("fitProvision: throws without evidence occupancy", () => {
  assert.throws(() => fitProvision({}), /occ.*required/);
});

// ---- determinism + serialization -----------------------------------------------------------------

test("fitProvision: deterministic — two runs serialize byte-identically", () => {
  const cells = gabledBox();
  const a = serializeProvisionFit(fitProvision({ occ: occupancyFromCells(cells) }));
  const b = serializeProvisionFit(fitProvision({ occ: occupancyFromCells(cells) }));
  assert.equal(JSON.stringify(a), JSON.stringify(b));
});

test("serialize/revive: Sets round-trip through JSON (the regenerate-proof seam)", () => {
  const fit = fitProvision({ occ: occupancyFromCells(gabledBox()) });
  const gable = fit.roofs.find((r) => r.kind === "gable").gables[0];
  assert.ok(gable.footprint.cols instanceof Set && gable.footprint.cols.size > 0);

  const revived = reviveProvisionFit(JSON.parse(JSON.stringify(serializeProvisionFit(fit))));
  const rGable = revived.roofs.find((r) => r.kind === "gable").gables[0];
  assert.ok(rGable.footprint.cols instanceof Set);
  assert.deepEqual([...rGable.footprint.cols].sort(), [...gable.footprint.cols].sort());
  // and a re-serialization is byte-stable (sorted Sets)
  assert.equal(
    JSON.stringify(serializeProvisionFit(revived)),
    JSON.stringify(serializeProvisionFit(fit)));
});
