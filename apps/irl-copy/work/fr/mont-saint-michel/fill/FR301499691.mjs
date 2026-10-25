import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mont-Saint-Michel, FR301499691: a 4-storey commercial block on the walled village.
// Lidar roof (~22 blocks) sets the massing; storeys are 5 blocks on one common datum.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499691";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 12, H = 34, D = 9;
const g = new Voxels([W, H, D]);

const gmap = new Map(cells.map((c) => [`${c[0]},${c[1]}`, c]));
const has = (x, z) => gmap.has(`${x},${z}`);

// One flat roof tier and one storey datum for the whole block.
const meanRoof = cells.reduce((a, c) => a + c[3], 0) / cells.length;
const T = Math.min(H - 1, Math.max(12, Math.round(meanRoof)));
const B = Math.min(...cells.map((c) => c[2]));
const maxZ = Math.max(...cells.map((c) => c[1]));
const minZ = Math.min(...cells.map((c) => c[1]));
const frontXs = cells.filter((c) => c[1] === maxZ).map((c) => c[0]).sort((a, b) => a - b);
const doorX = frontXs[Math.floor(frontXs.length / 2)];

const STOREY = 5;
const WALL = "calcite";   // render-like pale wall
const BAND = "stone_bricks";
const FLOOR = "smooth_stone";

for (const [x, z, gr] of cells) {
  // Foundation to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, BAND);

  const west = !has(x - 1, z), east = !has(x + 1, z);
  const north = !has(x, z - 1), south = !has(x, z + 1);
  const edge = west || east || north || south;
  const front = south;               // street face (+z)

  for (let y = gr; y <= T - 2; y++) {
    const s = Math.min(3, Math.floor((y - B) / STOREY));
    const b = B + STOREY * s;
    const rel = y - b;

    if (!edge) {
      // Interior: floor slabs and the air gap behind the glass.
      if (y === gr || (rel === 0 && s >= 1)) g.set(x, y, z, FLOOR);
      continue;
    }

    // Bands: plinth course on the ground storey, string courses and lintels above.
    if (rel === 0 || rel >= 4 || (s === 0 && y === gr)) {
      g.set(x, y, z, BAND);
      continue;
    }

    // Window zone (rel 1..3). Piers spaced along each facade.
    const along = front || north ? x : z;   // index along the facade
    const pier = along % 3 === 0;

    if (front && s === 0) {
      // Shopfront with a central door; glazing elsewhere.
      if (x === doorX && rel === 1) g.set(x, y, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      else if (x === doorX && rel === 2) g.set(x, y, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      else if (pier) g.set(x, y, z, WALL);
      else g.set(x, y, z, "glass");
    } else {
      if (pier) g.set(x, y, z, WALL);
      else g.set(x, y, z, "glass_pane");
    }

    // Warm light behind some upper-floor glass (interior cell, rel 2 only).
    if (rel === 2 && s >= 1 && !pier && has(x, z - 1) && !(front && s === 0)) {
      const li = !has(x - 1, z) ? null : x;
      if (li !== null && x % 4 === 1 && has(x, z - 1)) g.set(x, y, z - 1, "glowstone");
    }
  }

  // Parapet: coping slab on the edge, roof deck inside.
  if (edge) g.set(x, T - 1, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
  else g.set(x, T - 1, z, FLOOR);
}

g.save(`${DIR}/${ID}.nbt`);
