import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001530";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 14, H = 25, D = 6;
const g = new Voxels([W, H, D]);

const has = new Set(cells.map(([x, z]) => `${x},${z}`));
const inFp = (x, z) => has.has(`${x},${z}`);

// Base floor at the highest ground under the footprint; roof at the median lidar height.
const B = Math.max(...cells.map((c) => c[2]));
const roofs = cells.map((c) => c[3]).sort((a, b) => a - b);
const R = Math.min(22, Math.round(roofs[Math.floor(roofs.length / 2)]));
const C = R - 2; // cornice band start (two blocks tall)

// Ground storey 3 blocks, upper storeys 2 blocks each.
const starts = [B];
for (let s = B + 3; s <= C - 2; s += 2) starts.push(s);
const upperStarts = starts.slice(1);

const SAND = "smooth_sandstone";
const BRICK = "bricks";
const STONE = "stone_bricks";

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const isBay = (x) => (x >= 3 && x <= 4) || (x >= 7 && x <= 8) || (x >= 11 && x <= 12);
const isFrame = (x) => x === 2 || x === 5 || x === 6 || x === 9 || x === 10;
const paneX = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const paneZ = { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };

// Glass rows: ground storey B+1..B+2, upper storeys s+1 only.
const glassRow = (y) =>
  (y >= B + 1 && y <= B + 2) || upperStarts.some((s) => y === s + 1);
// Sill / string rows: the ground-storey top course and each upper storey base.
const sillRow = (y) => y === B + 3 || upperStarts.includes(y);

// Warm interior lights behind selected glass
const lightSpots = new Set([`3,${B + 1},1`, `9,${B + 1},1`]);
upperStarts.forEach((s, i) => {
  lightSpots.add(i % 2 === 0 ? `7,${s + 1},1` : `11,${s + 1},1`);
});

for (const [x, z] of cells) {
  // Foundation: solid up to the base level so nothing floats on the slope
  for (let y = 0; y < B; y++) put(x, y, z, STONE);

  const front = z === 0;
  const back = z === D - 1;
  const westF = x === 0;
  const eastF = x === W - 1;
  const perim = !inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1);

  if (!perim) {
    // Interior: floor slabs at storey lines, roof deck on top, air elsewhere
    for (const s of starts) put(x, s, z, "oak_planks");
    put(x, R - 1, z, "smooth_stone");
    for (let y = B; y < R - 1; y++) {
      if (lightSpots.has(`${x},${y},${z}`)) put(x, y, z, "glowstone");
    }
    continue;
  }

  const onFaceFB = front || back;
  const corner = (westF || eastF) && onFaceFB;

  for (let y = B; y < C; y++) {
    let id = BRICK;
    let props;

    if (corner) {
      id = STONE; // stone quoins at the corners
    } else if (y === B) {
      id = SAND; // base course
    } else if (sillRow(y)) {
      id = SAND; // string course at floor lines
    }

    if (onFaceFB && !corner) {
      if (y === B) {
        id = SAND;
      } else if (isBay(x) && glassRow(y) && !(front && x === 1)) {
        id = "glass_pane";
        props = paneX;
      } else if (isFrame(x) && (glassRow(y) || (y >= B + 1 && y <= B + 2))) {
        id = SAND; // window surrounds
      }
    }

    // Street-front entrance: sandstone surround, door, transom
    if (front && x === 1) {
      if (y === B || y === B + 1) {
        id = "dark_oak_door";
        props = {
          facing: "north",
          half: y === B ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        };
      } else if (y === B + 2) {
        id = "glass_pane";
        props = paneX;
      } else if (y === B + 3) {
        id = SAND; // lintel over door
      }
    }
    if (front && (x === 0 || x === 2) && y >= B + 1 && y <= B + 2) {
      id = SAND;
    }

    // Side-wall windows on the ends (z = 2)
    if ((westF || eastF) && !onFaceFB && z === 2) {
      if (glassRow(y)) {
        id = "glass_pane";
        props = paneZ;
      } else if (sillRow(y)) {
        id = SAND;
      } else {
        id = BRICK;
      }
    }

    put(x, y, z, id, props);
  }

  // Cornice band with a slab cap
  for (let y = C; y < R; y++) {
    if (y === R - 1) put(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
    else put(x, y, z, STONE);
  }
}

// Brick chimney on the roof, standing on the interior roof deck
if (inFp(12, 3) && R + 2 <= H - 1) {
  put(12, R, 3, BRICK);
  put(12, R + 1, 3, BRICK);
  put(12, R + 2, 3, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
