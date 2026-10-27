// Way 24021002: an eight-storey 1930s Art Deco block of brick and cream plaster on a granite base and shopfront, with
// a stepped tower (its outer two cells held at the wing's 30, the core to 34) and a plant room on the roof. Massing
// follows the lidar roof, smoothed by a 3x3 median and snapped to two tiers; the ground is the cell's own foundation.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_24021002.cells.json`, "utf8"));

const at = new Map();
for (const [x, z, g, r] of cells) at.set(`${x},${z}`, { x, z, g, r });
const get = (x, z) => at.get(`${x},${z}`);
const SIDES = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const cs = [...at.values()];

// 1. Roof tiers: 3x3 median of the lidar roof; the tower where it reads 32 or more, the wing (30) elsewhere.
for (const c of cs) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = get(c.x + dx, c.z + dz); if (n) vals.push(n.r); }
  vals.sort((a, b) => a - b);
  c.tower = vals[vals.length >> 1] >= 32;
}

// 2. Setback: distance in from the tower's edge; the outer two cells stop at 30, the core rises to 34.
const dist = new Map(), queue = [];
for (const c of cs) if (c.tower && SIDES.some(([dx, dz]) => !get(c.x + dx, c.z + dz)?.tower)) { dist.set(c, 1); queue.push(c); }
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  for (const [dx, dz] of SIDES) { const n = get(c.x + dx, c.z + dz); if (n?.tower && !dist.has(n)) { dist.set(n, dist.get(c) + 1); queue.push(n); } }
}
for (const c of cs) c.top = c.tower && dist.get(c) > 2 ? 34 : 30;

// A side is open to air at height y when there is no footprint cell beside it or that cell's roof is below y.
const open = (c, y) => SIDES.some(([dx, dz]) => { const n = get(c.x + dx, c.z + dz); return !n || y >= n.top; });
// The parapet caps the outer edge: a missing neighbour, or a lower roof beside it.
const capEdge = (c) => SIDES.some(([dx, dz]) => { const n = get(c.x + dx, c.z + dz); return !n || n.top < c.top; });

// 3. Entrance: the lowest cell on the outside edge, nearest the footprint's middle.
const mx = cs.reduce((s, c) => s + c.x, 0) / cs.length, mz = cs.reduce((s, c) => s + c.z, 0) / cs.length;
const edge = [];
for (const c of cs) for (const [dx, dz] of SIDES) if (!get(c.x + dx, c.z + dz)) edge.push({ c, dx, dz });
const minG = Math.min(...edge.map((e) => e.c.g));
const door = edge.filter((e) => e.c.g === minG).sort((a, b) => Math.abs(a.c.x - mx) + Math.abs(a.c.z - mz) - (Math.abs(b.c.x - mx) + Math.abs(b.c.z - mz)))[0];
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const [tx, tz] = door.dx ? [0, 1] : [1, 0];
const entranceBay = [-1, 0, 1].map((k) => ({ x: door.c.x + k * tx, z: door.c.z + k * tz })).filter((p) => get(p.x, p.z));
const entrance = new Set(entranceBay.map((p) => `${p.x},${p.z}`));

const V = new Voxels([47, 47, 58]);
const put = (x, y, z, block, state) => V.set(x, y, z, block, state);

// The wall at height y, by its course: base, shopfront, storey lines, brick spandrels, glazed bays between cream piers.
function wall(c, y) {
  const pier = (c.x + c.z) % 4 === 0;
  if (y === c.g) return "polished_andesite";                 // base course
  if (y === c.top - 1) return "smooth_stone";                // coping under the parapet
  if (y < 4) return y === 3 ? "polished_blackstone" : pier ? "smooth_quartz" : "glass_pane";   // shopfront and fascia
  if (y % 4 === 0) return "smooth_quartz";                   // storey line
  if (y % 4 === 3) return "bricks";                          // brick spandrel under each window
  return pier ? "smooth_quartz" : "glass_pane";
}

