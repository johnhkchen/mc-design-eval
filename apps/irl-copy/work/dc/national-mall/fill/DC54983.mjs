// 1701 Massachusetts Ave NW: a c. 1925-30 elevator apartment house (Dupont Circle, Embassy Row) in red brick on a
// granite plinth, with calcite string courses and quoins. The lidar gives a 12-block wing, a 14-block tower core
// and 13-block shoulders, so it steps down from the core in tiers. Each storey is two blocks: a belt row (brick
// spandrel, or a calcite string course at each storey line) and a window row (glass in framed bays between brick
// piers, air behind the glass). Every cell is solid from y 0 to its roof with a floor slab at the even rows, so
// nothing floats. The main entrance is on the south end (z 16), a calcite surround under a lintel.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC54983.cells.json`, "utf8"));

const W = 11, H = 26, D = 17;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const pk = (x, y, z) => `${x},${y},${z}`;
const raw = new Map();
for (const [x, z, gr, roof] of cells) raw.set(key(x, z), { gr, roof });

// ---- massing: 3x3 median of the lidar roof, so one noisy cell does not make a step ----
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const top = new Map();
for (const [k] of raw) {
  const [x, z] = k.split(",").map(Number);
  const near = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const c = raw.get(key(x + dx, z + dz)); if (c) near.push(c.roof);
  }
  top.set(k, median(near));
}
const T = (x, z) => top.get(key(x, z)) ?? -1;   // -1 = outside the footprint

// The sides a cell at row y faces open air on: the neighbour is outside the footprint or stands no higher than y.
const DIRS = [["W", -1, 0], ["E", 1, 0], ["N", 0, -1], ["S", 0, 1]];
const openSides = (x, z, y) => DIRS.filter(([, dx, dz]) => T(x + dx, z + dz) <= y).map(([d]) => d);

const BRICK = "bricks", CALCITE = "calcite", PLINTH = "polished_granite", FOUNDATION = "stone";
const CAP = "stone_bricks", ROOF = "smooth_stone", GLASS = "light_blue_stained_glass_pane";
const panes = new Set();

// ---- main pass: plinth, belts on the even rows, window row on the odd rows, cornice and parapet on top ----
for (const [k, t] of top) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < t; y++) {
    const sides = openSides(x, z, y);
    const ext = sides.length > 0;
    const ew = sides.some((s) => s === "E" || s === "W");
    const ns = sides.some((s) => s === "N" || s === "S");
    if (y === t - 1) g.set(x, y, z, ext ? CAP : ROOF);                 // parapet / roof deck
    else if (y === t - 2 && ext) g.set(x, y, z, CALCITE);              // cornice course under the parapet
    else if (y === 0) g.set(x, y, z, ext ? PLINTH : FOUNDATION);       // granite plinth, stone foundation
    else if (y % 2 === 0) g.set(x, y, z, ext ? (y === 2 ? CALCITE : BRICK) : FOUNDATION);     // string course at the first floor, brick spandrels above
    else if (ext) {                                                     // window row
      if (ew && ns) g.set(x, y, z, CALCITE);                            // quoins at the corners
      else {
        const along = ew ? z : x;                                       // position along the face
        if (along % 3 === 0) g.set(x, y, z, BRICK);                     // brick piers between bays
        else { g.set(x, y, z, GLASS); panes.add(pk(x, y, z)); }
      }
    }
    // else: an interior window-row cell stays air (no interiors)
  }
}

// ---- entrance on the south end: a calcite surround, a lintel, and a dark oak door standing in the wall ----
const DOOR = { facing: "north", hinge: "left", open: "false", powered: "false" };
for (const [x, y] of [[7, 1], [9, 1], [8, 3]]) { g.set(x, y, 16, CALCITE); panes.delete(pk(x, y, 16)); }
g.set(8, 1, 16, "dark_oak_door", { ...DOOR, half: "lower" });
g.set(8, 2, 16, "dark_oak_door", { ...DOOR, half: "upper" });

// ---- glass panes connect to neighbouring panes in their row, so each bay is a framed grid ----
const isPane = (x, y, z) => panes.has(pk(x, y, z));
for (const k of panes) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, GLASS, {
    north: String(isPane(x, y, z - 1)), south: String(isPane(x, y, z + 1)),
    east: String(isPane(x + 1, y, z)), west: String(isPane(x - 1, y, z)), waterlogged: "false",
  });
}

// ---- warm light: a glowstone or a hanging lantern set just inside some windows (under a floor slab) ----
let lights = 0;
for (const k of panes) {
  const [x, y, z] = k.split(",").map(Number);
  const sides = openSides(x, z, y);
  const [ix, iz] = sides.includes("W") ? [x + 1, z] : sides.includes("E") ? [x - 1, z]
    : sides.includes("N") ? [x, z + 1] : [x, z - 1];
  if (T(ix, iz) <= y || openSides(ix, iz, y).length) continue;   // only a free interior cell
  const h = (x * 7 + y * 3 + z * 5) % 8;
  if (h === 0) { g.set(ix, y, iz, "glowstone"); lights++; }
  else if (h === 3) { g.set(ix, y, iz, "lantern", { hanging: "true", waterlogged: "false" }); lights++; }
}

// ---- roof plant: a two-block elevator bulkhead on the tower's roof (2x2, brick with a stone cap), and low brick
// mechanical boxes on the wing roof ----
for (const x of [4, 5]) for (const z of [10, 11]) {
  g.set(x, 14, z, BRICK); g.set(x, 15, z, CAP);
}
const wingRoof = [...top].filter(([k, t]) => t === 12 && openSides(...k.split(",").map(Number), 11).length === 0);
for (const [k] of wingRoof.filter((_, i) => i % 7 === 3).slice(0, 3)) {
  const [x, z] = k.split(",").map(Number); g.set(x, 12, z, BRICK);
}

const counts = g.save(`${DIR}/DC54983.nbt`);
console.log("saved DC54983.nbt", counts, "panes", panes.size, "lights", lights, "wing plant", Math.min(3, wingRoof.length));
