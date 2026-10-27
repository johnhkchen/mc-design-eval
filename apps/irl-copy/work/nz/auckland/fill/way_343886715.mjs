// A 1930s stripped-classical block of walk-up flats over shops, Mt Eden side of the city (way 343886715): four storeys
// over a basalt plinth, the lidar roof at 16-17 blocks snapped to a flat tier at 16 with a parapet to 17, and a lower
// one-to-three-storey ring down the downhill south and east edges. Cream plaster with quartz pilasters, glass panes in
// frames with a plaster string course and spandrel per storey, dark-oak shopfronts with a fascia on the ground floor, a
// dark-oak entrance on the low side, a plant room on the roof, glowstone behind some panes. Every column stands on its
// own foundation from y 0 to its ground; interiors are air with a floor slab per storey (no rooms).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_343886715.cells.json`, "utf8"));   // [x, z, ground, roof]
const OUT = `${DIR}/way_343886715.nbt`;

const W = 31, D = 26, H = 30;
const BASALT = "blackstone", PLINTH = "polished_blackstone_bricks", PLASTER = "smooth_quartz", PIER = "quartz_pillar";
const GLASS = "glass_pane", FASCIA = "dark_oak_planks", FLOOR = "stone", ROOF = "gray_concrete", LIGHT = "glowstone";
const PLANT = "stone_bricks", PLANT_TOP = "stone_brick_slab";

// footprint: col[x][z] = { g: ground, r: lidar roof above y 0 }
const col = Array.from({ length: W }, () => Array(D).fill(null));
for (const [x, z, g, r] of cells) col[x][z] = { g, r };
const inFoot = (x, z) => x >= 0 && z >= 0 && x < W && z < D && col[x][z] !== null;

// roof tiers on the storey grid (4 blocks): a flat 16 over most of it, 12 and 8 where the lidar drops, 4 at the low edge.
// A column is never shorter than one storey above its ground, and the low ground (0-1) gets one storey at least.
const tier = Array.from({ length: W }, () => Array(D).fill(0));
for (const [x, z, g, r] of cells) {
  const t = r >= 14 ? 16 : r >= 10 ? 12 : r >= 6 ? 8 : 4;
  tier[x][z] = Math.max(t, g <= 1 ? 4 : 8);
}
// lidar noise: three passes of each column taking the median tier of its 3x3 neighbourhood, so single cells and the
// cell-by-cell ramp on the north-east edge don't jag the roof line into a saw
let top = tier;
for (let pass = 0; pass < 3; pass++) {
  const next = Array.from({ length: W }, () => Array(D).fill(0));
  for (const [x, z] of cells) {
    const vals = [];
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inFoot(x + dx, z + dz)) vals.push(top[x + dx][z + dz]);
    vals.sort((a, b) => a - b);
    next[x][z] = vals[vals.length >> 1];
  }
  top = next;
}

// which sides of a column are exposed: 'out' to the street (no footprint), 'low' to a lower neighbour (a setback face)
const SIDES = [["N", 0, -1], ["S", 0, 1], ["E", 1, 0], ["W", -1, 0]];
const expo = Array.from({ length: W }, () => Array(D).fill(null));
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inFoot(x, z)) continue;
  const e = {};
  for (const [k, dx, dz] of SIDES) {
    const nx = x + dx, nz = z + dz;
    if (!inFoot(nx, nz)) e[k] = "out";
    else if (top[nx][nz] < top[x][z]) e[k] = "low";
  }
  expo[x][z] = Object.keys(e).length ? e : null;
}
const facade = (x, z) => expo[x][z] !== null;

// the blocks, keyed by position, so the glass panes can take their connections from their neighbours
const B = new Map();
const put = (x, y, z, block, state, meta) => B.set(`${x},${y},${z}`, { x, y, z, block, state, meta });
const at = (x, y, z) => B.get(`${x},${y},${z}`);

// the entrance: a window-bay cell on the ground floor of the low side, facing out to the street
let door = null;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  const e = expo[x][z]; if (!e || col[x][z].g !== 0) continue;
  const outs = Object.keys(e).filter((k) => e[k] === "out");
  if (outs.length !== 1 || Object.keys(e).length !== 1) continue;
  const idx = outs[0] === "N" || outs[0] === "S" ? x : z;
  if (idx % 3 === 0 || x < 4 || z < 4) continue;
  if (!door || x + z > door.x + door.z) door = { x, z, side: outs[0] };
}
const FACING = { N: "south", S: "north", E: "west", W: "east" };   // a door faces the person standing outside it

