// DC87505: 1 Thomas Circle NW, a Commercial-Office-Large. Read from the lidar record: a 17-block main block (a 3-block
// shopfront storey and 7 storeys above, the top one a cornice attic), and a 19-block tower wing on the west side, set
// back two blocks from its outer edge so its top two storeys stand on a terrace. Pale quartz piers and storey lines
// in a 3-bay grid, blue glass with an air gap behind each pane, warm glowstone behind a few panes, a recessed dark-door
// entrance on the north front under a canopy, and a flat roof with terraces and mechanical boxes. Each column is solid
// from y 0 up to its top, so every tier stands on the one below it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC87505.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC87505.nbt";

const W = 25, D = 20, Y = 31;
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const foot = new Map();
for (const [x, z, g, r] of cells) foot.set(`${x},${z}`, { g, r });
const inFoot = (x, z) => foot.has(`${x},${z}`);

// Lidar roofs read 17 (the main block) and 19 (the tower wing), with noise at 18 that sits inside the tower: 18 and up is the tower.
const isTower = (x, z) => inFoot(x, z) && foot.get(`${x},${z}`).r >= 18;

// Manhattan distance from each tower cell to the nearest non-tower cell (outside the footprint counts as non-tower).
const dist = new Map();
{
  const q = [];
  for (let z = -1; z <= D; z++) for (let x = -1; x <= W; x++) if (!isTower(x, z)) { dist.set(`${x},${z}`, 0); q.push([x, z]); }
  for (let i = 0; i < q.length; i++) {
    const [x, z] = q[i], d = dist.get(`${x},${z}`);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, nz = z + dz, k = `${nx},${nz}`;
      if (nx < -1 || nz < -1 || nx > W || nz > D || dist.has(k)) continue;
      dist.set(k, d + 1); q.push([nx, nz]);
    }
  }
}
const SETBACK = 2;   // the tower's top two storeys stand this far in from its outer edge
const topOf = (x, z) => (!inFoot(x, z) ? 0 : isTower(x, z) && dist.get(`${x},${z}`) >= SETBACK ? 19 : 17);
const solid = (x, y, z) => x >= 0 && z >= 0 && x < W && z < D && y >= 0 && y < topOf(x, z);
const nextToTower = (x, z) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => isTower(x + dx, z + dz));

// The palette
const PIER = "smooth_quartz", SPANDREL = "light_gray_concrete", BASE = "polished_andesite", CORE = "stone";
const GLASS = "light_blue_stained_glass", ROOF = "gray_concrete", TERRACE = "stone_bricks", CANOPY = "black_concrete";
const MECH = "light_gray_concrete", MECH_TOP = "gray_concrete", LAMP = "glowstone";
const DOOR = { facing: "north", hinge: "left", open: "false", powered: "false" };

// The four outward sides: u is the coordinate running along the face (for the pier bays). N (-z) is the front on the circle.
const SIDES = [
  { name: "W", dx: -1, dz: 0, u: (x, z) => z },
  { name: "E", dx: 1, dz: 0, u: (x, z) => z },
  { name: "N", dx: 0, dz: -1, u: (x) => x },
  { name: "S", dx: 0, dz: 1, u: (x) => x },
];
const exposedSides = (x, y, z) => SIDES.filter((s) => !solid(x + s.dx, y, z + s.dz));
const onNorthEntrance = (x, z) => z === 0 && x >= 8 && x <= 12;

// Plan the blocks cell by cell. Air gaps and lights are decided after, so a pane's gap is only cut where it is interior.
const B = new Map();
const key = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, state) => B.set(key(x, y, z), { block, state });
const gap = new Set();    // interior cells behind a pane: left as air
const lamp = new Set();   // gap cells with a warm light behind the pane
const padGap = (x, y, z) => { if (solid(x, y, z) && exposedSides(x, y, z).length === 0) gap.add(key(x, y, z)); };

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inFoot(x, z)) continue;
  const h = topOf(x, z);
  for (let y = 0; y < h; y++) {
    const sides = exposedSides(x, y, z);
    const top = y === h - 1;
    if (!sides.length) {
      if (top) put(x, y, z, nextToTower(x, z) ? TERRACE : ROOF);
      else put(x, y, z, CORE);
      continue;
    }
    const s = sides[0], u = s.u(x, z), corner = sides.length > 1;
    const pierBay = corner || u % 3 === 0;
    // the main front's entrance: a recessed glazed bay, a dark door at x 10, a dark canopy over the bay
    if (s.name === "N" && onNorthEntrance(x, z) && y <= 3) {
      if (y === 1 && u === 10) { put(x, y, z, "dark_oak_door", { ...DOOR, half: "lower" }); padGap(x, y, z + 1); continue; }
      if (y === 2 && u === 10) { put(x, y, z, "dark_oak_door", { ...DOOR, half: "upper" }); padGap(x, 1, z + 1); continue; }
      if (y === 1) { put(x, y, z, GLASS); padGap(x, y, z + 1); if (u !== 10) lamp.add(key(x, y, z + 1)); continue; }
      if (y === 3) { put(x, y, z, CANOPY); continue; }
    }
    let block;
    if (top) block = PIER;                                   // cornice
    else if (y === 0) block = BASE;                          // base course
    else if (y === 1) block = pierBay ? PIER : GLASS;        // shopfront
    else if (y === 2) block = PIER;                          // shopfront lintel
    else if ((y - 3) % 2 === 0 || y === h - 2) block = SPANDREL;   // storey line (spandrel)
    else block = pierBay ? PIER : GLASS;                     // upper window row
    put(x, y, z, block);
    if (block === GLASS) {
      const ix = x - s.dx, iz = z - s.dz;
      padGap(ix, y, iz);
      if ((u + y) % 11 === 0) lamp.add(key(ix, y, iz));      // a few warm panes
    }
  }
}

// Mechanical boxes on the main roof and a penthouse on the tower core: each stands on the cap below it.
const onRoof = (x0, x1, z0, z1, base) => {
  for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
    if (!inFoot(x, z) || topOf(x, z) !== base) continue;
    put(x, base, z, MECH); put(x, base + 1, z, MECH_TOP);
  }
};
onRoof(17, 19, 7, 8, 17);
onRoof(20, 21, 14, 15, 17);
onRoof(3, 6, 7, 8, 19);

// Write the volume: gaps stay air, lamps sit in their gap, everything else as planned.
const g = new Voxels([W, Y, D]);
for (const [k, { block, state }] of B) {
  if (gap.has(k)) continue;
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, block, state);
}
for (const k of lamp) {
  if (!gap.has(k)) continue;
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, LAMP);
}
g.save(OUT);
