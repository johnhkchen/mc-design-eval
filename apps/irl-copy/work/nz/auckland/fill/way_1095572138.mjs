// Way 1095572138, Eden Terrace side of the Maungawhau view: a two-storey interwar brick shop block with a one-storey
// rear wing and a three-storey corner tower. The lidar roof heights snap to three flat tiers: 4 = one storey, 7 = two
// storeys over a parapet, 10 = three storeys and the tower's parapet. Storeys are 3 blocks of air under a floor
// slab (the cells' roofs are their top solid layer), string courses sit on the floor lines, the shopfront is glass
// on the street side with a timber-hooded door, and the upper windows are 2-wide glass with brick piers between.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095572138.cells.json", "utf8"));

const BASE = "stone_bricks", BRICK = "bricks", STRING = "smooth_stone", FLOOR = "smooth_stone";
const QUOIN = "smooth_quartz", COPING = "stone_brick_slab", GLASS = "glass_pane", LIGHT = "glowstone", PLANT = "iron_block";

// per tier: the string-course rows, the window bands (y ranges), and the top (roof deck) layer
const TIER = {
  4: { strings: [], bands: [[1, 2]], top: 3 },
  7: { strings: [3], bands: [[1, 2], [4, 5]], top: 6 },
  10: { strings: [3, 6], bands: [[1, 2], [4, 5], [7, 8]], top: 9 },
};
const DIRS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const roofOf = new Map(cells.map(([x, z, , roof]) => [`${x},${z}`, roof]));
// a lone 1-cell peak in the lidar reads as a chimney, so the three-storey tier needs a cluster of 2+ tall cells
const tall = (x, z) => (roofOf.get(`${x},${z}`) ?? 0) >= 9;
const tallCluster = (x, z) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => tall(x + dx, z + dz));
const tierOf = (x, z, roof) => (roof >= 9 && tallCluster(x, z) ? 10 : roof >= 6 ? 7 : 4);
const plan = new Map();
for (const [x, z, ground, roof] of cells) plan.set(`${x},${z}`, { x, z, ground, tier: tierOf(x, z, roof) });
const cellAt = (x, z) => plan.get(`${x},${z}`);
const exposed = (c) => Object.keys(DIRS).filter((d) => !cellAt(c.x + DIRS[d][0], c.z + DIRS[d][1]));
const isRing = (c) => exposed(c).length > 0;

// the street side: the face with the most exposed cells (corners count on both faces)
const count = { north: 0, south: 0, east: 0, west: 0 };
for (const c of plan.values()) for (const d of exposed(c)) count[d]++;
const front = Object.keys(count).reduce((a, b) => (count[b] > count[a] ? b : a));
const alongFront = (c) => (front === "north" || front === "south" ? c.x : c.z);
const frontCells = [...plan.values()].filter((c) => exposed(c).length === 1 && exposed(c)[0] === front).sort((a, b) => alongFront(a) - alongFront(b));
const doorCell = frontCells[Math.floor(frontCells.length / 2)];
const isDoor = (c) => c === doorCell;

const pane = (d) => (d === "north" || d === "south"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
const stair = (facing, half) => ({ facing, half, shape: "straight", waterlogged: "false" });
const slab = (type) => ({ type, waterlogged: "false" });
const door = (facing, half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });

const g = new Voxels([13, 23, 9]);
let windows = 0;

for (const c of plan.values()) {
  const S = TIER[c.tier];
  for (let y = 0; y < c.ground; y++) g.set(c.x, y, c.z, BASE);
  g.set(c.x, 0, c.z, BASE);                                   // base course, and the ground floor slab
  const ex = exposed(c);
  if (!isRing(c)) {                                           // interior: air between the floor slabs
    for (const y of [...S.strings, S.top]) g.set(c.x, y, c.z, FLOOR);
    continue;
  }
  const corner = ex.length > 1;
  const face = ex.includes(front) ? front : ex[0];           // the window face a corner cell is read from
  const onFront = face === front;
  for (let y = 1; y < S.top; y++) {
    if (S.strings.includes(y)) {                              // string course at the floor line
      if (isDoor(c) && onFront && y === 3) g.set(c.x, y, c.z, "oak_stairs", stair(front, "top"));   // timber hood over the door
      else g.set(c.x, y, c.z, STRING);
      continue;
    }
    const ground = y <= 2;
    if (onFront && ground && isDoor(c)) {                     // the door, two blocks tall, hinged left
      g.set(c.x, y, c.z, "dark_oak_door", door(front, y === 1 ? "lower" : "upper"));
      continue;
    }
    if (corner && !(onFront && ground)) { g.set(c.x, y, c.z, QUOIN); continue; }
    const bay = face === "north" || face === "south" ? c.x : c.z;
    const glazed = onFront && ground ? true : bay % 3 !== 0;  // shopfront is all glass; upper bays 2 glass : 1 pier
    if (!glazed) { g.set(c.x, y, c.z, BRICK); continue; }
    g.set(c.x, y, c.z, GLASS, pane(face));
    windows++;
    // warm light behind some panes: one cell inside the glass, in the air gap
    const ic = cellAt(c.x - DIRS[face][0], c.z - DIRS[face][1]);
    const lit = onFront && ground ? bay % 4 === 0 : bay % 6 === 1 && y > 3;
    if (lit && ic && !isRing(ic) && y < TIER[ic.tier].top && !TIER[ic.tier].strings.includes(y)) g.set(ic.x, y, ic.z, LIGHT);
  }
  g.set(c.x, S.top, c.z, BRICK);                              // parapet over the walls
  g.set(c.x, S.top + 1, c.z, COPING, slab("bottom"));         // coping on the parapet
}

// roof plant on the two-storey roof: two packaged air units on the deck
for (const [x, z] of [[5, 4], [6, 4]]) {
  const c = cellAt(x, z);
  if (c && !isRing(c) && c.tier === 7) g.set(x, 7, z, PLANT);
}

const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095572138.nbt");
console.log(`front=${front} door=(${doorCell.x},${doorCell.z}) windows=${windows}`, out);
