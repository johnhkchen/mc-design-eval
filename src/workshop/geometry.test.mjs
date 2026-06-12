// Unit tests — the geometry levers (T-136-01, E-33). Synthetic building-program fixtures (the
// measured-program.test.mjs pattern), the REAL rustic and saltcrag packs (no synthetic pack —
// the vocabulary gates under test are the packs' own). PURE: no GL, no model, no IO writes.

import { test } from "node:test";
import assert from "node:assert/strict";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { loadStylePack } from "../pack/style-pack.mjs";
import { assertBuildingProgram } from "../recognition/program.mjs";
import { silhouetteRatios } from "../recognition/measured-program.mjs";
import { realizeProgram } from "./program.mjs";
import {
  GEOMETRY_PARAM_KEYS, resolveMass, applyGeometryAdjust, substituteMass, prunePaint,
} from "./geometry.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const rustic = loadStylePack(resolve(here, "..", "..", "packs", "rustic.json"));
const saltcrag = loadStylePack(resolve(here, "..", "..", "packs", "saltcrag.json"));

const BUDGET = Object.freeze({ rounds: 6 });

/** Two touching gabled masses against the rustic vocabulary. */
function makeSource(mutate = () => {}) {
  const mass = (id, rect, ridgeAxis) => ({
    id, rect, storeys: 2, storeyHeight: 4,
    walls: { ground: { role: "wall.field.ground" }, upper: { role: "wall.infill.upper" }, dressing: { role: "wall.dressing" } },
    roof: { idiom: "roof.gable", ridgeAxis, pitchClass: 1, fieldRole: "roof.field", trimRole: null, gableRole: null },
    openings: [
      { wall: "+z", kind: "door", count: 1, w: 2, h: 3, sill: 0, head: "flat", headRole: "wall.dressing" },
    ],
  });
  const p = {
    schema: "building-program/v1",
    subject: "test-subject",
    pack: "rustic",
    reading: { summary: "synthetic two-mass gabled fixture" },
    masses: [
      mass("main", { x0: 0, z0: 0, w: 13, d: 9 }, "x"),
      mass("main-annex", { x0: 13, z0: 2, w: 5, d: 5 }, "z"),
    ],
  };
  mutate(p);
  return assertBuildingProgram(p);
}

const ctx = (over = {}) => ({ source: makeSource(), pack: rustic, budget: BUDGET, ...over });

test("G1 eaveHeight lever: factorized, recompiled coherently, budget preserved", () => {
  const { program, source } = applyGeometryAdjust(ctx(), { massId: "main", params: { eaveHeight: 16 } });
  const m = source.masses.find((x) => x.id === "main");
  assert.equal(m.storeys * m.storeyHeight, 16, "factorEave hits the measured eave exactly");
  const shell = program.elements.find((e) => e.id === "main-shell");
  const roof = program.elements.find((e) => e.id === "main-roof");
  assert.equal(shell.spec.height, 16, "shell height moved");
  assert.equal(roof.spec.eaveY, 16, "roof eave moved WITH the shell");
  assert.ok(roof.spec.ridgeY > 16, "ridge re-derived above the new eave");
  const roofBand = program.declarations.bands.find((b) => b.name === "roof");
  assert.ok(roofBand.yRange[0] <= 16 && roofBand.yRange[1] >= roof.spec.ridgeY, "bands re-declared");
  assert.deepEqual(program.budget, BUDGET, "live budget preserved through recompile");
  assert.equal(program.schema, "workshop-program/v1");
});

test("G2 width/depth lever: rect resizes at fixed origin, ridge rise re-derives", () => {
  const before = applyGeometryAdjust(ctx(), { massId: "main", params: { depth: 9 } });
  const after = applyGeometryAdjust(ctx(), { massId: "main", params: { depth: 15 } });
  const roofY = (r) => r.program.elements.find((e) => e.id === "main-roof").spec.ridgeY;
  assert.equal(after.source.masses[0].rect.z0, 0, "origin fixed");
  assert.equal(after.source.masses[0].rect.d, 15);
  assert.ok(roofY(after) > roofY(before), "wider perpendicular span → taller ridge at the same pitch");
});

test("G3 pitchClass outside the pack vocabulary throws (the gate's message names it)", () => {
  // T-141-01: rustic now carries [1, 2]; the surviving forbidden class is 3 — the message lists
  // the widened vocabulary, the honest refusal for what the pack still does not realize.
  assert.throws(
    () => applyGeometryAdjust(ctx(), { massId: "main", params: { pitchClass: 3 } }),
    /pitchClass 3 is outside the pack vocabulary \[1, 2\]/,
  );
});

