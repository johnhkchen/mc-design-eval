// Lumina: a 1980s five-storey concrete office block on Mt Eden's flank, Auckland. Basalt plinth, white concrete
// piers and head bands, tinted glazing in the bays, a shopfront at street level and a flat roof. The lidar gives a
// flat roof (22 to 23 blocks, 1 block apart), so the massing is one tier with a 1-block lower wing, not setbacks.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_1067540365.cells.json`, "utf8"));

const W = 43, H = 36, D = 25;
const PLINTH = 3;                         // solid 0..2 under every cell: the foundation, and the basalt base
const FLOORS = [3, 7, 11, 15, 19];        // storey datums: a slab each, storeys 4 blocks apart (3.3 m)
const g = new Voxels([W, H, D]);

// footprint and lidar roof (the 4th number), smoothed over the 3x3 neighbourhood and snapped to the two tiers the lidar shows
const raw = new Map(cells.map(([x, z, , r]) => [`${x},${z}`, r]));
const inF = (x, z) => raw.has(`${x},${z}`);
const top = (x, z) => {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const r = raw.get(`${x + dx},${z + dz}`); if (r !== undefined) v.push(r); }
  v.sort((a, b) => a - b);
  return v[v.length >> 1] >= 23 ? 23 : 22;
};

// outward sides of a footprint cell (a side is outward when its neighbour is not in the footprint)
const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
const outs = (x, z) => Object.keys(DIRS).filter(k => !inF(x + DIRS[k][0], z + DIRS[k][1]));
const perimeter = (x, z) => outs(x, z).length > 0;

// the front door: the northmost north-facing wall, its middle cell
const northWalls = cells.map(([x, z]) => [x, z]).filter(([x, z]) => outs(x, z).includes("N"));
const minZ = Math.min(...northWalls.map(([, z]) => z));
const frontRow = northWalls.filter(([, z]) => z === minZ).map(([x]) => x).sort((a, b) => a - b);
const DOOR_X = frontRow[frontRow.length >> 1], DOOR_Z = minZ;

for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const T = top(x, z), per = perimeter(x, z);
  // foundation and basalt plinth
  for (let y = 0; y < PLINTH; y++) g.set(x, y, z, "deepslate_bricks");
  if (x === DOOR_X && z === DOOR_Z) g.set(x, 2, z, "deepslate_brick_stairs", { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" });

  // floors: a slab per storey, with air between them (no interiors)
  for (const F of FLOORS) if (F < T - 1 && !per) g.set(x, F, z, "smooth_stone");
  // roof membrane, with moss patches for a roof garden
  if (!per) g.set(x, T - 1, z, (x % 7 >= 2 && x % 7 <= 3 && z % 5 >= 1 && z % 5 <= 2) ? "moss_block" : "gray_concrete");

  if (!per) continue;
  // one face per cell: the north or south side if it has one (a diagonal stair step has two, so it is not a corner),
  // else east or west; the bay index runs along that face, and every third bay is a pier
  const sides = outs(x, z);
  const face = sides.find(s => s === "N" || s === "S") ?? sides[0];
  const i = face === "N" || face === "S" ? x : z;
  const pier = i % 3 === 0;

  for (let y = PLINTH; y < T; y++) {
    const s = Math.floor((y - PLINTH) / 4), r = (y - PLINTH) % 4, F = PLINTH + 4 * s;
    let block;
    if (y === T - 1) block = "smooth_stone";                                            // parapet coping
    else if (x === DOOR_X && z === DOOR_Z && y <= 4) {                                  // entrance: a two-high door
      g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === 3 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    else if (x === DOOR_X && z === DOOR_Z && y === 5) block = "white_concrete";          // lintel over the door
    else if (r === 3) block = "white_concrete";                                         // head band at each storey line
    else if (r === 0) block = s === 0 ? "deepslate_tiles" : "light_gray_concrete";      // base course / spandrel
    else if (pier) block = "white_concrete";                                            // piers
    else block = "light_blue_stained_glass";                                            // glazing
    g.set(x, y, z, block);
  }

  // warm light: behind some lower-row panes, in the air gap, standing on the floor slab
  if (!pier && !(x === DOOR_X && z === DOOR_Z)) {
    const [dx, dz] = DIRS[face], ix = x - dx, iz = z - dz;
    if (inF(ix, iz) && !perimeter(ix, iz)) {
      for (let s = 0; s < FLOORS.length; s++) {
        const F = FLOORS[s];
        if (F + 1 >= top(x, z) - 1) continue;
        if (s === 0 && i % 4 === 1) g.set(ix, F + 1, iz, "glowstone");
        if (s > 0 && (i + s) % 5 === 1) g.set(ix, F + 1, iz, "shroomlight");
      }
    }
  }
}

const info = g.save(`${DIR}/way_1067540365.nbt`);
console.log(`Lumina: ${cells.length} footprint cells, ${info.blocks} blocks, ${info.palette} palette entries`);
