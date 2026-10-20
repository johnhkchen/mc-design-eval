import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538459516";
const W = 20, H = 23, D = 17;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.round(gr));
const has = (x, z) => ground.has(key(x, z));

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

// Outward faces of a footprint cell (neighbour missing from footprint)
const missing = (x, z) =>
  Object.entries(DIRS)
    .filter(([, [dx, dz]]) => !has(x + dx, z + dz))
    .map(([n]) => n);

const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Pane connections depend on which wall the pane sits in
const paneFor = (face) =>
  face === "north" || face === "south"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const PANE = "light_blue_stained_glass_pane";

// Entrance: front (north-facing, z minimum) face cell nearest the centre line
const FRONT_X = 10;
let entrance = null;
for (const [x, z] of cells) {
  const o = missing(x, z);
  if (o.length === 1 && o[0] === "north") {
    if (!entrance || Math.abs(x - FRONT_X) < Math.abs(entrance[0] - FRONT_X)) entrance = [x, z];
  }
}
const entKey = entrance ? key(entrance[0], entrance[1]) : null;

for (const [x, z, gr] of cells) {
  // Foundation up to the cell's own ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  // Floor slabs per storey and roof slab
  put(x, gr, z, "smooth_stone");
  put(x, gr + 5, z, "smooth_stone");
  put(x, gr + 10, z, "light_gray_concrete");

  const outs = missing(x, z);

  // Interior: air behind glass, floor slabs only, plus one roof plant unit
  if (outs.length === 0) {
    if (x >= 13 && x <= 14 && z >= 4 && z <= 5) put(x, gr + 11, z, "iron_block");
    continue;
  }

  // Perimeter walls: quartz, two storeys of four wall courses each
  for (const y of [gr + 1, gr + 2, gr + 3, gr + 4, gr + 6, gr + 7, gr + 8, gr + 9]) {
    put(x, y, z, "quartz_block");
  }
  // Base course, storey line cornice and parapet
  put(x, gr + 1, z, "polished_granite");
  put(x, gr + 10, z, "smooth_stone");
  put(x, gr + 11, z, "quartz_block");

  // Corner pillars stay solid
  if (outs.length >= 2) continue;

  const face = outs[0];
  const [dx, dz] = DIRS[face];
  const along = face === "north" || face === "south" ? x : z;
  const isFront = face === "north";
  const pane = paneFor(face);

  // Storey 1 — shopfront on the front, punched windows elsewhere
  if (isFront) {
    for (const y of [gr + 1, gr + 2, gr + 3]) put(x, y, z, PANE, pane);
    put(x, gr + 4, z, "stone_bricks");
    if (key(x, z) === entKey) {
      put(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
    }
  } else if (along % 2 === 1) {
    for (const y of [gr + 2, gr + 3]) put(x, y, z, PANE, pane);
  }

  // Storey 2 windows
  if (along % 2 === 1) {
    for (const y of [gr + 7, gr + 8]) put(x, y, z, PANE, pane);
  }

  // Warm lights standing just inside some windows
  const ix = x - dx, iz = z - dz;
  if (has(ix, iz) && missing(ix, iz).length === 0 && ground.get(key(ix, iz)) === gr) {
    if (!isFront && along % 4 === 1) {
      put(ix, gr + 1, iz, "glowstone");
      put(ix, gr + 6, iz, "shroomlight");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
