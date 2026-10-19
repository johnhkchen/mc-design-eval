// 45 West 47th Street, 1920 commercial and office building: a five-storey loft-office block in red brick on a granite
// base, with stone spandrels and a cornice, stepping up to a six-storey main body and a seven-storey penthouse set back
// into the middle of the lot. Footprint 6 x 28 (x across, z along the street). Lidar roof is read as three clean tiers
// (15 for the low wing, 18 for the main body, 21 for the penthouse), each cell's median over its neighbours; the tall
// strip on the west face is set back a block so the penthouse rises from inside the roofline. Ground floor: a granite
// base course and a shopfront of glass between piers, with a recessed entrance (dark oak door, lantern) at z 13.
// Behind the glass there is one block of air and a floor plate per storey; warm glowstone and shroomlight sit behind
// some panes. Anything that would hang over air is filled down to a support, so nothing floats.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const FILE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill/NYC1034474";
const cells = JSON.parse(readFileSync(`${FILE}.cells.json`, "utf8"));
const W = 6, D = 28, YMAX = 24;

// The footprint: roof per cell, and a check that the ground is the same (y 0) everywhere.
if (cells.some(([, , g]) => g !== 0)) throw new Error("expected every cell on the same ground (y 0)");
const roofRaw = Array.from({ length: W }, () => Array(D).fill(null));
for (const [x, z, , r] of cells) roofRaw[x][z] = r;
const inFp = (x, z) => x >= 0 && z >= 0 && x < W && z < D && roofRaw[x][z] !== null;

// Four side neighbours and the outward face each names.
const NB = [[-1, 0, "west"], [1, 0, "east"], [0, -1, "north"], [0, 1, "south"]];
const ring = (x, z) => NB.some(([dx, dz]) => !inFp(x + dx, z + dz));

// Roof tiers: the 3x3 median of the lidar roof, quantised to 15 / 18 / 21 (storeys of 3 blocks: 5, 6 and 7).
const med = (a) => [...a].sort((p, q) => p - q)[Math.floor(a.length / 2)];
const tier = (m) => (m <= 15 ? 15 : m <= 18 ? 18 : 21);
const H = Array.from({ length: W }, () => Array(D).fill(0));
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inFp(x, z)) continue;
  const near = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inFp(x + dx, z + dz)) near.push(roofRaw[x + dx][z + dz]);
  H[x][z] = tier(med(near));
}
// Setback: the penthouse tier stays off the facade; a ring cell at the top tier drops to the main body.
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inFp(x, z) && ring(x, z) && H[x][z] === 21) H[x][z] = 18;

// The solid mask, indexed (x, y, z). Ground is solid everywhere; a column is a wall where it is exposed (on the
// footprint edge, or beside a lower tier), a floor plate every 3 blocks inside, and a roof cap on top.
const S = new Uint8Array(W * YMAX * D);
const idx = (x, y, z) => (z * YMAX + y) * W + x;
const solid = (x, y, z) => x >= 0 && x < W && y >= 0 && y < YMAX && z >= 0 && z < D && S[idx(x, y, z)] === 1;
const put = (x, y, z) => { S[idx(x, y, z)] = 1; };
const exposedTo = (x, z, y) => NB.filter(([dx, dz]) => !inFp(x + dx, z + dz) || H[x + dx][z + dz] <= y);

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inFp(x, z)) continue;
  const h = H[x][z];
  for (let y = 0; y < h; y++) {
    if (y === 0 || exposedTo(x, z, y).length || y === h - 1 || y % 3 === 0) put(x, y, z);
  }
}

// Support: a solid block must stand on a solid block below, or be carried sideways in its own plane to one that does.
// Anything else gets filled down until it does. Repeats until nothing changes.
let filled = 0, changed = true;
while (changed) {
  changed = false;
  for (let y = 1; y < YMAX; y++) {
    const seen = new Uint8Array(W * D), q = [];
    for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
      if (solid(x, y, z) && solid(x, y - 1, z)) { seen[x + z * W] = 1; q.push([x, z]); }
    }
    while (q.length) {
      const [x, z] = q.pop();
      for (const [dx, dz] of NB) {
        const nx = x + dx, nz = z + dz;
        if (nx >= 0 && nz >= 0 && nx < W && nz < D && !seen[nx + nz * W] && solid(nx, y, nz)) { seen[nx + nz * W] = 1; q.push([nx, nz]); }
      }
    }
    for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
      if (solid(x, y, z) && !seen[x + z * W]) { put(x, y - 1, z); filled++; changed = true; }
    }
  }
}

