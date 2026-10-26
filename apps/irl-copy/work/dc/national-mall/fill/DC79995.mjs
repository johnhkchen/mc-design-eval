// 1445 P St NW: a four-storey red-brick apartment block (c. 1900-1915 DC walk-up, limestone trim) with a
// three-tier massing from the lidar: a 12-block central pavilion, 10-block main body, 3-block single-storey wing on
// the east end. Every footprint cell is solid from y 0 up to its tier, with a floor slab (limestone string course on
// the facade, stone inside) at rows 0, 3, 6 and 9, so each storey stands on the slab below. Window rows are brick
// piers and glass panes on the outer ring with air behind them; the interior is air between slabs (no rooms).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC79995.cells.json`, "utf8"));

const W = 13, H = 24, D = 12;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const pk = (x, y, z) => `${x},${y},${z}`;

// ---- massing: the lidar roof snapped to three flat tiers (noise between 10 and 11 is one tier) ----
const tier = (m) => (m >= 11.5 ? 12 : m >= 6 ? 10 : 3);
const top = new Map();
for (const [x, z, , roof] of cells) top.set(key(x, z), tier(roof));
const T = (x, z) => top.get(key(x, z)) ?? -1;     // -1 = outside the footprint

// Faces of a cell at row y that look onto open air: the neighbour is outside the footprint or stands lower than y.
const DIRS = { W: [-1, 0], E: [1, 0], N: [0, -1], S: [0, 1] };
const openSides = (x, z, y) => Object.keys(DIRS).filter((d) => T(x + DIRS[d][0], z + DIRS[d][1]) <= y);

const WALL = "bricks", LIME = "calcite", BASE = "stone_bricks", FLOOR = "stone", ROOF = "smooth_stone";
const PANE = "light_blue_stained_glass_pane";
const LIGHT = "glowstone";

const out = new Map();                             // "x,y,z" -> [block, state]
const put = (x, y, z, b, s) => out.set(pk(x, y, z), [b, s]);
const at = (x, y, z) => out.get(pk(x, y, z))?.[0];

const DOOR_X = 7, DOOR_Z = D - 1;                  // the entrance on the south face, in the bay beside the wing
const doorState = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
const lights = [];                                 // [x, y, z] of the interior cell behind each lit pane

for (const [k, t] of top) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < t; y++) {
    const sides = openSides(x, z, y);
    const ring = sides.length > 0;
    const ew = sides.includes("E") || sides.includes("W");
    const ns = sides.includes("N") || sides.includes("S");

    if (y === t - 1) {                             // cornice on the ring, roof deck inside
      put(x, y, z, ring ? LIME : ROOF);
    } else if (y === 0) {                          // base course: plinth on the ring, foundation inside
      put(x, y, z, ring ? BASE : FLOOR);
    } else if (y % 3 === 0) {                      // floor slab: brick spandrel on the ring, floor inside
      put(x, y, z, ring ? (ew && ns ? LIME : WALL) : FLOOR);
    } else if (ring) {                             // window row on the outer ring
      if (x === DOOR_X && z === DOOR_Z && (y === 1 || y === 2)) {  // the door
        put(x, y, z, "dark_oak_door", doorState(y === 1 ? "lower" : "upper"));
        continue;
      }
      if (x === DOOR_X - 1 && z === DOOR_Z) { put(x, y, z, LIME); continue; }  // door surround
      if (ew && ns) { put(x, y, z, y % 2 ? LIME : WALL); continue; }     // corner quoins, laid alternately
      const idx = ew ? z : x;                      // position along the face
      if (idx % 3 === 0) { put(x, y, z, WALL); continue; }      // brick pier
      put(x, y, z, PANE);                          // glass pane, air behind it
      if (y % 3 === 2 && idx % 6 === 1) {          // a warm lamp in some upper-row windows
        const inward = sides.length === 1 && sides[0] === "W" ? [x + 1, z]
          : sides.length === 1 && sides[0] === "E" ? [x - 1, z]
          : sides.length === 1 && sides[0] === "N" ? [x, z + 1]
          : sides.length === 1 && sides[0] === "S" ? [x, z - 1] : null;
        if (inward && T(...inward) > y) lights.push([inward[0], y, inward[1]]);
      }
    }
    // a row of window with no ring around it is air: the interior between the slabs
  }
}

// Chimneys stand on the 10-block roof, two courses of brick above the cornice.
for (const [x, z] of [[2, 4], [10, 8]]) {
  if (T(x, z) !== 10) continue;
  for (let y = 10; y <= 12; y++) put(x, y, z, WALL);
}

// Lamps behind the panes go in air cells that are not already set.
for (const [x, y, z] of lights) if (!at(x, y, z)) put(x, y, z, LIGHT);

// Glass panes connect to the panes beside them in their own face, so the facade reads as one glazed grid.
const isPane = (x, y, z) => at(x, y, z) === PANE;
for (const [p, [b]] of out) {
  if (b !== PANE) continue;
  const [x, y, z] = p.split(",").map(Number);
  const sides = openSides(x, z, y);
  const ew = sides.includes("E") || sides.includes("W");
  const state = ew
    ? { north: String(isPane(x, y, z - 1)), south: String(isPane(x, y, z + 1)), east: "false", west: "false" }
    : { north: "false", south: "false", east: String(isPane(x + 1, y, z)), west: String(isPane(x - 1, y, z)) };
  out.set(p, [b, { ...state, waterlogged: "false" }]);
}

for (const [p, [b, s]] of out) {
  const [x, y, z] = p.split(",").map(Number);
  g.set(x, y, z, b, s);
}

const res = g.save(`${DIR}/DC79995.nbt`);
const tally = {};
for (const [, [b]] of out) tally[b] = (tally[b] || 0) + 1;
console.log(`DC79995.nbt: ${res.blocks} blocks, ${res.palette} palette entries`, tally);
