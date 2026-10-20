import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540295095";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 18, H = 23, D = 19;
const g = new Voxels([W, H, D]);

// Blocks
const FOUNDATION = "stone_bricks";
const FLOOR = "smooth_stone";
const SLAB = "light_gray_concrete";
const CORNICE = "stone_bricks";
const WALL = "white_concrete";
const PILLAR = "light_gray_concrete";
const PARAPET = "white_concrete";
const EQUIP = "gray_concrete";

function put(x, y, z, block, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// Footprint lookup
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const grAt = (x, z) => ground.get(`${x},${z}`);

const DIRS = [
  { face: "north", dx: 0, dz: -1, ix: 0, iz: 1 },
  { face: "south", dx: 0, dz: 1, ix: 0, iz: -1 },
  { face: "west", dx: -1, dz: 0, ix: 1, iz: 0 },
  { face: "east", dx: 1, dz: 0, ix: -1, iz: 0 },
];

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of ground.keys().map ? [] : []) {}
for (const [x, z] of cells) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;

// Per-cell faces
function facesOf(x, z) {
  return DIRS.filter((d) => !has(x + d.dx, z + d.dz));
}

// Pass 1: foundation, floors, roof slabs, walls
for (const [x, z, gr] of cells) {
  // Foundation under the cell up to its ground
  for (let y = 0; y < gr; y++) put(x, y, z, FOUNDATION);
  // Ground floor slab, storey floor at rel 5, roof slab at rel 10
  put(x, gr, z, FLOOR);
  put(x, gr + 5, z, SLAB);
  put(x, gr + 10, z, SLAB);

  const faces = facesOf(x, z);
  if (faces.length === 0) continue;

  const corner = faces.length >= 2;
  const primary = faces[0];
  const alongNS = primary.face === "north" || primary.face === "south";
  const a = alongNS ? x - minX : z - minZ;
  const aMax = alongNS ? maxX - minX : maxZ - minZ;
  const pillar = corner || a % 3 === 0 || a === aMax || a === 0;
  const glassProps = alongNS
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

  // rel 0 base course
  put(x, gr, z, FOUNDATION);
  // rel 1-3 shopfront / ground storey
  for (let r = 1; r <= 3; r++) {
    if (pillar) put(x, gr + r, z, PILLAR);
    else put(x, gr + r, z, "glass_pane", glassProps);
  }
  // rel 4 transom
  put(x, gr + 4, z, pillar ? PILLAR : WALL);
  // rel 5 storey line
  put(x, gr + 5, z, SLAB);
  // rel 6-9 upper storey windows
  for (let r = 6; r <= 9; r++) {
    if (pillar) put(x, gr + r, z, PILLAR);
    else put(x, gr + r, z, "glass_pane", glassProps);
  }
  // rel 10 cornice and rel 11 parapet
  put(x, gr + 10, z, CORNICE);
  put(x, gr + 11, z, PARAPET);
}

// Pass 2: warm lights behind some upper windows (inside the air gap)
for (const [x, z, gr] of cells) {
  const faces = facesOf(x, z);
  if (faces.length !== 1) continue;
  const f = faces[0];
  const a = f.face === "north" || f.face === "south" ? x - minX : z - minZ;
  if (a % 2 !== 0) continue;
  if (a % 3 === 0) continue; // pillar column
  const ix = x + f.ix, iz = z + f.iz;
  if (!has(ix, iz)) continue;
  if (facesOf(ix, iz).length > 0) continue;
  put(ix, gr + 7, iz, "glowstone");
}

// Pass 3: roof plant in the centre of the roof
for (const [x, z, gr] of cells) {
  if (facesOf(x, z).length > 0) continue;
  if (Math.abs(x - cx) <= 2 && Math.abs(z - cz) <= 2) {
    put(x, gr + 11, z, EQUIP);
    if (Math.abs(x - cx) <= 1 && Math.abs(z - cz) <= 1) put(x, gr + 12, z, "light_gray_concrete");
  }
}

// Pass 4: entrance on the north (minZ) street face, middle of its run
{
  const northCells = cells
    .filter(([x, z]) => z === minZ && !has(x, z - 1))
    .sort((p, q) => p[0] - q[0]);
  if (northCells.length > 0) {
    const [ex, ez, gr] = northCells[Math.floor(northCells.length / 2)];
    put(ex, gr + 1, ez, "dark_oak_door", {
      facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    put(ex, gr + 2, ez, "dark_oak_door", {
      facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
    });
    // Canopy slab over the entrance and a hanging lantern
    put(ex, gr + 4, ez, "dark_oak_planks");
    put(ex, gr + 3, ez, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
