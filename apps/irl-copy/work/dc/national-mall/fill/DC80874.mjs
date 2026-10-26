import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 602 Emmanuel Ct NW: a three-storey brick walk-up in the Shaw / Logan Circle manner. Red brick between stone quoins,
// a stone-brick base and string course, a stone-brick cornice on a flat tar roof, and a central raised penthouse band
// (the lidar's 4-block row) with two chimneys. Windows are glass panes in the ring; the cell behind each window is the
// air gap (ground to first storey) or a lit stand-in (glowstone, shroomlight) on the solid floor slab above.

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC80874.cells.json", "utf8"));
const H = 16;
const g = new Voxels([6, H, 6]);

const k = (x, z) => `${x},${z}`;
const fp = new Map(cells.map(([x, z, ground, roof]) => [k(x, z), { ground, roof }]));
const inFp = (x, z) => fp.has(k(x, z));
const faces = (x, z) => [
  ...(inFp(x, z - 1) ? [] : ["N"]), ...(inFp(x, z + 1) ? [] : ["S"]),
  ...(inFp(x - 1, z) ? [] : ["W"]), ...(inFp(x + 1, z) ? [] : ["E"]),
];
// windows: the single-face ring cells, odd bays on the long faces, the two middle cells on the east face
const isWindow = (x, z, f) => (f === "N" || f === "S") ? x % 2 === 1 : f === "W" ? z % 2 === 1 : (z === 2 || z === 3);
// the air cell a window looks into: one step inward
const inward = (x, z, f) => ({ N: [x, z + 1], S: [x, z - 1], W: [x + 1, z], E: [x - 1, z] })[f];
const paneSides = (f) => (f === "N" || f === "S") ? { east: "true", west: "true", north: "false", south: "false" }
  : { north: "true", south: "true", east: "false", west: "false" };
const pane = (f) => ({ ...paneSides(f), waterlogged: "false" });
const lit = (x, z) => (x * 2 + z) % 3 === 0;

// the window gaps: which core cells sit behind a glass pane, and whether a stand-in light goes there
const gaps = new Map();
for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number), fs = faces(x, z);
  if (fs.length !== 1 || (x === 2 && z === 0)) continue;
  if (isWindow(x, z, fs[0])) { const [gx, gz] = inward(x, z, fs[0]); gaps.set(k(gx, gz), lit(gx, gz)); }
}

const isRingOnly = (x, z) => faces(x, z).length > 0;

for (const [key, { ground, roof }] of fp) {
  const [x, z] = key.split(",").map(Number);
  // foundation: solid from y 0 up to this cell's ground (none here, the lowest ground is y 0)
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone");
  const fs = faces(x, z), ring = fs.length > 0, corner = fs.length >= 2;

  // the penthouse band: the lidar's 4-block rows (z 2 and 3), a stone-brick box with glazed bays on its long faces
  if (z === 2 || z === 3) {
    for (let y = 0; y < roof; y++) if (y === 3) {
      if (x === 0 || x === 5 || x % 2 === 0) g.set(x, y, z, "stone_bricks");
      else g.set(x, y, z, "glass_pane", { east: "true", west: "true", north: "true", south: "true", waterlogged: "false" });
    }
  }
  for (let y = 0; y < Math.min(roof, 3); y++) {
    if (ring) {
      // ground-floor door on the north front, two blocks tall, a lintel of stone above it
      if (x === 2 && z === 0) {
        if (y <= 1) g.set(x, y, z, "oak_door", { facing: "north", half: y === 0 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
        else g.set(x, y, z, "stone_bricks");
        continue;
      }
      if (corner) { g.set(x, y, z, "stone_bricks"); continue; }     // quoins
      if (y === 0) { g.set(x, y, z, "stone_bricks"); continue; }     // base course
      const f = fs[0];
      if (isWindow(x, z, f)) { g.set(x, y, z, "glass_pane", pane(f)); continue; }
      g.set(x, y, z, "bricks");                                      // piers in red brick, both upper storeys
    } else {
      // core: the floor slab per storey, with an air gap behind each window's glass at storey 2
      const gapLit = gaps.get(k(x, z));
      if (y === 0) { if (x === 2 && z === 1) continue; g.set(x, y, z, "stone"); continue; }   // the door hall is open
      if (y === 1) {
        if (x === 2 && z === 1) continue;
        if (gaps.has(k(x, z))) { if (gapLit) g.set(x, y, z, "glowstone"); }
        else g.set(x, y, z, "stone");
        continue;
      }
      if (y === 2) g.set(x, y, z, roof === 3 ? "smooth_stone" : "stone");   // solid behind the second storey's glass; tar roof on the sides
    }
  }
  // the cornice on the side cells' top (the lidar's 3-block roof)
  if (ring && roof === 3) g.set(x, 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// two chimneys on the penthouse band
g.set(0, 4, 2, "bricks");
g.set(5, 4, 3, "bricks");

console.log(g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC80874.nbt"));
