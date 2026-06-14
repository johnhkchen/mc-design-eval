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
  openingLanes,
  parseBuildingProgram,
  assertBuildingProgram,
  validateProgramAgainstPack,
  facadeBounds,
  bandYRange,
  assertFacadeDiegetic,
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
    [(p) => { p.masses[0].roof.pitchClass = 3; }, /outside the pack vocabulary/], // T-141-01: rustic now carries [1, 2]; 3 stays off-vocabulary
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
  // T-141-01: rustic band widened to {3,5}; 6 is the value the pack now refuses (schema max is 6,
  // so the pack band — not the schema — is the binding constraint that names the refusal).
  const tall = validateProgramAgainstPack(
    makeProgram((p) => { p.masses[0].storeyHeight = 6; }), pack);
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

test("openings must fit the wall: lane at min spacing, vertical incl. head clearance", () => {
  const wide = validateProgramAgainstPack(
    makeProgram((p) => { p.masses[0].openings[1].count = 5; }), pack); // 5×1 + 4×2 = 13 > w-2 = 11
  assert.match(wide.findings[0].msg, /wall offers 11/);

  const tallArch = validateProgramAgainstPack(
    makeProgram((p) => { p.masses[0].openings[0] = { wall: "+z", kind: "door", count: 1, w: 4, h: 7, sill: 0, head: "arch", headRole: "wall.dressing" }; }), pack);
  assert.match(tallArch.findings[0].msg, /above the wall top 8/); // 7 + ceil(4/2) = 9 > 2×4
});

test("door + ground windows on ONE wall are a joint lane — valid, feasibility-checked together", () => {
  // the first live refusals: a sill-0 door beside sill-1 windows is a NATURAL facade reading
  const mixed = validateProgramAgainstPack(makeProgram((p) => {
    p.masses[0].openings = [
      { wall: "+z", kind: "door", count: 1, w: 2, h: 3, sill: 0, head: "flat", headRole: "wall.dressing" },
      { wall: "+z", kind: "window", count: 2, w: 1, h: 2, sill: 1, head: null, headRole: null },
    ];
  }), pack);
  assert.deepEqual(mixed.findings, []);

  const overflow = validateProgramAgainstPack(makeProgram((p) => {
    p.masses[0].openings = [
      { wall: "+z", kind: "door", count: 1, w: 4, h: 3, sill: 0, head: null, headRole: null },
      { wall: "+z", kind: "window", count: 3, w: 2, h: 2, sill: 1, head: null, headRole: null },
    ]; // 4 + 3×2 + 3×2 = 16 > 11
  }), pack);
  assert.match(overflow.findings[0].msg, /4 opening\(s\) need 16 cells .* wall offers 11/);
});

