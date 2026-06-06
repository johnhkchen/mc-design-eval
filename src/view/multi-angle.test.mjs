import { test } from "node:test";
import assert from "node:assert/strict";
import { VIEW_ANGLES, resolveAngle } from "./multi-angle.mjs";

test("VIEW_ANGLES has the 6 ortho faces and 4 ground diagonals", () => {
  assert.deepEqual(Object.keys(VIEW_ANGLES.ortho).sort(), ["back", "bottom", "front", "left", "right", "top"]);
  assert.equal(VIEW_ANGLES.diag.length, 4);
  assert.deepEqual(VIEW_ANGLES.diag.map((d) => d.name).sort(), ["+x+z", "+x-z", "-x+z", "-x-z"]);
  assert.ok(Number.isFinite(VIEW_ANGLES.threeQuarter.azimuthDeg));
});

test("resolveAngle: named ortho / diag / threeQuarter", () => {
  assert.deepEqual(resolveAngle("front"), { azimuthDeg: 0, elevationDeg: 0 });
  assert.equal(resolveAngle("+x+z").azimuthDeg, 45);
  assert.ok(Number.isFinite(resolveAngle("threeQuarter").azimuthDeg));
});

test("resolveAngle: arbitrary 3-axis angle is accepted (reading any angle is in scope)", () => {
  assert.deepEqual(resolveAngle({ azimuthDeg: 200, elevationDeg: 12 }), { azimuthDeg: 200, elevationDeg: 12 });
  assert.deepEqual(resolveAngle({ azimuthDeg: 33, elevationDeg: 7, fov: 50 }), { azimuthDeg: 33, elevationDeg: 7, fov: 50 });
});

test("resolveAngle: unknown name / bad spec throws", () => {
  assert.throws(() => resolveAngle("nope"), /unknown named angle/);
  assert.throws(() => resolveAngle({ azimuthDeg: NaN, elevationDeg: 0 }), /known name or/);
  assert.throws(() => resolveAngle(null), /known name or/);
});
