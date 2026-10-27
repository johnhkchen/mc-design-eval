// Way 269467619, Auckland (Mt Eden / Eden Terrace edge): a 1930s brick-and-render commercial block, three storeys over a
// stone plinth, on a sloping site. Lidar roofs snap to two tiers: 13 (the block) and 10 (the lower wing at the west and
// south-west corner). Each cell stands on its own ground (cobble foundation, stone base course), so the uphill side has
// fewer storeys and the downhill side shows its extra ones. Facades: brick piers, glass panes between cream render
// courses, a recessed-lintel head, a cream cornice and crown, a shopfront at ground level, and a street door on the north
// face. Walls are a one-block skin with an air cavity behind the glass and a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_269467619.cells.json`, "utf8"));

const WALL = "bricks", COURSE = "smooth_quartz", BASE = "stone_bricks", FOUND = "cobblestone";
const GLASS = "light_blue_stained_glass_pane", FLOOR = "smooth_stone", ROOF = "smooth_stone", GLOW = "glowstone";

// footprint: (x,z) -> { ground, top }; the lidar roof snapped to a tier (>= 12 is the block, anything lower a wing)
const foot = new Map();
for (const [x, z, ground, roof] of cells) foot.set(`${x},${z}`, { ground, top: roof >= 12 ? 13 : 10 });
const has = (x, z) => foot.has(`${x},${z}`);

// which face of the footprint a perimeter cell is on: "N" (z-), "S" (z+), "W" (x-), "E" (x+), "corner", or null inside
function faceOf(x, z) {
  const n = !has(x, z - 1), s = !has(x, z + 1), w = !has(x - 1, z), e = !has(x + 1, z);
  if (!(n || s || w || e)) return null;
  if ((n || s) && (w || e)) return "corner";
  return n ? "N" : s ? "S" : w ? "W" : "E";
}

const g = new Voxels([15, 26, 15]);
const ENTRANCE = [7, 1];   // north face, street door

for (const [key, { ground: gr, top }] of foot) {
  const [x, z] = key.split(",").map(Number);
  const f = faceOf(x, z);

  // foundation: cobble plinth from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  // the storey column: 4-block storeys from this cell's ground; the top block is the cornice (or the roof slab inside)
  for (let y = gr; y < top; y++) {
    const rel = y - gr, s = Math.floor(rel / 4), r = rel % 4;
    if (y === top - 1) { g.set(x, y, z, f ? COURSE : ROOF); continue; }
    if (!f) { if (r === 0) g.set(x, y, z, FLOOR); continue; }      // interior: a floor slab per storey, air between
    if (f === "corner") { g.set(x, y, z, r === 0 && s === 0 ? BASE : r === 0 ? COURSE : WALL); continue; }
    if (r === 0) { g.set(x, y, z, s === 0 ? BASE : COURSE); continue; }  // base course, then storey string courses
    if (r === 3) { g.set(x, y, z, WALL); continue; }                       // brick lintel / head
    // r = 1, 2: the window band; piers every third bay, glass between
    const idx = f === "N" || f === "S" ? x : z;
    const [ex, ez] = ENTRANCE;
    if (s === 0 && x === ex && z === ez && f === "N") {                    // the street door (two blocks)
      g.set(x, y, z, "dark_oak_door", { facing: "north", half: r === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (s === 0 && f === "N" && idx === ex + 1) { g.set(x, y, z, WALL); continue; }  // door surround
    if (idx % (s === 0 ? 6 : 3) === 0) { g.set(x, y, z, WALL); continue; } // pier (wider shopfront bays at street level)
    const ns = f === "N" || f === "S";
    g.set(x, y, z, GLASS, { east: String(ns), west: String(ns), north: String(!ns), south: String(!ns), waterlogged: "false" });
    // some windows lit: a glowstone in the cavity just behind the pane (inward cell)
    if (r === 1 && (idx * 3 + s * 7) % 4 === 0) {
      const [dx, dz] = f === "N" ? [0, 1] : f === "S" ? [0, -1] : f === "W" ? [1, 0] : [-1, 0];
      if (has(x + dx, z + dz)) g.set(x + dx, y, z + dz, GLOW);
    }
  }

  // the canopy over the street door: a dark lintel band across the entrance bay
  if (x >= ENTRANCE[0] - 1 && x <= ENTRANCE[0] + 1 && z === ENTRANCE[1] && gr + 3 < top - 1)
    g.set(x, gr + 3, z, "dark_oak_slab", { type: "top", waterlogged: "false" });

  // a cream coping on the perimeter, standing on the cornice
  if (f) g.set(x, top, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
}

// roof plant: a lift-motor box on the block's roof, and two air-handling units, all on interior cells
for (let x = 9; x <= 11; x++) for (let z = 5; z <= 7; z++) {
  if (!has(x, z) || faceOf(x, z)) continue;
  g.set(x, 13, z, WALL); g.set(x, 14, z, WALL); g.set(x, 15, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
}
for (const [x, z] of [[4, 4], [5, 4]]) if (has(x, z) && !faceOf(x, z)) g.set(x, 13, z, "iron_block");

const out = `${DIR}/way_269467619.nbt`;
const info = g.save(out);
console.log(`wrote ${out}: ${info.blocks} blocks, palette ${info.palette}`);
