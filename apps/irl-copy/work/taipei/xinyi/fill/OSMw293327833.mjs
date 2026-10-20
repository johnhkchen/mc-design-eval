import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 自強樓, Xinyi, Taipei. Read as a c.1968-72 reinforced-concrete mid-rise: four storeys of
// about 5 blocks under a flat roof, cream-painted walls with light-grey concrete bands and
// pilasters, a stone-faced base course, window sills, a shopfront ground storey with a
// central door and lintel canopy, a roof parapet, and water tank plus penthouse on the roof.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw293327833";
const W = 24, H = 33, D = 75;

const FLOOR = [5, 10, 15, 20];   // storey slabs (absolute y)
const ROOF = 21;                 // roof slab
const TOP = 20;                  // top of walls

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);

const has = (x, z) => G.has(`${x},${z}`);
const gAt = (x, z) => G.get(`${x},${z}`);
const isEdge = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);

const g = new Voxels([W, H, D]);
const set = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props); else g.set(x, y, z, id);
};

const exposedFaces = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
};

// Entrance: the street-facing N/S edge cell nearest the centre of the footprint's
// ground-level frontage. Its ground must allow a door (gr <= 3).
const doorCandidates = [];
for (const [x, z, gr] of cells) {
  if (!isEdge(x, z) || gr > 3) continue;
  for (const f of exposedFaces(x, z)) if (f === "N" || f === "S") doorCandidates.push({ x, z, gr, face: f });
}
let door = null;
if (doorCandidates.length) {
  const cx = doorCandidates.reduce((s, c) => s + c.x, 0) / doorCandidates.length;
  door = doorCandidates.reduce((best, c) => (Math.abs(c.x - cx) < Math.abs(best.x - cx) ? c : best));
}
const isDoorCell = (x, z, face) => door && door.x === x && door.z === z && door.face === face;

// 1. Foundation: solid from y 0 up to each cell's ground.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) set(x, y, z, "stone_bricks");
}

// 2. Floor slabs (ground, storeys, roof) across the whole footprint.
for (const [x, z, gr] of cells) {
  set(x, gr, z, "light_gray_concrete");
  for (const y of [...FLOOR, ROOF]) set(x, y, z, "light_gray_concrete");
}

// 3. Interior columns on a 6-block grid, so the open storeys are carried.
for (const [x, z, gr] of cells) {
  if (isEdge(x, z) || x % 6 !== 0 || z % 6 !== 0) continue;
  for (let y = gr + 1; y <= TOP; y++) set(x, y, z, "light_gray_concrete");
}

// 4. Shell on the edge cells: base course, wall, storey bands, cornice and parapet.
for (const [x, z, gr] of cells) {
  if (!isEdge(x, z)) continue;
  for (let y = gr; y <= TOP; y++) {
    if (y === gr) set(x, y, z, "stone_bricks");
    else if (FLOOR.includes(y)) set(x, y, z, "light_gray_concrete");
    else set(x, y, z, "white_concrete");
  }
  // Cornice: a stone-brick slab course over a concrete band, then the parapet.
  set(x, ROOF, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  set(x, ROOF + 1, z, "white_concrete");
}

// 5. Facade overlay per exposed face: pilasters, sills, windows, shopfront, door, lamps.
const FACE_DEFS = {
  N: { dx: 0, dz: -1, along: "x", facing: "north" },
  S: { dx: 0, dz: 1, along: "x", facing: "south" },
  W: { dx: -1, dz: 0, along: "z", facing: "west" },
  E: { dx: 1, dz: 0, along: "z", facing: "east" },
};

for (const [x, z, gr] of cells) {
  if (!isEdge(x, z)) continue;
  for (const face of exposedFaces(x, z)) {
    const def = FACE_DEFS[face];
    const a = def.along === "x" ? x : z;
    const pil = a % 3 === 0;
    const isNS = face === "N" || face === "S";
    const ix = -def.dx, iz = -def.dz; // inward step
    const inwardX = x + ix, inwardZ = z + iz;
    const glowOK = a % 9 === 4 && has(inwardX, inwardZ) && !isEdge(inwardX, inwardZ);
    const doorHere = isDoorCell(x, z, face);

    // Canopy lintel above the entrance, spanning the doorway on this face.
    if (door && isNS && door.face === face && Math.abs(a - door.x) <= 2 && isEdge(x, z) && door.gr <= 3) {
      if (has(x, z)) set(x, door.gr + 2, z, "light_gray_concrete");
    }

    for (let y = gr + 1; y <= TOP; y++) {
      // Entrance: door with glass sidelights in the ground storey.
      if (doorHere && y <= gr + 1) {
        const half = y === gr ? "lower" : "upper";
        set(x, y, z, "dark_oak_door", {
          facing: def.facing, half, hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      if (pil) { set(x, y, z, "light_gray_concrete"); continue; }

      const k = Math.floor(y / 5);
      const rel = y % 5;                 // 0 slab, 1 sill, 2-3 glass, 4 spandrel
      const isGroundShop = k === 0;

      if (!isGroundShop && rel === 1) {
        // Window sill: bottom slab under each upper-storey window.
        set(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
        continue;
      }
      const glassRow = isGroundShop ? (y >= gr + 1 && y <= 3) : (rel === 2 || rel === 3);
      if (glassRow) {
        set(x, y, z, isGroundShop ? "glass_pane" : "light_blue_stained_glass_pane");
        // Warm light behind some glass, in the air gap inside the footprint.
        if (glowOK && rel === 2) set(inwardX, y, inwardZ, "glowstone");
      }
    }
  }
}

// 6. Roof equipment on footprint cells only (all sit on the roof slab at y 21).
const box = (x0, x1, z0, z1, y0, y1, id) => {
  for (let x = x0; x <= x1; x++)
    for (let z = z0; z <= z1; z++) {
      if (!has(x, z)) continue;
      for (let y = y0; y <= y1; y++) set(x, y, z, id);
    }
};

box(4, 9, 30, 36, ROOF + 1, ROOF + 3, "light_gray_concrete"); // penthouse
box(4, 9, 30, 36, ROOF + 4, ROOF + 4, "white_concrete");      // penthouse cap
box(13, 15, 20, 22, ROOF + 1, ROOF + 3, "iron_block");         // water tank
box(18, 20, 50, 52, ROOF + 1, ROOF + 2, "gray_concrete");      // HVAC plant

if (has(14, 21)) {
  set(14, ROOF + 4, 21, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
