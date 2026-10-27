// Mt Eden / Eden Terrace, Auckland: a 1930s brick-and-stone commercial block. Three stepped tiers lifted from the lidar roof
// (a single-storey wing, a two-storey bar, a three-storey tower), a basalt plinth, shopfronts on the ground storey and
// stone courses, white Deco spandrels and a chiselled cornice above. Solid core; the only air is the gap behind each
// glazed pair of windows, with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_326340923.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_326340923.nbt";
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const [W, H, D] = [34, 27, 21];
const g = new Voxels([W, H, D]);

// the lidar roof, smoothed into three flat tiers: wing 7, bar 10, tower 14 (the top surface, in blocks above y 0)
const tierTop = (roof) => (roof >= 12 ? 14 : roof >= 9 ? 10 : 7);
const cellMap = new Map();
for (const [x, z, ground, roof] of cells) cellMap.set(`${x},${z}`, { x, z, ground, top: tierTop(roof) });
const at = (x, z) => cellMap.get(`${x},${z}`);
const DIR = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
// the faces of a cell that are outside at height y: no neighbour, or a neighbour whose roof is below y
const exposed = (x, z, y) => Object.keys(DIR).filter((d) => { const [dx, dz] = DIR[d], n = at(x + dx, z + dz); return !n || n.top <= y; });
const key3 = (x, y, z) => `${x},${y},${z}`;

// entrances on the ground storey: the north face of the wing, the west face of the bar
const DOORS = new Map([["4,0", "north"], ["1,7", "west"]]);

// storey rows, from the datum at y 2: course (ph 0), window pair (ph 1-2), spandrel (ph 3); the window pairs sit at y0 = 3, 7, 11
const openings = new Map();   // "x,z,y0" -> { dir, kind: "door" | "window" }
const gaps = new Set();       // air behind glass
for (const c of cellMap.values()) {
  const { x, z, top } = c;
  for (const y0 of [3, 7, 11]) {
    if (y0 + 2 >= top) continue;
    const e0 = exposed(x, z, y0), e1 = exposed(x, z, y0 + 1);
    if (e0.length !== 1 || e1.length !== 1 || e0[0] !== e1[0]) continue;
    const d = e0[0], [dx, dz] = DIR[d];
    const ix = x - dx, iz = z - dz, inner = at(ix, iz);
    const innerOpen = !!inner && inner.top > y0 + 1 && !exposed(ix, iz, y0).length && !exposed(ix, iz, y0 + 1).length;
    const along = d === "north" || d === "south" ? x : z;
    if (DOORS.get(`${x},${z}`) === d && y0 === 3) {
      openings.set(`${x},${z},${y0}`, { dir: d, kind: "door" });
      if (innerOpen) { gaps.add(key3(ix, y0, iz)); gaps.add(key3(ix, y0 + 1, iz)); }
    } else if (along % 4 === 1 || along % 4 === 2) {
      // a one-cell-deep edge has no room behind the glass: the pane sits on the core, and only the glazed bays with a gap light
      openings.set(`${x},${z},${y0}`, { dir: d, kind: "window", gap: innerOpen });
      if (innerOpen) { gaps.add(key3(ix, y0, iz)); gaps.add(key3(ix, y0 + 1, iz)); }
    }
  }
}

// the block of a footprint cell at height y (solid core below the roof, except the air behind glass)
function blockAt({ x, z, top }, y) {
  const ex = exposed(x, z, y);
  if (y === top - 1) return ex.length ? { block: "chiseled_stone_bricks" } : { block: "smooth_stone" };
  if (y < 2) return { block: ex.length ? "stone_bricks" : "stone" };   // basalt plinth, the foundation below it
  if (!ex.length) return { block: "stone" };
  if (ex.length >= 2) return { block: "stone_bricks" };                 // quoins
  const ph = (y - 2) % 4, ground = y < 6;
  if (ph === 0) return { block: ground ? "polished_andesite" : "smooth_stone" };   // string course
  if (ph === 3) return { block: ground ? "dark_oak_planks" : "white_concrete" };   // fascia / Deco spandrel
  const d = ex[0], y0 = ph === 1 ? y : y - 1;
  const o = openings.get(`${x},${z},${y0}`);
  if (o && o.dir === d && o.kind === "door") {
    return { block: "dark_oak_door", state: { facing: d, half: y === y0 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" } };
  }
  if (o && o.dir === d && o.kind === "window") {
    const ew = d === "north" || d === "south";
    return { block: "glass_pane", state: ew ? { north: "false", south: "false", east: "true", west: "true" } : { north: "true", south: "true", east: "false", west: "false" } };
  }
  return { block: ground ? "stone_bricks" : "bricks" };   // shopfront piers / brick piers
}

for (const c of cellMap.values()) {
  const { x, z, top } = c;
  for (let y = 0; y < top; y++) {
    if (gaps.has(key3(x, y, z))) continue;
    const b = blockAt(c, y);
    g.set(x, y, z, b.block, b.state);
  }
  // parapet on the tower's exposed edges (its own tier and the setbacks)
  if (top === 14 && exposed(x, z, 14).length) g.set(x, 14, z, "stone_brick_wall");
}

// warm light in some windows, set in the air behind the glass on the storey's floor slab
for (const [k, o] of openings) {
  if (o.kind !== "window" || !o.gap) continue;
  const [x, z, y0] = k.split(",").map(Number), [dx, dz] = DIR[o.dir];
  const ix = x - dx, iz = z - dz, n = (x * 5 + z * 3 + y0) % 5;
  if (n === 0) g.set(ix, y0, iz, "lantern", { hanging: "false" });
  else if (n === 3) g.set(ix, y0, iz, "glowstone");
}

// roof plant on the tower: a small block with a chiselled cap and two lanterns
for (let x = 12; x <= 15; x++) for (let z = 7; z <= 8; z++) {
  if (at(x, z)?.top !== 14) continue;
  g.set(x, 14, z, "stone_bricks"); g.set(x, 15, z, "stone_bricks");
  g.set(x, 16, z, "chiseled_stone_bricks");
}
g.set(13, 17, 7, "lantern", { hanging: "false" });
g.set(14, 17, 8, "lantern", { hanging: "false" });

// check: no block floats (each solid above y 0 has solid under it or beside it at its own height)
const solid = (x, y, z) => g.val(x, y, z) !== 0;
let floating = 0, solidCount = 0;
for (const c of cellMap.values()) for (let y = 0; y < H; y++) {
  if (!solid(c.x, y, c.z)) continue;
  solidCount++;
  if (y === 0) continue;
  const side = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => solid(c.x + dx, y, c.z + dz));
  if (!solid(c.x, y - 1, c.z) && !side) floating++;
}
const sum = g.save(OUT);
console.log(`way_326340923: ${sum.blocks} blocks, ${sum.palette} palette entries, ${solidCount} footprint solids, floating ${floating}, gaps ${gaps.size}`);
