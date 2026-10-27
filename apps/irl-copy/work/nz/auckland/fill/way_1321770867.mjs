// Way 1321770867: a two-storey brick commercial block of the 1920s-30s (Eden Terrace / Mt Eden style): basalt plinth,
// brick walls with cream string courses and sills, a shopfront on the ground floor, a flat roof behind a cornice.
// Lidar roof heights become two clean tiers (9 and 7 blocks), and the lower tier is the wing.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1321770867.cells.json", "utf8"));

const X = 14, Y = 22, Z = 17;
const STRING_Y = 4;                                  // the upper floor line: string course on the facade, slab inside
const key = (x, z) => `${x},${z}`;
const byKey = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inside = (x, z) => byKey.has(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const edgeDir = (x, z) => DIRS.filter(([dx, dz]) => !inside(x + dx, z + dz));   // outward faces of a footprint cell
const isEdge = (x, z) => edgeDir(x, z).length > 0;
// The lidar roof, smoothed into two tiers: 8-9 is the main block, 6-7 the lower wing.
const topOf = (r) => (r >= 8 ? 9 : 7);

const g = new Voxels([X, Y, Z]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const door = (facing, half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });

const ENTRANCE = [5, 0];                              // the street front (south, z = 0) of the block

for (const { x, z, g: ground, r } of byKey.values()) {
  const top = topOf(r), edge = isEdge(x, z), bay = (x + z) % 3;   // bay 0 is a brick pier, 1-2 are windows
  // foundation: solid from y 0 up to the cell's ground; on the lowest ground the floor is a slab at y 0
  for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");
  if (ground === 0) put(x, 0, z, "polished_basalt");
  if (edge && ground > 0) put(x, ground, z, "polished_basalt");           // the basalt plinth course
  // the upper floor slab (inside) and the string course on the facade
  put(x, STRING_Y, z, edge ? "smooth_quartz" : "stone_bricks");
  if (edge) {
    // shopfront: glass in the bays between brick piers, from the plinth to the string course
    for (let y = ground + 1; y < STRING_Y; y++) put(x, y, z, bay === 0 ? "bricks" : "glass");
    if (top === 9) {
      // two upper windows per three bays: stone sill, glass, stone head; cornice on top
      put(x, 5, z, bay === 0 ? "bricks" : "smooth_stone");
      put(x, 6, z, bay === 0 ? "bricks" : "glass");
      put(x, 7, z, bay === 0 ? "bricks" : "smooth_stone");
    } else {
      put(x, 5, z, bay === 0 ? "bricks" : "glass");                     // the lower wing carries one row of windows
    }
    put(x, top - 1, z, "smooth_quartz");                                  // cornice / parapet cap
  } else {
    put(x, top - 1, z, "stone");                                          // flat roof membrane over the storey
    // a step up to the main block: a brick pier from the floor to the cornice, so the tall tier's side above the
    // lower wing is a parapet standing on the floor slab, not an open void or a block hanging in the air
    if (DIRS.some(([dx, dz]) => inside(x + dx, z + dz) && topOf(byKey.get(key(x + dx, z + dz)).r) < top)) {
      for (let y = STRING_Y + 1; y < top - 1; y++) put(x, y, z, "bricks");
      put(x, top - 1, z, "smooth_quartz");
    }
  }
}

// The entrance: a pair of oak doors in the shopfront, piers either side, and a dark-oak canopy row above.
{
  const e = byKey.get(key(...ENTRANCE));
  const [ex, ez] = ENTRANCE;
  put(ex, e.g, ez, "oak_door", door("north", "lower"));
  put(ex, e.g + 1, ez, "oak_door", door("north", "upper"));
  for (let y = e.g + 1; y < STRING_Y; y++) { put(ex - 1, y, ez, "bricks"); put(ex + 1, y, ez, "bricks"); }
  for (let x = ex - 1; x <= ex + 1; x++) put(x, STRING_Y, ez, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
}

// Warm light behind some upper windows: a glowstone on the inside cell, one cell back from the glass.
for (const { x, z, r } of byKey.values()) {
  const top = topOf(r);
  if (top !== 9 || !isEdge(x, z) || (x * 5 + z * 7) % 4 !== 0) continue;
  const out = edgeDir(x, z)[0];
  const [ix, iz] = [x - out[0], z - out[1]];
  const inner = byKey.get(key(ix, iz));
  if (!inner || isEdge(ix, iz) || topOf(inner.r) !== 9) continue;
  put(ix, 6, iz, "glowstone");
}

// Roof plant room: a 2x2 stair-and-lift core on the main roof, cornice-capped, centred in the block.
{
  const spot = [...byKey.values()].find(({ x, z, r }) =>
    [[0, 0], [1, 0], [0, 1], [1, 1]].every(([dx, dz]) => {
      const c = byKey.get(key(x + dx, z + dz));
      return c && topOf(c.r) === 9 && !isEdge(x + dx, z + dz) && x + dx > 2 && z + dz > 4;
    }));
  if (spot) {
    for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      put(spot.x + dx, 9, spot.z + dz, "stone_bricks");
      put(spot.x + dx, 10, spot.z + dz, "stone_bricks");
      put(spot.x + dx, 11, spot.z + dz, "smooth_quartz");
    }
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1321770867.nbt");
