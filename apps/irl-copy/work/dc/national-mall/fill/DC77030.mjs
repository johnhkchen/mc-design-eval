// 901 Massachusetts Ave NW: a Hotel-Large of c. 1915-1925 in red brick with limestone trim (the DC Beaux-Arts
// commercial walk-up). Footprint 3 x 13 with the front on the x=2 side. The lidar roof is 12-15 blocks, read per
// z-row as the mean over x and snapped to flat tiers: 13 at the ends, 14 on the shoulders, 15 on the tower (z 6-7),
// 12 at the south end. The tower steps back at the front (x=2 stops at y 12, the terrace), its upper glass on x=1.
// Every column is solid from y 0 up to its top, with a floor slab at each storey line, so nothing floats; the
// window rows are glass with air behind them (x=1 on the front, x=0 at the tower), and the ground floor is a
// shopfront either side of a lobby door up a one-block step.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC77030.cells.json`, "utf8"));

const W = 3, D = 13, H = 15;
const g = new Voxels([W, H, D]);

// ---- massing: mean roof per z-row over the three x columns, snapped to a whole block ----
const roofZ = [];
for (let z = 0; z < D; z++) {
  const col = cells.filter(([, cz]) => cz === z).map(([, , , roof]) => roof);
  roofZ.push(Math.round(col.reduce((a, b) => a + b, 0) / col.length));
}
const TOP_TIER = Math.max(...roofZ);

// ---- materials ----
const BRICK = "bricks", TRIM = "calcite", PLINTH = "stone_bricks", ROOF = "smooth_stone";
const GLASS = "glass_pane", PANE = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const BAND = new Set([3, 6, 9, 12]);                    // storey lines: a floor slab and a limestone string course
const PILASTER = new Set([0, 4, 8, 12]);               // limestone pilasters on the front, bay by bay
const SHOP = new Set([1, 2, 3, 9, 10, 11]);
const LOBBY = new Set([5, 6, 7]);
const DOOR_Z = 6;
const TOWER = (z) => roofZ[z] === TOP_TIER;
const TOWER_GLASS = (z) => TOWER(z) && (z === 6 || z === 7);

const set = (x, y, z, block, state) => g.set(x, y, z, block, state);

for (let z = 0; z < D; z++) {
  const top = roofZ[z] - 1;                                // highest occupied row
  const tower = TOWER(z);
  const top2 = tower ? 12 : top;                           // the front of the tower steps back to the terrace at y 12
  const endWall = z === 0 || z === D - 1;

  for (let y = 0; y <= top; y++) {
    // back wall (x=0): brick with calcite string courses; the tower's rear is open behind its glass
    if (!(tower && y >= 13)) set(0, y, z, y === top || BAND.has(y) ? TRIM : BRICK);
    // interior (x=1): air between the front glass and the back wall, slabs at each storey line and the roof
    if (endWall) set(1, y, z, y === top ? ROOF : BRICK);
    else if (y === 0 || BAND.has(y) || y === top) set(1, y, z, y === top && !tower ? ROOF : TRIM);
    else if (tower && y === 13 && TOWER_GLASS(z)) set(1, y, z, GLASS, PANE);
    // front (x=2): pilasters, string courses, shopfront and lobby on the ground, windows above
    if (y > top2) continue;
    if (y === 0) set(2, y, z, PLINTH);
    else if (endWall || PILASTER.has(z)) set(2, y, z, TRIM);
    else if (BAND.has(y) || y === top2) set(2, y, z, TRIM);
    else if (y <= 2) {                                     // ground storey
      if (LOBBY.has(z) && z === DOOR_Z) set(2, y, z, "dark_oak_door", { facing: "east", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      else if (LOBBY.has(z)) set(2, y, z, GLASS, PANE);
      else if (SHOP.has(z) && y === 1) set(2, y, z, "dark_oak_planks");
      else set(2, y, z, GLASS, PANE);
    } else set(2, y, z, GLASS, PANE);                     // upper window rows: panes in a brick wall, storey by storey
  }
}

// the lobby's entrance step: one block up from the street into the door
set(2, 0, DOOR_Z, "stone_brick_stairs", { facing: "east", half: "bottom", shape: "straight", waterlogged: "false" });

// the terrace railing on the tower's setback edge
for (const z of [6, 7]) set(2, 13, z, "iron_bars", PANE);

// warm light behind glass: glowstone and lanterns in the air gap, a few windows per storey
const LIGHTS = [
  [1, 1, 2, "lantern", { hanging: "false", waterlogged: "false" }],
  [1, 1, 10, "lantern", { hanging: "false", waterlogged: "false" }],
  [1, 5, 2, "glowstone"], [1, 5, 10, "glowstone"],
  [1, 8, 6, "shroomlight"],
  [1, 11, 2, "glowstone"],
  [0, 13, 7, "shroomlight"],
];
for (const [x, y, z, b, st] of LIGHTS) set(x, y, z, b, st);

g.save(`${DIR}/DC77030.nbt`);
console.log(`DC77030: ${g.count()} blocks, roof tiers ${roofZ.join(" ")}`);
