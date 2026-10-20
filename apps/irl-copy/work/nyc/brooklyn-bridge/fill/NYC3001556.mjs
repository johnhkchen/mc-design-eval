import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 26 Willow Street, Brooklyn Heights: 1848 brownstone rowhouse, three storeys
// over a stone raised basement, stoop entrance, cornice and parapet.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3001556.cells.json", "utf8"));

const W = 10, H = 23, D = 5;
const g = new Voxels([W, H, D]);

const WALL = "brown_terracotta";
const BASE = "stone_bricks";
const TRIM = "smooth_stone";
const PARAPET = "stone_brick_wall";
const FLOOR = "spruce_planks";
const GLASS = "glass_pane";

// Per-cell ground (foundation) and one shared roof line so tiers stay level.
const groundAt = new Map();
const roofs = [];
for (const [x, z, gr, rr] of cells) {
  groundAt.set(`${x},${z}`, Math.round(gr));
  roofs.push(Math.round(rr));
}
roofs.sort((a, b) => a - b);
const medianRoof = roofs[Math.floor(roofs.length / 2)];
const minGround = Math.min(...[...groundAt.values()]);
// One storey grid from the lowest ground; roof clamped to the box.
const BASE_Y = minGround;
const TOP = Math.min(Math.max(medianRoof, BASE_Y + 9), 20);

const DOOR_X = 4;

for (const [x, z] of [...groundAt.keys()].map(k => k.split(",").map(Number))) {
  const ground = groundAt.get(`${x},${z}`);
  const perimeter = x === 0 || x === W - 1 || z === 0 || z === D - 1;
  const frontOrBack = z === 0 || z === D - 1;
  const cornerCell = (x === 0 || x === W - 1) && (z === 0 || z === D - 1);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < ground; y++) g.set(x, y, z, BASE);

  // Body from this cell's ground to the shared top.
  for (let y = ground; y < TOP; y++) {
    const rel = y - BASE_Y;
    const k = Math.floor(rel / 2);
    const local = rel % 2;

    if (y === TOP - 1) { g.set(x, y, z, TRIM); continue; }

    if (perimeter) {
      if (y === TOP - 2 && frontOrBack) { g.set(x, y, z, TRIM); continue; }
      g.set(x, y, z, WALL);
      if (cornerCell) continue;

      if (local === 1 && y < TOP - 2) {
        if (z === 0) {
          if (x >= 1 && x <= 8 && x !== DOOR_X) g.set(x, y, z, GLASS);
        } else if (z === D - 1) {
          if (x >= 1 && x <= 8) g.set(x, y, z, GLASS);
        } else if (x === 0 || x === W - 1) {
          if (z >= 1 && z <= D - 2) g.set(x, y, z, GLASS);
        }
      }
      if (local === 0 && k >= 1 && frontOrBack && x >= 1 && x <= 8 && x !== DOOR_X) {
        g.set(x, y, z, TRIM); // sill course
      }
    } else {
      if (local === 0 && k >= 1) g.set(x, y, z, FLOOR);
    }
  }

  // Parapet course on perimeter, one level above the top.
  if (perimeter && TOP + 1 < H) g.set(x, TOP, z, PARAPET);
}

// Stoop and entrance on the street front (z = 0), x = DOOR_X.
{
  const gy = BASE_Y;
  // Stone steps rising to the door, inside the footprint.
  g.set(DOOR_X, gy, 0, "stone_brick_stairs", { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" });
  g.set(DOOR_X - 1, gy, 0, "stone_brick_stairs", { facing: "east", half: "bottom", shape: "straight", waterlogged: "false" });
  g.set(DOOR_X + 1, gy, 0, "stone_brick_stairs", { facing: "west", half: "bottom", shape: "straight", waterlogged: "false" });
  g.set(DOOR_X, gy + 1, 0, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(DOOR_X, gy + 2, 0, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Lintel and small hood over the door.
  for (const xx of [DOOR_X - 1, DOOR_X, DOOR_X + 1]) {
    g.set(xx, gy + 3, 0, TRIM);
  }
  g.set(DOOR_X, gy + 1, 1, "glowstone");
}

// Warm lights behind some front and back windows.
for (let x = 1; x <= 8; x++) {
  if (x === DOOR_X) continue;
  for (let k = 0; ; k++) {
    const y = BASE_Y + 2 * k + 1;
    if (y >= TOP - 2) break;
    if ((x + k) % 3 === 0) g.set(x, y, 1, "glowstone");
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3001556.nbt");
