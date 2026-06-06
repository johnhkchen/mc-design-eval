// Unit tests for the PURE geometric feature classifier + feature-aware assigner (E-21 / T-072-01).
// Synthetic occupancy only — no GLB, no GL, no texture decode, no metered call (the project idiom).
// Proves AC#1 (pure/deterministic classify), AC#2 (synthetic-mass features), the assigner half of AC#3
// (feature-primary + colorimetric fallback, AJV-valid round-trip).

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  FEATURES,
  FEATURE_RULE,
  CLASSIFY_DEFAULTS,
  classifyFeatures,
  assignFeatureBlocks,
  mapByRule,
  fallbackPalette,
  featureCounts,
  featureBlockMatrix,
} from "./feature-classify.mjs";
import { keysToArtifact } from "./glb-voxel-build.mjs";
import { assertArtifact } from "../artifact.mjs";

// --- fixtures ---------------------------------------------------------------

/** A solid nx×ny×nz prism as an occupancy. j is up. */
function prism(nx, ny, nz) {
  const occ = [];
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) for (let k = 0; k < nz; k++) occ.push(i, j, k);
  return { dims: [nx, ny, nz], occupied: Int32Array.from(occ), count: occ.length / 3 };
}

/** A solid prism with a 1-wide vertical slot carved into the front (k=0) face at column i=col, j∈[j0,j1]. */
function prismWithSlot(nx, ny, nz, col, j0, j1) {
  const occ = [];
  for (let i = 0; i < nx; i++)
    for (let j = 0; j < ny; j++)
      for (let k = 0; k < nz; k++) {
        if (k === 0 && i === col && j >= j0 && j <= j1) continue;
        occ.push(i, j, k);
      }
  return { dims: [nx, ny, nz], occupied: Int32Array.from(occ), count: occ.length / 3 };
}

const STUB_MAP = [
  { role: "walls", block: "minecraft:stone_bricks", placementRule: "walls" },
  { role: "corners", block: "minecraft:cobblestone", placementRule: "corners-edges" },
  { role: "roof", block: "minecraft:deepslate_tiles", placementRule: "roof" },
  { role: "door", block: "minecraft:dark_oak_planks", placementRule: "openings" },
];

// --- vocabulary -------------------------------------------------------------

test("FEATURES is the closed 5-feature vocabulary, frozen", () => {
  assert.deepEqual([...FEATURES].sort(), ["base", "edge-corner", "flat-face", "opening-recess", "top-roof"]);
  assert.ok(Object.isFrozen(FEATURES));
});

test("FEATURE_RULE maps every feature to a placementRule, frozen", () => {
  assert.ok(Object.isFrozen(FEATURE_RULE));
  for (const f of FEATURES) assert.equal(typeof FEATURE_RULE[f], "string");
  assert.equal(FEATURE_RULE["flat-face"], "walls");
  assert.equal(FEATURE_RULE["edge-corner"], "corners-edges");
  assert.equal(FEATURE_RULE["top-roof"], "roof");
  assert.equal(FEATURE_RULE.base, "base");
  assert.equal(FEATURE_RULE["opening-recess"], "openings");
});

// --- classifyFeatures (AC#2) ------------------------------------------------

test("classifyFeatures on a solid prism: base/top/corner/face", () => {
  const occ = prism(5, 7, 5);
  const f = classifyFeatures(occ);
  assert.equal(f.size, occ.count);
  // lowest layer → base
  assert.equal(f.get("2,0,2"), "base");
  assert.equal(f.get("0,0,0"), "base");
  // topmost upward-facing → top-roof
  assert.equal(f.get("2,6,2"), "top-roof");
  // mid-band vertical edge column → edge-corner
  assert.equal(f.get("0,3,0"), "edge-corner");
  // mid-band broad face (one horizontal side open) → flat-face
  assert.equal(f.get("0,3,2"), "flat-face");
  // hidden interior cell → flat-face (default)
  assert.equal(f.get("2,3,2"), "flat-face");
});

test("classifyFeatures: carved slot back is opening-recess; flat wall is not", () => {
  const occ = prismWithSlot(5, 7, 5, 2, 1, 5);
  const f = classifyFeatures(occ);
  // the cell behind the slot (its outward neighbour is an empty cell flanked by jamb walls)
  assert.equal(f.get("2,3,1"), "opening-recess");
  // a plain wall-face cell on a different elevation is NOT recessed
  assert.equal(f.get("0,3,2"), "flat-face");
});

test("classifyFeatures is deterministic (same input → identical map)", () => {
  const occ = prism(4, 5, 6);
  const a = classifyFeatures(occ);
  const b = classifyFeatures(occ);
  assert.deepEqual([...a.entries()].sort(), [...b.entries()].sort());
});

test("classifyFeatures honors baseBand / upperFrac opts", () => {
  const occ = prism(5, 9, 5);
  const f = classifyFeatures(occ, { baseBand: 2 });
  assert.equal(f.get("2,0,2"), "base");
  assert.equal(f.get("2,1,2"), "base"); // second layer now base too
  assert.equal(f.get("2,2,2"), "flat-face"); // interior above the base band
});

