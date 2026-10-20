import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// OSMw539951877: no record. Read as a 2-storey, flat-roofed Taipei commercial block of the
// 1980s-90s: stone plinth, white-tiled concrete frame, tinted glass bays, shopfront ground floor,
// a cornice-like parapet and rooftop plant. Roof sits about 11 blocks above the lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${DIR}/OSMw539951877.cells.json`, "utf8"));

const W = 26, H = 23, D = 26;
const g = new Voxels([W, H, D]);

const gmap = new Map();
for (const [x, z, gr] of cells) gmap.set(`${x},${z}`, gr);
const has = (x, z) => gmap.has(`${x},${z}`);
const groundAt = (x, z) => gmap.get(`${x},${z}`);

const put = (x, y, z, block, props) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props === undefined) g.set(x, y, z, block);
  else g.set(x, y, z, block, props);
};

// Which sides of a cell face outside the footprint
const faces = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
};

// Entrance on the south (z+) street face, at the median x of that face
const sx = cells.filter(([x, z]) => !has(x, z + 1)).map(c => c[0]).sort((a, b) => a - b);
const entranceX = sx.length ? sx[Math.floor(sx.length / 2)] : -1;

const INNER = { S: [0, -1], N: [0, 1], E: [-1, 0], W: [1, 0] };

for (const [x, z, gr] of cells) {
  const base = Math.max(0, Math.min(gr, 10)); // keeps roof and plant inside height 23

  // Foundation below the ground cell
  for (let y = 0; y < base; y++) put(x, y, z, "stone_bricks");

  const f = faces(x, z);
  const perim = f.length > 0;

  // Plinth / ground floor slab
  put(x, base, z, perim ? "polished_granite" : "smooth_stone");
  // Second-floor slab (spandrel on perimeter)
  put(x, base + 5, z, perim ? "white_concrete" : "smooth_quartz");
  // Roof deck / parapet cap
  put(x, base + 10, z, perim ? "smooth_quartz" : "light_gray_concrete");

  if (!perim) {
    // Rooftop chillers and a plant room in the middle of the roof
    const onRoof = (x * 5 + z * 7) % 13 === 0 && x >= 3 && x <= 22 && z >= 3 && z <= 22;
    if (onRoof) put(x, base + 11, z, "iron_block");
    if (x >= 9 && x <= 16 && z >= 9 && z <= 16) {
      put(x, base + 11, z, "light_gray_concrete");
      put(x, base + 12, z, "light_gray_concrete");
    }
    continue;
  }

  // Facade cell: choose the street-facing side (south, then north, east, west)
  const face = f.includes("S") ? "S" : f.includes("N") ? "N" : f.includes("E") ? "E" : "W";
  const idx = (face === "S" || face === "N") ? x : z;
  const inner = INNER[face];
  const corner = f.length >= 2;
  const pillar = corner || idx % 3 === 0;

  // Parapet cap
  put(x, base + 10, z, "smooth_quartz");

  for (let rel = 1; rel <= 9; rel++) {
    const y = base + rel;
    let block;
    if (rel === 4 || rel === 5 || rel === 9) block = "white_concrete";      // fascia / spandrels
    else block = "light_blue_stained_glass";                                // glazing
    if (pillar) block = "quartz_pillar";                                    // mullions and corners

    // Entrance on the south face
    if (face === "S" && x === entranceX) {
      if (rel === 1) { put(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
      if (rel === 2) { put(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      if (rel === 3) { put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" }); continue; }
      if (rel === 4) { put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); continue; }
    }

    put(x, y, z, block);
  }

  // Warm light behind some second-floor glazing
  if (!corner && idx % 3 === 2) {
    const ix = x + inner[0], iz = z + inner[1];
    if (has(ix, iz) && groundAt(ix, iz) === gr && faces(ix, iz).length === 0) {
      put(ix, base + 7, iz, "glowstone");
    }
  }
}

g.save(`${DIR}/OSMw539951877.nbt`);
