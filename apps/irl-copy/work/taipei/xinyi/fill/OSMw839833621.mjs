import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw839833621";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 17, H = 23, D = 13;
const g = new Voxels([W, H, D]);

// Footprint lookup
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const inFp = (x, z) => ground.has(key(x, z));
const isPerim = (x, z) => !inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1);
const isCorner = (x, z) => (!inFp(x - 1, z) || !inFp(x + 1, z)) && (!inFp(x, z - 1) || !inFp(x, z + 1));

// Common datum: lowest ground under the building; roof/parapet top 11 blocks above it
const y0 = Math.min(...cells.map(c => c[2]));
const deckY = y0 + 10;     // roof slab (top of storey 2)
const roofTop = y0 + 11;   // parapet cap
const storeyLines = [y0 + 5, y0 + 10];

const put = (x, y, z, b, p) => { if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b); };

// Interior neighbour of a perimeter cell (for hanging lanterns behind the glass)
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
function interiorNeighbour(x, z) {
  for (const [dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (inFp(nx, nz) && !isPerim(nx, nz)) return [nx, nz];
  }
  return null;
}

// Entrance: prefer the south (+z) street frontage, nearest the middle
const cx = cells.reduce((s, c) => s + c[0], 0) / cells.length;
const outward = (x, z) =>
  !inFp(x, z + 1) ? "south" : !inFp(x, z - 1) ? "north" : !inFp(x + 1, z) ? "east" : "west";
const doorCands = cells
  .filter(([x, z]) => isPerim(x, z) && !isCorner(x, z))
  .sort((a, b) => {
    const sa = outward(a[0], a[1]) === "south" ? 0 : 1;
    const sb = outward(b[0], b[1]) === "south" ? 0 : 1;
    return sa - sb || Math.abs(a[0] - cx) - Math.abs(b[0] - cx);
  });
const doorCell = doorCands.length ? doorCands[0] : null;
const doorKey = doorCell ? key(doorCell[0], doorCell[1]) : null;

for (const [x, z, gr] of cells) {
  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const perim = isPerim(x, z);
  const corner = isCorner(x, z);

  // Floor slabs: ground-floor level for this cell, then the common storey lines above it
  const levels = [...new Set([gr, ...storeyLines.filter(L => L > gr)])].sort((a, b) => a - b);
  for (const L of levels) put(x, L, z, perim ? "smooth_stone" : "light_gray_concrete");

  // Storeys: walls between consecutive slabs
  for (let i = 0; i < levels.length - 1; i++) {
    const lower = levels[i];
    const upper = levels[i + 1];
    const h = upper - lower - 1;
    const isGroundStorey = lower === gr && gr === y0;
    if (!perim) continue;

    for (let rel = 1; rel <= h; rel++) {
      const y = lower + rel;
      let b = "white_concrete";
      if (corner) {
        b = "light_gray_concrete";
      } else if (isGroundStorey) {
        if (rel <= 2) b = "light_blue_stained_glass";      // shopfront glazing
        else if (rel === 3) b = "red_concrete";            // shop sign band
      } else if ((x + z) % 2 === 0 && rel >= 2 && rel <= h - 1) {
        b = "light_blue_stained_glass";                    // upper-storey window grid
      }
      put(x, y, z, b);
    }

    // Warm hanging lanterns in the interior, just behind some glazed bays
    if (!corner && (x + z) % 4 === 0) {
      const inner = interiorNeighbour(x, z);
      if (inner) {
        const [ix, iz] = inner;
        put(ix, upper - 1, iz, "lantern", { hanging: "true", waterlogged: "false" });
      }
    }
  }

  // Roof deck parapet and cap on the perimeter
  const top = levels[levels.length - 1];
  if (perim) {
    for (let y = top + 1; y < roofTop; y++) put(x, y, z, "white_concrete");
    if (roofTop > top) put(x, roofTop, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }

  // Roof plant: low boxes on the deck, scattered
  if (!perim && top === deckY && (x * 7 + z * 3) % 5 === 0) {
    put(x, deckY + 1, z, "gray_concrete");
  }
}

// Entrance door on the street frontage, with the sign band above it
if (doorCell) {
  const [x, z] = doorCell;
  const gr = ground.get(doorKey);
  const facing = outward(x, z);
  const lower = gr + 1;
  put(x, lower, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, lower + 1, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
}

g.save(`${dir}/${id}.nbt`);
