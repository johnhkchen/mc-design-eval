// Build-state spine tests (T-024-01) — cell model, key scheme, draft/commit, and the load-bearing
// write-time lock guard. Pure unit tests on hand-built states; no fixtures, no I/O.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  FIELDS,
  cellKey,
  parseKey,
  defaultCell,
  createBuildState,
  getCell,
  isLocked,
  occupiedCells,
  draftState,
  lockFields,
  LockViolationError,
} from "./build-state.mjs";

test("FIELDS is the canonical lockable set", () => {
  assert.deepEqual([...FIELDS], ["occupied", "material", "relief"]);
});

test("cellKey/parseKey round-trip integers", () => {
  assert.equal(cellKey(3, 7), "3,7");
  assert.deepEqual(parseKey("3,7"), { x: 3, y: 7 });
  const { x, y } = parseKey(cellKey(-2, 5));
  assert.deepEqual({ x, y }, { x: -2, y: 5 });
});

test("defaultCell is air, no material, flat", () => {
  assert.deepEqual(defaultCell(), { occupied: false, material: null, relief: 0 });
});

test("createBuildState is empty, unlocked, and frozen", () => {
  const s = createBuildState({ width: 4, height: 3 });
  assert.equal(s.width, 4);
  assert.equal(s.height, 3);
  assert.equal(s.cells.size, 0);
  assert.equal(s.locked.size, 0);
  assert.deepEqual(s.lockLog, []);
  assert.ok(Object.isFrozen(s));
});

test("createBuildState rejects non-positive / non-integer dims", () => {
  assert.throws(() => createBuildState({ width: 0, height: 3 }));
  assert.throws(() => createBuildState({ width: 4, height: 2.5 }));
});

test("draft.set writes a field; getCell reflects it after commit", () => {
  const s0 = createBuildState({ width: 2, height: 2 });
  const d = draftState(s0);
  d.set(1, 1, { occupied: true, material: "minecraft:stone" });
  const s1 = d.commit();
  assert.deepEqual(getCell(s1, 1, 1), { occupied: true, material: "minecraft:stone", relief: 0 });
  // source state untouched (immutability by construction)
  assert.equal(getCell(s0, 1, 1), undefined);
});

test("draft.get returns a default copy for an untouched cell", () => {
  const d = draftState(createBuildState({ width: 2, height: 2 }));
  assert.deepEqual(d.get(0, 0), defaultCell());
});

test("commit freezes the state and preserves locked/lockLog", () => {
  const s0 = lockFields(createBuildState({ width: 2, height: 2 }), "massing", ["occupied"]);
  const s1 = draftState(s0).commit();
  assert.ok(Object.isFrozen(s1));
  assert.deepEqual([...s1.locked], ["occupied"]);
  assert.deepEqual(s1.lockLog, [{ stage: "massing", fields: ["occupied"] }]);
});

test("set to a LOCKED field with a NEW value throws LockViolationError with location", () => {
  const s0 = lockFields(createBuildState({ width: 2, height: 2 }), "massing", ["occupied"]);
  // first occupy via a draft over the unlocked base, then lock, then attempt to flip it
  const occupied = (() => {
    const d = draftState(createBuildState({ width: 2, height: 2 }));
    d.set(0, 0, { occupied: true });
    return lockFields(d.commit(), "massing", ["occupied"]);
  })();
  const d = draftState(occupied);
  assert.throws(
    () => d.set(0, 0, { occupied: false }),
    (err) => {
      assert.ok(err instanceof LockViolationError);
      assert.equal(err.code, "lock_violation");
      assert.equal(err.field, "occupied");
      assert.deepEqual({ x: err.x, y: err.y }, { x: 0, y: 0 });
      return true;
    },
  );
  // a separate locked base with no cell also throws when introducing the field
  assert.throws(() => draftState(s0).set(1, 1, { occupied: true }), LockViolationError);
});

test("set the SAME value to a locked field is a permitted no-op", () => {
  const d0 = draftState(createBuildState({ width: 2, height: 2 }));
  d0.set(0, 0, { occupied: true });
  const locked = lockFields(d0.commit(), "massing", ["occupied"]);
  const d = draftState(locked);
  assert.doesNotThrow(() => d.set(0, 0, { occupied: true }));
  // and it may still write a DIFFERENT, unlocked field on the same cell
  assert.doesNotThrow(() => d.set(0, 0, { material: "minecraft:stone" }));
  assert.equal(getCell(d.commit(), 0, 0).material, "minecraft:stone");
});

test("isLocked reflects the locked set", () => {
  const s = lockFields(createBuildState({ width: 1, height: 1 }), "m", ["material"]);
  assert.equal(isLocked(s, "material"), true);
  assert.equal(isLocked(s, "relief"), false);
});

test("lockFields unions + logs; empty fields is a no-op (no record)", () => {
  const s0 = createBuildState({ width: 1, height: 1 });
  const s1 = lockFields(s0, "a", ["occupied"]);
  const s2 = lockFields(s1, "b", ["material"]);
  assert.deepEqual([...s2.locked].sort(), ["material", "occupied"]);
  assert.deepEqual(s2.lockLog, [
    { stage: "a", fields: ["occupied"] },
    { stage: "b", fields: ["material"] },
  ]);
  const s3 = lockFields(s2, "noop", []);
  assert.equal(s3, s2); // unchanged reference: nothing contributed
});

test("occupiedCells returns only occupied, sorted by (y,x)", () => {
  const d = draftState(createBuildState({ width: 3, height: 3 }));
  d.set(2, 0, { occupied: true });
  d.set(0, 0, { occupied: true });
  d.set(1, 2, { occupied: true });
  d.set(1, 1, { occupied: false }); // not occupied → excluded
  const cells = occupiedCells(d.commit());
  assert.deepEqual(cells.map(({ x, y }) => [x, y]), [[0, 0], [2, 0], [1, 2]]);
});
