// 938 French St NW: a brick rowhouse conversion, two entrances on the street face (z 0), flat roof at 5 blocks.
// Storeys: base course (y0), ground-storey windows (y1), storey line and floor slab (y2), upper windows (y3), dentil
// cornice (y4). Walls are bricks; the stone and calcite bands give the Washington rowhouse its pale trim.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC68856.cells.json`, "utf8"));
// the plan is drawn for level ground under a flat 5-block roof, which is what the lidar gives on every cell
if (cells.some(([, , g, r]) => g !== 0 || r !== 5)) throw new Error("plan is for ground 0 and roof 5 on every cell");

const W = 10, ROOF = 5;
const DOORS = [2, 7];                    // entrance bays, one per two-unit half
const GROUND_WIN = [1, 3, 6, 8];
const UPPER_WIN = [1, 2, 3, 6, 7, 8];
const GLOW = { "1,1,1": "glowstone", "6,3,1": "glowstone", "8,3,1": "shroomlight" };   // warm light behind the glass
const SOLID = new Set(["bricks", "stone_bricks", "calcite", "smooth_stone", "chiseled_stone_bricks"]);

const plan = new Map();
const put = (x, y, z, block, state) => plan.set(`${x},${y},${z}`, { block, state });
const get = (x, y, z) => plan.get(`${x},${y},${z}`);
const door = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });

for (let x = 0; x < W; x++) {
  const isDoor = DOORS.includes(x), isGround = GROUND_WIN.includes(x), isUpper = UPPER_WIN.includes(x);
  // y0 base course; the entrances open through it
  if (isDoor) { put(x, 0, 0, "dark_oak_door", door("lower")); put(x, 0, 1, "air"); }
  else { put(x, 0, 0, "stone_bricks"); put(x, 0, 1, "stone_bricks"); }
  // y1 ground storey: door tops, glass panes, brick between; air behind the glass
  if (isDoor) { put(x, 1, 0, "dark_oak_door", door("upper")); put(x, 1, 1, "air"); }
  else if (isGround) { put(x, 1, 0, "glass_pane"); put(x, 1, 1, "air"); }
  else { put(x, 1, 0, "bricks"); put(x, 1, 1, "bricks"); }
  // y2 storey line and floor slab
  put(x, 2, 0, "calcite"); put(x, 2, 1, "calcite");
  // y3 upper storey
  if (isUpper) { put(x, 3, 0, "glass_pane"); put(x, 3, 1, "air"); }
  else { put(x, 3, 0, "bricks"); put(x, 3, 1, "bricks"); }
  // y4 dentil cornice on the street, flat roof behind
  put(x, 4, 0, x % 2 === 0 ? "stone_bricks" : "chiseled_stone_bricks");
  put(x, 4, 1, "smooth_stone");
}

// warm lights behind the glass, and two chimney stacks on the roof at the back
for (const [k, block] of Object.entries(GLOW)) { const [x, y, z] = k.split(",").map(Number); put(x, y, z, block); }
put(0, ROOF, 1, "bricks"); put(W - 1, ROOF, 1, "bricks");

// glass panes join the neighbouring panes and solid walls, as a player would see them
const joins = (x, y, z) => { const n = get(x, y, z); return !!n && (n.block === "glass_pane" || SOLID.has(n.block)); };
for (const [k, n] of plan) {
  if (n.block !== "glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  n.state = { north: "false", south: "false", east: String(joins(x + 1, y, z)), west: String(joins(x - 1, y, z)) };
}

const g = new Voxels([10, 17, 2]);
for (const [k, n] of plan) {
  if (n.block === "air") continue;
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, n.block, n.state);
}

console.log(g.save(`${DIR}/DC68856.nbt`));
