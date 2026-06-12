// Unit + integration tests — the program compiler (T-125-01). Pure throughout: synthetic
// programs only (AC: "pure composition logic unit-tested with synthetic programs"); the
// integration leg realizes through the REAL registry and judges with the REAL conformance gate.

import { test } from "node:test";
import assert from "node:assert/strict";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { loadStylePack } from "../pack/style-pack.mjs";
import { runConformance } from "../pack/conformance.mjs";
import { artifactOccupancy } from "../view/occupancy.mjs";
import { assertArtifact } from "../artifact.mjs";
import { assertWorkshopProgram, realizeProgram } from "../workshop/program.mjs";
import { assertBuildingProgram, validateProgramAgainstPack } from "./program.mjs";
import { compileProgram, layoutRun, laneSequence, roleBlock, roofIdiomForPitch } from "./compile.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const pack = loadStylePack(resolve(here, "..", "..", "packs", "rustic.json"));

/** The full synthetic exercise program (mirrors program.test.mjs's fixture). */
function makeProgram(mutate = () => {}) {
  const p = {
    schema: "building-program/v1",
    subject: "test-subject",
    pack: "rustic",
    reading: { summary: "synthetic two-storey gabled mass" },
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
          idiom: "roof.gable", ridgeAxis: "x", pitchClass: 1,
          fieldRole: "roof.field", trimRole: "roof.trim", gableRole: null,
          dormers: { count: 2, wall: "+z" },
        },
        chimney: { role: "wall.field.ground", capRole: "chimney.cap", atEnd: "hi" },
        openings: [
          { wall: "+z", kind: "door", count: 1, w: 2, h: 3, sill: 0, head: "arch", headRole: "wall.dressing" },
          { wall: "-z", kind: "window", count: 2, w: 1, h: 2, sill: 5, head: "flat", headRole: "wall.dressing" },
        ],
      },
    ],
  };
  mutate(p);
  return assertBuildingProgram(p);
}

const validated = (p) => {
  const v = validateProgramAgainstPack(p, pack);
  assert.deepEqual(v.findings, []);
  return p;
};

test("roleBlock resolves pack roles and throws on unknowns", () => {
  assert.equal(roleBlock(pack, "wall.field.ground"), "cobblestone");
  assert.equal(roleBlock(pack, "chimney.cap"), "bricks");
  assert.throws(() => roleBlock(pack, "wall.marble"), /not in the pack palette/);
});

test("layoutRun distributes evenly, in-band, deterministically", () => {
  // 2 items of w=1 over 11 columns: gap candidates 2..5 — leftover 9-g balances at g=3 (m=3)
  assert.deepEqual(layoutRun({ uLo: 1, uHi: 11, widths: [1, 1], minGap: 2, maxGap: 5 }), [4, 8]);
  // single item centers
  assert.deepEqual(layoutRun({ uLo: 1, uHi: 11, widths: [2], minGap: 2, maxGap: 5 }), [5]);
  // mixed widths stay ordered with one shared gap
  const us = layoutRun({ uLo: 0, uHi: 12, widths: [1, 2, 1], minGap: 2, maxGap: 5 });
  assert.equal(us.length, 3);
  assert.ok(us[1] - (us[0] + 1) === us[2] - (us[1] + 2), "uniform gap");
  // infeasible throws
  assert.throws(() => layoutRun({ uLo: 1, uHi: 4, widths: [2, 2, 2], minGap: 2, maxGap: 5 }), /cannot lay out/);
});

test("laneSequence centers a singleton between a pair (window, door, window)", () => {
  const lane = {
    wall: "+z",
    entries: [
      { index: 0, count: 1, w: 2, kind: "door" },
      { index: 1, count: 2, w: 1, kind: "window" },
    ],
  };
  const kinds = laneSequence(lane).map((s) => s.entry.kind);
  assert.deepEqual(kinds, ["window", "door", "window"]);
});

test("compile is deterministic and self-contained (program + pack only)", () => {
  const p = validated(makeProgram());
  const a = compileProgram(p, pack);
  const b = compileProgram(p, pack);
  assert.deepEqual(a, b);
  assert.equal(JSON.stringify(a), JSON.stringify(b));
});

