import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise 1980s-style Taipei commercial block: two storeys of light concrete
// over a stone plinth, shopfront glass on the ground floor, punched windows
// with mullions on the upper floor, a gray belt course at each floor line, a
// white parapet, and two rooftop water tanks.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1174690449";
const W = 24, H = 23, D = 36;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const inF = (x, z) => ground.has(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Footprint extents and the southernmost cell in each column (for the entrance).
let minX = Infinity, maxX = -Infinity;
const southZ = new Map();
for (const [x, z] of cells) {
  minX = Math.min(minX, x);
  maxX = Math.max(maxX, x);
  southZ.set(x, Math.max(southZ.get(x) ?? -Infinity, z));
}
const cx = Math.floor((minX + maxX) / 2);

const FLOOR1 = 5;   // belt course / slab between storeys
const ROOF = 10;    // roof deck level
const TOP = 11;     // parapet level

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "gray_concrete");

  const faces = [];
  if (!inF(x, z - 1)) faces.push("north");
  if (!inF(x, z + 1)) faces.push("south");
  if (!inF(x - 1, z)) faces.push("west");
  if (!inF(x + 1, z)) faces.push("east");

  // Interior cell: floor slabs only, the rest is air.
  if (faces.length === 0) {
    put(x, FLOOR1, z, "light_gray_concrete");
    put(x, ROOF, z, "light_gray_concrete");
    continue;
  }

  const corner = faces.length > 1;
  const face = faces[0];
  const ns = face === "north" || face === "south";
  const t = ns ? x : z;               // position along the facade
  const pier = corner || t % 3 === 0; // corners and mullions are solid
  const glassProps = ns
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  const inward = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] }[face];
  const isEntr = face === "south" && !corner && x === cx && southZ.get(cx) === z;

  for (let y = gr; y <= TOP; y++) {
    if (y === gr) {
      put(x, y, z, "stone_bricks");                 // plinth course
    } else if (y === FLOOR1 || y === ROOF) {
      put(x, y, z, "gray_concrete");                // storey belt courses
    } else if (y === TOP) {
      put(x, y, z, "white_concrete");               // parapet
    } else if (y < FLOOR1) {
      // Ground floor: shopfront or entrance.
      if (isEntr) {
        if (y === gr + 1) put(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
        else if (y === gr + 2) put(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
        else if (y === gr + 3) put(x, y, z, "red_concrete");   // entrance sign band
        else put(x, y, z, "glass_pane", glassProps);
      } else if (pier) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "glass_pane", glassProps);
        if (y === gr + 2 && t % 6 === 4) {
          const ix = x + inward[0], iz = z + inward[1];
          if (inF(ix, iz)) put(ix, y, iz, "glowstone"); // warm shop light behind glass
        }
      }
    } else {
      // Upper floor: punched windows with sills and heads.
      if (pier || y === 6 || y === 9) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "glass_pane", glassProps);
        if (y === 7 && t % 6 === 1) {
          const ix = x + inward[0], iz = z + inward[1];
          if (inF(ix, iz)) put(ix, y, iz, "glowstone");
        }
      }
    }
  }
}

// Rooftop water tanks: 3x3 steel bodies with a concrete cap, sitting on the roof deck.
const fits3x3 = (x0, z0) => {
  for (let dx = 0; dx < 3; dx++)
    for (let dz = 0; dz < 3; dz++)
      if (!inF(x0 + dx, z0 + dz)) return false;
  return true;
};
const midX = Math.floor((minX + maxX) / 2);
const zs = [...ground.keys()].map((k) => Number(k.split(",")[1]));
const midZ = Math.floor((Math.min(...zs) + Math.max(...zs)) / 2);
const tankSpots = [[midX - 6, midZ - 6], [midX + 3, midZ + 6]];
for (const [x0, z0] of tankSpots) {
  if (!fits3x3(x0, z0)) continue;
  for (let dx = 0; dx < 3; dx++)
    for (let dz = 0; dz < 3; dz++) {
      for (let y = TOP + 1; y <= TOP + 3; y++) put(x0 + dx, y, z0 + dz, "iron_block");
      put(x0 + dx, TOP + 4, z0 + dz, "gray_concrete");
    }
}

g.save(`${DIR}/${ID}.nbt`);
