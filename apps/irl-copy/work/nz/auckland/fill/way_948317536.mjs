import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Way 948317536: a 1920s-30s brick-and-render commercial block (stripped classical), two storeys over a shopfront with
// a cornice, on a slope. Lidar roof heights become three flat tiers (12 core, 10 ring, 6 wings); every column's floors
// start at its own ground, so the downhill side carries the extra storey. Brick piers between glazed bays, a quartz
// spandrel line per storey, a timber fascia over the shopfront, a recessed entrance on the north front.

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_948317536.cells.json", "utf8"));
const g = new Voxels([21, 25, 20]);

// lidar roof heights -> flat tiers (noise under 5 blocks is dropped as ground clutter)
const tier = (r) => (r >= 11 ? 12 : r >= 9 ? 10 : r >= 5 ? 6 : 0);
const at = new Map();
for (const [x, z, ground, roof] of cells) { const T = tier(roof); if (T) at.set(`${x},${z}`, { g: ground, T }); }
const SIDES = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];

// one-cell noise out of the tiers: each cell takes the most common tier among itself and its 4 neighbours (ties go high)
for (let pass = 0; pass < 2; pass++) {
  const next = new Map();
  for (const [key, c] of at) {
    const [x, z] = key.split(",").map(Number), votes = new Map([[c.T, 1]]);
    for (const [, dx, dz] of SIDES) { const n = at.get(`${x + dx},${z + dz}`); if (n) votes.set(n.T, (votes.get(n.T) ?? 0) + 1); }
    const T = [...votes].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0];
    next.set(key, { g: c.g, T });
  }
  at.clear(); for (const [k, v] of next) at.set(k, v);
}
const cell = (x, z) => at.get(`${x},${z}`);

// a face is outside where there is no column, or the neighbour's roof is below this row
const openSides = (x, y, z) => SIDES.filter(([, dx, dz]) => { const n = cell(x + dx, z + dz); return !n || y >= n.T; });

const M = {
  foundation: "stone_bricks", slab: "smooth_stone", roof: "smooth_stone", pier: "bricks", spandrel: "smooth_quartz",
  shopPier: "polished_andesite", fascia: "dark_oak_planks", glass: "glass_pane",
};
const DOOR = [8, 0];                 // north front, the only entrance
const lights = [];                   // window bays that may take a warm light behind the glass

for (const [key, { g: G, T }] of at) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < T; y++) {
    if (y < G) { g.set(x, y, z, M.foundation); continue; }                    // plinth from lowest ground to this cell's ground
    if (y === T - 1) { g.set(x, y, z, M.roof); continue; }                    // flat roof deck
    if ((y - G) % 4 === 0) { g.set(x, y, z, M.slab); continue; }              // floor slab (and cornice course) per storey
    const sides = openSides(x, y, z);
    if (!sides.length) continue;                                              // interior air behind the glass
    const k = Math.floor((y - G) / 4), rel = (y - G) % 4, ground = k === 0;
    if (rel === 3) { g.set(x, y, z, ground ? M.fascia : M.spandrel); continue; }
    const [face] = sides, [dir, dx, dz] = face;
    if (ground && dir === "N" && x === DOOR[0] && z === DOOR[1]) {
      g.set(x, y, z, "oak_door", { facing: "north", half: rel === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    const along = dir === "N" || dir === "S" ? x : z;                       // bays run along the face
    if (along % 3 === 0) g.set(x, y, z, ground ? M.shopPier : M.pier);
    else {
      g.set(x, y, z, M.glass);
      if (rel === 1 && (x * 7 + y * 5 + z * 3) % 9 === 0) lights.push({ x, y, z, ix: x - dx, iz: z - dz });
    }
  }
}

// glowstone on the floor slab just inside some glazed bays (only where the room cell is empty and has a floor)
for (const { x, y, z, ix, iz } of lights) {
  const c = cell(ix, iz);
  if (!c || y < c.g || y >= c.T - 1 || g.get(ix, y, iz) || !g.get(ix, y - 1, iz)) continue;
  g.set(ix, y, iz, "glowstone");
}

// roof plant: a stair and lift overrun on the core, condensers on the ring and wings
for (let x = 11; x <= 12; x++) for (let z = 5; z <= 6; z++) { g.set(x, 12, z, "stone_bricks"); g.set(x, 13, z, "stone_bricks"); }
for (const [key, { T }] of at) {
  const [x, z] = key.split(",").map(Number);
  if (T < 12 && (x * 5 + z * 3) % 13 === 0) g.set(x, T, z, "iron_block");
}

// glass panes join their neighbours the way the game draws them: solid blocks and other panes on the same wall
const blockAt = (x, y, z) => g.get(x, y, z)?.block ?? null;
const joins = (b) => b !== null && b !== "minecraft:glass_pane" && !b.endsWith("door");
const PANE = { N: "north", S: "south", W: "west", E: "east" };
for (const [key, { T }] of at) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < T; y++) {
    if (blockAt(x, y, z) !== "minecraft:glass_pane") continue;
    const st = {};
    for (const [dir, dx, dz] of SIDES) {
      const b = blockAt(x + dx, y, z + dz);
      st[PANE[dir]] = joins(b) || b === "minecraft:glass_pane" ? "true" : "false";
    }
    g.set(x, y, z, "glass_pane", st);
  }
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_948317536.nbt";
console.log(g.save(out));