test("compiled shape: workshop contract, banded shell, true-hole openings incl. head rows", () => {
  const { workshopProgram: wp } = compileProgram(validated(makeProgram()), pack);
  assert.equal(wp.schema, "workshop-program/v1");
  assert.equal(wp.budget.rounds, 1);

  const shell = wp.elements.find((e) => e.id === "main-shell");
  assert.equal(shell.kind, "shell");
  assert.equal(shell.spec.height, 8); // 2 storeys × 4
  assert.deepEqual(shell.spec.courses, [{ yRange: [0, 3], block: "cobblestone" }]);
  assert.equal(shell.spec.wallBlock, "white_terracotta");
  // arch door w=2 → 1 head row; hole h = 3 + 1
  const door = shell.spec.openings.find((o) => o.wall === "+z");
  assert.equal(door.h, 4);
  // windows flat-head: hole h = 2 + 1
  const wins = shell.spec.openings.filter((o) => o.wall === "-z");
  assert.equal(wins.length, 2);
  assert.ok(wins.every((o) => o.h === 3 && o.at[1] === 5));

  const ids = wp.elements.map((e) => e.id);
  for (const want of ["main-plinth", "main-jetty-+z", "main-roof", "main-dormer-0", "main-dormer-1", "main-chimney"]) {
    assert.ok(ids.includes(want), `${want} present`);
  }
  const roof = wp.elements.find((e) => e.id === "main-roof");
  // gable along x: footprint expands ±z only; perpSpan 11 → ridge = 8 + 5
  assert.deepEqual(roof.spec.footprint, { x0: 0, x1: 12, z0: -1, z1: 9 });
  assert.equal(roof.spec.ridgeY, 13);
  assert.equal(roof.spec.blocks.field, "spruce_planks");
  assert.equal(roof.spec.blocks.stairs, "spruce_stairs"); // field matches the pack family → members ride

  const heads = wp.elements.filter((e) => e.idiom === "arch" || e.idiom === "head.flat");
  assert.equal(heads.length, 3); // 1 arch door + 2 flat window lintels
});

test("off-family roof field realizes full-cube (no name derivation)", () => {
  const p = validated(makeProgram((q) => { q.masses[0].roof.fieldRole = "roof.trim"; }));
  const { workshopProgram: wp } = compileProgram(p, pack);
  const roof = wp.elements.find((e) => e.id === "main-roof");
  assert.equal(roof.spec.blocks.field, "dark_oak_planks");
  assert.equal(roof.spec.blocks.stairs, null);
  assert.equal(roof.spec.blocks.slab, null);
});

test("steep roof idiom: family via the roof.gable row fallback; dormer seat clears the wedge (T-134-01)", () => {
  const p = makeProgram((q) => {
    q.masses[0].roof.idiom = "roof.gable.steep";
    q.masses[0].roof.pitchClass = 2;
  }); // constructed directly to isolate compile from validation — rustic now declares [1, 2]
      // (T-141-01), so this would also validate; compile never gates on pitchClasses regardless
  const { workshopProgram: wp } = compileProgram(p, pack);
  const roof = wp.elements.find((e) => e.id === "main-roof");
  assert.equal(roof.idiom, "roof.gable.steep");
  assert.equal(roof.spec.pitch, 2);
  // no roof.gable.steep row in the pack: the course family rides the roof.gable row
  assert.equal(roof.spec.blocks.field, "spruce_planks");
  assert.equal(roof.spec.blocks.stairs, "spruce_stairs");
  const { eaveY, ridgeY, footprint } = roof.spec;
  const perpSpan = footprint.z1 - footprint.z0 + 1; // ridge along x
  assert.equal(ridgeY, eaveY + 2 * Math.floor((perpSpan - 1) / 2), "ridge formula scales with the class");
  assert.equal((ridgeY - eaveY) % 2, 0, "the compiled ridge lands on the stepping");
  for (const d of wp.elements.filter((e) => e.idiom === "dormer")) {
    assert.equal(d.spec.origin[1], eaveY + 2, "the seat clears the wedge at the wall plane (eaveY + ⌈pitch⌉)");
  }
  // legacy classes keep the legacy seat byte-identically
  const { workshopProgram: legacy } = compileProgram(validated(makeProgram()), pack);
  const eave1 = legacy.elements.find((e) => e.id === "main-roof").spec.eaveY;
  for (const d of legacy.elements.filter((e) => e.idiom === "dormer")) {
    assert.equal(d.spec.origin[1], eave1 + 1);
  }
});

test("declarations: bands carry exactly the assigned blocks; openings are world AABBs", () => {
  const { workshopProgram: wp } = compileProgram(validated(makeProgram()), pack);
  const { bands, symmetry, openings } = wp.declarations;
  assert.equal(symmetry, null);

  const byName = Object.fromEntries(bands.map((b) => [b.name, b]));
  assert.deepEqual(byName.base.yRange, [0, 3]);
  // ground field + plinth/heads + the jetty joist ends one course under the beam (y=3)
  assert.deepEqual(byName.base.blocks, ["cobblestone", "dark_oak_log", "stone_bricks"]);
  assert.equal(byName.base.mixed, true);
  assert.deepEqual(byName.upper.yRange, [4, 7]);
  assert.ok(byName.upper.blocks.includes("white_terracotta"));
  assert.ok(byName.upper.blocks.includes("dark_oak_planks")); // jetty beam at y=4
  assert.deepEqual(byName.roof.yRange[0], 8);

  assert.equal(openings.length, 3); // 1 door + 2 windows (dormer lights are sealed niches, not holes)
  const door = openings.find((o) => o.kind === "door");
  assert.equal(door.min[2], 8); // +z wall plane z=8
  assert.equal(door.max[1], 3); // sill 0 + h 3 + 1 head row − 1
  const winGroups = new Set(openings.filter((o) => o.kind === "window").map((o) => o.wall));
  assert.equal(winGroups.size, 1); // one rhythm lane per program entry
});

