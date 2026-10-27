// Mount Saint Mary's Theological College, Mt Eden: a rendered, flat-roofed seminary block in four setback tiers
// (1930s-50s masonry-and-plaster character, cream render on a stone base, stone string courses and cornice, glazed
// bays with white piers, a tower over the chapel-side core). Built only on the footprint cells, from the lidar
// cells file: each cell's ground fills solid up to y 4 (plinth on the downhill side), the roof height snaps to four
// flat tiers (12 wing, 16 lower flank, 20 main, 25 tower) that sit on the storey grid (4 blocks per storey from y 4).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_292861428.cells.json`, "utf8"));

const W = 30, D = 31, H = 38;
const PLINTH = 4;                       // ground-floor level: plinth and foundation fill y 0..3 under every cell
const STOREY = 4;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const key = (x, z) => `${x},${z}`;

// lidar roof height -> one of four flat tiers (lidar noise smoothed; tower = the 23+ core)
const tierOf = (r) => (r >= 23 ? 25 : r >= 18 ? 20 : r >= 14 ? 16 : 12);

const byKey = new Map();
for (const [x, z, g, r] of cells) byKey.set(key(x, z), { x, z, g, r, top: tierOf(r) });
const tierAt = (x, z) => (byKey.get(key(x, z))?.top ?? -1);           // -1 = outside the footprint
for (const c of byKey.values()) {
  // exterior wall: the cell borders open air or a lower tier (its face is then exposed)
  c.exposed = DIRS.filter(([dx, dz]) => tierAt(c.x + dx, c.z + dz) < c.top);
  c.shell = c.exposed.length > 0;
}
const shellAt = (x, z) => byKey.get(key(x, z))?.shell ?? false;

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const WALL = "white_concrete", BASE = "stone_bricks", FLOOR = "smooth_stone", LINE = "stone_bricks";

for (const c of byKey.values()) {
  const { x, z, top } = c;
  // plinth and foundation: solid from y 0 up to the storey line, so nothing floats on the slope
  for (let y = 0; y < PLINTH; y++) put(x, y, z, BASE);
  // a floor slab at each storey line below the tier's top (interiors are air between slabs)
  for (let y = PLINTH; y < top; y += STOREY) if (!c.shell) put(x, y, z, FLOOR);
  // a flat roof deck (interior cells only; shell walls carry their own cornice row)
  if (!c.shell) put(x, top - 1, z, FLOOR);
  if (!c.shell) continue;

  // exterior wall column: string course at each storey line, glazed bays with white piers, lintel band, cornice
  for (let y = PLINTH; y < top; y++) {
    const rel = (y - PLINTH) % STOREY;
    if (y === top - 1) put(x, y, z, LINE);                         // cornice
    else if (rel === 0) put(x, y, z, LINE);                       // string course
    else if (rel === 3) put(x, y, z, WALL);                       // lintel band
    else if ((x + z) % 3 === 0) put(x, y, z, WALL);               // pier
    else put(x, y, z, "glass_pane", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
  }
  // parapet lip on the outer edge of the roof
  put(x, top, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// Entrance on the west face at z 12: a door in a stone surround, storey-one windows left as piers.
const DOOR_X = 1, DOOR_Z = 12;
for (const dz of [-1, 1]) for (let y = PLINTH; y <= PLINTH + 2; y++) put(DOOR_X, y, DOOR_Z + dz, BASE);
for (let dz = -1; dz <= 1; dz++) put(DOOR_X, PLINTH + 2, DOOR_Z + dz, BASE);
const door = { facing: "west", hinge: "left", open: "false", powered: "false" };
put(DOOR_X, PLINTH, DOOR_Z, "oak_door", { ...door, half: "lower" });
put(DOOR_X, PLINTH + 1, DOOR_Z, "oak_door", { ...door, half: "upper" });

// Warm light behind some glazed bays: a glowstone in the air cell just inside the window.
let lit = 0;
for (const c of byKey.values()) {
  if (!c.shell) continue;
  for (let y = PLINTH; y < c.top; y++) {
    const rel = (y - PLINTH) % STOREY;
    if (rel !== 1 && rel !== 2) continue;
    if ((c.x + c.z) % 3 === 0) continue;                           // a pier, not a window
    if (((c.x * 5 + c.z * 3 + y) % 8) !== 0) continue;             // about one bay in eight
    const [dx, dz] = c.exposed[0];
    const inner = byKey.get(key(c.x - dx, c.z - dz));
    if (!inner || inner.shell || inner.top !== c.top) continue;
    put(inner.x, y, inner.z, "glowstone");
    lit++;
  }
}

// Tower top: a small lit lantern cupola on the tower roof, on an interior cell (it stands on the deck at y 24).
// The tower is too narrow for a 3x3 interior, so the cupola is a single column with a lit cap under a half slab.
const cupola = [...byKey.values()].find((c) => c.top === 25 && !c.shell);
if (cupola) {
  const { x, z } = cupola;
  for (let y = 25; y <= 26; y++) put(x, y, z, LINE);
  put(x, 27, z, "glowstone");
  put(x, 28, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// Roof plant: two stone plant boxes on the main roof (tier 20, interior cells only; they stand on the deck at y 19).
const plant = [];
for (let x = 8; x < 22 && plant.length < 2; x += 3) for (let z = 13; z < 17 && plant.length < 2; z++) {
  const sq = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (sq.every(([a, b]) => tierAt(a, b) === 20 && !shellAt(a, b))) {
    plant.push([x, z]);
    for (const [a, b] of sq) for (let y = 20; y <= 21; y++) put(a, y, b, BASE);
  }
}

// Panes join the solid blocks beside them in the wall, as they do when placed in the game (air behind stays open).
let panes = 0;
for (const c of byKey.values()) {
  if (!c.shell) continue;
  for (let y = PLINTH; y < c.top; y++) {
    if (!g.get(c.x, y, c.z) || g.get(c.x, y, c.z).block !== "minecraft:glass_pane") continue;
    const conn = Object.fromEntries([["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]].map(([n, dx, dz]) => {
      const nb = g.get(c.x + dx, y, c.z + dz);
      return [n, nb && nb.block !== "minecraft:glowstone" ? "true" : "false"];
    }));
    put(c.x, y, c.z, "glass_pane", { ...conn, waterlogged: "false" });
    panes++;
  }
}

const out = `${DIR}/way_292861428.nbt`;
const stats = g.save(out);
console.log(`cells ${cells.length}, tiers 12/16/20/25 ${[...byKey.values()].map((c) => c.top).reduce((m, t) => ((m[t] = (m[t] || 0) + 1), m), {})}`);
console.log(`lit bays ${lit}, cupola ${cupola ? `${cupola.x},${cupola.z}` : "none"}, plant boxes ${plant.length}`);
console.log(`saved ${out}: ${stats.blocks} blocks, palette ${stats.palette}`);
