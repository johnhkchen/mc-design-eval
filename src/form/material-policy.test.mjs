// The pure proof for the concept material-correction palette policy (T-073-01, story S-073, epic E-21).
//
// PURE — no GL/model/network, auto-collected by `src/**/*.test.mjs`. Proves AC#2 (the gated right to add a
// concept material; near-tone allowed, near-duplicate rejected) and AC#3 (the augmented allowed palette;
// off-palette checked against THAT set, never a full-table snap). Groups: MP-allowed (the union),
// MP-gate (the addition gate, incl. the near-tone-accept case), MP-classify (swap classification),
// MP-apply (applyCorrection: keep/drop swaps, grow palette, geometry-immutability, additions log).

import test from "node:test";
import assert from "node:assert/strict";

import {
  POLICY_SCHEMA,
  allowedPalette,
  gateAddition,
  classifySwap,
  applyCorrection,
} from "./material-policy.mjs";

const SUB = { min: [0, 0, 0], max: [9, 9, 9] };
const inRegionFixture = () => [
  { op: "voxel", pos: [1, 1, 1], block: "minecraft:stone_bricks" }, // index 0
  { op: "voxel", pos: [2, 2, 2], block: "minecraft:stone_bricks" }, // index 1
  { op: "voxel", pos: [3, 3, 3], block: "minecraft:stone_bricks" }, // index 2
];

// --- MP-allowed -------------------------------------------------------------

test("MP-allowed: union normalizes, dedups, and merges all three sources", () => {
  const set = allowedPalette({
    mapPalette: ["minecraft:stone_bricks", "cobblestone"], // bare + namespaced both normalize
    secondary: ["minecraft:deepslate_tiles"],
    additions: ["dark_oak_log", "minecraft:stone_bricks"], // dup with mapPalette
  });
  assert.ok(set.has("minecraft:stone_bricks"));
  assert.ok(set.has("minecraft:cobblestone"));
  assert.ok(set.has("minecraft:deepslate_tiles"));
  assert.ok(set.has("minecraft:dark_oak_log"));
  assert.equal(set.size, 4, "the stone_bricks duplicate collapses");
});

test("MP-allowed: empty/missing parts → empty set (no throw)", () => {
  assert.equal(allowedPalette().size, 0);
  assert.equal(allowedPalette({ mapPalette: [], secondary: undefined }).size, 0);
});

// --- MP-gate ----------------------------------------------------------------

test("MP-gate: a real, distinct, concept-justified block is ACCEPTED", () => {
  const allowed = allowedPalette({ mapPalette: ["minecraft:stone_bricks"] });
  const g = gateAddition(
    { block: "minecraft:cobblestone", conceptMaterial: "rough cobble buttress", where: "the four corners" },
    { allowed },
  );
  assert.equal(g.ok, true);
  assert.equal(g.block, "minecraft:cobblestone");
});

test("MP-gate: AC#2 near-TONE is allowed — cobblestone beside stone_bricks is a distinct role", () => {
  // The whole point of E-21: a near-tone block is NOT rejected. cobblestone and stone_bricks are within a
  // few ΔL* (the collapse regime) yet distinct materials — the gate must pass it (it is a different id).
  const allowed = allowedPalette({ mapPalette: ["minecraft:stone_bricks", "minecraft:deepslate_tiles"] });
  const g = gateAddition(
    { block: "cobblestone", conceptMaterial: "rough rubble plinth", where: "the base course" },
    { allowed },
  );
  assert.equal(g.ok, true, "near-tone distinct material accepted — this is the point, not a bug");
});

test("MP-gate: a near-DUPLICATE already in the palette is REJECTED (no new material role)", () => {
  const allowed = allowedPalette({ mapPalette: ["minecraft:cobblestone"] });
  const g = gateAddition(
    { block: "minecraft:cobblestone", conceptMaterial: "cobble", where: "corners" },
    { allowed },
  );
  assert.equal(g.ok, false);
  assert.equal(g.reason, "already-in-palette");
});

