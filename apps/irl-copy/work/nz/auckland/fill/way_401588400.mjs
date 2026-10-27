import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Quest on Eden: a 14-storey concrete-and-glass mid-rise (late-20th-century office / apartment) on a basalt plinth.
// Lidar roof ~58-61 across the plate, so the tops are snapped to storey lines (4 blocks) and the floors run on a
// datum of y 3 + 4k. Shell only: a floor slab per storey, a glazed facade one cell deep, air behind the glass.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_401588400.cells.json`, "utf8"));
const [W, H, D] = [35, 74, 30];

const k2 = (x, z) => x * 100 + z;
const foot = new Map(cells.map(([x, z, ground, roof]) => [k2(x, z), { x, z, ground, roof }]));
const inF = (x, z) => foot.has(k2(x, z));
const NB = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const outs = (x, z) => NB.filter(([dx, dz]) => !inF(x + dx, z + dz));

// depth from the outer edge: 1 on the perimeter, growing inward (4-neighbour BFS)
const depth = new Map();
let frontier = [];
for (const c of foot.values()) if (outs(c.x, c.z).length) { depth.set(k2(c.x, c.z), 1); frontier.push(c); }
while (frontier.length) {
  const next = [];
  for (const c of frontier) for (const [dx, dz] of NB) {
    const x = c.x + dx, z = c.z + dz, k = k2(x, z);
    if (inF(x, z) && !depth.has(k)) { depth.set(k, depth.get(k2(c.x, c.z)) + 1); next.push(foot.get(k)); }
  }
  frontier = next;
}

// the lidar roof, median-smoothed over the 3x3 and snapped to a storey line (top = 4m, its slab at 4m-1)
const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[s.length >> 1]; };
const tierOf = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const c = foot.get(k2(x + dx, z + dz)); if (c) v.push(c.roof); }
  return Math.max(12, 4 * Math.round(median(v) / 4));
};

const B = new Map();   // "x,y,z" -> { block, state, along }
const put = (x, y, z, block, state = null, along = null) => B.set(`${x},${y},${z}`, { block, state, along });
const at = (x, y, z) => B.get(`${x},${y},${z}`);
const top = new Map();

// 1. massing and facade, cell by cell
for (const c of foot.values()) {
  const { x, z } = c, T = tierOf(x, z); top.set(k2(x, z), T);
  const o = outs(x, z), perim = o.length > 0, corner = o.length > 1;
  const along = perim && o[0][0] !== 0 ? "z" : "x";     // the facade runs along z on an x-facing wall, and the reverse
  const u = along === "z" ? z : x;                      // position along the facade, for bays and piers
  for (let y = 0; y <= T; y++) {
    if (y === T) { if (perim) put(x, y, z, "white_concrete"); break; }   // parapet on the perimeter only
    if (y <= 2) { put(x, y, z, "stone_bricks"); continue; }                 // plinth: solid under every cell
    if (y === 3) { put(x, y, z, perim ? "stone_bricks" : "gray_concrete"); continue; }   // ground floor slab
    if (y % 4 === 3) { put(x, y, z, perim ? "light_gray_concrete" : "gray_concrete"); continue; }  // storey slabs, full plate
    if (!perim) continue;                                  // interior: air behind the glass
    if (corner) { put(x, y, z, "white_concrete"); continue; }
    const ground = y <= 6;
    if (u % 4 === 0) { put(x, y, z, ground ? "stone_bricks" : "white_concrete"); continue; }   // piers
    if (y === 6) { put(x, y, z, "stone_bricks"); continue; }                                    // shopfront fascia
    if (!ground && y % 4 === 0) { put(x, y, z, "white_concrete"); continue; }                  // spandrel
    put(x, y, z, (x * 2 + z * 3 + y) % 5 === 0 ? "gray_stained_glass_pane" : "light_blue_stained_glass_pane", null, along);
  }
}

