// DC57196: 1320 19th St NW, a stone-clad 1960s office block. Polished-granite plinth, quartz piers and spandrels, glass
// window grids in front of air, a recessed double-door entrance on the podium, a roof plant box and a 17-block corner tower.
// Lidar roof heights are snapped to four flat tiers (podium 3, wing 12, core 13, tower 17); each storey is 3 rows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC57196.cells.json`, "utf8"));

const W = 10, D = 13, H = 29;
const FLOOR = 3;                                                     // a storey: a spandrel row, then two window rows

// lidar roof heights (above y 0) -> flat tiers; the noise inside each tier is dropped
const tier = (r) => (r >= 15 ? 17 : r >= 13 ? 13 : r >= 11 ? 12 : 3);

const cell = new Map();
for (const [x, z, g, r] of cells) cell.set(`${x},${z}`, { g, T: tier(r) });
const at = (x, z) => cell.get(`${x},${z}`) ?? null;

const SIDES = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
const WALL = { N: "z", S: "z", E: "x", W: "x" };                     // the axis a side's wall runs along

// the sides of a block that face air or a lower neighbour (a setback is a facade too)
function faces(x, y, z) {
  return Object.keys(SIDES).filter((s) => { const [dx, dz] = SIDES[s]; const n = at(x + dx, z + dz); return !n || n.T <= y; });
}

// what stands at x, y, z: { b, s } for a block, null for air (interior air sits behind the glass)
function spec(x, y, z) {
  const c = at(x, z); if (!c || y >= c.T) return null;
  if (y < c.g) return { b: "stone_bricks" };                          // foundation, from y 0 up to the ground
  const sides = faces(x, y, z), facade = sides.length > 0, top = c.T - 1, shop = y < FLOOR;
  if (y === top) return { b: facade ? "quartz_block" : "light_gray_concrete" };  // cornice / roof deck
  if (y % FLOOR === 0) {                                              // floor slab, or the spandrel line on the facade
    if (!facade) return { b: "smooth_stone" };
    return { b: y === 0 ? "polished_andesite" : "smooth_quartz" };
  }
  if (!facade) return null;
  const s = sides[0], along = WALL[s] === "z" ? x : z;
  if (sides.length > 1 || along % 2 === 0) return { b: shop ? "polished_andesite" : "smooth_quartz" };   // corners and piers
  if (shop) return { b: "glass" };
  const ew = WALL[s] === "z";                                         // panes connect along their own wall
  return { b: "glass_pane", s: { north: String(!ew), south: String(!ew), east: String(ew), west: String(ew) } };
}

const g = new Voxels([W, H, D]);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const c = at(x, z); if (!c) continue;
  for (let y = 0; y < c.T; y++) { const p = spec(x, y, z); if (p) g.set(x, y, z, p.b, p.s); }
}

// warm light behind some glass: a glowstone on the floor slab, in the air cell inside the window
let lit = 0;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const c = at(x, z); if (!c) continue;
  for (let y = 1; y < c.T; y += FLOOR) {                              // y % 3 === 1: first window row, sitting on a slab
    const p = spec(x, y, z); if (!p || p.b !== "glass_pane" && p.b !== "glass") continue;
    if ((x + z + Math.floor(y / FLOOR)) % 4 !== 0) continue;
    const s = faces(x, y, z)[0]; const [dx, dz] = SIDES[s];
    const xi = x - dx, zi = z - dz, n = at(xi, zi);
    if (n && y < n.T && !spec(xi, y, zi)) { g.set(xi, y, zi, "glowstone"); lit++; }
  }
}

// the entrance: a pair of metal doors in the podium's north face, the glass either side
for (const x of [4, 5]) {
  const hinge = x === 4 ? "left" : "right";
  g.set(x, 1, 1, "iron_door", { facing: "north", half: "lower", hinge, open: "false", powered: "false" });
  g.set(x, 2, 1, "iron_door", { facing: "north", half: "upper", hinge, open: "false", powered: "false" });
}

// roof plant on the core roof (interior cells only): a 2x2 mechanical box, two blocks high
for (let z = 6; z <= 7; z++) for (let x = 4; x <= 5; x++)
  for (let y = 13; y <= 14; y++) g.set(x, y, z, "light_gray_concrete");

// a lightning rod crowns the corner tower
g.set(0, 17, 0, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

const info = g.save(`${DIR}/DC57196.nbt`);
console.log(JSON.stringify({ ...info, lit }));