test("INTEGRATION: synthetic program realizes through the registry, conformance all-pass", () => {
  const { workshopProgram } = compileProgram(validated(makeProgram()), pack);
  const wp = assertWorkshopProgram(workshopProgram);
  const { artifact, cells, elements } = realizeProgram(wp);
  assertArtifact(artifact);
  assert.ok(cells.length > 500, `realized ${cells.length} cells`);
  assert.equal(elements.length, workshopProgram.elements.length);

  const occ = artifactOccupancy(artifact);
  const verdict = runConformance({ occ, declarations: workshopProgram.declarations }, pack);
  const failed = verdict.checks.filter((c) => !c.passed);
  assert.deepEqual(
    failed.map((c) => ({ name: c.name, findings: c.findings.slice(0, 6) })), [],
    "every pack conformance check passes on the realized synthetic build",
  );
  assert.equal(verdict.passed, true);
});

test("INTEGRATION: a joint lane (door flanked by ground windows) realizes conformance-clean", () => {
  const p = validated(makeProgram((q) => {
    q.masses[0].openings = [
      { wall: "+z", kind: "door", count: 1, w: 2, h: 3, sill: 0, head: "flat", headRole: "wall.dressing" },
      { wall: "+z", kind: "window", count: 2, w: 1, h: 2, sill: 1, head: null, headRole: null },
    ];
  }));
  const { workshopProgram } = compileProgram(p, pack);
  const shell = workshopProgram.elements.find((e) => e.id === "main-shell");
  assert.equal(shell.spec.openings.length, 3);
  const doorHole = shell.spec.openings.find((o) => o.w === 2);
  const winUs = shell.spec.openings.filter((o) => o.w === 1).map((o) => o.at[0]);
  assert.ok(winUs[0] < doorHole.at[0] && doorHole.at[0] < winUs[1], "door centered between windows");

  const { artifact } = realizeProgram(assertWorkshopProgram(workshopProgram));
  const occ = artifactOccupancy(artifact);
  const verdict = runConformance({ occ, declarations: workshopProgram.declarations }, pack);
  assert.deepEqual(verdict.checks.filter((c) => !c.passed).map((c) => ({ name: c.name, findings: c.findings.slice(0, 5) })), []);
});

test("INTEGRATION: pyramid + hip masses also realize and stay watertight/single-component", () => {
  const p = validated(makeProgram((q) => {
    q.masses[0].roof = { idiom: "roof.hip", ridgeAxis: "x", pitchClass: 1, fieldRole: "roof.field", trimRole: null, gableRole: null, dormers: null };
    q.masses[0].chimney = null;
    q.masses[0].jetty = null;
    q.masses.push({
      id: "tower",
      rect: { x0: 12, z0: 2, w: 5, d: 5 },
      storeys: 3, storeyHeight: 3,
      walls: { treatment: null, ground: { role: "wall.dressing" }, upper: { role: "wall.dressing" } },
      plinth: null, jetty: null,
      roof: { idiom: "roof.pyramid", pitchClass: 1, fieldRole: "roof.field", trimRole: null, gableRole: null, dormers: null },
      chimney: null,
      openings: [],
    });
  }));
  const { workshopProgram } = compileProgram(p, pack);
  const { artifact } = realizeProgram(assertWorkshopProgram(workshopProgram));
  const occ = artifactOccupancy(artifact);
  const verdict = runConformance({ occ, declarations: workshopProgram.declarations }, pack);
  for (const name of ["watertight", "single-component", "palette-in-pack"]) {
    const c = verdict.checks.find((x) => x.name === name);
    assert.equal(c.passed, true, `${name}: ${JSON.stringify(c.findings.slice(0, 5))}`);
  }
});

test("roofIdiomForPitch: the gable family crosses the steep door at pitch > 1, others unchanged (T-138-01)", () => {
  // up-aim: base gable at a steep class must re-aim through the steep door
  assert.equal(roofIdiomForPitch("roof.gable", 2), "roof.gable.steep");
  assert.equal(roofIdiomForPitch("roof.gable", 3), "roof.gable.steep");
  // down-aim: a steep gable lowered to a legacy class returns to the base door
  assert.equal(roofIdiomForPitch("roof.gable.steep", 1), "roof.gable");
  assert.equal(roofIdiomForPitch("roof.gable.steep", 0.5), "roof.gable");
  // identity inside each door's own classes
  assert.equal(roofIdiomForPitch("roof.gable", 1), "roof.gable");
  assert.equal(roofIdiomForPitch("roof.gable.steep", 2), "roof.gable.steep");
  // non-gable families have no steep variant — unchanged; the door downstream arbitrates
  assert.equal(roofIdiomForPitch("roof.hip", 2), "roof.hip");
  assert.equal(roofIdiomForPitch("roof.pyramid", 2), "roof.pyramid");
});
