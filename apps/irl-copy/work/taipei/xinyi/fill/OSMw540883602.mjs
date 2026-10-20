import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540883602";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 9, H = 23, D = 22;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground height (integer, relative to y0)
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);

// Roof deck sits at y=10 (top surface 11); parapet cap at y=11.
const STOREY_1_FLOOR = 5;
const ROOF = 10;
const CAP = 11;

const inBounds = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;

function put(x, y, z, id, props) {
  if (!inBounds(x, y, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Outward faces: [dx, dz, name] for each side with no footprint neighbour.
const OUT = [
  [-1, 0, "west"],
  [1, 0, "east"],
  [0, -1, "north"],
  [0, 1, "south"],
];
const outs = (x, z) => OUT.filter(([dx, dz]) => !has(x + dx, z + dz));

const MID_Z = Math.floor(D / 2);

for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  const gr = ground.get(`${x},${z}`);
  const dirs = outs(x, z);
  const exterior = dirs.length > 0;

  // Foundation: solid from y0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!exterior) {
    // Interior: floor slabs only, air between them (no interiors modelled).
    put(x, gr, z, "smooth_stone");
    if (gr <= STOREY_1_FLOOR) put(x, STOREY_1_FLOOR, z, "light_gray_concrete");
    if (gr <= ROOF) put(x, ROOF, z, "gray_concrete");
    continue;
  }

  const corner = dirs.length > 1;
  const [dx, dz, face] = dirs[0];
  const t = dx !== 0 ? z : x; // position along the facade
  const pier = corner || t % 3 === 0;
  const isDoor = !corner && face === "west" && z === MID_Z;

  for (let y = gr; y <= CAP; y++) {
    if (y === gr) {
      put(x, y, z, "smooth_stone"); // base course
    } else if (y <= 3) {
      // Ground-floor shopfront: glass bays between white piers.
      put(x, y, z, pier ? "white_concrete" : "glass");
    } else if (y === 4) {
      // Red fascia / awning band over the shops.
      put(x, y, z, "red_concrete");
    } else if (y === STOREY_1_FLOOR) {
      put(x, y, z, "light_gray_concrete"); // storey line
    } else if (y <= 8) {
      // Upper storey window grid with white piers.
      put(x, y, z, pier ? "white_concrete" : "light_blue_stained_glass");
      // Warm light behind some upper windows (one gap of air kept).
      if (!pier && y === 7 && t % 6 === 1) {
        const ix = x - dx * 2, iz = z - dz * 2;
        if (has(ix, iz)) put(ix, y, iz, "glowstone");
      }
    } else if (y === 9 || y === ROOF) {
      put(x, y, z, "smooth_stone"); // cornice and roof coping
    } else if (y === CAP) {
      put(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    }
  }

  // Entrance on the street (west) face, mid-length: door with red fascia above.
  if (isDoor) {
    put(x, gr + 1, z, "dark_oak_door", {
      facing: "west", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    put(x, gr + 2, z, "dark_oak_door", {
      facing: "west", half: "upper", hinge: "left", open: "false", powered: "false",
    });
  }
}

// Roof equipment: two low plant units on interior roof cells.
for (const [x, z] of [[3, 6], [3, 7], [5, 13], [5, 14]]) {
  if (has(x, z) && outs(x, z).length === 0) put(x, CAP, z, "light_gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
