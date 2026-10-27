// Way 1499265905: a 1970s concrete-frame office tower on a stone plinth, in the Auckland CBD manner. A stepped
// massing from the lidar roof tiers (13 podium, 17 and 29 wings, 41-65 setbacks, 81 tower, 89 plant crown); blue-tinted
// glazing on pale concrete piers and spandrels, clear shopfronts and a lobby door on the ground storey, warm light in
// some windows at dusk, a plant box and a lit mast on the roofs. Each footprint column is built from its own foundation
// up to its roof, on one global storey grid (floor lines at y = 1 mod 4), so every storey stands on the one below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_1499265905.cells.json`, "utf8"));   // [x, z, ground, roof] per cell

const g = new Voxels([70, 102, 64]);

const P = {
  plinth: "stone_bricks",            // foundation below the first storey line
  base: "polished_andesite",         // base course on the ground storey's floor line
  pier: "white_concrete",            // mullions and corners
  spandrel: "light_gray_concrete",   // storey lines
  cornice: "polished_andesite",      // parapet on the outer edge of each roof
  deck: "gray_concrete",             // roof deck inside the parapet
  floor: "smooth_stone",             // interior floor slabs
  glass: "light_blue_stained_glass_pane",
  shop: "glass_pane",                // clear shopfront glass on the ground storey
  plant: "light_gray_concrete",      // roof plant boxes
};

// lidar roof heights cluster into flat tiers, each on the storey grid (y = 1 mod 4)
const tier = (r) => (r <= 12 ? 5 : r <= 15 ? 13 : r <= 21 ? 17 : r <= 33 ? 29 : r <= 45 ? 41 : r <= 60 ? 53 : r <= 75 ? 65 : r <= 82 ? 81 : 89);

const col = new Map();
const key = (x, z) => `${x},${z}`;
for (const [x, z, ground, roof] of cells) {
  const L = 1 + 4 * Math.ceil(ground / 4);     // the first floor line above the foundation (solid from y 0 up to L-1)
  col.set(key(x, z), { x, z, L, T: tier(roof) });
}
const at = (x, z) => col.get(key(x, z));
// lidar noise: a cell standing above its neighbours (fewer than two of them within 4 blocks of its roof) drops to the
// highest neighbour below it, so no thin spikes rise off the podium; cells are only ever lowered here
const DIRS = [[0, -1, "north"], [0, 1, "south"], [1, 0, "east"], [-1, 0, "west"]];
for (let pass = 0; pass < 3; pass++)
  for (const c of col.values()) {
    const nb = DIRS.map(([dx, dz]) => at(c.x + dx, c.z + dz)).filter(Boolean);
    if (nb.filter((n) => n.T >= c.T - 4).length < 2) c.T = Math.max(0, ...nb.filter((n) => n.T < c.T).map((n) => n.T));
  }
for (const c of col.values()) c.T = Math.max(c.T, c.L + 4);   // the roof line, at least one storey above the floor
// the faces a column shows to the air: its neighbour is outside the footprint or has a lower roof
const exposed = (c) => DIRS.filter(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || n.T < c.T; });

// The lobby: a window-band cell on the street-side ground storey, off the pier lines, nearest the middle of the face
const doorFace = (face) => (face[2] === "south" ? 0 : face[2] === "north" ? 1 : 2);
let door = null, best = Infinity;
for (const c of col.values()) {
  const ex = exposed(c);
  if (ex.length !== 1) continue;
  const face = ex[0], u = face[0] === 0 ? c.x : c.z;
  if (u % 3 === 0) continue;
  const score = doorFace(face) * 1000 + Math.abs(u - 35);
  if (score < best) { best = score; door = { x: c.x, z: c.z, face }; }
}

const panes = [];
const lit = (x, y, z) => (x * 7 + y * 3 + z * 5) % 11 === 0;

