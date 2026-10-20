import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 遠百信義A13 (Far Eastern Department Store Xinyi A13, 2016)
// Commercial glass-and-white-stone tower: stepped massing (podium ring, mid setback, core tower),
// 5-block storeys, entrance on the east long face, warm lights behind glass, plant rooms on the roof.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE105-0129-14F";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 65, H = 81, D = 157;
const g = new Voxels([W, H, D]);

const STOREY = 5;
const key = (x, z) => x * 1000 + z;

// footprint: key -> ground (relative to lowest ground)
let minG = Infinity;
for (const c of cells) minG = Math.min(minG, Math.round(c[2]));
const ground = new Map();
for (const c of cells) ground.set(key(Math.round(c[0]), Math.round(c[1])), Math.round(c[2]) - minG);
const has = (x, z) => ground.has(key(x, z));
const groundAt = (x, z) => ground.get(key(x, z));

// footprint extents
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const k of ground.keys()) {
  const x = Math.floor(k / 1000), z = k % 1000;
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const zMid = Math.round((minZ + maxZ) / 2);

// distance from the outside (edge cells = 1), for the setback massing
const dist = new Map();
const queue = [];
for (const k of ground.keys()) {
  const x = Math.floor(k / 1000), z = k % 1000;
  if (!has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1)) {
    dist.set(k, 1);
    queue.push(k);
  }
}
for (let i = 0; i < queue.length; i++) {
  const k = queue[i];
  const x = Math.floor(k / 1000), z = k % 1000;
  const d = dist.get(k);
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nk = key(x + dx, z + dz);
    if (ground.has(nk) && !dist.has(nk)) {
      dist.set(nk, d + 1);
      queue.push(nk);
    }
  }
}

// setback tiers: slab top (cap) per cell. Slab occupies y = T-1, walls run to T-2.
// outer ring (podium) to 45, mid setback to 60, core tower to 69 (roof at 69).
const topOf = new Map();
for (const [k] of ground) {
  const d = dist.get(k) ?? 1;
  topOf.set(k, d <= 2 ? 45 : d <= 4 ? 60 : 69);
}
const topAt = (x, z) => topOf.get(key(x, z));

const hsh = (a, b) => {
  let n = (Math.imul(a, 374761393) + Math.imul(b, 668265263)) >>> 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177) >>> 0;
  return (n ^ (n >>> 16)) >>> 0;
};

const DIRS = [
  { nx: -1, nz: 0 }, { nx: 1, nz: 0 }, { nx: 0, nz: -1 }, { nx: 0, nz: 1 },
];

const lightSpots = [];

for (const [k, gr] of ground) {
  const x = Math.floor(k / 1000), z = k % 1000;
  const T = topOf.get(k);
  const lastWall = T - 2;
  const slabY = T - 1;

  // foundation up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // walls and facade; a face is exposed where there is no footprint neighbour,
  // or the neighbour's roof (slab) is below this height (setback terrace side)
  for (let y = gr; y <= lastWall; y++) {
    const faces = DIRS.filter(({ nx, nz }) => {
      const nx2 = x + nx, nz2 = z + nz;
      if (!has(nx2, nz2)) return true;
      return y >= topAt(nx2, nz2) - 1;
    });

    if (faces.length === 0) {
      // interior: floor slab at storey lines only (no interiors)
      if (y > gr && y % STOREY === 0) g.set(x, y, z, "light_gray_concrete");
      continue;
    }

    const face = faces[0];
    const u = face.nx !== 0 ? z : x;
    const local = y % STOREY;
    const fin = u % 3 === 0;
    let block;

    if (y < STOREY) {
      // commercial ground storey with a centred entrance on the east long face
      const entrance = face.nx === 1 && Math.abs(u - zMid) <= 2 && y >= gr && y < gr + 3;
      if (entrance) {
        block = null;
      } else if (fin || local === 0) {
        block = "polished_andesite";
      } else {
        block = "light_blue_stained_glass";
      }
    } else if (y === lastWall) {
      block = "smooth_quartz";                     // cornice course at top of each tier
    } else if (local === 0) {
      block = "smooth_quartz";                     // floor-line band
    } else if (fin) {
      block = "white_concrete";                    // full-height fins give depth
    } else {
      block = "light_blue_stained_glass";
    }

    if (block) g.set(x, y, z, block);

    // warm light candidates behind the glass (one block inward)
    if (block === "light_blue_stained_glass" && !fin) {
      const ix = x - face.nx, iz = z - face.nz;
      if (has(ix, iz) && y >= groundAt(ix, iz) && y <= topAt(ix, iz) - 2) {
        if (hsh(u, y) % (y < STOREY ? 9 : 23) === 0) {
          lightSpots.push({ ix, iz, y });
        }
      }
    }
  }

  // tier slab on every footprint cell
  g.set(x, slabY, z, "light_gray_concrete");

  // parapet on the outer perimeter of the final roof
  if (T === 69 && dist.get(k) === 1) g.set(x, T, z, "smooth_quartz");
}

// warm lights: glowstone / shroomlight alternating
for (const s of lightSpots) {
  const id = (hsh(s.ix, s.y) & 1) ? "glowstone" : "shroomlight";
  g.set(s.ix, s.y, s.iz, id);
}

// entrance lanterns just inside the opening
for (let z = zMid - 2; z <= zMid + 2; z++) {
  const x = maxX - 1;
  if (has(x, z) && groundAt(x, z) < 3) {
    g.set(x, 2, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// roof plant rooms on the core (top 69), each on a 3x3 footprint with a clear 5x5 margin
const PLANT = 3;
for (const [k] of ground) {
  const x = Math.floor(k / 1000), z = k % 1000;
  if (x % 16 !== 8 || z % 16 !== 8) continue;
  let ok = true;
  for (let dx = -2; dx <= 2 && ok; dx++)
    for (let dz = -2; dz <= 2 && ok; dz++)
      if (!has(x + dx, z + dz) || topAt(x + dx, z + dz) !== 69) ok = false;
  if (!ok) continue;
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++) {
      const px = x + dx, pz = z + dz;
      for (let y = 69; y < 69 + PLANT; y++) {
        const top = y === 69 + PLANT - 1;
        g.set(px, y, pz, top ? "light_gray_concrete" : "white_concrete");
      }
    }
  g.set(x, 69 + PLANT, z, "lantern", { hanging: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
