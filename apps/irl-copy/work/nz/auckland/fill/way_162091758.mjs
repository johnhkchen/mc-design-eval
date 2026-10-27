// Way 162091758: a two-storey 1960s-70s Auckland office block on the slope below Mt Eden. It is a pale concrete
// frame with a ribbon of glass, a dark plinth on the uphill side, stepped roof tiers (9 / 8 / 7 from the lidar, smoothed),
// a lit glass entrance, and a roof plant room. Walls are the outer ring of the footprint and any cell lower than a neighbour;
// the interior is air between floor slabs, with glowstone behind some panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162091758.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162091758.nbt";
const cells = JSON.parse(readFileSync(SRC, "utf8"));

const [X, Y, Z] = [39, 23, 43];
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const k2 = (x, z) => `${x},${z}`;
const xzOf = (k) => k.split(",").map(Number);

// Each footprint cell: ground (foundation top) and the lidar roof height above y 0.
const ground = new Map(), rawRoof = new Map();
for (const [x, z, g, r] of cells) { ground.set(k2(x, z), g); rawRoof.set(k2(x, z), r); }
const has = (x, z) => ground.has(k2(x, z));

// Roof tiers: the mean lidar height over a 5x5 window within the footprint, rounded to the three flat tiers (7, 8, 9),
// so the lidar noise becomes clean tiers rather than a checkerboard of steps.
const roof = new Map();
for (const k of ground.keys()) {
  const [x, z] = xzOf(k);
  let sum = 0, n = 0;
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
    if (!has(x + dx, z + dz)) continue;
    sum += rawRoof.get(k2(x + dx, z + dz)); n++;
  }
  const mean = sum / n;
  const tier = mean >= 8.5 ? 9 : mean >= 7.5 ? 8 : 7;
  roof.set(k, Math.max(tier, ground.get(k) + 4));   // at least one storey above its own ground
}

// Walls: outer edge cells, and any cell with a neighbour lower than it (the step face of a setback).
const wall = new Set();
for (const k of ground.keys()) {
  const [x, z] = xzOf(k), R = roof.get(k);
  for (const [dx, dz] of DIRS) if (!has(x + dx, z + dz) || roof.get(k2(x + dx, z + dz)) < R) { wall.add(k); break; }
}

// Entrance: the middle of the southern-most run of outer cells on the +z face, with its neighbours on the same run.
const south = [...wall].map(xzOf).filter(([x, z]) => !has(x, z + 1));
const zMax = Math.max(...south.map(([, z]) => z));
const run = south.filter(([, z]) => z === zMax).sort((a, b) => a[0] - b[0]);
const e = run[Math.floor(run.length / 2)];
const door = new Set([k2(e[0], e[1])]);
for (const d of [-1, 1]) {
  const [x, z] = [e[0] + d, e[1]];
  if (wall.has(k2(x, z)) && !has(x, z + 1)) door.add(k2(x, z));
}

// What block sits at x, y, z (null is air). Storeys are 4 high from each cell's ground; the top row is the roof deck.
function kindAt(x, z, y) {
  const k = k2(x, z), G = ground.get(k), R = roof.get(k), ring = wall.has(k);
  if (!has(x, z) || y < 0 || y >= R) return null;
  if (y < G) return "stone_bricks";                                  // foundation fill, up to the ground
  if (y === R - 1) return ring ? "light_gray_concrete" : "smooth_stone";   // cornice cap and roof deck, light against the sky
  const b = G + 4 * Math.floor((y - G) / 4), r = y - b, groundBand = b === G, isDoor = door.has(k) && groundBand;
  if (r === 0) {                                                   // floor slab (a string course on the walls)
    if (b <= R - 4) return ring ? (groundBand ? "stone_bricks" : "light_gray_concrete") : "smooth_stone";
    return ring ? "white_concrete" : null;
  }
  if (!ring) return null;                                          // air behind the glass
  if (r === 3) return isDoor ? "light_gray_concrete" : "white_concrete";   // spandrel, or the entrance canopy
  if (isDoor) return "light_blue_stained_glass";                  // glass entrance
  if ((x + z) % 3 === 0) return groundBand ? "gray_concrete" : "white_concrete";  // piers: darker at the shopfront level
  return "light_blue_stained_glass_pane";
}

