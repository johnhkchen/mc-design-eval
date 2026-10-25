import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// FR301499740: commercial, 1990, render walls over a stone plinth, 11 x 10 footprint.
// Massing follows the lidar roof height in ~5-block storeys: stone plinth,
// cream render walls with glazed bays, a stone cornice line at each storey,
// a flat roof with a low parapet course and plant boxes.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499740";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 11, H = 26, D = 10;
const g = new Voxels([W, H, D]);

const fp = new Map();
for (const [x, z, gr, roof] of cells) fp.set(`${x},${z}`, { gr, roof });
const has = (x, z) => fp.has(`${x},${z}`);
const cellsList = [...fp.keys()].map((k) => k.split(",").map(Number));

// Building-level levels.
let B = 0, roofSum = 0;
for (const c of fp.values()) { B = Math.max(B, c.gr); roofSum += c.roof; }
const roofAvg = Math.round(roofSum / fp.size);
const F0 = Math.max(0, B - 1);                 // ground-floor slab level
let n = Math.max(1, Math.round((roofAvg - 1 - F0) / 5));
let R = F0 + 5 * n;                            // roof surface level
while (R + 2 > H - 1 && n > 1) { n--; R = F0 + 5 * n; }

function exposed(x, z) {
  const e = [];
  if (!has(x, z - 1)) e.push("N");
  if (!has(x, z + 1)) e.push("S");
  if (!has(x - 1, z)) e.push("W");
  if (!has(x + 1, z)) e.push("E");
  return e;
}
const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

const WALL = "calcite";        // cream render
const PLINTH = "stone_bricks"; // granite-like base
const TRIM = "stone_brick_slab";
const FLOOR = "smooth_stone";
const GLASS = "glass";

// 1. Solid foundations from y 0 to the ground-floor slab under every cell.
for (const [x, z] of cellsList)
  for (let y = 0; y < F0; y++) g.set(x, y, z, PLINTH);

// 2. Floor slabs at every storey line across the whole footprint.
for (let s = 0; s <= n; s++) {
  const y = F0 + 5 * s;
  for (const [x, z] of cellsList) g.set(x, y, z, s === n ? FLOOR : FLOOR);
}

// 3. Entrance: N-exposed cell nearest the front middle.
const mid = Math.floor(W / 2);
let door = null;
for (const [x, z] of cellsList) {
  if (exposed(x, z).includes("N") && (!door || Math.abs(x - mid) < Math.abs(door[0] - mid)))
    door = [x, z];
}

// 4. Storeys: plinth, render walls, glazed bays, cornice at each storey line.
for (const [x, z] of cellsList) {
  const ex = exposed(x, z);
  if (ex.length === 0) continue;
  const single = ex.length === 1;
  const isDoor = door && door[0] === x && door[1] === z;

  for (let s = 0; s < n; s++) {
    const b = F0 + 5 * s;
    // Wall column for this storey.
    for (let dy = 1; dy <= 4; dy++) g.set(x, b + dy, z, WALL);
    // Cornice course at the top of each storey (sits on the wall below).
    g.set(x, b + 4, z, TRIM, { type: "top", waterlogged: "false" });

    if (s === 0) {
      // Stone plinth course at ground.
      g.set(x, b + 1, z, PLINTH);
    }

    if (isDoor && s === 0) {
      // Doorway with lower/upper halves and a stone surround above.
      g.set(x, b + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(x, b + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      g.set(x, b + 3, z, PLINTH);
      continue;
    }

    if (single && (x + z) % 2 === 0) {
      // Glazed bay with calcite mullion above sill and below head.
      g.set(x, b + 2, z, GLASS);
      g.set(x, b + 3, z, GLASS);
      const [dx, dz] = inward[ex[0]];
      if (has(x + dx, z + dz)) {
        if (s === 0 && x % 4 === 0)
          g.set(x + dx, b + 1, z + dz, "glowstone");          // shopfront light
        else if (s > 0 && (x * 3 + s) % 4 === 0)
          g.set(x + dx, b + 1, z + dz, "shroomlight");        // upper-storey light
      }
    }
  }

  // Parapet course on the perimeter at roof level.
  g.set(x, R + 1, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// 5. Roof: flat surface across the footprint, plus plant boxes.
for (const [x, z] of cellsList) g.set(x, R, z, "stone_bricks");
for (const [bx, bz] of [[2, 3], [3, 3], [7, 5]]) {
  if (has(bx, bz) && R + 2 <= H - 1) {
    g.set(bx, R + 1, bz, "smooth_stone");
    g.set(bx, R + 2, bz, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
