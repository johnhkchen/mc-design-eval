import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE112-8888-43F-2";
const W = 83, H = 23, D = 83;

// Footprint: [x, z, ground] per cell. Ground is already in y coordinates (y 0 = lowest ground).
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gy] of raw) ground.set(`${x},${z}`, Math.round(gy));
const inF = (x, z) => ground.has(`${x},${z}`);
const minG = Math.min(...ground.values());

// Lidar record: roof about 11 blocks above lowest ground. Two storeys of 5 plus cornice.
const R = minG + 11;

const g = new Voxels([W, H, D]);

// Entrance: on the south (low-z) face, two bays centred on x 40..41.
// Find the face cell nearest the centre line for each of those columns.
const entrance = new Set();
for (const x of [40, 41]) {
  let best = null;
  for (const [cx, cz] of raw) {
    if (cx !== x || inF(x, cz - 1)) continue;
    if (best === null || cz < best) best = cz;
  }
  if (best !== null) entrance.add(`${x},${best}`);
}
// Flanking pillar columns just outside the doors.
const pillar = new Set();
for (const x of [39, 42]) {
  let best = null;
  for (const [cx, cz] of raw) {
    if (cx !== x || inF(x, cz - 1)) continue;
    if (best === null || cz < best) best = cz;
  }
  if (best !== null) pillar.add(`${x},${best}`);
}

// Penthouse plant box at the centre of the roof.
const CX = 41, CZ = 41, PH = 9;

// A cell is "deep" if it and all four neighbours are footprint cells (not on a facade).
const deep = (x, z) => inF(x, z) && inF(x - 1, z) && inF(x + 1, z) && inF(x, z - 1) && inF(x, z + 1);

for (const [x, z, gy] of raw) {
  const gr = Math.round(gy);
  const alongZ = !inF(x - 1, z) || !inF(x + 1, z); // on an x-facing face, wall runs along z
  const alongX = !inF(x, z - 1) || !inF(x, z + 1); // on a z-facing face, wall runs along x
  const isEdge = alongZ || alongX;

  // Keep the roof above the cell's own ground by at least three blocks.
  const T = Math.max(R - 1, gr + 3);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (!isEdge) {
    // Interior: floor slabs on storey lines, roof deck on top, air between.
    for (let y = gr; y <= T; y++) {
      if (y === T) g.set(x, y, z, "light_gray_concrete");
      else if ((y - gr) % 5 === 0) g.set(x, y, z, "smooth_stone");
    }

    // Rooftop plant enclosure: a ring of light concrete around the centre.
    const dx = Math.abs(x - CX), dz = Math.abs(z - CZ);
    if (dx <= PH && dz <= PH && (dx === PH || dz === PH)) {
      g.set(x, T + 1, z, "light_gray_concrete");
      g.set(x, T + 2, z, "light_gray_concrete");
    }
    continue;
  }

  // Edge (facade) cell.
  const t = alongZ ? z : x;
  const key = `${x},${z}`;
  const isEntrance = entrance.has(key);
  const isPillar = pillar.has(key);
  const corner = alongZ && alongX;

  for (let y = gr; y <= T; y++) {
    const rel = y - gr;
    if (y === gr) { g.set(x, y, z, "polished_andesite"); continue; }       // base course
    if (y === T) { g.set(x, y, z, "smooth_quartz"); continue; }            // cornice
    if (rel % 5 === 0) { g.set(x, y, z, "white_concrete"); continue; }     // storey spandrel

    if (isEntrance) {
      if (rel <= 3) g.set(x, y, z, "glass");                               // clear doorway
      else g.set(x, y, z, "white_concrete");                               // lintel
      continue;
    }
    if (isPillar && rel <= 4) {
      g.set(x, y, z, "polished_andesite");                                 // door pillars
      continue;
    }

    if (t % 3 === 0) {
      g.set(x, y, z, "white_concrete");                                    // mullion frame
    } else {
      g.set(x, y, z, "light_blue_stained_glass_pane", {
        north: alongZ || corner ? "true" : "false",
        south: alongZ || corner ? "true" : "false",
        east: alongX || corner ? "true" : "false",
        west: alongX || corner ? "true" : "false",
        waterlogged: "false",
      });
    }
  }

  // Lobby lanterns: standing on the floor just inside each entrance bay.
  if (isEntrance) {
    const iz = alongX ? (!inF(x, z - 1) ? z + 1 : z - 1) : z;
    if (deep(x, iz)) g.set(x, gr + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }

  // Warm light: a glowstone one bay inside, standing on the floor slab.
  if (!isEntrance && !isPillar) {
    for (let y = gr + 1; y < T; y++) {
      const rel = y - gr;
      if (rel % 5 !== 1 || t % 6 !== 4) continue;
      let ix = x, iz = z;
      if (alongZ) ix = !inF(x - 1, z) ? x + 1 : x - 1;
      else iz = !inF(x, z - 1) ? z + 1 : z - 1;
      if (deep(ix, iz)) g.set(ix, y, iz, "glowstone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
