// NYC1035370: 346 Madison Avenue (1915), a Beaux-Arts commercial tower on an L-shaped footprint.
// Roof heights are the lidar tops, median-smoothed over the 4-neighbourhood and quantised to 3-block storeys. Storey
// floors sit on every 3rd row from y 0 (the foundation), so each setback stands on the floor below it. The shell is
// solid from the ground up wherever a side is open to the sky; the interior is air with floor slabs, and the air
// behind each glass pane keeps the window honest. The street face (z 9) carries the shopfront and the entrance.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035370.cells.json`, "utf8"));
const [X, Y, Z] = [39, 63, 10];

// Footprint: 260 cells, an L (the west block over z 0..9 and the long wing over z 5..9 from x 0 to 38).
const F = new Map();
for (const [x, z, g, r] of cells) F.set(`${x},${z}`, { ground: Math.max(1, g), roof: r });   // ground 0 at (0,8) is lidar noise
const inF = (x, z) => F.has(`${x},${z}`);
const roofAt = (x, z) => F.get(`${x},${z}`).roof;

const median = (a) => { a = [...a].sort((p, q) => p - q); return a[a.length >> 1]; };
const TOP = new Map();
for (const [k, { roof }] of F) {
  const [x, z] = k.split(",").map(Number);
  const near = [[x, z], [x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]].filter(([a, b]) => inF(a, b));
  const h = roof > 2 ? median(near.map(([a, b]) => roofAt(a, b)))
    : near.filter(([a, b]) => roofAt(a, b) >= 20).length >= 4 ? median(near.map(([a, b]) => roofAt(a, b))) : 0;
  TOP.set(k, h <= 2 ? 1 : Math.max(3, Math.round(h / 3) * 3));
}
const top = (x, z) => (inF(x, z) ? TOP.get(`${x},${z}`) : 0);

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// The sides of (x,z) that face the sky or the street at height y.
const openSides = (x, z, y) => DIRS.filter(([dx, dz]) => !inF(x + dx, z + dz) || top(x + dx, z + dz) <= y);
const isShell = (x, z, y) => inF(x, z) && y < top(x, z) && openSides(x, z, y).length > 0;

const g = new Voxels([X, Y, Z]);
const BASE = "polished_granite", BRICK = "bricks", TRIM = "white_terracotta", FLOOR = "smooth_stone", GLASS = "glass_pane";

for (const [k] of F) {
  const [x, z] = k.split(",").map(Number);
  const T = top(x, z);
  for (let y = 0; y < T; y++) {
    if (y === 0) { g.set(x, 0, z, BASE); continue; }                       // foundation on the lowest ground
    const sides = openSides(x, z, y), shell = isShell(x, z, y);
    if (y === T - 1) { g.set(x, y, z, shell ? TRIM : FLOOR); continue; }     // parapet on the shell, roof slab inside
    if (T >= 9 && y === T - 2 && shell) { g.set(x, y, z, TRIM); continue; }  // cornice course under the parapet
    if (y % 3 === 0) {                                                      // storey line: spandrel out, floor slab in
      if (shell) g.set(x, y, z, TRIM); else g.set(x, y, z, FLOOR);
      continue;
    }
    if (!shell) continue;                                                   // interior air between the floors
    const ground = y <= 2;
    if (sides.length >= 2) { g.set(x, y, z, ground ? BASE : TRIM); continue; }   // corner column
    const [dx, dz] = sides[0];
    const coord = dx ? z : x;                                               // bays run along the face
    if (coord % 3 === 0) { g.set(x, y, z, ground ? BASE : TRIM); continue; }    // pier
    const bx = x - dx, bz = z - dz;                                         // the room behind the glass
    if (!inF(bx, bz) || isShell(bx, bz, y)) { g.set(x, y, z, ground ? BASE : TRIM); continue; }
    // Glass pane, connected along its face to the piers and panes beside it.
    const alongX = dz !== 0;                                                // the pane runs along x on a z face
    const link = (a, b) => (isShell(a, b, y) ? "true" : "false");
    const state = alongX
      ? { north: "false", south: "false", east: link(x + 1, z), west: link(x - 1, z), waterlogged: "false" }
      : { north: link(x, z - 1), south: link(x, z + 1), east: "false", west: "false", waterlogged: "false" };
    g.set(x, y, z, GLASS, state);
    // Warm light in some windows: glowstone in the room behind the lower pane of a bay.
    if (y % 3 === 1 && (x * 31 + z * 17 + y * 7) % 11 === 0) g.set(bx, y, bz, "glowstone");
  }
}

// Main entrance on the street face: a double door under a dark wood awning, in the storefront bay.
for (const x of [22, 23]) {
  const hinge = x === 22 ? "left" : "right";
  g.set(x, 1, 9, "dark_oak_door", { facing: "south", half: "lower", hinge, open: "false", powered: "false" });
  g.set(x, 2, 9, "dark_oak_door", { facing: "south", half: "upper", hinge, open: "false", powered: "false" });
}
for (let x = 21; x <= 24; x++) g.set(x, 3, 9, "dark_oak_planks");

// Roof plant on the two highest tiers, set in from the parapet and standing on the roof slab.
for (const [x1, x2, z1, z2] of [[1, 3, 6, 8], [22, 25, 6, 8]]) {
  const T = top(x1, z1);
  for (let x = x1; x <= x2; x++) for (let z = z1; z <= z2; z++) {
    if (top(x, z) !== T) continue;
    g.set(x, T, z, "stone_bricks"); g.set(x, T + 1, z, TRIM);
  }
}

const stats = g.save(`${DIR}/NYC1035370.nbt`);
const tiers = {}; for (const v of TOP.values()) tiers[v] = (tiers[v] || 0) + 1;
console.log("tiers", JSON.stringify(tiers), "blocks", stats.blocks, "palette", stats.palette);
