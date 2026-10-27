// Way 948317510, Auckland: a three-storey 1930s stripped-classical commercial block (c.1930s, plaster over
// block) on a flat site, 28 x 24 footprint. Lidar roof reads 8-9 across the wings and 10-12 in the middle, so the
// massing is a two-storey podium (roof at 9 with a parapet) and a three-storey tower set in one cell from every
// podium edge (roof at 13 with a parapet). Walls are plaster (smooth quartz) between smooth-stone storey bands; the
// ground floor is a shopfront of glass and stone piers with a timber lintel over the door. Flat roofs of gray
// concrete with plant boxes on the tower. Warm glowstone sits behind some panes. Interiors are only air between
// the floor slabs at 0, 4, 8 (tower) and the decks at 7 and 11.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_948317510.cells.json`, "utf8"));
const W = 28, D = 24, H = 25;

const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const k = (x, z) => `${x},${z}`;
const at = new Map(cells.map(([x, z, ground, roof]) => [k(x, z), { ground, roof }]));
const inside = (x, z) => at.has(k(x, z));

// lidar noise: roof readings under 7 are replaced by the median of their neighbours' readings
const roof = new Map();
for (const [key, { roof: r }] of at) {
  const [x, z] = key.split(",").map(Number);
  let h = r;
  if (r < 7) {
    const nb = N4.map(([dx, dz]) => at.get(k(x + dx, z + dz))).filter((o) => o && o.roof >= 7).map((o) => o.roof).sort((a, b) => a - b);
    h = nb.length ? nb[Math.floor(nb.length / 2)] : 9;
  }
  roof.set(key, h);
}
// 3 x 3 mean of the cleaned roof over the footprint: the massing tier decision, smooth not noisy
const smooth = (x, z) => {
  let s = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const h = roof.get(k(x + dx, z + dz)); if (h !== undefined) { s += h; n++; }
  }
  return s / n;
};

// depth: 1 on the outer ring of the footprint, 2 one cell in, and so on (BFS from the outside)
const depth = new Map();
let frontier = [];
for (const key of at.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (N4.some(([dx, dz]) => !inside(x + dx, z + dz))) { depth.set(key, 1); frontier.push([x, z]); }
}
while (frontier.length) {
  const next = [];
  for (const [x, z] of frontier) for (const [dx, dz] of N4) {
    const nk = k(x + dx, z + dz);
    if (inside(x + dx, z + dz) && !depth.has(nk)) { depth.set(nk, depth.get(k(x, z)) + 1); next.push([x + dx, z + dz]); }
  }
  frontier = next;
}

// the tower: cells at least two in from the outer ring whose smoothed roof reads 10 or more
const tower = new Set();
for (const key of at.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (depth.get(key) >= 2 && smooth(x, z) >= 9.6) tower.add(key);
}
const towerEdge = (x, z) => N4.some(([dx, dz]) => !tower.has(k(x + dx, z + dz)));   // a tower wall (faces the podium roof or the air)

// the front: the north-most row of the footprint, its middle cell carries the entrance
const minZ = Math.min(...[...at.keys()].map((key) => Number(key.split(",")[1])));
const frontRow = [...at.keys()].map((key) => key.split(",").map(Number)).filter(([, z]) => z === minZ).map(([x]) => x).sort((a, b) => a - b);
const doorX = frontRow[Math.floor(frontRow.length / 2)];

const blocks = new Map();   // "x,y,z" -> [block, state]
const put = (x, y, z, b, s) => blocks.set(`${x},${y},${z}`, [b, s]);
const winAt = (x, z) => (x + z) % 3 !== 0;                  // two glass bays, one stone pier, along every face
const glassState = { north: "false", south: "false", east: "false", west: "false" };

for (const key of at.keys()) {
  const [x, z] = key.split(",").map(Number);
  const d = depth.get(key);
  const isTower = tower.has(key);
  const isTowerEdge = isTower && towerEdge(x, z);

  // podium walls: the outer ring, plinth to the storey bands to a parapet at 9
  if (d === 1) {
    put(x, 0, z, "stone_bricks");
    const win = winAt(x, z);
    const front = z === minZ;
    if (front && x === doorX) {
      put(x, 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      put(x, 3, z, "dark_oak_planks");                                       // timber lintel over the entrance
    } else {
      put(x, 1, z, win ? "glass_pane" : "polished_andesite");
      put(x, 2, z, win ? "glass_pane" : "polished_andesite");
      put(x, 3, z, "smooth_quartz");
    }
    put(x, 4, z, "smooth_stone");                                            // first-floor storey line
    put(x, 5, z, win ? "glass_pane" : "smooth_quartz");
    put(x, 6, z, win ? "glass_pane" : "smooth_quartz");
    put(x, 7, z, "smooth_stone");                                            // second-floor cornice band
    put(x, 8, z, "smooth_stone");                                            // parapet
  } else {
    // interior of the podium: floor slab at 0 and 4, a deck at 7 that the tower stands on
    put(x, 0, z, "smooth_stone");
    put(x, 4, z, "smooth_stone");
    put(x, 7, z, "stone");
  }

  // the tower above the podium: its outer walls and a deck at 11, floor slab at 8
  if (isTower) {
    put(x, 4, z, "smooth_stone");
    put(x, 7, z, "stone");
    if (isTowerEdge) {
      const win = winAt(x, z);
      put(x, 8, z, "smooth_quartz");
      put(x, 9, z, win ? "glass_pane" : "smooth_quartz");
      put(x, 10, z, win ? "glass_pane" : "smooth_quartz");
      put(x, 11, z, "smooth_stone");
      put(x, 12, z, "smooth_stone");                                          // tower parapet
    } else {
      put(x, 8, z, "smooth_stone");                                          // tower floor slab
      put(x, 11, z, "stone");                                         // tower roof deck
      // roof plant: a few small boxes on the deck
      if (depth.get(key) >= 4 && x % 6 === 2 && z % 5 === 2) put(x, 12, z, "iron_block");
    }
  }
}

// warm light: a glowstone just inside a glass pane (floor slab under it, air above)
for (const key of at.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (depth.get(key) !== 1) continue;
  if (x === doorX && z === minZ) continue;
  if (!winAt(x, z) || (x * 5 + z * 3) % 7 !== 0) continue;
  const inward = N4.map(([dx, dz]) => [x + dx, z + dz]).find(([ix, iz]) => inside(ix, iz) && depth.get(k(ix, iz)) >= 2);
  if (inward) put(inward[0], 5, inward[1], "glowstone");
}

// glass panes connect to the solid or glass beside them at their own height
const isThere = (x, y, z) => blocks.has(`${x},${y},${z}`);
const DIRS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
for (const [key, [b]] of blocks) {
  if (b !== "glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  const state = {};
  for (const [name, [dx, dz]] of Object.entries(DIRS)) state[name] = isThere(x + dx, y, z + dz) ? "true" : "false";
  blocks.set(key, [b, state]);
}

const g = new Voxels([W, H, D]);
for (const [key, [b, s]] of blocks) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, b, s);
}
// the floor and roof stack under every block: nothing hangs (checked on the way out)
const info = g.save(`${DIR}/way_948317510.nbt`);
console.log(JSON.stringify({ footprint: at.size, tower: tower.size, door: [doorX, minZ], ...info }));
