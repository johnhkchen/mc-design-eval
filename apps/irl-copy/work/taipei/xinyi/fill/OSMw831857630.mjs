import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw831857630.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw831857630.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 22, H = 23, D = 18;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground
const gmap = new Map();
for (const [x, z, gr] of cells) gmap.set(`${x},${z}`, gr);
const inside = (x, z) => gmap.has(`${x},${z}`);
const edgeX = (x, z) => !inside(x - 1, z) || !inside(x + 1, z);
const edgeZ = (x, z) => !inside(x, z - 1) || !inside(x, z + 1);
const perimeter = (x, z) => inside(x, z) && (edgeX(x, z) || edgeZ(x, z));

// Lowest ground sets the datum; roof sits about 11 blocks above it
const base = Math.min(...cells.map(c => c[2]));
const xs = cells.map(c => c[0]), zs = cells.map(c => c[1]);
const xmin = Math.min(...xs), xmax = Math.max(...xs);
const zmin = Math.min(...zs);

// Levels relative to base
const L = {
  shopTop: base + 3,   // last shopfront glass row
  lintel: base + 4,    // ground-floor head band
  slab2: base + 5,     // storey 2 floor line
  winLo: base + 6,
  winHi: base + 8,
  spandrel: base + 9,
  cornice: base + 10,  // roof row / cornice
  parapet: base + 11,  // top of parapet and AC units
};

// Entrance: front (min z) perimeter cell nearest the middle
const xmid = Math.floor((xmin + xmax) / 2);
let doorX = null;
for (const [x, z] of cells) {
  if (z === zmin && perimeter(x, z)) {
    if (doorX === null || Math.abs(x - xmid) < Math.abs(doorX - xmid)) doorX = x;
  }
}

// Wall material for a perimeter cell at height y
function wallAt(x, z, y) {
  const pier = (edgeX(x, z) && edgeZ(x, z)) || (x + z) % 3 === 0;
  if (y === L.cornice) return "light_gray_concrete";
  if (y >= L.parapet) return "white_concrete";
  if (y === L.spandrel || y === L.slab2 || y === L.lintel) return "light_gray_concrete";
  if (y >= L.winLo && y <= L.winHi) return pier ? "white_concrete" : "light_blue_stained_glass";
  // ground floor shopfront
  return pier ? "stone_bricks" : "light_blue_stained_glass";
}

for (const [x, z, gr] of cells) {
  const per = perimeter(x, z);

  // 1. Foundation: solid from 0 up to this cell's ground
  for (let y = 0; y < gr; y++) {
    g.set(x, y, z, per ? "stone_bricks" : "stone");
  }

  // 2. Ground surface floor (interior ground floor slab)
  if (gr < H) g.set(x, gr, z, "smooth_stone");

  // 3. Storey-2 floor slab across the whole footprint
  if (L.slab2 >= gr) g.set(x, L.slab2, z, "light_gray_concrete");

  // 4. Roof slab / cornice row across the footprint
  if (L.cornice >= gr) {
    g.set(x, L.cornice, z, per ? "light_gray_concrete" : "smooth_quartz");
  }

  // 5. Perimeter walls from ground up to the cornice, then parapet
  if (per) {
    for (let y = gr; y <= L.parapet; y++) {
      if (y > L.cornice && y < L.parapet) continue;
      g.set(x, y, z, wallAt(x, z, y));
    }
  }

  // 6. Rooftop AC units on interior cells
  if (!per && L.parapet >= gr && ((x * 7 + z * 3) % 9 === 0)) {
    g.set(x, L.parapet, z, "light_gray_concrete");
  }
}

// 7. Entrance doors on the front, with a hanging lantern above
if (doorX !== null) {
  const dg = gmap.get(`${doorX},${zmin}`);
  g.set(doorX, dg, zmin, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(doorX, dg + 1, zmin, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  if (dg + 2 <= L.shopTop) {
    g.set(doorX, dg + 2, zmin, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// 8. Warm light: glowstone behind some upper-storey windows
for (const [x, z] of cells) {
  if (!perimeter(x, z)) continue;
  const pier = (edgeX(x, z) && edgeZ(x, z)) || (x + z) % 3 === 0;
  if (pier || (x * 3 + z * 5) % 4 !== 0) continue;
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (const [dx, dz] of dirs) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && !perimeter(nx, nz)) {
      g.set(nx, L.winLo + 1, nz, "glowstone");
      break;
    }
  }
}

g.save(OUT);
