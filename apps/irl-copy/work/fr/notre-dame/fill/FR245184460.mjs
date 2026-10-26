// Archevêché de Paris (1949, stone, 3 storeys on the record; the lidar roofs say up to 7 storeys on the core).
// Massing follows the lidar: each cell's roof is median-smoothed over its 3x3 footprint neighbours, then rounded to a
// whole storey (5 blocks), so the tiers step back in clean floors. Walls are a one-block shell with an air gap behind
// each window (the core is solid, so every floor and tier rests on something). Stone facade, glass panes in stone-brick
// frames, shopfronts on the ground floor, a door with a canopy, glowstone behind a few windows, a penthouse on the tall tier.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184460.cells.json", "utf8"));

const key = (x, z) => `${x},${z}`;
const byKey = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));

// roof tiers: 3x3 median of the lidar roofs, rounded to whole storeys, clamped to 2..7 storeys
const T = new Map();
for (const { x, z } of byKey.values()) {
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const c = byKey.get(key(x + dx, z + dz)); if (c) vals.push(c.r);
  }
  vals.sort((a, b) => a - b);
  const m = vals[vals.length >> 1];
  T.set(key(x, z), Math.min(35, Math.max(10, Math.round(m / 5) * 5)));
}
const top = (x, z) => T.get(key(x, z));            // undefined outside the footprint
const ground = (x, z) => byKey.get(key(x, z))?.g;

// the outward faces of a cell at height y: a neighbour outside the footprint, or one whose roof is already below y
const DIRS = [{ dx: 1, dz: 0, name: "east" }, { dx: -1, dz: 0, name: "west" }, { dx: 0, dz: 1, name: "south" }, { dx: 0, dz: -1, name: "north" }];
const exposed = (x, z, y) => DIRS.filter((d) => { const t = top(x + d.dx, z + d.dz); return t === undefined || t <= y; });
const isFacade = (x, z, y) => { const g = ground(x, z), t = top(x, z); return y >= g && y < t && exposed(x, z, y).length > 0; };
const inWindowZone = (y) => y % 5 >= 1 && y % 5 <= 3;

// the window bays: a pane wherever a facade cell sits in the window zone and is not on a pilaster
const panes = new Map();   // key "x,y,z" -> { dir, coord }
const pockets = new Map(); // key "x,y,z" -> { glow }
for (const { x, z, g } of byKey.values()) {
  const t = top(x, z);
  for (let y = g; y < t; y++) {
    const dirs = exposed(x, z, y);
    if (!isFacade(x, z, y) || dirs.length !== 1 || !inWindowZone(y) || y > t - 3) continue;
    const d = dirs[0];
    const coord = d.dz !== 0 ? x : z;
    if (coord % 4 === 0 || coord % 4 === 3) continue;   // pilasters and wall piers
    panes.set(`${x},${y},${z}`, { dir: d, coord, ground: y < 5 });
    const ix = x - d.dx, iz = z - d.dz;                  // the air gap behind the glass
    if (byKey.has(key(ix, iz)) && y >= ground(ix, iz) && y < top(ix, iz) && !isFacade(ix, iz, y) && y > 0 && y <= top(ix, iz) - 3) {
      pockets.set(`${ix},${y},${iz}`, { glow: coord % 8 === 1 && y % 5 === 2 });
    }
  }
}

// the entrance: a ground-level cell on the south face, its footprint on y 0 (so the door meets the ground outside)
const doorCell = [...byKey.values()]
  .filter((c) => c.g === 0 && top(c.x, c.z + 1) === undefined && isFacade(c.x, c.z, 1))
  .sort((a, b) => Math.abs(a.x - 19) - Math.abs(b.x - 19))[0];
const door = doorCell ? { x: doorCell.x, z: doorCell.z } : null;

// the penthouse: the tall tier, set back from its edges
const tall = new Set([...T].filter(([, t]) => t === 35).map(([k]) => k));
const edgeDist = (x, z) => {
  let best = Infinity;
  for (let zz = -1; zz <= 35; zz++) for (let xx = -1; xx <= 39; xx++) {
    if (tall.has(key(xx, zz))) continue;
    best = Math.min(best, Math.max(Math.abs(x - xx), Math.abs(z - zz)));
  }
  return best;
};

const g = new Voxels([39, 51, 35]);
const PANE = (dir) => (dir.dz !== 0
  ? { east: "true", west: "true", north: "false", south: "false", up: "false", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", up: "false", waterlogged: "false" });

for (const { x, z, g: gr } of byKey.values()) {
  const t = top(x, z);
  for (let y = 0; y < t; y++) {
    if (y < gr) { g.set(x, y, z, "stone_bricks"); continue; }                       // foundation
    const k = `${x},${y},${z}`;
    const doorHere = door && x === door.x && z === door.z && (y === 1 || y === 2);
    if (pockets.has(k)) {
      if (pockets.get(k).glow) g.set(x, y, z, "glowstone");                         // a lamp in the air gap
      continue;                                                                    // air gap behind the glass
    }
    if (y === t - 1) {                                                             // roof membrane / parapet
      g.set(x, y, z, isFacade(x, z, y) ? "stone_bricks" : "smooth_stone");
      continue;
    }
    if (doorHere) { g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }); continue; }
    if (!isFacade(x, z, y)) { g.set(x, y, z, "stone"); continue; }                  // core
    const dirs = exposed(x, z, y);
    if (dirs.length > 1) { g.set(x, y, z, "stone_bricks"); continue; }             // corner column
    const d = dirs[0], coord = d.dz !== 0 ? x : z;
    if (y % 5 === 0 || y >= t - 2) { g.set(x, y, z, "stone_bricks"); continue; }   // string course, cornice
    if (y % 5 === 4) { g.set(x, y, z, "smooth_sandstone"); continue; }             // lintel and spandrel
    if (coord % 4 === 0) { g.set(x, y, z, "stone_bricks"); continue; }            // pilaster frame
    if (coord % 4 === 3) { g.set(x, y, z, "smooth_sandstone"); continue; }        // wall pier
    if (panes.has(k)) {
      if (panes.get(k).ground) g.set(x, y, z, "glass");                            // shopfront
      else g.set(x, y, z, "glass_pane", PANE(d));
      continue;
    }
    g.set(x, y, z, "smooth_sandstone");
  }
}

// canopy over the door, on two posts that stand on the ground outside
if (door) {
  const cy = 4;
  for (let dx = -1; dx <= 1; dx++) for (let dz = 1; dz <= 2; dz++) g.set(door.x + dx, cy, door.z + dz, "stone_bricks");
  for (const dx of [-1, 1]) for (let y = 0; y < cy; y++) g.set(door.x + dx, y, door.z + 2, "stone_brick_wall");
}

// penthouse on the tall tier, and copper roof boxes on the lower tiers
for (const [k, t] of T) {
  const [x, z] = k.split(",").map(Number);
  if (t === 35 && edgeDist(x, z) >= 5) {                                           // a solid penthouse, glazed on its band
    for (let y = 35; y < 38; y++) g.set(x, y, z, y === 36 && edgeDist(x, z) === 5 ? "glass" : "smooth_sandstone");
    g.set(x, 38, z, "stone_bricks");
  }
  if ((t === 20 || t === 25) && edgeDist(x, z) >= 3 && x % 8 >= 4 && x % 8 <= 5 && z % 6 >= 2 && z % 6 <= 3) {
    g.set(x, t, z, "copper_block"); g.set(x, t + 1, z, "copper_block");            // roof plant in pairs
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184460.nbt");
console.log(JSON.stringify({ blocks: g.count(), panes: panes.size, pockets: pockets.size, door }));
