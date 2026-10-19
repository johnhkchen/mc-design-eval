// 128 West 47th Street, 1910 Midtown commercial loft: a seven-storey red-brick block with a granite and glass shopfront,
// white terracotta belt courses and a cornice, a parapet, and punched windows on every exposed face. The lidar roof is
// flat at 23-25 blocks across the footprint (the low edge readings are noise), so it is one tier, with a penthouse on it.
// Footprint 10 x 24 (x = frontage on 47th Street, z 0 = the street front, z 23 = the rear). The south-west corner sits
// lower (ground 0), so its brick runs down to y 0. The east side is cut back by a light court (x 7-9, z 9-15).
// Solid brick body (no rooms): each window is a glass pane with an air gap behind it, and some gaps hold warm light.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1022668.cells.json`, "utf8"));
const X = 10, Z = 24, Y = 28;
const TOP = 24;                                  // body roof surface (blocks y < 24); the parapet on the edge reaches 25

const ground = new Map(cells.map(([x, z, g]) => [`${x},${z}`, g]));
if (ground.size !== X * Z && ground.size !== cells.length) throw new Error("footprint cells do not match");
const inside = (x, z) => ground.has(`${x},${z}`);
const OUT = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };   // outward normal of each face
const IN = { n: [0, 1], s: [0, -1], w: [1, 0], e: [-1, 0] };    // the cell behind a face
const faceOf = (x, z) => ["s", "n", "w", "e"].find((d) => !inside(x + OUT[d][0], z + OUT[d][1]));   // rear wins a corner over the side

const g = new Voxels([X, Y, Z]);
const PANE_X = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // wall runs along x
const PANE_Z = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // wall runs along z
const door = (facing, half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });

// Storey rows: y 1 is the plinth or sill, 4, 7, ... 22 are belt courses (y % 3 === 1), and every other row from 2 to 21
// is a window band. The ground floor is y 1-3, so the shopfront sits on the plinth and stops at the fascia (y 4).
const isBelt = (y) => y % 3 === 1;
const isWindowRow = (y) => y >= 2 && y <= 21 && !isBelt(y);
// A lit window is one in five, spread over the facade so the dusk read is even.
const lightAt = (u, y) => (u * 7 + y * 3) % 10;

// 1. The body: stone below the lowest ground, brick above it; interior roof surface is tar; the edge gets a plinth.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const face = faceOf(x, z);
  for (let y = 0; y < TOP; y++) {
    if (y < gr) { g.set(x, y, z, "stone_bricks"); continue; }
    g.set(x, y, z, !face && y === TOP - 1 ? "gray_concrete" : "bricks");
  }
  if (face) g.set(x, 0, z, "polished_granite");
}

// 2. The facade: each edge cell shows its one exposed face, with piers, belts, windows, the cornice and the parapet.
for (const [key] of ground) {
  const [x, z] = key.split(",").map(Number);
  const face = faceOf(x, z);
  if (!face) continue;
  const along = face === "n" || face === "s" ? x : z;     // position along the wall, for the bay rhythm
  const onStreet = face === "n";
  const longSide = (face === "w" || face === "e") && (x === 0 || x === 9);
  const [ix, iz] = IN[face];
  const paneState = face === "n" || face === "s" ? PANE_X : PANE_Z;
  const piered = along % 3 === 0;                           // piers at 0, 3, 6, 9 (the corner pier sits on the edge)

  // Belts and plinth.
  if (onStreet) g.set(x, 1, z, "polished_granite");
  else g.set(x, 1, z, "stone_bricks");
  for (let y = 4; y <= 19; y += 3) g.set(x, y, z, onStreet && y === 4 ? "dark_oak_planks" : "white_terracotta");
  g.set(x, 22, z, "white_terracotta");                      // the cornice band
  g.set(x, 23, z, along % 2 === 0 ? "white_terracotta" : "bricks");   // dentils over it
  g.set(x, 24, z, "stone_bricks");                          // parapet to 25

  // Windows and shopfront.
  for (let y = 2; y <= 21; y++) {
    if (!isWindowRow(y)) continue;
    const winCol = longSide ? along % 6 === 1 || along % 6 === 2 : !piered;
    if (!winCol) {
      if (onStreet && y <= 3) g.set(x, y, z, "polished_granite");   // shopfront piers
      continue;
    }
    if (onStreet && y <= 3 && along === 4) {                // lobby door in the middle bay
      g.set(x, y, z, "dark_oak_door", door("north", y === 2 ? "lower" : "upper"));
      g.set(x + ix, y, z + iz, "air");
      continue;
    }
    g.set(x, y, z, "glass_pane", paneState);
    const k = lightAt(along, y);
    const bx = x + ix, bz = z + iz;
    if (k === 0) g.set(bx, y, bz, "shroomlight");
    else if (k === 1) g.set(bx, y, bz, "glowstone");
    else g.set(bx, y, bz, "air");
  }
}

// 3. The flat roof: a penthouse on the north-west of the roof (stone base, brick walls, cap), reading as roof equipment.
for (let y = TOP; y <= 26; y++) for (const x of [2, 3]) for (const z of [19, 20]) {
  g.set(x, y, z, y === 26 ? "stone_bricks" : "bricks");
}

// 4. Check: no block hangs in the air. A floor slab over a window's air gap is held by the wall beside it; a block
// with air below and no block beside it is the only real float.
let floating = 0;
const solid = (x, y, z) => !!g.get(x, y, z);
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) for (let y = 1; y < Y; y++) {
  const here = g.get(x, y, z);
  if (!here || solid(x, y - 1, z)) continue;
  if (![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => solid(x + dx, y, z + dz))) {
    floating++; console.warn(`floating ${here.block} at ${x},${y},${z}`);
  }
}
if (floating) throw new Error(`${floating} floating blocks`);

const stats = g.save(`${DIR}/NYC1022668.nbt`);
console.log(`NYC1022668.nbt: ${stats.blocks} blocks, ${stats.palette} palette entries`);
