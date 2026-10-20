import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise 1990s Xinyi shophouse-style block: two storeys over a shopfront,
// cream quartz-clad piers and spandrels, blue-tinted glazing, flat roof with parapet.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw537993146";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 23, H = 23, D = 16;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.max(0, Math.round(gr)));

const has = (x, z) => ground.has(key(x, z));
const isEdge = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));
const groundAt = (x, z) => ground.get(key(x, z));

const ROOF_Y = 10;      // top of parapet course; roof surface sits at 11
const FLOOR_2 = 5;      // storey line between the two storeys
const SPANDREL_TOP = 9;

// Front face is the lowest-z edge; door sits near its middle.
const zs = cells.map(c => Math.round(c[1]));
const zmin = Math.min(...zs);
const frontXs = cells
  .filter(([x, z]) => Math.round(z) === zmin)
  .map(([x]) => Math.round(x))
  .sort((a, b) => a - b);
const doorX = frontXs[Math.floor(frontXs.length / 2)];

// Find an interior neighbour (for placing warm lights behind glass).
function interiorNeighbour(x, z) {
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (has(nx, nz) && !isEdge(nx, nz)) return [nx, nz];
  }
  return null;
}

for (const [cx, cz, cg0] of cells) {
  const x = Math.round(cx), z = Math.round(cz);
  const gr = groundAt(x, z);

  // Foundation: solid from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (!isEdge(x, z)) {
    // Interior: floor slabs only, air between (no interiors).
    for (let y = gr; y <= ROOF_Y; y++) {
      if (y === gr || y === FLOOR_2 || y === ROOF_Y) {
        g.set(x, y, z, y === ROOF_Y ? "gray_concrete" : "smooth_stone");
      }
    }
    // Roof equipment: a small plant box on the deck.
    if (x >= 8 && x <= 10 && z >= 5 && z <= 6) {
      g.set(x, ROOF_Y + 1, z, "light_gray_concrete");
    }
    continue;
  }

  // Facade (edge) cell. Bay index runs along the face the cell belongs to.
  const alongX = !has(x - 1, z) || !has(x + 1, z);
  const u = alongX ? z : x;
  const isDoorCell = z === zmin && x === doorX;
  const isAwningCell = z === zmin && Math.abs(x - doorX) <= 1;
  const isPier = u % 3 === 0;

  for (let y = gr; y <= ROOF_Y; y++) {
    let block = null;
    let props = undefined;

    if (y === gr) {
      block = "polished_andesite";                     // base course
    } else if (y <= 4) {
      // Shopfront storey (ground floor band).
      if (isDoorCell && y <= gr + 2) {
        // Door handled below.
        continue;
      } else if (isAwningCell && y === gr + 3) {
        block = "dark_oak_slab";
        props = { type: "top", waterlogged: "false" };
      } else if (y === 4) {
        block = "smooth_quartz";                       // fascia lintel
      } else if (isPier) {
        block = "quartz_pillar";
        props = { axis: "y" };
      } else {
        block = "light_blue_stained_glass";
      }
    } else if (y === FLOOR_2) {
      block = "smooth_quartz";                         // storey line
    } else if (y >= 6 && y <= 8) {
      if (isPier) {
        block = "quartz_pillar";
        props = { axis: "y" };
      } else {
        block = "light_blue_stained_glass";
      }
    } else if (y === SPANDREL_TOP) {
      block = "smooth_quartz";                         // spandrel / cornice
    } else if (y === ROOF_Y) {
      block = "smooth_quartz";                         // parapet
    }

    if (block) g.set(x, y, z, block, props);
  }

  // Entrance door on the front face (two blocks tall), facing outward (north).
  if (isDoorCell) {
    g.set(x, gr + 1, z, "dark_oak_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(x, gr + 2, z, "dark_oak_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
    });
  }
}

// Warm lights behind some glass: placed in the interior cell behind a window.
for (const [cx, cz] of cells) {
  const x = Math.round(cx), z = Math.round(cz);
  if (!isEdge(x, z)) continue;
  const gr = groundAt(x, z);
  const alongX = !has(x - 1, z) || !has(x + 1, z);
  const u = alongX ? z : x;
  if (u % 3 === 0) continue;                 // piers have no window
  const inner = interiorNeighbour(x, z);
  if (!inner) continue;
  const [ix, iz] = inner;

  // Upper storey: shroomlight in some windows.
  if ((u + 7) % 4 === 0 && 7 > gr && 7 < FLOOR_2 + 3) {
    g.set(ix, 7, iz, "shroomlight");
  }
  // Ground storey: glowstone in some shopfront bays.
  if ((u + 2) % 5 === 0 && 2 > gr && 2 <= 4) {
    g.set(ix, 2, iz, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
