import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 皇翔御琚C棟 (2005): a pale-tiled, stepped residential tower in Xinyi.
// Lower shaft to y=59, then a 3-block setback tier to a roof deck at y=80,
// with a parapet and roof plant up to y=82. Warm glow shows through some windows.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE94-0295-15F-2";
const W = 47, H = 95, D = 29;
const ROOF_TOP = 83;      // body occupies y < 83
const DECK_Y = 80;        // roof deck on tier
const SETBACK_Y = 60;     // upper tier starts here
const TIER_MIN_D = 4;     // cells with edge distance >= 4 continue above SETBACK_Y
const CX = 23, CZ = 14;   // plan centre

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const key = (x, z) => `${x},${z}`;

// 4-neighbour directions: name -> [dx, dz]
const NB = [
  ["north", 0, -1],
  ["south", 0, 1],
  ["west", -1, 0],
  ["east", 1, 0],
];

// Edge distance: cells touching outside are d=1, growing inward.
const dist = new Map();
const q = [];
for (const [x, z] of cells) {
  if (NB.some(([, dx, dz]) => !has(x + dx, z + dz))) {
    dist.set(key(x, z), 1);
    q.push([x, z]);
  }
}
for (let i = 0; i < q.length; i++) {
  const [x, z] = q[i];
  const d = dist.get(key(x, z));
  for (const [, dx, dz] of NB) {
    const nx = x + dx, nz = z + dz;
    const k = key(nx, nz);
    if (has(nx, nz) && !dist.has(k)) {
      dist.set(k, d + 1);
      q.push([nx, nz]);
    }
  }
}
const edgeD = (x, z) => dist.get(key(x, z)) ?? 1;

// Is (x,z) part of the building body at height y?
function inSet(x, z, y) {
  if (!has(x, z)) return false;
  if (y < ground.get(key(x, z))) return false;
  if (y < SETBACK_Y) return true;
  return edgeD(x, z) >= TIER_MIN_D;
}

// Shell = body cell with at least one open side at height y.
function isShell(x, z, y) {
  if (!inSet(x, z, y)) return false;
  return NB.some(([, dx, dz]) => !inSet(x + dx, z + dz, y));
}

// Outward facing for a shell cell (first open side in NB order).
function outward(x, z, y) {
  for (const [name, dx, dz] of NB) {
    if (!inSet(x + dx, z + dz, y)) return { name, dx, dz };
  }
  return null;
}

// Foundation: solid from y=0 up to each cell's ground.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
}

// Body, cell by cell, bottom to top.
for (const [x, z, gr] of cells) {
  for (let y = gr; y < ROOF_TOP; y++) {
    if (!inSet(x, z, y)) continue;
    const shell = isShell(x, z, y);

    // Roof deck over the whole tier
    if (y === DECK_Y) {
      g.set(x, y, z, "smooth_quartz");
      continue;
    }

    // Parapet and roof plant
    if (y > DECK_Y) {
      if (shell) {
        g.set(x, y, z, "white_concrete");
      } else if (Math.abs(x - CX) <= 5 && Math.abs(z - CZ) <= 3) {
        g.set(x, y, z, "gray_concrete");
      }
      continue;
    }

    const rel = y % 5;

    // Floor slabs and storey bands, all cells
    if (rel === 4) {
      g.set(x, y, z, "smooth_quartz");
      continue;
    }

    // Interior air gap
    if (!shell) continue;

    const out = outward(x, z, y);
    const k = Math.floor(y / 5);
    const isNS = out.name === "north" || out.name === "south";
    const s = isNS ? x : z; // coordinate along the facade

    // Ground-floor entrance, centred on the north face, with piers and lintel
    if (out.name === "north" && y <= 3 && Math.abs(x - CX) <= 4) {
      if (Math.abs(x - CX) === 4) {
        g.set(x, y, z, "stone_bricks");            // door piers
      } else if (y === 3) {
        g.set(x, y, z, "smooth_quartz");            // lintel
      } else {
        g.set(x, y, z, "glass");                    // doorway glass
      }
      continue;
    }

    // Spandrel under each window row
    if (rel === 0) {
      g.set(x, y, z, "white_concrete");
      continue;
    }

    // Mullions between window bays; every other one is a darker pilaster
    if (s % 4 === 0) {
      g.set(x, y, z, s % 8 === 0 ? "light_gray_concrete" : "white_concrete");
      continue;
    }

    // Window pane, connected along the facade
    const props = isNS
      ? { north: "false", south: "false", east: "true", west: "true" }
      : { north: "true", south: "true", east: "false", west: "false" };
    g.set(x, y, z, "light_blue_stained_glass_pane", props);

    // Warm light behind some windows, in the air gap
    if (rel === 2 && s % 4 === 2 && ((Math.floor(s / 4) + k) % 3 === 0)) {
      const ix = x - out.dx, iz = z - out.dz;
      if (inSet(ix, iz, y) && !isShell(ix, iz, y)) {
        g.set(ix, y, iz, "glowstone");
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
