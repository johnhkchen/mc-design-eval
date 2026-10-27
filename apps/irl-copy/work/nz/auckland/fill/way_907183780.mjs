// Elam Fine Arts Studio, Grafton: a 1970s-80s concrete-frame art school, five storeys on a dark basalt plinth,
// pale architectural concrete between white piers, ribbon glazing with light-blue panes, a cornice band and a parapet.
// The roof is 21 blocks at the lidar's tallest core and 16 on the lower wings: smoothed with a 3x3 mean over the
// footprint, then snapped to three flat tiers (wings 16, main block 20, tower core 21). Each cell stands on its own
// lidar ground (foundation below it, the plinth at its top). Storey lines sit every 4 blocks from the ground up.
// The building is hollow: air behind the glass with a floor slab per storey, and a few glowstone-lit rooms.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const OUT = `${DIR}/way_907183780.nbt`;
const cells = JSON.parse(readFileSync(`${DIR}/way_907183780.cells.json`, "utf8"));
const W = 54, H = 34, D = 31;
const g = new Voxels([W, H, D]);

const M = {
  foundation: "stone_bricks",
  plinth: "polished_blackstone_bricks",
  band: "smooth_stone",
  spandrel: "light_gray_concrete",
  pier: "white_concrete",
  glass: "light_blue_stained_glass_pane",
  roof: "gray_concrete",
  plant: "light_gray_concrete",
  glow: "glowstone",
  door: "iron_door",
  hood: "stone_brick_slab",
  jamb: "polished_blackstone_bricks",
  lantern: "lantern",
};

const key = (x, z) => `${x},${z}`;
const foot = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { x, z, ground, roof }]));
const inside = (x, z) => foot.has(key(x, z));
const DIRS = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
const outward = (c) => DIRS.filter(([, dx, dz]) => !inside(c.x + dx, c.z + dz));
const NS = (n) => n === "north" || n === "south";

// 1. massing: 3x3 mean of the lidar roof over the footprint, then three flat tiers (wings / main block / tower core)
for (const c of foot.values()) {
  let sum = 0, n = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const o = foot.get(key(c.x + dx, c.z + dz)); if (o) { sum += o.roof; n++; }
  }
  const s = sum / n;
  c.R = s >= 20.5 ? 21 : s >= 18 ? 20 : 16;
}

// 2. storey lines: the cell's ground, then every 4 blocks above it (a short ground storey is allowed, never a stub)
const storeys = (c) => {
  const s = [c.ground];
  for (let y = 4; y <= c.R - 4; y += 4) if (y >= c.ground + 3) s.push(y);
  return s;
};

// 3. the entrance: a ground-level door on a south-facing edge, nearest the footprint's middle
let entrance = null;
for (const c of foot.values()) {
  const out = outward(c);
  if (c.ground !== 0 || out.length !== 1 || out[0][0] !== "south") continue;
  const ok = [-1, 1].every((a) => {
    const o = foot.get(key(c.x + a, c.z));
    return o && o.ground === 0 && outward(o).some((d) => d[0] === "south");
  });
  if (!ok) continue;
  const dist = Math.abs(c.x - 30) + Math.abs(c.z - 15) * 0.5;
  if (!entrance || dist < entrance.dist) entrance = { c, dist };
}
const door = entrance?.c;

// glass panes: which way they run (a pane on a north or south face joins east-west)
const paneState = (face) => NS(face)
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const litCandidates = [];

// 4. the solid: foundation below each cell, the storeys above it, perimeter walls, roof, parapet, cornice
for (const c of foot.values()) {
  const { x, z, ground: G, R } = c;
  const out = outward(c);
  const edge = out.length > 0;
  const S = storeys(c);
  for (let y = 0; y < G; y++) g.set(x, y, z, M.foundation);
  for (let y = G; y < R; y++) {
    if (S.includes(y)) { g.set(x, y, z, edge && y === G ? M.plinth : M.band); continue; }
    if (!edge) { if (y === R - 1) g.set(x, y, z, M.roof); continue; }
    if (y === R - 1) { g.set(x, y, z, M.band); continue; }
    const base = S.filter((s) => s <= y).pop();
    const next = S.find((s) => s > y) ?? R;
    const h = next - base, t = y - base;
    if (t === h - 1) { g.set(x, y, z, M.spandrel); continue; }   // the spandrel under each slab
    const along = NS(out[0][0]) ? x : z;
    if (out.length > 1 || along % 3 === 0) { g.set(x, y, z, M.pier); continue; }   // corners and every third bay
    g.set(x, y, z, M.glass, paneState(out[0][0]));
    if (t === 1) litCandidates.push({ x, y, z, face: out[0][0] });
  }
  if (edge) g.set(x, R, z, M.pier);   // the parapet

  // roof plant on the tower core: small two-high boxes, sitting on the roof membrane
  if (!edge && R === 21 && (x * 5 + z * 3) % 11 === 0) { g.set(x, R, z, M.plant); g.set(x, R + 1, z, M.plant); }
}

// 5. the entrance: double-height door, a hood over it, two hanging lanterns beside
if (door) {
  const { x, z, ground: G } = door;
  const [face] = outward(door)[0];
  const ax = NS(face) ? 1 : 0, az = NS(face) ? 0 : 1;
  const facing = face;
  g.set(x, G + 1, z, M.door, { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, G + 2, z, M.door, { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const a of [-1, 0, 1]) g.set(x + a * ax, G + 3, z + a * az, M.hood, { type: "bottom", waterlogged: "false" });
  for (const a of [-1, 1]) {
    g.set(x + a * ax, G + 1, z + a * az, M.jamb);   // dark stone jambs either side of the door
    g.set(x + a * ax, G + 2, z + a * az, M.lantern, { hanging: "true", waterlogged: "false" });
  }
}

// 6. warm rooms: a glowstone on the floor of some rooms behind the glass
for (const w of litCandidates) {
  if ((w.x * 31 + w.z * 17 + w.y * 7) % 5 !== 0) continue;
  const dir = DIRS.find((d) => d[0] === w.face);
  const qx = w.x - dir[1], qz = w.z - dir[2];
  if (!inside(qx, qz) || outward(foot.get(key(qx, qz))).length) continue;   // only an interior room, not a wall
  g.set(qx, w.y, qz, M.glow);
}

const info = g.save(OUT);
const blocks = info.blocks;
// every block sits on something, or on a neighbour at its own level (floor slabs rest on the walls around them)
let floating = 0;
g.forEachCell((i, v) => {
  const X = W, Y = H;
  const x = i % X, y = Math.floor(i / X) % Y, z = Math.floor(i / (X * Y));
  if (y === 0) return;
  const solid = (a, b, c2) => g.val(a, b, c2) !== 0;
  const hangs = g.palette[v].block === "minecraft:lantern" || g.palette[v].block === "minecraft:iron_door" && g.palette[v].state?.half === "upper";
  if (solid(x, y - 1, z) || hangs) return;
  if (solid(x + 1, y, z) || solid(x - 1, y, z) || solid(x, y, z + 1) || solid(x, y, z - 1)) return;
  if (g.palette[v].block.endsWith("pane") || g.palette[v].block.endsWith("door")) return;
  floating++;
});
const tiers = {};
for (const c of foot.values()) tiers[c.R] = (tiers[c.R] || 0) + 1;
console.log(JSON.stringify({ blocks, palette: info.palette, entrance: door ? [door.x, door.z] : null, tiers, floating }));
