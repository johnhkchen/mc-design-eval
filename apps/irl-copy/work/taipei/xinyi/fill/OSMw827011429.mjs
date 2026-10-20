import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw827011429";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 6 x 9 footprint, roof about 11 blocks above lowest ground.
// Reads as a two-storey concrete-frame shophouse block of the 1980s:
// white render walls, light-grey piers, glass shopfront on the ground floor,
// dark-oak canopy, storey lines, cornice and parapet, rooftop AC units.
const W = 6, H = 23, D = 9;
const ROOF = 10;        // interior roof deck at y=10, parapet at y=11
const SLAB = 5;         // second-floor line
const g = new Voxels([W, H, D]);

const DIRS = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};
const key = (x, z) => `${x},${z}`;
const gmap = new Map();
for (const [x, z, gr] of cells) gmap.set(key(x, z), gr);
const has = (x, z) => gmap.has(key(x, z));

const put = (x, y, z, id, st) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (st) g.set(x, y, z, id, st);
  else g.set(x, y, z, id);
};

// Exposed faces per perimeter cell, and door placement on the chosen face.
const facesOf = (x, z) => {
  const out = [];
  for (const [name, [dx, dz]] of Object.entries(DIRS)) {
    if (!has(x + dx, z + dz)) out.push(name);
  }
  return out;
};

const faceU = { north: [], south: [], east: [], west: [] };
for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  const f = facesOf(x, z);
  if (f.length !== 1) continue;
  const dir = f[0];
  faceU[dir].push(dir === "north" || dir === "south" ? x : z);
}
let doorDir = null;
for (const d of ["south", "north", "east", "west"]) {
  if (faceU[d].length) { doorDir = d; break; }
}
let doorU = -999;
if (doorDir) {
  const us = faceU[doorDir];
  doorU = Math.floor((Math.min(...us) + Math.max(...us)) / 2);
}

const paneState = (dir) =>
  dir === "north" || dir === "south"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const doorState = (dir, half) => ({
  facing: dir,
  half,
  hinge: "left",
  open: "false",
  powered: "false",
});

const ACUNITS = [[2, 2], [3, 6]];

for (const [x, z, gr] of cells) {
  // Foundation: solid from y=0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const faces = facesOf(x, z);
  const perimeter = faces.length > 0;

  if (!perimeter) {
    // Interior: floor slab at second-floor line, roof deck, rooftop plant.
    if (gr <= SLAB) put(x, SLAB, z, "light_gray_concrete");
    if (gr <= ROOF) put(x, ROOF, z, "light_gray_concrete");
    if (ACUNITS.some(([ax, az]) => ax === x && az === z)) {
      put(x, ROOF + 1, z, "iron_block");
      put(x, ROOF + 2, z, "iron_block");
    }
    continue;
  }

  // Perimeter: facade from the cell's ground up to the parapet.
  const cornerCell = faces.length >= 2;
  const dir = faces[0];
  const u = dir === "north" || dir === "south" ? x : z;

  for (let y = gr; y <= 9; y++) {
    let id = "white_concrete";
    let st = undefined;

    if (y === gr) {
      id = "smooth_stone";                              // base course
    } else if (y === 9) {
      id = "smooth_stone";                              // upper lintel
    } else if (cornerCell) {
      id = "white_concrete";                            // corner piers
    } else if (gr <= 4 && (y === gr + 1 || y === gr + 2)) {
      // Shopfront band
      const isDoor = dir === doorDir && u === doorU && faces.length === 1;
      if (isDoor) {
        id = "dark_oak_door";
        st = doorState(dir, y === gr + 1 ? "lower" : "upper");
      } else if (u % 2 === 1) {
        id = "glass_pane";
        st = paneState(dir);
      } else {
        id = "light_gray_concrete";
      }
    } else if (gr <= 4 && y === gr + 3) {
      id = "dark_oak_slab";                             // shopfront canopy
      st = { type: "bottom", waterlogged: "false" };
    } else if (y === SLAB) {
      id = "light_gray_concrete";                       // storey line
    } else if (y >= 6 && y <= 8) {
      if (u % 2 === 1) {
        id = "glass_pane";
        st = paneState(dir);
      } else {
        id = "light_gray_concrete";
      }
    }

    if (id === "dark_oak_slab" || id === "dark_oak_door") {
      put(x, y, z, id, st);
    } else if (st) {
      put(x, y, z, id, st);
    } else {
      put(x, y, z, id);
    }

    // Warm light just inside some glazed bays.
    if (id === "glass_pane" && !cornerCell) {
      const [dx, dz] = DIRS[dir];
      const ix = x - dx, iz = z - dz;
      if (has(ix, iz) && facesOf(ix, iz).length === 0 && (u + y) % 3 === 0) {
        put(ix, y, iz, "glowstone");
      }
    }
  }

  // Cornice and parapet.
  put(x, ROOF, z, "smooth_stone");
  put(x, ROOF + 1, z, "white_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
