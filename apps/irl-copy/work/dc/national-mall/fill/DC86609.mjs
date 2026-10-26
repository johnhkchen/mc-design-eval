import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Wire Building, 1000 Vermont Ave NW (Commercial-Office-Large).
// Read as a 1920s-1930s brick-and-stone commercial office block: red brick
// piers and spandrels, pale stone base, string courses and cornice, five
// storeys rising to about 18 blocks, a ground-floor shopfront and a central
// entrance on the north face. The interior is an air gap with one slab per storey.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86609.cells.json`, "utf8"));

const W = 11, H = 30, D = 14;
const g = new Voxels([W, H, D]);

// ---- footprint lookup ------------------------------------------------------
const cellMap = new Map();
for (const [x, z, gr, rf] of cells) {
  cellMap.set(`${x},${z}`, { g: Math.max(0, Math.round(gr)), r: rf });
}
const has = (x, z) => cellMap.has(`${x},${z}`);
const get = (x, z) => cellMap.get(`${x},${z}`);
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const exposed = (x, z) => NB.filter(([dx, dz]) => !has(x + dx, z + dz)).length;

// Smooth lidar roof: average of the cell and its in-footprint neighbours.
function roofAt(x, z) {
  let s = 0, n = 0;
  for (const [dx, dz] of [[0, 0], ...NB]) {
    if (has(x + dx, z + dz)) { s += get(x + dx, z + dz).r; n++; }
  }
  return s / n;
}

// Storey lines: ground floor 4 tall, upper storeys 3 tall.
// Floor slabs at gr, gr+4, gr+7, gr+10 ...
const isSlab = (y, gr) => y === gr || (y > gr && (y - gr - 4) >= 0 && (y - gr - 4) % 3 === 0);

// Materials
const PLINTH = "stone_bricks";
const FLOOR = "smooth_stone";
const BRICK = "bricks";
const STONE = "calcite";
const TRIM = "stone_bricks";
const PANE = "glass_pane";
const ROOF = "smooth_stone";
const PARAPET = "stone_brick_wall";
const DOOR = "dark_oak_door";
const GLOW = "glowstone";

// Entrance: north-exposed cells (no neighbour at z-1); take the median one.
const northFace = [];
for (const [key] of cellMap) {
  const [x, z] = key.split(",").map(Number);
  if (!has(x, z - 1)) northFace.push(x);
}
northFace.sort((a, b) => a - b);
const doorX = northFace.length ? northFace[Math.floor(northFace.length / 2)] : null;
const doorZ = doorX === null ? null : (() => {
  for (const [key] of cellMap) {
    const [x, z] = key.split(",").map(Number);
    if (x === doorX && !has(x, z - 1)) return z;
  }
  return null;
})();

// ---- build the massing and facades ----------------------------------------
for (const [key, cell] of cellMap) {
  const [x, z] = key.split(",").map(Number);
  const gr = cell.g;
  const ex = exposed(x, z);
  const T = Math.min(27, Math.max(gr + 8, Math.round(roofAt(x, z))));

  // Foundation: solid from y0 up to the ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, PLINTH);

  // Base course at ground level.
  g.set(x, gr, z, ex > 0 ? PLINTH : FLOOR);

  // Storeys.
  for (let y = gr + 1; y <= T - 1; y++) {
    if (y === T - 1 && ex > 0) { g.set(x, y, z, STONE); continue; } // cornice band
    if (isSlab(y, gr)) {
      g.set(x, y, z, ex > 0 ? STONE : FLOOR); // floor slab / string course
      continue;
    }
    if (ex === 0) {
      // Interior air gap. Warm light only in every other bay, sitting on a floor slab.
      if (isSlab(y - 1, gr) && (x + z) % 3 === 0 && (x + 2 * z) % 4 < 2) g.set(x, y, z, GLOW);
      continue;
    }
    if (ex >= 2) { g.set(x, y, z, STONE); continue; } // corner pilaster

    const ground = y <= gr + 3;
    if (ground) {
      // Shopfront: dark stone frame piers, full glass between.
      g.set(x, y, z, (x + z) % 2 === 1 ? PANE : TRIM);
      continue;
    }
    // Upper storeys: glass bays alternate with brick piers.
    g.set(x, y, z, (x + z) % 2 === 1 ? PANE : BRICK);
  }

  // Roof slab at T.
  g.set(x, T, z, ROOF);

  // Parapet on the perimeter.
  if (ex > 0) g.set(x, T + 1, z, PARAPET);

  // Roof plant: a centred penthouse set back from the parapet.
  if (ex === 0 && x >= 3 && x <= 7 && z >= 4 && z <= 9) {
    g.set(x, T + 1, z, "smooth_quartz");
    if (x >= 4 && x <= 6 && z >= 5 && z <= 8) g.set(x, T + 2, z, "smooth_quartz");
  }
}

// ---- entrance on the north face -------------------------------------------
if (doorX !== null && doorZ !== null) {
  const gr = get(doorX, doorZ).g;

  // Stone surround: calcite pilasters flanking the door, lintel above.
  for (let dx = -1; dx <= 1; dx++) {
    const x = doorX + dx;
    if (!has(x, doorZ) || has(x, doorZ - 1)) continue;
    for (let y = gr + 1; y <= gr + 3; y++) {
      g.set(x, y, doorZ, dx === 0 ? STONE : (y === gr + 3 ? STONE : PANE));
    }
  }
  // Pilasters either side of the entrance bay.
  for (const dx of [-2, 2]) {
    const x = doorX + dx;
    if (!has(x, doorZ) || has(x, doorZ - 1)) continue;
    for (let y = gr + 1; y <= gr + 3; y++) g.set(x, y, doorZ, STONE);
  }

  // Door, two blocks tall, on the north face.
  g.set(doorX, gr + 1, doorZ, DOOR, { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(doorX, gr + 2, doorZ, DOOR, { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
}

g.save(`${DIR}/DC86609.nbt`);
