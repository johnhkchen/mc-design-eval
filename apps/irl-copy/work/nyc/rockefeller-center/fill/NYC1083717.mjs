// J.P. Stevens Company Tower (1185 Avenue of the Americas, 1970): a curtain-wall office tower on a granite plinth.
// Massing follows the lidar roof: a 10-block wing on the downhill (west) side, a 148 shoulder on the north, a 152 slab
// and a 155 core. Facade = storey bands of 3 blocks (granite plinth, spandrels, glass panes between concrete piers),
// a shopfront with a lobby entrance on the north face, a parapet cornice, a roof plant box. No interiors beyond
// floor slabs; some windows carry a glowstone just inside the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const FILL = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${FILL}/NYC1083717.cells.json`, "utf8"));   // [x, z, ground, roof]
const W = 50, D = 46, H = 166;

const key = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inside = (x, z) => raw.has(key(x, z));
const N8 = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };

// Lidar roof -> clean tiers. Holes (roof <= 2) and single-cell noise (97, 130, 144) get the majority of their neighbours.
const tierOf = (r) => r <= 2 ? null : r <= 40 ? 10 : (r >= 145 && r <= 149) ? 148 : (r >= 150 && r <= 152) ? 152 : r >= 153 ? 155 : null;
const tier = new Map();
for (const [k, { r }] of raw) tier.set(k, tierOf(r));
const majority = (x, z, map) => {
  const count = new Map();
  for (const [dx, dz] of N8) { const v = map.get(key(x + dx, z + dz)); if (v != null) count.set(v, (count.get(v) || 0) + 1); }
  let best = null, n = 0; for (const [v, c] of count) if (c > n) { best = v; n = c; }
  return best;
};
for (let pass = 0; pass < 3; pass++) for (const [k] of raw) {
  if (tier.get(k) != null) continue;
  const [x, z] = k.split(",").map(Number); tier.set(k, majority(x, z, tier));
}
const smoothed = new Map();
for (const [k] of raw) { const [x, z] = k.split(",").map(Number); smoothed.set(k, majority(x, z, tier) ?? tier.get(k) ?? 152); }
for (const [k, v] of smoothed) tier.set(k, v);

const R = (x, z) => tier.get(key(x, z));
const G = (x, z) => raw.get(key(x, z)).g || 1;

const g = new Voxels([W, H, D]);
const lights = [];     // glowstone behind glass, set after the walls so no interior pass erases them
const doorsAndLanterns = [];
const shell = (x, z, y) => { const dirs = []; for (const d in DIRS) { const [dx, dz] = DIRS[d]; const nx = x + dx, nz = z + dz; if (!inside(nx, nz) || y >= R(nx, nz)) dirs.push(d); } return dirs; };
const boundary = (x, z) => Object.values(DIRS).some(([dx, dz]) => !inside(x + dx, z + dz));
const glassy = (x, y, z) => Math.abs(Math.imul(x * 131 + y * 17 + z * 7, 2654435761)) % 17 === 0;

const pane = (kind) => kind === "x"
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }   // runs along z in a west/east face
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };  // runs along x in a north/south face

function facade(x, y, z, dirs) {
  const k = Math.floor((y - 1) / 3), rel = (y - 1) % 3;
  if (rel === 0) return { block: k === 0 ? "polished_andesite" : "gray_concrete" };    // plinth, then spandrel bands
  const lower = k === 0;                                                              // shopfront storey
  const mullion = lower ? "polished_andesite" : "light_gray_concrete";
  if (dirs.length >= 2) return { block: mullion };                                    // corners are solid piers
  const d = dirs[0], axis = d === "W" || d === "E" ? "x" : "z";
  const b = axis === "x" ? z : x;
  if (b % 3 === 0) return { block: mullion };                                         // piers on the 3-block bay grid
  if (glassy(x, y, z) && !lower) lights.push([x - DIRS[d][0], y, z - DIRS[d][1]]);
  return { block: lower ? "gray_stained_glass_pane" : "light_blue_stained_glass_pane", state: pane(axis) };
}

for (const [k] of raw) {
  const [x, z] = k.split(",").map(Number);
  const gr = G(x, z), top = R(x, z), bnd = boundary(x, z);
  for (let y = 0; y < top; y++) {
    if (y < gr) { g.set(x, y, z, bnd ? "polished_andesite" : "stone"); continue; }    // foundation to the lowest ground
    const dirs = shell(x, z, y);
    if (y >= top - 2 && dirs.length) { g.set(x, y, z, "light_gray_concrete"); continue; }   // cornice and coping
    if (y === top - 1) { g.set(x, y, z, "stone"); continue; }                                  // roof surface
    if (dirs.length) { const f = facade(x, y, z, dirs); g.set(x, y, z, f.block, f.state); continue; }
    if ((y - 1) % 3 === 0 && y >= 1) g.set(x, y, z, "smooth_stone");                  // floor slab per storey
  }
}

// Roof plant: two boxes on the 152 slab, inside the parapet.
const plant = [[18, 9, 23, 11], [30, 14, 33, 16]];
for (const [x0, z0, x1, z1] of plant) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
  if (!inside(x, z) || R(x, z) !== 152 || shell(x, z, 152).length) continue;
  for (let y = 152; y < 154; y++) g.set(x, y, z, "light_gray_concrete");
  g.set(x, 154, z, "iron_bars");
}

// Lobby entrance, north face (z = 0): granite pilasters with lanterns on top, double iron doors, sill.
for (const x of [28, 31]) for (let y = 1; y <= 3; y++) g.set(x, y, 0, "polished_andesite");
for (const x of [28, 31]) g.set(x, 4, 0, "lantern", { hanging: "false" });
for (const x of [29, 30]) {
  g.set(x, 1, 0, "polished_andesite");
  g.set(x, 2, 0, "iron_door", { facing: "south", half: "lower", hinge: x === 29 ? "left" : "right", open: "false", powered: "false" });
  g.set(x, 3, 0, "iron_door", { facing: "south", half: "upper", hinge: x === 29 ? "left" : "right", open: "false", powered: "false" });
}

for (const [x, y, z] of lights) if (inside(x, z) && y >= G(x, z) && y < R(x, z) && !shell(x, z, y).length) g.set(x, y, z, "glowstone");

const out = g.save(`${FILL}/NYC1083717.nbt`);
console.log(JSON.stringify(out));
