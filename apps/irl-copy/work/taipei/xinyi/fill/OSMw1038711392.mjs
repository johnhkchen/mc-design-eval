import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-century (1960s-70s) Taipei concrete shophouse-office: two storeys,
// shopfront on the ground floor, white-tiled concrete piers, grey spandrels,
// a flat roof with a parapet and a small mechanical penthouse.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1038711392";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 19, H = 23, D = 13;
const g = new Voxels([W, H, D]);

const ground = new Map();
const key = (x, z) => `${x},${z}`;
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.round(gr));
const has = (x, z) => ground.has(key(x, z));
const gnd = (x, z) => ground.get(key(x, z));

const put = (x, y, z, block, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// Build-up levels
const FOUND_TOP = null;      // foundation fills up to each cell's ground
const FLOOR_LINE = 5;        // floor slab between storeys
const SHOP_BAND = 4;         // lintel band over shopfront
const SPANDREL = 9;          // top spandrel band below roof
const ROOF = 10;             // roof slab (surface at y=11 from lowest ground)
const PARAPET = 11;          // parapet course
const CAP = 12;              // parapet cap

const glassNS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const glassEW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// Pass 1: foundations, walls, floor slabs, glazing
for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  const gr = gnd(x, z);

  // foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const exN = !has(x, z - 1);
  const exS = !has(x, z + 1);
  const exW = !has(x - 1, z);
  const exE = !has(x + 1, z);
  const isEdge = exN || exS || exW || exE;
  const zFace = exN || exS;   // face runs along x
  const xFace = exE || exW;   // face runs along z
  const corner = zFace && xFace;
  const u = zFace ? x : z;
  const pier = corner || (isEdge && u % 3 === 0);

  for (let y = gr; y <= SPANDREL; y++) {
    if (y === FLOOR_LINE) {
      put(x, y, z, "light_gray_concrete"); // floor slab, every cell
      continue;
    }
    if (!isEdge) continue; // interior: air behind glass, no rooms

    if (pier) {
      put(x, y, z, "white_concrete");
      continue;
    }
    if (y === SHOP_BAND || y === SPANDREL) {
      put(x, y, z, "light_gray_concrete");
      continue;
    }
    if (y === gr && gr < SHOP_BAND) {
      put(x, y, z, "stone_bricks"); // base course
      continue;
    }
    if (y < SHOP_BAND) {
      put(x, y, z, "glass_pane", zFace ? glassEW : glassNS); // shopfront glass
      continue;
    }
    // upper storey window (y 6..8)
    put(x, y, z, "glass_pane", zFace ? glassEW : glassNS);
  }

  // roof slab on every footprint cell
  if (gr <= ROOF) put(x, ROOF, z, "light_gray_concrete");

  // parapet and cap on the perimeter
  if (isEdge && gr <= PARAPET) {
    put(x, PARAPET, z, "white_concrete");
    put(x, CAP, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Pass 2: warm light in rooms behind some windows (glowstone behind glass)
for (const [x, z] of cells) {
  const gr = gnd(x, z);
  const edgeNear =
    !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z) ||
    !has(x, z - 2) || !has(x, z + 2) || !has(x - 2, z) || !has(x + 2, z);
  const isEdge = !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);
  if (isEdge || !edgeNear) continue;
  if ((x + z) % 3 !== 0) continue;
  if (gr <= 7 && 7 >= gr) put(x, 7, z, "glowstone");
  if (gr <= 2) put(x, 2, z, "glowstone");
}

// Pass 3: mechanical penthouse on the roof, centre of the plan
for (let x = 7; x <= 11; x++) {
  for (let z = 4; z <= 8; z++) {
    const gr = gnd(x, z);
    if (gr === undefined || gr > ROOF) continue;
    put(x, 11, z, "light_gray_concrete");
    put(x, 12, z, "light_gray_concrete");
    put(x, 13, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Pass 4: entrance door on the south (high-z) front, off-pier, nearest to centre
let door = null;
for (const [x, z] of cells) {
  if (has(x, z + 1)) continue;
  if (x % 3 === 0) continue; // piers and corners excluded
  const d = Math.abs(x - 9);
  if (!door || d < door.d) door = { x, z, d };
}
if (door) {
  const gr = gnd(door.x, door.z);
  put(door.x, gr, door.z, "oak_door", {
    facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(door.x, gr + 1, door.z, "oak_door", {
    facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  // lintel over the door
  put(door.x, gr + 2, door.z, "light_gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
