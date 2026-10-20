import { test } from "node:test";
import assert from "node:assert/strict";
import { tmForward, tmInverse, TWD97, utmZone, bareEarth } from "../src/sources/taipei.mjs";

test("TWD97 TM2 round-trips and matches a published point", () => {
  // Taipei 101 (25.0340 N, 121.5645 E) is about E 306,800 N 2,770,000 in TWD97
  const [x, y] = tmForward(121.5645, 25.034);
  assert.ok(Math.abs(x - 306800) < 300 && Math.abs(y - 2770000) < 600, `${x} ${y}`);
  const [lo, la] = tmInverse(x, y); assert.ok(Math.abs(lo - 121.5645) < 1e-8 && Math.abs(la - 25.034) < 1e-8);
  // the central meridian maps to the false easting
  assert.ok(Math.abs(tmForward(121, 24)[0] - TWD97.fe) < 1e-6);
  const [u, v] = tmForward(121.5645, 25.034, utmZone(51)); const [lo2, la2] = tmInverse(u, v, utmZone(51));
  assert.ok(Math.abs(lo2 - 121.5645) < 1e-8 && Math.abs(la2 - 25.034) < 1e-8);
});

test("bare earth takes a tower off flat ground and leaves a hill's shape", () => {
  const N = 60, dsm = new Float32Array(N * N);
  for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) dsm[z * N + x] = 10 + Math.max(0, 150 - 6 * Math.hypot(x - 45, z - 45));
  for (let z = 10; z < 14; z++) for (let x = 10; x < 14; x++) dsm[z * N + x] = 300;           // a tower on the plain
  const g = bareEarth(dsm, N, { r: 4 });
  assert.ok(Math.abs(g[11 * N + 11] - 10) < 0.01);                                        // the tower is gone
  assert.ok(Math.abs(g[45 * N + 45] - 160) < 0.01);                                       // the summit stands (above the basin)
});
