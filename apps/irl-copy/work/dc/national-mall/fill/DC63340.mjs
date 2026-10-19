// DC63340: the Museum of the Bible at 300 D Street SW, read from the lidar record. A 2017 limestone-clad museum with a
// three-storey main block (11 blocks), a 14-block tower on its north-west side and a 3-block single-storey wing on the
// south-west edge. Calcite piers between glass bays, smooth-stone spandrels, a stone-brick base course and cornice,
// a parapet of calcite on the roof, and copper roof plant. The entrance is a recessed double door on the north face
// with hanging lanterns under the storey-two floor (the footprint can't carry a projecting canopy).
//
// Floors sit on absolute 3-block rhythms (slab at y 0, 3, 6, 9), so the storeys line up across tiers. Each column is
// solid from y 0 up to its ground as foundation, then its floor slabs, a deck layer under the roof, and a cover layer.
// Where a column stands beside a lower tier, the row at that lower roof is solid so the walls above it stand on something.
// Facade cells show glass bays and calcite piers in the air rows; interior air stays air except for glowstone lamps
// behind some bays. No interiors: a floor slab per storey and an open air gap behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC63340.cells.json`, "utf8"));
const W = 75, D = 36, H = 26;

const key = (x, z) => `${x},${z}`;
const byXZ = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inside = (x, z) => byXZ.has(key(x, z));
const N4 = [[0, -1], [0, 1], [-1, 0], [1, 0]];   // N, S, W, E (z-1 is north: the street front)
const minX = Math.min(...cells.map((c) => c[0])), minZ = Math.min(...cells.map((c) => c[1]));
const raw = (x, z) => byXZ.get(key(x, z)).r;

// Lidar tiers: a cluster of low roofs (3 blocks) is the wing, the 13-14 roofs are the tower, the rest is the 11-block main.
// Single-cell noise (4, 6, 8, 10) falls to the main block, and the 0-2 edge readings take the majority of their neighbours.
const isWing = (x, z) => {
  if (raw(x, z) > 8) return false;
  let low = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (!(dx === 0 && dz === 0) && inside(x + dx, z + dz) && raw(x + dx, z + dz) <= 8) low++;
  return low >= 4;
};
const isTall = (x, z) => !isWing(x, z) && raw(x, z) >= 13;
// The tower's outer ring (touching the main block or the wing) sets back to the 11-block podium roof.
const isRing = (x, z) => isTall(x, z) && N4.some(([dx, dz]) => inside(x + dx, z + dz) && !isTall(x + dx, z + dz));
const H_OF = new Map();
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  H_OF.set(key(x, z), isWing(x, z) ? 3 : isTall(x, z) && !isRing(x, z) ? 14 : 11);
}
const h = (x, z) => H_OF.get(key(x, z));

// The entrance: the middle of the north edge.
const northXs = cells.filter(([, z]) => z === minZ).map(([x]) => x).sort((a, b) => a - b);
const ENTRY_X = northXs[northXs.length >> 1];

// Which sides of a cell face outside the building (or a lower tier) at height y.
const exposed = (x, z, y) => {
  const out = [];
  for (const [dx, dz] of N4) {
    const nx = x + dx, nz = z + dz;
    if (!inside(nx, nz)) out.push([dx, dz]);
    else if (h(nx, nz) < h(x, z) && y >= h(nx, nz)) out.push([dx, dz]);
  }
  return out;
};

// Solid rows: base, floor slabs every 3 blocks (up to the deck), the deck and cover, and the row at a lower neighbour's roof.
const solidRow = (x, z, y) => {
  const T = h(x, z);
  if (y === 0 || y === T - 1 || y === T - 2) return true;
  if (y % 3 === 0 && y <= T - 3) return true;
  return N4.some(([dx, dz]) => inside(x + dx, z + dz) && h(x + dx, z + dz) < T && y === h(x + dx, z + dz) - 1);
};

const STONE = "smooth_stone", BASE_STONE = "stone_bricks", PIER = "calcite", GLASS = "light_blue_stained_glass";
const ROOF_PARAPET = "calcite", PLANT = "copper_block";
const DOOR = (half, hinge) => ({ facing: "south", half, hinge, open: "false", powered: "false" });
const LANTERN = { hanging: "true", waterlogged: "false" };

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, st) => g.set(x, y, z, id, st);

for (const [x, z, G] of cells) {
  const T = h(x, z);
  for (let y = 0; y < Math.max(G, 1) && y < T; y++) put(x, y, z, BASE_STONE);   // foundation under the ground line
  for (let y = 0; y < T; y++) {
    const ex = exposed(x, z, y);
    if (solidRow(x, z, y)) {
      if (y === T - 1) put(x, y, z, ex.length ? ROOF_PARAPET : STONE);
      else if (ex.length && (y === 0 || y === T - 2)) put(x, y, z, BASE_STONE);   // base course and cornice
      else put(x, y, z, STONE);                                                  // storey lines: smooth stone, lighter than the base
      continue;
    }
    if (!ex.length) continue;                                           // interior air
    if (ex.length >= 2) { put(x, y, z, PIER); continue; }              // corners
    const [dx] = ex[0];
    const s = dx !== 0 ? z - minZ : x - minX;                             // along the face
    if (s % 4 === 0) put(x, y, z, PIER);
    else put(x, y, z, GLASS);
  }
}

// Entrance: two leaves in the north face, hanging lanterns under the storey-two floor just inside.
for (const dx of [0, 1]) {
  const x = ENTRY_X + dx;
  put(x, 1, 0, "dark_oak_door", DOOR("lower", dx === 0 ? "left" : "right"));
  put(x, 2, 0, "dark_oak_door", DOOR("upper", dx === 0 ? "left" : "right"));
  put(x, 2, 1, "lantern", LANTERN);
}

// Warm light: a glowstone standing behind some lower glass bays (air, on the storey floor), two per facade run.
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const T = h(x, z);
  for (const [dx, dz] of exposed(x, z, 1)) {
    const s = dx !== 0 ? z - minZ : x - minX;
    if (s % 12 !== 2 || (x === ENTRY_X || x === ENTRY_X + 1)) continue;
    for (const y of [1]) {
      const ix = x - dx, iz = z - dz;
      if (!inside(ix, iz) || solidRow(ix, iz, y) || y >= h(ix, iz)) continue;
      if (exposed(ix, iz, y).length) continue;
      put(ix, y, iz, "glowstone");
    }
  }
  // Upper storeys: a lamp behind a bay at the second and third storeys on the same run.
  for (const [dx, dz] of exposed(x, z, 4)) {
    const s = dx !== 0 ? z - minZ : x - minX;
    if (s % 12 !== 6 || T < 11) continue;
    const ix = x - dx, iz = z - dz;
    if (!inside(ix, iz) || solidRow(ix, iz, 4) || exposed(ix, iz, 4).length) continue;
    put(ix, 4, iz, "shroomlight");
  }
}

// Roof plant: copper boxes on the cover, away from the parapet and the setbacks.
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const T = h(x, z);
  if (exposed(x, z, T - 1).length || x % 9 !== 4 || z % 7 !== 3) continue;
  if (T === 3) continue;
  put(x, T, z, PLANT);
}

const saved = g.save(`${DIR}/DC63340.nbt`);
console.log("saved", saved);
