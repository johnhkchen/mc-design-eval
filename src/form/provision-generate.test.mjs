import { test } from "node:test";
import assert from "node:assert/strict";
import { occupancyFromCells } from "../view/occupancy.mjs";
import { assertArtifact } from "../artifact.mjs";
import { fitProvision, serializeProvisionFit, reviveProvisionFit } from "./provision-fit.mjs";
import {
  PROVISION_GENERATE_SCHEMA, PROVENANCE_SOURCES,
  generateProvision, assertGeneratedProvenance,
} from "./provision-generate.mjs";

// ---- fixtures -----------------------------------------------------------------------------------

function boxCells(w, h, d, { x0 = 0, y0 = 0, z0 = 0, block = "minecraft:stone" } = {}) {
  const out = [];
  for (let x = x0; x < x0 + w; x++) {
    for (let y = y0; y < y0 + h; y++) {
      for (let z = z0; z < z0 + d; z++) out.push({ pos: [x, y, z], block });
    }
  }
  return out;
}

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

const FAMILY = { field: "dark_oak_planks", stairs: "dark_oak_stairs", slab: "dark_oak_slab" };
const POLICY = { base: { dominant: "stone" }, roof: { dominant: "dark_oak_planks" } };

/** Hand-built fit record (fit output is data — the generator's contract, not decompose's). */
const flatFit = ({ openings = [], roofs = [] } = {}) => ({
  masses: [{
    id: "mass-0", role: "primary",
    runs: Array.from({ length: 6 }, (_, z) => ({ z, x0: 0, x1: 7 })),
    footprint: { bbox: { minX: 0, maxX: 7, minZ: 0, maxZ: 5 }, area: 48 },
    baseY: 0, massTop: 5, wallTop: 5, wallTopSource: "mass-top", heightDisagreement: 0, findings: [],
  }],
  roofs, openings, findings: [],
});

// ---- end-to-end: fit → generate -------------------------------------------------------------------

test("generateProvision: gabled-box fit → AJV-valid artifact, every cell provenance-tagged", () => {
  const fit = fitProvision({ occ: occupancyFromCells(gabledBox()) });
  const gen = generateProvision(fit, { family: FAMILY, policy: POLICY });
  assert.equal(gen.schema, PROVISION_GENERATE_SCHEMA);
  assertArtifact(gen.artifact);

  const check = assertGeneratedProvenance(gen.artifact, gen.provenance);
  assert.equal(check.passed, true);
  assert.equal(check.cells, gen.artifact.placements.length);
  assert.ok(check.bySource.mass > 0, "wall cells generated");
  assert.ok(check.bySource.roof > 0, "roof cells generated from the fitted gable");
  for (const kind of Object.keys(check.bySource)) assert.ok(PROVENANCE_SOURCES.includes(kind));

  // roof courses sit above the fitted wallTop only
  const wallTop = fit.masses[0].wallTop;
  for (const p of gen.artifact.placements) {
    if (p.block === "minecraft:dark_oak_stairs") assert.ok(p.pos[1] >= wallTop, "stairs in the roof band");
  }
  assert.ok(gen.roofPlan, "roof plan emitted for the grammar's component seam");
  assert.ok(gen.roofPlan.footprintCols.size > 0);
});

test("zero-blob check: a planted foreign cell REFUSES (provenance, not set-intersection)", () => {
  const fit = fitProvision({ occ: occupancyFromCells(gabledBox()) });
  const gen = generateProvision(fit, { family: FAMILY, policy: POLICY });

  const planted = {
    ...gen.artifact,
    placements: [...gen.artifact.placements, { op: "voxel", pos: [99, 99, 99], block: "minecraft:stone" }],
  };
  assert.throws(() => assertGeneratedProvenance(planted, gen.provenance), /no generator provenance/);

  // and a provenance entry with no artifact cell is count drift, equally refused
  const dropped = { ...gen.artifact, placements: gen.artifact.placements.slice(0, -1) };
  assert.throws(() => assertGeneratedProvenance(dropped, gen.provenance), /absent from the artifact/);

  // an out-of-vocabulary source is refused even when the cell exists
  const bad = new Map(gen.provenance.byCell);
  bad.set(gen.artifact.placements[0].pos.join(","), "blob:sampled");
  assert.throws(() => assertGeneratedProvenance(gen.artifact, { byCell: bad }), /closed vocabulary/);
});