test("G3b pitchClass change lands when the pack vocabulary carries it (saltcrag)", () => {
  const source = makeSource((p) => {
    p.pack = "saltcrag";
    for (const m of p.masses) {
      m.walls = { ground: { role: "wall.field.ground" }, upper: { role: "wall.field.upper" } };
      m.roof = { ...m.roof, gableRole: null, trimRole: null };
      m.openings.forEach((o) => { o.headRole = "opening.lintel"; });
    }
  });
  const { program, source: revised } = applyGeometryAdjust({ source, pack: saltcrag, budget: BUDGET },
    { massId: "main", params: { pitchClass: 2 } });
  const roof = program.elements.find((e) => e.id === "main-roof");
  assert.equal(roof.spec.pitch, 2, "the steeper class compiled through");
  // T-138-01: a >1 aim crosses the door — without the re-aim, realizeProgram refuses
  // (roof.gable's 45° contract) and the steep unlock is unreachable through the lever
  assert.equal(revised.masses[0].roof.idiom, "roof.gable.steep", "the aim re-aimed the idiom through the steep door");
  assert.equal(roof.idiom, "roof.gable.steep", "the compiled element carries the steep door");
  const { cells } = realizeProgram(program);
  assert.ok(cells.length > 0, "the steepened program realizes (mixed block/stair courses)");
});

test("G3c rustic's new class-2 aim lands across the steep door (T-141-01 headroom)", () => {
  // E-33 left the barns' class-1 pitch ceiling as the one surviving proportion gap; T-141-01 adds
  // class 2 to the rustic pack. The aim now crosses the steep door on rustic's OWN vocabulary
  // (mirrors G3b's saltcrag proof) instead of recording apply-failed.
  const { program, source: revised } = applyGeometryAdjust(ctx(),
    { massId: "main", params: { pitchClass: 2 } });
  const roof = program.elements.find((e) => e.id === "main-roof");
  assert.equal(roof.spec.pitch, 2, "the steeper class compiled through");
  assert.equal(revised.masses[0].roof.idiom, "roof.gable.steep", "the aim re-aimed the idiom through the steep door");
  assert.equal(roof.idiom, "roof.gable.steep", "the compiled element carries the steep door");
  assert.ok(realizeProgram(program).cells.length > 0, "the steepened rustic program realizes");
});

test("G3e cottage wall-raise round-trips: eaveHeight 10 → storeyHeight 5 (T-141-01)", () => {
  // The move the rustic storeyHeight band {3,4} refused in 5/6 E-33 workshop rounds. With the band
  // widened to {3,5}, the measured eave factorizes into storeys 2 × storeyHeight 5 and recompiles
  // coherently — the previously-refused wall-raise now lands through adjust-params.
  const { program, source } = applyGeometryAdjust(ctx(), { massId: "main", params: { eaveHeight: 10 } });
  const m = source.masses.find((x) => x.id === "main");
  assert.equal(m.storeys, 2, "storeys held");
  assert.equal(m.storeyHeight, 5, "the taller storey column now in band [3, 5]");
  const shell = program.elements.find((e) => e.id === "main-shell");
  const roof = program.elements.find((e) => e.id === "main-roof");
  assert.equal(shell.spec.height, 10, "shell rose to the new eave");
  assert.equal(roof.spec.eaveY, 10, "roof eave moved WITH the shell");
  assert.ok(realizeProgram(program).cells.length > 0, "the taller program realizes");
});

test("G3f the pack band is the binding constraint, not a hidden schema ceiling (T-141-01)", () => {
  // storeyHeight 6 is SCHEMA-valid (building-program max 6) but outside the rustic band [3, 5]:
  // the refusal must name the PACK row, never a schema ceiling (the T-138-02 conflation). The pack
  // stays strictly tighter than the schema so a refusal is legible to the model.
  assert.throws(
    () => applyGeometryAdjust(ctx(), { massId: "main", params: { storeyHeight: 6 } }),
    /storeyHeight.*6 outside the pack band \[3, 5\]/,
  );
});

test("G3d lowering a steep roof back to a legacy class returns through the base door", () => {
  const source = makeSource((p) => {
    p.pack = "saltcrag";
    for (const m of p.masses) {
      m.walls = { ground: { role: "wall.field.ground" }, upper: { role: "wall.field.upper" } };
      m.roof = { ...m.roof, idiom: "roof.gable.steep", pitchClass: 2, gableRole: null, trimRole: null };
      m.openings.forEach((o) => { o.headRole = "opening.lintel"; });
    }
  });
  const { program, source: revised } = applyGeometryAdjust({ source, pack: saltcrag, budget: BUDGET },
    { massId: "main", params: { pitchClass: 0.5 } });
  assert.equal(revised.masses[0].roof.idiom, "roof.gable", "down-aim returned to the base door");
  assert.equal(program.elements.find((e) => e.id === "main-roof").spec.pitch, 0.5);
  assert.ok(realizeProgram(program).cells.length > 0);
});

test("G4 a lever that detaches the plan throws via the connectivity gate", () => {
  assert.throws(
    () => applyGeometryAdjust(ctx(), { massId: "main", params: { width: 10 } }),
    /do not form one connected plan/,
  );
});

