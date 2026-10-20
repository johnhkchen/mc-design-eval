import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw537993156";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 24 x 19, roof about 11 blocks above the lowest ground.
// Reads as a low-rise 1980s-90s Taipei commercial block: pale tiled concrete,
// a shopfront ground storey, two storeys of window bands, a cornice parapet and a small plant room.
const W = 24, H = 23, D = 19;
const g = new Voxels([W, H, D]);

const gmap = new Map();
let L = Infinity;
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z, gr] of cells) {
  gmap.set(`${x},${z}`, gr);
  L = Math.min(L, gr);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

const has = (x, z) => gmap.has(`${x},${z}`);
const groundAt = (x, z) => gmap.get(`${x},${z}`);
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const exposed = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Door position: south face (max z), nearest the middle of the footprint.
const midX = Math.floor((minX + maxX) / 2);
let doorX = null;
for (const [x, z] of cells) {
  if (z !== maxZ) continue;
  if (doorX === null || Math.abs(x - midX) < Math.abs(doorX - midX)) doorX = x;
}

const roofTop = L + 10;   // roof deck
const parapetTop = L + 11;

for (const [x, z, gr] of cells) {
  const ex = exposed(x, z);
  const perim = ex.length > 0;
  const a = x + z;
  const corner = ex.length >= 2;
  const pillar = corner || a % 3 === 0;

  // Foundation fill from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Ground floor slab / base course.
  put(x, gr, z, perim ? "polished_andesite" : "smooth_stone");

  // Ground storey: shopfront glass between stone pillars, lintel at L+4.
  if (perim) {
    for (let y = gr + 1; y <= L + 4; y++) {
      if (y === L + 4) {
        put(x, y, z, "smooth_quartz");
      } else if (pillar) {
        put(x, y, z, "stone_bricks");
      } else {
        put(x, y, z, "glass");
      }
    }
  }

  // Storey line / floor slab at L+5 (perimeter string course).
  if (L + 5 >= gr) put(x, L + 5, z, perim ? "light_gray_concrete" : "smooth_quartz");

  // Upper storey: window band with sill (L+6) and lintel (L+9).
  if (perim) {
    for (let y = L + 6; y <= L + 9; y++) {
      if (y < gr) continue;
      const frame = y === L + 6 || y === L + 9;
      if (pillar) {
        put(x, y, z, "white_concrete");
      } else if (frame) {
        put(x, y, z, "smooth_quartz");
      } else {
        put(x, y, z, "glass_pane");
      }
    }

    // Warm light behind some glass: shroomlight on the interior floor, one cell in.
    if (!pillar && (x * 7 + z * 13) % 5 === 0) {
      const [odx, odz] = ex[0];
      const ix = x - odx, iz = z - odz;
      if (has(ix, iz) && exposed(ix, iz).length === 0 && L + 6 >= groundAt(ix, iz)) {
        put(ix, L + 6, iz, "shroomlight");
      }
    }
  }

  // Roof deck at L+10; perimeter becomes parapet wall with cap at L+11.
  if (roofTop >= gr) put(x, roofTop, z, perim ? "smooth_quartz" : "light_gray_concrete");
  if (perim) {
    put(x, parapetTop, z, "smooth_quartz_slab", { type: "top", waterlogged: "false" });
  }

  // Plant room on the roof, central cells only.
  if (!perim &&
      x >= minX + 6 && x <= maxX - 6 &&
      z >= minZ + 4 && z <= maxZ - 4) {
    put(x, parapetTop, z, "light_gray_concrete");
    put(x, parapetTop + 1, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Entrance on the south face: double door in the shopfront.
if (doorX !== null) {
  const gr = groundAt(doorX, maxZ);
  if (gr + 2 <= L + 3) {
    put(doorX, gr + 1, maxZ, "oak_door",
      { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(doorX, gr + 2, maxZ, "oak_door",
      { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
