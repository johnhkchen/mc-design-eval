// 22 West 46th Street, 1925 mixed residential and commercial building: a narrow 5 x 26 mid-block lot, six storeys of
// red brick over a granite base and a limestone (smooth quartz) string course at every floor, on a 1925 neo-Renaissance
// pattern. Street front is the low-z end (the 46th Street frontage): a shopfront with a recessed-by-the-glass entrance
// door at its west corner, and a 6-storey tower. The lidar steps the massing down to 5 storeys across the rest of the
// lot and then to a 4-storey and a 1-storey rear wing (the rear shops and service door). Lidar roof per cell is
// smoothed with a 3 x 3 mean and rounded to whole 3-block storeys, so tiers are flat. Each storey is a solid floor
// slab with a 2-block window band (glass panes between quartz mullions); the roof is a quartz line with a cornice slab
// and a tar-and-gravel roof. A 2 x 3 penthouse bulkhead sits set back on the tower roof. Interiors are air behind the
// glass with a floor slab per storey. Warm glowstone sits behind some windows, and lanterns in the shopfront.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034258.cells.json`, "utf8"));
const X = 5, Z = 26, Y = 22;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);

// Smoothed lidar roof: 3 x 3 mean of the footprint's nonzero roof values (lidar gaps are zeros), then whole storeys.
// Storey count = round(mean / 3), at least 1; the roof slab sits at y = 3n and the cornice course above it.
const roofMean = (x, z) => {
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const c = cell.get(`${x + dx},${z + dz}`);
    if (c && c.roof > 0) { sum += c.roof; n++; }
  }
  return n ? sum / n : 0;
};
const storeys = (x, z) => Math.max(1, Math.round(roofMean(x, z) / 3));
const roofY = (x, z) => 3 * storeys(x, z);

const edge = (x, z) => x === 0 || x === X - 1 || z === 0 || z === Z - 1;
const front = (z) => z === 0;
const rear = (z) => z === Z - 1;

const g = new Voxels([X, Y, Z]);
const panes = [];      // glass panes, connected to their neighbours once the whole facade is placed
const lights = [];     // [x, y, z] cells just behind a lit window

// Facade block for a perimeter cell above the ground-level base course (y 1..2 are the first storey's window band).
// Returns [block, state?] or null for a cell that is not on the facade.
function facade(x, y, z, n) {
  const ground = y < 3;
  const pier = (x === 0 || x === X - 1);
  if (front(z)) {
    if (ground && x === 0) return ["dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
    if (pier) return ["bricks"];
    if (ground) return ["glass"];
    return x === 2 ? ["smooth_quartz"] : ["glass_pane"];     // mullion at x 2, panes either side
  }
  if (rear(z)) {
    if (pier) return ["bricks"];
    if (x === 2) {
      if (ground && n === 1) return ["dark_oak_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "right", open: "false", powered: "false" }];
      return ["smooth_quartz"];
    }
    return ["glass_pane"];
  }
  // Side walls (x 0 and x 4): a pier of brick every third block, panes between.
  return z % 3 === 0 ? ["bricks"] : ["glass_pane"];
}

for (const [k, { ground }] of cell) {
  const [x, z] = k.split(",").map(Number);
  const n = storeys(x, z), R = roofY(x, z), perim = edge(x, z);
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");       // foundation (nothing here: lowest ground is 0)
  for (let y = ground; y <= R; y++) {
    if (y % 3 === 0) {
      // Storey line: the base course, a floor slab, or the roof. Limestone on the facade, slab or concrete inside.
      const block = y === 0 ? (perim ? "polished_andesite" : "smooth_stone")
        : y === R ? (perim ? "smooth_quartz" : "stone")
        : (perim ? "smooth_quartz" : "smooth_stone");
      g.set(x, y, z, block);
      continue;
    }
    if (!perim) continue;                                                // interior air behind the facade
    if (y === R) { g.set(x, y, z, "smooth_quartz"); continue; }
    const f = facade(x, y, z, n);
    if (!f) continue;
    const [block, state] = f;
    g.set(x, y, z, block, state);
    if (block === "glass_pane") panes.push([x, y, z]);
    if (block === "glass" || block === "glass_pane") {
      // A warm light behind some windows: lower row only, deterministic, inside the wall one cell (the room behind).
      const storey = Math.floor(y / 3);
      if ((storey * 5 + x * 3 + z * 7) % 4 === 0 && y % 3 === 1) {
        if (front(z)) lights.push([x, y, 1]);
        else if (rear(z)) lights.push([x, y, Z - 2]);
        else lights.push([x === 0 ? 1 : X - 2, y, z]);
      }
    }
  }
  if (perim) g.set(x, R + 1, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });   // cornice course
}

// Shopfront: a lantern hangs in the shop behind the glass, under the storey line (the sign band), and the lit windows
// get their light.
g.set(2, 2, 1, "lantern", { hanging: "true", waterlogged: "false" });
for (const [x, y, z] of lights) g.set(x, y, z, "glowstone");

// Penthouse bulkhead set back from the street on the tower roof (the 6-storey west block, z 2..4).
const tower = Math.max(...cells.map(([x, z]) => roofY(x, z)));
for (const x of [1, 2]) for (const z of [2, 3, 4]) {
  if (roofY(x, z) !== tower) continue;
  g.set(x, tower + 1, z, "bricks");
  g.set(x, tower + 2, z, "bricks");
  g.set(x, tower + 3, z, "smooth_stone");
}

// Pane connections: a pane joins a solid neighbour in its own plane (the vanilla behaviour), not air and not above.
const solid = (x, y, z) => g.get(x, y, z) !== null;
for (const [x, y, z] of panes) {
  const state = {
    north: String(solid(x, y, z - 1)),
    south: String(solid(x, y, z + 1)),
    east: String(solid(x + 1, y, z)),
    west: String(solid(x - 1, y, z)),
    waterlogged: "false",
  };
  g.set(x, y, z, "glass_pane", state);
}

const { blocks, palette } = g.save(`${DIR}/NYC1034258.nbt`);
console.log(`NYC1034258: ${blocks} blocks, palette ${palette}`);
