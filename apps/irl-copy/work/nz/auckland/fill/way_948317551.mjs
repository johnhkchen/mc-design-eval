// Way 948317551, Auckland (Eden Terrace side of Mt Eden): a two-storey brick-and-plaster commercial block of the
// 1900s-1930s, red brick with cream plaster cornices and pilasters, a dark-stone plinth, a shopfront with a door
// on the street (north) face, and a flat parapeted roof with an HVAC pair. Massing follows the lidar roof heights:
// smoothed into three flat tiers (two storeys, a tall single storey, a low wing) that step down toward the south-west.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_948317551.cells.json", "utf8"));

const key = (x, z) => `${x},${z}`;
const TIER_DECK = [5, 7, 9];                    // deck block index per tier: low wing, tall ground floor, two storeys
const tierOf = (roof) => (roof >= 8 ? 2 : roof >= 6 ? 1 : 0);

// Band per row above the plinth and slab, per tier. Rows run 3 .. deck-1; the deck (or parapet) is the top row.
const BANDS = [
  { 3: "bulk", 4: "glass" },                                                    // low wing: one storey
  { 3: "bulk", 4: "glass", 5: "glass", 6: "span" },                           // tall ground floor + cornice
  { 3: "bulk", 4: "glass", 5: "glass", 6: "span", 7: "glass", 8: "glass" },    // two storeys + spandrel
];

// Footprint cells with their ground, roof and a tier smoothed to the mode of the 3x3 neighbourhood (ties go high).
let raw = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { x, z, ground, roof, tier: tierOf(roof) }]));
for (let pass = 0; pass < 2; pass++) {   // two passes: single-cell tier islands (roof spikes) fold into their neighbours
  const next = new Map();
  for (const c of raw.values()) {
    const votes = [0, 0, 0];
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const n = raw.get(key(c.x + dx, c.z + dz)); if (n) votes[n.tier]++;
    }
    let tier = 0;
    for (let t = 0; t < 3; t++) if (votes[t] >= votes[tier]) tier = t;
    next.set(key(c.x, c.z), { ...c, tier });
  }
  raw = next;
}
const cell = new Map([...raw].map(([k, c]) => [k, { ...c, deck: TIER_DECK[c.tier] }]));

const g = new Voxels([17, 22, 19]);
const NORMALS = [[0, -1], [0, 1], [-1, 0], [1, 0]];   // north, south, west, east (outward)

// The outward normals at height y that look onto open air: outside the footprint, or a neighbour whose deck is below y.
function exposed(x, z, y) {
  return NORMALS.filter(([nx, nz]) => { const n = cell.get(key(x + nx, z + nz)); return !n || n.deck < y; });
}
const alongX = ([nx]) => nx === 0;   // a north or south face: the wall runs along x

for (const c of cell.values()) {
  const { x, z, deck, tier } = c;
  g.set(x, 0, z, "stone_bricks");                         // foundation and plinth, to the lowest ground under the building
  g.set(x, 1, z, "polished_andesite");                    // base course
  g.set(x, 2, z, "smooth_stone");                         // ground-floor slab and string course
  for (let y = 3; y < deck; y++) {
    const faces = exposed(x, z, y);
    if (!faces.length) { if (tier === 2 && y === 6) g.set(x, y, z, "smooth_stone"); continue; }   // interior: air, upper slab
    const [dir] = faces, wx = alongX(dir), col = wx ? x : z;
    const corner = wx ? !cell.has(key(x - 1, z)) || !cell.has(key(x + 1, z))
      : !cell.has(key(x, z - 1)) || !cell.has(key(x, z + 1));
    const band = BANDS[tier][y];
    if (band === "bulk") g.set(x, y, z, "dark_oak_planks");
    else if (band === "span") g.set(x, y, z, "smooth_quartz");
    else if (corner || col % 3 === 0) g.set(x, y, z, "bricks");                   // brick piers between the bays
    else g.set(x, y, z, "glass_pane", wx
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
  }
  // The deck: a parapet of cream plaster on the exposed edge, grey roof inside.
  g.set(x, deck, z, exposed(x, z, deck).length ? "smooth_quartz" : "gray_concrete");
}

// Warm light behind some glass: an air cell just inside a window, with a floor or roof above it.
for (const c of cell.values()) {
  for (let y = 3; y < c.deck; y++) {
    const faces = exposed(c.x, c.z, y);
    if (!faces.length || BANDS[c.tier][y] !== "glass") continue;
    const [nx, nz] = faces[0], wx = alongX(faces[0]), col = wx ? c.x : c.z;
    if (col % 3 === 0 || (col + y) % 4 !== 0) continue;
    const ix = c.x - nx, iz = c.z - nz, inner = cell.get(key(ix, iz));
    if (!inner || inner.deck <= y || exposed(ix, iz, y).length) continue;
    g.set(ix, y, iz, y === 4 ? "glowstone" : "shroomlight");
  }
}

// Shopfront door on the street (north) face: a central window bay, lower and upper halves, a lintel slab above.
const north = [...cell.values()].filter((c) => c.tier > 0 && !cell.has(key(c.x, c.z - 1)) && c.x % 3 !== 0 &&
  cell.has(key(c.x - 1, c.z)) && cell.has(key(c.x + 1, c.z)));
if (north.length) {
  const mid = north.reduce((s, c) => s + c.x, 0) / north.length;
  const door = north.reduce((a, c) => (Math.abs(c.x - mid) < Math.abs(a.x - mid) ? c : a));
  const facing = "north";
  g.set(door.x, 3, door.z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(door.x, 4, door.z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(door.x, 5, door.z, "dark_oak_slab", { type: "top", waterlogged: "false" });
}

// Roof equipment: a pair of air-handling units on the two-storey roof, standing on its deck.
for (const c of cell.values()) {
  if (c.tier === 2 && c.x >= 7 && c.x <= 8 && c.z >= 8 && c.z <= 9) g.set(c.x, c.deck + 1, c.z, "iron_block");
}

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_948317551.nbt");
console.log(JSON.stringify(stats));
