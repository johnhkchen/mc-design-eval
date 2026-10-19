// DC87014: the National Archives Building, 701 Constitution Ave NW, as a 1.21.1 module.
// John Russell Pope's 1935 Classical Revival block: a granite plinth, Indiana-type limestone walls with a quartz
// storey band on every floor line, a flat roof behind a parapet, and a recessed portico on the Constitution Avenue
// (south, +z) face. Lidar roof heights are median-smoothed (3x3 over the footprint) and snapped to tiers of four
// blocks: 12 (three storeys, the wings), 16 (four storeys, the ring round the core), 20 (five storeys, the core, with
// a one-block parapet to 21). Walls are one block thick on every edge of the footprint and every tier step; the rest
// is air with a floor slab per storey, so nothing hangs and nothing is walled in solid.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC87014.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC87014.nbt";

const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inF = (x, z) => F.has(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Smoothed roof: median of the footprint cells in the 3x3 around each cell, then one tier per cell.
const med = (c) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = F.get(key(c.x + dx, c.z + dz)); if (n) v.push(n.r); }
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const tier = (h) => (h <= 13 ? 12 : h <= 18 ? 16 : 20);
const T = new Map([...F.values()].map((c) => [key(c.x, c.z), tier(med(c))]));
const top = (x, z) => T.get(key(x, z)) ?? 0;                       // 0 outside the footprint
const at = (c, [dx, dz]) => top(c.x + dx, c.z + dz);
// Faces that look out to the air: the footprint edge, or a lower tier (a setback). Faces against a taller tier are not.
const exposed = (c) => DIRS.filter(([dx, dz]) => at(c, [dx, dz]) < top(c.x, c.z));
// Walls: any neighbour that is outside the footprint or on another tier (every edge and every step is one block thick).
const isWall = (c) => DIRS.some(([dx, dz]) => at(c, [dx, dz]) !== top(c.x, c.z));

// Palette
const BASE = "stone_bricks";       // plinth and the base course (grey, so the base does not read as brick)
const STONE = "calcite";           // limestone walls and piers
const BAND = "smooth_quartz";      // storey lines, lintels, cornice, and the floor slabs
const GLASS = "glass_pane";
const COL = "quartz_pillar";       // corner pilasters and portico columns
const ROOF = "stone";              // flat roof membrane
const PARAPET = "stone_brick_wall";
const DOOR = "iron_door";
const LAMP = "glowstone";
const LANTERN = "lantern";
const PLANT = "iron_block";        // roof plant

const g = new Voxels([47, 33, 37]);

// Foundation, floor slabs, roof, and the walls of every footprint cell.
for (const c of F.values()) {
  const { x, z, g: ground } = c;
  const t = top(x, z);
  for (let y = 0; y < ground; y++) g.set(x, y, z, BASE);            // solid from y 0 up to the cell's ground
  for (let y = 4; y < t; y += 4) g.set(x, y, z, BAND);              // a floor slab on every storey line
  g.set(x, t - 1, z, ROOF);                                         // the roof over every cell
  if (!isWall(c)) continue;

  const ex = exposed(c), corner = ex.length >= 2;
  for (let y = 1; y < t - 1; y++) {
    let b;
    if (y === 1) b = BASE;                                          // base course
    else if (corner) b = COL;
    else if (y % 4 === 0 || y % 4 === 3) b = BAND;                  // storey line and lintel band
    else if (ex.length && (ex[0][1] !== 0 ? x : z) % 3 === 1 && (y % 4 === 1 || y % 4 === 2)) b = GLASS;
    else b = STONE;
    g.set(x, y, z, b);
  }
  g.set(x, t - 1, z, BAND);                                         // cornice over the top storey
  g.set(x, t, z, PARAPET);                                          // parapet
}

// Portico on the Constitution Avenue face (z = 36): two columns and a bronze door, the wall behind it, a hanging lantern.
const FRONT = 36;
for (const x of [22, 24]) for (let y = 1; y <= 3; y++) g.set(x, y, FRONT, "air");
for (const x of [21, 25]) for (let y = 1; y <= 3; y++) g.set(x, y, FRONT, COL);
g.set(23, 1, FRONT, DOOR, { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(23, 2, FRONT, DOOR, { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(23, 3, FRONT, LANTERN, { hanging: "true", waterlogged: "false" });

// Warm light: glowstone on the room side of some lit windows (the interior air behind the glass).
for (const c of F.values()) {
  if (!isWall(c) || !top(c.x, c.z)) continue;
  for (const [dx, dz] of exposed(c)) {
    const along = dz !== 0 ? c.x : c.z;
    if (along % 3 !== 1) continue;
    for (let y = 2; y < top(c.x, c.z) - 1; y++) {
      if (y % 4 !== 1 && y % 4 !== 2) continue;
      if ((c.x * 7 + c.z * 3 + y) % 5 !== 0) continue;
      const ix = c.x - dx, iz = c.z - dz;
      if (inF(ix, iz) && !isWall(F.get(key(ix, iz))) && y % 4 === 1) { g.set(ix, y, iz, LAMP); break; }
    }
  }
}

// Plant on the core roof: a few units standing on the roof membrane, clear of the parapet.
for (const c of F.values()) {
  if (top(c.x, c.z) !== 20 || isWall(c)) continue;
  if (c.x % 9 === 4 && c.z % 9 === 4) g.set(c.x, 20, c.z, PLANT);
}

const r = g.save(OUT);
console.log(`DC87014: ${r.blocks} blocks, ${r.palette} palette entries -> ${OUT}`);