// the columns: foundation to ground, then plinth, storeys, cornice; interiors are air between the floor slabs
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inFoot(x, z)) continue;
  const { g } = col[x][z], T = top[x][z], e = expo[x][z];
  for (let y = 0; y < g; y++) put(x, y, z, BASALT);
  if (!e) {                                                  // interior: a floor slab on each storey line and the roof
    for (let y = g; y <= T; y++) {
      if (y === T) put(x, y, z, ROOF);
      else if (y === g || y % 4 === 0) put(x, y, z, FLOOR);
    }
    continue;
  }
  // facade: a column of piers and panes in the pattern of the face it stands on (x along north/south faces, z along east/west)
  const corner = Object.keys(e).length > 1;
  const alongX = e.N !== undefined || e.S !== undefined;
  const idx = alongX ? x : z;
  const pier = corner || idx % 3 === 0;
  const isDoor = door && door.x === x && door.z === z;
  for (let y = g; y <= T; y++) {
    if (y === g) { put(x, y, z, PLINTH); continue; }                  // base course
    if (y === T) { put(x, y, z, PLASTER); continue; }                 // cornice on the roof line
    if (y % 4 === 0) { put(x, y, z, PLASTER); continue; }             // string course at each floor line
    if (y % 4 === 3) { put(x, y, z, y < 4 ? FASCIA : PLASTER); continue; }   // spandrel, shopfront fascia on the ground
    if (isDoor && y <= 2) {                                          // the entrance: a two-high dark-oak door
      const state = { facing: FACING[door.side], hinge: "left", open: "false", powered: "false" };
      put(x, y, z, "dark_oak_door", { ...state, half: y === 1 ? "lower" : "upper" });
      continue;
    }
    if (pier) put(x, y, z, PIER);
    else put(x, y, z, GLASS, null, { plane: alongX ? "x" : "z" });
  }
  // a parapet on the street-facing roof line
  if (e && Object.values(e).includes("out") && T === 16) {
    put(x, T + 1, z, pier ? PIER : PLASTER);
  }
}

// the roof: a plant room on the 3x3 of roof cells nearest the middle, with a slab top
let best = null;
for (let x = 1; x < W - 2; x++) for (let z = 1; z < D - 2; z++) {
  let ok = true;
  for (let i = 0; i < 3 && ok; i++) for (let j = 0; j < 3 && ok; j++) {
    const cx = x + i, cz = z + j;
    if (!inFoot(cx, cz) || expo[cx][cz] || top[cx][cz] !== 16) ok = false;
  }
  if (!ok) continue;
  const d = Math.abs(x + 1 - W / 2) + Math.abs(z + 1 - D / 2);
  if (!best || d < best.d) best = { x, z, d };
}
if (best) for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
  const x = best.x + i, z = best.z + j;
  put(x, 17, z, PLANT); put(x, 18, z, PLANT); put(x, 19, z, PLANT_TOP, { type: "bottom", waterlogged: "false" });
}

// warm light: glowstone on the room behind about one window in four, on the storeys
for (const b of [...B.values()]) {
  if (b.block !== GLASS) continue;
  if ((b.x * 7 + b.z * 13 + b.y * 5) % 4 !== 0) continue;
  // the room is the neighbour on the side away from the street
  const e = expo[b.x][b.z]; if (!e) continue;
  const outDir = Object.keys(e).find((k) => e[k] === "out") ?? Object.keys(e)[0];
  const d = { N: [0, 1], S: [0, -1], E: [-1, 0], W: [1, 0] }[outDir];
  const rx = b.x + d[0], rz = b.z + d[1];
  if (!inFoot(rx, rz) || expo[rx][rz] || at(rx, b.y, rz)) continue;
  put(rx, b.y, rz, LIGHT);
}

// panes connect to the neighbours in their own plane, so they read as a frame of panes and not separate posts
const solidish = (b) => b && !["dark_oak_door", "glowstone"].includes(b.block);
for (const b of [...B.values()]) {
  if (b.block !== GLASS) continue;
  const ax = b.meta.plane === "x";
  const n = (dx, dz) => at(b.x + dx, b.y, b.z + dz);
  const conn = ax ? { east: solidish(n(1, 0)), west: solidish(n(-1, 0)), north: false, south: false }
                  : { north: solidish(n(0, -1)), south: solidish(n(0, 1)), east: false, west: false };
  b.state = Object.fromEntries(Object.entries(conn).map(([k, v]) => [k, String(v)]));
  b.state.waterlogged = "false";
}

const g = new Voxels([W, H, D]);
for (const b of B.values()) g.set(b.x, b.y, b.z, b.block, b.state);
const r = g.save(OUT);
console.log(`way_343886715: ${r.blocks} blocks, ${r.palette} palette entries, entrance ${door ? `(${door.x},${door.z}) facing ${FACING[door.side]}` : "none"}, plant room ${best ? `(${best.x},${best.z})` : "none"}`);
