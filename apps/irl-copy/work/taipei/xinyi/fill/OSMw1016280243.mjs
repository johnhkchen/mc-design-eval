import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280243";
const W = 22, H = 33, D = 14;
const ROOF = 21;                    // roof about 21 blocks above lowest ground
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const vox = new Voxels([W, H, D]);
const key = (x, z) => `${x},${z}`;

// footprint -> ground level (clamped so the 4-storey shell stays inside the canvas)
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(key(x, z), Math.min(Math.max(0, Math.round(gr)), 19));
}

// outward normals: [dx, dz, name]
const NORMALS = [
  [0, -1, "north"],
  [0, 1, "south"],
  [-1, 0, "west"],
  [1, 0, "east"],
];
const OPPOSITE = { north: "south", south: "north", east: "west", west: "east" };

// outward faces of a footprint cell (faces whose neighbour is outside the footprint)
function facesOf(x, z) {
  return NORMALS.filter(([dx, dz]) => !ground.has(key(x + dx, z + dz)));
}

// facade block for absolute height y; idx = position along the face; corner = on two faces
function facade(y, idx, gr, corner) {
  if (y === gr) return "stone_bricks";              // base course
  if (y === 20) return "smooth_stone";              // cornice
  if (y === 21) return "white_concrete";            // parapet
  const F = Math.floor(y / 5) * 5;                  // storey floor line
  const rel = y - F;
  if (rel === 0) return "light_gray_concrete";      // storey line
  if (rel === 4) return "white_concrete";           // spandrel
  if (F === 0 && rel === 3) return "smooth_stone";  // shopfront lintel
  if (corner) return "white_concrete";              // corner pillar
  if (idx % 3 === 0) return "white_concrete";       // mullion
  return "cyan_stained_glass_pane";                 // tinted glazing
}

// 1) foundation, base slab, floor slabs (no interiors: air between slabs)
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < gr; y++) vox.set(x, y, z, "stone_bricks");   // foundation on slope
  vox.set(x, gr, z, "light_gray_concrete");                        // bottom slab
  for (const F of [5, 10, 15, 20]) {
    if (F > gr) vox.set(x, F, z, "light_gray_concrete");          // floor / roof slabs
  }
}

// 2) facades on edge cells
const facadeCells = [];
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const faces = facesOf(x, z);
  if (faces.length === 0) continue;
  const [dx, dz, name] = faces[0];
  const corner = faces.length > 1;
  const idx = (dx !== 0) ? z : x;                  // position along the face
  facadeCells.push({ x, z, gr, dx, dz, name, idx, corner });
  for (let y = gr; y <= ROOF; y++) {
    vox.set(x, y, z, facade(y, idx, gr, corner));
  }
}

// 3) warm light behind some glazed bays (glowstone in the air gap, one cell inside)
for (const c of facadeCells) {
  for (let y = c.gr + 1; y <= 19; y++) {
    const F = Math.floor(y / 5) * 5;
    const rel = y - F;
    if (F === 0 || rel < 1 || rel > 3 || c.corner) continue;
    if (c.idx % 3 !== 1) continue;
    if ((c.idx + F) % 4 !== 1) continue;
    const ix = c.x - c.dx, iz = c.z - c.dz;
    const inner = ground.get(key(ix, iz));
    if (inner === undefined || y < inner + 1) continue;
    vox.set(ix, y, iz, "glowstone");
    break;                                          // one light per bay column
  }
}

// 4) entrance on the south (+z) front, centred along the face
const front = facadeCells.filter(c => c.name === "south" && !c.corner);
if (front.length > 0) {
  const xs = front.map(c => c.x).sort((a, b) => a - b);
  const mid = xs[Math.floor(xs.length / 2)];
  const c = front.find(f => f.x === mid);
  if (c && c.gr <= 17) {
    const facing = OPPOSITE[c.name];                // door faces back into the building
    const yd = c.gr + 1;
    vox.set(c.x, yd, c.z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
    vox.set(c.x, yd + 1, c.z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
    vox.set(c.x, yd + 2, c.z, "smooth_stone");     // lintel over door
  }
}

// 5) roof: interior roof slab already at y=20; add mechanical plant on it
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const edge = facesOf(x, z).length > 0;
  if (edge) continue;
  if ((x * 3 + z * 5) % 11 === 0) vox.set(x, 21, z, "iron_block");
}

vox.save(`${DIR}/${ID}.nbt`);
