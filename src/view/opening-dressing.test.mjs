// Unit tests for opening-dressing.mjs (T-099-01, story S-099, epic E-26) — synthetic occupancies
// with hand-computed world coordinates; the cottage run lives in the runner
// (benchmarks/sculpture/dress-openings.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { occupancyFromCells } from "./occupancy.mjs";
import { openings } from "./structural-read.mjs";
import { openingRegions, closureCheck, strayFixtures } from "./shell-integrity.mjs";
import {
  COMPASS, SHUTTER_FACING, FENCE_RUN_STATE, speciesFence, treatmentsFromKit,
  extractApertures, dressOpenings, applyDressing,
} from "./opening-dressing.mjs";
import { loadBlockVocab } from "../form/kit.mjs";
import { CARD_ROWS } from "../form/fixture-card.mjs";
import { assertArtifact } from "../artifact.mjs";

const VOCAB = loadBlockVocab();
const COTTAGE_KIT = JSON.parse(
  readFileSync(new URL("../../benchmarks/sculpture/kit/cottage.json", import.meta.url), "utf8"));

/** Single wall slab in the z=0 plane: x 0..6, y 0..5, with a window hole at x 2..3, y 2..3. */
function wallCells({ holes = [] } = {}) {
  const holeSet = new Set(holes.map((p) => p.join(",")));
  const cells = [];
  for (let x = 0; x <= 6; x++) for (let y = 0; y <= 5; y++) {
    if (!holeSet.has(`${x},${y},0`)) cells.push({ pos: [x, y, 0], block: "stone_bricks" });
  }
  return cells;
}
const WINDOW_HOLES = [[2, 2, 0], [3, 2, 0], [2, 3, 0], [3, 3, 0]];

/** Hollow box x 0..6, y 0..5, z 0..4 (walls + roof, open ground) with a through-window on ±x at
 *  y 2..3, z = 2 — the cottage shape: the same physical window detected from both x faces. */
function boxWithWindows() {
  const cells = [];
  for (let x = 0; x <= 6; x++) for (let y = 0; y <= 5; y++) for (let z = 0; z <= 4; z++) {
    const shell = x === 0 || x === 6 || z === 0 || z === 4 || y === 5;
    if (!shell) continue;
    if ((x === 0 || x === 6) && (y === 2 || y === 3) && z === 2) continue; // the window holes
    cells.push({ pos: [x, y, z], block: "stone_bricks" });
  }
  return cells;
}

const TREATMENTS = {
  slots: {
    infill: { block: "spruce_fence", source: "test" },
    shutter: { block: "spruce_trapdoor", source: "test" },
    door: { block: "spruce_door", source: "test" },
    light: { block: "lantern", source: "test" },
    frame: { block: "spruce_planks", source: "test" },
  },
};

const posSet = (placements) => new Set(placements.map((p) => p.pos.join(",")));
const byBlock = (placements, block) => placements.filter((p) => p.block === `minecraft:${block}`);

// ---------------------------------------------------------------- treatmentsFromKit

test("cottage kit routes shutter/door/light and derives the species fence", () => {
  const t = treatmentsFromKit(COTTAGE_KIT, { vocab: VOCAB });
  assert.equal(t.slots.shutter.block, "spruce_trapdoor");
  assert.equal(t.slots.door.block, "spruce_door");
  assert.equal(t.slots.light.block, "lantern");
  assert.equal(t.slots.frame.block, "spruce_planks"); // the cube trim entry
  assert.equal(t.slots.infill.block, "spruce_fence");
  assert.equal(t.slots.infill.source, "derived-species-fence");
  assert.equal(t.derivations.length, 1);
  assert.equal(t.derivations[0].from, "spruce_trapdoor");
  assert.ok(VOCAB.names.has("spruce_fence"), "derived fence must be a real survival block");
});

test("a rail kit entry wins the infill slot — no derivation", () => {
  const kit = { kit: [
    { block: "oak_fence", role: "grille", formClass: "rail", whereUsed: ["openings"], confidence: "medium" },
    { block: "spruce_trapdoor", role: "shutters", formClass: "fixture", whereUsed: ["openings"], confidence: "high" },
  ] };
  const t = treatmentsFromKit(kit, { vocab: VOCAB });
  assert.equal(t.slots.infill.block, "oak_fence");
  assert.equal(t.slots.infill.source, "kit-rail");
  assert.equal(t.derivations.length, 0);
});