test("classifyFeatures on empty occupancy → empty map", () => {
  assert.equal(classifyFeatures({ dims: [0, 0, 0], occupied: Int32Array.from([]), count: 0 }).size, 0);
});

// --- assignFeatureBlocks (AC#3) ---------------------------------------------

test("assignFeatureBlocks places brick≠cobble BY FEATURE, not colour", () => {
  const occ = prism(5, 7, 5);
  const f = classifyFeatures(occ);
  const keys = assignFeatureBlocks(occ, f, STUB_MAP, {});
  assert.equal(keys.length, occ.count);
  for (const key of keys) assert.ok(!key.includes(":"), `key should be bare: ${key}`);
  const m = featureBlockMatrix(occ, f, keys);
  // corners → cobblestone only; broad faces → stone_bricks only — the restored distinction
  assert.ok(m.cobblestone["edge-corner"] > 0);
  assert.equal(m.cobblestone["flat-face"], 0);
  assert.ok(m.stone_bricks["flat-face"] > 0);
  assert.equal(m.stone_bricks["edge-corner"], 0);
  assert.ok(m.deepslate_tiles["top-roof"] > 0);
});

test("assignFeatureBlocks silent-map fallback: default to walls block when no colours", () => {
  const occ = prism(5, 7, 5);
  const f = classifyFeatures(occ);
  // STUB_MAP has no `base` rule → base cells are silent; no colours → default = walls block
  const keys = assignFeatureBlocks(occ, f, STUB_MAP, {});
  const m = featureBlockMatrix(occ, f, keys);
  assert.ok(m.stone_bricks.base > 0); // base routed to the walls block (deterministic default)
});

test("assignFeatureBlocks silent-map fallback: colorimetric nearestLab when colours given", () => {
  const occ = prism(3, 5, 3);
  const f = classifyFeatures(occ);
  // a map WITHOUT base; feed every cell a near-black colour → fallback should pick the darkest map block
  const map = STUB_MAP;
  const colors = new Array(occ.count * 3).fill(0); // rgb [0,0,0]
  const keys = assignFeatureBlocks(occ, f, map, { colors });
  const m = featureBlockMatrix(occ, f, keys);
  // base cells (silent) resolved by colour → the darkest available map block (deepslate_tiles is darkest)
  const baseBlocks = Object.entries(m).filter(([, c]) => c.base > 0).map(([b]) => b);
  assert.ok(baseBlocks.length >= 1);
  assert.ok(baseBlocks.includes("deepslate_tiles"), `near-black base should snap dark, got ${baseBlocks}`);
});

test("assignFeatureBlocks output round-trips through keysToArtifact + the AJV gate", () => {
  const occ = prism(4, 6, 4);
  const f = classifyFeatures(occ);
  const keys = assignFeatureBlocks(occ, f, STUB_MAP, {});
  const artifact = keysToArtifact(occ, keys, { metadata: { trial_id: "feature-classify-test" } });
  assert.doesNotThrow(() => assertArtifact(artifact)); // AC#3 "Output passes the AJV gate"
  assert.equal(artifact.placements.length, occ.count);
  assert.ok(artifact.palette.manifest.includes("minecraft:cobblestone"));
  assert.ok(artifact.palette.manifest.includes("minecraft:stone_bricks"));
});

// --- helpers ----------------------------------------------------------------

test("mapByRule keeps the first block per placementRule", () => {
  const byRule = mapByRule([
    { block: "minecraft:stone_bricks", placementRule: "walls" },
    { block: "minecraft:andesite", placementRule: "walls" }, // dup rule, ignored
    { block: "minecraft:cobblestone", placementRule: "corners-edges" },
  ]);
  assert.equal(byRule.get("walls"), "minecraft:stone_bricks");
  assert.equal(byRule.get("corners-edges"), "minecraft:cobblestone");
});

test("fallbackPalette returns table-backed Lab entries for the map's blocks", () => {
  const pal = fallbackPalette(STUB_MAP);
  assert.ok(pal.length >= 1);
  for (const e of pal) {
    assert.equal(typeof e.key, "string");
    assert.ok(!e.key.includes(":"));
    assert.equal(e.lab.length, 3);
  }
  assert.ok(pal.some((e) => e.key === "stone_bricks"));
});

test("featureCounts tallies every feature key (zero for absent)", () => {
  const occ = prism(3, 3, 3);
  const counts = featureCounts(classifyFeatures(occ));
  for (const f of FEATURES) assert.equal(typeof counts[f], "number");
  assert.equal(
    FEATURES.reduce((s, f) => s + counts[f], 0),
    occ.count,
  );
});

test("CLASSIFY_DEFAULTS is frozen with the documented tunables", () => {
  assert.ok(Object.isFrozen(CLASSIFY_DEFAULTS));
  assert.equal(CLASSIFY_DEFAULTS.baseBand, 1);
  assert.equal(CLASSIFY_DEFAULTS.recessFlank, 2);
});
