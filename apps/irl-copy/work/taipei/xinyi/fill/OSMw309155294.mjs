import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw309155294";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 74, H = 23, D = 170;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const NB = [[0, -1, "north"], [0, 1, "south"], [-1, 0, "west"], [1, 0, "east"]];

// Depth from the footprint edge (edge cells = 1), multi-source BFS.
const depth = new Map();
let frontier = [];
for (const [x, z] of cells) {
  const edge = NB.some(([dx, dz]) => !has(x + dx, z + dz));
  if (edge) { depth.set(`${x},${z}`, 1); frontier.push([x, z]); }
}
for (let d = 1; frontier.length; d++) {
  const next = [];
  for (const [x, z] of frontier) {
    for (const [dx, dz] of NB) {
      const k = `${x + dx},${z + dz}`;
      if (has(x + dx, z + dz) && !depth.has(k)) {
        depth.set(k, d + 1);
        next.push([x + dx, z + dz]);
      }
    }
  }
  frontier = next;
}
const dep = (x, z) => depth.get(`${x},${z}`) ?? 0;

// Outward direction: the neighbour with smaller depth (or missing).
function outwardOf(x, z) {
  const d = dep(x, z);
  for (const [dx, dz, name] of NB) {
    if (dep(x + dx, z + dz) === d - 1) return { name, dx, dz };
  }
  return null;
}

// Entrance: street-facing (north) edge cell nearest the median x.
const northEdgeXs = cells
  .filter(([x, z]) => dep(x, z) === 1 && !has(x, z - 1))
  .map(([x]) => x).sort((a, b) => a - b);
const entranceX = northEdgeXs.length ? northEdgeXs[Math.floor(northEdgeXs.length / 2)] : -999;
const entranceZ = (() => {
  const zs = cells.filter(([x, z]) => x === entranceX && dep(x, z) === 1).map(([, z]) => z);
  return zs.length ? Math.min(...zs) : -999;
})();
const inEntrance = (x, z) => z === entranceZ && Math.abs(x - entranceX) <= 2;

const maxG = Math.max(...cells.map(([, , gr]) => gr));

// Wall window grid on one facade: u = coordinate along the face.
function facadeBlock(u, dy, storeyBase) {
  if (u % 3 === 0) return "smooth_quartz";
  return "light_blue_stained_glass_pane";
}

for (const [x, z, gr] of cells) {
  const d = dep(x, z);
  const out = outwardOf(x, z);
  const edge = d === 1;
  const tierEdge = d === 5;
  const tierCore = d >= 6;
  const u = out && (out.name === "north" || out.name === "south") ? x : z;

  // Foundation
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Ground course
  g.set(x, gr, z, edge ? "polished_granite" : "light_gray_concrete");

  if (edge) {
    // Entrance reveal and doorway
    if (inEntrance(x, z)) {
      g.set(x, gr + 1, z, "tinted_glass");
      g.set(x, gr + 2, z, "tinted_glass");
      g.set(x, gr + 3, z, "polished_andesite");
    } else {
      // Shopfront
      for (let dy = 1; dy <= 3; dy++) {
        g.set(x, gr + dy, z, u % 3 === 0 ? "smooth_quartz" : "light_blue_stained_glass_pane");
      }
    }
    // Canopy band over storey 0, stepped over the entrance
    g.set(x, gr + 4, z, inEntrance(x, z) ? "polished_andesite_slab" : "smooth_quartz");
    // Storey line
    g.set(x, gr + 5, z, "smooth_quartz");
    // Storey 1 windows
    for (let dy = 6; dy <= 9; dy++) {
      g.set(x, gr + dy, z, u % 3 === 0 ? "quartz_block" : "light_blue_stained_glass_pane");
    }
    // Warm light behind some windows (interior side)
    if (u % 3 !== 0 && (u * 7 + gr) % 9 === 0 && out) {
      const ix = x - out.dx, iz = z - out.dz;
      if (has(ix, iz)) g.set(ix, gr + 7, iz, "shroomlight");
    }
    // Cornice and parapet
    g.set(x, gr + 10, z, "smooth_quartz");
    g.set(x, gr + 11, z, "smooth_quartz");
    if (gr + 12 <= H - 1) g.set(x, gr + 12, z, "polished_granite");
  } else {
    // Interior: storey slabs, air between
    g.set(x, gr + 5, z, "light_gray_concrete");
    g.set(x, gr + 11, z, "light_gray_concrete");
  }

  // Setback tier: walls from roof g+11 to g+16 on the deep core
  if (tierEdge || tierCore) {
    if (gr + 16 <= H - 1) {
      // Tier roof slab
      g.set(x, gr + 16, z, tierEdge ? "smooth_quartz" : "light_gray_concrete");
      if (tierEdge && out) {
        const tu = out.name === "north" || out.name === "south" ? x : z;
        for (let dy = 12; dy <= 15; dy++) {
          let block;
          if (dy === 12) block = "polished_granite";
          else if (dy === 13 || dy === 15) block = tu % 3 === 0 ? "quartz_block" : "light_blue_stained_glass_pane";
          else block = tu % 3 === 0 ? "quartz_block" : "light_blue_stained_glass_pane";
          g.set(x, gr + dy, z, block);
        }
        // Tier storey line at g+14
        g.set(x, gr + 14, z, "smooth_quartz");
        // Tier cornice at g+15 under the top slab
        g.set(x, gr + 15, z, "smooth_quartz");
      }
      if (tierCore) {
        // Plant band on the tier roof, sparse and aligned to the grid
        if ((x % 6 < 3) && (z % 6 < 3)) {
          g.set(x, gr + 17 <= H - 1 ? gr + 17 : H - 1, z, "white_concrete");
        }
      }
    }
  } else if (!edge) {
    // Ordinary roof
    g.set(x, gr + 11, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