test("no rail and no trapdoor ⇒ infill unfulfilled with a reason", () => {
  const t = treatmentsFromKit({ kit: [
    { block: "lantern", role: "light", formClass: "fixture", whereUsed: ["openings"], confidence: "high" },
  ] }, { vocab: VOCAB });
  assert.equal(t.slots.infill, undefined);
  assert.ok(t.unfulfilled.some((u) => u.slot === "infill" && u.reason));
});

test("speciesFence matches door/trapdoor species and rejects non-wood", () => {
  assert.equal(speciesFence("spruce_trapdoor", VOCAB.names), "spruce_fence");
  assert.equal(speciesFence("dark_oak_door", VOCAB.names), "dark_oak_fence");
  assert.equal(speciesFence("iron_door", VOCAB.names), null); // no iron_fence in survival vocab
  assert.equal(speciesFence("lantern", VOCAB.names), null);
});

// ---------------------------------------------------------------- extractApertures (hand-computed)

test("extractApertures: +z wall window in world terms", () => {
  const occ = occupancyFromCells(wallCells({ holes: WINDOW_HOLES }));
  const aps = extractApertures(occ, ["+z"]);
  assert.equal(aps.length, 1);
  const ap = aps[0];
  assert.equal(ap.kind, "window");
  // +z spec: u = maxX - x (signU -1), v = maxY - y (signV -1) → x2..3,y2..3 ⇒ u3..4, v2..3
  assert.deepEqual(ap.bbox, { u0: 3, v0: 2, u1: 4, v1: 3 });
  assert.deepEqual(new Set(ap.cells.map((c) => `${c.au},${c.av}`)),
    new Set(["2,2", "3,2", "2,3", "3,3"]));
  // flanks: left = u0-1 → x4; right = u1+1 → x1; rows y 2..3
  assert.deepEqual(new Set(ap.flanks.left.map((c) => `${c.au},${c.av}`)), new Set(["4,3", "4,2"]));
  assert.deepEqual(new Set(ap.flanks.right.map((c) => `${c.au},${c.av}`)), new Set(["1,3", "1,2"]));
  // lintel row v0-1 → y4, x 1..4; sill row v1+1 → y1, x 1..4
  assert.deepEqual(new Set(ap.lintel.map((c) => `${c.au},${c.av}`)),
    new Set(["1,4", "2,4", "3,4", "4,4"]));
  assert.deepEqual(new Set(ap.sill.map((c) => `${c.au},${c.av}`)),
    new Set(["1,1", "2,1", "3,1", "4,1"]));
  assert.equal(ap.perim.length, 12); // the full ring around a 2×2 bbox
  assert.deepEqual(ap.region, { min: [2, 2, 0], max: [3, 3, 0] });
});

// ---------------------------------------------------------------- dressOpenings happy paths

test("dressOpenings +z: fence in the aperture, shutters proud, lintel/sill recolored", () => {
  const occ = occupancyFromCells(wallCells({ holes: WINDOW_HOLES }));
  const aps = extractApertures(occ, ["+z"]);
  const r = dressOpenings(occ, aps, TREATMENTS);
  const rep = r.perOpening[0];
  assert.equal(rep.conflicts.length, 0);
  assert.deepEqual(rep.paneSpan, [0, 0]);
  // infill: 4 fences at the holes, run axis x ⇒ east/west booleans
  const fences = byBlock(r.placements, "spruce_fence");
  assert.deepEqual(posSet(fences), new Set(WINDOW_HOLES.map((p) => p.join(","))));
  for (const f of fences) assert.deepEqual(f.state, { east: "true", west: "true" });
  // shutters: flanks x=4 and x=1, one cell proud (z=1), panel against the wall
  const shutters = byBlock(r.placements, "spruce_trapdoor");
  assert.deepEqual(posSet(shutters), new Set(["4,2,1", "4,3,1", "1,2,1", "1,3,1"]));
  for (const s of shutters) {
    assert.deepEqual(s.state, { facing: "south", half: "bottom", open: "true" });
  }
  assert.equal(SHUTTER_FACING["+z"], COMPASS["+z"]);
  // lintel y=4 + sill y=1, x 1..4 recolored to the frame block (wall is stone_bricks ≠ spruce_planks)
  const frame = byBlock(r.placements, "spruce_planks");
  assert.deepEqual(posSet(frame),
    new Set(["1,4,0", "2,4,0", "3,4,0", "4,4,0", "1,1,0", "2,1,0", "3,1,0", "4,1,0"]));
  assert.equal(rep.applied.infill, 4);
  assert.equal(rep.applied.shutterLeft, 2);
  assert.equal(rep.applied.shutterRight, 2);
  // a fresh dressing: every satisfied cell was a NEW placement
  assert.deepEqual(rep.placed, rep.applied);
  assert.equal(r.stats.fullyDressed, 1);
});

