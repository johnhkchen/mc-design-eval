// 926 S St NW (Shaw): a three-bay red-brick Victorian row house (c. 1890-1910 DC rowhouse, brownstone-style
// stringcourses and cornice) on the footprint from the lidar: a 2-wide street block that stands 3 above its
// raised ground, a 3-wide rear that drops to grade and shows its extra storey, and a 2-block setback at the rear
// corner. Party walls on the flanks (plain brick), windows on the street, rear and notch faces. Each storey is a
// window row (glass with an air gap behind, glowstone in one) over a floor slab / string course, so nothing floats.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC76358.cells.json`, "utf8"));

const W = 3, H = 18, D = 8;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const info = new Map();
for (const [x, z, ground, roof] of cells) info.set(key(x, z), { ground, roof });
const inside = (x, z) => info.has(key(x, z));
// a perimeter cell has a neighbour outside the footprint; an interior cell is all four neighbours in
const perimeter = (x, z) => !(inside(x - 1, z) && inside(x + 1, z) && inside(x, z - 1) && inside(x, z + 1));

const BASE = "stone_bricks", BRICK = "bricks", BAND = "smooth_stone", CORNICE = "smooth_stone";
const ROOF = "stone", FLOOR = "spruce_planks", GLASS = "glass_pane", GLOW = "glowstone";

// the openings: window cells on rows y1 and y3, door cells, and the lit window
const WIN1 = new Set(["0,7", "2,7", "1,0", "1,1", "1,2"]);     // ground-floor windows: rear corners, street bay, notch side
const WIN3 = new Set(["0,7", "1,7", "2,7"]);                  // upper window row on the rear face
const DOOR_FRONT = [0, 0];                                     // street door (lower y1, upper y2), facing north
const DOOR_REAR = [1, 7];                                      // rear door, facing south
const GLOWS = ["1,1,6", "1,3,6"];                              // warm light behind the rear window and in the hall

for (const [x, z, ground, roof] of cells) {
  const perim = perimeter(x, z);
  for (let y = 0; y < roof; y++) {
    if (y < ground) { g.set(x, y, z, BASE); continue; }     // foundation under the raised ground
    if (y === roof - 1) { g.set(x, y, z, perim ? CORNICE : ROOF); continue; }
    if (y === 0) { g.set(x, y, z, perim ? BASE : FLOOR); continue; }
    if (y === 2 || y === 4) { g.set(x, y, z, perim ? (y === 4 ? BAND : BRICK) : FLOOR); continue; }   // brick course, stone string under the cornice
    // y 1 and y 3: the window rows
    if (!perim) { if (GLOWS.includes(`${x},${y},${z}`)) g.set(x, y, z, GLOW); continue; }   // air behind the glass
    const k = key(x, z);
    const win = (y === 1 && WIN1.has(k)) || (y === 3 && WIN3.has(k));
    g.set(x, y, z, win ? GLASS : BRICK);
  }
}

// the canopy over the street door, on the cornice; the chimney on the rear corner's roof
g.set(DOOR_FRONT[0], 4, DOOR_FRONT[1], "dark_oak_slab", { type: "bottom", waterlogged: "false" });
g.set(2, 6, 6, "bricks"); g.set(2, 7, 6, "bricks");

// doors: a lower and an upper half, set over the band and the brick
const door = (x, z, facing) => {
  g.set(x, 1, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, 2, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
};
door(DOOR_FRONT[0], DOOR_FRONT[1], "north");
door(DOOR_REAR[0], DOOR_REAR[1], "south");

// glass panes connect to their neighbours (glass, or a solid block), as a placed pane would
const SOLID = new Set([BASE, BRICK, BAND, CORNICE, ROOF, FLOOR, GLOW, "bricks"]);
const sideOf = (x, y, z) => {
  const b = g.get(x, y, z)?.block;
  return b === "minecraft:glass_pane" || b === "glass_pane" || SOLID.has(b) || SOLID.has(b?.replace("minecraft:", ""));
};
for (const k of [...WIN1].map((s) => [...s.split(",").map(Number), 1]).concat([...WIN3].map((s) => [...s.split(",").map(Number), 3]))) {
  const [x, z, y] = k;
  const st = { north: sideOf(x, y, z - 1), south: sideOf(x, y, z + 1), east: sideOf(x + 1, y, z), west: sideOf(x - 1, y, z), waterlogged: "false" };
  const s = Object.fromEntries(Object.entries(st).map(([a, b]) => [a, String(b)]));
  g.set(x, y, z, GLASS, s);
}

g.save(`${DIR}/DC76358.nbt`);
