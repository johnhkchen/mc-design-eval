import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Towny Apartments (way 1177545628): a mid-century Mt Eden walk-up flat block. Cream concrete with stone-brick base,
// light string courses per storey, glazed bays between concrete piers, a recessed top storey with a terrace, a
// stair-core tower where the lidar reads 26 m+, and a lintelled entrance. Roof tiers are 4-block storeys.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_1177545628.cells.json`, "utf8"));
const g = new Voxels([33, 42, 28]);

const NB4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const NB9 = [...NB4, [1, 1], [1, -1], [-1, 1], [-1, -1], [0, 0]];
const byXZ = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { x, z, ground, roof }]));
const at = (x, z) => byXZ.get(`${x},${z}`);
const list = [...byXZ.values()];

// 1. Smooth the lidar roof with a 3x3 median over footprint cells: noise and single-cell spikes drop out.
for (const c of list) {
  const v = NB9.map(([dx, dz]) => at(c.x + dx, c.z + dz)?.roof).filter((r) => r !== undefined).sort((a, b) => a - b);
  c.rs = v[v.length >> 1];
}

// 2. Depth in from the outer edge: d=1 is the street wall ring, d=2 the next room band, and so on.
let front = list.filter((c) => NB4.some(([dx, dz]) => !at(c.x + dx, c.z + dz)));
for (const c of front) c.d = 1;
for (let d = 1; front.length; d++) {
  const next = [];
  for (const c of front) for (const [dx, dz] of NB4) {
    const n = at(c.x + dx, c.z + dz);
    if (n && n.d === undefined) { n.d = d + 1; next.push(n); }
  }
  front = next;
}

// 3. Tiers: a 6-storey slab (top y 24), a 7-storey tower core (top y 28) where the smoothed roof is 26+, the outer
//    two bands stepped back to y 20 (a terrace on the 5th-floor roof). Never below ground + one storey.
// A lone 26+ cell is lidar noise (a spike); the tower needs three or more tall neighbours to count as a core.
const tallNb = (c) => NB9.filter(([dx, dz]) => (at(c.x + dx, c.z + dz)?.rs ?? 0) >= 26).length - 1;
for (const c of list) {
  c.top = c.rs >= 26 && tallNb(c) >= 3 ? 28 : Math.min(24, Math.max(c.ground + 4, 4 * Math.round(c.rs / 4)));
  if (c.top === 24 && c.d <= 2) c.top = 20;
}

// Floor plates: the ground slab, then one every 4 blocks above it, and the roof plate. Each sits on the one below.
const plates = (c) => {
  const f = new Set([c.ground, c.top - 1]);
  for (let y = c.ground + 4; y < c.top - 2; y += 4) f.add(y);
  return f;
};
for (const c of list) c.plates = plates(c);

// 4. Foundation, plates, walls. Walls stand on the outer ring, and on any face that rises above a lower neighbour.
for (const c of list) {
  for (let y = 0; y < c.ground; y++) g.set(c.x, y, c.z, "stone_bricks");
  for (const y of c.plates) g.set(c.x, y, c.z, "smooth_stone");
  for (let y = c.ground; y < c.top; y++) {
    if (c.plates.has(y)) continue;
    const stepFace = NB4.some(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return n && n.top < c.top && n.top <= y; });
    if (c.d !== 1 && !stepFace) continue;
    const storey = Math.max(...[...c.plates].filter((f) => f <= y));
    const row = y - storey;                                          // 0 = plate row, 1 = base or spandrel, 2-3 = glazing
    let block = "white_concrete";
    if (row === 1) block = storey === c.ground ? "stone_bricks" : "light_gray_concrete";
    else if (c.d === 1 && (c.x + c.z) % 3 !== 0) block = "light_blue_stained_glass";
    g.set(c.x, y, c.z, block);
  }
  if (c.d === 1) g.set(c.x, c.top, c.z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });   // parapet / cornice
  if (c.top === 24 && c.d >= 3 && (c.x * 3 + c.z * 7) % 19 === 0) g.set(c.x, 24, c.z, "light_gray_concrete");   // roof plant
  if (c.top === 20 && c.d === 2 && (c.x + c.z) % 4 === 0) g.set(c.x, 20, c.z, "oak_leaves", { persistent: "true" });   // terrace planters
  if (c.top === 28 && c.d >= 2 && (c.x + c.z) % 3 === 0) g.set(c.x, 28, c.z, "light_gray_concrete");   // tower crown plant
}

// 5. Entrance: the south-facing street wall nearest the middle of the front. Door, stone lintel over it, a lamp inside.
const southFace = list.filter((c) => c.d === 1 && !at(c.x, c.z + 1));
southFace.sort((a, b) => Math.abs(a.x - 16) - Math.abs(b.x - 16));
const e = southFace[0];
const door = { facing: "south", hinge: "left", open: "false", powered: "false" };
g.set(e.x, e.ground + 1, e.z, "dark_oak_door", { ...door, half: "lower" });
g.set(e.x, e.ground + 2, e.z, "dark_oak_door", { ...door, half: "upper" });
for (const dx of [-1, 0, 1]) {
  const n = at(e.x + dx, e.z);
  if (n && n.d === 1 && dx !== 0) g.set(n.x, e.ground + 3, n.z, "stone_bricks");
}
g.set(e.x, e.ground + 3, e.z, "stone_bricks");
const inside = at(e.x, e.z - 1);
if (inside && !g.get(inside.x, e.ground + 1, inside.z)) g.set(inside.x, e.ground + 1, inside.z, "lantern", { hanging: "false", waterlogged: "false" });

// 6. Warm light: about one glazed bay in eleven has a glowstone just inside, in the room behind the glass.
for (const c of list) {
  if (c.d !== 1 || (c.x + c.z) % 3 === 0) continue;
  const inner = NB4.map(([dx, dz]) => at(c.x + dx, c.z + dz)).find((n) => n && n.d === 2);
  if (!inner) continue;
  for (let y = c.ground; y < c.top; y++) {
    if (c.plates.has(y) || (c.x * 7 + c.z * 5 + y) % 11 !== 0) continue;
    if (g.get(c.x, y, c.z)?.block !== "minecraft:light_blue_stained_glass") continue;
    if (!g.get(inner.x, y, inner.z)) g.set(inner.x, y, inner.z, "glowstone");
  }
}

const out = `${DIR}/way_1177545628.nbt`;
const { blocks, palette } = g.save(out);
const tops = new Map(); for (const c of list) tops.set(c.top, (tops.get(c.top) ?? 0) + 1);
console.log(`cells ${list.length}, blocks ${blocks}, palette ${palette}, tops ${JSON.stringify([...tops])}, entrance (${e.x}, ${e.z})`);