test("dressOpenings ±x: run axis is z (north/south), shutter facing from the table", () => {
  const occ = occupancyFromCells(boxWithWindows());
  const aps = extractApertures(occ, ["+x", "-x"]);
  assert.equal(aps.length, 2);
  const r = dressOpenings(occ, aps, TREATMENTS);
  const fences = byBlock(r.placements, "spruce_fence");
  // window cells y2..3 at the two wall planes x=6 and x=0
  assert.deepEqual(posSet(fences), new Set(["6,2,2", "6,3,2", "0,2,2", "0,3,2"]));
  for (const f of fences) assert.deepEqual(f.state, FENCE_RUN_STATE["+x"]);
  const shutters = byBlock(r.placements, "spruce_trapdoor");
  // +x face: proud cell x=7, flanks z∈{1,3}; -x face: x=-1
  assert.deepEqual(posSet(shutters),
    new Set(["7,2,1", "7,3,1", "7,2,3", "7,3,3", "-1,2,1", "-1,3,1", "-1,2,3", "-1,3,3"]));
  for (const s of shutters) {
    const facing = s.pos[0] === 7 ? "east" : "west";
    assert.equal(s.state.facing, facing);
  }
});

test("a sealed pane is re-opened by replacement (same cells as the open-hole case)", () => {
  const ref = occupancyFromCells(wallCells({ holes: WINDOW_HOLES }));
  const sealed = occupancyFromCells(wallCells()); // panes filled with wall material
  assert.equal(openings(sealed, "+z").length, 0, "sealed target has no detectable opening");
  const aps = extractApertures(ref, ["+z"]);
  const r = dressOpenings(sealed, aps, TREATMENTS);
  const fences = byBlock(r.placements, "spruce_fence");
  assert.deepEqual(posSet(fences), new Set(WINDOW_HOLES.map((p) => p.join(","))));
  assert.equal(r.perOpening[0].conflicts.length, 0);
});

test("idempotency: dressing a dressed target emits nothing new", () => {
  const occ = occupancyFromCells(wallCells({ holes: WINDOW_HOLES }));
  const aps = extractApertures(occ, ["+z"]);
  const r1 = dressOpenings(occ, aps, TREATMENTS);
  const dressedCells = [
    ...wallCells({ holes: WINDOW_HOLES }),
    ...r1.placements.map((p) => ({
      pos: p.pos, block: p.block.replace(/^minecraft:/, ""), state: p.state,
      form: p.block.includes("fence") ? "rail"
        : p.block.includes("trapdoor") || p.block.includes("door") || p.block.includes("lantern")
          ? "fixture" : undefined,
    })),
  ];
  const r2 = dressOpenings(occupancyFromCells(dressedCells), aps, TREATMENTS);
  assert.equal(r2.placements.length, 0);
  assert.ok(r2.stats.alreadyDressed > 0);
  assert.equal(r2.perOpening[0].conflicts.length, 0);
  // `placed` is the idempotence witness: everything applied, nothing newly placed (T-100-01)
  assert.ok(Object.values(r2.perOpening[0].placed).every((n) => n === 0));
  assert.ok(Object.values(r2.perOpening[0].applied).some((n) => n > 0));
});

// ---------------------------------------------------------------- conflict honesty

test("missing jamb on the target ⇒ shutter-no-jamb, named and reduced", () => {
  const ref = occupancyFromCells(wallCells({ holes: WINDOW_HOLES }));
  // descendant drift: the target lost the left-flank jamb cells (x=4, y 2..3)
  const target = occupancyFromCells(
    wallCells({ holes: [...WINDOW_HOLES, [4, 2, 0], [4, 3, 0]] }));
  const r = dressOpenings(target, extractApertures(ref, ["+z"]), TREATMENTS);
  const c = r.perOpening[0].conflicts.find((x) => x.slot === "shutterLeft");
  assert.deepEqual(c, { slot: "shutterLeft", name: "shutter-no-jamb-left", reduction: "shutter-dropped" });
  assert.equal(r.perOpening[0].applied.shutterLeft, 0);
  assert.equal(r.perOpening[0].applied.shutterRight, 2, "the other side still applies");
});

