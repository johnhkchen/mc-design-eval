import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE111-0355-13F";
const W = 25, H = 23, D = 11;

// Footprint: [x, z, ground] per cell
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = raw.map(c => (Array.isArray(c) ? c : [c.x, c.z, c.ground]));

const key = (x, z) => `${x},${z}`;
const groundMap = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  groundMap.set(key(x, z), gr);
  minG = Math.min(minG, gr);
}
const has = (x, z) => groundMap.has(key(x, z));
const rel = (x, z) => groundMap.get(key(x, z)) - minG;

const g = new Voxels([W, H, D]);
const inBounds = (x, y, z) => x >= 0 && y >= 0 && z >= 0 && x < W && y < H && z < D;
const put = (x, y, z, block, props) => {
  if (!inBounds(x, y, z)) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// Entrance: median x of the front (north, z-min) edge
const frontXs = cells
  .filter(([x, z]) => !has(x, z - 1))
  .map(([x]) => x)
  .sort((a, b) => a - b);
const doorX = frontXs.length ? frontXs[Math.floor(frontXs.length / 2)] : -1;
const doorZ = frontXs.length ? cells.find(([x, z]) => x === doorX && !has(x, z - 1))[1] : -1;

const paneList = [];
const paneSet = new Set();
const pk = (x, y, z) => `${x},${y},${z}`;

for (const [x, z] of cells) {
  const r = rel(x, z);
  const nN = has(x, z - 1), nS = has(x, z + 1), nW = has(x - 1, z), nE = has(x + 1, z);
  const boundary = !(nN && nS && nW && nE);
  const zFace = !nN || !nS;   // exposed on a north/south face: bays by x
  const xFace = !nW || !nE;   // exposed on an east/west face: bays by z
  const corner = zFace && xFace;
  const front = !nN;

  // Foundation from y 0 up to ground
  for (let y = 0; y < r; y++) put(x, y, z, "stone_bricks");
  // Ground floor slab (base course)
  put(x, r, z, "smooth_stone");
  // Storey slab between floors
  put(x, r + 5, z, "smooth_stone");
  // Roof slab
  put(x, r + 10, z, "smooth_quartz");

  if (boundary) {
    const idx = zFace ? x : z;
    const pillar = corner || idx % 4 === 0;

    for (const base of [r + 1, r + 6]) {
      const isGround = base === r + 1;
      for (let k = 0; k < 4; k++) {
        const y = base + k;
        if (k === 3) {
          // spandrel
          put(x, y, z, "white_concrete");
          continue;
        }
        if (pillar) {
          put(x, y, z, "light_gray_concrete");
          continue;
        }
        // Entrance door cells are handled below
        if (isGround && front && x === doorX && z === doorZ) continue;

        // Warm light: a few upper-floor windows on the street face and
        // a few shopfront panes lit from behind
        if (!isGround && front && x % 6 === 3) {
          put(x, y, z, "shroomlight");
        } else if (isGround && front && x % 8 === 5 && k === 1) {
          put(x, y, z, "glowstone");
        } else {
          paneList.push([x, y, z]);
          paneSet.add(pk(x, y, z));
        }
      }
    }

    // Entrance: stone surround, dark door, lintel band
    if (front && z === doorZ && Math.abs(x - doorX) <= 1) {
      if (x === doorX) {
        put(x, r + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        put(x, r + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      } else {
        // jambs beside the door
        put(x, r + 1, z, "white_concrete");
        put(x, r + 2, z, "white_concrete");
      }
      // lintel over the entrance
      put(x, r + 3, z, "black_concrete");
    }

    // Parapet
    put(x, r + 11, z, "white_concrete");
  }

  // Roof equipment in the deep interior
  if (x >= 16 && x <= 20 && z >= 3 && z <= 7) {
    put(x, r + 11, z, "light_gray_concrete");
    if (x >= 17 && x <= 19 && z >= 4 && z <= 6) {
      put(x, r + 12, z, "smooth_stone");
    }
  }
}

// Glass pane connections
for (const [x, y, z] of paneList) {
  const props = {
    north: paneSet.has(pk(x, y, z - 1)) ? "true" : "false",
    south: paneSet.has(pk(x, y, z + 1)) ? "true" : "false",
    east: paneSet.has(pk(x + 1, y, z)) ? "true" : "false",
    west: paneSet.has(pk(x - 1, y, z)) ? "true" : "false",
    waterlogged: "false",
  };
  put(x, y, z, "glass_pane", props);
}

g.save(`${DIR}/${ID}.nbt`);
