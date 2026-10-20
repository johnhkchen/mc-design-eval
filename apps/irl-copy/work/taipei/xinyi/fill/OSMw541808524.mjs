import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541808524";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Low-rise two-storey commercial block, c. 1980s-90s Xinyi: white concrete
// facade, polished stone base and cornice, shopfront glazing at street level,
// punched upper windows, flat roof with plant units. Roof sits 11 blocks above
// the lowest ground (gr + 11), parapet to gr + 13.
const W = 23, H = 23, D = 17;
const vox = new Voxels([W, H, D]);

const map = new Map();
for (const [x, z, gr] of cells) map.set(`${x},${z}`, gr);
const has = (x, z) => map.has(`${x},${z}`);
const gAt = (x, z) => map.get(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) vox.set(x, y, z, id, props);
  else vox.set(x, y, z, id);
};

// Outward faces: missing neighbour means exterior.
const FACES = [
  { dx: 0, dz: -1, facing: "north", along: "x" },
  { dx: 0, dz: 1, facing: "south", along: "x" },
  { dx: -1, dz: 0, facing: "west", along: "z" },
  { dx: 1, dz: 0, facing: "east", along: "z" },
];

const isEdge = (x, z) => FACES.some(f => !has(x + f.dx, z + f.dz));
const exteriorFaces = (x, z) => FACES.filter(f => !has(x + f.dx, z + f.dz));

// Entrance: south-facing edge cell nearest the frontage centre.
const southCells = [];
for (const [x, z] of [...map.keys()].map(k => k.split(",").map(Number))) {
  if (!has(x, z + 1)) southCells.push(x);
}
let doorX = null;
if (southCells.length) {
  const mid = southCells.reduce((a, b) => a + b, 0) / southCells.length;
  doorX = southCells.reduce((best, x) => (Math.abs(x - mid) < Math.abs(best - mid) ? x : best));
}

// Pass 1: foundations, floors, roof, walls, parapet, plant.
for (const [x, z, gr] of cells) {
  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Floor slab between storeys and roof slab over every footprint cell.
  put(x, gr + 5, z, "smooth_quartz");
  put(x, gr + 11, z, "smooth_quartz");

  if (isEdge(x, z)) {
    // Wall shell, one cell thick, from ground to roof.
    for (let y = gr; y <= gr + 10; y++) put(x, y, z, "white_concrete");
    put(x, gr, z, "polished_andesite");            // base course
    put(x, gr + 5, z, "smooth_stone");             // storey line
    put(x, gr + 11, z, "smooth_stone");            // cornice
    for (let y = gr + 12; y <= gr + 12; y++) put(x, y, z, "white_concrete"); // parapet
    put(x, gr + 13, z, "smooth_stone");            // parapet cap
  } else {
    // Interior: air above the slab, roof plant on a grid.
    if (x % 6 === 3 && z % 5 === 2) put(x, gr + 12, z, "iron_block");
  }
}

// Pass 2: openings, lights and the entrance on exterior faces.
for (const [x, z, gr] of cells) {
  for (const f of exteriorFaces(x, z)) {
    const u = f.along === "x" ? x : z;
    const inX = x - f.dx, inZ = z - f.dz; // interior neighbour
    const onDoor = f.facing === "south" && x === doorX && !has(x, z + 1) && doorX !== null;

    // Ground storey: shopfront glazing with white concrete mullions.
    for (let y = gr + 1; y <= gr + 3; y++) {
      if (onDoor && y <= gr + 2) continue; // door set later
      if (u % 3 === 0) put(x, y, z, "white_concrete");
      else put(x, y, z, "light_blue_stained_glass");
    }

    // Upper storey: punched windows, one per three-block bay.
    for (let y = gr + 7; y <= gr + 9; y++) {
      if (u % 3 === 1) put(x, y, z, "light_blue_stained_glass");
      else put(x, y, z, "white_concrete");
    }

    // Warm light behind some upper windows, inside an interior cell.
    if (u % 6 === 1 && has(inX, inZ) && !isEdge(inX, inZ)) {
      put(inX, gr + 8, inZ, "glowstone");
    }
  }
}

// Entrance door and stone lintel on the south frontage.
if (doorX !== null) {
  const z = Math.max(...[...map.keys()].map(k => +k.split(",")[1]));
  for (const [x, zz, gr] of cells) {
    if (x !== doorX || zz !== z) continue;
    put(x, gr + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 3, z, "stone_bricks"); // lintel over door
    break;
  }
}

vox.save(`${DIR}/${ID}.nbt`);