test("openingLanes: vertical overlap merges transitively; disjoint stays independent", () => {
  const lanes = openingLanes([
    { wall: "+z", kind: "door", count: 1, w: 2, h: 3, sill: 0, head: "flat" },   // [0,4)
    { wall: "+z", kind: "window", count: 2, w: 1, h: 2, sill: 5, head: null },   // [5,7) — disjoint
    { wall: "+z", kind: "window", count: 2, w: 1, h: 2, sill: 3, head: null },   // [3,5) — overlaps the door
    { wall: "-z", kind: "window", count: 1, w: 1, h: 2, sill: 0, head: null },   // other wall
  ]);
  const keyOf = (l) => `${l.wall}:[${l.entries.map((e) => e.index).join(",")}]`;
  assert.deepEqual(lanes.map(keyOf).sort(), ["+z:[0,2]", "+z:[1]", "-z:[3]"]);
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

// ---------------------------------------------------------------- facade grammar (T-145-01, E-35)

/** A clean per-mass facade block in rustic vocabulary, attachable to makeProgram()'s main mass. */
function makeFacade() {
  return {
    eaveOverhang: 1,
    faces: [
      {
        wall: "+z",
        rhythm: { period: 3, phase: 0 },
        memberRole: "frame.timber",
        fields: { role: "wall.infill.upper" },
        quoins: { role: "wall.dressing", run: 4 },
        courseLines: [{ y: 4, role: "wall.dressing" }],
        jettyDepth: 1,
        openingsRhythm: { period: 4, phase: 1 },
        evidence: { source: "concept", layoutOnly: false },
      },
      {
        wall: "-z",
        rhythm: { count: 4 },
        memberRole: "frame.timber",
        fields: null,
        quoins: null,
        courseLines: [],
        jettyDepth: null,
        openingsRhythm: null,
        evidence: { source: "textured-glb", layoutOnly: true },
      },
    ],
  };
}

test("facade: legacy program (no facade) still passes the schema and pack gates", () => {
  const r = parseBuildingProgram(makeProgram());
  assert.equal(r.ok, true);
  assert.equal(r.program.masses[0].facade, undefined);
  assert.equal(validateProgramAgainstPack(makeProgram(), pack).ok, true);
});

test("facade: a valid facade block passes the schema gate", () => {
  const r = parseBuildingProgram(makeProgram((p) => { p.masses[0].facade = makeFacade(); }));
  assert.equal(r.ok, true);
  assert.equal(r.program.masses[0].facade.faces.length, 2);
});

test("facade: schema rejects a block id inside the facade (roles only — the diegetic substrate)", () => {
  const r = parseBuildingProgram(makeProgram((p) => {
    p.masses[0].facade = makeFacade();
    p.masses[0].facade.faces[0].block = "minecraft:bricks";
  }));
  assert.equal(r.ok, false);
  assert.equal(r.code, "schema_invalid");
});

test("facade: schema rejects a face missing its evidence tag", () => {
  const r = parseBuildingProgram(makeProgram((p) => {
    p.masses[0].facade = makeFacade();
    delete p.masses[0].facade.faces[0].evidence;
  }));
  assert.equal(r.ok, false);
  assert.equal(r.code, "schema_invalid");
});

test("facade: a clean facade passes pack validation", () => {
  const { ok, findings } = validateProgramAgainstPack(
    makeProgram((p) => { p.masses[0].facade = makeFacade(); }), pack);
  assert.deepEqual(findings, []);
  assert.equal(ok, true);
});

test("facade: pack validation rejects off-vocabulary / off-bound / non-diegetic faces", () => {
  for (const [mutate, re] of [
    [(f) => { f.faces[0].memberRole = "wall.marble"; }, /not in the pack palette/],
    [(f) => { f.faces[0].rhythm = { period: 99, phase: 0 }; }, /outside the pack member-spacing band/],
    [(f) => { f.faces[0].rhythm = { period: 3, phase: 0, count: 4 }; }, /exactly \{period, phase\} OR \{count\}/],
    [(f) => { f.eaveOverhang = 99; }, /exceeds the pack overhang ceiling/],
    [(f) => { f.faces[0].quoins = { role: "wall.dressing", run: 99 }; }, /exceeds the pack quoin ceiling/],
    [(f) => { f.faces[0].courseLines = [{ y: 99, role: "wall.dressing" }]; }, /at\/above the wall top/],
    [(f) => { f.faces[1].evidence = { source: "textured-glb", layoutOnly: false }; }, /must be layoutOnly:true/],
    [(f) => { f.faces.push({ ...f.faces[0] }); }, /duplicate face for wall/],
  ]) {
    const { ok, findings } = validateProgramAgainstPack(makeProgram((p) => {
      const fac = makeFacade();
      mutate(fac);
      p.masses[0].facade = fac;
    }), pack);
    assert.equal(ok, false);
    assert.match(findings.map((f) => f.msg).join("\n"), re);
  }
});

test("facade: jettyDepth needs a declared jetty; count rhythm must fit the wall", () => {
  const noJetty = validateProgramAgainstPack(makeProgram((p) => {
    p.masses[0].jetty = null;
    const fac = makeFacade();
    fac.faces[0].jettyDepth = 1;
    p.masses[0].facade = fac;
  }), pack);
  assert.match(noJetty.findings.map((f) => f.msg).join("\n"), /jettyDepth needs masses\[\]\.jetty/);

  const wideCount = validateProgramAgainstPack(makeProgram((p) => {
    const fac = makeFacade();
    fac.faces[1] = { ...fac.faces[1], wall: "-z", rhythm: { count: 99 } };
    p.masses[0].facade = fac;
  }), pack);
  assert.match(wideCount.findings.map((f) => f.msg).join("\n"), /exceeds the .* interior cells/);
});

// ---------------------------------------------------------------- storey band (T-145-02, E-35)

test("bandYRange maps named bands to mass-relative y-ranges (no per-building constant)", () => {
  const cottage = { storeys: 2, storeyHeight: 4 }; // wall top y=8
  assert.deepEqual(bandYRange(cottage, "ground"), { yLo: 0, yHi: 3 });
  assert.deepEqual(bandYRange(cottage, "upper"), { yLo: 4, yHi: 7 });
  assert.deepEqual(bandYRange(cottage, "all"), { yLo: 0, yHi: 7 });
  const barn = { storeys: 3, storeyHeight: 3 }; // wall top y=9
  assert.deepEqual(bandYRange(barn, "upper"), { yLo: 3, yHi: 8 });
  assert.deepEqual(bandYRange(barn, "all"), { yLo: 0, yHi: 8 });
  // absent band ⇒ no restriction (legacy whole wall)
  assert.equal(bandYRange(cottage, null), null);
  assert.equal(bandYRange(cottage, undefined), null);
});

test("facade: a recognized band is additive and passes the gates", () => {
  const r = parseBuildingProgram(makeProgram((p) => {
    const fac = makeFacade();
    fac.faces[0].band = "upper";
    fac.faces[1].band = "all";
    p.masses[0].facade = fac;
  }));
  assert.equal(r.ok, true);
  assert.equal(r.program.masses[0].facade.faces[0].band, "upper");
  const { ok, findings } = validateProgramAgainstPack(makeProgram((p) => {
    const fac = makeFacade();
    fac.faces[0].band = "upper";
    p.masses[0].facade = fac;
  }), pack);
  assert.deepEqual(findings, []);
  assert.equal(ok, true);
});

test("facade: band 'upper' needs an upper storey; schema rejects a bogus band", () => {
  const oneStorey = validateProgramAgainstPack(makeProgram((p) => {
    p.masses[0].storeys = 1; // a single-storey mass has no upper band
    p.masses[0].jetty = null; // a jetty needs storeys ≥ 2
    const fac = makeFacade();
    fac.faces[0].band = "upper";
    fac.faces[0].jettyDepth = null;
    p.masses[0].facade = fac;
  }), pack);
  assert.match(oneStorey.findings.map((f) => f.msg).join("\n"), /band 'upper' needs an upper storey/);

  const bogus = parseBuildingProgram(makeProgram((p) => {
    const fac = makeFacade();
    fac.faces[0].band = "attic"; // off the enum
    p.masses[0].facade = fac;
  }));
  assert.equal(bogus.ok, false);
  assert.equal(bogus.code, "schema_invalid");
});

test("facade: assertFacadeDiegetic proves layout-only GLB evidence + a per-face receipt", () => {
  const clean = assertFacadeDiegetic(makeProgram((p) => { p.masses[0].facade = makeFacade(); }), pack);
  assert.equal(clean.ok, true);
  assert.deepEqual(clean.receipt, [
    { wall: "+z", source: "concept", layoutOnly: false },
    { wall: "-z", source: "textured-glb", layoutOnly: true },
  ]);

  const leaked = assertFacadeDiegetic(makeProgram((p) => {
    const fac = makeFacade();
    fac.faces[1].evidence = { source: "textured-glb", layoutOnly: false };
    p.masses[0].facade = fac;
  }), pack);
  assert.equal(leaked.ok, false);
  assert.match(leaked.findings[0].msg, /layoutOnly:true/);
});

test("facade: facadeBounds rides articulation when present, else pack fallback", () => {
  const fallback = facadeBounds(pack); // rustic has no articulation
  assert.equal(fallback.periodMin, pack.proportions.openingRhythm.minSpacing);
  assert.equal(fallback.periodMax, pack.proportions.openingRhythm.maxSpacing);
  assert.equal(fallback.maxOverhang, pack.proportions.storeyHeight.max);

  const withArt = { ...pack, proportions: { ...pack.proportions, articulation: { memberPeriod: { min: 1, max: 9 }, maxOverhang: 2, maxJettyDepth: 3, maxQuoinRun: 12 } } };
  const b = facadeBounds(withArt);
  assert.deepEqual(b, { periodMin: 1, periodMax: 9, maxOverhang: 2, maxJettyDepth: 3, maxQuoinRun: 12 });
});

