import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541376808.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541376808.nbt";
const W = 15, H = 23, D = 22;

const raw = JSON.parse(readFileSync(SRC, "utf8"));
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, g] of raw) {
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(key(x, z), Math.round(g));
}

const g = new Voxels([W, H, D]);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Faces: outward direction for each side
const DIRS = [
  { face: "north", dx: 0, dz: -1 },
  { face: "south", dx: 0, dz: 1 },
  { face: "west", dx: -1, dz: 0 },
  { face: "east", dx: 1, dz: 0 },
];
const inside = (x, z) => ground.has(key(x, z));

function exposedFaces(x, z) {
  return DIRS.filter(d => !inside(x + d.dx, z + d.dz)).map(d => d.face);
}

// Along-face index: x for north/south faces, z for east/west faces
function alongIndex(face, x, z) {
  return (face === "north" || face === "south") ? x : z;
}

const paneProps = (face) => (face === "north" || face === "south")
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Entrance: on the face with the most exposed single-face cells, the one nearest its mid-point
const singleFace = new Map();
for (const [k, _] of ground) {
  const [x, z] = k.split(",").map(Number);
  const f = exposedFaces(x, z);
  if (f.length === 1) {
    if (!singleFace.has(f[0])) singleFace.set(f[0], []);
    singleFace.get(f[0]).push([x, z]);
  }
}
let entranceKey = null, entranceFace = null;
{
  let best = null;
  for (const [face, list] of singleFace) {
    if (!best || list.length > best[1].length) best = [face, list];
  }
  if (best) {
    const [face, list] = best;
    const mean = list.reduce((s, [x, z]) => s + alongIndex(face, x, z), 0) / list.length;
    let pick = null, pd = Infinity;
    for (const [x, z] of list) {
      const d = Math.abs(alongIndex(face, x, z) - mean);
      if (d < pd) { pd = d; pick = [x, z]; }
    }
    entranceKey = key(pick[0], pick[1]);
    entranceFace = face;
  }
}

// Foundation: solid from y=0 up to each cell's ground
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
}

// Storey layout relative to each cell's ground g:
// rel 0 plinth, rel 1-3 shopfront glass, rel 4 lintel, rel 5 storey line,
// rel 6-8 upper windows, rel 9 lintel, rel 10 cornice/roof slab, rel 11 parapet
const GLASS_ZONES = new Set([1, 2, 3, 6, 7, 8]);

for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const faces = exposedFaces(x, z);
  const perimeter = faces.length > 0;

  if (perimeter) {
    const isCorner = faces.length >= 2;
    const primary = faces[0];
    const idx = alongIndex(primary, x, z);
    const isPier = isCorner || idx % 3 === 0;
    const isEntrance = k === entranceKey;

    for (let rel = 0; rel <= 11; rel++) {
      const y = gr + rel;
      if (rel === 0) { put(x, y, z, "stone_bricks"); continue; }
      if (rel === 5 || rel === 10) { put(x, y, z, "smooth_stone"); continue; }
      if (rel === 11) { put(x, y, z, "light_gray_concrete"); continue; }
      if (rel === 4 || rel === 9) { put(x, y, z, "white_concrete"); continue; }

      // Entrance: door at rel 1-2, transom glass above
      if (isEntrance && !isCorner) {
        if (rel === 1) { put(x, y, z, "dark_oak_door", { facing: entranceFace, half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
        if (rel === 2) { put(x, y, z, "dark_oak_door", { facing: entranceFace, half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
        if (rel === 3) { put(x, y, z, "light_blue_stained_glass_pane", paneProps(entranceFace)); continue; }
      }

      if (GLASS_ZONES.has(rel) && !isPier) {
        put(x, y, z, "light_blue_stained_glass_pane", paneProps(primary));
      } else {
        put(x, y, z, isPier ? "light_gray_concrete" : "white_concrete");
      }
    }
  } else {
    // Interior: plinth, floor slabs at storey lines and roof, air between
    put(x, gr, z, "stone_bricks");
    put(x, gr + 5, z, "smooth_stone");
    put(x, gr + 10, z, "smooth_stone");
  }
}

// Warm lights behind windows: interior cells next to a window-facing perimeter cell
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (exposedFaces(x, z).length > 0) continue;
  for (const rel of [2, 7]) {
    const y = gr + rel;
    let lit = false;
    for (const d of DIRS) {
      const nx = x + d.dx, nz = z + d.dz;
      if (!inside(nx, nz)) continue;
      const nf = exposedFaces(nx, nz);
      // neighbour's outward face must point away from this interior cell
      if (!nf.includes(d.face)) continue;
      const idx = alongIndex(d.face, nx, nz);
      if (idx % 3 !== 0) lit = true;
    }
    if (lit && (x + z) % 2 === 0) {
      put(x, y, z, (x + z) % 4 === 0 ? "glowstone" : "shroomlight");
    }
  }
}

// Roof equipment: sparse AC plant boxes on interior roof cells
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (exposedFaces(x, z).length > 0) continue;
  if ((x * 3 + z * 5) % 11 === 0 && gr + 12 < H) {
    put(x, gr + 11, z, "light_gray_concrete");
    put(x, gr + 12, z, "iron_block");
  }
}

g.save(OUT);
