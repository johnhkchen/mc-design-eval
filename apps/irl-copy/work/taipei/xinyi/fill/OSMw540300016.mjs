import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi-style commercial block: two storeys of white tiled concrete over a
// ground-floor shopfront, a cornice and parapet, and a flat roof with rooftop plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540300016";
const W = 12, H = 23, D = 23;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const inF = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const outward = (x, z) => DIRS.filter(([dx, dz]) => !inF(x + dx, z + dz));
const isEdge = (x, z) => outward(x, z).length > 0;
const inwardCell = (x, z) => {
  for (const [dx, dz] of DIRS) {
    if (inF(x + dx, z + dz)) return [x + dx, z + dz];
  }
  return null;
};

const put = (x, y, z, name, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, name, props);
  else g.set(x, y, z, name);
};

// Pane orientation: a wall running along x uses east/west connections.
const pane = (x, y, z, alongX) =>
  put(x, y, z, "glass_pane", alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

// Entrance: front (min-z) edge, nearest the middle of the width.
const edgeCells = cells
  .map(([x, z, gr]) => [x, z, Math.round(gr)])
  .filter(([x, z]) => isEdge(x, z));
let frontCands = edgeCells.filter(([x, z]) => outward(x, z).some(([, dz]) => dz === -1));
if (frontCands.length === 0) frontCands = edgeCells;
const minZ = Math.min(...frontCands.map(([, z]) => z));
frontCands = frontCands.filter(([, z]) => z === minZ);
frontCands.sort((a, b) => Math.abs(a[0] - W / 2) - Math.abs(b[0] - W / 2));
const [ex, ez] = frontCands[0] ?? [Math.floor(W / 2), minZ];
const entranceBase = gnd(ex, ez);

for (const [x, z, gr] of cells.map(([x, z, gr]) => [x, z, Math.round(gr)])) {
  // Foundation: solid stone from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const b = gr; // ground-floor slab level for this cell
  // Floors stand on the cell's own ground.
  put(x, b, z, "smooth_stone");
  put(x, b + 5, z, "smooth_stone"); // second-floor slab

  // Roof surface.
  put(x, b + 10, z, isEdge(x, z) ? "white_concrete" : "smooth_stone");

  if (!isEdge(x, z)) continue;

  const out = outward(x, z)[0];
  const alongX = out[0] === 0; // outward is along z, so the wall runs along x
  const idx = x + z;
  const isMullion = idx % 3 === 0;
  const isEntrance = x === ex && z === ez;

  // Ground floor: plinth, shopfront glazing with dark frames, lintel.
  put(x, b + 1, z, "smooth_stone");
  if (isMullion) put(x, b + 2, z, "dark_oak_planks");
  else pane(x, b + 2, z, alongX);
  if (isMullion) put(x, b + 3, z, "dark_oak_planks");
  else pane(x, b + 3, z, alongX);
  put(x, b + 4, z, "white_concrete");

  // Upper storey: spandrel, windows with white mullions, cornice.
  put(x, b + 6, z, "white_concrete");
  if (isMullion) {
    put(x, b + 7, z, "white_concrete");
    put(x, b + 8, z, "white_concrete");
  } else {
    pane(x, b + 7, z, alongX);
    pane(x, b + 8, z, alongX);
  }
  put(x, b + 9, z, "white_concrete");
  // Parapet at b+10 is set above.

  // Warm lights standing just behind selected windows.
  const inw = inwardCell(x, z);
  if (inw && !isEdge(inw[0], inw[1])) {
    const [ix, iz] = inw;
    if (!isMullion && idx % 6 === 1) {
      put(ix, b + 7, iz, "shroomlight");
    }
    if (!isMullion && idx % 6 === 4 && !(x === ex && z === ez)) {
      put(ix, b + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

// Entrance: door and canopy at the front of the shopfront.
if (entranceBase !== undefined) {
  const eb = entranceBase;
  put(ex, eb + 1, ez, "dark_oak_door", {
    facing: "south", half: "lower", hinge: "left", open: "false", powered: "false"
  });
  put(ex, eb + 2, ez, "dark_oak_door", {
    facing: "south", half: "upper", hinge: "left", open: "false", powered: "false"
  });
  // Canopy slab over the entrance, replacing the lintel course.
  for (const [x, z] of cells.map(([x, z]) => [x, z])) {
    if (z === ez && Math.abs(x - ex) <= 2 && isEdge(x, z)) {
      put(x, eb + 4, z, "dark_oak_slab", { type: "top", waterlogged: "false" });
    }
  }
  // Warm light beside the door.
  const inw = inwardCell(ex, ez);
  if (inw) put(inw[0], eb + 3, inw[1], "lantern", { hanging: "true", waterlogged: "false" });
}

// Rooftop plant: a few condenser units sitting on the roof surface.
for (const [x, z, gr] of cells.map(([x, z, gr]) => [x, z, Math.round(gr)])) {
  if (isEdge(x, z)) continue;
  const roofY = gr + 10;
  const plant = (x === 3 || x === 4 || x === 7 || x === 8) && (z === 6 || z === 7 || z === 15 || z === 16);
  if (plant && roofY + 1 < H) put(x, roofY + 1, z, "light_gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
