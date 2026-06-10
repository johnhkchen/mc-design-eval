// Unit suite for value-true block selection (T-086-01, story S-086, epic E-24).
//
// Offline, deterministic, decode-free. Family membership and the cottage-shaped decisions run
// against the COMMITTED block→Lab table (the strongest form: the real candidate pool); the
// decision-policy matrix (margin / floor / not-in-table) runs on tiny synthetic tables so the
// expected outcome is derivable by hand, not by trusting the code.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CHROMA_WEIGHT,
  SWITCH_MARGIN,
  MIN_CELLS,
  familyOf,
  isExcludedCandidate,
  familyCandidates,
  weightedDeltaE,
  estimateBorderColor,
  sampleRoleSwatches,
  selectValueTrueBlock,
  selectValueTrueMap,
} from "./value-select.mjs";
import { deltaE76 } from "./cielab.mjs";

// --- Group A: families -------------------------------------------------------

test("familyOf classifies the cottage manifest as expected", () => {
  assert.equal(familyOf("minecraft:white_terracotta"), "smooth");
  assert.equal(familyOf("stone_bricks"), "stone"); // stone wins over brick (precedence)
  assert.equal(familyOf("cobblestone"), "stone");
  assert.equal(familyOf("dark_oak_log"), "log");
  assert.equal(familyOf("spruce_planks"), "planks");
  assert.equal(familyOf("dark_oak_planks"), "planks");
  assert.equal(familyOf("bricks"), "brick");
});

test("familyOf precedence and edge cases", () => {
  assert.equal(familyOf("quartz_bricks"), "brick"); // brick before smooth
  assert.equal(familyOf("stripped_birch_wood"), "log"); // wood/log suffix first
  assert.equal(familyOf("warped_hyphae"), "log");
  assert.equal(familyOf("polished_deepslate"), "stone");
  assert.equal(familyOf("smooth_sandstone"), "smooth");
  assert.equal(familyOf("gold_block"), null); // no family
});

test("isExcludedCandidate: gravity + ore blocks out, real wall materials in", () => {
  for (const bad of ["sand", "red_sand", "gravel", "white_concrete_powder", "deepslate_iron_ore", "minecraft:coal_ore"]) {
    assert.equal(isExcludedCandidate(bad), true, `${bad} must be excluded`);
  }
  for (const ok of ["sandstone", "tuff", "white_terracotta", "white_concrete", "deepslate_bricks"]) {
    assert.equal(isExcludedCandidate(ok), false, `${ok} must be selectable`);
  }
});

test("familyCandidates: committed-table pools respect family + exclusions", () => {
  const smooth = familyCandidates("smooth");
  const keys = new Set(smooth.map((e) => e.key));
  assert.ok(keys.has("white_terracotta") && keys.has("sandstone") && keys.has("bone_block"));
  assert.ok(!keys.has("sand"), "gravity block must not be a candidate");
  const stone = new Set(familyCandidates("stone").map((e) => e.key));
  assert.ok(stone.has("tuff") && stone.has("stone_bricks"));
  assert.ok(!stone.has("deepslate_iron_ore"), "ore must not be a candidate");
  for (const e of smooth) assert.ok(Array.isArray(e.lab) && e.lab.length === 3);
  assert.throws(() => familyCandidates("velvet"), /unknown or empty family/);
});

// --- Group B: metric ----------------------------------------------------------

test("weightedDeltaE: w=1 is deltaE76; w=2 doubles the a*/b* contribution", () => {
  const a = [50, 10, -5];
  const b = [42, 13, 1];
  assert.ok(Math.abs(weightedDeltaE(a, b, 1) - deltaE76(a, b)) < 1e-12);
  // hand-computed: dL=8, da=3·2=6, db=−6·2=−12 → √(64+36+144) = √244
  assert.ok(Math.abs(weightedDeltaE(a, b, 2) - Math.sqrt(244)) < 1e-12);
  // default weight is the exported constant
  assert.equal(weightedDeltaE(a, b), weightedDeltaE(a, b, CHROMA_WEIGHT));
});

