// 12 East 52nd Street, 1930 commercial and office building: a limestone-faced Art Deco setback block on a granite base.
// Footprint 8 x 28 (x = across the block, z = depth, low z = north = the 52nd Street side). Its lidar roof steps from
// about 30 blocks (10 storeys, the tower at its west-centre) down to 18 (6 storeys) on the south wing. Solid storey
// floors and tier ledges so every wall stands on what is below; an air gap behind each pane, warm lights behind some.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035477.cells.json`, "utf8"));
const X = 8, Z = 28, Y = 34;

const key = (x, z) => `${x},${z}`;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Roof: a 3x3 median of the lidar returns (zero = no return, left out of the median), rounded to whole storeys.
const lidar = new Map(cells.map(([x, z, , roof]) => [key(x, z), roof]));
const roofNear = (x, z) => {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const r = lidar.get(key(x + dx, z + dz));
    if (r > 0) v.push(r);
  }
  v.sort((a, b) => a - b);
  return v.length ? v[v.length >> 1] : 18;
};
const H = new Map(cells.map(([x, z]) => [key(x, z), Math.max(3, Math.round(roofNear(x, z) / 3) * 3)]));
const hOf = (x, z) => H.get(key(x, z)) ?? 0;                       // 0 outside the footprint
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => hOf(x + dx, z + dz) <= y);   // outside, or lower than y
const ledgeAt = (x, z, y) => DIRS.some(([dx, dz]) => { const n = hOf(x + dx, z + dz); return n > 0 && n < hOf(x, z) && y === n - 1; });

const g = new Voxels([X, Y, Z]);
const glazed = [];

// 1. The shell: granite base at y 0, a smooth limestone storey floor at every third row (y 3, 6, ...), limestone
// walls on the perimeter with quartz piers on every third column, glass between them, and a solid roof on each tier.
// Air everywhere else. A tier's wall stands on a ledge at the lower roof's level.
for (const [k, h] of H) {
  const [x, z] = k.split(",").map(Number);
  g.set(x, 0, z, "polished_granite");
  for (let y = 1; y < h; y++) {
    const ex = exposed(x, z, y);
    if (ledgeAt(x, z, y) || y === h - 1 || y % 3 === 0) {
      g.set(x, y, z, y === h - 1 && !ex.length ? "gray_concrete" : "smooth_quartz");
      continue;
    }
    if (!ex.length) continue;                                       // air behind the glass
    const [dx, dz] = ex[0];
    const u = dz !== 0 ? x : z;                                     // along the face
    if (ex.length >= 2 || u % 3 === 0) g.set(x, y, z, "quartz_pillar", { axis: "y" });
    else { g.set(x, y, z, "light_blue_stained_glass"); glazed.push({ x, y, z, dx, dz, u }); }
  }
  // Cornice on every edge that drops away: a granite cap on the parapet.
  if (DIRS.some(([dx, dz]) => hOf(x + dx, z + dz) < h)) g.set(x, h, z, "polished_granite_slab", { type: "bottom", waterlogged: "false" });
}

// 2. Entrance on the 52nd Street (north) face: an iron door in a granite surround, a granite lintel, and a lobby
// lantern on the floor behind it.
const door = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
for (const y of [1, 2]) {
  g.set(2, y, 0, "polished_granite");
  g.set(4, y, 0, "polished_granite");
  g.set(3, y, 0, "iron_door", door(y === 1 ? "lower" : "upper"));
}
for (const x of [2, 3, 4]) g.set(x, 3, 0, "polished_granite");
g.set(3, 1, 1, "lantern", { hanging: "false", waterlogged: "false" });
glazed.splice(0, glazed.length, ...glazed.filter((p) => !(p.z === 0 && (p.x === 2 || p.x === 4))));

// 3. Warm light behind some panes: one bay in four, on a diagonal so it doesn't stripe. Ground-floor lanterns sit on
// the granite floor; upper-storey glowstone stands on its storey floor.
for (const p of glazed) {
  const storey = Math.floor(p.y / 3);
  if (p.y % 3 !== 1 || (p.u + storey) % 4 !== 0) continue;
  const ix = p.x - p.dx, iz = p.z - p.dz;
  if (hOf(ix, iz) <= p.y || g.get(ix, p.y, iz)) continue;
  if (p.y === 1) g.set(ix, p.y, iz, "lantern", { hanging: "false", waterlogged: "false" });
  else g.set(ix, p.y, iz, "glowstone");
}

// 4. Roof plant: a 2 x 2 penthouse on the top tier's roof (x 6-7, z 14-15), three storeys of limestone with a granite cap.
for (let z = 14; z <= 15; z++) for (let x = 6; x <= 7; x++) {
  const base = hOf(x, z);
  if (base !== 30) throw new Error(`penthouse cell ${x},${z} sits on ${base}, want 30`);
  for (let y = base; y < base + 3; y++) g.set(x, y, z, "smooth_quartz");
  g.set(x, base + 3, z, "polished_granite_slab", { type: "bottom", waterlogged: "false" });
}

const { blocks, palette } = g.save(`${DIR}/NYC1035477.nbt`);
console.log(`NYC1035477: ${blocks} blocks, palette ${palette}, size ${X} x ${Y} x ${Z}`);