test("blocked shutter cell ⇒ shutter-blocked, named and reduced", () => {
  const cells = [...wallCells({ holes: WINDOW_HOLES }), { pos: [1, 2, 1], block: "stone" }];
  const occ = occupancyFromCells(cells);
  const r = dressOpenings(occ, extractApertures(occ, ["+z"]), TREATMENTS);
  const c = r.perOpening[0].conflicts.find((x) => x.slot === "shutterRight");
  assert.deepEqual(c, { slot: "shutterRight", name: "shutter-blocked-right", reduction: "shutter-dropped" });
});

test("every absent treatment is a named conflict — nothing silent", () => {
  const occ = occupancyFromCells(wallCells({ holes: WINDOW_HOLES }));
  const r = dressOpenings(occ, extractApertures(occ, ["+z"]), { slots: {} });
  const names = r.perOpening[0].conflicts.map((c) => `${c.slot}:${c.name}`);
  assert.ok(names.includes("infill:no-infill-treatment"));
  assert.ok(names.includes("shutterLeft:no-shutter-treatment"));
  assert.ok(names.includes("shutterRight:no-shutter-treatment"));
  // lintel/sill fall back to the perimeter census (stone_bricks) — trivially satisfied, no conflict
  assert.equal(r.perOpening[0].conflicts.filter((c) => c.slot === "lintel").length, 0);
});

// ---------------------------------------------------------------- doors

/** Wall with a door slit: x=3 (and optionally x=4), y 0..2, in the z=0 plane. */
function doorWall({ width = 1, height = 3 } = {}) {
  const holes = [];
  for (let i = 0; i < width; i++) for (let y = 0; y < height; y++) holes.push([3 + i, y, 0]);
  return wallCells({ holes });
}

test("door: lower+upper pair at the wall compass facing, lintel framed", () => {
  const occ = occupancyFromCells(doorWall());
  const aps = extractApertures(occ, ["+z"]);
  assert.equal(aps[0].kind, "door");
  const r = dressOpenings(occ, aps, TREATMENTS);
  const doors = byBlock(r.placements, "spruce_door");
  assert.deepEqual(posSet(doors), new Set(["3,0,0", "3,1,0"]));
  const lower = doors.find((d) => d.pos[1] === 0);
  const upper = doors.find((d) => d.pos[1] === 1);
  assert.deepEqual(lower.state, { facing: "south", hinge: "left", open: "false", half: "lower" });
  assert.deepEqual(upper.state, { facing: "south", hinge: "left", open: "false", half: "upper" });
  assert.equal(r.perOpening[0].applied.door, 1);
  // lantern beside the door's top row, one cell proud
  const lanterns = byBlock(r.placements, "lantern");
  assert.equal(lanterns.length, 1);
  assert.deepEqual(lanterns[0].state, { hanging: "false" });
  assert.equal(lanterns[0].pos[2], 1, "lantern sits proud of the facade like the shutters");
});

test("door 2 wide: hinge left + right pair; 1 tall: door-too-short", () => {
  const wide = occupancyFromCells(doorWall({ width: 2 }));
  const rw = dressOpenings(wide, extractApertures(wide, ["+z"]), TREATMENTS);
  const doors = byBlock(rw.placements, "spruce_door");
  assert.equal(doors.length, 4);
  const hinges = doors.filter((d) => d.state.half === "lower").map((d) => [d.pos[0], d.state.hinge]);
  assert.deepEqual(new Set(hinges.map((h) => h.join(":"))), new Set(["3:left", "4:right"]));

  const short = occupancyFromCells(doorWall({ height: 1 }));
  const rs = dressOpenings(short, extractApertures(short, ["+z"]), TREATMENTS);
  const c = rs.perOpening[0].conflicts.find((x) => x.slot === "door");
  assert.deepEqual(c, { slot: "door", name: "door-too-short", reduction: "left-undressed" });
  assert.equal(byBlock(rs.placements, "spruce_door").length, 0);
});

// ---------------------------------------------------------------- integrity composition (AC #3)

