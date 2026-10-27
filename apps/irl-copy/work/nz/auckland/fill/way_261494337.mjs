// Way 261494337, Auckland (Mt Eden Road, Eden Terrace side): a two-storey Edwardian brick commercial block, c. 1910,
// with a one-storey wing on the lower ground and a two-block plant tier on the east strip. Built from the lidar:
// ground [g] per cell, roof [r] per cell, smoothed to three flat tiers (7, 9, 11) so the massing reads as set-backs.
// Storey lines: ground floor slab at y 3, first floor slab at y 7, parapet cap on top of the tier.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_261494337.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..19, z 0..44

const g = new Voxels([20, 23, 45]);

// the lidar roof snapped to three tiers: a one-storey wing, a 2-block plant/attic tier, and the two-storey main block
const tierOf = (r) => (r >= 10 ? 11 : r >= 8 ? 9 : 7);
const cell = new Map();
for (const [x, z, gr, r] of cells) cell.set(`${x},${z}`, { g: gr, T: tierOf(r) });
const at = (x, z) => cell.get(`${x},${z}`);
const DIRS = { south: [0, 1], north: [0, -1], east: [1, 0], west: [-1, 0] };
const PANE = {                                                                  // a pane in a wall running along x or z
  x: { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" },
  z: { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" },
};
const FRONT = "south";   // the street face: shopfront, fascia, the entrance
const DOOR_X = 10;       // the entrance's bay on that face

// is this cell a wall? (its outer face, or it stands taller than a neighbour and shows that face above the neighbour's roof)
const isWall = (x, z, T) => Object.values(DIRS).some(([dx, dz]) => { const n = at(x + dx, z + dz); return !n || n.T < T; });

for (const [key, { g: gr, T }] of cell) {
  const [x, z] = key.split(",").map(Number);
  const wall = isWall(x, z, T);
  const missing = Object.keys(DIRS).filter(d => !at(x + DIRS[d][0], z + DIRS[d][1]));   // exterior faces
  const face = missing.includes(FRONT) ? FRONT : missing[0] ?? null;
  const top = T - 1;

  // foundation to the lidar ground, then the base course up to the ground floor slab
  for (let y = 0; y < gr; y++) g.set(x, y, z, "cobblestone");
  for (let y = gr; y < 3; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, 3, z, "smooth_stone");                                  // ground floor slab / belt course

  for (let y = 4; y <= top; y++) {
    if (y === 7 && T >= 9) { g.set(x, y, z, "smooth_stone"); continue; }   // first floor slab / belt course
    if (y === top) { g.set(x, y, z, wall ? "smooth_stone" : "stone"); continue; }   // parapet cap / roof deck
    if (!wall) continue;                                             // interior: air behind the glass
    const ground = y <= 6;
    if (!face) { g.set(x, y, z, "bricks"); continue; }
    const param = face === "south" || face === "north" ? x : z;
    if (face === FRONT) {                                            // shopfront: glazing, stone piers, fascia
      if (y === 6) { g.set(x, y, z, "dark_oak_planks"); continue; }
      if (param === DOOR_X) {
        const st = { facing: "south", hinge: "left", open: "false", powered: "false" };
        if (y === 4) g.set(x, y, z, "dark_oak_door", { ...st, half: "lower" });
        else if (y === 5) g.set(x, y, z, "dark_oak_door", { ...st, half: "upper" });
        continue;
      }
      if (param % 4 === 0) { g.set(x, y, z, "stone_bricks"); continue; }
      g.set(x, y, z, "glass_pane", PANE[face === "south" || face === "north" ? "x" : "z"]); continue;
    }
    // upper floors and side faces: bays of two windows to a pier, the storey's glass between the bands
    const storeyWindow = ground ? y >= 4 && y <= 6 : y >= 8 && y <= 9;
    if (param % 3 === 0 || !storeyWindow) { g.set(x, y, z, "bricks"); continue; }
    g.set(x, y, z, "glass_pane", PANE[face === "south" || face === "north" ? "x" : "z"]);
  }
}

// warm light behind some windows: an interior cell one step in from a window, below its top
const WIN_Y = [5, 9];
for (const [key, { T }] of cell) {
  const [x, z] = key.split(",").map(Number);
  if (!isWall(x, z, T)) continue;
  const missing = Object.keys(DIRS).filter(d => !at(x + DIRS[d][0], z + DIRS[d][1]));
  const face = missing.includes(FRONT) ? FRONT : missing[0];
  if (!face || face === FRONT) continue;
  const [dx, dz] = DIRS[face];
  for (const y of WIN_Y) {
    if (y > T - 2) continue;
    if ((x * 7 + z * 13 + y) % 11 !== 0) continue;
    const inward = at(x - dx, z - dz);
    if (!inward || isWall(x - dx, z - dz, inward.T)) continue;
    g.set(x - dx, y, z - dz, y === 5 ? "shroomlight" : "glowstone");
  }
}

// roof plant: small iron boxes on the two tiers' decks, out of the way of the parapets
for (const [key, { T }] of cell) {
  const [x, z] = key.split(",").map(Number);
  if (isWall(x, z, T) || T === 7) continue;
  if ((x * 3 + z * 5) % (T === 9 ? 23 : 31) === 0) g.set(x, T, z, "iron_block");
}

const { blocks, palette } = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_261494337.nbt");
console.log(`way_261494337: ${blocks} blocks, ${palette} palette entries`);