for (const c of col.values()) {
  const { x, z, L, T } = c;
  const ex = exposed(c);
  const perim = ex.length > 0, corner = ex.length > 1;
  const face = ex[0];
  for (let y = 0; y < L; y++) g.set(x, y, z, P.plinth);
  for (let y = L; y < T; y++) {
    const rel = (y - L) % 4;
    if (y === T - 1) { g.set(x, y, z, perim ? P.cornice : P.deck); continue; }   // the roof's top course
    if (rel === 0) { g.set(x, y, z, perim ? (y < L + 4 ? P.base : P.spandrel) : P.floor); continue; }
    if (!perim) continue;                                                          // interior: air behind the glass
    if (rel === 3) { g.set(x, y, z, P.spandrel); continue; }
    if (corner) { g.set(x, y, z, P.pier); continue; }
    const along = face[0] === 0 ? x : z;                                           // position along the wall
    if (along % 3 === 0) { g.set(x, y, z, P.pier); continue; }
    if (door && door.x === x && door.z === z && y < L + 4) {
      const half = rel === 1 ? "lower" : "upper";
      g.set(x, y, z, "dark_oak_door", { facing: face[2], half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    const block = y < L + 4 ? P.shop : P.glass;
    g.set(x, y, z, block);
    panes.push({ x, y, z, block, axis: face[0] === 0 ? "x" : "z", face });
  }
}

// warm light behind some windows: a glowstone in the air gap just inside the glass
for (const p of panes) {
  if (!lit(p.x, p.y, p.z)) continue;
  const [dx, dz] = p.face;
  const inner = at(p.x - dx, p.z - dz);
  if (!inner || exposed(inner).length) continue;
  g.set(p.x - dx, p.y, p.z - dz, "glowstone");
}

// the connections of each pane run along its wall only, to panes and piers
for (const p of panes) {
  const st = { north: "false", south: "false", east: "false", west: "false" };
  const sides = p.axis === "x" ? [["east", 1, 0], ["west", -1, 0]] : [["north", 0, -1], ["south", 0, 1]];
  for (const [name, dx, dz] of sides) {
    const b = g.get(p.x + dx, p.y, p.z + dz);
    if (b && (/pane$/.test(b.block) || b.block === "minecraft:white_concrete")) st[name] = "true";
  }
  g.set(p.x, p.y, p.z, p.block, st);
}

// the second half of the door, now that its facing is known
if (door) {
  const c = at(door.x, door.z);
  for (const [y, half] of [[c.L + 1, "lower"], [c.L + 2, "upper"]])
    g.set(door.x, y, door.z, "dark_oak_door", { facing: door.face[2], half, hinge: "left", open: "false", powered: "false" });
}

// plant boxes on the roofs, one cell in from the edge
for (const c of col.values()) {
  if (c.x % 8 !== 3 || c.z % 8 !== 3 || exposed(c).length) continue;
  g.set(c.x, c.T, c.z, P.plant);
  g.set(c.x, c.T + 1, c.z, P.plant);
}

// a mast on the crown, nearest its middle, lit at the top
const crown = [...col.values()].filter((c) => c.T === 89);
const mx = crown.reduce((s, c) => s + c.x, 0) / crown.length, mz = crown.reduce((s, c) => s + c.z, 0) / crown.length;
const mast = crown.reduce((a, c) => (Math.hypot(c.x - mx, c.z - mz) < Math.hypot(a.x - mx, a.z - mz) ? c : a));
for (let y = mast.T; y < mast.T + 7; y++) g.set(mast.x, y, mast.z, "iron_bars");
g.set(mast.x, mast.T + 7, mast.z, "redstone_lamp", { lit: "true" });

const out = g.save(`${DIR}/way_1499265905.nbt`);
console.log(`way_1499265905: ${out.blocks} blocks, ${out.palette} palette entries, ${panes.length} panes, door at ${door.x},${door.z} (${door.face[2]})`);
