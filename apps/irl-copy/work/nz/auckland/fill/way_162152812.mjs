// Way 162152812: a 1930s brick-and-plaster commercial block, three storeys with a four-storey tower on the NE corner.
// Basalt-coloured plinth and foundation, red brick walls with cream plaster string courses and lintels, timber shopfront
// on the street face, glass windows in brick piers, warm lights behind some panes, a flat roof with a parapet, rooftop
// AC units and a plant room on the tower. Every column is solid from y 0 up to its ground, then the wall shell, floors
// and deck; nothing is placed outside the footprint.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162152812.cells.json", "utf8"));   // [x, z, ground, roof]

const g = new Voxels([14, 29, 30]);

const key = (x, z) => `${x},${z}`;
const cellOf = new Map(cells.map(([x, z, gr, roof]) => [key(x, z), { gr, roof }]));
const inF = (x, z) => cellOf.has(key(x, z));
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
// the faces of a footprint cell that look out of the footprint
const exterior = (x, z) => Object.keys(DIRS).filter((d) => !inF(x + DIRS[d][0], z + DIRS[d][1]));
const median = (a) => a.sort((p, q) => p - q)[Math.floor(a.length / 2)];
// the lidar roof smoothed over a 5x5 neighbourhood, snapped to two flat tiers: 12 (three storeys) and 16 (the four-storey tower)
const tier = (x, z) => {
  const v = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const c = cellOf.get(key(x + dx, z + dz)); if (c) v.push(c.roof); }
  return median(v) >= 13 ? 16 : 12;
};
// storeys are 4 high: a floor (or the lowest ground course) at gr and every 4th row above it, the sill/lintel bands between
const isFloor = (y, gr, T) => y === gr || (y % 4 === 0 && y > gr && y <= T - 4);
const along = (d, x, z) => (d === "N" || d === "S" ? x : z);   // the index along a face

// the street face: the outward face with the lowest mean ground, where the entrance goes
const faceMean = {};
for (const d of Object.keys(DIRS)) {
  const cs = cells.filter(([x, z]) => exterior(x, z).includes(d));
  faceMean[d] = { n: cs.length, mean: cs.reduce((s, c) => s + c[2], 0) / Math.max(1, cs.length) };
}
const front = Object.keys(DIRS).filter((d) => faceMean[d].n >= 4).sort((a, b) => faceMean[a].mean - faceMean[b].mean)[0];
const frontCells = cells.filter(([x, z]) => exterior(x, z).includes(front));
const idxs = frontCells.map(([x, z]) => along(front, x, z));
const mid = (Math.min(...idxs) + Math.max(...idxs)) / 2;
const doorCell = frontCells.reduce((best, c) => {
  const score = c[2] * 100 + Math.abs(along(front, c[0], c[1]) - mid);
  return !best || score < best.score ? { c, score } : best;
}, null).c;
const [doorX, doorZ] = [doorCell[0], doorCell[1]];

