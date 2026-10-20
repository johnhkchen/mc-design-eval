import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Two-storey mid-century commercial block: stone-clad plinth, shopfront with
// red fascia, pale concrete upper storey with glazed bays, stone cornice,
// parapet and a rooftop plant room. Foundations fill down to each cell's ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw831857641";
const W = 25, H = 23, D = 18;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const B = Math.min(...ground.values());          // lowest ground under the footprint
const ROOF = B + 11;                              // parapet top
const inFp = (x, z) => ground.has(key(x, z));
const isEdge = (x, z) => inFp(x, z) && (!inFp(x + 1, z) || !inFp(x - 1, z) || !inFp(x, z + 1) || !inFp(x, z - 1));

const NEIGH = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const FACE = { "0,-1": "north", "0,1": "south", "-1,0": "west", "1,0": "east" };
const outward = (x, z) => {
  for (const [dx, dz] of NEIGH) if (!inFp(x + dx, z + dz)) return [dx, dz];
  return [0, -1];
};

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p); else g.set(x, y, z, id);
};

// Front = north-facing edge (outward -z). Door sits at the middle of that frontage.
const frontCells = cells.filter(([x, z]) => isEdge(x, z) && outward(x, z)[1] === -1);
let doorCell = null;
if (frontCells.length) {
  const xs = frontCells.map(c => c[0]);
  const mid = Math.round((Math.min(...xs) + Math.max(...xs)) / 2);
  doorCell = frontCells.reduce((best, c) => (Math.abs(c[0] - mid) < Math.abs(best[0] - mid) ? c : best));
}

// 1. Foundations and body
for (const [x, z, gr] of cells) {
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");

  const edge = isEdge(x, z);
  const [dx, dz] = outward(x, z);
  const facing = FACE[`${dx},${dz}`];
  const idx = dz !== 0 ? x : z;               // bay index along the facade
  const pillar = idx % 4 === 0;

  for (let y = gr + 1; y <= ROOF; y++) {
    const rel = y - B;
    if (edge) {
      if (rel === 11) put(x, y, z, "white_concrete");                       // parapet
      else if (rel === 10) put(x, y, z, "stone_brick_stairs", { facing, half: "bottom", shape: "straight", waterlogged: "false" }); // cornice
      else if (rel === 9 || rel === 8) put(x, y, z, pillar ? "white_concrete" : "glass");  // upper glazed bays
      else if (rel === 7 || rel === 6) put(x, y, z, "smooth_stone");        // sill and storey band
      else if (rel === 5) put(x, y, z, "red_terracotta");                   // shop fascia
      else if (rel === 4 || rel === 3 || rel === 2) {
        put(x, y, z, pillar ? "white_concrete" : "glass");                  // shopfront
      } else if (rel === 1) put(x, y, z, "polished_andesite");              // plinth course
    } else {
      if (rel === 6) put(x, y, z, "smooth_stone");                          // floor slab
      if (rel === 10) put(x, y, z, "gray_concrete");                        // roof deck
    }
  }
}

// 2. Entrance door in the middle of the front shopfront
if (doorCell) {
  const [x, z, gr] = doorCell;
  const facing = FACE["0,-1"];
  if (gr < B + 2) {
    const base = { facing, hinge: "left", open: "false", powered: "false" };
    put(x, B + 2, z, "iron_door", { ...base, half: "lower" });
    put(x, B + 3, z, "iron_door", { ...base, half: "upper" });
  }
}

// 3. Warm lights behind glass (glowstone one cell inside the facade)
for (const [x, z, gr] of cells) {
  if (!isEdge(x, z)) continue;
  const [dx, dz] = outward(x, z);
  const idx = dz !== 0 ? x : z;
  const ix = x - dx, iz = z - dz;
  if (!inFp(ix, iz) || isEdge(ix, iz)) continue;
  if (idx % 8 === 2 && gr < B + 8) put(ix, B + 8, iz, "glowstone");        // upper floor
  if (idx % 8 === 5 && gr < B + 3 && !(doorCell && doorCell[0] === x && doorCell[1] === z)) {
    put(ix, B + 3, iz, "glowstone");                                        // shopfront
  }
}

// 4. Rooftop plant room, set back from the parapet
for (let x = 9; x <= 15; x++) {
  for (let z = 6; z <= 11; z++) {
    if (!inFp(x, z) || isEdge(x, z)) continue;
    const gr = ground.get(key(x, z));
    if (gr >= B + 10) continue;                                             // needs roof deck below
    put(x, B + 11, z, "light_gray_concrete");
    put(x, B + 12, z, "light_gray_concrete");
    put(x, B + 13, z, "smooth_stone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