// --- Group C: sampling helpers --------------------------------------------------

/** Build a W×H RGBA image with every pixel `fill`, then paint the 1-px border `border`. */
function borderImage(W, H, fill, border) {
  const data = new Uint8Array(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const p = (y * W + x) << 2;
      const edge = x === 0 || y === 0 || x === W - 1 || y === H - 1;
      const c = edge ? border : fill;
      data[p] = c[0]; data[p + 1] = c[1]; data[p + 2] = c[2]; data[p + 3] = 255;
    }
  }
  return { width: W, height: H, data };
}

test("estimateBorderColor: mean of the 1-px frame, center ignored", () => {
  const img = borderImage(8, 6, [10, 20, 30], [250, 240, 230]);
  assert.deepEqual(estimateBorderColor(img), [250, 240, 230]);
  assert.throws(() => estimateBorderColor({ width: 0, height: 0, data: new Uint8Array(0) }), /empty image/);
});

test("sampleRoleSwatches: mean Lab per assigned block from cellMeans; missing cellMeans throws", () => {
  // 2×2 grid: two cells assigned "a" with known means, one "b", one air.
  const grid = [["a", "a"], ["b", null]];
  const cellMeans = [[[100, 100, 100], [200, 200, 200]], [[50, 60, 70], null]];
  const sw = sampleRoleSwatches({ grid, cellMeans }, ["minecraft:a", "b"]);
  assert.equal(sw.get("a").cells, 2);
  assert.equal(sw.get("b").cells, 1);
  // "a"'s swatch is the mean of the two cells' Labs — between the greys, L* strictly increasing
  const La = sw.get("a").lab[0];
  assert.ok(La > 40 && La < 85, `mean L* of grey 100 and grey 200 in (40,85), got ${La}`);
  assert.ok(!sw.has("c"), "unassigned block does not appear");
  assert.throws(() => sampleRoleSwatches({ grid }, ["a"]), /no cellMeans/);
});

// --- Group D: the decision core -------------------------------------------------

// A tiny synthetic table: one "smooth" family with a hue-drifted prior and a faithful winner,
// plus a busy distractor. Labs chosen so outcomes are hand-derivable.
const SYNTH = {
  blocks: [
    { block: "white_terracotta", lab: [75, 9, 13], var: 12 }, // the prior: pink (a*+9)
    { block: "white_concrete", lab: [70, 1, 20], var: 2 }, // faithful cream, flat
    { block: "calcite", lab: [70, 1, 20], var: 90000 }, // same color, very busy → flat-penalized
  ],
};
const CREAM = [69, 1, 21]; // the "concept swatch": warm cream, near-neutral a*

test("switched: a hue-drifted prior loses to the faithful family block", () => {
  const r = selectValueTrueBlock(
    { named: "minecraft:white_terracotta", sampleLab: CREAM, sampleCells: 100 },
    { table: SYNTH },
  );
  assert.equal(r.switched, true);
  assert.equal(r.reason, "switched");
  assert.equal(r.chosen, "white_concrete"); // not calcite: same ΔE, crushing var penalty
  assert.equal(r.family, "smooth");
  // honesty: reported ΔE is the TRUE unweighted distance, components carried
  assert.ok(Math.abs(r.namedTrue.deltaE - deltaE76(CREAM, [75, 9, 13])) < 0.01);
  assert.ok(Math.abs(r.chosenTrue.deltaE - deltaE76(CREAM, [70, 1, 20])) < 0.01);
  assert.ok(r.namedTrue.da > 7, "the pink axis is visible in the named components");
  assert.ok(r.chosenScore < r.namedScore * (1 - SWITCH_MARGIN));
});

test("prior-is-best: a faithful prior keeps itself", () => {
  const r = selectValueTrueBlock(
    { named: "white_concrete", sampleLab: CREAM, sampleCells: 100 },
    { table: SYNTH },
  );
  assert.equal(r.switched, false);
  assert.equal(r.reason, "prior-is-best");
  assert.equal(r.chosen, "white_concrete");
});

