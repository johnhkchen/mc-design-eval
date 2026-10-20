import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. 15 x 19 footprint, roof about 11 blocks above lowest ground.
// Read as a two-storey mid-century-to-1990s Xinyi-fringe commercial block:
// white-tiled concrete frame, glazed shopfront at street level, a glazed upper
// storey, a stone cornice and parapet, grey roof plant. Two storeys of 5 blocks
// (with the 1-block roof and parapet) matches the lidar height.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538408122";
const W = 15, H = 23, D = 19;

const ROOF_Y = 11;   // roof deck
const FLOOR_Y = 5;   // storey line / upper floor slab
const TOP_Y = 10;    // top of upper storey wall (cornice band)
const PARAPET_Y = 12;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const groundMap = new Map();
for (const [x, z, gr] of cells) {
  groundMap.set(key(x, z), Math.max(0, Math.min(gr, 9)));
}
const inFp = (x, z) => groundMap.has(key(x, z));
const gAt = (x, z) => groundMap.get(key(x, z));

const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];
const isPerim = (x, z) => DIRS.some(([dx, dz]) => !inFp(x + dx, z + dz));
const outward = (x, z) => DIRS.find(([dx, dz]) => !inFp(x + dx, z + dz));

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Front = northern edge of the footprint (minimum z); entrance at its median x.
let minZ = Infinity;
for (const [, z] of cells) minZ = Math.min(minZ, z);
const frontXs = cells.filter(([, z]) => z === minZ).map(([x]) => x).sort((a, b) => a - b);
const doorX = frontXs[Math.floor(frontXs.length / 2)];

for (const [x, z] of cells) {
  const gr = gAt(x, z);
  const perim = isPerim(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Roof deck over every footprint cell (supported by walls or interior floor below).
  put(x, ROOF_Y, z, "light_gray_concrete");

  if (!perim) {
    // Interior: ground-floor slab, storey-2 slab. Air between (behind glass).
    put(x, gr, z, "smooth_stone");
    put(x, FLOOR_Y, z, "smooth_stone");
    continue;
  }

  // Perimeter wall, from ground to top of upper storey.
  for (let y = gr; y <= TOP_Y; y++) {
    const rel = x + z;
    let id;
    let p;
    if (y === TOP_Y) {
      id = "smooth_stone"; // cornice band
    } else if (y === FLOOR_Y) {
      id = "light_gray_concrete"; // storey line
    } else if (y === gr) {
      id = "smooth_stone"; // base course / plinth
    } else if (y < FLOOR_Y) {
      // Ground storey shopfront
      if (y === 4) {
        id = "light_gray_concrete"; // lintel
      } else {
        if (rel % 3 === 0) id = "smooth_quartz";
        else id = "light_blue_stained_glass";
      }
    } else {
      // Upper storey window grid (y 6..9)
      if (rel % 3 === 0) id = "white_concrete";
      else id = "light_blue_stained_glass";
    }
    put(x, y, z, id);
  }

  // Parapet course on the roof edge.
  put(x, PARAPET_Y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// Entrance on the front edge: double-height door at ground, canopy over it.
{
  const gr = gAt(doorX, minZ);
  if (gr <= 3) {
    put(doorX, gr, minZ, "oak_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false"
    });
    put(doorX, gr + 1, minZ, "oak_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false"
    });
    for (const dx of [-1, 0, 1]) {
      const cx = doorX + dx;
      if (inFp(cx, minZ)) {
        put(cx, 4, minZ, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
      }
    }
  }
}

// Warm light: shroomlight just inside some upper-storey windows.
for (const [x, z] of cells) {
  if (!isPerim(x, z)) continue;
  if ((x + z) % 5 !== 0) continue;
  const o = outward(x, z);
  if (!o) continue;
  const ix = x - o[0], iz = z - o[1];
  if (inFp(ix, iz) && !isPerim(ix, iz)) {
    put(ix, 7, iz, "shroomlight");
  }
}

// Roof plant: small grey boxes on interior roof.
for (const [x, z] of cells) {
  if (isPerim(x, z)) continue;
  if ((x * 7 + z * 3) % 11 !== 0) continue;
  put(x, PARAPET_Y, z, "light_gray_concrete");
  put(x, PARAPET_Y + 1, z, "gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
