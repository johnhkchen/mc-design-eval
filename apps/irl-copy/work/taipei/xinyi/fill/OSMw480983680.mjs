import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw480983680";
const W = 41, H = 71, D = 42;

// Vertical plan (absolute y, y 0 = lowest ground)
const PODIUM_TOP = 11;   // two-storey stone podium ends here
const SETBACK_Y = 36;    // tower steps back: outer 3-cell ring stops here
const DECK_Y = 56;       // tower roof deck
const TOP_Y = 59;        // parapet / penthouse cap, roof about 59

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);

const FOOT = (x, z) => ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);
// true when every cell within Chebyshev distance n-1 is inside the footprint
const deep = (x, z, n) => {
  for (let dx = -(n - 1); dx <= n - 1; dx++)
    for (let dz = -(n - 1); dz <= n - 1; dz++)
      if (!FOOT(x + dx, z + dz)) return false;
  return true;
};
const inTier = (x, z, y) => FOOT(x, z) && (y < SETBACK_Y || deep(x, z, 4));
const isWall = (x, z, y) =>
  inTier(x, z, y) &&
  [[0, -1], [0, 1], [-1, 0], [1, 0]].some(([dx, dz]) => !inTier(x + dx, z + dz, y));
const faceOf = (x, z, y) => {
  if (!inTier(x, z - 1, y)) return "N";
  if (!inTier(x, z + 1, y)) return "S";
  if (!inTier(x - 1, z, y)) return "W";
  return "E";
};
const OUT = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const IN = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };
const FACING = { N: "north", S: "south", W: "west", E: "east" };

// Penthouse: plant room set well inside the tower top
const penthouse = (x, z) => deep(x, z, 9);

// Front entrance: street-facing edge (south if present), cell nearest the middle
const frontFace = cells.some(([x, z]) => !FOOT(x, z + 1)) ? "S" : "N";
const [fox, foz] = OUT[frontFace];
const frontCells = cells.filter(([x, z]) => !FOOT(x + fox, z + foz));
const aIdx = frontFace === "N" || frontFace === "S" ? 0 : 1;
const aVals = frontCells.map((c) => c[aIdx]);
const mid = (Math.min(...aVals) + Math.max(...aVals)) / 2;
const doorCell = [...frontCells].sort((p, q) => Math.abs(p[aIdx] - mid) - Math.abs(q[aIdx] - mid))[0];
const doorX = doorCell ? doorCell[0] : -1;
const doorZ = doorCell ? doorCell[1] : -1;

function wallBlock(a, y, gr) {
  if (y >= DECK_Y) {
    if (y === DECK_Y) return { id: "smooth_stone" };
    return { id: a % 4 === 0 ? "chiseled_stone_bricks" : "stone_bricks" };
  }
  if (y <= PODIUM_TOP && y - gr <= 4) {           // shopfront band at street level
    if (y - gr === 4) return { id: "smooth_stone" };
    if (a % 4 === 0) return { id: "polished_andesite" };
    return { id: "light_blue_stained_glass", glass: true };
  }
  if (y <= PODIUM_TOP) {                           // stone podium with windows
    if (y % 5 === 0) return { id: "smooth_stone" };
    if (a % 3 === 0 || y % 5 === 4) return { id: "white_concrete" };
    return { id: "light_blue_stained_glass", glass: true };
  }
  if (y % 5 === 0) return { id: "light_gray_concrete" };   // storey spandrel
  if (a % 3 === 0) return { id: "gray_concrete" };         // curtain-wall mullion
  return { id: "cyan_stained_glass", glass: true };
}

const lit = (face, a, y) => (a * 7 + y * 3 + face.charCodeAt(0)) % 5 === 0;

const g = new Voxels([W, H, D]);

for (const [x, z, gr] of cells) {
  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y <= gr; y++) g.set(x, y, z, "stone");

  const ringCell = !inTier(x, z, SETBACK_Y); // outer ring that stops at the setback

  for (let y = gr + 1; y <= TOP_Y; y++) {
    if (ringCell && y >= SETBACK_Y) continue;
    if (ringCell && y === SETBACK_Y - 1) { // terrace deck at the setback
      g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (!inTier(x, z, y)) continue;

    if (isWall(x, z, y)) {
      const face = faceOf(x, z, y);
      const a = face === "N" || face === "S" ? x : z;
      const isDoor = x === doorX && z === doorZ;

      if (isDoor && y === gr + 1) {
        g.set(x, y, z, "dark_oak_door", {
          facing: FACING[frontFace], half: "lower", hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      if (isDoor && y === gr + 2) {
        g.set(x, y, z, "dark_oak_door", {
          facing: FACING[frontFace], half: "upper", hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      if (isDoor && y === gr + 3) {
        g.set(x, y, z, "smooth_stone"); // lintel over entrance
        continue;
      }

      const wb = wallBlock(a, y, gr);
      g.set(x, y, z, wb.id);

      // warm light inside some lit windows (one block behind the glass)
      if (wb.glass && y % 5 === 2 && lit(face, a, y)) {
        const [ix, iz] = IN[face];
        if (inTier(x + ix, z + iz, y) && !isWall(x + ix, z + iz, y)) {
          g.set(x + ix, y, z + iz, "shroomlight");
        }
      }
      continue;
    }

    // interior: storey slabs, roof deck, penthouse
    if (penthouse(x, z) && y >= 57 && y <= 58) {
      const edge = [[0, -1], [0, 1], [-1, 0], [1, 0]].some(([dx, dz]) => !penthouse(x + dx, z + dz));
      if (edge) g.set(x, y, z, x % 2 === 0 ? "gray_concrete" : "iron_bars");
      continue;
    }
    if (penthouse(x, z) && y === TOP_Y) {
      g.set(x, y, z, "stone_bricks");
      continue;
    }
    if (y % 5 === 0 && y <= DECK_Y - 1) {
      g.set(x, y, z, "light_gray_concrete"); // storey floor slab
    } else if (y === DECK_Y) {
      g.set(x, y, z, "gray_concrete");       // tower roof deck
    }
  }
}

// Guard rail on the outer edge of the setback terrace
for (const [x, z, gr] of cells) {
  if (gr >= SETBACK_Y) continue;
  if (inTier(x, z, SETBACK_Y)) continue;
  const outer = [[0, -1], [0, 1], [-1, 0], [1, 0]].some(([dx, dz]) => !FOOT(x + dx, z + dz));
  if (outer) g.set(x, SETBACK_Y, z, "stone_brick_wall");
}

g.save(`${DIR}/${ID}.nbt`);
