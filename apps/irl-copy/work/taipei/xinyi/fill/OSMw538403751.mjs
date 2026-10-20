import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538403751";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 18, H = 23, D = 17;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground (rounded)
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => G.has(`${x},${z}`);

const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Outward faces of a footprint cell (directions with no neighbour)
function faces(x, z) {
  const out = [];
  if (!has(x, z - 1)) out.push([0, -1]);
  if (!has(x, z + 1)) out.push([0, 1]);
  if (!has(x - 1, z)) out.push([-1, 0]);
  if (!has(x + 1, z)) out.push([1, 0]);
  return out;
}

const FACING = { "0,-1": "north", "0,1": "south", "-1,0": "west", "1,0": "east" };

// Entrance: on the street (north, low-z) face, cell nearest the middle
let doorKey = null;
{
  let best = Infinity;
  for (const [x, z] of [...G.keys()].map(k => k.split(",").map(Number))) {
    const f = faces(x, z);
    if (f.length === 1 && f[0][0] === 0 && f[0][1] === -1) {
      const d = Math.abs(x - 8);
      if (d < best) { best = d; doorKey = `${x},${z}`; }
    }
  }
}

for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);

  // Foundation from y 0 up to the cell's ground
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");

  // Floor slabs: ground/upper boundary and roof deck
  put(x, gr + 5, z, "smooth_stone");
  put(x, gr + 10, z, "smooth_stone");

  const out = faces(x, z);
  if (out.length > 0) {
    const [ox, oz] = out[0];
    const corner = out.length >= 2;
    const t = ox !== 0 ? z : x;          // position along the face
    const pier = corner || t % 3 === 0;  // mullion / pier every third cell
    const inX = x - ox, inZ = z - oz;    // interior neighbour direction
    const inside = has(inX, inZ);

    // Base course
    put(x, gr + 1, z, "polished_andesite");

    // Ground storey: shopfront glass with piers, fascia above
    const isDoor = `${x},${z}` === doorKey;
    if (isDoor) {
      const facing = FACING[`${ox},${oz}`];
      put(x, gr + 2, z, "iron_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 3, z, "iron_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
    } else {
      for (const y of [gr + 2, gr + 3]) {
        put(x, y, z, pier ? "white_concrete" : "light_blue_stained_glass");
      }
    }
    put(x, gr + 4, z, "light_gray_concrete");

    // Upper storey: spandrels top and bottom, panes between piers
    put(x, gr + 6, z, "white_concrete");
    put(x, gr + 9, z, "white_concrete");
    for (const y of [gr + 7, gr + 8]) {
      put(x, y, z, pier ? "white_concrete" : "light_blue_stained_glass_pane");
    }

    // Parapet
    put(x, gr + 11, z, "white_concrete");

    // Warm light behind some windows (air gap inside)
    if (!pier && !isDoor && (t % 6 === 1) && inside) {
      put(inX, gr + 3, inZ, "glowstone");
      put(inX, gr + 8, inZ, "glowstone");
    }
  } else {
    // Interior cell: only slabs (already placed). Roof equipment below.
    const cx = 8, cz = 8;
    const dx = Math.abs(x - cx), dz = Math.abs(z - cz);
    if (dx <= 2 && dz <= 2) {
      // Solid penthouse core with roof slab
      put(x, gr + 11, z, "light_gray_concrete");
      put(x, gr + 12, z, "light_gray_concrete");
      put(x, gr + 13, z, "smooth_stone");
    } else if (x % 5 === 2 && z % 4 === 1) {
      // Rooftop AC / mechanical units
      put(x, gr + 11, z, "iron_block");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
