// realizeWithArticulation (T-149-01, E-35 terminal): the relief join is inert on a facade-less
// program (byte-identical to realizeProgram — the structural no-regression for cottage/barn/fixture)
// and constructs the plan's proud relief when the program carries a facade. PURE — reads two
// committed inputs, no GL/IO/Date/random.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { loadStylePack } from "../pack/style-pack.mjs";
import { artifactOccupancy } from "../view/occupancy.mjs";
import { reliefNoRegress } from "../view/surface-relief.mjs";
import { assertWorkshopProgram, realizeProgram } from "./program.mjs";
import { serializeArtifact } from "./replay.mjs";
import { assertBuildingProgram } from "../recognition/program.mjs";
import { compileProgram, applyArticulation } from "../recognition/compile.mjs";
import { realizeWithArticulation, mergePlacements } from "./articulate.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, "..", "..");
const pack = loadStylePack(resolve(ROOT, "packs", "rustic.json"));

// A real facade-LESS program (the committed barn recognition carries no facade — grep-verified).
const barn = assertBuildingProgram(
  JSON.parse(readFileSync(resolve(ROOT, "benchmarks/sculpture/recognition/barn.program.json"), "utf8")),
);
// A facade-BEARING program (T-147's committed build fixture).
const articulated = assertBuildingProgram(
  JSON.parse(readFileSync(resolve(here, "..", "recognition", "fixtures", "facade", "articulated-program.json"), "utf8")),
);

const facesOf = (plan) => [...new Set(plan.flatMap((e) => e.params?.faces ?? []))];

test("AR1 — facade-less program: byte-identical to realizeProgram (structural no-regression)", () => {
  const { workshopProgram, articulation } = compileProgram(barn, pack);
  assert.deepEqual(articulation, [], "a facade-less program compiles to an empty articulation plan");
  const wp = assertWorkshopProgram(workshopProgram);
  const plain = realizeProgram(wp);
  const joined = realizeWithArticulation(wp, articulation);
  assert.equal(joined.articulation, undefined, "no articulation report when the plan is empty");
  assert.equal(serializeArtifact(joined.artifact), serializeArtifact(plain.artifact), "bytes identical to a bare realize");
});

test("AR2 — facade-bearing program: the plan's relief is constructed onto the skin", () => {
  const { workshopProgram, articulation } = compileProgram(articulated, pack);
  assert.ok(articulation.length >= 3, "the facade grammar produced an articulation plan");
  const wp = assertWorkshopProgram(workshopProgram);
  const skin = realizeProgram(wp);
  const joined = realizeWithArticulation(wp, articulation);

  const { placements: relief } = applyArticulation(artifactOccupancy(skin.artifact), articulation);
  assert.ok(relief.length > 0, "the brushes place proud cells");
  assert.ok(joined.artifact.placements.length > skin.artifact.placements.length, "the build grew relief cells");
  assert.ok(joined.articulation && joined.articulation.placements === relief.length, "the report carries the placement count");

  // every relief position is present in the merged build carrying the relief block. Brushes may
  // overlap (a quoin corner inside a pilaster face) — mergePlacements is last-wins, so compare each
  // position against the LAST relief placement there, mirroring applyArticulation's own ordering.
  const ns = (b) => (b.includes(":") ? b : `minecraft:${b}`);
  const reliefLast = new Map();
  for (const r of relief) reliefLast.set(r.pos.join(","), ns(r.block));
  const merged = new Map(joined.artifact.placements.map((p) => [p.pos.join(","), p.block]));
  for (const [k, block] of reliefLast) {
    assert.ok(merged.has(k), `relief cell ${k} present in the merged build`);
    assert.equal(merged.get(k), block, `relief block wins at ${k}`);
  }
});

test("AR3 — idempotent per round: re-realize + re-apply yields identical bytes", () => {
  const { workshopProgram, articulation } = compileProgram(articulated, pack);
  const wp = assertWorkshopProgram(workshopProgram);
  const a = realizeWithArticulation(wp, articulation);
  const b = realizeWithArticulation(wp, articulation);
  assert.equal(serializeArtifact(a.artifact), serializeArtifact(b.artifact), "two independent realizations match");
});

test("AR4 — merged manifest is the closure of skin ∪ relief, sorted and unique", () => {
  const { workshopProgram, articulation } = compileProgram(articulated, pack);
  const wp = assertWorkshopProgram(workshopProgram);
  const skin = realizeProgram(wp);
  const joined = realizeWithArticulation(wp, articulation);
  const m = joined.artifact.palette.manifest;
  assert.deepEqual(m, [...m].sort(), "manifest is sorted");
  assert.equal(new Set(m).size, m.length, "manifest has no duplicates");
  for (const b of skin.artifact.palette.manifest) assert.ok(m.includes(b), `skin block ${b} retained`);
  assert.deepEqual(m, [...new Set(joined.artifact.placements.map((p) => p.block))].sort(), "manifest = merged blocks");
});

test("AR5 — silhouette charter: the relief is proud (in-plane mask + ratios preserved)", () => {
  const { workshopProgram, articulation } = compileProgram(articulated, pack);
  const wp = assertWorkshopProgram(workshopProgram);
  const skin = realizeProgram(wp);
  const occBefore = artifactOccupancy(skin.artifact);
  const { placements: relief } = applyArticulation(occBefore, articulation);
  const r = reliefNoRegress(occBefore, relief, { faces: facesOf(articulation) });
  assert.equal(r.inPlanePreserved, true, "relief does not move the in-plane silhouette");
  assert.equal(r.ratiosPreserved, true, "relief does not move the height ratios");
});

test("AR6 — mergePlacements: relief fronts a skin cell in place, appends a fresh cell in order", () => {
  const skin = [
    { op: "voxel", pos: [0, 0, 0], block: "minecraft:stone" },
    { op: "voxel", pos: [1, 0, 0], block: "minecraft:stone" },
  ];
  const relief = [
    { op: "voxel", pos: [1, 0, 0], block: "minecraft:oak_log" }, // fronts an existing cell
    { op: "voxel", pos: [2, 0, 0], block: "oak_log" },           // fresh, un-namespaced
  ];
  const out = mergePlacements(skin, relief);
  assert.deepEqual(out[0], { op: "voxel", pos: [0, 0, 0], block: "minecraft:stone" }, "untouched skin cell kept");
  assert.deepEqual(out[1], { op: "voxel", pos: [1, 0, 0], block: "minecraft:oak_log" }, "fronted in place");
  assert.deepEqual(out[2], { op: "voxel", pos: [2, 0, 0], block: "minecraft:oak_log" }, "fresh cell appended + namespaced");
  assert.equal(out.length, 3, "no spurious cells");
});
