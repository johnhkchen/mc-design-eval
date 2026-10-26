// DC59015: a 4-storey Federal-style office block (calcite and quartz, light-blue glass) with a set-back attic
// pavilion, a stepped lower wing to the east and a columned entrance portico on the north front.
// Lidar tops are smoothed into flat tiers: 17 (body, cornice on top), 19 (attic set back one cell), 1-3 (wing).
// Every column is solid from y 0 up to its top, then hollowed: an interior cell (all six neighbours solid, not a
// floor slab) becomes air, so each storey stands on a slab and windows have an air gap behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC59015.cells.json`, "utf8"));
const W = 14, H = 32, D = 17;

const k2 = (x, z) => `${x},${z}`;
const K = (x, y, z) => `${x},${y},${z}`;
const DIRS4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const NB6 = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];

const roofAt = new Map();
for (const [x, z, , roof] of cells) roofAt.set(k2(x, z), roof);
const foot = (x, z) => roofAt.has(k2(x, z));
const roofOf = (x, z) => roofAt.get(k2(x, z)) ?? 0;

// the north portico: the three cells on the z=0 row (lidar roof 3 there), a canopy over the entrance
const isPortico = (x, z) => z === 0 && x >= 7 && x <= 9;

// attic pavilion: lidar 20s, inset one cell from the footprint edge so it steps back from the body
const attic = new Set();
for (const [x, z, , r] of cells) {
  if (r >= 19 && DIRS4.every(([dx, dz]) => roofOf(x + dx, z + dz) >= 19)) attic.add(k2(x, z));
}

// flat tiers: body top 17 (roof 17-20 smoothed), low wings at roof-1 (roof 2, 3, 4 -> top 1, 2, 3)
const topOf = (x, z) => {
  if (isPortico(x, z)) return 2;
  if (attic.has(k2(x, z))) return 19;
  const r = roofOf(x, z);
  return r >= 17 ? 17 : r - 1;
};

// storey lines (floor slabs) at 1, 5, 9, 13, the body cornice at 17, the attic floor at 19; clipped to the column top
const slabsOf = (x, z) => {
  const t = topOf(x, z);
  const s = new Set([1, 5, 9, 13, 17, t]);
  if (attic.has(k2(x, z))) s.add(19);
  return new Set([...s].filter((v) => v <= t));
};

// 1. solid columns from y 0 to each cell's top
const S = new Set();
const slabs = new Map();
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const t = topOf(x, z);
  slabs.set(k2(x, z), slabsOf(x, z));
  for (let y = 0; y <= t; y++) S.add(K(x, y, z));
}

// 2. hollow the interior: not the plinth, not a slab, every neighbour solid
const dead = [];
for (const k of S) {
  const [x, y, z] = k.split(",").map(Number);
  if (y === 0 || slabs.get(k2(x, z)).has(y)) continue;
  if (NB6.every(([dx, dy, dz]) => S.has(K(x + dx, y + dy, z + dz)))) dead.push(k);
}
for (const k of dead) S.delete(k);

const open = (x, y, z) => !S.has(K(x, y, z));
const connect = (x, y, z) => (S.has(K(x, y, z)) ? "true" : "false");

const g = new Voxels([W, H, D]);
const SILL = { type: "bottom", waterlogged: "false" };

// 3. materials: plinth, slabs, roof surface, and a facade grid on the exposed faces
for (const k of S) {
  const [x, y, z] = k.split(",").map(Number);
  if (isPortico(x, z)) continue;
  const t = topOf(x, z), sl = slabs.get(k2(x, z));
  const onNS = open(x, y, z - 1) || open(x, y, z + 1);
  const onEW = open(x + 1, y, z) || open(x - 1, y, z);
  const horiz = onNS || onEW;
  if (y === 0) { g.set(x, y, z, "stone_bricks"); continue; }
  if (y === t && !horiz) { g.set(x, y, z, "stone"); continue; }          // flat roof surface
  if (sl.has(y)) { g.set(x, y, z, "smooth_quartz"); continue; }          // storey lines and cornice
  // a wall row inside a storey band: sill row first (if the band is tall enough), then glass rows
  const below = [...sl].filter((v) => v < y), above = [...sl].filter((v) => v > y);
  const s = Math.max(...below), e = Math.min(...above);
  const isSill = e - s - 1 >= 3 && y === s + 1;
  // piers every third cell along each facade; glass in the others
  const winNS = onNS && x % 3 !== 0, winEW = onEW && z % 3 !== 0;
  if (!(winNS || winEW)) { g.set(x, y, z, "calcite"); continue; }
  if (isSill) { g.set(x, y, z, "smooth_quartz_slab", SILL); continue; }
  if (winNS) {
    g.set(x, y, z, "light_blue_stained_glass_pane", { north: "false", south: "false", east: connect(x + 1, y, z), west: connect(x - 1, y, z), waterlogged: "false" });
  } else {
    g.set(x, y, z, "light_blue_stained_glass_pane", { north: connect(x, y, z - 1), south: connect(x, y, z + 1), east: "false", west: "false", waterlogged: "false" });
  }
  // a hanging lantern just inside the top glass row of every sixth window (warm light in the air gap)
  if (y === e - 1) {
    const inward = winNS ? (open(x, y, z - 1) ? [x, y, z + 1] : [x, y, z - 1]) : (open(x + 1, y, z) ? [x - 1, y, z] : [x + 1, y, z]);
    const phase = winNS ? x % 6 : z % 6;
    if (phase === 1 && !S.has(K(...inward))) g.set(inward[0], inward[1], inward[2], "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// 4. the portico: two quartz columns and an entablature, a lower door in the middle, steps are the plinth
g.set(7, 0, 0, "stone_bricks"); g.set(8, 0, 0, "stone_bricks"); g.set(9, 0, 0, "stone_bricks");
g.set(7, 1, 0, "quartz_pillar", { axis: "y" });
g.set(9, 1, 0, "quartz_pillar", { axis: "y" });
g.set(7, 2, 0, "smooth_quartz");
g.set(9, 2, 0, "smooth_quartz");
g.set(8, 1, 0, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(8, 2, 0, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });

// 5. roof plant: two 2x2 units on the flat body roof, away from the attic and the edge (iron block, on the roof surface)
const innerTop = (x, z) => foot(x, z) && topOf(x, z) === 17 && !attic.has(k2(x, z)) && !isPortico(x, z) && DIRS4.every(([dx, dz]) => S.has(K(x + dx, 17, z + dz)));
const units = [];
for (let x = 2; x <= 10 && units.length < 2; x++) for (let z = 2; z <= 14 && units.length < 2; z++) {
  const cs = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (!cs.every(([a, b]) => innerTop(a, b))) continue;
  if (units.some((u) => Math.abs(u[0] - x) < 4 && Math.abs(u[1] - z) < 4)) continue;
  units.push([x, z]);
}
for (const [x, z] of units) for (const [a, b] of [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]]) g.set(a, 18, b, "iron_block");

const res = g.save(`${DIR}/DC59015.nbt`);
console.log(JSON.stringify({ ...res, attic: attic.size, units: units.length, hollowed: dead.length }));
