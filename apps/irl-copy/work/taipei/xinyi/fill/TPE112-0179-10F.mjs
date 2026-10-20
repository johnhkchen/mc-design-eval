import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE112-0179-10F";
const W = 17, H = 23, D = 58;

// Record: built 2023, roof ~11 blocks above lowest ground.
// Read as a commercial/office block of about two storeys plus a setback core,
// white-tile and concrete frame with glass and aluminium-look window bands.
const ROOF_Y = 11;
const STOREY = 5;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const foot = new Map();
for (const [x, z, gr] of cells) foot.set(key(x, z), gr);
const inF = (x, z) => foot.has(key(x, z));

const isEdge = (x, z) =>
  !inF(x + 1, z) || !inF(x - 1, z) || !inF(x, z + 1) || !inF(x, z - 1);

// Corner cells: missing neighbours on two perpendicular sides.
const isCorner = (x, z) =>
  (!inF(x + 1, z) || !inF(x - 1, z)) && (!inF(x, z + 1) || !inF(x, z - 1));

// Distance from the nearest edge (BFS inward), for the setback core.
const dist = new Map();
const queue = [];
for (const [x, z] of cells) {
  if (isEdge(x, z)) { dist.set(key(x, z), 0); queue.push([x, z]); }
}
while (queue.length) {
  const [x, z] = queue.shift();
  const d = dist.get(key(x, z));
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const k = key(x + dx, z + dz);
    if (inF(x + dx, z + dz) && !dist.has(k)) {
      dist.set(k, d + 1);
      queue.push([x + dx, z + dz]);
    }
  }
}

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of cells) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

// Entrance: west (min-x) facade, middle of the long side.
const zMid = Math.round((minZ + maxZ) / 2);
const isEntrance = (x, z) => x === minX && z >= zMid - 2 && z <= zMid + 2;
const isDoorFrame = (x, z) => x === minX && (z === zMid - 3 || z === zMid + 3);

for (const [x, z, gr] of cells) {
  const ground = Math.max(0, Math.min(H - 1, gr));
  const edge = isEdge(x, z);
  const corner = edge && isCorner(x, z);
  const d = dist.get(key(x, z)) ?? 0;

  // Setback: the inner core (2+ cells from the edge) drops one storey.
  let top = Math.min(H - 3, Math.max(ROOF_Y, ground + STOREY));
  if (!edge && d >= 3) {
    top = Math.min(H - 3, Math.max(ROOF_Y - STOREY, ground + STOREY));
  }

  // Foundation from y=0 up to this cell's ground.
  for (let y = 0; y < ground; y++) g.set(x, y, z, "light_gray_concrete");

  // Body, ground to top-1.
  for (let y = ground; y < top; y++) {
    const rel = y - ground;
    const s = x + z;

    if (!edge) {
      // Interior: floor slabs only, air gap behind the glass.
      if (rel % STOREY === 0 || y === top - 1) g.set(x, y, z, "smooth_stone");
      continue;
    }

    if (corner) {
      g.set(x, y, z, rel % STOREY === STOREY - 1 ? "light_gray_concrete" : "quartz_pillar");
      continue;
    }

    if (isEntrance(x, z)) {
      if (rel === 0) g.set(x, y, z, "smooth_stone");
      else if (rel === 1 || rel === 2) { /* open doorway */ }
      else if (rel === 3) g.set(x, y, z, "glowstone");   // warm lintel light
      else g.set(x, y, z, "light_blue_stained_glass");
      continue;
    }

    if (isDoorFrame(x, z) && rel >= 1 && rel <= 3) {
      g.set(x, y, z, "quartz_block");
      continue;
    }

    if (rel === 0) {
      g.set(x, y, z, "smooth_stone");                     // base course
    } else if (rel % STOREY === 0) {
      g.set(x, y, z, "white_concrete");                   // storey line
    } else if (rel % STOREY === STOREY - 1) {
      g.set(x, y, z, "light_gray_concrete");              // spandrel
    } else if (s % 3 === 0) {
      g.set(x, y, z, "quartz_block");                     // mullion
    } else if ((s * 5 + y * 3) % 17 === 0) {
      g.set(x, y, z, "glowstone");                        // lit window
    } else {
      g.set(x, y, z, "light_blue_stained_glass");         // glazing
    }
  }

  // Roof deck on every cell, standing on the body top-1 layer.
  g.set(x, top, z, "light_gray_concrete");

  // Parapet on the perimeter, standing on the deck.
  if (edge) g.set(x, top + 1, z, "white_concrete");

  // Vertical rhythm: pilasters rising above the parapet on bays and corners.
  if (edge && (corner || (x + z) % 6 === 0)) {
    g.set(x, top + 2, z, "quartz_pillar");
  }

  // Roof plant on the core, sparse.
  if (!edge && (x * 7 + z * 3) % 23 === 0) g.set(x, top + 1, z, "gray_concrete");
}

// Mast on the roof near the centre of the footprint.
let cx = 0, cz = 0, n = 0;
for (const [x, z] of cells) { cx += x; cz += z; n++; }
cx = Math.round(cx / n); cz = Math.round(cz / n);
let mastTop = null;
for (const [x, z, gr] of cells) {
  if (x === cx && z === cz) {
    mastTop = Math.min(H - 3, Math.max(ROOF_Y, gr + STOREY));
  }
}
if (mastTop !== null) {
  g.set(cx, mastTop + 1, cz, "lightning_rod");
  g.set(cx, mastTop + 2, cz, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
