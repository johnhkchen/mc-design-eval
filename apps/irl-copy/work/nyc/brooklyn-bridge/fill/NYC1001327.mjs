import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// NYC1001327 - 110 South Street, South Street Seaport Historic District
// Built 1819: a Federal-era brick mixed-use commercial/residential block.
// Load-bearing red brick walls on a stone base, a shopfront glass storey,
// upper storeys with sash windows framed in stone, one flat roof behind a
// stone cornice, and a single street door.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC1001327";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 5, H = 20, D = 18;
const g = new Voxels([W, H, D]);

// Smooth the lidar roof into one flat tier: quantise to even blocks, take the median.
const quantRoofs = cells.map((c) => 2 * Math.round(c[3] / 2)).sort((a, b) => a - b);
const TIER_ROOF = Math.min(H, quantRoofs[Math.floor(quantRoofs.length / 2)]);

const cellMap = new Map();
for (const [x, z, gr, ro] of cells) cellMap.set(`${x},${z}`, { gr, ro });
const has = (x, z) => cellMap.has(`${x},${z}`);

// Door on the lowest-z (street) face, nearest the middle of the frontage.
const minZ = Math.min(...cells.map((c) => c[1]));
const doorCands = cells
  .filter((c) => c[1] === minZ)
  .map((c) => c[0])
  .sort((a, b) => Math.abs(a - 2) - Math.abs(b - 2));
const DOOR = doorCands.length ? { x: doorCands[0], z: minZ } : null;

// Sash bays: on the long faces every third cell is a brick pier; on the
// street and back faces the bays sit at x = 1 and x = 3 beside the door pier.
function isWin(x, z) {
  if (z === 0 || z === D - 1) return x === 1 || x === 3;
  if (x === 0 || x === W - 1) return z >= 1 && z <= D - 2 && z % 3 !== 0;
  return false;
}

const lights = [];

for (const [x, z] of cells) {
  const c = cellMap.get(`${x},${z}`);
  const gr = Math.max(0, Math.min(H - 9, Math.round(c.gr)));
  const ro = Math.min(H, Math.max(TIER_ROOF, gr + 8));
  const top = ro - 1;

  const edge = !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Floor slabs: at the ground and at each upper storey line.
  const isFloor = (y) =>
    y === gr || (y >= gr + 3 && y <= top - 2 && (y - gr - 3) % 2 === 0);

  if (!edge) {
    // Interior: floor slabs and a roof deck; air between (no interiors).
    for (let y = gr; y <= top - 1; y++) {
      if (y === top - 1) g.set(x, y, z, "smooth_stone");
      else if (isFloor(y)) g.set(x, y, z, "oak_planks");
    }
    continue;
  }

  // Facade shell.
  for (let y = gr; y <= top; y++) {
    if (y === top) {
      g.set(x, y, z, "smooth_stone");                 // parapet cap
    } else if (y === top - 1) {
      g.set(x, y, z, "stone_bricks");                 // cornice band
    } else if (y === gr) {
      g.set(x, y, z, "stone_bricks");                 // base course
    } else if (y <= gr + 2) {
      // Ground storey: shopfront glass between brick piers.
      const shopGlass = isWin(x, z) || (
        !(z === 0 || z === D - 1) && (x === 0 || x === W - 1) && z >= 1 && z <= D - 2
      );
      g.set(x, y, z, shopGlass ? "glass" : "bricks");
      if (shopGlass) lights.push({ x, y, z, kind: "ground" });
    } else {
      const rel = y - gr - 3;
      if (rel % 2 === 0) {
        // Storey line: stone sill/lintel over window bays, brick elsewhere.
        g.set(x, y, z, isWin(x, z) ? "smooth_stone" : "bricks");
      } else if (isWin(x, z)) {
        g.set(x, y, z, "glass_pane");                 // sash glazing
        lights.push({ x, y, z, kind: "upper" });
      } else {
        g.set(x, y, z, "bricks");
      }
    }
  }
}

// Street door: lower and upper halves on the street face.
if (DOOR) {
  const c = cellMap.get(`${DOOR.x},${DOOR.z}`);
  const gr = Math.max(0, Math.min(H - 9, Math.round(c.gr)));
  g.set(DOOR.x, gr, DOOR.z, "oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(DOOR.x, gr + 1, DOOR.z, "oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
}

// Warm light behind some glass, placed in the interior cell directly behind
// each pane and standing on a floor slab.
for (const L of lights) {
  if ((L.x * 3 + L.z * 5 + L.y * 7) % 5 !== 0) continue;
  const tx = L.x === 0 ? 1 : L.x === W - 1 ? W - 2 : L.x;
  const tz = L.z === 0 ? 1 : L.z === D - 1 ? D - 2 : L.z;
  if (tx < 1 || tx > W - 2 || tz < 1 || tz > D - 2) continue;
  if (!has(tx, tz)) continue;
  if (L.kind === "ground") {
    g.set(tx, L.y, tz, "glowstone");                  // stands on the ground-floor slab
  } else {
    g.set(tx, L.y, tz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
