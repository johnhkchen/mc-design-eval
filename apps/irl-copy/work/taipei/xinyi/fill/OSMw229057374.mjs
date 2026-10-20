import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw229057374";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 77, H = 23, D = 82;
const g = new Voxels([W, H, D]);

// Civic concrete block of the 1970s-80s: two storeys, white concrete with
// stone-band storey lines, tinted-glass window grid, red-brown parapet cap.
const ROOF = 11;   // flat roof deck level (absolute y)
const CAP = 12;    // parapet cap level on the outer shell
const FLOOR = 5;   // storey line between the two storeys
const CORNICE = 10;

const K = (x, z) => `${x},${z}`;
const G = new Map();
for (const [x, z, gr] of cells) G.set(K(x, z), gr);
const inside = (x, z) => G.has(K(x, z));

// Depth from the outside: 1 = outer shell, 2 = air gap ring, 3+ = solid core.
const dist = new Map();
const q = [];
for (const [x, z] of cells) {
  if (!inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1)) {
    dist.set(K(x, z), 1);
    q.push([x, z]);
  }
}
for (let i = 0; i < q.length; i++) {
  const [x, z] = q[i];
  const d = dist.get(K(x, z));
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz, k = K(nx, nz);
    if (inside(nx, nz) && !dist.has(k)) {
      dist.set(k, d + 1);
      q.push([nx, nz]);
    }
  }
}
const depth = (x, z) => dist.get(K(x, z)) ?? 99;

// Bounding box for the roof penthouse
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of cells) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const bw = maxX - minX, bh = maxZ - minZ;

// Main entrance: on the north-facing shell (missing z-1), nearest the footprint's mean x.
const meanX = cells.reduce((s, c) => s + c[0], 0) / cells.length;
const entCands = cells.filter(([x, z]) => depth(x, z) === 1 && !inside(x, z - 1));
let entKey = null, entX = null, entZ = null;
if (entCands.length) {
  const ent = entCands.reduce((b, c) => (Math.abs(c[0] - meanX) < Math.abs(b[0] - meanX) ? c : b));
  entX = ent[0]; entZ = ent[1];
  entKey = K(entX, entZ);
}

const GLASS = "gray_stained_glass_pane";
const PIER = "smooth_stone";     // lighter mullions so the bays read
const WALL = "white_concrete";
const ROOF_DECK = "light_gray_concrete";

function inwardOf(x, z) {
  if (!inside(x, z - 1)) return [x, z + 1];
  if (!inside(x, z + 1)) return [x, z - 1];
  if (!inside(x - 1, z)) return [x + 1, z];
  return [x - 1, z];
}

function doShell(x, z, gr) {
  const missZ = !inside(x, z - 1) || !inside(x, z + 1); // wall runs along X
  const missX = !inside(x - 1, z) || !inside(x + 1, z); // wall runs along Z
  const corner = missZ && missX;
  const along = missZ ? x : z;
  const pier = corner || along % 4 === 0 || along % 4 === 3;
  const paneProps = missZ
    ? { north: "false", east: "true", south: "false", west: "true", waterlogged: "false" }
    : { north: "true", east: "false", south: "true", west: "false", waterlogged: "false" };
  const isEntrance = K(x, z) === entKey;

  // entrance surround: pilasters flanking the door, lintel band over it
  const onEntFace = entKey !== null && z === entZ && !inside(x, z - 1) && Math.abs(x - entX) <= 2;

  for (let y = gr + 1; y <= CAP; y++) {
    if (isEntrance && (y === gr + 1 || y === gr + 2)) {
      const half = y === gr + 1 ? "lower" : "upper";
      g.set(x, y, z, "oak_door", {
        facing: "north", half, hinge: "left", open: "false", powered: "false",
      });
      continue;
    }
    if (onEntFace && Math.abs(x - entX) === 2 && y <= gr + 3) {
      g.set(x, y, z, "stone_bricks");   // pilaster
      continue;
    }
    if (onEntFace && y === gr + 3) {
      g.set(x, y, z, "stone_bricks");   // lintel band over the door
      continue;
    }
    if (y === gr + 1) { g.set(x, y, z, "stone_bricks"); continue; }     // base course
    if (y === FLOOR) { g.set(x, y, z, "smooth_stone"); continue; }     // storey line
    if (y === CORNICE) { g.set(x, y, z, "smooth_stone"); continue; }   // cornice band
    if (y === CAP) { g.set(x, y, z, "red_terracotta"); continue; }     // parapet cap
    if (y === ROOF) { g.set(x, y, z, WALL); continue; }

    const inWin = (y >= 2 && y <= 4) || (y >= 6 && y <= 9);
    if (!inWin || pier) {
      g.set(x, y, z, PIER);
      continue;
    }
    g.set(x, y, z, GLASS, paneProps);

    // warm light behind some second-storey windows
    if (y === 7 && along % 6 === 1) {
      const [ix, iz] = inwardOf(x, z);
      if (depth(ix, iz) === 2) g.set(ix, 7, iz, "glowstone");
    }
  }

  // lanterns flanking the entrance door
  if (isEntrance) {
    for (const dx of [-1, 1]) {
      const lx = x + dx;
      if (inside(lx, z) && depth(lx, z) === 1) {
        g.set(lx, gr + 2, z, "lantern", { hanging: "false", waterlogged: "false" });
      }
    }
  }
}

for (const [x, z, gr] of cells) {
  const dd = depth(x, z);

  // foundation from y 0 up to this cell's ground
  for (let y = 0; y <= gr; y++) g.set(x, y, z, "stone_bricks");

  if (dd === 1) {
    doShell(x, z, gr);
  } else if (dd === 2) {
    // air gap ring: storey floor slab and roof deck only
    g.set(x, FLOOR, z, "smooth_stone");
    g.set(x, ROOF, z, ROOF_DECK);
  } else {
    // solid core
    for (let y = gr + 1; y < ROOF; y++) g.set(x, y, z, WALL);
    g.set(x, ROOF, z, ROOF_DECK);

    const inCentre =
      x >= minX + 0.3 * bw && x <= maxX - 0.3 * bw &&
      z >= minZ + 0.3 * bh && z <= maxZ - 0.3 * bh;

    // roof penthouse over the middle of the core
    if (dd >= 4 && inCentre) {
      g.set(x, 12, z, WALL);
      g.set(x, 13, z, WALL);
      g.set(x, 14, z, "red_terracotta");
    }
    // small rooftop plant boxes on the deck, away from the penthouse
    else if (dd >= 4 && x % 13 === 4 && z % 11 === 3) {
      g.set(x, 12, z, "stone_bricks");
      g.set(x, 13, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
