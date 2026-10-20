// Era and form: no record exists, so this reads as a late-1980s to 1990s Xinyi-district
// commercial block: five storeys over a shopfront ground floor, white-concrete piers and
// spandrels, quartz sills and a parapet, blue-tinted glazing, and a central rooftop plant room.
// Five storeys of 5 blocks give a roof 25 blocks above the lowest ground, with the parapet at 26.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw764466763";
const W = 86, H = 38, D = 23;
const STOREYS = 5, STOREY_H = 5;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const GLASS = "light_blue_stained_glass_pane";
const PIER = "white_concrete";
const SILL = "smooth_quartz";
const PLINTH = "stone_bricks";
const FLOOR = "white_concrete";
const ROOF = "smooth_stone";
const PARAPET = "smooth_quartz";

// Neighbour offsets: [dx, dz, name]. North is -z, south is +z.
const NB = [[0, -1, "north"], [0, 1, "south"], [-1, 0, "west"], [1, 0, "east"]];

let minZ = Infinity, maxZ = -Infinity;
for (const [, z] of cells) { if (z < minZ) minZ = z; if (z > maxZ) maxZ = z; }

// Pass 1: massing, foundations, floors, facades, parapet.
for (const [x, z, gr] of cells) {
  // Foundation: solid from y=0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Floor slabs at every storey line, and the roof slab.
  for (let s = 0; s < STOREYS; s++) put(x, gr + s * STOREY_H, z, FLOOR);
  put(x, gr + STOREYS * STOREY_H, z, ROOF);

  const missing = NB.filter(([dx, dz]) => !has(x + dx, z + dz));
  if (missing.length === 0) continue; // interior cell: air behind the glass

  // Facade runs along x if the missing neighbour is north or south, otherwise along z.
  const alongX = missing.some(([dx, dz]) => dz !== 0);
  const along = alongX ? x : z;
  const pier = along % 3 === 0;

  // Interior neighbour, used for glowstone behind the glass.
  const inward = NB.find(([dx, dz]) => has(x + dx, z + dz));

  for (let s = 0; s < STOREYS; s++) {
    const base = gr + s * STOREY_H;
    if (s === 0) {
      put(x, base + 1, z, PLINTH);
      put(x, base + 2, z, pier ? PIER : GLASS);
      put(x, base + 3, z, pier ? PIER : GLASS);
      put(x, base + 4, z, PIER);
    } else {
      put(x, base + 1, z, SILL);
      put(x, base + 2, z, pier ? PIER : GLASS);
      put(x, base + 3, z, pier ? PIER : GLASS);
      put(x, base + 4, z, PIER);
    }

    // Warm light: glowstone on the interior side of some windows.
    if (!pier && inward && (along + s) % 4 === 1) {
      put(x + inward[0], base + 2, z + inward[1], "glowstone");
    }
  }

  // Parapet course above the roof slab.
  put(x, gr + STOREYS * STOREY_H + 1, z, PARAPET);
}

// Pass 2: entrances on both long faces, with doors, transom glass and a lantern inside.
const doorXs = [9, 41, 73];
const doorXsSouth = [20, 62];
const placeEntrance = (x, zEdge, facing, inwardZ) => {
  if (!has(x, zEdge)) return;
  const gr = ground.get(`${x},${zEdge}`);
  put(x, gr + 1, zEdge, "iron_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 2, zEdge, "iron_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 3, zEdge, GLASS);
  // Marquee slab over the door, then a lantern just inside the lobby.
  put(x, gr + 4, zEdge, "smooth_stone_slab", { type: "top", waterlogged: "false" });
  if (has(x, zEdge + inwardZ)) {
    put(x, gr + 1, zEdge + inwardZ, "lantern", { hanging: "false", waterlogged: "false" });
  }
};
for (const x of doorXs) {
  placeEntrance(x, minZ, "north", 1);
  placeEntrance(x, maxZ, "south", -1);
}
for (const x of doorXsSouth) {
  placeEntrance(x, minZ, "north", 1);
  placeEntrance(x, maxZ, "south", -1);
}

// Pass 3: rooftop plant room, centred on the roof with a concrete box and a slab cap.
for (let x = 30; x <= 44; x++) {
  for (let z = 7; z <= 15; z++) {
    if (!has(x, z)) continue;
    const gr = ground.get(`${x},${z}`);
    const top = gr + STOREYS * STOREY_H;
    const edge = x === 30 || x === 44 || z === 7 || z === 15;
    if (edge) {
      put(x, top + 1, z, "light_gray_concrete");
      put(x, top + 2, z, "light_gray_concrete");
    }
    put(x, top + 3, z, ROOF);
  }
}

g.save(`${DIR}/${ID}.nbt`);
