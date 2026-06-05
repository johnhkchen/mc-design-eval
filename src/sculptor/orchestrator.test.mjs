// Orchestrator spine tests (T-024-01) — changedFields, the stage interface, composition with
// independent lock records, and lock enforcement via BOTH layers (draft write-time throw and the
// orchestrator's accept-time bypass defense).

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createBuildState,
  getCell,
  draftState,
  lockFields,
  LockViolationError,
} from "./build-state.mjs";
import { changedFields, defineStage, runStages, StageRejectedError } from "./orchestrator.mjs";

/** A base facade: two occupied cells, nothing locked yet. */
function base() {
  const d = draftState(createBuildState({ width: 2, height: 1 }));
  d.set(0, 0, { occupied: true });
  d.set(1, 0, { occupied: true });
  return d.commit();
}

test("changedFields flags a per-field change", () => {
  const prev = base();
  const d = draftState(prev);
  d.set(0, 0, { material: "minecraft:stone" });
  assert.deepEqual([...changedFields(prev, d.commit())], ["material"]);
});

test("changedFields flags an occupancy add on a new cell", () => {
  const prev = createBuildState({ width: 2, height: 1 });
  const d = draftState(prev);
  d.set(1, 0, { occupied: true });
  assert.deepEqual([...changedFields(prev, d.commit())], ["occupied"]);
});

test("changedFields is empty for an identity output", () => {
  const prev = base();
  assert.equal(changedFields(prev, draftState(prev).commit()).size, 0);
});

test("defineStage produces a pure {name, apply} transform", () => {
  const stage = defineStage({
    name: "paint",
    run: (draft) => {
      for (const x of [0, 1]) draft.set(x, 0, { material: "minecraft:stone" });
    },
  });
  assert.equal(stage.name, "paint");
  const out = stage.apply(base(), {});
  assert.equal(getCell(out, 0, 0).material, "minecraft:stone");
});

test("two trivial stages compose with INDEPENDENT lock records", () => {
  const paint = defineStage({
    name: "material",
    run: (draft) => [0, 1].forEach((x) => draft.set(x, 0, { material: "minecraft:stone" })),
  });
  const emboss = defineStage({
    name: "relief",
    run: (draft) => draft.set(0, 0, { relief: 1 }),
  });
  const out = runStages(base(), [paint, emboss]);
  assert.deepEqual([...out.locked].sort(), ["material", "relief"]);
  assert.deepEqual(out.lockLog, [
    { stage: "material", fields: ["material"] },
    { stage: "relief", fields: ["relief"] },
  ]);
  assert.equal(getCell(out, 0, 0).material, "minecraft:stone");
  assert.equal(getCell(out, 0, 0).relief, 1);
});

test("a stage writing an UNLOCKED field succeeds and that field becomes locked", () => {
  const paint = defineStage({
    name: "material",
    run: (draft) => draft.set(0, 0, { material: "minecraft:stone" }),
  });
  const out = runStages(base(), [paint]);
  assert.equal(out.locked.has("material"), true);
});

test("a stage that overwrites a LOCKED field throws at write time (draft guard)", () => {
  // lock occupied via a real massing-like stage, then a second stage tries to flip it
  const massing = defineStage({ name: "massing", run: (draft) => draft.set(0, 0, { occupied: true }) });
  const destroyer = defineStage({ name: "bad", run: (draft) => draft.set(0, 0, { occupied: false }) });
  // base() already occupies (0,0); massing re-affirms + the orchestrator locks 'occupied' only if
  // it changed. Start from an empty state so massing genuinely contributes 'occupied'.
  const empty = createBuildState({ width: 2, height: 1 });
  assert.throws(() => runStages(empty, [massing, destroyer]), LockViolationError);
});

test("a hand-built stage that bypasses the draft is caught at accept time", () => {
  // Stage 1 locks 'occupied'. Stage 2 is a raw {name, apply} that hand-builds a state mutating the
  // locked field WITHOUT going through the guarded draft — the orchestrator's diff must reject it.
  const massing = defineStage({ name: "massing", run: (draft) => draft.set(0, 0, { occupied: true }) });
  const bypass = {
    name: "bypass",
    apply(state) {
      // forge a successor with (0,0) de-occupied, ignoring the lock
      const cells = new Map(state.cells);
      cells.set("0,0", { occupied: false, material: null, relief: 0 });
      return Object.freeze({ ...state, cells });
    },
  };
  const empty = createBuildState({ width: 2, height: 1 });
  assert.throws(
    () => runStages(empty, [massing, bypass]),
    (err) => {
      assert.ok(err instanceof StageRejectedError);
      assert.equal(err.code, "stage_rejected");
      assert.equal(err.stage, "bypass");
      assert.deepEqual(err.fields, ["occupied"]);
      return true;
    },
  );
});

test("intent is threaded read-only to every stage", () => {
  const seen = [];
  const probe = defineStage({ name: "probe", run: (_d, intent) => seen.push(intent.focal) });
  runStages(base(), [probe], { focal: "center-window" });
  assert.deepEqual(seen, ["center-window"]);
});

test("runStages without an explicit intent defaults to {}", () => {
  const probe = defineStage({ name: "probe", run: (_d, intent) => assert.deepEqual(intent, {}) });
  assert.doesNotThrow(() => runStages(base(), [probe]));
});
