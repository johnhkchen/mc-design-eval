import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3329401.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3329401.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 7, H = 25, D = 20;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Footprint lookup: "x,z" -> { ground }
const map = new Map();
for (const c of cells) {
  map.set(`${c[0]},${c[1]}`, { ground: Math.round(c[2]) });
}
const has = (x, z) => map.has(`${x},${z}`);
const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// One flat roof tier: median of the lidar roof heights, so the skyline is clean.
const roofs = cells.map((c) => Math.round(c[3])).sort((a, b) => a - b);
const ROOF = roofs[Math.floor(roofs.length / 2)];

// Reference level: lowest ground under the footprint; storey lines hang off it.
const G0 = Math.min(...[...map.values()].map((v) => v.ground));

// Street-facing door: west face (x-min), cell nearest mid-z, lowest ground.
const xMin = Math.min(...cells.map((c) => c[0]));
const doorCands = cells.filter((c) => c[0] === xMin).map((c) => [c[0], c[1]]);
let doorCell = null;
if (doorCands.length) {
  const zs = doorCands.map((c) => c[1]);
  const zMid = (Math.min(...zs) + Math.max(...zs)) / 2;
  doorCands.sort((a, b) => Math.abs(a[1] - zMid) - Math.abs(b[1] - zMid));
  doorCell = doorCands[0];
}

// Pass 1: foundations, walls, floors, roof deck, parapet.
for (const [k, v] of map) {
  const [x, z] = k.split(",").map(Number);
  const { ground } = v;
  const top = Math.max(ROOF, ground + 3); // flat roof surface height
  const perim = isPerim(x, z);

  // Foundation: solid from y0 up to this cell's ground.
  for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");

  const xFace = !has(x - 1, z) || !has(x + 1, z);
  const idx = xFace ? z : x;

  for (let y = ground; y <= top - 1; y++) {
    // Roof surface / parapet cap.
    if (y === top - 1) {
      put(x, y, z, perim ? "stone_bricks" : "smooth_stone");
      continue;
    }
    if (!perim) {
      // Interior: only a floor slab per storey line; air otherwise.
      if (y > ground && (y - G0) % 2 === 0 && y < top - 1) put(x, y, z, "smooth_stone");
      continue;
    }

    // Exterior wall.
    const rel = (y - G0) % 2;
    const s = Math.floor((y - G0) / 2);

    if (y === top - 2) {
      put(x, y, z, "smooth_stone"); // cornice band
      continue;
    }

    if (s === 0 && rel === 0) {
      put(x, y, z, "stone_bricks"); // base course
    } else if (rel === 0) {
      put(x, y, z, "bricks"); // brick spandrel
    } else {
      // Window row: 2-wide openings between 1-wide brick piers.
      const isWindow = idx % 3 !== 0;
      if (s === 0) {
        // Commercial ground floor: shopfront glass between stone piers.
        if (isWindow) {
          const lit = (idx + x + z) % 5 === 0;
          put(x, y, z, lit ? "glowstone" : "tinted_glass");
        } else {
          put(x, y, z, "stone_bricks");
        }
      } else {
        if (isWindow) {
          const lit = (s * 7 + idx * 3 + x * 2 + z) % 9 === 0;
          put(x, y, z, lit ? "glowstone" : "tinted_glass");
        } else {
          put(x, y, z, "bricks");
        }
      }
    }
  }
}

// Pass 2: street entrance (dark oak door under a stone lintel).
if (doorCell) {
  const [dx, dz] = doorCell;
  const dg = map.get(`${dx},${dz}`).ground;
  put(dx, dg, dz, "dark_oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(dx, dg + 1, dz, "dark_oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(dx, dg + 2, dz, "stone_bricks"); // lintel
}

// Pass 3: stair bulkhead on the flat roof, interior cells only.
for (let x = 2; x <= 4; x++) {
  for (let z = 3; z <= 5; z++) {
    if (!has(x, z) || isPerim(x, z)) continue;
    put(x, ROOF, z, "bricks");
    put(x, ROOF + 1, z, "bricks");
    put(x, ROOF + 2, z, "smooth_stone");
  }
}

g.save(OUT);