test("G5 lever vocabulary: unknown keys, non-numbers, eaveHeight exclusivity", () => {
  assert.throws(() => applyGeometryAdjust(ctx(), { massId: "main", params: { ridgeY: 20 } }),
    new RegExp(`unknown geometry param.*${GEOMETRY_PARAM_KEYS.join(", ")}`));
  assert.throws(() => applyGeometryAdjust(ctx(), { massId: "main", params: { width: "wide" } }),
    /must be a finite number/);
  assert.throws(() => applyGeometryAdjust(ctx(), { massId: "main", params: { eaveHeight: 12, storeys: 3 } }),
    /exclusive/);
  assert.throws(() => applyGeometryAdjust(ctx(), { massId: "ghost", params: { width: 9 } }),
    /not in the source program/);
  assert.throws(() => applyGeometryAdjust({ source: null, pack: rustic, budget: BUDGET },
    { massId: "main", params: { width: 9 } }), /no source program/);
});

test("G6 substituteMass: a valid fragment recompiles; off-vocabulary or id-swapped fragments throw", () => {
  const c = ctx();
  const fragment = structuredClone(c.source.masses[0]);
  fragment.storeys = 3;
  fragment.storeyHeight = 4;
  const { program, source } = substituteMass(c, { massId: "main", mass: fragment });
  assert.equal(source.masses[0].storeys, 3);
  assert.equal(program.elements.find((e) => e.id === "main-shell").spec.height, 12);
  const bad = structuredClone(fragment);
  bad.roof.fieldRole = "roof.nonsense";
  assert.throws(() => substituteMass(c, { massId: "main", mass: bad }), /not in the pack palette/);
  const renamed = structuredClone(fragment);
  renamed.id = "other";
  assert.throws(() => substituteMass(c, { massId: "main", mass: renamed }), /must keep the named part's id/);
});

test("G7 prunePaint keeps in-place recolors, drops orphans, reports the count", () => {
  const { program } = applyGeometryAdjust(ctx(), { massId: "main", params: { eaveHeight: 8 } });
  const { cells } = realizeProgram(program);
  const onWall = cells[0].pos;
  const paint = [
    { op: "voxel", pos: [...onWall], block: "minecraft:dark_oak_log" },
    { op: "voxel", pos: [40, 40, 40], block: "minecraft:dark_oak_log" },
  ];
  const r = prunePaint(program, paint);
  assert.equal(r.pruned, 1);
  assert.deepEqual(r.paint, [paint[0]], "order-preserving keep");
  assert.deepEqual(prunePaint(program, []), { paint: [], pruned: 0 });
});

test("G8 the proportion declaration rides through the recompile (T-135's gate stays armed)", () => {
  const proportions = {
    schema: "silhouette-proportion/v1",
    targets: { ridgeToEave: 1.4, roofShare: 0.29, aspect: 1.19 },
    sources: { ridgeToEave: "sketch", roofShare: "sketch", aspect: "sketch" },
    tolerance: 0.1,
  };
  const armed = applyGeometryAdjust(ctx({ proportions }), { massId: "main", params: { eaveHeight: 16 } });
  assert.deepEqual(armed.program.declarations.proportions, proportions,
    "targets carried verbatim — compile knows nothing of them");
  const viaFragment = substituteMass({ ...ctx({ proportions }) },
    { massId: "main", mass: structuredClone(makeSource().masses[0]) });
  assert.deepEqual(viaFragment.program.declarations.proportions, proportions);
  const unarmed = applyGeometryAdjust(ctx(), { massId: "main", params: { eaveHeight: 16 } });
  assert.equal(unarmed.program.declarations.proportions, undefined,
    "no declaration, none invented (declared, never inferred)");
});

test("G9 resolveMass: direct id, element-id prefix, longest match, unknown", () => {
  const source = makeSource();
  assert.equal(resolveMass(source, "main").massId, "main");
  assert.equal(resolveMass(source, "main-roof").massId, "main", "compiled element id resolves to its mass");
  assert.equal(resolveMass(source, "main-annex-shell").massId, "main-annex", "longest mass id wins");
  assert.equal(resolveMass(source, "ghost"), null);
  assert.equal(resolveMass(null, "main"), null);
});

test("G10 determinism: the same lever twice is byte-identical", () => {
  const a = applyGeometryAdjust(ctx(), { massId: "main", params: { eaveHeight: 16, depth: 11 } });
  const b = applyGeometryAdjust(ctx(), { massId: "main", params: { eaveHeight: 16, depth: 11 } });
  assert.equal(JSON.stringify(a.program), JSON.stringify(b.program));
  assert.equal(JSON.stringify(a.source), JSON.stringify(b.source));
  assert.equal(JSON.stringify(silhouetteRatios(a.program)), JSON.stringify(silhouetteRatios(b.program)));
});
