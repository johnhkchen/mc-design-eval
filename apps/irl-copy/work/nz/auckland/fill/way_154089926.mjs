// way_154089926: a 1960s-70s reinforced-concrete office block, six storeys on a podium with a stepped nine-storey
// wing and a tower. The lidar roof heights are median-smoothed and quantised to 4-block storeys, so the massing is a
// few flat tiers. The shell is one cell thick and the core is air, with a floor slab at the top of every storey, so each
// course stands on the one below. Each storey: a white band, two rows of glazing between grey piers, a white band.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_154089926.cells.json`, "utf8"));

const g = new Voxels([28, 48, 40]);

const WALL = "light_gray_concrete";     // board-formed panels and piers
const BAND = "white_concrete";           // storey lines and floor slabs
const PLINTH = "stone_bricks";           // base course and foundation
const GLASS = "light_blue_stained_glass_pane";
const CORNICE = "smooth_stone";
const DOOR = "dark_oak_door";
const CANOPY = "dark_oak_planks";
const LIGHT = "glowstone";
const PENTHOUSE_CAP = "smooth_stone";

const key = (x, z) => `${x},${z}`;
const B = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { ground, roof }]));
const at = (x, z) => B.get(key(x, z));
const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };       // north is -z, as in vanilla

// Lidar noise: the median of the non-zero roofs in the 3x3 around each cell, then quantised to whole 4-block storeys
const median = (a) => a.sort((p, q) => p - q)[a.length >> 1];
const storeys = (v) => Math.max(8, 4 * Math.floor((v + 1) / 4));
for (const [k, c] of B) {
  const [x, z] = k.split(",").map(Number), vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const n = at(x + dx, z + dz); if (n && n.roof > 0) vals.push(n.roof);
  }
  c.top = vals.length ? storeys(median(vals)) : 8;
}

// the sides of cell (x, z) that face air at height y: off the footprint, or beside a neighbour whose roof is below y
const exposed = (x, z, y) => Object.keys(DIRS).filter((d) => {
  const [dx, dz] = DIRS[d], n = at(x + dx, z + dz);
  return !n || y >= n.top;
});
const bayOf = (x, z, d) => (d === "N" || d === "S" ? x : z);
const doorState = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });

// the entrance: the ground-floor cell on the north edge nearest the middle of that edge
const edge = [...B].filter(([k, c]) => c.ground === 0 && exposed(...k.split(",").map(Number), 1).includes("N"));
const midX = edge.reduce((s, [k]) => s + Number(k.split(",")[0]), 0) / edge.length;
const [doorKey] = edge.reduce((best, cur) => (Math.abs(Number(cur[0].split(",")[0]) - midX) < Math.abs(Number(best[0].split(",")[0]) - midX) ? cur : best));
const [doorX, doorZ] = doorKey.split(",").map(Number);

const windows = [];   // glazed cells, for the warm lights behind them
for (const [k, c] of B) {
  const [x, z] = k.split(",").map(Number), { ground: G, top: T } = c;
  for (let y = 0; y < G; y++) g.set(x, y, z, PLINTH);            // foundation: solid from y 0 up to the ground
  for (let y = G; y < T; y++) {
    const sides = exposed(x, z, y), o = y % 4;
    if (!sides.length) { if (o === 3) g.set(x, y, z, BAND); continue; }   // interior: the floor slab of each storey
    if (y === G) { g.set(x, y, z, PLINTH); continue; }                    // base course
    if (o === 0 || o === 3) { g.set(x, y, z, y < 4 && sides.includes("N") ? CORNICE : BAND); continue; }
    const front = y < 4 && sides.includes("N");                          // ground-floor shopfront on the north edge
    if (!front && (sides.length > 1 || bayOf(x, z, sides[0]) % 3 === 0)) { g.set(x, y, z, WALL); continue; }
    g.set(x, y, z, GLASS);
    windows.push({ x, y, z, d: sides[0] });
  }
  // the parapet: the top course on the edges, standing on the roof slab
  if (exposed(x, z, T).length) g.set(x, T, z, CORNICE);
}

// the entrance: two-block door, and a lintel canopy across the door bay
g.set(doorX, 1, doorZ, DOOR, doorState("lower"));
g.set(doorX, 2, doorZ, DOOR, doorState("upper"));
for (const dx of [-1, 0, 1]) if (at(doorX + dx, doorZ)) g.set(doorX + dx, 3, doorZ, CANOPY);

// warm light: a glowstone in the room behind some windows (only where that room cell is air)
for (const { x, y, z, d } of windows) {
  if ((x * 7 + y * 13 + z * 29) % 5 !== 0) continue;
  const [dx, dz] = DIRS[d], ix = x - dx, iz = z - dz;
  if (at(ix, iz) && g.val(ix, y, iz) === 0) g.set(ix, y, iz, LIGHT);
}

// the penthouse on the tallest interior roof: a plain box with a cap, standing on the roof slab
const topH = Math.max(...[...B.values()].map((c) => c.top));
for (const [k, c] of B) {
  const [x, z] = k.split(",").map(Number);
  if (c.top !== topH || exposed(x, z, topH).length) continue;
  for (let y = topH; y < topH + 3; y++) g.set(x, y, z, WALL);
  g.set(x, topH + 3, z, PENTHOUSE_CAP);
}

// glass panes connect to the solid blocks and panes beside them, as in vanilla
const name = (v) => v && v.block.replace("minecraft:", "");
const [X, Y, Z] = g.size;
for (let y = 0; y < Y; y++) for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (name(g.get(x, y, z)) !== GLASS) continue;
  const conn = (dx, dz) => { const n = name(g.get(x + dx, y, z + dz)); return n && n !== DOOR && n !== LIGHT ? "true" : "false"; };
  g.set(x, y, z, GLASS, { north: conn(0, -1), south: conn(0, 1), east: conn(1, 0), west: conn(-1, 0) });
}

const out = `${DIR}/way_154089926.nbt`;
const info = g.save(out);
console.log(`door at ${doorX},${doorZ}; top ${topH}; ${info.blocks} blocks, ${info.palette} palette entries -> ${out}`);
