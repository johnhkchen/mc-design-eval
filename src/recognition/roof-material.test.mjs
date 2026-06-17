// RM1–RM6 — the roof-material reconciliation decision (T-189-01). Pure, hermetic (inline fixtures, no disk,
// no GL, no LLM). Proves the steering decision the S-188 climb stalls on: brown timber roof → concept-true
// grey stone, where material identity is decided (program ↔ material-map), with an honest no-op on matched.

import { test } from "node:test";
import assert from "node:assert/strict";
import { roofMaterialFamily, materialMapRoofBlock, reconcileRoofMaterial } from "./roof-material.mjs";

// minimal pack with the two roles the fixtures use (the real rustic shape: bare block ids)
const PACK = {
  palette: [
    { role: "roof.trim", block: "dark_oak_planks" },   // gatehouse's mis-assigned (brown) roof field role
    { role: "roof.field", block: "spruce_planks" },     // a matched-timber roof field role
  ],
};
const gatehouseProgram = { masses: [{ roof: { fieldRole: "roof.trim" } }] };
const matchedProgram = { masses: [{ roof: { fieldRole: "roof.field" } }] };

const mapWith = (block) => ({ map: [
  { role: "walls", block: "minecraft:stone_bricks", placementRule: "walls" },
  { role: "roof mass", block, placementRule: "roof" },
] });

test("RM1 roofMaterialFamily — semantic timber/stone/other, namespace-tolerant", () => {
  for (const b of ["dark_oak_planks", "spruce_planks", "oak_log", "minecraft:birch_planks", "mangrove_wood"]) {
    assert.equal(roofMaterialFamily(b), "timber", b);
  }
  for (const b of ["deepslate_tiles", "stone_bricks", "cobblestone", "minecraft:deepslate_tiles", "andesite", "polished_blackstone_bricks"]) {
    assert.equal(roofMaterialFamily(b), "stone", b);
  }
  for (const b of ["white_terracotta", "glass", "minecraft:nether_bricks", ""]) {
    assert.equal(roofMaterialFamily(b), "other", b);
  }
  assert.equal(roofMaterialFamily("minecraft:stone_bricks"), roofMaterialFamily("stone_bricks"));
});

test("RM2 materialMapRoofBlock — picks the placementRule:roof entry; null when absent", () => {
  assert.equal(materialMapRoofBlock(mapWith("minecraft:deepslate_tiles")), "minecraft:deepslate_tiles");
  // PascalCase placementRule normalizes
  assert.equal(materialMapRoofBlock({ map: [{ role: "r", block: "minecraft:cobblestone", placementRule: "Roof" }] }), "minecraft:cobblestone");
  assert.equal(materialMapRoofBlock({ map: [{ role: "w", block: "minecraft:stone_bricks", placementRule: "walls" }] }), null);
  assert.equal(materialMapRoofBlock({ map: [] }), null);
  assert.equal(materialMapRoofBlock(undefined), null);
});

test("RM3 reconcile — the gatehouse case: timber program roof → grey stone concept roof", () => {
  const r = reconcileRoofMaterial({ program: gatehouseProgram, pack: PACK, materialMap: mapWith("minecraft:deepslate_tiles") });
  assert.equal(r.corrected, true);
  assert.equal(r.roofBlock, "minecraft:deepslate_tiles");
  assert.equal(r.programBlock, "dark_oak_planks");
  assert.equal(r.fromFamily, "timber");
  assert.equal(r.toFamily, "stone");
  assert.match(r.reason, /timber dark_oak_planks → stone deepslate_tiles/);
});

test("RM4 reconcile — matched timber subject is a no-op (generality)", () => {
  // program roof = spruce_planks (timber), concept roof = spruce_planks (timber) → no family flip
  const r = reconcileRoofMaterial({ program: matchedProgram, pack: PACK, materialMap: mapWith("minecraft:spruce_planks") });
  assert.equal(r.corrected, false);
  assert.equal(r.roofBlock, "spruce_planks");        // the program block kept, unchanged
  assert.match(r.reason, /matched/);
});

test("RM5 reconcile — graceful: no roof entry, and 'other' never triggers", () => {
  // no roof entry in the material-map
  const noRoof = reconcileRoofMaterial({ program: gatehouseProgram, pack: PACK, materialMap: { map: [{ role: "w", block: "minecraft:stone_bricks", placementRule: "walls" }] } });
  assert.equal(noRoof.corrected, false);
  assert.equal(noRoof.roofBlock, "dark_oak_planks");
  // an 'other'-family concept roof (terracotta) is NOT a clear timber↔stone flip → conservative no-op
  const otherRoof = reconcileRoofMaterial({ program: gatehouseProgram, pack: PACK, materialMap: mapWith("minecraft:white_terracotta") });
  assert.equal(otherRoof.corrected, false);
  assert.equal(otherRoof.roofBlock, "dark_oak_planks");
  // missing roof.fieldRole throws (loud)
  assert.throws(() => reconcileRoofMaterial({ program: { masses: [{ roof: {} }] }, pack: PACK, materialMap: mapWith("minecraft:deepslate_tiles") }), /roof\.fieldRole/);
});

test("RM6 purity — inputs are not mutated", () => {
  const program = structuredClone(gatehouseProgram);
  const pack = structuredClone(PACK);
  const mm = mapWith("minecraft:deepslate_tiles");
  const before = JSON.stringify({ program, pack, mm });
  reconcileRoofMaterial({ program, pack, materialMap: mm });
  assert.equal(JSON.stringify({ program, pack, mm }), before);
});
