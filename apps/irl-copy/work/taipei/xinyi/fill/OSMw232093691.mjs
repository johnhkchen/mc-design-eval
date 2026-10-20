import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Aurora Building, Xinyi, Taipei. Speculative 1990s-2000s office tower:
// two-storey stone-and-glass podium, 16-storey light-grey concrete tower with a
// glass curtain wall, a setback core, a cornice, a penthouse and a lit spire.
// Roof sits at y 83 above the lowest ground, as in the lidar record.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw232093691";
const W = 82, H = 95, D = 51;

const ROOF_Y = 83;        // roof slab of the tower
const PODIUM_H = 10;      // two storeys of 5 blocks
const STOREY = 5;
const CORE_INSET = 6;     // tower setback from the podium edge
const PENT_INSET = 12;    // penthouse inset from the tower edge
const MULLION = 4;        // mullion spacing on office storeys

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const foot = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  foot.set(key(x, z), Math.round(gr));
}
const inFoot = (x, z) => foot.has(key(x, z));

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Distance from the footprint edge (1 on the boundary), via BFS inside the footprint.
const dist = new Map();
const queue = [];
for (const k of foot.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (NB.some(([dx, dz]) => !inFoot(x + dx, z + dz))) {
    dist.set(k, 1);
    queue.push([x, z]);
  }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = dist.get(key(x, z));
  for (const [dx, dz] of NB) {
    const nx = x + dx, nz = z + dz;
    const nk = key(nx, nz);
    if (inFoot(nx, nz) && !dist.has(nk)) {
      dist.set(nk, d + 1);
      queue.push([nx, nz]);
    }
  }
}
const dAt = (x, z) => dist.get(key(x, z)) ?? 0;
const isCore = (x, z) => dAt(x, z) >= CORE_INSET;

// A neighbour is inside the building at a given height above its ground:
// podium levels use the whole footprint, tower levels only the core.
const inside = (x, z, rel) => inFoot(x, z) && (rel < PODIUM_H || isCore(x, z));
const exterior = (x, z, rel) => NB.some(([dx, dz]) => !inside(x + dx, z + dz, rel));

// Corner cells: exterior on both axes, so they get solid pilasters.
const isCorner = (x, z, rel) =>
  (!inside(x - 1, z, rel) || !inside(x + 1, z, rel)) &&
  (!inside(x, z - 1, rel) || !inside(x, z + 1, rel));

// Entrance: centre of the lowest-z front row of the footprint, so it lands on the
// real street face even on the notched outline.
let minFrontZ = Infinity;
for (const k of foot.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (!inFoot(x, z - 1)) minFrontZ = Math.min(minFrontZ, z);
}
const frontXs = [];
for (const k of foot.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (z === minFrontZ && !inFoot(x, z - 1)) frontXs.push(x);
}
frontXs.sort((a, b) => a - b);
const cx = frontXs.length ? frontXs[Math.floor(frontXs.length / 2)] : Math.floor(W / 2);
const isEntrance = (x, z) =>
  z === minFrontZ && !inFoot(x, z - 1) && Math.abs(x - cx) <= 3;

const cxAll = Math.floor(W / 2);
const cz = Math.floor(D / 2);

// Foundation fill, then the building itself.
for (const [k, gr] of foot) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
}

for (const [k, gr] of foot) {
  const [x, z] = k.split(",").map(Number);
  const core = isCore(x, z);
  const top = core ? ROOF_Y : gr + PODIUM_H;

  // Face orientation: cells along a long side read x, cells on a short side read z.
  const alongX = !inFoot(x, z - 1) || !inFoot(x, z + 1);
  const u = alongX ? x : z;

  for (let y = gr; y < top; y++) {
    const rel = y - gr;
    const k5 = Math.floor(rel / STOREY);
    const r = rel % STOREY;
    const ext = exterior(x, z, rel);

    if (r === 0) {
      // Storey line: slab across the floor, a lighter band on the facade.
      put(x, y, z, ext ? "light_gray_concrete" : "white_concrete");
      continue;
    }
    if (!ext) continue; // interior air behind the glass

    // Corner pilasters run the full height of each storey.
    if (isCorner(x, z, rel)) {
      put(x, y, z, "white_concrete");
      continue;
    }

    const entrance = k5 === 0 && isEntrance(x, z);

    if (k5 === 0) {
      // Ground-floor shopfront with a central entrance on the front face.
      if (r === 1) {
        put(x, y, z, "smooth_stone");
      } else if (entrance && (r === 2 || r === 3)) {
        if (r === 2 && x === cx) put(x, y, z, "lantern");
        continue; // open doorway
      } else if (entrance && r === 4) {
        put(x, y, z, "smooth_stone"); // entrance lintel
      } else {
        put(x, y, z, u % MULLION === 0 ? "white_concrete" : "light_blue_stained_glass");
      }
    } else {
      // Office storeys: spandrel band, then glass with mullions and rare warm lights.
      if (r === 1) {
        put(x, y, z, "white_concrete");
      } else if (u % MULLION === 0) {
        put(x, y, z, "white_concrete");
      } else if (r === 3 && (x * 7 + z * 13 + k5 * 5) % 23 === 0) {
        put(x, y, z, "shroomlight");
      } else {
        put(x, y, z, "light_blue_stained_glass");
      }
    }
  }

  // Entrance canopy: a light slab projecting over the doorway at the top of the lintel row.
  if (!core && isEntrance(x, z) && exterior(x, z, 0)) {
    put(x, gr + 5, z, "light_gray_concrete");
  }

  if (core) {
    // Tower roof slab, cornice band and parapet on the outer edge.
    put(x, ROOF_Y, z, "light_gray_concrete");
    if (exterior(x, z, PODIUM_H)) {
      put(x, ROOF_Y + 1, z, "light_gray_concrete");
      put(x, ROOF_Y + 2, z, "white_concrete");
    }

    // Penthouse: walls on the inset ring, glass inside, roof slab on top.
    const d = dAt(x, z);
    if (d >= PENT_INSET) {
      for (let y = ROOF_Y + 1; y <= ROOF_Y + 3; y++) {
        if (d === PENT_INSET) put(x, y, z, "white_concrete");
        else if (y < ROOF_Y + 3) put(x, y, z, "light_blue_stained_glass");
      }
      put(x, ROOF_Y + 3, z, "light_gray_concrete");
    }
  } else {
    // Podium terrace with a parapet on its outer edge.
    put(x, gr + PODIUM_H, z, "smooth_stone");
    if (exterior(x, z, 0)) put(x, gr + PODIUM_H + 1, z, "white_concrete");
  }
}

// Spire on the penthouse centre: lightning rods topped by a warm sea lantern.
if (inFoot(cxAll, cz) && dAt(cxAll, cz) >= PENT_INSET) {
  const base = ROOF_Y + 4;
  for (let y = base; y < base + 7; y++) put(cxAll, y, cz, "lightning_rod");
  put(cxAll, base + 7, cz, "sea_lantern");
}

g.save(`${DIR}/${ID}.nbt`);