// ---- carving (exclusion, never burial) ------------------------------------------------------------

test("apertures carve THROUGH the wall slab: a true hole the openings detector can see", () => {
  const fit = flatFit({
    openings: [{
      id: "og-0", massId: "mass-0", dir: "-z", kind: "door",
      openings: [{
        extent: { axis: "x", range: [3, 4], yRange: [0, 3] }, sillY: 0, crown: 3, width: 2, height: 4,
        head: { kind: "flat", spec: { level: 3 }, fitError: { rmse: 0 } },
      }],
    }],
  });
  const gen = generateProvision(fit, { family: FAMILY, policy: POLICY });
  assertArtifact(gen.artifact);
  const occ = gen.occ;
  for (let x = 3; x <= 4; x++) {
    for (let y = 0; y <= 3; y++) {
      assert.equal(occ.has(x, y, 0), false, `carved at face (${x},${y},0)`);
      assert.equal(occ.has(x, y, 1), false, `carved through the slab (${x},${y},1)`);
    }
  }
  assert.equal(occ.has(2, 1, 0), true, "jamb stands");
  assert.equal(occ.has(3, 4, 0), true, "head course stands above the carve");
  // hollow masses: interior is open (no floor slab — the zone-map anchor needs the eave widest),
  // the far wall slab stands
  assert.equal(occ.has(3, 2, 2), false, "interior hollow behind the wall slab");
  assert.equal(occ.has(3, 0, 2), false, "no interior floor slab");
  assert.equal(occ.has(3, 2, 5), true, "far wall slab stands");
  assert.ok(gen.counts.carved > 0);
  assertGeneratedProvenance(gen.artifact, gen.provenance);
});

test("apertures carve the fitted ARCH curve: center column rises above the springers", () => {
  const fit = flatFit({
    openings: [{
      id: "og-0", massId: "mass-0", dir: "-z", kind: "door",
      openings: [{
        // arc head over x∈[2,6]: center (4, 1), radius 2.2 —
        // topY(at) = floor(1 + √(r²−(at−4)²)): at 4 → 3; at 3/5 → 2; at 2/6 → 1
        extent: { axis: "x", range: [2, 6], yRange: [0, 4] }, sillY: 0, crown: 4, width: 5, height: 5,
        head: { kind: "arch", spec: { center: [4, 1], radius: 2.2, span: { axis: "x", range: [2, 6] } },
          fitError: { rmse: 0.1 } },
      }],
    }],
  });
  const gen = generateProvision(fit, { family: FAMILY, policy: POLICY });
  const occ = gen.occ;
  const carvedTop = (x) => {
    let top = -1;
    for (let y = 0; y <= 5; y++) if (!occ.has(x, y, 0)) top = y;
    return top;
  };
  assert.ok(carvedTop(4) > carvedTop(2), "the arc carves higher at the crown than at the springer");
  assert.equal(occ.has(4, 5, 0), true, "above the arc the wall stands");
  assertGeneratedProvenance(gen.artifact, gen.provenance);
});

// ---- the named limitations -------------------------------------------------------------------------

