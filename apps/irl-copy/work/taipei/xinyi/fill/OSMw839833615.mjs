import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unrecorded low-rise commercial block, Xinyi district, Taipei.
// Read as a c.1985-1995 two-storey shophouse-style block: pale ceramic-tile walls,
// grey concrete piers, tinted-glass shopfront at street level, a pane-glass upper
// storey, a steel water tank on the roof deck (common on Taipei roofs), and a
// central glass-and-steel entrance.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833615";
const W = 18, H = 23, D = 19;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
let B = Infinity; // lowest ground under the footprint = y 0 reference for storeys
for (const [x, z, gr] of cells) {
  const gi = Math.round(gr);
  ground.set(`${x},${z}`, gi);
  if (gi < B) B = gi;
}
if (!Number.isFinite(B)) throw new Error("no footprint cells");

const inFp = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const DIRS = [
  { dx: 0, dz: -1, name: "north" },
  { dx: 0, dz: 1, name: "south" },
  { dx: -1, dz: 0, name: "west" },
  { dx: 1, dz: 0, name: "east" },
];
const OPP = { north: "south", south: "north", east: "west", west: "east" };

const missing = (x, z) => DIRS.filter((d) => !inFp(x + d.dx, z + d.dz));
const interior = (x, z) => DIRS.every((d) => inFp(x + d.dx, z + d.dz));

// Materials
const WALL = "quartz_block";
const PIER = "light_gray_concrete";
const BASE = "polished_andesite";
const SHOP = "light_blue_stained_glass";
const PANE = "light_blue_stained_glass_pane";
const BAND = "smooth_stone";
const SLAB = "smooth_quartz";
const FOUND = "stone_bricks";

// Levels (relative to B)
const REL_SLAB = [5, 10];          // floor slab / roof deck
const REL_TOP = 11;                // parapet top ~ 11 blocks above lowest ground

// Pier / door layout
const isPierCell = (x, z, m) => {
  if (m.length >= 2) return true; // corners
  return m.some((d) => (d.dz !== 0 ? x % 3 === 0 : z % 3 === 0));
};

// Entrance: on the south face if possible, away from pier columns, near centre.
let doorKey = null;
{
  const cand = [];
  for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
    const m = missing(x, z);
    if (!m.some((d) => d.name === "south")) continue;
    if (isPierCell(x, z, m)) continue;
    cand.push([Math.abs(x - (W - 1) / 2), x, z]);
  }
  if (!cand.length) {
    for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
      const m = missing(x, z);
      if (!m.length || isPierCell(x, z, m)) continue;
      cand.push([Math.abs(x - (W - 1) / 2), x, z]);
    }
  }
  cand.sort((a, b) => a[0] - b[0]);
  if (cand.length) doorKey = `${cand[0][1]},${cand[0][2]}`;
}

// 1. Foundation: solid from y 0 up to each cell's ground, plus a plinth course on the ground.
for (const [x, z, gr] of cells) {
  const gi = Math.round(gr);
  for (let y = 0; y <= gi; y++) {
    put(x, y, z, y === gi ? BASE : FOUND);
  }
}

// 2. Floor slabs and roof deck on every footprint cell that is still above ground.
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const gi = gAt(x, z);
  for (const r of REL_SLAB) {
    const y = B + r;
    if (y > gi) put(x, y, z, SLAB);
  }
}

// 3. Walls on boundary cells.
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const m = missing(x, z);
  if (!m.length) continue; // interior: air behind the envelope
  const gi = gAt(x, z);
  const pier = isPierCell(x, z, m);
  const alongX = m.some((d) => d.dz !== 0);
  const paneProps = alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  const outward = m[0];
  const inward = { dx: -outward.dx, dz: -outward.dz };
  const isDoor = `${x},${z}` === doorKey;
  const doorDir = isDoor ? m.find((d) => d.name === "south") || outward : null;

  for (let rel = 1; rel <= REL_TOP; rel++) {
    if (REL_SLAB.includes(rel)) continue; // already placed
    const y = B + rel;
    if (y <= gi) continue;

    // Entrance
    if (isDoor && (rel === 1 || rel === 2)) {
      put(x, y, z, "iron_door", {
        facing: OPP[doorDir.name],
        half: rel === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    if (rel === REL_TOP) {
      put(x, y, z, pier ? PIER : SLAB); // parapet
      continue;
    }
    if (rel === 1) { put(x, y, z, pier ? PIER : BASE); continue; }
    if (rel >= 2 && rel <= 4) {
      put(x, y, z, pier ? PIER : SHOP); // ground storey shopfront
      continue;
    }
    if (rel === 6) { put(x, y, z, pier ? PIER : BAND); continue; }
    if (rel >= 7 && rel <= 9) {
      if (pier) { put(x, y, z, PIER); continue; }
      put(x, y, z, PANE, paneProps);
      // Warm light in the air gap behind a sparse set of upper-storey windows.
      if (rel === 8 && (x + z) % 4 === 0 && interior(x + inward.dx, z + inward.dz)) {
        const ix = x + inward.dx, iz = z + inward.dz;
        if (gAt(ix, iz) < y) put(ix, y, iz, "glowstone");
      }
      continue;
    }
  }
}

// 4. Roof equipment: a steel water tank on a pier-block plinth, and a lightning rod.
{
  const cx = (W - 1) / 2, cz = (D - 1) / 2;
  const ok = (x, z) =>
    interior(x, z) && interior(x + 1, z) && interior(x, z + 1) && interior(x + 1, z + 1) &&
    [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]].every(([a, b]) => gAt(a, b) < B + 10);

  let best = null;
  for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
    if (!ok(x, z)) continue;
    const d = Math.hypot(x + 0.5 - cx, z + 0.5 - cz);
    if (!best || d < best.d) best = { x, z, d };
  }
  if (best) {
    for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      const x = best.x + dx, z = best.z + dz;
      put(x, B + 11, z, PIER);
      put(x, B + 12, z, "white_concrete");
      put(x, B + 13, z, "white_concrete");
      put(x, B + 14, z, "iron_block");
    }
  }

  // Lightning rod on another interior roof cell, away from the tank.
  let rod = null;
  for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
    if (!interior(x, z) || gAt(x, z) >= B + 10) continue;
    if (best && Math.abs(x - best.x) < 3 && Math.abs(z - best.z) < 3) continue;
    rod = [x, z];
    break;
  }
  if (rod) {
    put(rod[0], B + 11, rod[1], "lightning_rod");
  }
}

g.save(`${DIR}/${ID}.nbt`);
