import { test } from "node:test";
import assert from "node:assert/strict";
import { Voxels } from "../src/voxels.mjs";
import { railShape, trace, isPalm, lineField, drawTree, trimCanopy } from "../src/dress.mjs";

test("rail shapes from neighbours: straights, corners, a lone rail", () => {
  assert.equal(railShape(true, true, false, false), "north_south");
  assert.equal(railShape(false, false, true, true), "east_west");
  assert.equal(railShape(true, false, true, false), "north_east");
  assert.equal(railShape(false, true, false, true), "south_west");
  assert.equal(railShape(false, false, true, false), "east_west");
  assert.equal(railShape(true, true, true, false), "north_south");      // a junction keeps the through line
  assert.equal(railShape(false, false, false, false), "north_south");
});

test("a traced line is 4-connected: a diagonal step goes round a corner", () => {
  const cells = trace([[0.5, 0.5], [1.5, 1.5], [2.5, 2.5]]);
  assert.deepEqual(cells, [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2]]);
  for (let k = 1; k < cells.length; k++) assert.equal(Math.abs(cells[k][0] - cells[k - 1][0]) + Math.abs(cells[k][1] - cells[k - 1][1]), 1);
});

test("palms by taxon, genus or leaf type", () => {
  assert.ok(isPalm({ taxon: "Arecaceae" }));
  assert.ok(isPalm({ leaf_type: "palm" }));
  assert.ok(isPalm({ species: "Phoenix canariensis" }));
  assert.ok(!isPalm({ leaf_type: "broadleaved", species: "Platanus x acerifolia" }));
});

test("the line field gives distance, distance along and direction to the nearest line", () => {
  const frame = { N: 20, toBlock: (x, z) => [x, z] };
  const f = lineField(frame, [{ geometry: { type: "LineString", coordinates: [[0, 10], [20, 10]] } }], 5);
  const i = (x, z) => z * 20 + x;
  assert.ok(Math.abs(f.d[i(4, 12)] - 2.5) < 1e-6);
  assert.ok(Math.abs(f.s[i(4, 12)] - 4.5) < 1e-6);
  assert.equal(f.ux[i(4, 12)], 1); assert.equal(f.uz[i(4, 12)], 0);
  assert.equal(f.d[i(4, 0)], Infinity);
});

test("a palm: a trunk to its height, fronds radiating from the top, nothing in the ground", () => {
  const g = new Voxels([21, 24, 21]);
  drawTree(g, 10, 2, 10, { species: "palm", height: 14 });
  // the trunk (it may lean a block or two): jungle log or wood at every height up to the head, near the axis
  for (let y = 3; y <= 12; y++) { let found = false;
    for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (/jungle_(log|wood)$/.test(g.get(10 + dx, y, 10 + dz)?.block ?? "")) found = true;
    assert.ok(found, `trunk at y ${y}`); }
  let leaves = 0, far = 0;
  for (let x = 0; x < 21; x++) for (let z = 0; z < 21; z++) for (let y = 0; y < 24; y++) { const b = g.get(x, y, z);
    if (b?.block === "minecraft:jungle_leaves") { leaves++; assert.equal(b.state.persistent, "true"); if (Math.abs(x - 10) >= 4 || Math.abs(z - 10) >= 4) far++; } }
  assert.ok(leaves > 30 && far > 8, `${leaves} leaves, ${far} out on the fronds`);
  assert.equal(g.get(10, 2, 10), null);
});

test("trimCanopy: a palm's crown leaves the canopy, a pole and a small bare patch go, leafy and bare crowns stay", () => {
  const N = 40, chm = new Float32Array(N * N), I = (x, z) => z * N + x;
  const disc = (cx, cz, r, h) => { for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) if ((x - cx) ** 2 + (z - cz) ** 2 <= r * r) chm[I(x, z)] = h; };
  disc(8, 8, 3, 12); disc(30, 8, 0.5, 9); disc(8, 30, 4, 10); disc(30, 30, 4, 8); disc(30, 19, 2.3, 8);
  const site = { frame: { N, toBlock: (x, z) => [x, z] }, N, I, sc: 1, isB: new Uint8Array(N * N),
    L: { trees: { features: [{ geometry: { type: "Point", coordinates: [8.5, 8.5] }, properties: { taxon: "Arecaceae" } }] } } };
  const green = (i) => (i % N) < 20;                                   // foliage on the west half only
  const r = trimCanopy(chm, site, { green });
  assert.equal(r.palms, 1); assert.equal(site.palms[0].height, 12);
  assert.equal(chm[I(8, 8)], 0);                                       // the palm's crown
  assert.equal(chm[I(30, 8)], 0);                                      // the pole
  assert.equal(chm[I(8, 30)], 10);                                     // the leafy crown
  assert.equal(chm[I(30, 30)], 8);                                     // bare but crown-sized (~50 m2): a winter crown
  assert.equal(chm[I(30, 19)], 0);                                     // bare and small: a kiosk, a lamp head
});