test("flat-cap roof (refused fit): no roof cells, mass stands flat-topped at its own top", () => {
  const fit = flatFit({
    roofs: [{ massId: "mass-0", role: "primary", kind: "flat-cap", gables: [], ridgeFit: [],
      findings: [{ code: "roof-unfitted", where: "mass-0", detail: "test" }] }],
  });
  const gen = generateProvision(fit, { family: FAMILY, policy: POLICY });
  assert.equal(gen.counts.roof, 0);
  assert.equal(gen.roofPlan, null);
  const maxY = Math.max(...gen.artifact.placements.map((p) => p.pos[1]));
  assert.equal(maxY, 5, "walls reach the registered mass top, nothing invented above");
});

test("missing course family on a fitted roof is a NAMED finding, mass generated flat", () => {
  const fit = fitProvision({ occ: occupancyFromCells(gabledBox()) });
  const gen = generateProvision(fit, { family: { field: null, stairs: null, slab: null }, policy: POLICY });
  assert.ok(gen.findings.some((f) => f.code === "roof-family-missing"));
  assert.equal(gen.counts.roof, 0);
});

test("storey bands paint walls per yRange; sheet courses carry the fascia block", () => {
  const fit = fitProvision({ occ: occupancyFromCells(gabledBox()) });
  const gen = generateProvision(fit, {
    family: FAMILY, policy: POLICY,
    bands: [{ yRange: [0, 1], block: "stone_bricks" }, { yRange: [2, 9], block: "white_terracotta" }],
    sheetBlock: "dark_oak_planks",
  });
  const blocks = new Set(gen.artifact.placements.map((p) => p.block));
  assert.ok(blocks.has("minecraft:stone_bricks"), "band0 dominant present");
  assert.ok(blocks.has("minecraft:white_terracotta"), "band1 dominant present");
  for (const p of gen.artifact.placements) {
    if (p.block === "minecraft:stone_bricks") assert.ok(p.pos[1] <= 1, "band0 stays in its yRange");
  }
  assertGeneratedProvenance(gen.artifact, gen.provenance);
});

test("an unsupported protrusion is OMITTED with a named finding, never generated floating", () => {
  const base = flatFit();
  const fit = {
    ...base,
    masses: [...base.masses,
      { id: "mass-1", role: "protrusion", runs: [{ z: 2, x0: 2, x1: 3 }],
        footprint: { bbox: { minX: 2, maxX: 3, minZ: 2, maxZ: 2 }, area: 2 },
        baseY: 12, massTop: 15, wallTop: 15, wallTopSource: "mass-top", heightDisagreement: 0, findings: [] },
      { id: "mass-2", role: "protrusion", runs: [{ z: 0, x0: 0, x1: 0 }],
        footprint: { bbox: { minX: 0, maxX: 0, minZ: 0, maxZ: 0 }, area: 1 },
        baseY: 6, massTop: 8, wallTop: 8, wallTopSource: "mass-top", heightDisagreement: 0, findings: [] }],
  };
  const gen = generateProvision(fit, { family: FAMILY, policy: POLICY });
  assert.ok(gen.findings.some((f) => f.code === "mass-unsupported" && f.where === "mass-1"),
    "floating protrusion registered, not built");
  assert.equal(gen.occ.has(2, 12, 2), false, "no floating cells");
  assert.equal(gen.occ.has(0, 7, 0), true, "wall-supported protrusion (base y6 on wallTop-5 wall... ) generated");
  assertGeneratedProvenance(gen.artifact, gen.provenance);
});

// ---- determinism / the regenerate proof ------------------------------------------------------------

test("regenerate from the serialized fit record is byte-identical (the check's teeth)", () => {
  const fit = fitProvision({ occ: occupancyFromCells(gabledBox()) });
  const a = generateProvision(fit, { family: FAMILY, policy: POLICY });
  const revived = reviveProvisionFit(JSON.parse(JSON.stringify(serializeProvisionFit(fit))));
  const b = generateProvision(revived, { family: FAMILY, policy: POLICY });
  assert.equal(JSON.stringify(a.artifact), JSON.stringify(b.artifact));
  assert.deepEqual(a.provenance.bySource, b.provenance.bySource);
});
