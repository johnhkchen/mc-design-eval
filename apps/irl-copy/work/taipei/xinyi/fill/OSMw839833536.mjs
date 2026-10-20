import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833536";
const W = 22, H = 23, D = 21;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground height
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const B = Math.min(...ground.values());          // lowest ground under the footprint
const TOP = B + 10;                               // top layer of cornice/roof deck (roof surface at B+11)
const cx = cells.reduce((s, c) => s + c[0], 0) / cells.length;
const cz = cells.reduce((s, c) => s + c[1], 0) / cells.length;

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Outward faces of a footprint cell (faces with no neighbour)
const outward = (x, z) => {
  const out = [];
  if (!has(x, z - 1)) out.push("north");
  if (!has(x, z + 1)) out.push("south");
  if (!has(x - 1, z)) out.push("west");
  if (!has(x + 1, z)) out.push("east");
  return out;
};

// Inward offset for a face (toward the building interior)
const inward = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };

// Materials: cream/white tiled office-commercial block, blue-tinted glazing, stone base
const WALL_PIER = "white_concrete";
const GLASS = "light_blue_stained_glass";
const BASE = "polished_granite";
const BAND = "smooth_quartz";
const CORNICE = "polished_andesite";
const FLOOR = "smooth_stone";
const FOUND = "stone_bricks";
const DECK = "light_gray_concrete";

// Pass 1: foundations, floors, floor bands, roof deck, cornice, facades
for (const [x, z, gr] of cells) {
  // foundation up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);
  // floor surface at ground level
  put(x, gr, z, FLOOR);
  // storey line slab across the whole footprint
  put(x, B + 5, z, BAND);
  // roof deck / cornice layer across the whole footprint
  put(x, TOP, z, DECK);

  const out = outward(x, z);
  if (out.length === 0) continue; // interior: air behind glass, slabs only

  const corner = out.length >= 2;
  put(x, gr, z, BASE);                 // base course on exterior cells
  put(x, TOP, z, CORNICE);             // cornice / parapet ring

  const alongX = out.includes("north") || out.includes("south");
  const i = alongX ? x : z;
  const pier = corner || i % 3 === 0;

  // ground storey (shopfront glazing with wider piers)
  for (let y = gr + 1; y <= B + 4; y++) {
    const groundPier = corner || i % 4 === 0;
    put(x, y, z, groundPier ? WALL_PIER : GLASS);
  }
  // upper storey (window grid)
  for (let y = B + 6; y <= B + 9; y++) {
    put(x, y, z, pier ? WALL_PIER : GLASS);
  }
}

// Pass 2: warm lights set just inside some windows (on the floor, not floating)
for (const [x, z, gr] of cells) {
  const out = outward(x, z);
  if (out.length !== 1) continue;
  const face = out[0];
  const i = (face === "north" || face === "south") ? x : z;
  const [dx, dz] = inward[face];
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz) || outward(ix, iz).length !== 0) continue;

  // ground storey light
  if (i % 8 === 2) put(ix, gr + 1, iz, "glowstone");
  // upper storey light, on the floor slab at B+5
  if (i % 6 === 1) put(ix, B + 6, iz, "shroomlight");
}

// Pass 3: entrance door on the south face, near the middle, on the ground storey
{
  const candidates = cells.filter(([x, z]) => {
    const out = outward(x, z);
    return out.length === 1 && out[0] === "south";
  });
  if (candidates.length) {
    candidates.sort((a, b) => Math.abs(a[0] - cx) - Math.abs(b[0] - cx));
    const [x, z, gr] = candidates[0];
    if (gr + 2 <= B + 4) {
      put(x, gr + 1, z, "dark_oak_door", {
        facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
      });
      put(x, gr + 2, z, "dark_oak_door", {
        facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
      });
      // small lantern-lit fascia above the door, inside the head of the opening
      put(x, gr + 3, z, "polished_andesite");
    }
  }
}

// Pass 4: roof plant on the deck, centred, in footprint cells only
for (const [x, z] of cells) {
  if (outward(x, z).length !== 0) continue;
  if (Math.abs(x - cx) <= 3 && Math.abs(z - cz) <= 3) {
    put(x, TOP + 1, z, DECK);
  }
  if (Math.abs(x - cx) <= 1 && Math.abs(z - cz) <= 1) {
    put(x, TOP + 2, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
