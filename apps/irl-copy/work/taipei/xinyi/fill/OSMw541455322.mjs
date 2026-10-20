import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const base = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541455322";
const cells = JSON.parse(readFileSync(`${base}.cells.json`, "utf8"));

// Footprint 10 x 23 (x 0..9, z 0..22), height 23 as specified.
const W = 10, H = 23, D = 23;
const g = new Voxels([W, H, D]);

// Two-storey white-tile concrete shophouse with red fascia band, tall shopfront
// glass, storey-two windows, smooth-stone cornice, parapet and rooftop water tank.
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const inside = (x, z) => ground.has(key(x, z));

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Outward normal of an edge cell (first missing neighbour), or null for interior cells.
const outward = (x, z) => {
  if (!inside(x + 1, z)) return [1, 0];
  if (!inside(x - 1, z)) return [-1, 0];
  if (!inside(x, z + 1)) return [0, 1];
  if (!inside(x, z - 1)) return [0, -1];
  return null;
};
const FACE = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

// Glass pane connection state from footprint neighbours.
const paneProps = (x, z) => ({
  north: String(inside(x, z - 1)),
  south: String(inside(x, z + 1)),
  east: String(inside(x + 1, z)),
  west: String(inside(x - 1, z)),
  waterlogged: "false",
});

// Entrance: edge cell on a long (east/west) face nearest the middle of the length.
let doorKey = null;
{
  let best = Infinity;
  for (const [x, z] of cells.map(c => [c[0], c[1]])) {
    const o = outward(x, z);
    if (!o || o[0] === 0) continue;
    const score = Math.abs(z - 11) * 10 + (x === 0 ? 0 : 1);
    if (score < best) { best = score; doorKey = key(x, z); }
  }
}

// Pass 1: solid foundation, floor slabs, roof deck, base course.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, "polished_andesite");        // base course / ground floor slab
  put(x, gr + 5, z, "light_gray_concrete");  // storey 2 floor slab
  put(x, gr + 10, z, "light_gray_concrete"); // roof deck
}

// Pass 2: facade on edge cells.
for (const [x, z, gr] of cells) {
  const o = outward(x, z);
  if (!o) continue;
  const facing = FACE[o.join(",")];
  const mull = (x + z) % 3 === 0;
  const isDoor = key(x, z) === doorKey;

  // Ground storey shopfront (rows gr+1..gr+3).
  if (isDoor) {
    put(x, gr + 1, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 3, z, "white_concrete");
  } else {
    for (let y = gr + 1; y <= gr + 3; y++) {
      if (mull) put(x, y, z, "white_concrete");
      else put(x, y, z, "cyan_stained_glass_pane", paneProps(x, z));
    }
  }
  // Red fascia / signband over shopfront.
  put(x, gr + 4, z, "red_concrete");

  // Storey 2 (rows gr+6..gr+9): spandrel, glazing, lintel.
  put(x, gr + 6, z, "white_concrete");
  for (let y = gr + 7; y <= gr + 8; y++) {
    if (mull) put(x, y, z, "white_concrete");
    else put(x, y, z, "light_blue_stained_glass_pane", paneProps(x, z));
  }
  put(x, gr + 9, z, "white_concrete");

  // Warm light behind some storey-2 glass, placed in the interior air gap.
  if (!mull && (x * 3 + z * 5) % 7 === 0) {
    const ix = x - o[0], iz = z - o[1];
    if (inside(ix, iz) && !outward(ix, iz)) {
      put(ix, gr + 7, iz, "glowstone");
    }
  }

  // Cornice and parapet (roof top = gr + 11).
  put(x, gr + 10, z, "smooth_stone");
  put(x, gr + 11, z, "white_concrete");
}

// Pass 3: rooftop water tank on interior roof cells (x 6..8, z 14..16).
for (let x = 6; x <= 8; x++) {
  for (let z = 14; z <= 16; z++) {
    if (!inside(x, z)) continue;
    const gr = ground.get(key(x, z));
    put(x, gr + 11, z, "iron_block");
    put(x, gr + 12, z, "iron_block");
  }
}

g.save(`${base}.nbt`);
