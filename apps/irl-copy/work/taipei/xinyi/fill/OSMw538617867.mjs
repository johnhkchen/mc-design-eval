import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Xinyi low-rise commercial block, c. 1980s-90s: cream quartz-tile piers, glazed
// shopfront at street level, a two-storey upper band with ribbon windows, and a
// flat parapet roof with plant boxes. Roof sits ~11 blocks above the lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538617867";
const W = 22, H = 23, D = 11;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const groundAt = (x, z) => ground.get(`${x},${z}`);
const minG = Math.min(...ground.values());
const TOP = minG + 10;          // top of parapet course
const ROOF = TOP + 1;           // first free block above the roof deck

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Outward facing of an edge cell (null for interior cells).
const DIRS = {
  north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0],
};
function outward(x, z) {
  if (!has(x, z - 1)) return "north";
  if (!has(x, z + 1)) return "south";
  if (!has(x - 1, z)) return "west";
  if (!has(x + 1, z)) return "east";
  return null;
}
function missingCount(x, z) {
  let n = 0;
  if (!has(x, z - 1)) n++;
  if (!has(x, z + 1)) n++;
  if (!has(x - 1, z)) n++;
  if (!has(x + 1, z)) n++;
  return n;
}

const PANE_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Pass 1: foundations, floors, roof deck and the outer walls.
for (const [x, z, gr] of cells) {
  // Solid foundation up to this cell's own ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  const out = outward(x, z);

  if (!out) {
    // Interior cell: floor slab at ground, mid-storey slab, roof deck.
    put(x, gr, z, "stone_bricks");
    if (minG + 5 >= gr) put(x, minG + 5, z, "smooth_quartz");
    if (TOP >= gr) put(x, TOP, z, "light_gray_concrete");
    continue;
  }

  const corner = missingCount(x, z) >= 2;
  const idx = (out === "north" || out === "south") ? x : z;
  const pier = corner || idx % 3 === 0;
  const isDoor = out === "south" && x === 10;
  const paneProps = (out === "north" || out === "south") ? PANE_NS : PANE_EW;

  for (let y = gr; y <= TOP; y++) {
    const rel = y - minG;
    let b = "smooth_quartz";
    let p;

    if (rel === 0) {
      b = "stone_bricks";                             // base course
    } else if (rel <= 3) {                            // shopfront
      if (isDoor && rel === 1) {
        b = "dark_oak_door";
        p = { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" };
      } else if (isDoor && rel === 2) {
        b = "dark_oak_door";
        p = { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" };
      } else if (pier) {
        b = "smooth_quartz";
      } else {
        b = "glass";                                  // glazed shopfront / transom
      }
    } else if (rel === 4) {                           // fascia band
      b = pier ? "smooth_quartz" : "gray_concrete";
    } else if (rel === 5) {                           // storey line
      b = "smooth_quartz_slab";
      p = { type: "bottom", waterlogged: "false" };
    } else if (rel <= 8) {                            // upper storey ribbon windows
      if (pier) {
        b = "smooth_quartz";
      } else {
        b = "glass_pane";
        p = paneProps;
      }
    } else if (rel === 9) {                           // spandrel
      b = "smooth_quartz";
    } else {                                          // rel 10: parapet cap
      b = "smooth_quartz";
    }

    if (p) put(x, y, z, b, p);
    else put(x, y, z, b);
  }

  // Ground floor and interior floor under the shopfront.
  if (gr <= minG + 5 && !isDoor) {
    // nothing extra: shopfront glass sits directly on the foundation
  }
}

// Pass 2: warm light behind some upper windows, and roof plant.
for (const [x, z, gr] of cells) {
  const out = outward(x, z);
  if (!out) continue;
  if (missingCount(x, z) >= 2) continue;
  const idx = (out === "north" || out === "south") ? x : z;
  if (idx % 3 === 0) continue;
  if (idx % 6 !== 4) continue;
  const [vx, vz] = DIRS[out];
  const ix = x - vx, iz = z - vz;
  if (!has(ix, iz)) continue;
  if (outward(ix, iz) !== null) continue;
  if (groundAt(ix, iz) > minG + 7) continue;
  put(ix, minG + 7, iz, "glowstone");
}

for (const [x, z, gr] of cells) {
  if (outward(x, z) !== null) continue;
  if (gr > TOP) continue;
  if (x % 7 === 3 && z % 4 === 2) {
    put(x, ROOF, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