test("dressed openings stay openings: identity, closure-as-dressed, no strays under composed regions", () => {
  const occ = occupancyFromCells(boxWithWindows());
  const before = { "+x": openings(occ, "+x"), "-x": openings(occ, "-x") };
  const regionsBefore = openingRegions(occ);
  const aps = extractApertures(occ, ["+x", "-x"]);
  const r = dressOpenings(occ, aps, TREATMENTS);

  const dressed = occupancyFromCells([
    ...boxWithWindows(),
    ...r.placements.map((p) => {
      const bare = p.block.replace(/^minecraft:/, "");
      return { pos: p.pos, block: bare, state: p.state,
        form: bare.endsWith("_fence") ? "rail"
          : bare.endsWith("_trapdoor") || bare === "lantern" ? "fixture" : undefined };
    }),
  ]);
  // openings keep identity + report their dressing (frame recolors don't change the solid mask)
  for (const dir of ["+x", "-x"]) {
    const after = openings(dressed, dir);
    assert.equal(after.length, before[dir].length);
    assert.deepEqual(after[0].bbox, before[dir][0].bbox);
    assert.equal(after[0].kind, before[dir][0].kind);
    assert.ok(after[0].dressing.cells > 0, "the aperture reports its dressing");
  }
  // regions are bounds-stable across the dressing (solid view unchanged)
  assert.deepEqual(openingRegions(dressed), regionsBefore);
  // closure: closed, with the infill counted as dressing — not a hole, not wall mass
  const check = closureCheck(dressed, { regions: regionsBefore });
  assert.equal(check.closed, true);
  assert.equal(check.dressed.cells, 4); // 2 fence cells per face inside the through-region
  // strays: shutters sit outside openingRegions — composing the op's footprint clears them
  assert.ok(strayFixtures(dressed, regionsBefore).length > 0);
  assert.equal(strayFixtures(dressed, [...regionsBefore, ...r.regions]).length, 0);
});

// ---------------------------------------------------------------- applyDressing + the live gate

test("applyDressing output passes the live AJV gate with states intact", () => {
  const occ = occupancyFromCells(wallCells({ holes: WINDOW_HOLES }));
  const r = dressOpenings(occ, extractApertures(occ, ["+z"]), TREATMENTS);
  const artifact = {
    schema_version: "1.0.0",
    metadata: { trial_id: "t", prompting_method_id: "procedural/test@1",
      model_id: "claude-opus-4-8", seed: 0, server_state_id: "in-memory" },
    style: { name: "t", rationale: "synthetic dressing round-trip" },
    palette: { manifest: ["minecraft:stone_bricks"] },
    placements: wallCells({ holes: WINDOW_HOLES }).map((c) => ({
      op: "voxel", pos: c.pos, block: `minecraft:${c.block}` })),
  };
  const dressed = applyDressing(artifact, r.placements);
  assertArtifact(dressed);
  assert.ok(dressed.palette.manifest.includes("minecraft:spruce_fence"));
  assert.ok(dressed.palette.manifest.includes("minecraft:spruce_trapdoor"));
  assert.equal(dressed.placements.length, artifact.placements.length + r.placements.length);
  assert.equal(applyDressing(artifact, []), artifact, "no placements ⇒ identity");
});

// ---------------------------------------------------------------- the proven state vocabulary

test("every emitted state shape stays inside the CARD_ROWS-proven vocabulary", () => {
  const byFamily = (fam) => CARD_ROWS.filter((r) => r.family === fam);
  const occW = occupancyFromCells(boxWithWindows());
  const occD = occupancyFromCells(doorWall());
  const placements = [
    ...dressOpenings(occW, extractApertures(occW, ["+x", "-x"]), TREATMENTS).placements,
    ...dressOpenings(occD, extractApertures(occD, ["+z"]), TREATMENTS).placements,
  ];
  for (const p of placements) {
    const bare = p.block.replace(/^minecraft:/, "");
    if (bare.endsWith("_trapdoor")) {
      // exact state proven on the card at this facing
      assert.ok(byFamily("trapdoor").some((r) =>
        JSON.stringify(r.state) === JSON.stringify(p.state)), `unproven trapdoor state ${JSON.stringify(p.state)}`);
    } else if (bare.endsWith("_fence")) {
      const keys = Object.keys(p.state).sort().join(",");
      assert.ok(["east,west", "north,south"].includes(keys), `unproven fence run ${keys}`);
      assert.ok(Object.values(p.state).every((v) => v === "true"));
    } else if (bare.endsWith("_door")) {
      const proven = byFamily("door");
      assert.ok(proven.some((r) => r.state.half === p.state.half));
      assert.ok(proven.some((r) => r.state.hinge === p.state.hinge));
      assert.ok(proven.some((r) => r.state.open === p.state.open));
      assert.ok(["north", "south", "east", "west"].includes(p.state.facing));
    } else if (bare === "lantern") {
      assert.ok(byFamily("lantern").some((r) => r.state.hanging === p.state.hanging));
    } else if (bare === "spruce_planks") {
      assert.equal(p.state, undefined, "frame recolors carry no state");
    } else {
      assert.fail(`unexpected dressing block ${bare}`);
    }
  }
});
