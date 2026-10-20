import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540888717";
const W = 14, H = 23, D = 16;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint lookup: key "x,z" -> ground (normalised so the lowest ground is y 0)
const rawMin = Math.min(...cells.map(([, , gr]) => Math.round(gr)));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.max(0, Math.round(gr) - rawMin));
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const g = new Voxels([W, H, D]);

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Exposed exterior faces of a footprint cell
function faces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  return f;
}
const OUT = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const OPP = { north: "south", south: "north", west: "east", east: "west" };

// Glass panes: connect along the wall to neighbouring wall cells
function paneProps(x, z, face) {
  const p = { north: "false", east: "false", south: "false", west: "false", waterlogged: "false" };
  if (face === "north" || face === "south") {
    if (has(x - 1, z)) p.west = "true";
    if (has(x + 1, z)) p.east = "true";
  } else {
    if (has(x, z - 1)) p.north = "true";
    if (has(x, z + 1)) p.south = "true";
  }
  return p;
}

// Palette: beige-white tiled tower frames, quartz pillars, blue-tinted glazing, stone base
const PANE_UPPER = "light_blue_stained_glass_pane";
const PANE_SHOP = "cyan_stained_glass_pane";

for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  const gr = gAt(x, z);

  // Foundation up to the cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  // Floor slabs at ground, ground+4, ground+8 and roof deck at ground+9
  const fs = faces(x, z);
  const edge = fs.length > 0;
  const corner = fs.length >= 2;

  put(x, gr, z, edge ? "stone_bricks" : "light_gray_concrete");
  put(x, gr + 4, z, edge ? "stone_bricks" : "light_gray_concrete");
  put(x, gr + 8, z, edge ? "smooth_quartz" : "light_gray_concrete");
  put(x, gr + 9, z, "light_gray_concrete");

  if (!edge) {
    // Rooftop air-conditioning plant on a sparse grid of interior cells
    if (x % 4 === 2 && z % 4 === 2) {
      put(x, gr + 10, z, "iron_block");
      put(x, gr + 11, z, "gray_concrete");
    }
    continue;
  }

  // Parapet course around the roof edge
  put(x, gr + 10, z, "white_concrete");

  const face = fs[0];
  const along = face === "north" || face === "south" ? x : z;
  const pillar = corner || along % 3 === 0;
  const [ox, oz] = OUT[face];
  const ix = x - ox, iz = z - oz; // inward neighbour (behind the glass)
  const inwardInside = has(ix, iz);

  if (corner) {
    // Corner column runs the full height of the facade
    for (let y = gr + 1; y <= gr + 7; y++) put(x, y, z, "smooth_quartz");
    continue;
  }

  // Ground floor: stone plinth, shopfront glazing, quartz lintel
  put(x, gr + 1, z, pillar ? "smooth_quartz" : "stone_bricks");
  if (pillar) {
    put(x, gr + 2, z, "smooth_quartz");
  } else {
    put(x, gr + 2, z, PANE_SHOP, paneProps(x, z, face));
    if (along % 6 === 2 && inwardInside) put(ix, gr + 2, iz, "glowstone");
  }
  put(x, gr + 3, z, "smooth_quartz");

  // Upper floor: spandrel under the window, glazed bays, quartz mullions
  put(x, gr + 5, z, pillar ? "smooth_quartz" : "white_concrete");
  for (const y of [gr + 6, gr + 7]) {
    if (pillar) {
      put(x, y, z, "smooth_quartz");
    } else {
      put(x, y, z, PANE_UPPER, paneProps(x, z, face));
    }
  }
  if (!pillar && along % 6 === 1 && inwardInside) {
    put(ix, gr + 6, iz, "glowstone");
  }
}

// Entrance: dark oak door in the middle of the north-facing (min z) frontage
const northCells = cells
  .filter(([x, z]) => !has(x, z - 1))
  .map(([x, z]) => x)
  .sort((a, b) => a - b);
if (northCells.length) {
  const dx = northCells[Math.floor(northCells.length / 2)];
  const dz = cells.find(([x, z]) => x === dx && !has(x, z - 1))[1];
  const dgr = gAt(dx, dz);
  const doorFacing = OPP.north; // door faces outward toward -z, so facing is "south"
  put(dx, dgr + 1, dz, "dark_oak_door", {
    facing: doorFacing, half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(dx, dgr + 2, dz, "dark_oak_door", {
    facing: doorFacing, half: "upper", hinge: "left", open: "false", powered: "false",
  });
}

g.save(`${DIR}/${ID}.nbt`);
