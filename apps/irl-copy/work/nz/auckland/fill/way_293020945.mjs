// Airedale Boutique Suites: a 1980s concrete-frame hotel-apartment block on a stone plinth, the Eden Terrace / Newton kind
// of mid-rise: 12 storeys of 4 blocks (3.3 m) to a roof at 44, a stepped ring of wings at 39 and a central lift core
// to 49. The lidar's roofs are quantised into four flat tiers. Glass panes in cyan and light-blue bays between white
// concrete piers and spandrels, basalt-look stone at the ground storey and the fascia, a recessed lobby door on the
// west face with lanterns hung either side, glowstone in some windows, plant boxes and roof plant on the tops.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_293020945.cells.json`, "utf8"));   // [x, z, ground, roof]
const g = new Voxels([31, 62, 38]);

const k = (x, z) => `${x},${z}`;
const TOP = new Map(cells.map(([x, z, , r]) => [k(x, z), r < 36 ? 15 : r <= 42 ? 39 : r <= 46 ? 44 : 49]));
const inside = (x, z) => TOP.has(k(x, z));
const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };

// the faces of a cell that show to the air at height y: no footprint neighbour, or one whose roof is at or below y
const faces = (x, z, y) => Object.keys(DIRS).filter((d) => {
  const [dx, dz] = DIRS[d], nx = x + dx, nz = z + dz;
  return !inside(nx, nz) || TOP.get(k(nx, nz)) <= y;
});
const pier = (x, z, f) => {
  const ns = f.some((d) => d === "N" || d === "S"), ew = f.some((d) => d === "E" || d === "W");
  return (ns && ew) || (ns && x % 3 === 0) || (ew && z % 3 === 0);
};
// every 3rd bay of glass a warmer pale tone, and a sparse lit window (glowstone in the pane)
const glass = (x, z) => ((Math.floor(x / 3) + Math.floor(z / 3)) % 3 === 0 ? "cyan_stained_glass" : "light_blue_stained_glass");
const litWindow = (x, y, z) => (x * 7 + z * 11 + y * 5) % 23 === 0;

// Walls, floor slabs, glazing, cornice and roof of each cell up to its tier. Storey floors at y = 3 + 4n.
for (const [key, top] of TOP) {
  const [x, z] = key.split(",").map(Number);
  g.set(x, 0, z, "stone_bricks"); g.set(x, 1, z, "stone_bricks"); g.set(x, 2, z, "polished_andesite");   // plinth + base course
  for (let y = 3; y < top; y++) {
    const f = faces(x, z, y), r = (y - 3) % 4;
    if (y === top - 1) { g.set(x, y, z, f.length ? "stone_bricks" : "smooth_stone"); continue; }        // parapet / roof deck
    if (f.length && y === top - 2) { g.set(x, y, z, "polished_andesite"); continue; }                      // cornice
    if (r === 0) { g.set(x, y, z, "light_gray_concrete"); continue; }                                       // storey slab
    if (!f.length) continue;                                                                                 // air behind the glass
    if (r === 3) { g.set(x, y, z, y === 6 ? "stone_bricks" : "white_concrete"); continue; }                 // fascia / spandrel
    const ground = y < 7;
    if (pier(x, z, f)) g.set(x, y, z, ground ? "stone_bricks" : "white_concrete");
    else if (litWindow(x, y, z)) g.set(x, y, z, "glowstone");
    else g.set(x, y, z, ground ? "glass" : glass(x, z));                                                   // shopfront glass at the ground storey
  }
}

// Structure: a concrete column on a 6-block grid through the interior, so every floor slab rests on something.
for (const [key, top] of TOP) {
  const [x, z] = key.split(",").map(Number);
  if (x % 6 !== 3 || z % 6 !== 3) continue;
  if (!Object.values(DIRS).every(([dx, dz]) => inside(x + dx, z + dz))) continue;
  for (let y = 3; y < top - 1; y++) g.set(x, y, z, "light_gray_concrete");
}

// Lobby: a two-high dark-oak door in the west face, mid-way along it, with lanterns hung either side under the fascia.
const west = cells.filter(([x, z]) => faces(x, z, 4).includes("W")).sort((a, b) => a[1] - b[1]);
const [ex, ez] = west[Math.floor(west.length / 2)];
const door = (half) => ({ facing: "west", half, hinge: "left", open: "false", powered: "false" });
g.set(ex, 4, ez, "dark_oak_door", door("lower"));
g.set(ex, 5, ez, "dark_oak_door", door("upper"));
for (const dz of [-1, 1]) if (faces(ex, ez + dz, 5).includes("W")) g.set(ex, 5, ez + dz, "lantern", { hanging: "true", waterlogged: "false" });

// Roof: plant boxes on the tower roof and planted beds on the wing roofs, standing on the roof decks.
for (const [key, top] of TOP) {
  const [x, z] = key.split(",").map(Number);
  if (faces(x, z, top - 1).length) continue;
  if (top === 44 && x % 7 === 2 && z % 7 === 2) { g.set(x, top, z, "light_gray_concrete"); g.set(x, top + 1, z, "iron_block"); }
  if (top === 39 && (x + z) % 5 === 0) g.set(x, top, z, "oak_leaves", { distance: "1", persistent: "true", waterlogged: "false" });
}

const stats = g.save(`${DIR}/way_293020945.nbt`);
console.log(`way_293020945: ${cells.length} cells, ${stats.blocks} blocks, ${stats.palette} palette entries`);
