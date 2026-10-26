// Washington Hebrew Congregation (Greater New Hope Baptist Church), 816 8th St NW: a 1900s-era masonry hall in red brick
// with pale limestone trim. A two-storey body (roof ~9 blocks, lidar median 8) carries a clerestory nave at the centre
// (roof ~12, lidar median 12) and two square corner towers on the east front (roof 14, lidar median 14). The east
// front has the entrance between the towers. Hollow shell: an air gap behind each glass pane, a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC74342.cells.json", "utf8"));
const fp = new Set(cells.map(([x, z]) => `${x},${z}`));
const ground = new Map(cells.map(([x, z, gnd]) => [`${x},${z}`, gnd]));

const g = new Voxels([13, 26, 13]);

const inFp = (x, z) => fp.has(`${x},${z}`);
// every write goes through here: only footprint cells, and only up to the cell's own ground (foundation) and above
const put = (x, y, z, block, state) => { if (inFp(x, z) && y >= (ground.get(`${x},${z}`) ?? 0)) g.set(x, y, z, block, state); };
const box = (x0, x1, y, z0, z1, block, state) => { for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) put(x, y, z, block, state); };
const ring = (x0, x1, z0, z1, fn) => { for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) if (x === x0 || x === x1 || z === z0 || z === z1) fn(x, z); };

// window panes connect to the wall they sit in
const paneNS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };   // in a north or south wall
const paneEW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // in an east or west wall
const lantern = { hanging: "true", waterlogged: "false" };
const stairs = (facing) => ({ facing, half: "bottom", shape: "straight", waterlogged: "false" });

// Body: 13 x 13, roof deck at y 7, parapet at y 8 (roof ~9)
const isTower = (x, z) => x >= 9 && (z <= 3 || z >= 9);
const isMonitor = (x, z) => x >= 4 && x <= 8 && z >= 4 && z <= 8;

// base course and ground floor
box(0, 12, 0, 0, 12, "stone_bricks");

// Storey 1 (y 1-3) and storey 2 (y 5-6) walls on the outer ring; floor slab at y 4; cornice course at y 7
ring(0, 12, 0, 12, (x, z) => { for (let y = 1; y <= 6; y++) put(x, y, z, "bricks"); });
box(0, 12, 4, 0, 12, "smooth_stone");
ring(0, 12, 0, 12, (x, z) => put(x, 4, z, "calcite"));
box(0, 12, 7, 0, 12, "stone_bricks");
ring(0, 12, 0, 12, (x, z) => put(x, 7, z, "calcite"));
// corner piers
for (const [x, z] of [[0, 0], [0, 12], [12, 0], [12, 12]]) for (let y = 1; y <= 6; y++) put(x, y, z, "calcite");

// parapet: a continuous limestone coping on the body ring (the towers carry their own walls); merlons read as a castle
ring(0, 12, 0, 12, (x, z) => { if (!isTower(x, z)) put(x, 8, z, "calcite"); });

// windows: glass panes with a calcite sill at y 1 (and at y 4 for the upper row, the string course)
const windowRow = (x, z, panes) => {
  for (const y of [2, 3, 5, 6]) put(x, y, z, "glass_pane", panes);
  put(x, 1, z, "calcite");
};
for (const x of [2, 5, 8]) { windowRow(x, 0, paneNS); windowRow(x, 12, paneNS); }
for (const z of [3, 6, 9]) windowRow(0, z, paneEW);

// east front: the entrance between the two towers, with pilasters and a lintel
windowRow(12, 4, paneEW); windowRow(12, 8, paneEW);
for (const z of [5, 7]) for (let y = 1; y <= 3; y++) put(12, y, z, "calcite");
for (const z of [5, 6, 7]) put(12, 3, z, "calcite");
put(12, 1, 6, "dark_oak_door", { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" });
put(12, 2, 6, "dark_oak_door", { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" });

// interior lights behind some windows (the gap behind the glass), hanging from the floor slab above
put(5, 3, 1, "lantern", lantern);
put(5, 3, 11, "lantern", lantern);
put(1, 3, 6, "lantern", lantern);
put(11, 5, 4, "glowstone");
put(8, 5, 11, "glowstone");
put(1, 5, 9, "glowstone");

// rooftop plant on the body deck
box(2, 3, 8, 2, 2, "iron_block");

// Clerestory nave, centre (x 4-8, z 4-8): walls y 8-10, roof deck y 11 (roof 12)
ring(4, 8, 4, 8, (x, z) => { for (let y = 8; y <= 10; y++) put(x, y, z, "bricks"); });
ring(4, 8, 4, 8, (x, z) => put(x, 8, z, "calcite"));
box(4, 8, 11, 4, 8, "stone_bricks");
ring(4, 8, 4, 8, (x, z) => put(x, 11, z, "calcite"));
put(6, 9, 4, "glass_pane", paneNS); put(6, 10, 4, "glass_pane", paneNS);
put(6, 9, 8, "glass_pane", paneNS); put(6, 10, 8, "glass_pane", paneNS);
put(4, 9, 6, "glass_pane", paneEW); put(4, 10, 6, "glass_pane", paneEW);
put(8, 9, 6, "glass_pane", paneEW); put(8, 10, 6, "glass_pane", paneEW);
put(6, 10, 6, "lantern", lantern);

// Two corner towers on the east front: x 9-12, z 0-3 (north) and z 9-12 (south). Walls y 8-12, floor slab at y 11,
// floor at y 12, roof with a stepped rim at y 13 (roof 14), pinnacles at the corners.
const towers = [
  { z0: 0, z1: 3, outward: "north", glassFace: "north", glassZ: 0, eastZs: [1, 2], northZ: 0 },
  { z0: 9, z1: 12, outward: "south", glassFace: "south", glassZ: 12, eastZs: [10, 11], northZ: 12 },
];
for (const t of towers) {
  const { z0, z1 } = t;
  ring(9, 12, z0, z1, (x, z) => { for (let y = 8; y <= 12; y++) put(x, y, z, "bricks"); });
  box(9, 12, 11, z0, z1, "calcite");
  box(9, 12, 12, z0, z1, "smooth_stone");
  ring(9, 12, z0, z1, (x, z) => put(x, 12, z, "bricks"));
  // rim at y 13: stairs on the ring with their tall side outward, flat stone inside, calcite pinnacle at corners
  box(10, 11, 13, z0 + 1, z1 - 1, "stone_bricks");
  for (const x of [10, 11]) {
    put(x, 13, z0, "stone_brick_stairs", stairs("south"));
    put(x, 13, z1, "stone_brick_stairs", stairs("north"));
  }
  for (const z of [z0 + 1, z0 + 2]) {
    put(9, 13, z, "stone_brick_stairs", stairs("east"));
    put(12, 13, z, "stone_brick_stairs", stairs("west"));
  }
  for (const [x, z] of [[9, z0], [12, z0], [9, z1], [12, z1]]) { put(x, 13, z, "calcite"); put(x, 14, z, "calcite"); }
  // windows on the two outer faces: the front and the east
  for (const x of [10, 11]) for (const y of [9, 10]) put(x, y, t.glassZ, "glass_pane", paneNS);
  for (const z of t.eastZs) for (const y of [9, 10]) put(12, y, z, "glass_pane", paneEW);
  for (const x of [10, 11]) put(x, 8, t.glassZ, "calcite");
  for (const z of t.eastZs) put(12, 8, z, "calcite");
  put(10, 10, z0 + 2, "lantern", lantern);
}

const { blocks, palette } = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC74342.nbt");
console.log(`DC74342.nbt: ${blocks} blocks, palette ${palette}`);
