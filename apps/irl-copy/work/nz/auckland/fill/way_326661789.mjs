// Enghouse Interactive, Mt Eden / Eden Terrace: a three-storey 1980s office block in precast white concrete and tinted
// glass, the typical Auckland commercial stock of its age. The lidar gives one flat roof about 12 blocks above the lowest
// ground, over a footprint that falls about 4 blocks from its west (uphill) side to its east (downhill) side: so the
// downhill side shows all three storeys, and the uphill side is a plinth with two storeys above it. Articulation: a
// stone base course, storey lines, lintels, light concrete fins at each bay, corner pilasters, a glazed lobby and a
// cantilevered canopy on the low north face, warm light behind some windows, and a plant room on the roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/";
const cells = JSON.parse(readFileSync(`${HERE}way_326661789.cells.json`, "utf8"));

// The lidar roof is flat: its median (over the cells that have a roof, 9+) is the building's top surface. The 0s and the
// 9-10s on the edges are lidar noise, so the roof is one tier. Top solid row = TOP - 1.
const roofs = cells.map((c) => c[3]).filter((r) => r >= 9).sort((a, b) => a - b);
const TOP = roofs[Math.floor(roofs.length / 2)];
const ROOF_ROW = TOP - 1;

const WALL = "white_concrete", FRAME = "light_gray_concrete", BASE = "stone_bricks", SLAB = "smooth_stone",
  GLASS = "light_blue_stained_glass", ROOF_M = "gray_concrete", FILL = "stone";
const LINES = [4, 8];        // storey lines: the floor slabs of storeys 2 and 3 (storey 1 sits on its own ground)
const LINTELS = [3, 7];      // the head of each glazed band

const fp = new Map(cells.map(([x, z, ground]) => [`${x},${z}`, ground]));
const inFp = (x, z) => fp.has(`${x},${z}`);
const DIRS = { east: [1, 0], west: [-1, 0], south: [0, 1], north: [0, -1] };
const outward = (x, z) => Object.keys(DIRS).filter((d) => !inFp(x + DIRS[d][0], z + DIRS[d][1]));
const inBox = (x, z) => x >= 0 && x < 41 && z >= 0 && z < 30;

// The entrance: the lowest facade run, on the north face, where the canopy stays inside the box.
const single = cells.filter(([x, z]) => outward(x, z).length === 1);
const entrance = single.filter(([x, z, g]) => g === 0 && outward(x, z)[0] === "north" && inBox(x, z - 2))
  .sort((a, b) => a[0] - b[0])[0];
const [DX, DZ, DG] = entrance;
const LOBBY = new Set(); // the glazed bay either side of the door, no fins
for (const [x, z] of single) if (outward(x, z)[0] === "north" && z === DZ && Math.abs(x - DX) <= 2) LOBBY.add(`${x},${z}`);

const vox = new Voxels([41, 25, 30]);

for (const [x, z, gr] of cells) {
  const out = outward(x, z);

  if (out.length === 0) {                       // interior: fill below the ground, floor slabs, roof, air between
    for (let y = 0; y <= ROOF_ROW; y++) {
      if (y < gr) vox.set(x, y, z, FILL);
      else if (y === gr || LINES.includes(y)) vox.set(x, y, z, SLAB);
      else if (y === ROOF_ROW) vox.set(x, y, z, ROOF_M);
    }
    continue;
  }

  const corner = out.length > 1;
  const facade = out[0];
  const idx = facade === "east" || facade === "west" ? z : x;   // position along the facade, for the bay rhythm
  const fin = corner || (idx % 3 === 0 && !LOBBY.has(`${x},${z}`));
  const lobby = LOBBY.has(`${x},${z}`);
  for (let y = 0; y <= ROOF_ROW; y++) {
    let b;
    if (y <= gr) b = BASE;                                        // plinth and base course, down to the ground
    else if (y === ROOF_ROW || LINES.includes(y)) b = SLAB;       // parapet cap and storey lines
    else if (LINTELS.includes(y)) b = corner ? FRAME : WALL;      // spandrels
    else b = fin ? FRAME : GLASS;                                 // glazed bands between the fins
    vox.set(x, y, z, b);
  }
  // Windows lit from inside: a glowstone or shroomlight in the air gap behind some lower glass cells.
  const [ix, iz] = [x - DIRS[facade][0], z - DIRS[facade][1]];
  const gi = fp.get(`${ix},${iz}`);                             // the room behind this cell, if it is inside
  if (!corner && !fin && !lobby && gi !== undefined && outward(ix, iz).length === 0) {
    const lamp = idx % 6 === 1 ? "glowstone" : idx % 12 === 4 ? "shroomlight" : null;
    const rows = idx % 6 === 1 ? [1, 5, 9] : [5, 9];
    if (lamp) for (const y of rows) if (y > gi) vox.set(ix, y, iz, lamp);
  }
}

// Entrance: a dark oak door pair's lower and upper halves in the lobby bay, a canopy cantilevered from the storey line
// over the door, and a lantern hanging from it.
const facing = "north";
const doorState = (half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });
vox.set(DX, DG + 1, DZ, "dark_oak_door", doorState("lower"));
vox.set(DX, DG + 2, DZ, "dark_oak_door", doorState("upper"));
for (let n = 1; n <= 2; n++)
  for (let d = -1; d <= 1; d++) vox.set(DX + d, 4, DZ + DIRS[facing][1] * n, SLAB);
vox.set(DX, 3, DZ - 1, "lantern", { hanging: "true", waterlogged: "false" });

// Plant room on the roof: a two-high light concrete box with a cap, and two air-conditioning units.
for (let x = 15; x <= 23; x++) for (let z = 10; z <= 16; z++) {
  const ring = x === 15 || x === 23 || z === 10 || z === 16;
  for (let y = ROOF_ROW + 1; y <= ROOF_ROW + 2; y++) if (ring) vox.set(x, y, z, FRAME);
  vox.set(x, ROOF_ROW + 3, z, SLAB);
}
for (let x = 27; x <= 28; x++) for (let z = 20; z <= 21; z++) vox.set(x, ROOF_ROW + 1, z, "iron_block");

const { blocks, palette } = vox.save(`${HERE}way_326661789.nbt`);
console.log(`way_326661789.nbt: ${blocks} blocks, ${palette} palette entries, entrance at (${DX}, ${DZ}), ground ${DG}`);
