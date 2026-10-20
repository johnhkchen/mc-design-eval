import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1147281459";
const W = 75, H = 33, D = 14;

// Record: 4 storeys of 5 blocks over a shopfront ground floor, parapet roof near y 21.
const FOOT = "stone_bricks";
const DECK = "smooth_stone";
const FLOOR = "light_gray_concrete";
const WALL = "white_concrete";
const PLINTH = "smooth_stone";
const GLASS = "light_blue_stained_glass_pane";
const SIGN = "red_concrete";
const ROOF_Y = 20;   // roof deck / cornice course
const TOP_WALL = 19; // last facade row below the cornice
const PARAPET = 21;  // parapet course on exterior cells
const DOORS = [10, 62];

const PANE_X = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_Z = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const G = new Map();
for (const [x, z, gr] of cells) G.set(key(x, z), Math.max(0, Math.min(Math.round(gr), TOP_WALL)));
const has = (x, z) => G.has(key(x, z));

// Facade content for one exterior cell at height y.
function facade(face, a, x, z, y, gr) {
  const front = face === "front";
  if (y === gr && gr < 5) return { b: front ? PLINTH : "stone_bricks" };
  if (y >= 5 && y % 5 === 0) return { b: FLOOR };          // storey lines 5, 10, 15
  if (y % 5 === 4) return { b: WALL };                     // lintel bands 4, 9, 14, 19
  if (y < 5 && face === "back") return { b: WALL };
  const doorRow = front && y < 5 && DOORS.includes(x) && (y === gr || y === gr + 1);
  if (doorRow) {
    const half = y === gr ? "lower" : "upper";
    return { b: "dark_oak_door", p: { facing: "north", half, hinge: "left", open: "false", powered: "false" } };
  }
  if (y < 5 && y === 3 && front) return { b: SIGN };       // red fascia over the shops
  if (a % 4 === 0) return { b: WALL };                     // piers every 4 blocks
  return { b: GLASS, p: front || face === "back" ? PANE_X : PANE_Z, glass: true };
}

for (const [x, z, gr] of cells.map(([x, z, gr]) => [x, z, G.get(key(x, z))])) {
  const front = !has(x, z - 1);
  const back = !has(x, z + 1);
  const west = !has(x - 1, z);
  const east = !has(x + 1, z);
  const ext = front || back || west || east;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOOT);
  // Ground floor slab and upper floor slabs (no interiors, just slabs).
  g.set(x, gr, z, DECK);
  for (const fy of [5, 10, 15]) if (fy > gr) g.set(x, fy, z, FLOOR);
  // Roof deck / cornice course.
  if (ROOF_Y > gr) g.set(x, ROOF_Y, z, DECK);

  if (!ext) continue;

  const face = front ? "front" : back ? "back" : "end";
  const a = front || back ? x : z;
  for (let y = gr; y <= TOP_WALL; y++) {
    const r = facade(face, a, x, z, y, gr);
    if (!r) continue;
    g.set(x, y, z, r.b, r.p);
    // Warm light just behind some street-facing windows.
    if (r.glass && front && a % 8 === 1 && y % 5 === 2) {
      const iz = z + 1;
      if (has(x, iz)) g.set(x, y, iz, "shroomlight");
    }
    if (r.glass && back && a % 8 === 5 && y % 5 === 2) {
      const iz = z - 1;
      if (has(x, iz)) g.set(x, y, iz, "glowstone");
    }
  }
  // Parapet on the exterior ring.
  g.set(x, PARAPET, z, a % 4 === 2 ? FLOOR : WALL);
}

// Roof plant: a penthouse block, a vent group, and a lightning mast.
for (let x = 12; x <= 24; x++) {
  for (let z = 3; z <= 10; z++) {
    if (!has(x, z)) continue;
    for (let y = PARAPET; y <= 23; y++) g.set(x, y, z, FLOOR);
    g.set(x, 24, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}
for (let x = 40; x <= 46; x++) {
  for (let z = 3; z <= 5; z++) {
    if (!has(x, z)) continue;
    g.set(x, PARAPET, z, "gray_concrete");
    g.set(x, 22, z, "gray_concrete");
  }
}
if (has(40, 7)) {
  for (let y = PARAPET; y <= 23; y++) g.set(40, y, 7, "iron_block");
  g.set(40, 24, 7, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
