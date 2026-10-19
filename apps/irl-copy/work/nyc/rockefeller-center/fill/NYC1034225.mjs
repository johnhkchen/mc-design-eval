// 15 West 44th Street, 1914 Paragon Building: a 14-storey commercial and office block of red brick on a granite and
// andesite ground floor, with white terracotta sash bands, glass windows in brick piers, and a stone cornice. Footprint
// 14 x 6 (x along the street, low z = north = the 44th Street frontage). Lidar roofs are read as two clean tiers: 42
// blocks for the whole footprint, and a 44-block crown in the middle (lidar 43-44 at x 4-9, z 1-4). The lidar dips
// along the street (35-38, 28) are cornice shadow and noise, so they smooth to the 42 tier. The notch at (1, 0) has no
// lidar roof and is the entrance bay. A rooftop water tower on iron legs sits at the rear. Every face is a brick
// pier-and-window grid: glass panes sit one block out from a solid core with an air gap behind them and a floor slab
// at each storey line (no interiors). A few panes have glowstone behind them, and a hanging lantern lights the door.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034225.cells.json`, "utf8"));
const X = 14, Y = 56, Z = 6;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);
const lidar = (x, z) => (inFoot(x, z) ? cell.get(`${x},${z}`).roof : 0);
const cols = [...cell.keys()].map((k) => k.split(",").map(Number));

// Roof tiers (block heights above y 0): 42 across the footprint, 44 on the lidar crown.
const top = (x, z) => {
  if (!inFoot(x, z)) return 0;
  if (x >= 4 && x <= 9 && z >= 1 && z <= 4 && lidar(x, z) >= 43) return 44;
  return 42;
};

// Outward faces: N = low z (the 44th Street frontage), S = rear, W/E = the side walls.
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const open = (x, y, z) => !inFoot(x, z) || top(x, z) <= y;
// Exposed faces at a cell, in priority order (street first), so a corner reads as the street face.
const exposed = (x, y, z) => ["N", "S", "W", "E"].filter((d) => open(x + DIRS[d][0], y, z + DIRS[d][1]));

const pier = (d, u) => (d === "N" || d === "S" ? u % 3 === 0 || u === 13 : u % 3 === 0 || u === 5);
const glass = (d) => ["N", "S"].includes(d)
  ? ["glass_pane", { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }]
  : ["glass_pane", { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }];
const door = (y) => ["iron_door", { facing: "north", half: y === 0 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];

// One face block: ground floor shopfront (granite piers, glass, a door in the entrance bay, a lantern over it),
// then the upper storeys: a white terracotta sash band on each storey line (y = 3k) and glass between brick piers.
const faceBlock = (d, x, y, z) => {
  const u = d === "N" || d === "S" ? x : z;
  const p = pier(d, u);
  if (d === "N" && y <= 2) {
    if (p) return "polished_granite";
    if (u === 1 && y <= 1) return door(y);
    if (u === 1 && y === 2) return ["lantern", { hanging: "true", waterlogged: "false" }];
    return glass(d);
  }
  if (y === 0) return "polished_granite";                  // base course
  if (d === "N" && y === 3) return "polished_andesite";    // shopfront fascia
  if (p) return "bricks";
  if (y % 3 === 0) return "white_terracotta";              // storey line and sill
  return glass(d);
};

// The block at a footprint cell at height y: the roof and cornice at the top, otherwise the face or the brick core.
const blockAt = (x, y, z) => {
  const t = top(x, z), ex = exposed(x, y, z);
  if (y === t - 1) return ex.length ? "polished_andesite" : "gray_concrete";  // cornice cap, or tar roof
  if (y === t - 2 && ex.length) return "stone_bricks";                         // cornice frieze
  if (!ex.length) return "bricks";
  return faceBlock(ex[0], x, y, z);
};

const g = new Voxels([X, Y, Z]);
const panes = [];
for (const [x, z] of cols) {
  for (let y = 0; y < top(x, z); y++) {
    const b = blockAt(x, y, z);
    const [name, state] = Array.isArray(b) ? b : [b];
    g.set(x, y, z, name, state);
    if (name === "glass_pane") panes.push([x, y, z, exposed(x, y, z)[0]]);
  }
}

// Air behind the glass: the cell one block in from each pane is air, with a floor slab under it, and a warm glowstone
// behind about one pane in nine. The door's lobby is carved the same way.
const lit = (x, y, z, d) => (x * 5 + y * 7 + z * 3 + "NSWE".indexOf(d)) % 9 === 0;
for (const [x, y, z, d] of panes) {
  const [dx, dz] = DIRS[d], xi = x - dx, zi = z - dz;
  if (!inFoot(xi, zi) || top(xi, zi) <= y) continue;
  g.set(xi, y - 1, zi, "smooth_stone");                    // floor slab of this storey
  if (y % 3 === 1 && lit(x, y, z, d)) g.set(xi, y, zi, "glowstone");
  else g.set(xi, y, zi, "air");
}
g.set(1, 0, 1, "smooth_stone");                            // entrance lobby behind the door
g.set(1, 1, 1, "air");
g.set(1, 2, 1, "air");

// Rooftop water tower: iron legs on the roof at the rear, a spruce tank with stave hoops and a cap.
const rear = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
for (const [x, z] of [[10, 2], [12, 2], [10, 4], [12, 4]]) for (let y = 42; y <= 45; y++) g.set(x, y, z, "iron_bars", rear);
for (let x = 10; x <= 12; x++) for (let z = 2; z <= 4; z++) for (let y = 46; y <= 51; y++) {
  const hoop = (y === 46 || y === 50) && (x !== 11 || z !== 3);
  g.set(x, y, z, hoop ? "stripped_spruce_log" : "spruce_planks", hoop ? { axis: "y" } : undefined);
}
for (let x = 10; x <= 12; x++) for (let z = 2; z <= 4; z++) g.set(x, 52, z, "spruce_planks");

const { blocks, palette } = g.save(`${DIR}/NYC1034225.nbt`);
console.log(`NYC1034225.nbt: ${blocks} blocks, ${palette} palette entries`);
