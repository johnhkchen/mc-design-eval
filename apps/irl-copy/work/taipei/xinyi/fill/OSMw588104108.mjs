import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw588104108";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 16 x 12. Roof about 22 blocks above the lowest ground.
// Read as a late-1990s / early-2000s Xinyi mid-rise commercial block:
// four storeys of 5 blocks, white-concrete piers, tinted glazing,
// a stone-clad shopfront with a dark-oak entrance and canopy,
// a cornice and parapet, and a rooftop penthouse with a lightning rod.
const W = 16, H = 34, D = 12;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const inFp = new Set(cells.map(([x, z]) => key(x, z)));
const base = Math.min(...cells.map((c) => c[2]));
const TOP = base + 22;

const put = (x, y, z, block, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (!inFp.has(key(x, z))) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// Boundary and outward-normal information from footprint neighbours.
function edgeInfo(x, z) {
  const w = !inFp.has(key(x - 1, z));
  const e = !inFp.has(key(x + 1, z));
  const n = !inFp.has(key(x, z - 1));
  const s = !inFp.has(key(x, z + 1));
  return {
    boundary: w || e || n || s,
    outDx: e ? 1 : w ? -1 : 0,
    outDz: s ? 1 : n ? -1 : 0,
    // pillar rhythm follows the face the cell sits on
    along: n || s ? x : z,
  };
}

// Entrance: boundary cell on the south (+z) face nearest the centre.
const cx = cells.reduce((a, c) => a + c[0], 0) / cells.length;
const southCells = cells
  .filter(([x, z]) => edgeInfo(x, z).boundary && edgeInfo(x, z).outDz === 1)
  .map(([x]) => x);
const ex = southCells.length
  ? southCells.reduce((best, x) => (Math.abs(x - cx) < Math.abs(best - cx) ? x : best))
  : Math.round(cx);
const isEntranceFace = (x, z) => {
  const info = edgeInfo(x, z);
  return info.boundary && info.outDz === 1 && Math.abs(x - ex) <= 1;
};

// 1. Foundations and body
for (const [x, z, gr] of cells) {
  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");

  const info = edgeInfo(x, z);

  for (let y = gr + 1; y <= TOP; y++) {
    if (y === TOP) {
      if (info.boundary) put(x, y, z, "white_concrete"); // parapet
      continue;
    }
    if (y === base + 21) {
      // cornice on the edge, roof deck inside
      put(x, y, z, info.boundary ? "smooth_stone" : "light_gray_concrete");
      continue;
    }

    const rel = y - (base + 1);
    const s = Math.floor(rel / 5); // storey index 0..3
    const r = rel % 5;              // 0 floor line, 1-3 window band, 4 lintel

    if (r === 0) {
      // storey floor line / base course
      if (info.boundary) put(x, y, z, s === 0 ? "polished_granite" : "smooth_stone");
      else put(x, y, z, "light_gray_concrete");
      continue;
    }

    if (r === 4) {
      // lintel / spandrel
      if (info.boundary) {
        put(x, y, z, s === 0 ? "smooth_stone" : "white_concrete");
      }
      continue;
    }

    // window band rows r = 1..3
    if (info.boundary) {
      const pillar = info.along % 3 === 0;

      // entrance door on the south face, two blocks tall at storey 0
      if (s === 0 && x === ex && isEntranceFace(x, z) && (r === 1 || r === 2)) {
        put(x, y, z, "dark_oak_door", {
          facing: "south",
          half: r === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }

      // canopy slab over the entrance at the top of the door band
      if (s === 0 && r === 3 && isEntranceFace(x, z)) {
        put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
        continue;
      }

      if (s === 0) {
        put(x, y, z, pillar ? "stone_bricks" : "glass");
      } else {
        put(x, y, z, pillar ? "white_concrete" : "light_blue_stained_glass_pane");
      }
    } else {
      // interior: air gap behind the glass; a warm light in cells next to the facade
      const nearEdge =
        !inFp.has(key(x - 1, z)) || !inFp.has(key(x + 1, z)) ||
        !inFp.has(key(x, z - 1)) || !inFp.has(key(x, z + 1));
      if (r === 2 && (x + z + s) % 5 === 0 && edgeInfo(x, z).boundary === false) {
        const adjacentToEdge =
          !inFp.has(key(x - 1, z - 0)) || !inFp.has(key(x + 1, z)) ||
          !inFp.has(key(x, z - 1)) || !inFp.has(key(x, z + 1));
        if (adjacentToEdge) put(x, y, z, "glowstone");
      }
      void nearEdge;
    }
  }
}

// 2. Interior floor slabs for storeys 1..3 are the floor lines above; the
//    interior light-gray slabs at each storey line are already placed.
//    Ground-floor interior slab sits at base+1 (placed by the r===0 rule).

// 3. Rooftop penthouse, standing on the roof deck at base+21
for (const [x, z] of cells) {
  if (x < 4 || x > 11 || z < 3 || z > 8) continue;
  const ring = x === 4 || x === 11 || z === 3 || z === 8;
  const corner = (x === 4 || x === 11) && (z === 3 || z === 8);
  for (let y = TOP; y <= TOP + 3; y++) {
    if (y === TOP + 3) {
      put(x, y, z, "smooth_stone");
    } else if (ring) {
      if (y === TOP + 1 && !corner) put(x, y, z, "light_blue_stained_glass_pane");
      else put(x, y, z, "white_concrete");
    }
  }
}

// 4. Lightning rod on the penthouse centre
const midX = Math.round(cells.reduce((a, c) => a + c[0], 0) / cells.length);
const midZ = Math.round(cells.reduce((a, c) => a + c[1], 0) / cells.length);
if (inFp.has(key(7, 6))) {
  put(7, TOP + 4, 6, "lightning_rod");
  put(7, TOP + 5, 6, "lightning_rod");
} else if (inFp.has(key(midX, midZ))) {
  put(midX, TOP + 4, midZ, "lightning_rod");
  put(midX, TOP + 5, midZ, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
