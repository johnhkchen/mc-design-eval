// "Imagine": a 14-storey, 1970s-style concrete office block on the Auckland CBD's volcanic-basalt base (dark stone
// course, shopfront at street level, tinted-glass grid above, white concrete piers and spandrels, quartz cornice,
// a plant screen on the core and rooftop units). Massing follows the lidar roof record, smoothed into tiers.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_954441048.cells.json", "utf8"));

const X = 37, Z = 28, Y = 71;
const G = Array.from({ length: Z }, () => Array(X).fill(0));   // ground under each cell
const H = Array.from({ length: Z }, () => Array(X).fill(-1));  // lidar roof height, -1 outside the footprint
for (const [x, z, g, r] of cells) { G[z][x] = g; H[z][x] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && H[z][x] >= 0;

// Smooth the lidar into clean tiers: the low NW wings become a 2-storey podium and a 5-storey wing, the stray
// 43-55 cells join the 14-storey slab, and a 57 joins the 58 plant core only where the core really surrounds it.
const T = Array.from({ length: Z }, () => Array(X).fill(-1));
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inside(x, z)) continue;
  let r = H[z][x];
  if (r <= 8) r = 8;
  else if (r === 12) r = 12;
  else if (r === 21) r = 20;
  else if (r === 43 || r === 51 || r === 53 || r === 55) r = 56;
  else if (r === 57) {
    let n58 = 0;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (inside(x + dx, z + dz) && H[z + dz][x + dx] === 58) n58++;
    r = n58 >= 3 ? 58 : 56;
  }
  T[z][x] = r;
}

// The faces a cell shows: outward (no footprint next to it) or down a step to a lower neighbour.
const faces = (x, z) => {
  const t = T[z][x], out = [];
  if (!inside(x, z + 1) || T[z + 1][x] < t) out.push("s");
  if (!inside(x, z - 1) || T[z - 1][x] < t) out.push("n");
  if (!inside(x + 1, z) || T[z][x + 1] < t) out.push("e");
  if (!inside(x - 1, z) || T[z][x - 1] < t) out.push("w");
  return out;
};
const INWARD = { s: [0, -1], n: [0, 1], e: [-1, 0], w: [1, 0] };

const g = new Voxels([X, Y, Z]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

// The entrance: on the south (+z) face, centred on the 14-17 bay of the lower edge.
const DOOR = [16, 27];
const CANOPY = [14, 15, 16, 17];
const paneNS = { north: "false", south: "false", east: "true", west: "true" };   // panes on a z-facing wall run along x
const paneEW = { north: "true", south: "true", east: "false", west: "false" };   // panes on an x-facing wall run along z

let glass = 0, lights = 0, windows = 0;
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inside(x, z)) continue;
  const t = T[z][x], gr = G[z][x], out = faces(x, z), facade = out.length > 0;
  const corner = out.length >= 2;
  const face = out[0];
  const idx = face === "s" || face === "n" ? x : z;
  const pier = corner || idx % 4 === 0;
  for (let y = 0; y < t; y++) {
    if (y < gr) { put(x, y, z, "deepslate_bricks"); continue; }                    // foundation, the basalt base
    const k = Math.floor(y / 4), row = y % 4;
    if (!facade) {
      if (y === t - 1) put(x, y, z, "light_gray_concrete");                      // roof deck over the enclosed interior
      else if (row === 0) put(x, y, z, "light_gray_concrete");                    // storey floor slab
      continue;
    }
    if (y === t - 1) { put(x, y, z, "quartz_block"); continue; }                  // cornice / parapet cap
    if (row === 0) { put(x, y, z, k === 0 ? "deepslate_bricks" : "gray_concrete"); continue; }  // base course / dark storey line
    if (k === 0) {                                                                 // commercial ground floor
      if (row === 3) {                                                             // lintel; over the entrance bay, a canopy slab
        const bay = face === "s" && z === DOOR[1] && CANOPY.includes(x);
        if (bay) put(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
        else put(x, y, z, "light_gray_concrete");
        continue;
      }
      if (x === DOOR[0] && z === DOOR[1] && face === "s") {                       // the door, two high
        put(x, y, z, "dark_oak_door", { facing: "south", half: row === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (pier) { put(x, y, z, "polished_blackstone_bricks"); continue; }
      put(x, y, z, "light_blue_stained_glass_pane", face === "s" || face === "n" ? paneNS : paneEW); glass++;
      continue;
    }
    if (row === 3) { put(x, y, z, "white_concrete"); continue; }                  // pale spandrel under each window band
    if (pier) { put(x, y, z, "white_concrete"); continue; }
    put(x, y, z, "light_blue_stained_glass_pane", face === "s" || face === "n" ? paneNS : paneEW); glass++;
    windows++;
    // a warm light in some windows, on the air side of the glass (the room behind it)
    if (row === 2 && (idx + 2 * k) % 5 === 0) {
      const [dx, dz] = INWARD[face];
      const ix = x + dx, iz = z + dz;
      if (inside(ix, iz) && faces(ix, iz).length === 0 && y >= G[iz][ix] && y < T[iz][ix] && (y % 4) !== 0) {
        put(ix, y, iz, "glowstone"); lights++;
      }
    }
  }
}

// Rooftop plant: the 58 core rises two blocks above the 56 slab (the lift and stair core), with louvres on its face
// and units on the slab roof. Units sit on the enclosed roof deck and only where no facade or step is near.
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inside(x, z) || T[z][x] !== 56 || faces(x, z).length) continue;
  if (x % 12 === 5 && z % 10 === 4) { put(x, 56, z, "iron_block"); put(x, 57, z, "iron_block"); }
}

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_954441048.nbt");
console.log(JSON.stringify({ blocks: stats.blocks, palette: stats.palette, glassPanes: glass, glowstones: lights, windows }));
