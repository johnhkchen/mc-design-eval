// Unit tests — building-program contract (T-125-01). Pure: the only IO is the committed-file
// class (program schema + the committed style pack), the style-pack.test.mjs precedent.

import { test } from "node:test";
import assert from "node:assert/strict";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import {
  BUILDING_PROGRAM_SCHEMA,
  PROGRAM_REPLY_BUDGET,
  ROOF_LAYOUTS,
  headRows,
  parseBuildingProgram,
  assertBuildingProgram,
  validateProgramAgainstPack,
} from "./program.mjs";
import { loadStylePack } from "../pack/style-pack.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const pack = loadStylePack(resolve(here, "..", "..", "packs", "rustic.json"));

/** A full synthetic program exercising every optional branch. Subject-agnostic. */
function makeProgram(mutate = () => {}) {
  const p = {
    schema: BUILDING_PROGRAM_SCHEMA,
    subject: "test-subject",
    pack: "rustic",
    reading: { summary: "two-storey banded mass, gable roof", symmetryClaim: { axis: "x" } },
    masses: [
      {
        id: "main",
        rect: { x0: 0, z0: 0, w: 13, d: 9 },
        storeys: 2,
        storeyHeight: 4,
        walls: {
          treatment: "timber-frame",
          ground: { role: "wall.field.ground" },
          upper: { role: "wall.infill.upper" },
          dressing: { role: "wall.dressing" },
        },
        plinth: { courses: 1, role: "wall.dressing" },
        jetty: { walls: ["+z"], beamRole: "roof.trim", joistRole: "frame.timber" },
        roof: {
          idiom: "roof.gable",
          ridgeAxis: "x",
          pitchClass: 1,
          fieldRole: "roof.field",
          trimRole: "roof.trim",
          gableRole: "wall.infill.upper",
          dormers: { count: 2, wall: "+z" },
        },
        chimney: { role: "wall.field.ground", capRole: "chimney.cap", atEnd: "hi" },
        openings: [
          { wall: "+z", kind: "door", count: 1, w: 2, h: 3, sill: 0, head: "flat", headRole: "wall.dressing" },
          { wall: "+z", kind: "window", count: 2, w: 1, h: 2, sill: 5, head: null, headRole: null },
        ],
      },
    ],
  };
  mutate(p);
  return p;
}

test("schema gate accepts the full synthetic program", () => {
  const r = parseBuildingProgram(makeProgram());
  assert.equal(r.ok, true);
  assert.equal(r.program.masses.length, 1);
});

test("schema gate accepts JSON text input", () => {
  const r = parseBuildingProgram(JSON.stringify(makeProgram()));
  assert.equal(r.ok, true);
});

test("schema gate rejects: bad schema id, extra key, fractional rect, empty masses, non-JSON", () => {
  for (const [mutate, code] of [
    [(p) => { p.schema = "building-program/v2"; }, "schema_invalid"],
    [(p) => { p.extra = 1; }, "schema_invalid"],
    [(p) => { p.masses[0].rect.w = 9.5; }, "schema_invalid"],
    [(p) => { p.masses = []; }, "schema_invalid"],
  ]) {
    const r = parseBuildingProgram(makeProgram(mutate));
    assert.equal(r.ok, false);
    assert.equal(r.code, code);
  }
  const r = parseBuildingProgram("not json {");
  assert.equal(r.ok, false);
  assert.equal(r.code, "invalid_json");
});

test("assertBuildingProgram throws with located errors", () => {
  assert.throws(
    () => assertBuildingProgram(makeProgram((p) => { p.masses[0].roof.pitchClass = 0; })),
    /schema_invalid/,
  );
});

test("pack validation accepts the in-vocabulary program", () => {
  const { ok, findings } = validateProgramAgainstPack(makeProgram(), pack);
  assert.deepEqual(findings, []);
  assert.equal(ok, true);
});

test("off-vocabulary is rejected: unknown role, foreign pack, off-pack pitch", () => {
  for (const [mutate, re] of [
    [(p) => { p.masses[0].walls.ground.role = "wall.marble"; }, /not in the pack palette/],
    [(p) => { p.pack = "baroque"; }, /validated against/],
    [(p) => { p.masses[0].roof.pitchClass = 2; }, /outside the pack vocabulary/],
  ]) {
    const { ok, findings } = validateProgramAgainstPack(makeProgram(mutate), pack);
    assert.equal(ok, false);
    assert.match(findings.map((f) => f.msg).join("\n"), re);
  }
});

