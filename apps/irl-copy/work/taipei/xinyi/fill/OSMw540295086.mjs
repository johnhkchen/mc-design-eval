import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540295086.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540295086.nbt";

const W = 20, H = 23, D = 12;
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: key "x,z" -> ground y
const foot = new Map();
for (const [x, z, ground] of cells) foot.set(`${x},${z}`, Math.max(0, Math.min(ground | 0, H - 14)));
const has = (x, z) => foot.has(`${x},${z}`);

// Perimeter: any orthogonal neighbour outside the footprint
const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
// Corner: missing neighbours on both axes
const isCorner = (x, z) => (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));

// Street-facing entrance: middle cell of the lowest-z perimeter row
let minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of cells) { minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z); }
const southRow = cells.filter(([x, z]) => z === minZ).map(([x]) => x).sort((a, b) => a - b);
const doorX = southRow.length ? southRow[Math.floor(southRow.length / 2)] : -1;
const doorZ = minZ;

const set = (x, y, z, id, props) => { if (y >= 0 && y < H) g.set(x, y, z, id, props); };

for (const [x, z, gr0] of cells) {
  const gr = Math.max(0, Math.min(gr0 | 0, H - 14));
  const perim = isPerim(x, z);
  const corner = isCorner(x, z);

  // Foundation
  for (let y = 0; y < gr; y++) set(x, y, z, "stone_bricks");

  // Ground slab / base course
  set(x, gr, z, perim ? "polished_granite" : "smooth_stone");

  // Ground storey (shopfront): y gr+1..gr+4
  if (perim) {
    const pier = corner || (x + z) % 3 === 0;
    for (let y = gr + 1; y <= gr + 3; y++) {
      if (pier) set(x, y, z, "white_concrete");
      else set(x, y, z, "glass");
    }
    set(x, gr + 4, z, "red_terracotta"); // shop fascia band
  }

  // Storey line between floors
  set(x, gr + 5, z, "smooth_stone");

  // Upper storey: y gr+6..gr+9
  if (perim) {
    const pier = corner || (x + z) % 3 === 0;
    if (pier) {
      for (let y = gr + 6; y <= gr + 9; y++) set(x, y, z, "white_concrete");
    } else {
      set(x, gr + 6, z, "light_gray_concrete"); // sill
      set(x, gr + 7, z, "glass_pane", { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" });
      set(x, gr + 8, z, "glass_pane", { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" });
      set(x, gr + 9, z, "white_concrete"); // lintel
    }
  }

  // Roof slab and parapet
  set(x, gr + 10, z, perim ? "white_concrete" : "light_gray_concrete");

  // Warm light behind some upper windows
  if (!perim && (x * 7 + z * 3) % 17 === 0) set(x, gr + 7, z, "glowstone");
  if (!perim && (x * 5 + z * 2) % 23 === 0) set(x, gr + 8, z, "glowstone");

  // Rooftop equipment: AC units and a water tank
  if (!perim) {
    if ((x * 3 + z) % 11 === 0) set(x, gr + 11, z, "iron_block");
    if (x % 5 === 2 && z % 4 === 1 && gr + 13 < H) {
      set(x, gr + 11, z, "iron_block");
      set(x, gr + 12, z, "iron_block");
    }
  }
}

// Entrance door on the street face, with a shopfront canopy band above
if (has(doorX, doorZ)) {
  const gr = Math.max(0, Math.min(foot.get(`${doorX},${doorZ}`), H - 14));
  const facing = doorZ === minZ ? "north" : doorZ === maxZ ? "south" : "west";
  set(doorX, gr + 1, doorZ, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  set(doorX, gr + 2, doorZ, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  set(doorX, gr + 3, doorZ, "glass");
}

g.save(OUT);
