// 4 East 54th Street, NYC individual landmark, 1900 commercial and office building: a seven-storey red-brick block on a
// granite base, with stone string courses, a cornice, and a storefront on the 54th Street front (low z = north). Footprint
// 10 x 26, a rear wing six storeys high (lidar roof about 20) on the south end of the lot. Pre-1916, so no setbacks: the
// main block is one flat-roofed mass whose lidar roof (22-24) reads as one deck at 23, with a cornice to 24. The wing
// deck sits at 20 (lidar 19-21). Glass sits in the outer wall with air behind it and a floor slab per storey (no
// interiors); warm glowstone sits behind some lower panes. A wooden water tower on a stone pedestal stands on the roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035736.cells.json`, "utf8"));
const X = 10, Y = 32, Z = 26;

const key = (x, z) => `${x},${z}`;
const lidar = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { ground, roof }]));
const has = (x, z) => lidar.has(key(x, z));
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Two tiers from the lidar: each cell's 3x3 median roof, then 23 (seven storeys) or 20 (the six-storey wing). The deck is
// the top solid row of that tier; storeys are 3 blocks, floor slabs at y = 2, 5, 8 ... (y % 3 === 2).
const median = (v) => v.sort((a, b) => a - b)[v.length >> 1];
const deck = new Map();
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (has(x + dx, z + dz)) v.push(lidar.get(key(x + dx, z + dz)).roof);
  deck.set(key(x, z), median(v) >= 22 ? 23 : 20);
}
const deckAt = (x, z) => deck.get(key(x, z));

// A window-row cell is shell if it faces outside the footprint, or stands beside a lower tier (its exposed side above that
// tier's deck). Everything else in the footprint is air, the interior, with the floor slabs across it.
const shell = (x, z, y) => NB.some(([dx, dz]) => !has(x + dx, z + dz) || deckAt(x + dx, z + dz) < y);

// The face a cell looks out of: u runs along the face and sets the bay rhythm (piers at u % 3 === 0).
function face(x, z) {
  if (!has(x, z - 1)) return { u: x, front: z === 0, out: [0, -1] };
  if (!has(x, z + 1)) return { u: x, front: false, out: [0, 1] };
  if (!has(x + 1, z)) return { u: z, front: false, out: [1, 0] };
  if (!has(x - 1, z)) return { u: z, front: false, out: [-1, 0] };
  return { u: x, front: false, out: null };
}

const g = new Voxels([X, Y, Z]);
// About one lower window in four lit from behind.
const lit = (x, y, z) => (x * 5 + z * 3 + Math.floor(y / 3)) % 4 === 0;
const coords = cells.map(([x, z]) => [x, z]);

for (const [x, z] of coords) {
  const d = deckAt(x, z), f = face(x, z);
  const outer = NB.some(([dx, dz]) => !has(x + dx, z + dz));

  // Base course: granite from y 0 up through the ground (y 0-1), so the cells on the low side stand on a plinth.
  g.set(x, 0, z, "polished_granite");
  g.set(x, 1, z, "polished_granite");

  for (let y = 2; y <= d; y++) {
    if (y % 3 === 2) { g.set(x, y, z, "stone_bricks"); continue; }   // floor slab and string course
    if (!shell(x, z, y)) continue;                                   // interior air behind the wall
    const ground = y < 5;
    const pier = f.u % 3 === 0;
    if (f.front && x === 4 && ground) {                              // the entrance door, 1 wide, in bay u 4
      g.set(x, y, z, "dark_oak_door", { facing: "south", half: y === 3 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (pier) { g.set(x, y, z, ground ? "polished_granite" : "bricks"); continue; }
    if (ground && y === 3) { g.set(x, y, z, "dark_oak_planks"); continue; }   // shopfront bulkhead
    g.set(x, y, z, "glass_pane");
    if (f.out && y % 3 === 0 && y >= 6 && lit(x, y, z)) {            // a lamp on the floor slab, inside the glass
      const [ix, iz] = [x - f.out[0], z - f.out[1]];
      if (has(ix, iz) && !shell(ix, iz, y)) g.set(ix, y, iz, "glowstone");
    }
  }

  // Cornice and parapet: the row above the deck on every edge that stands free (outside, or above a lower tier).
  const rim = outer || NB.some(([dx, dz]) => has(x + dx, z + dz) && deckAt(x + dx, z + dz) < d);
  if (rim) g.set(x, d + 1, z, "stone_bricks");
  // Lanterns on the cornice at the two street corners.
  if (f.front && (x === 0 || x === 9)) g.set(x, d + 2, z, "lantern", { hanging: "false" });
}

// Rooftop water tower: a 3 x 3 stone pedestal (y 24-25), a spruce tank with its corners open (y 26-28), a slab cap (y 29).
for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
  const x = 7 + dx, z = 13 + dz, corner = dx !== 0 && dz !== 0;
  g.set(x, 24, z, "stone_bricks");
  g.set(x, 25, z, "stone_bricks");
  if (corner) continue;
  for (let y = 26; y <= 28; y++) g.set(x, y, z, "spruce_planks");
  g.set(x, 29, z, "spruce_slab", { type: "top", waterlogged: "false" });
}

// Glass panes join their neighbours the way the wall runs: an arm toward any block that is not a lamp or a door.
const open = new Set(["minecraft:glowstone", "minecraft:dark_oak_door", "minecraft:lantern"]);
for (const [x, z] of coords) for (let y = 2; y <= deckAt(x, z); y++) {
  const b = g.get(x, y, z);
  if (!b || b.block !== "minecraft:glass_pane") continue;
  const join = (dx, dz) => { const n = g.get(x + dx, y, z + dz); return n !== null && !open.has(n.block); };
  g.set(x, y, z, "glass_pane", { east: String(join(1, 0)), west: String(join(-1, 0)), north: String(join(0, -1)), south: String(join(0, 1)), waterlogged: "false" });
}

// Nothing floats: every block sits on something below it, except a floor slab, which spans from the wall ring.
const floating = [];
const slab = (x, y, z) => y % 3 === 2 && g.get(x, y, z)?.block === "minecraft:stone_bricks";
for (const [x, z] of coords) for (let y = 1; y < Y; y++) if (g.get(x, y, z) && !g.get(x, y - 1, z) && !slab(x, y, z)) floating.push([x, y, z]);
for (let y = 24; y < 30; y++) for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (g.get(7 + dx, y, 13 + dz) && !g.get(7 + dx, y - 1, 13 + dz)) floating.push([7 + dx, y, 13 + dz]);
if (floating.length) console.warn(`floating blocks: ${floating.length}`, floating.slice(0, 10));

console.log(g.save(`${DIR}/NYC1035736.nbt`), `footprint ${cells.length} cells`);