for (const c of cs) {
  for (let y = 0; y <= c.top; y++) {
    if (y < c.g) { put(c.x, y, c.z, "stone_bricks"); continue; }                 // foundation up to the ground
    if (y === c.top) { if (capEdge(c)) put(c.x, y, c.z, "smooth_quartz"); continue; }   // parapet
    if (open(c, y)) { put(c.x, y, c.z, wall(c, y)); continue; }                    // the shell
    if (y === c.top - 1) put(c.x, y, c.z, "smooth_stone");                        // roof
    else if (y % 4 === 0 && y >= 4 && y <= c.top - 2) put(c.x, y, c.z, "smooth_stone");  // floor slab per storey
  }
}

// The entrance: a dark oak door in the bay, cream piers either side, a stone lintel over the three.
const g0 = door.c.g, face = FACING[`${door.dx},${door.dz}`];
for (const p of entranceBay) {
  const cc = get(p.x, p.z);
  put(p.x, g0 + 3, p.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  if (p.x === door.c.x && p.z === door.c.z) continue;
  put(p.x, g0 + 1, p.z, "smooth_quartz"); put(p.x, g0 + 2, p.z, "smooth_quartz");
}
for (const half of ["lower", "upper"]) put(door.c.x, g0 + (half === "lower" ? 1 : 2), door.c.z, "dark_oak_door", { facing: face, half, hinge: "left", open: "false", powered: "false" });

// Warm lights: some windows on the first row above a floor, lit from the air gap behind the glass.
for (const c of cs) {
  for (let y = 5; y < c.top - 2; y += 4) {
    if (y % 4 !== 1 || entrance.has(`${c.x},${c.z}`) || (c.x + c.z) % 4 === 0 || !open(c, y)) continue;
    if ((c.x * 13 + c.z * 7 + y) % 6 !== 0) continue;
    for (const [dx, dz] of SIDES) {
      const n = get(c.x + dx, c.z + dz);
      if (n && y >= n.g && y < n.top - 1 && !open(n, y)) { put(n.x, y, n.z, (c.x + c.z + y) % 12 === 0 ? "shroomlight" : "glowstone"); break; }
    }
  }
}

// The plant room on the tower's core: a 5 x 5 box (3 x 3 if the core is too small), walls and a roof on the core's roof.
const core = cs.filter((c) => c.top === 34 && dist.get(c) > 2);
const inCore = (x, z) => { const n = get(x, z); return n && n.top === 34 && dist.get(n) > 2; };
if (core.length) {
  const cx = Math.round(core.reduce((s, c) => s + c.x, 0) / core.length), cz = Math.round(core.reduce((s, c) => s + c.z, 0) / core.length);
  const h = [2, 1].find((k) => { for (let dx = -k; dx <= k; dx++) for (let dz = -k; dz <= k; dz++) if (!inCore(cx + dx, cz + dz)) return false; return true; });
  if (h) for (let dx = -h; dx <= h; dx++) for (let dz = -h; dz <= h; dz++) {
    const x = cx + dx, z = cz + dz, rim = Math.abs(dx) === h || Math.abs(dz) === h;
    const mid = rim && (Math.abs(dx) < h || Math.abs(dz) < h);       // a window on each face, not at the corners
    if (rim) { put(x, 34, z, "bricks"); put(x, 35, z, mid ? "glass_pane" : "smooth_quartz"); put(x, 36, z, "smooth_quartz"); }
    put(x, 37, z, "smooth_stone");                                    // roof on the walls, air beneath
  }
}

// Glass panes join their neighbours (glass, solid blocks) as the vanilla pane does: the side with air is open.
const sideName = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
for (const c of cs) for (let y = 0; y <= 40; y++) {
  if (V.get(c.x, y, c.z)?.block !== "glass_pane") continue;
  const st = { north: "false", east: "false", south: "false", west: "false", waterlogged: "false" };
  for (const [dx, dz] of SIDES) if (V.get(c.x + dx, y, c.z + dz)) st[sideName[`${dx},${dz}`]] = "true";
  put(c.x, y, c.z, "glass_pane", st);
}

const out = V.save(`${DIR}/way_24021002.nbt`);
console.log(`way_24021002: ${out.blocks} blocks, ${out.palette} palette; tower cells ${cs.filter((c) => c.top === 34).length}, entrance (${door.c.x},${door.c.z}) at ground ${g0}`);