// 2. the entrance on the largest outward face: two oak doors, a stone canopy over them
const faces = new Map();
for (const c of foot.values()) { const o = outs(c.x, c.z); if (o.length === 1) { const k = o[0].join(","); faces.set(k, [...(faces.get(k) ?? []), c]); } }
const [frontKey, front] = [...faces].sort((a, b) => b[1].length - a[1].length)[0];
const [nx, nz] = frontKey.split(",").map(Number);
const facing = { "0,-1": "north", "0,1": "south", "-1,0": "west", "1,0": "east" }[frontKey];
const alongOf = (c) => (nx !== 0 ? c.z : c.x);
front.sort((a, b) => alongOf(a) - alongOf(b));
const m = front.length >> 1;
const doorCells = front.slice(m, m + 2);
for (const c of doorCells) {
  put(c.x, 4, c.z, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(c.x, 5, c.z, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
}
for (const c of front.slice(m - 1, m + 3)) put(c.x + nx, 6, c.z + nz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

// 3. warm light behind the glass: glowstone on the ground floor, hanging lanterns from the slab above elsewhere
for (const c of foot.values()) {
  const o = outs(c.x, c.z);
  if (o.length !== 1) continue;
  const [dx, dz] = [-o[0][0], -o[0][1]];                    // one step inward from the glass
  const ix = c.x + dx, iz = c.z + dz;
  if (!inF(ix, iz) || outs(ix, iz).length) continue;
  for (let y = 4; y < top.get(k2(c.x, c.z)) - 1; y++) {
    const e = at(c.x, y, c.z);
    if (!e || !e.along) continue;
    if (y === 4 && (c.x + 3 * c.z) % 7 === 0) put(ix, 4, iz, "glowstone");
    else if (y % 4 === 2 && top.get(k2(ix, iz)) > y + 1 && (c.x * 3 + c.z * 5 + y) % 7 === 0)
      put(ix, y, iz, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// 4. glass panes join their neighbours in the facade plane, as a vanilla pane wall does
const solid = new Set(["stone_bricks", "light_gray_concrete", "white_concrete", "gray_concrete"]);
const joins = (e) => !!e && (e.block.endsWith("_pane") || solid.has(e.block));
for (const [key, e] of B) {
  if (!e.block.endsWith("_pane")) continue;
  const [x, y, z] = key.split(",").map(Number);
  const s = { north: "false", south: "false", east: "false", west: "false" };
  if (e.along === "z") { s.north = String(joins(at(x, y, z - 1))); s.south = String(joins(at(x, y, z + 1))); }
  else { s.west = String(joins(at(x - 1, y, z))); s.east = String(joins(at(x + 1, y, z))); }
  e.state = s;
}

// 5. plant enclosure on the roof of the tower plate (cells 5+ in from the edge, where the roof is at 60)
const plant = new Set([...foot.values()].filter((c) => depth.get(k2(c.x, c.z)) >= 5 && top.get(k2(c.x, c.z)) === 60).map((c) => k2(c.x, c.z)));
for (const k of plant) {
  const x = Math.floor(k / 100), z = k % 100;
  const edge = NB.some(([dx, dz]) => !plant.has(k2(x + dx, z + dz)));
  for (let y = 60; y <= 62; y++) if (edge) put(x, y, z, "light_gray_concrete");
  put(x, 63, z, "smooth_stone");
}

const g = new Voxels([W, H, D]);
for (const [key, e] of B) { const [x, y, z] = key.split(",").map(Number); g.set(x, y, z, e.block, e.state ?? undefined); }
const out = `${DIR}/way_401588400.nbt`;
const saved = g.save(out);
const tiers = {};
for (const T of top.values()) tiers[T] = (tiers[T] ?? 0) + 1;
console.log(JSON.stringify({ out, ...saved, footprint: foot.size, tiers, doorFace: frontKey, plantCells: plant.size }));
