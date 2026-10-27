// Two-Nine-Five K'Road: a 1970s reinforced-concrete mid-rise on the K'Road ridge. Pale concrete frame with pilasters
// every 3 blocks, tinted-glass ribbon windows, a black-stallriser shopfront at street level, stepped setback tiers and a
// plant room on top. One datum (y 3, the uphill ground) carries the storeys; the downhill side shows its extra storey
// below it, and every column is solid from the ground up, so nothing floats.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162153996.cells.json", "utf8"));

const FOUND = "stone_bricks", SLAB = "light_gray_concrete", BASE = "polished_andesite", PILASTER = "white_concrete";
const SILL = "light_gray_concrete", CORNICE = "smooth_quartz", SHOP_SILL = "polished_andesite", GLASS = "light_blue_stained_glass_pane";
const SHOP_GLASS = "glass_pane", LAMP = "glowstone", PLANT = "gray_concrete", DOOR = "dark_oak_door", STEP = "stone_brick_stairs";

// [dx, dz, name] for the four horizontal neighbours
const DIRS = [{ dx: 1, dz: 0, name: "east" }, { dx: -1, dz: 0, name: "west" }, { dx: 0, dz: 1, name: "south" }, { dx: 0, dz: -1, name: "north" }];
const key = (x, z) => `${x},${z}`;
const F = new Map();
for (const [x, z, ground, roof] of cells) F.set(key(x, z), { x, z, g: ground, r: roof });
const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[s.length >> 1]; };

// Tiers: the median of each cell's 3x3 footprint neighbourhood (lidar noise out), floored onto a storey deck (3, 7, 11 ... 31).
for (const c of F.values()) {
  const near = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = F.get(key(c.x + dx, c.z + dz)); if (n) near.push(n.r); }
  c.T = Math.min(31, Math.max(3, 3 + 4 * Math.floor((median(near) - 4) / 4)));
}

// A side of cell c at row y is exposed when the neighbour is outside the footprint or stands lower than the row (or lower than c's own deck, for parapets).
const exposedTo = (c, y, d) => { const n = F.get(key(c.x + d.dx, c.z + d.dz)); return !n || n.T < Math.min(y, c.T); };
const anyExposed = (c, y) => DIRS.some((d) => exposedTo(c, y, d));
const outward = (c) => DIRS.find((d) => !F.get(key(c.x + d.dx, c.z + d.dz)));

const g = new Voxels([23, 47, 34]);
const panes = [];
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const isDeck = (y) => y >= 3 && (y - 3) % 4 === 0;

for (const c of F.values()) {
  const { x, z, g: G, T } = c, s = x + z;
  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < G; y++) put(x, y, z, FOUND);

  // the entrance: a street-level door in an uphill (ground 3) outer wall, with a step up from the pavement
  const door = G === 3 && T >= 7 && s % 18 === 1 && outward(c);

  for (let y = G; y <= T + 2; y++) {
    if (y > T) {                                    // cornice and parapet on the edges of a tier or a terrace
      if (y === T + 1 && anyExposed(c, y)) put(x, y, z, CORNICE);
      if (y === T + 2 && anyExposed(c, y)) put(x, y, z, PILASTER);
      continue;
    }
    if (y === G && !isDeck(y)) { put(x, y, z, SLAB); continue; }   // floor slab over the ground (or the extra storey's floor)
    if (isDeck(y)) {
      if (y === 3 && door) { put(x, y, z, STEP, { facing: door.name, half: "bottom", shape: "straight", waterlogged: "false" }); continue; }
      if (y === 3 && anyExposed(c, y)) { put(x, y, z, BASE); continue; }
      put(x, y, z, SLAB);
      continue;
    }
    if (!anyExposed(c, y)) continue;                // interior, or the downhill extra storey's air: nothing behind the glass
    if (y < 3) {                                    // the downhill extra storey: glass on its exposed sides
      if (s % 3 === 0) put(x, y, z, PILASTER);
      else { put(x, y, z, GLASS); panes.push([x, y, z, GLASS]); }
      continue;
    }
    const k = Math.floor((y - 4) / 4), o = (y - 4) % 4;   // storey index, and row in the storey (0 sill, 1-2 glass)
    if (s % 3 === 0) { put(x, y, z, PILASTER); continue; }
    if (door && y === 4) { put(x, y, z, DOOR, { facing: door.name, half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
    if (door && y === 5) { put(x, y, z, DOOR, { facing: door.name, half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
    if (door && y === 6) { put(x, y, z, CORNICE); continue; }
    if (o === 0) { put(x, y, z, k === 0 ? SHOP_SILL : SILL); continue; }
    if (o === 1 && (s + 2 * k) % 9 === 4) { put(x, y, z, LAMP); continue; }      // a lit window
    const glass = k === 0 ? SHOP_GLASS : GLASS;     // clear shopfront glass at street level, tinted above
    put(x, y, z, glass); panes.push([x, y, z, glass]);
  }
}

// Rooftop plant room: a 3 x 3 block on the highest tier's interior, with a lantern on top (warm at dusk).
const top = [...F.values()].filter((c) => c.T === 31);
const isTopInterior = (cx, cz) => [-1, 0, 1].every((dx) => [-1, 0, 1].every((dz) => F.get(key(cx + dx, cz + dz))?.T === 31));
const mx = top.reduce((a, c) => a + c.x, 0) / top.length, mz = top.reduce((a, c) => a + c.z, 0) / top.length;
const plant = top.filter((c) => isTopInterior(c.x, c.z)).sort((a, b) => Math.hypot(a.x - mx, a.z - mz) - Math.hypot(b.x - mx, b.z - mz))[0];
if (plant) {
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (let y = 32; y <= 34; y++) put(plant.x + dx, y, plant.z + dz, PLANT);
  put(plant.x, 35, plant.z, "lantern", { hanging: "false", waterlogged: "false" });
}

// Glass panes connect to whatever stands beside them in the plane of the wall, as the game would draw them.
for (const [x, y, z, glass] of panes) {
  const st = { waterlogged: "false" };
  for (const d of DIRS) st[d.name] = g.get(x + d.dx, y, z + d.dz) ? "true" : "false";
  put(x, y, z, glass, st);
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162153996.nbt");
