import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw142113379";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 18, H = 23, D = 12;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Sides: [dx, dz, facing]; a side is exterior when the neighbour is outside the footprint
const SIDES = [[0, -1, "north"], [0, 1, "south"], [-1, 0, "west"], [1, 0, "east"]];
const missing = (x, z) => SIDES.filter(([dx, dz]) => !has(x + dx, z + dz));

// Entrance: middle cell of the longest straight (non-corner) facade
const faceCells = { north: [], south: [], west: [], east: [] };
for (const [x, z] of cells) {
  const ms = missing(x, z);
  if (ms.length !== 1) continue;
  const [, , face] = ms[0];
  const idx = face === "north" || face === "south" ? x : z;
  faceCells[face].push({ idx, x, z });
}
let entranceFace = null, entranceKey = null;
{
  let best = -1;
  for (const f of Object.keys(faceCells)) {
    if (faceCells[f].length > best) { best = faceCells[f].length; entranceFace = f; }
  }
  if (best > 0) {
    const sorted = faceCells[entranceFace].slice().sort((a, b) => a.idx - b.idx);
    const mid = sorted[Math.floor(sorted.length / 2)];
    entranceKey = `${mid.x},${mid.z}`;
  }
}

const doorProps = (facing, half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });

for (const [x, z, gr] of cells) {
  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  // Ground floor, first-floor slab, roof slab
  put(x, gr, z, "smooth_stone");
  put(x, gr + 5, z, "light_gray_concrete");
  put(x, gr + 10, z, "light_gray_concrete");

  const ms = missing(x, z);
  if (ms.length === 0) {
    // Interior roof plant (AC units) on the flat roof
    if ((x * 5 + z * 3) % 13 === 0 && x > 2 && x < 15 && z > 2 && z < 9) {
      put(x, gr + 11, z, "light_gray_concrete");
    }
    continue;
  }

  const corner = ms.length >= 2;
  const [, , face] = ms[0];
  const i = face === "north" || face === "south" ? x : z;
  const pier = corner || i % 3 === 0;
  const isEntrance = !corner && `${x},${z}` === entranceKey && ms[0][2] === entranceFace;

  // Entrance: double door, hanging lantern, red awning
  if (isEntrance) {
    put(x, gr + 1, z, "dark_oak_door", doorProps(face, "lower"));
    put(x, gr + 2, z, "dark_oak_door", doorProps(face, "upper"));
    put(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
    put(x, gr + 4, z, "red_terracotta");
  }

  for (let y = gr + 1; y <= gr + 9; y++) {
    if (isEntrance && y <= gr + 4) continue;

    if (y === gr + 5) { put(x, y, z, "smooth_stone"); continue; }          // storey belt
    if (y === gr + 9) { put(x, y, z, "white_concrete"); continue; }        // upper header

    if (y <= gr + 4) {
      // Ground storey shopfront
      if (y === gr + 1) put(x, y, z, "polished_granite");                  // plinth
      else if (y === gr + 4) put(x, y, z, "white_concrete");               // fascia
      else put(x, y, z, pier ? "white_concrete" : "light_blue_stained_glass_pane");
      continue;
    }

    // Upper storeys: sill slab at the bottom of each window, lit windows at dusk
    if (pier) {
      put(x, y, z, "white_concrete");
    } else if (y === gr + 6) {
      put(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    } else if (y === gr + 7 && (i * 5 + z * 2) % 9 === 0) {
      put(x, y, z, "shroomlight");
    } else {
      put(x, y, z, "light_blue_stained_glass_pane");
    }
  }

  // Parapet with a coping course on the facade ring
  put(x, gr + 11, z, "white_concrete");
  put(x, gr + 12, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
