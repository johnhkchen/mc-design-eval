// Way 291058266: a 1930s four-storey brick commercial block (red brick, cream concrete trim, polished andesite plinth,
// shopfront ground floor) with a two-storey attic core set back on the roof. Lidar roof ~18 across the body, ~19-20 in
// the core; the attic tops out at 21 blocks above the lowest ground.
// Storey layout (absolute y, 1.2 blocks/m): plinth 0-2, floor bands at 2, 6, 10, 14, windows b+1..b+2, lintel b+3,
// roof deck 18, attic core 19-20. Interiors are air behind the glass, with a floor slab per storey.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_291058266.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..26, z 0..32

const key = (x, z) => x + "," + z;
const fp = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { x, z, g: ground, r: roof }]));
const inFp = (x, z) => fp.has(key(x, z));
const all = [...fp.values()];
const valid = (c) => c.r - c.g >= 8;                                  // roof 0/2/9 under a 17-20 roof are lidar noise

// 3x3 median of the valid roof heights around each cell: the smoothed roof the core test reads
for (const c of all) {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = fp.get(key(c.x + dx, c.z + dz)); if (n && valid(n)) v.push(n.r); }
  v.sort((a, b) => a - b); c.sm = v.length ? v[v.length >> 1] : 18;
}

// edges: a cell exposed in X faces west/east (the wall runs along z); exposed in Z faces north/south
for (const c of all) {
  c.exX = !inFp(c.x - 1, c.z) || !inFp(c.x + 1, c.z);
  c.exZ = !inFp(c.x, c.z - 1) || !inFp(c.x, c.z + 1);
  c.perim = c.exX || c.exZ;
}

// distance in cells from the outer wall (breadth-first over the footprint)
const dist = new Map(); let frontier = all.filter((c) => c.perim);
for (const c of frontier) dist.set(key(c.x, c.z), 0);
for (let d = 1; frontier.length; d++) {
  const next = [];
  for (const c of frontier) for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const k = key(c.x + dx, c.z + dz); if (fp.has(k) && !dist.has(k)) { dist.set(k, d); next.push(fp.get(k)); }
  }
  frontier = next;
}
const d0 = (c) => dist.get(key(c.x, c.z)) ?? 0;

// the attic core: the smoothed roof at 19+ and at least 3 cells in from the wall (a setback tower on the body)
const isCore = (x, z) => { const c = fp.get(key(x, z)); return !!c && c.sm >= 19 && d0(c) >= 3; };

const BAND = [2, 6, 10, 14];                                          // floor slab layers (storey s: band, windows b+1..b+2, lintel b+3)
const ROOF = 18;                                                       // roof deck: solid across the body, parapet on the wall
const CORE_LOW = 19, CORE_CAP = 20;                                    // attic: a glazed storey and a cap, tops at 21

const g = new Voxels([27, 33, 33]);

// a window pane oriented along its wall: west/east walls run along z, north/south walls along x
const pane = (exX) => (exX
  ? { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" }
  : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" });
const pier = (c, along) => (c.exX && c.exZ) || along % 3 === 0;      // corners and every third cell are brick piers

// the ground under each cell: solid from y 0 up to its ground, then a polished andesite plinth to the ground floor
for (const c of all) {
  for (let y = 0; y < Math.max(c.g, 3); y++) g.set(c.x, y, c.z, "polished_andesite");
}

// floor slabs (interior and wall alike), the ground course and the roof deck
for (const c of all) {
  for (const b of BAND.slice(1)) g.set(c.x, b, c.z, "smooth_stone");
  g.set(c.x, ROOF, c.z, "smooth_stone");
}

// the four storeys of wall: brick piers, glazed windows with cream lintels, a dark shopfront at street level
for (const c of all) {
  if (!c.perim) continue;
  const along = c.exX && !c.exZ ? c.z : c.x;                          // position along the wall
  const brickWall = pier(c, along);
  BAND.forEach((b, s) => {
    for (let y = b + 1; y <= b + 3; y++) {
      if (brickWall) { g.set(c.x, y, c.z, "bricks"); continue; }
      if (y === b + 3) g.set(c.x, y, c.z, s === 0 ? "dark_oak_planks" : "white_concrete");
      else g.set(c.x, y, c.z, "glass_pane", pane(c.exX && !c.exZ));
    }
  });
}

// the core's wall above the body roof: a glazed attic storey inside its own piers, capped at 21
const coreCells = all.filter((c) => isCore(c.x, c.z));
for (const c of coreCells) {
  const cEdgeX = !isCore(c.x - 1, c.z) || !isCore(c.x + 1, c.z);
  const cEdgeZ = !isCore(c.x, c.z - 1) || !isCore(c.x, c.z + 1);
  for (let y = ROOF + 1; y <= CORE_CAP; y++) g.set(c.x, y, c.z, "smooth_stone");          // cap at 20 (and nothing inside)
  if (!cEdgeX && !cEdgeZ) continue;                                    // interior: air behind the glass at 19
  const along = cEdgeX && !cEdgeZ ? c.z : c.x;
  g.set(c.x, CORE_LOW, c.z, (cEdgeX && cEdgeZ) || along % 3 === 0 ? "bricks" : "glass_pane", pane(cEdgeX && !cEdgeZ));
}
// a shroomlight glowing in the attic, standing on the roof deck at 18
const attic = coreCells.filter((c) => d0(c) >= 4);
if (attic.length) { const m = attic[attic.length >> 1]; g.set(m.x, CORE_LOW, m.z, "shroomlight"); }

// the entrance: a dark oak door on the north wall's middle, a stone canopy above, and warm glow behind some glass
const north = all.filter((c) => c.perim && c.exZ && !inFp(c.x, c.z - 1));
const midX = north.map((c) => c.x).sort((a, b) => a - b)[north.length >> 1];
const door = north.reduce((best, c) => (Math.abs(c.x - midX) < Math.abs(best.x - midX) ? c : best));
g.set(door.x, 3, door.z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(door.x, 4, door.z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(door.x, 5, door.z, "stone_brick_stairs", { facing: "north", half: "top", shape: "straight", waterlogged: "false" });

// glowstone behind some glazed windows on the 2nd and 4th storeys (air on the inside of the glass)
for (const c of all) {
  if (!c.perim || (c.exX && c.exZ)) continue;
  const along = c.exX ? c.z : c.x;
  if (along % 6 !== 1) continue;
  const ix = c.exX ? (c.x === 0 || !inFp(c.x - 1, c.z) ? c.x + 1 : c.x - 1) : c.x;
  const iz = c.exZ ? (!inFp(c.x, c.z - 1) ? c.z + 1 : c.z - 1) : c.z;
  const inner = fp.get(key(ix, iz)); if (!inner || inner.perim) continue;
  for (const [s, b] of BAND.entries()) if (s === 0 || s === 2) g.set(ix, b + 2, iz, "glowstone");
}

// roof plant: a few iron boxes (2x2) on the roof deck, out of the attic and off the wall
let plant = 0;
for (const c of all) {
  if (plant >= 3 || isCore(c.x, c.z) || d0(c) < 3) continue;
  if ((c.x * 7 + c.z * 3) % 61 !== 0) continue;
  const block = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([dx, dz]) => fp.get(key(c.x + dx, c.z + dz)));
  if (block.some((n) => !n || isCore(n.x, n.z) || d0(n) < 2)) continue;
  for (const n of block) g.set(n.x, ROOF + 1, n.z, "iron_block");
  plant++;
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_291058266.nbt";
const info = g.save(out);
console.log(JSON.stringify({ footprint: all.length, core: coreCells.length, plant, door: [door.x, door.z], ...info }));
