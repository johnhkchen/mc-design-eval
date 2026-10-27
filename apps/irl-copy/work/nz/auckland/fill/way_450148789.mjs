// Way 450148789: an interwar brick commercial block (c. 1930) on the Auckland street grid. Massing from the lidar roof:
// a 3-storey wing on the west (roof 12-15), a 5-storey core on the east (roof 19-21) with a terrace setback two cells in
// from its edge (16). Floors sit on a storey grid from y 0 (every 4 blocks), so every tier stands on the one below.
// Brick walls, cream string courses and piers, a stone base course, glass shopfronts on the ground floor, a door on the
// street front, glowstone and hanging lanterns behind some windows, and a plant room with a lightning rod on the roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_450148789.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_450148789.nbt";
const cells = JSON.parse(readFileSync(CELLS, "utf8"));   // [x, z, ground, roof]
const g = new Voxels([36, 34, 24]);

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const key = (x, z) => `${x},${z}`;
const cell = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { ground, roof }]));
const WING = 12, TERRACE = 16, CORE = 21;

// Tiers: lidar roof >= 19 is the core; the core's outer two cells step down to the terrace; the rest is the wing.
const tall = (x, z) => (cell.get(key(x, z))?.roof ?? 0) >= 19;
const depth = new Map(), queue = [];   // BFS depth in from the core's edge
for (const [x, z] of cells) if (tall(x, z) && DIRS.some(([dx, dz]) => !tall(x + dx, z + dz))) { depth.set(key(x, z), 1); queue.push([x, z]); }
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i], d = depth.get(key(x, z));
  for (const [dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (tall(nx, nz) && !depth.has(key(nx, nz))) { depth.set(key(nx, nz), d + 1); queue.push([nx, nz]); }
  }
}
const topOf = (x, z) => !cell.has(key(x, z)) ? 0 : !tall(x, z) ? WING : depth.get(key(x, z)) <= 2 ? TERRACE : CORE;

const occ = (x, y, z) => y >= 0 && y < topOf(x, z);
const outward = (x, y, z) => DIRS.filter(([dx, dz]) => !occ(x + dx, y, z + dz));
// position along the facade: x on north/south faces, z on east/west, x+z at corners
const along = (ext, x, z) => {
  const ex = ext.some(([dx]) => dx), ez = ext.some(([, dz]) => dz);
  return ex && !ez ? z : ez && !ex ? x : x + z;
};
const windowRow = (y) => y % 4 === 1 || y % 4 === 2;
const bayGlass = (a) => a % 4 === 1 || a % 4 === 2;

// Street door: a ground-level window bay on the outside of the footprint, the one with the most footprint around it.
const door = cells
  .filter(([x, z, gr]) => gr === 0 && outward(x, 1, z).length === 1 && bayGlass(along(outward(x, 1, z), x, z)))
  .map(([x, z]) => ({ x, z, n: outward(x, 1, z)[0], score: cells.filter(([a, b]) => Math.max(Math.abs(a - x), Math.abs(b - z)) <= 3).length }))
  .sort((a, b) => b.score - a.score)[0];

// A window with a warm light behind it: an interior cell beside a glazed bay, lit on about a third of them.
const lit = (x, y, z) => DIRS.some(([dx, dz]) => {
  const nx = x + dx, nz = z + dz, ext = outward(nx, y, nz);
  return occ(nx, y, nz) && ext.length && windowRow(y) && bayGlass(along(ext, nx, nz));
}) && (x + 2 * z + y) % 3 === 0;

const panes = new Set();
for (const [x, z, gr] of cells) {
  const T = topOf(x, z);
  for (let y = 0; y < T; y++) {
    if (y < gr) { g.set(x, y, z, "stone"); continue; }                    // foundation up to the lowest-to-here ground
    const ext = outward(x, y, z);
    if (y === T - 1) {                                                    // roof: coping on the edge, deck inside
      g.set(x, y, z, ext.length ? "calcite" : "smooth_stone");
      continue;
    }
    if (ext.length) {                                                     // facade
      const a = along(ext, x, z), n = ext[0];
      if (door && x === door.x && z === door.z && (y === 1 || y === 2)) {
        g.set(x, y, z, "oak_door", { facing: FACING[`${door.n[0]},${door.n[1]}`], half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      } else if (y === gr) g.set(x, y, z, "stone_bricks");              // base course
      else if (y % 4 === 0) g.set(x, y, z, "calcite");                   // string course at each floor
      else if (y % 4 === 3) g.set(x, y, z, "bricks");                    // spandrel
      else if (!bayGlass(a)) g.set(x, y, z, y < 4 ? "calcite" : "bricks");   // piers (calcite at the shopfront)
      else if (y < 4) g.set(x, y, z, "glass");                           // shopfront glass
      else { g.set(x, y, z, "glass_pane"); panes.add(`${x},${y},${z}`); }
    } else {                                                              // inside: air, floor slab per storey
      if (y === gr || y % 4 === 0) g.set(x, y, z, "smooth_stone");
      else if (y % 4 === 1 && lit(x, y, z)) g.set(x, y, z, "glowstone");
      else if (y % 4 === 3 && (x * 3 + z) % 7 === 0) g.set(x, y, z, "lantern", { hanging: "true" });
    }
  }
}

// Roof plant room on the core (its deep cells) with a lightning rod.
let pc = null;
for (const [x, z] of cells) if (topOf(x, z) === CORE && (!pc || depth.get(key(x, z)) > depth.get(key(pc[0], pc[1])))) pc = [x, z];
for (const [x, z] of cells) {
  if (topOf(x, z) === CORE && depth.get(key(x, z)) >= 3 && Math.max(Math.abs(x - pc[0]), Math.abs(z - pc[1])) <= 2) {
    g.set(x, CORE, z, "stone_bricks"); g.set(x, CORE + 1, z, "stone_bricks");
  }
}
if (depth.get(key(pc[0], pc[1])) >= 3) g.set(pc[0], CORE + 2, pc[1], "lightning_rod", { facing: "up", powered: "false" });

// Glass panes connect to neighbouring panes and to solid blocks, as vanilla panes do.
const SOLID = new Set(["bricks", "calcite", "stone_bricks", "smooth_stone", "glass", "stone", "glowstone"]);
for (const k of panes) {
  const [x, y, z] = k.split(",").map(Number);
  const link = (dx, dz) => {
    const n = g.get(x + dx, y, z + dz);
    if (!n) return "false";
    const b = n.block.replace("minecraft:", "");
    return b === "glass_pane" || SOLID.has(b) ? "true" : "false";
  };
  g.set(x, y, z, "glass_pane", { north: link(0, -1), south: link(0, 1), east: link(1, 0), west: link(-1, 0), waterlogged: "false" });
}

const info = g.save(OUT);
console.log(`way_450148789: ${info.blocks} blocks, palette ${info.palette}, door ${door ? `${door.x},${door.z} facing ${FACING[`${door.n[0]},${door.n[1]}`]}` : "none"}`);