const blocks = new Map();      // "x,y,z" -> block name, or { name, state } for panes
const put = (x, y, z, name, state) => blocks.set(`${x},${y},${z}`, state ? { name, state } : { name });
for (const k of ground.keys()) {
  const [x, z] = xzOf(k), R = roof.get(k);
  for (let y = 0; y < R; y++) { const n = kindAt(x, z, y); if (n) put(x, y, z, n); }
}

// Warm light behind some glass: a glowstone in the air gap just inside a pane, standing on the floor slab.
for (const k of wall) {
  const [x, z] = xzOf(k), G = ground.get(k), R = roof.get(k);
  for (let y = G + 1; y < R - 2; y++) {
    if (kindAt(x, z, y) !== "light_blue_stained_glass_pane" || (y - G) % 4 !== 1) continue;
    if ((x * 31 + z * 17 + y * 7) % 11 !== 0) continue;
    const inward = DIRS.map(([dx, dz]) => [x + dx, z + dz]).find(([nx, nz]) => has(nx, nz) && !wall.has(k2(nx, nz)));
    if (!inward) continue;
    const [nx, nz] = inward, nG = ground.get(k2(nx, nz));
    if (y >= nG && y < roof.get(k2(nx, nz)) - 1 && !blocks.has(`${nx},${y},${nz}`) && blocks.has(`${nx},${y - 1},${nz}`))
      put(nx, y, nz, "glowstone");
  }
}

// Roof plant room: a 5 x 5 box on the top tier, walls 2 high with a pane in the middle of each side, a flat roof.
{
  const top = [...ground.keys()].map(xzOf).filter(([x, z]) => roof.get(k2(x, z)) === 9 && !wall.has(k2(x, z)));
  let best = null, bd = Infinity;
  const mx = top.reduce((s, [x]) => s + x, 0) / top.length, mz = top.reduce((s, [, z]) => s + z, 0) / top.length;
  for (const [cx, cz] of top) {
    const sq = []; for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) sq.push([cx + i, cz + j]);
    if (!sq.every(([x, z]) => roof.get(k2(x, z)) === 9 && !wall.has(k2(x, z)))) continue;
    const d = Math.hypot(cx - mx, cz - mz); if (d < bd) { bd = d; best = [cx, cz]; }
  }
  if (best) {
    const [cx, cz] = best, R = 9;
    for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
      const x = cx - 2 + i, z = cz - 2 + j, edge = i === 0 || i === 4 || j === 0 || j === 4;
      put(x, R + 2, z, "light_gray_concrete");
      if (!edge) continue;
      const corner = (i === 0 || i === 4) && (j === 0 || j === 4);
      const pane = !corner && (i === 2 || j === 2);
      for (let y = R; y < R + 2; y++) put(x, y, z, pane ? "light_blue_stained_glass_pane" : "white_concrete");
    }
  }
}

// Panes join the neighbouring wall cells on their own row, so the glazing reads as a grid with frames.
for (const [key, v] of [...blocks]) {
  if (v.name !== "light_blue_stained_glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  const link = (dx, dz) => { const nk = k2(x + dx, z + dz); return wall.has(nk) && blocks.has(`${x + dx},${y},${z + dz}`); };
  blocks.set(key, { name: v.name, state: { north: String(link(0, -1)), south: String(link(0, 1)), east: String(link(1, 0)), west: String(link(-1, 0)), waterlogged: "false" } });
}

const g = new Voxels([X, Y, Z]);
for (const [key, v] of blocks) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, v.name, v.state);
}
const stats = g.save(OUT);
console.log(`footprint ${ground.size}, walls ${wall.size}, door ${[...door].join(" ")}, blocks ${stats.blocks}, palette ${stats.palette}`);
