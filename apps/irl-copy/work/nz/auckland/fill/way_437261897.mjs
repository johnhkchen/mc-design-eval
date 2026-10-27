import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Way 437261897, Mt Eden / Eden Terrace: a two-and-a-half storey interwar brick commercial block (red brick, a
// plinth, string courses, a parapet) with a single-storey shop wing to the south. Shopfronts on the ground floor,
// a canopied door on each street face, a glass-and-pilaster rhythm above, and warm lamps behind some windows.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_437261897.cells.json", "utf8"));

const g = new Voxels([10, 23, 13]);

// Lidar roof heights smoothed into three flat tiers: the one-storey wing (4), a setback (8), the core (10).
const tier = (r) => (r <= 5 ? 4 : r <= 8 ? 8 : 10);
const key = (x, z) => `${x},${z}`;
const top = new Map(cells.map(([x, z, , roof]) => [key(x, z), tier(roof)]));
const T = (x, z) => top.get(key(x, z)) ?? -1;                      // outside the footprint reads as lower
const DIRS = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };
const OPP = { n: "s", s: "n", w: "e", e: "w" };
const FACE = { n: "north", s: "south", w: "west", e: "east" };
const exposed = (x, z) => Object.keys(DIRS).filter((d) => T(x + DIRS[d][0], z + DIRS[d][1]) < T(x, z));
const edge = (x, z) => exposed(x, z).length > 0;

// The storey plan of a column of height t: plinth, shopfront, fascia, string course, upper windows, attic, parapet.
function kind(y, t) {
  if (y === 0) return "base";
  if (y === t - 1) return "top";
  if (y <= 2) return "shop";
  if (y === 3) return "fascia";
  if (y === 4 || (t === 10 && y === 7)) return "string";
  if (t === 10 && y === 8) return "attic";
  return "win";
}
const AIR = new Set(["shop", "fascia", "win", "attic"]);           // storeys with no interior: air behind the glass
const DECK = new Set(["base", "string", "top"]);                   // floor and roof slabs, one per storey

// Entrances on the street faces, each under a dark-oak canopy at fascia height.
const DOORS = new Map([[key(3, 12), "s"], [key(4, 7), "n"]]);
const CANOPY = new Set([key(2, 12), key(3, 12), key(4, 12), key(3, 7), key(4, 7), key(5, 7)]);

const panes = [];
for (const [x, z, ground] of cells) {
  const t = T(x, z), ex = exposed(x, z), wall = ex.length > 0;
  const along = ex.includes("n") || ex.includes("s") ? x : z;     // the coordinate that runs along the exposed face
  const corner = ex.some((d) => d === "n" || d === "s") && ex.some((d) => d === "e" || d === "w");
  const pier = corner || along % 3 === 0;
  const door = DOORS.get(key(x, z));
  for (let y = 0; y < ground; y++) g.set(x, y, z, "polished_andesite");   // foundation under a lower ground
  for (let y = ground; y < t; y++) {
    const k = kind(y, t);
    if (!wall) { if (DECK.has(k)) g.set(x, y, z, "smooth_stone"); continue; }   // interior: slabs only, air between
    if (CANOPY.has(key(x, z)) && y === 3) g.set(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
    else if (door && (y === 1 || y === 2)) g.set(x, y, z, "dark_oak_door", { facing: FACE[door], half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
    else if (k === "base") g.set(x, y, z, "polished_andesite");
    else if (k === "top") g.set(x, y, z, "stone_bricks");
    else if (k === "string" || k === "fascia") g.set(x, y, z, "smooth_stone");
    else if (pier) g.set(x, y, z, "bricks");
    else if (k === "shop") g.set(x, y, z, "glass");
    else if (k === "win" || (k === "attic" && along % 3 === 1)) { g.set(x, y, z, "glass_pane"); panes.push([x, y, z]); }
    else g.set(x, y, z, "bricks");                                     // attic spandrel
  }
}

// Warm light behind some glass: a glowstone in the room on the inner side of a window.
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const t = T(x, z), ex = exposed(x, z);
  if (ex.length !== 1) continue;
  const d = ex[0], along = d === "n" || d === "s" ? x : z;
  if (along % 3 === 0 || DOORS.has(key(x, z))) continue;
  const xi = x + DIRS[OPP[d]][0], zi = z + DIRS[OPP[d]][1];
  if (T(xi, zi) < 0 || edge(xi, zi)) continue;
  for (let y = 1; y < t; y++) {
    const k = kind(y, t);
    if (!["shop", "win", "attic"].includes(k) || (x + 2 * z + y) % 4 !== 0) continue;
    if (AIR.has(kind(y, T(xi, zi))) && y < T(xi, zi)) g.set(xi, y, zi, "glowstone");
  }
}

// Lanterns hanging in the shop wing's interior, under its roof slab.
g.set(4, 2, 9, "lantern", { hanging: "true" });
g.set(2, 2, 11, "lantern", { hanging: "true" });

// Roof plant on the core: a stone plinth with an iron unit on one cell, standing on the parapet.
g.set(1, 10, 8, "stone_bricks"); g.set(2, 10, 8, "stone_bricks");
g.set(1, 11, 8, "iron_block");

// Glass panes connect to whatever solid block stands beside them in the same storey.
const SIDE = { n: "north", s: "south", e: "east", w: "west" };
for (const [x, y, z] of panes) {
  const st = {};
  for (const d of Object.keys(DIRS)) st[SIDE[d]] = g.get(x + DIRS[d][0], y, z + DIRS[d][1]) ? "true" : "false";
  g.set(x, y, z, "glass_pane", st);
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_437261897.nbt";
const { blocks, palette } = g.save(out);
console.log(`way_437261897: ${blocks} blocks, ${palette} palette entries -> ${out}`);
