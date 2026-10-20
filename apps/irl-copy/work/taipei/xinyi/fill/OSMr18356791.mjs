import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMr18356791";
const W = 52, H = 23, D = 127;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground level (y of the ground under that cell)
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, Math.round(gr));
const inFP = (x, z) => G.has(`${x},${z}`);
const ground = (x, z) => G.get(`${x},${z}`);
const isEdge = (x, z) => !inFP(x - 1, z) || !inFP(x + 1, z) || !inFP(x, z - 1) || !inFP(x, z + 1);
const edgeNb = (x, z) => inFP(x, z) && isEdge(x, z);

// Bounds-checked, footprint-only placement
const put = (x, y, z, id, p) => {
  if (!inFP(x, z)) return;
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Glass pane connection props: connect only to neighbouring facade cells
const pane = (x, z) => ({
  north: edgeNb(x, z - 1) ? "true" : "false",
  south: edgeNb(x, z + 1) ? "true" : "false",
  east: edgeNb(x + 1, z) ? "true" : "false",
  west: edgeNb(x - 1, z) ? "true" : "false",
  waterlogged: "false",
});

// Street-facing side: minimum z row; entrance centred on it
const minZ = Math.min(...cells.map(c => c[1]));
const frontRow = cells.filter(c => c[1] === minZ);
const xc = Math.round(frontRow.reduce((s, c) => s + c[0], 0) / frontRow.length);

// Vieshow Cinema A16: 2 cinema/retail storeys (~5 blocks each), parapet to ~11 above ground
for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);
  const edge = isEdge(x, z);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Ground floor slab / base course
  put(x, gr, z, edge ? "polished_andesite" : "smooth_stone");

  // Storey 1 facade: shopfront with piers and glass
  if (edge) {
    const pier = (x + z) % 4 === 0;
    const dx = x - xc;
    const doorway = z === minZ && Math.abs(dx) <= 2;
    for (let y = gr + 1; y <= gr + 3; y++) {
      if (doorway) put(x, y, z, "glass");
      else if (pier) put(x, y, z, "white_concrete");
      else put(x, y, z, "glass_pane", pane(x, z));
    }
    // Lintel band
    put(x, gr + 4, z, "light_gray_concrete");
  }

  // Storey line between floors
  put(x, gr + 5, z, edge ? "light_gray_concrete" : "smooth_stone");

  // Storey 2 facade: ribbon windows with white mullions, spandrels
  if (edge) {
    const mullion = (x + z) % 4 === 0;
    put(x, gr + 6, z, "white_concrete");
    put(x, gr + 9, z, "white_concrete");
    for (let y = gr + 7; y <= gr + 8; y++) {
      if (mullion) put(x, y, z, "white_concrete");
      else put(x, y, z, "glass_pane", pane(x, z));
    }
    // Warm light behind some windows
    if (!mullion && (x * 3 + z * 5) % 13 === 0) {
      const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (const [ddx, ddz] of dirs) {
        const nx = x + ddx, nz = z + ddz;
        if (inFP(nx, nz) && !isEdge(nx, nz)) {
          put(nx, gr + 7, nz, "glowstone");
          break;
        }
      }
    }
  }

  // Roof slab (cornice course on the edge, roof surface inside)
  put(x, gr + 10, z, edge ? "white_concrete" : "gray_concrete");

  // Parapet
  if (edge) put(x, gr + 11, z, "white_concrete");

  // Roof plant boxes on interior cells
  if (!edge && x % 9 === 4 && z % 11 === 5) {
    put(x, gr + 11, z, "light_gray_concrete");
    put(x, gr + 12, z, "light_gray_concrete");
  }
}

// Street-side cinema sign board on storey 2 above the entrance
for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);
  if (z !== minZ || !isEdge(x, z)) continue;
  const dx = x - xc;
  if (Math.abs(dx) > 6) continue;
  put(x, gr + 6, z, "red_concrete");
  put(x, gr + 7, z, dx % 3 === 0 ? "sea_lantern" : "yellow_concrete");
  put(x, gr + 8, z, "red_concrete");
  put(x, gr + 9, z, "red_concrete");
}

// Entrance canopy with posts, on the street side
for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);
  const dx = x - xc;
  if (Math.abs(dx) > 3) continue;
  if (z === minZ) {
    put(x, gr + 4, z, "smooth_stone");
  } else if (z === minZ + 1) {
    put(x, gr + 4, z, "smooth_stone");
  } else if (z === minZ + 2) {
    put(x, gr + 4, z, "smooth_stone");
    if (Math.abs(dx) === 3) {
      for (let y = gr + 1; y <= gr + 3; y++) put(x, y, z, "smooth_quartz");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