test("MP-gate: unknown block / missing justification are REJECTED with a reason", () => {
  const allowed = new Set();
  assert.equal(gateAddition({ block: "minecraft:not_a_block", conceptMaterial: "x", where: "y" }, { allowed }).reason, "unknown-block");
  assert.equal(gateAddition({ block: "minecraft:cobblestone", where: "y" }, { allowed }).reason, "no-concept-material");
  assert.equal(gateAddition({ block: "minecraft:cobblestone", conceptMaterial: "x" }, { allowed }).reason, "no-where");
  assert.equal(gateAddition({ conceptMaterial: "x", where: "y" }, { allowed }).reason, "missing-block");
  assert.equal(gateAddition(null, { allowed }).ok, false);
});

// --- MP-classify ------------------------------------------------------------

test("MP-classify: in-palette / needs-addition / off-palette", () => {
  const allowed = allowedPalette({ mapPalette: ["minecraft:stone_bricks"] });
  assert.equal(classifySwap({ block: "minecraft:stone_bricks" }, { allowed }), "in-palette");
  assert.equal(classifySwap({ block: "minecraft:cobblestone" }, { allowed }), "needs-addition");
  assert.equal(classifySwap({ block: "minecraft:not_a_block" }, { allowed }), "off-palette");
  assert.equal(classifySwap({ block: "" }, { allowed }), "off-palette");
});

// --- MP-apply ---------------------------------------------------------------

test("MP-apply: an in-palette swap applies; geometry (positions) is byte-identical", () => {
  const allowed = allowedPalette({ mapPalette: ["minecraft:stone_bricks", "minecraft:cobblestone"] });
  const inR = inRegionFixture();
  const out = applyCorrection(inR, SUB, { swaps: [{ target: 0, block: "minecraft:cobblestone" }] }, { allowed });
  assert.equal(out.applied.length, 1);
  assert.equal(out.rejected.length, 0);
  assert.ok(out.placements.some((p) => p.block === "minecraft:cobblestone" && p.pos[0] === 1), "recolored in place");
  // every position is unchanged vs the input (recolor-only ⇒ no geometry change)
  const posOf = (ps) => ps.map((p) => p.pos.join(",")).sort();
  assert.deepEqual(posOf(out.placements), posOf(inR), "positions identical — geometry immutable");
});

test("MP-apply: a needs-addition swap applies IFF its addition is gated ok, and grows the palette", () => {
  const allowed = allowedPalette({ mapPalette: ["minecraft:stone_bricks"] });
  const inR = inRegionFixture();
  const out = applyCorrection(
    inR,
    SUB,
    {
      swaps: [{ target: 1, block: "minecraft:cobblestone" }],
      additions: [{ block: "minecraft:cobblestone", conceptMaterial: "rough cobble", where: "corner pilaster" }],
    },
    { allowed },
  );
  assert.equal(out.acceptedAdditions.length, 1, "the addition is logged with its justification");
  assert.equal(out.acceptedAdditions[0].block, "minecraft:cobblestone");
  assert.ok(out.grownAllowed.has("minecraft:cobblestone"), "the allowed palette grew");
  assert.ok(out.placements.some((p) => p.block === "minecraft:cobblestone"), "the swap applied after the addition");
});

test("MP-apply: an off-palette swap with NO justification is DROPPED (recorded, not thrown)", () => {
  const allowed = allowedPalette({ mapPalette: ["minecraft:stone_bricks"] });
  const inR = inRegionFixture();
  const out = applyCorrection(inR, SUB, { swaps: [{ target: 0, block: "minecraft:cobblestone" }] }, { allowed });
  assert.equal(out.applied.length, 0, "no swap applied");
  assert.ok(out.rejected.some((r) => /off-palette/.test(r.reason)), "dropped as off-palette");
  assert.ok(out.placements.every((p) => p.block === "minecraft:stone_bricks"), "build unchanged");
});

test("MP-apply: schema tag is stable", () => {
  assert.equal(POLICY_SCHEMA, "material-policy/v1");
});