test("roof idiom must be a realizable ridge-coherent pack construct", () => {
  const offRegistry = validateProgramAgainstPack(
    makeProgram((p) => { p.masses[0].roof.idiom = "roof.onion"; }), pack);
  assert.match(offRegistry.findings[0].msg, /not a realizable roof/);

  const passAsRoof = validateProgramAgainstPack(
    makeProgram((p) => { p.masses[0].roof.idiom = "hollow"; }), pack);
  assert.match(passAsRoof.findings[0].msg, /not a realizable roof/);

  const noRidge = validateProgramAgainstPack(
    makeProgram((p) => { delete p.masses[0].roof.ridgeAxis; }), pack);
  assert.match(noRidge.findings[0].msg, /ridgeAxis is required/);

  const pyramidNoRidge = validateProgramAgainstPack(
    makeProgram((p) => {
      delete p.masses[0].roof.ridgeAxis;
      p.masses[0].roof.idiom = "roof.pyramid";
      p.masses[0].roof.dormers = null;
    }), pack);
  assert.deepEqual(pyramidNoRidge.findings, []);
});

test("proportions: storeyHeight band, jetty needs an upper storey", () => {
  const tall = validateProgramAgainstPack(
    makeProgram((p) => { p.masses[0].storeyHeight = 5; }), pack);
  assert.match(tall.findings[0].msg, /outside the pack band/);

  const flatJetty = validateProgramAgainstPack(
    makeProgram((p) => { p.masses[0].storeys = 1; p.masses[0].openings = []; }), pack);
  assert.match(flatJetty.findings.map((f) => f.msg).join("\n"), /jetty needs an upper storey/);
});

test("treatment must be a pack PASS idiom", () => {
  const construct = validateProgramAgainstPack(
    makeProgram((p) => { p.masses[0].walls.treatment = "dormer"; }), pack);
  assert.match(construct.findings[0].msg, /not a pass idiom/);

  const unknown = validateProgramAgainstPack(
    makeProgram((p) => { p.masses[0].walls.treatment = "wattle"; }), pack);
  assert.match(unknown.findings[0].msg, /not in the pack/);

  const none = validateProgramAgainstPack(
    makeProgram((p) => { p.masses[0].walls.treatment = null; }), pack);
  assert.equal(none.ok, true);
});

test("openings must fit the wall: lateral at min spacing, vertical incl. head clearance", () => {
  const wide = validateProgramAgainstPack(
    makeProgram((p) => { p.masses[0].openings[1].count = 5; }), pack); // 5×1 + 4×2 = 13 > w-2 = 11
  assert.match(wide.findings[0].msg, /wall offers 11/);

  const tallArch = validateProgramAgainstPack(
    makeProgram((p) => { p.masses[0].openings[0] = { wall: "+z", kind: "door", count: 1, w: 4, h: 7, sill: 0, head: "arch", headRole: "wall.dressing" }; }), pack);
  assert.match(tallArch.findings[0].msg, /above the wall top 8/); // 7 + ceil(4/2) = 9 > 2×4
});

test("headRows: arch rises with width, flat is one lintel row, bare is zero", () => {
  assert.equal(headRows("arch", 4), 2);
  assert.equal(headRows("arch", 3), 2);
  assert.equal(headRows("flat", 5), 1);
  assert.equal(headRows(null, 2), 0);
});

test("dormers must fit the ridge span; dormers demand a ridge", () => {
  const many = validateProgramAgainstPack(
    makeProgram((p) => { p.masses[0].roof.dormers.count = 3; }), pack); // 3×3+2 = 11 ≤ w-2 = 11 passes; 4 → 14 fails
  assert.equal(many.ok, true);
  const four = validateProgramAgainstPack(
    makeProgram((p) => { p.masses[0].roof.dormers.count = 4; }), pack);
  assert.match(four.findings[0].msg, /the ridge span offers/);

  const onPyramid = validateProgramAgainstPack(
    makeProgram((p) => { p.masses[0].roof.idiom = "roof.pyramid"; }), pack);
  assert.match(onPyramid.findings.map((f) => f.msg).join("\n"), /dormers need a ridge-bearing roof/);
});

test("multi-mass: ids unique, plan must be connected", () => {
  const wing = (id, rect) => ({
    ...makeProgram().masses[0],
    id,
    rect,
    jetty: null,
    chimney: null,
    roof: { idiom: "roof.gable", ridgeAxis: "z", pitchClass: 1, fieldRole: "roof.field", trimRole: null, gableRole: null, dormers: null },
    openings: [],
  });
  const touching = validateProgramAgainstPack(
    makeProgram((p) => { p.masses.push(wing("wing", { x0: 13, z0: 2, w: 5, d: 5 })); }), pack);
  assert.equal(touching.ok, true);

  const detached = validateProgramAgainstPack(
    makeProgram((p) => { p.masses.push(wing("wing", { x0: 30, z0: 30, w: 5, d: 5 })); }), pack);
  assert.match(detached.findings[0].msg, /connected plan/);

  const dup = validateProgramAgainstPack(
    makeProgram((p) => { p.masses.push(wing("main", { x0: 13, z0: 2, w: 5, d: 5 })); }), pack);
  assert.match(dup.findings[0].msg, /duplicate mass id/);
});

test("the declared budget rides the T-114 bound", () => {
  assert.equal(PROGRAM_REPLY_BUDGET, 3);
  assert.equal(ROOF_LAYOUTS["roof.gable"].gableEnds, true);
});
