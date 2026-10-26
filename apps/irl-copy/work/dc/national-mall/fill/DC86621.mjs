import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86621.cells.json`, "utf8"));

const W = 27, H = 32, D = 22;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const key = (x, z) => `${x},${z}`;
const occ = new Set(cells.map(([x, z]) => key(x, z)));
const inside = (x, z) => occ.has(key(x, z));
const perim = (x, z) => !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);
const corner = (x, z) => (!inside(x - 1, z) || !inside(x + 1, z)) && (!inside(x, z - 1) || !inside(x, z + 1));

const cx = cells.reduce((s, c) => s + c[0], 0) / cells.length;
const cz = cells.reduce((s, c) => s + c[1], 0) / cells.length;
const maxZ = Math.max(...cells.map(c => c[1]));

// Common storey grid: median ground, so all floor lines align across the building
const grounds = cells.map(c => c[2]).sort((a, b) => a - b);
const G = grounds[Math.floor(grounds.length / 2)];

// Quantise each cell's roof to whole storeys (4 blocks) off the common grid, at least 3 storeys
const topOf = new Map();
for (const [x, z, gr, rf0] of cells) {
  const q = G + 4 * Math.max(3, Math.round((rf0 - G) / 4));
  topOf.set(key(x, z), Math.min(q, H - 6));
}

// Entrance on the south face, nearest the centre line
const doorCands = cells.filter(c => c[1] === maxZ);
const doorCell = doorCands.reduce((best, c) => (Math.abs(c[0] - cx) < Math.abs(best[0] - cx) ? c : best), doorCands[0]);

for (const [x, z, gr] of cells) {
  const top = topOf.get(key(x, z));
  const per = perim(x, z);
  const cor = corner(x, z);

  // Foundation from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Floor slabs: the ground slab, then every storey line on the common grid
  put(x, gr, z, per ? "smooth_quartz" : "light_gray_concrete");
  for (let y = G; y < top - 1; y += 4) {
    if (y <= gr) continue;
    put(x, y, z, per ? "smooth_quartz" : "light_gray_concrete");
  }

  // Roof slab
  put(x, top - 1, z, per ? "stone_bricks" : "light_gray_concrete");

  if (per) {
    for (let y = gr + 1; y <= top - 2; y++) {
      const rel = ((y - G) % 4 + 4) % 4;
      if (rel === 0) continue; // storey line already placed
      const ground = (y - gr) < 4;
      const pier = cor || (x + z) % 3 === 0;

      if (ground) {
        put(x, y, z, pier ? "stone_bricks" : "light_blue_stained_glass_pane");
      } else if (pier) {
        put(x, y, z, "smooth_quartz");
      } else if (rel === 1) {
        put(x, y, z, "light_gray_concrete"); // spandrel below each window
      } else {
        put(x, y, z, "light_blue_stained_glass_pane");
      }

      // Warm lights just inside some upper-floor windows
      if (!ground && !pier && rel === 2 && ((x * 7 + z * 3 + Math.floor((y - G) / 4)) % 5 === 0)) {
        const inward = [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]]
          .find(([nx, nz]) => inside(nx, nz) && !perim(nx, nz));
        if (inward) put(inward[0], y, inward[1], "glowstone");
      }
    }

    // Cornice and parapet
    put(x, top - 2, z, "smooth_quartz");
    put(x, top - 1, z, "stone_bricks");
    put(x, top, z, "stone_bricks");
  }
}

// Entrance: double doors with a lantern above
{
  const [dx, dz, dgr] = doorCell;
  const dprops = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
  put(dx, dgr + 1, dz, "dark_oak_door", dprops("lower"));
  put(dx, dgr + 2, dz, "dark_oak_door", dprops("upper"));
  put(dx, dgr + 3, dz, "lantern", { hanging: "false", waterlogged: "false" });
}

// Roof plant in the central core, on the common roof tier
for (const [x, z] of cells) {
  if (perim(x, z)) continue;
  if (Math.abs(x - cx) <= 4 && Math.abs(z - cz) <= 4) {
    const top = topOf.get(key(x, z));
    put(x, top, z, "smooth_quartz");
    put(x, top + 1, z, "smooth_quartz");
    put(x, top + 2, z, "stone_bricks");
  }
}

g.save(`${DIR}/DC86621.nbt`);
