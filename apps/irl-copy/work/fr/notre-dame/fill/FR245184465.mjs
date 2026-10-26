// FR245184465: a 1870 Haussmann residence, 7 storeys (ground + 6 of 4 blocks), limestone walls, a dark mansard-style
// roof cap. Built on the footprint cells only; each cell stands on a stone foundation up to its ground (y 0..ground-1),
// walls rise to the smoothed lidar roof tier, then the cap. Windows are glass panes in the outer face with an air
// gap behind (a few lit by glowstone); the solid interior is the floor slabs and the walls between them.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184465.cells.json", "utf8"));
const X = 26, Z = 15, Y = 45;
const key = (x, z) => `${x},${z}`;
const cell = new Map();
for (const [x, z, g, r] of cells) cell.set(key(x, z), { g, r });
const inFP = (x, z) => cell.has(key(x, z));

// Smoothed roof: the mean of each cell's footprint neighbours (3x3), snapped to three clean tiers.
const tierOf = (m) => (m >= 27 ? 29 : m >= 24 ? 25 : 22);
const H = new Map();
for (const [k, c] of cell) {
  const [x, z] = k.split(",").map(Number);
  let s = 0, n = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const c2 = cell.get(key(x + dx, z + dz)); if (c2) { s += c2.r; n++; }
  }
  H.set(k, tierOf(s / n));
}

const g = new Voxels([X, Y, Z]);
const put = (x, y, z, block, state) => { if (x >= 0 && x < X && z >= 0 && z < Z && y >= 0 && y < Y) g.set(x, y, z, block, state); };

// Exterior faces of a footprint cell: a z-face (north/south) or an x-face (west/east), never both at a corner.
const dirs = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const exterior = (x, z) => Object.keys(dirs).filter(d => !inFP(x + dirs[d][0], z + dirs[d][1]));
const inward = (d) => ({ north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] })[d];
const opposite = { north: "south", south: "north", west: "east", east: "west" };

// The front: the south (z max) face, the door near the middle of the long run.
const doorCell = [...cell.keys()].map(k => k.split(",").map(Number))
  .filter(([x, z]) => exterior(x, z).includes("south") && !exterior(x, z).some(d => d === "west" || d === "east"))
  .sort((a, b) => Math.abs(a[0] - 10) - Math.abs(b[0] - 10))[0];
const [DX, DZ] = doorCell;

for (const [k, { g: G }] of cell) {
  const [x, z] = k.split(",").map(Number);
  const top = H.get(k);
  const ext = exterior(x, z);
  const corner = ext.some(d => d === "north" || d === "south") && ext.some(d => d === "west" || d === "east");
  const face = ext.find(d => d === "north" || d === "south") ?? ext.find(d => d === "west" || d === "east");
  const along = face === "north" || face === "south" ? x : z;

  // foundation, then walls
  for (let y = 0; y < top; y++) {
    if (y < G) { put(x, y, z, "stone_bricks"); continue; }
    if (y === top - 1) { put(x, y, z, "stone_bricks"); continue; }                  // cornice
    if (y === G || y % 4 === 1) { put(x, y, z, "stone_bricks"); continue; }          // base course, storey strings
    if (corner) { put(x, y, z, "stone_bricks"); continue; }                           // quoins
    const win = (y % 4 === 2 || y % 4 === 3) && face && along % 3 !== 0;               // 2-wide windows, 1-wide piers
    if (win) {
      const ns = face === "north" || face === "south";
      put(x, y, z, "glass_pane", ns ? { east: "true", west: "true", north: "false", south: "false" }
                                    : { north: "true", south: "true", east: "false", west: "false" });
      continue;
    }
    put(x, y, z, "calcite");
  }

  // roof cap: a mansard lip (stairs, low side out) on the outer ring, deck tiles inside
  if (face) {
    const d = face;
    put(x, top, z, "deepslate_tile_stairs", { facing: d, half: "bottom", shape: "straight", waterlogged: "false" });
  } else {
    put(x, top, z, "deepslate_tiles");
  }
}

// Window pockets: air gap behind each glass pane (a 1-deep pocket inward), some with glowstone lit at the lower row.
for (const [k, { g: G }] of cell) {
  const [x, z] = k.split(",").map(Number);
  const top = H.get(k);
  const ext = exterior(x, z);
  const corner = ext.some(d => d === "north" || d === "south") && ext.some(d => d === "west" || d === "east");
  const face = ext.find(d => d === "north" || d === "south") ?? ext.find(d => d === "west" || d === "east");
  if (!face || corner) continue;
  const along = face === "north" || face === "south" ? x : z;
  const [ix, iz] = inward(face);
  for (let y = G + 1; y < top - 1; y++) {
    if (!((y % 4 === 2 || y % 4 === 3) && along % 3 !== 0)) continue;
    if (inFP(x + ix, z + iz) === false) continue;
    if (x === DX && z === DZ) continue;
    const lit = (x * 13 + z * 7 + Math.floor(y / 4) * 3) % 5 === 0 && y % 4 === 2;
    if (lit) put(x + ix, y, z + iz, "glowstone");
    else put(x + ix, y, z + iz, "air");
  }
}

// Entrance: a dark oak door on the south front, a stone lintel over it, a pocket behind with a hanging lantern.
{
  const facing = "south";
  const st = (half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });
  put(DX, 1, DZ, "dark_oak_door", st("lower"));
  put(DX, 2, DZ, "dark_oak_door", st("upper"));
  put(DX, 3, DZ, "stone_brick_slab", { type: "top", waterlogged: "false" });
  const [ix, iz] = inward("south");
  put(DX + ix, 1, DZ + iz, "air"); put(DX + ix, 2, DZ + iz, "air");
  put(DX + ix, 3, DZ + iz, "lantern", { hanging: "true", waterlogged: "false" });
  // the pocket's floor: a step of stone under the door
  put(DX, 0, DZ, "stone_bricks");
}

// Chimneys: two brick stacks out of the cap on the upper, inner roof.
for (const [k] of cell) {
  const [x, z] = k.split(",").map(Number);
  if (H.get(k) !== 29 || exterior(x, z).length) continue;
  if ((x === 6 && z === 7) || (x === 17 && z === 9)) {
    for (let y = 30; y <= 31; y++) put(x, y, z, "bricks");
    put(x, 32, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

const info = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184465.nbt");
console.log(JSON.stringify(info));