// Roof equipment: two stone-brick plant rooms on the main-body roof, on interior cells at the 18 tier, two cells apart.
const plant = new Set();
for (let z = 4; z + 1 < D - 3 && plant.size < 8; z++) {
  const ok = [2, 3].every((x) => [z, z + 1].every((zz) => inFp(x, zz) && H[x][zz] === 18 && !ring(x, zz)));
  if (!ok || (plant.size && z < [...plant][plant.size - 1] + 8)) continue;
  for (const x of [2, 3]) for (const zz of [z, z + 1]) {
    for (const y of [18, 19]) put(x, y, zz);
    plant.add(zz);
  }
}
const plantKey = (x, y, z) => plant.has(z) && (x === 2 || x === 3) && (y === 18 || y === 19) && inFp(x, z);

// The entrance: the door at z 13 on the west face, a stone pier either side, a recessed vestibule behind (x 1), a lantern.
const DOOR_Z = 13;

// Glass panes: connected to neighbouring solids in their own plane, so the grid reads as a continuous frame.
const paneState = (x, y, z) => {
  const c = (dx, dz) => (solid(x + dx, y, z + dz) ? "true" : "false");
  return { north: c(0, -1), south: c(0, 1), east: c(1, 0), west: c(-1, 0), waterlogged: "false" };
};
const lamps = { glowstone: 0, shroomlight: 0 };

const g = new Voxels([W, YMAX, D]);
const counts = { wall: 0, glass: 0, interior: 0, plant: 0 };

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inFp(x, z)) continue;
  const h = H[x][z];
  for (let y = 0; y < YMAX; y++) {
    if (!solid(x, y, z)) continue;
    if (plantKey(x, y, z)) { g.set(x, y, z, "stone_bricks"); counts.plant++; continue; }
    const ex = exposedTo(x, z, y);
    if (!ex.length) {
      g.set(x, y, z, y === h - 1 ? "stone" : "smooth_stone"); counts.interior++; continue;
    }
    counts.wall++;
    if (y === 0) { g.set(x, y, z, "polished_granite"); continue; }
    if (y === h - 1) { g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); continue; }
    if (y === h - 2 || ex.length >= 2) { g.set(x, y, z, "stone_bricks"); continue; }   // cornice and quoins in limestone
    if (y % 3 === 0) { g.set(x, y, z, "bricks"); continue; }   // storey line in the brick, so the stone reads as trim only
    const [dx, dz] = ex[0];
    const pier = dx !== 0 ? z % 3 === 0 : (x === 2 || x === 3);   // piers at every third bay on the long faces, two in the middle on the ends
    if (y <= h - 3 && !pier && ring(x, z) && ex.length === 1) {   // a pane in the band under the cornice
      g.set(x, y, z, "glass_pane", paneState(x, y, z)); counts.glass++;
      // A warm lamp in the air behind some panes: every other storey on the long faces, and behind x 1 on the ends.
      const k = Math.floor(y / 3);
      if (dx !== 0 && z % 9 === 2 && y % 3 === 1 && k % 2 === 1 && !solid(x + (dx === -1 ? 1 : -1), y, z)) {
        g.set(x + (dx === -1 ? 1 : -1), y, z, "glowstone"); lamps.glowstone++;
      }
      if (dz !== 0 && x === 1 && y % 3 === 1 && k % 2 === 0 && !solid(x, y, z + (dz === -1 ? 1 : -1))) {
        g.set(x, y, z + (dz === -1 ? 1 : -1), "shroomlight"); lamps.shroomlight++;
      }
      continue;
    }
    g.set(x, y, z, y < 3 ? "stone_bricks" : "bricks");
  }
}

// Doors, vestibule piers and the lantern.
for (const y of [1, 2]) {
  g.set(0, y, DOOR_Z - 1, "stone_bricks");
  g.set(0, y, DOOR_Z + 1, "stone_bricks");
}
const doorState = (half) => ({ facing: "west", half, hinge: "left", open: "false", powered: "false" });
g.set(0, 1, DOOR_Z, "dark_oak_door", doorState("lower"));
g.set(0, 2, DOOR_Z, "dark_oak_door", doorState("upper"));
g.set(1, 2, DOOR_Z, "lantern", { hanging: "true", waterlogged: "false" });

const out = g.save(`${FILE}.nbt`);
let top = 0; for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inFp(x, z)) top = Math.max(top, H[x][z]);
console.log(JSON.stringify({ tiers: { top }, filled, counts, lamps, saved: out }));