test("below-margin: a winner without a clear margin keeps the prior", () => {
  // Winner beats the prior but by far less than the margin: prior nearly faithful.
  const table = {
    blocks: [
      { block: "white_terracotta", lab: [70, 2, 20], var: 0 }, // prior: score √(1+4+4) = 3
      { block: "white_concrete", lab: [70.1, 1.9, 20.1], var: 0 }, // score ≈ 2.77 — better, but < 15% better
    ],
  };
  const r = selectValueTrueBlock(
    { named: "white_terracotta", sampleLab: CREAM, sampleCells: 100 },
    { table },
  );
  assert.equal(r.switched, false);
  assert.equal(r.reason, "below-margin");
  assert.equal(r.chosen, "white_terracotta");
});

test("thin-sample / no-sample / not-in-table / no-family all keep the prior, recorded", () => {
  const thin = selectValueTrueBlock(
    { named: "white_terracotta", sampleLab: CREAM, sampleCells: MIN_CELLS - 1 },
    { table: SYNTH },
  );
  assert.deepEqual([thin.switched, thin.reason, thin.chosen], [false, "thin-sample", "white_terracotta"]);

  const none = selectValueTrueBlock({ named: "white_terracotta", sampleLab: null, sampleCells: 0 }, { table: SYNTH });
  assert.equal(none.reason, "no-sample");

  const absent = selectValueTrueBlock(
    { named: "magenta_terracotta", sampleLab: CREAM, sampleCells: 100 },
    { table: SYNTH }, // smooth family exists, but this block isn't in the synthetic table
  );
  assert.deepEqual([absent.switched, absent.reason], [false, "not-in-table"]);

  const noFam = selectValueTrueBlock({ named: "gold_block", sampleLab: CREAM, sampleCells: 100 }, { table: SYNTH });
  assert.deepEqual([noFam.switched, noFam.reason, noFam.chosen], [false, "no-family", "gold_block"]);
});

test("selectValueTrueMap: rows keep role/placementRule and join swatches by bare block", () => {
  const map = [
    { role: "plaster infill", block: "minecraft:white_terracotta", placementRule: "walls" },
    { role: "unseen trim", block: "minecraft:white_concrete", placementRule: "trim" },
  ];
  const swatches = new Map([["white_terracotta", { lab: CREAM, cells: 100 }]]);
  const rows = selectValueTrueMap(map, swatches, { table: SYNTH });
  assert.equal(rows.length, 2);
  assert.equal(rows[0].role, "plaster infill");
  assert.equal(rows[0].placementRule, "walls");
  assert.equal(rows[0].switched, true);
  assert.equal(rows[1].reason, "no-sample"); // never seen in the concept → prior kept
  assert.throws(() => selectValueTrueMap([], swatches), /non-empty/);
});

// --- Group E: the cottage shape against the COMMITTED table ---------------------

test("cottage plaster: the committed table dethrones white_terracotta for a measured cream", () => {
  // The research-measured concept swatch (n=96, border-bg dropped): warm cream, near-neutral a*.
  const r = selectValueTrueBlock({ named: "white_terracotta", sampleLab: [68.5, 1.2, 22.1], sampleCells: 137 });
  assert.equal(r.switched, true, `expected a switch, got ${r.reason}`);
  assert.notEqual(r.chosen, "white_terracotta");
  assert.equal(r.family, "smooth");
  // the chosen block's hue error must beat the pink prior's
  assert.ok(Math.abs(r.chosenTrue.da) < Math.abs(r.namedTrue.da), "a* drift must shrink");
});

test("cottage planks/log roles: faithful priors survive against the committed table", () => {
  for (const [named, lab] of [
    ["spruce_planks", [39.4, 7.4, 24.4]],
    ["dark_oak_planks", [20.1, 8.2, 19.1]],
    ["dark_oak_log", [16.7, 3.7, 9.2]],
  ]) {
    const r = selectValueTrueBlock({ named, sampleLab: lab, sampleCells: 150 });
    assert.equal(r.switched, false, `${named} should keep (got ${r.reason} → ${r.chosen})`);
  }
});
