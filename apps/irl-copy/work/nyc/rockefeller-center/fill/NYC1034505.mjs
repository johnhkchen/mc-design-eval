// 62 West 48th Street: a 1920 mixed-use walk-up on a 25 x 100 ft Midtown lot. Brick walk-up over a two-storey commercial
// front on 48th Street (the south face, z 26), a court between the front and the rear block where the lidar sees no roof,
// and a stone-banded brick shell with a shopfront, storey strings, a calcite cornice and lit windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${HERE}/NYC1034505.cells.json`, "utf8"));

const X = 6, Y = 30, Z = 27;
const STOREY = 3;

// Roof height above y 0 per cell, [z][x], from the lidar with its noise smoothed into 3-block storeys. 0 is the court:
// the lidar sees no roof across z 17-21 (and z 18-21 on the west party wall), so it stays open to the sky.
const H = [];
const row = (...v) => H.push(v);
row(6, 6, 6, 6, 6, 6);        // z0  rear wing, two storeys
row(6, 6, 6, 6, 6, 6);       // z1
row(15, 6, 15, 15, 15, 15);  // z2 west party wall flush with the body (a 1-block spike at 18 read as a stray tower)
for (let i = 0; i < 14; i++) row(15, 15, 15, 15, 15, 15);   // z3-16 rear block, five storeys
row(15, 0, 0, 0, 0, 0);       // z17 court edge
for (let i = 0; i < 4; i++) row(0, 0, 0, 0, 0, 0);          // z18-21 court
row(6, 6, 6, 6, 6, 6);        // z22 front block, two storeys (the party wall steps down with it)
for (let i = 0; i < 3; i++) row(6, 6, 6, 6, 6, 6);          // z23-25
row(4, 4, 4, 4, 4, 4);        // z26 street face: one-storey shopfront with its sign band
if (H.length !== Z) throw new Error(`height rows ${H.length} != ${Z}`);

const footprint = new Set(cells.map(([x, z]) => `${x},${z}`));
const R = (x, z) => (x < 0 || z < 0 || x >= X || z >= Z ? 0 : H[z][x]);
const solid = (x, y, z) => y >= 0 && y < R(x, z);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const g = new Voxels([X, Y, Z]);

// Glass panes connect to the solid masonry beside them, so a window row reads as a frame, not loose glass.
const pane = (x, y, z) => ({
  north: String(solid(x, y, z - 1)), south: String(solid(x, y, z + 1)),
  east: String(solid(x + 1, y, z)), west: String(solid(x - 1, y, z)), waterlogged: "false",
});

const lamps = [];
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const r = R(x, z);
  if (!r) { if (footprint.has(`${x},${z}`)) g.set(x, 0, z, "stone_bricks"); continue; }   // the court floor
  for (let y = 0; y < r; y++) {
    const ex = DIRS.filter(([dx, dz]) => !solid(x + dx, y, z + dz));   // faces that show to the outside or a court
    const zEx = ex.find(([, dz]) => dz);
    const p = y % STOREY;
    if (y === r - 1) g.set(x, y, z, ex.length ? "calcite" : "stone");                    // cornice cap, roof membrane
    else if (y === 0) g.set(x, y, z, ex.length ? "polished_granite" : "smooth_stone");   // plinth, ground floor
    else if (ex.length) {
      if (p === 0) g.set(x, y, z, "calcite");                                             // storey string
      else if (zEx && (x === 1 || x === 4)) { g.set(x, y, z, "glass_pane", pane(x, y, z)); if (p === 1) lamps.push([x, y, z, zEx[1]]); }
      else g.set(x, y, z, "bricks");
    } else if (p === 0) g.set(x, y, z, "smooth_stone");                                   // a floor slab per storey
  }
}

// Shopfront on 48th Street (z 26): granite piers, glass bays either side of the door, the door at x 2.
const door = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
g.set(2, 0, 26, "oak_door", door("lower"));
g.set(2, 1, 26, "oak_door", door("upper"));
for (const x of [0, 1, 3, 4, 5]) {
  if (x === 0 || x === 5) { g.set(x, 0, 26, "polished_granite"); g.set(x, 1, 26, "polished_granite"); g.set(x, 2, 26, "polished_granite"); }
  else { g.set(x, 0, 26, "polished_granite"); g.set(x, 1, 26, "glass_pane", pane(x, 1, 26)); g.set(x, 2, 26, "glass_pane", pane(x, 2, 26)); }
}
g.set(2, 2, 26, "glass_pane", pane(2, 2, 26));   // transom over the door
for (const x of [0, 1, 2, 3, 4, 5]) g.set(x, 3, 26, "calcite");

// Warm light behind some windows: a shroomlight one air cell back from the glass, in the room's air gap.
for (const [x, y, z, s] of lamps) {
  const k = Math.floor(y / STOREY);
  if ((k + x) % 2 !== 1) continue;
  const tz = z - 2 * s;
  if (!solid(x, y, tz) || !DIRS.every(([dx, dz]) => solid(x + dx, y, tz + dz))) continue;
  g.set(x, y, tz, "shroomlight");
}

const out = g.save(`${HERE}/NYC1034505.nbt`);
console.log(`NYC1034505.nbt: ${out.blocks} blocks, palette ${out.palette}`);
