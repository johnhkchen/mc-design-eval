import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise 1960s-70s Taipei commercial block: two storeys over a shop-front
// ground floor, white-tiled concrete frame, stone string courses, red awning
// band, a parapet and one rooftop water tank.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542020182";
const W = 7, H = 23, D = 7;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  const gi = Math.round(gr);
  ground.set(`${x},${z}`, gi);
  if (gi < minG) minG = gi;
}

const b = minG;          // lowest ground under the footprint (y reference)
const R = b + 11;        // roof top, exclusive: ~11 blocks above lowest ground
const TOP = R - 1;       // top course of the parapet / roof slab

const has = (x, z) => ground.has(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Outward face of a perimeter cell, its position along that face, and the
// inward offset toward the interior. Null for interior cells.
function faceOf(x, z) {
  if (!has(x, z - 1)) return { face: "north", p: x, dx: 0, dz: 1 };
  if (!has(x, z + 1)) return { face: "south", p: x, dx: 0, dz: -1 };
  if (!has(x - 1, z)) return { face: "west", p: z, dx: 1, dz: 0 };
  if (!has(x + 1, z)) return { face: "east", p: z, dx: -1, dz: 0 };
  return null;
}

// Glass pane connection states that follow the wall they sit in.
function pane(face) {
  const alongX = face === "north" || face === "south";
  return {
    north: alongX ? "false" : "true",
    south: alongX ? "false" : "true",
    east: alongX ? "true" : "false",
    west: alongX ? "true" : "false",
    waterlogged: "false",
  };
}

function door(x, y, z, half) {
  put(x, y, z, "oak_door", {
    facing: "north",
    half,
    hinge: "left",
    open: "false",
    powered: "false",
  });
}

const lights = [];

for (const [x, z, grRaw] of cells) {
  const gi = Math.round(grRaw);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gi; y++) put(x, y, z, "stone_bricks");

  const f = faceOf(x, z);

  for (let y = gi; y <= TOP; y++) {
    const r = y - b;

    if (!f) {
      // Interior: floor slabs at ground and at the storey line, roof at top.
      if (y === gi) put(x, y, z, "smooth_stone");
      else if (r === 5) put(x, y, z, "smooth_stone");
      else if (y === TOP) put(x, y, z, "light_gray_concrete");
      continue;
    }

    // Exterior facade.
    if (y === TOP) {
      put(x, y, z, "smooth_stone");                 // parapet cap
      continue;
    }
    if (r === 0) {
      put(x, y, z, "smooth_stone");                 // base course
      continue;
    }
    if (r === 4) {
      put(x, y, z, "red_concrete");                 // shop awning band
      continue;
    }
    if (r === 5 || r === 9) {
      put(x, y, z, "smooth_stone");                 // string courses
      continue;
    }
    if (r >= 1 && r <= 3) {
      // Shop-front ground floor.
      if (f.face === "north" && f.p === 3 && r <= 2) {
        door(x, y, z, r === 1 ? "lower" : "upper");
        continue;
      }
      if (f.p % 3 === 0) put(x, y, z, "white_concrete");
      else put(x, y, z, "glass_pane", pane(f.face));
      continue;
    }
    if (r >= 6 && r <= 8) {
      // Upper storey windows between white concrete mullions.
      if (f.p % 3 === 0) put(x, y, z, "white_concrete");
      else put(x, y, z, "glass_pane", pane(f.face));
      if (r === 6 && f.p % 3 === 1 && ((x * 3 + z * 5) % 4 === 0)) {
        lights.push({ x, z, f });
      }
      continue;
    }
    put(x, y, z, "white_concrete");
  }
}

// Warm light behind selected upper windows, on the interior floor slab.
for (const { x, z, f } of lights) {
  const ix = x + f.dx, iz = z + f.dz;
  if (!has(ix, iz)) continue;
  if (faceOf(ix, iz)) continue;
  const gi = ground.get(`${ix},${iz}`);
  if (gi > b + 6) continue;
  put(ix, b + 6, iz, "glowstone");
}

// Rooftop water tank on the centre cell, if the footprint has it.
if (has(3, 3)) {
  const tankBase = R;
  put(3, tankBase, 3, "spruce_planks");
  put(3, tankBase + 1, 3, "spruce_planks");
  put(3, tankBase + 2, 3, "spruce_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