const SHOP_GLASS = "glass_pane", PLASTER = "smooth_quartz", BRICK = "bricks";
const pane = (d) => (d === "N" || d === "S" ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
                                              : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
const lanternState = { hanging: "false", waterlogged: "false" };

// the wall, floors and deck of every column
for (const [x, z, gr] of cells) {
  const T = tier(x, z);
  const ext = exterior(x, z);
  const perim = ext.length > 0;
  const corner = ext.length >= 2;
  const face = ext[0];

  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");          // foundation: solid up to the cell's ground

  if (!perim) {                                                          // interior: floor slabs and the roof deck only
    for (let y = gr; y < T; y++) {
      if (isFloor(y, gr, T)) g.set(x, y, z, "oak_planks");
      else if (y === T - 1) g.set(x, y, z, "smooth_stone");
    }
    continue;
  }

  const isDoorCol = x === doorX && z === doorZ;
  const shopFront = face === front && ext.includes(front);
  const idx = along(face, x, z);

  for (let y = gr; y < T; y++) {
    // the entrance: a door on the street face's lowest cell, with a timber header
    if (shopFront && isDoorCol && gr <= 2 && (y === gr || y === gr + 1)) {
      g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === gr ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (shopFront && isDoorCol && gr <= 2 && y === gr + 2) { g.set(x, y, z, "dark_oak_planks"); continue; }
    if (shopFront && gr <= 2 && y === gr + 2 && Math.abs(idx - along(front, doorX, doorZ)) === 1) { g.set(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" }); continue; }

    if (y === gr) { g.set(x, y, z, "polished_andesite"); continue; }        // base course on the ground
    if (y % 4 === 0 || y % 4 === 3) {                                       // sill and lintel bands
      if (shopFront && y === 3 && y > gr) g.set(x, y, z, "dark_oak_planks");  // timber fascia over the shop
      else g.set(x, y, z, PLASTER);
      continue;
    }
    // window rows (y % 4 = 1 or 2)
    if (corner) { g.set(x, y, z, "stone_bricks"); continue; }
    if (shopFront && y < 3) {                                               // shopfront: glass between timber piers
      g.set(x, y, z, idx % 3 === 0 ? "dark_oak_planks" : SHOP_GLASS, idx % 3 === 0 ? undefined : pane(face));
      continue;
    }
    g.set(x, y, z, idx % 3 === 0 ? BRICK : SHOP_GLASS, idx % 3 === 0 ? undefined : pane(face));
  }

  // parapet cap on the wall tops
  g.set(x, T, z, PLASTER + "_slab", { type: "bottom", waterlogged: "false" });
}

// warm light behind some panes: a lantern or glowstone in the room cell inside the glass, on a floor
for (const [x, z, gr] of cells) {
  const ext = exterior(x, z);
  if (!ext.length) continue;
  const face = ext[0], T = tier(x, z);
  const [nx, nz] = DIRS[face];
  for (let y = gr; y < T; y++) {
    if (y % 4 !== 1 && y % 4 !== 2) continue;
    const ix = x - nx, iz = z - nz;
    if (!inF(ix, iz) || exterior(ix, iz).length) continue;
    const Ti = tier(ix, iz);
    if (!isFloor(y - 1, gr, Ti) || g.get(ix, y, iz)) continue;
    const isShop = face === front && y < 3;
    if (isShop) g.set(ix, y, iz, "glowstone");
    else if ((x * 7 + z * 13 + y * 5) % 5 === 0) g.set(ix, y, iz, "lantern", lanternState);
  }
}

// rooftop AC units on the three-storey roof
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (exterior(x, z).length || tier(x, z) !== 12) continue;
  if (x % 4 === 2 && z % 6 === 3) g.set(x, 12, z, "iron_block");
}

// plant room on the tower roof: a 3x3 box of interior cells at the tower's centre
const towerCells = cells.filter(([x, z]) => tier(x, z) === 16 && !exterior(x, z).length);
if (towerCells.length) {
  const cx = towerCells.reduce((s, c) => s + c[0], 0) / towerCells.length, cz = towerCells.reduce((s, c) => s + c[1], 0) / towerCells.length;
  let best = null;
  for (const [x, z] of towerCells) {
    let ok = true;
    for (let dz = -1; dz <= 1 && ok; dz++) for (let dx = -1; dx <= 1 && ok; dx++) {
      const t = cellOf.get(key(x + dx, z + dz));
      ok = !!t && tier(x + dx, z + dz) === 16 && !exterior(x + dx, z + dz).length;
    }
    if (!ok) continue;
    const d = Math.hypot(x - cx, z - cz);
    if (!best || d < best.d) best = { x, z, d };
  }
  if (best) {
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      g.set(best.x + dx, 16, best.z + dz, "stone_bricks");
      g.set(best.x + dx, 17, best.z + dz, "stone_bricks");
      g.set(best.x + dx, 18, best.z + dz, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162152812.nbt");
console.log(JSON.stringify({ front, door: [doorX, doorZ], blocks: g.count(), palette: g.palette.length }));
