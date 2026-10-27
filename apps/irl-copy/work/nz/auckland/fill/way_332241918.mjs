// Footprint 332241918: a 1930s stripped-classical commercial block, five storeys over a basalt plinth on a
// north-west to south-east slope. Cream plaster piers, red terracotta storey bands, a dark shopfront at street level,
// a quartz cornice, and a penthouse on the high tier. Shell only: a floor slab per storey, a few interior columns,
// an air gap behind every window, and a lit lamp in some of them.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_332241918.cells.json`, "utf8"));   // [x, z, ground, roof]

const key = (x, z) => `${x},${z}`;
const cell = new Map();
for (const [x, z, g, r] of cells) cell.set(key(x, z), { x, z, g, lidar: r });
const has = (x, z) => cell.has(key(x, z));
const median = (a) => { a.sort((p, q) => p - q); return a[a.length >> 1]; };
const P = (g) => 4 * Math.ceil(g / 4);                               // the first storey line above the plinth

// Lidar roof: a 3x3 median over the footprint (noise out), snapped to even blocks (tiers in), never under 4 above ground
for (const c of cell.values()) {
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = cell.get(key(c.x + dx, c.z + dz)); if (n) vals.push(n.lidar); }
  c.r = Math.min(22, Math.max(2 * Math.round(median(vals) / 2), c.g + 4));
}
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const NAME = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
for (const c of cell.values()) {
  c.out = DIRS.filter(([dx, dz]) => !has(c.x + dx, c.z + dz));       // sides facing outside the footprint
  c.edge = c.out.length > 0;
}
for (const c of cell.values()) {
  c.deep = !c.edge && DIRS.concat([[1, 1], [1, -1], [-1, 1], [-1, -1]]).every(([dx, dz]) => { const n = cell.get(key(c.x + dx, c.z + dz)); return n && !n.edge; });
}

const V = new Voxels([38, 35, 25]);
const put = (x, y, z, block, state) => V.set(x, y, z, block, state);

// The front door: the outside-south edge cell nearest the middle of that run
const southEdge = [...cell.values()].filter((c) => c.edge && c.out.some(([, dz]) => dz === 1));
const mx = southEdge.reduce((s, c) => s + c.x, 0) / southEdge.length;
const door = southEdge.reduce((best, c) => (!best || Math.abs(c.x - mx) < Math.abs(best.x - mx) ? c : best), null);

for (const c of cell.values()) {
  const { x, z, g, r } = c;
  const top = r - 1, floor0 = P(g);
  for (let y = 0; y < g; y++) put(x, y, z, "stone");                 // foundation: nothing floats on the slope

  if (!c.edge) {                                                     // interior: plinth, a slab per storey, roof deck
    for (let y = g; y < floor0; y++) put(x, y, z, "stone_bricks");
    for (let y = floor0; y <= top; y += 4) put(x, y, z, "smooth_stone");
    put(x, top, z, "smooth_stone");
    if (c.deep && x % 3 === 1 && z % 3 === 1) for (let y = g; y <= top; y++) put(x, y, z, "quartz_pillar", { axis: "y" });
    if (c.deep && r >= 22) for (let y = r; y <= r + 1; y++) put(x, y, z, "stone_bricks");   // penthouse on the high tier
    continue;
  }

  // Street face: the outward side decides the bay pattern; corners are solid piers
  const corner = c.out.some(([dx]) => dx) && c.out.some(([, dz]) => dz);
  const [nx, nz] = c.out[0];
  const u = nz !== 0 ? x : z;                                       // along the wall
  const outward = NAME[`${nx},${nz}`];
  const paneState = nz !== 0
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  for (let y = g; y <= top; y++) {
    if (y === top) { put(x, y, z, "quartz_block"); continue; }                  // cornice
    if (y < floor0) {                                                            // basalt base course
      if (door === c && y === floor0 - 1) put(x, y, z, "stone_brick_stairs", { facing: outward, half: "bottom", shape: "straight", waterlogged: "false" });
      else put(x, y, z, "stone_bricks");
      continue;
    }
    const b = 4 * Math.floor(y / 4), o = y - b, shop = b === floor0;
    if (c === door && shop && o <= 1) {                                          // the entrance: a two-leaf-high door
      put(x, y, z, "dark_oak_door", { facing: outward, half: o ? "upper" : "lower", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (o === 0) { put(x, y, z, shop ? "dark_oak_planks" : "red_terracotta"); continue; }   // sill or storey band
    if (o === 3) { put(x, y, z, shop ? "dark_oak_planks" : "quartz_block"); continue; }     // lintel or canopy
    if (c === door) { if (o === 2) put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" }); continue; }
    if (corner || u % 3 === 0) { put(x, y, z, shop ? "dark_oak_planks" : "quartz_block"); continue; }   // piers
    put(x, y, z, "light_blue_stained_glass_pane", paneState);
    const k = b / 4;
    const inner = cell.get(key(x - nx, z - nz));                              // the air gap behind the glass
    if (o === 1 && inner && !inner.edge && (u + k) % 4 === 1) put(inner.x, y, inner.z, "glowstone");   // a lamp on the floor behind the glass
  }
}

const out = `${DIR}/way_332241918.nbt`;
const stats = V.save(out);
console.log(JSON.stringify({ footprint: cells.length, door: door && [door.x, door.z], ...stats }));
