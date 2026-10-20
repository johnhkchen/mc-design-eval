import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001525";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 30 Hicks Street: 1906 red-brick multi-family walk-up, Brooklyn Heights.
// One common cornice line (lidar roof, smoothed to a single tier), floors on a
// common 2-block grid, brick walls with stone string courses, paired windows
// between brick piers, a dark-oak entrance with lanterns, and a stair bulkhead.
const W = 14, H = 24, D = 6;
const g = new Voxels([W, H, D]);

const cellMap = new Map();
for (const [x, z, ground, roof] of cells) {
  cellMap.set(`${x},${z}`, { ground: Math.round(ground), roof: Math.round(roof) });
}
const has = (x, z) => cellMap.has(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Smoothed roof: one cornice height for the whole building (median of lidar roofs).
const roofs = [...cellMap.values()].map(v => v.roof).sort((a, b) => a - b);
const medRoof = roofs[Math.floor(roofs.length / 2)];
const T = Math.min(H - 6, Math.max(4, medRoof - 2)); // cornice row; parapet at T+1

const put = (x, y, z, block, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// Window columns on the street and rear faces: paired windows between piers.
const WIN = new Set([1, 2, 4, 5, 7, 8, 10, 11]);
const glassProps = (east, west, north, south) => ({
  east: east ? "true" : "false",
  west: west ? "true" : "false",
  north: north ? "true" : "false",
  south: south ? "true" : "false",
  waterlogged: "false",
});
const lampFlag = (a, k) => (a * 3 + k * 5) % 7 === 0;

for (const [key, info] of cellMap) {
  const [x, z] = key.split(",").map(Number);
  const gy = info.ground;
  const perim = isEdge(x, z);

  // Foundation: solid stone base up to this cell's ground.
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  for (let y = gy; y <= T - 1; y++) {
    const floorRow = (T - y) % 2 === 0 && y <= T - 2; // storey string line
    const winRow = (T - y) % 2 === 1 && y - 1 >= gy;   // glazing band
    const k = Math.floor((T - y) / 2);

    if (perim) {
      if (y === gy) {
        put(x, y, z, "stone_bricks"); // base course
        continue;
      }
      if (floorRow) {
        put(x, y, z, "stone_bricks"); // stone string course, solid
        continue;
      }
      if (winRow) {
        const frontWin = z === 0 && WIN.has(x);
        const backWin = z === D - 1 && WIN.has(x);
        const sideWin = (x === 0 || x === W - 1) && z >= 1 && z <= D - 2;
        if (frontWin) {
          put(x, y, z, "glass_pane", glassProps(WIN.has(x + 1), WIN.has(x - 1), false, false));
          if (lampFlag(x, k)) put(x, y, 1, "glowstone");
        } else if (backWin) {
          put(x, y, z, "glass_pane", glassProps(WIN.has(x + 1), WIN.has(x - 1), false, false));
          if (lampFlag(x, k + 1)) put(x, y, D - 2, "glowstone");
        } else if (sideWin) {
          put(x, y, z, "glass_pane", glassProps(false, false, z - 1 >= 1, z + 1 <= D - 2));
          if (lampFlag(z, k)) put(x === 0 ? 1 : W - 2, y, z, "glowstone");
        } else {
          put(x, y, z, "bricks");
        }
        // Ground-floor lanterns flanking the entrance.
        if (y === gy + 1 && z === 0 && (x === 5 || x === 7)) {
          put(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
        }
        continue;
      }
      put(x, y, z, "bricks");
    } else {
      // Interior: floor slabs only, air behind the glass.
      if (floorRow || y === gy) put(x, y, z, "smooth_stone");
    }
  }

  // Entrance door on the street face at the centre pier.
  if (z === 0 && x === 6) {
    put(x, gy, z, "dark_oak_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    put(x, gy + 1, z, "dark_oak_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
    });
  }

  // Cornice and coping; interior roof cover.
  if (perim) {
    put(x, T, z, "smooth_stone");
    put(x, T + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  } else {
    put(x, T, z, "stone");
  }
}

// Stair bulkhead on the flat roof: a small brick box with a stone cap.
for (let z = 2; z <= 3; z++) {
  for (let x = 9; x <= 10; x++) {
    if (!has(x, z)) continue;
    for (let y = T + 1; y <= T + 3; y++) put(x, y, z, "bricks");
    put(x, T + 4, z, "smooth_stone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
