// DC74770: Hotel-Large, 550 C Street SW, Washington DC 20024, as a 1.21.1 module.
// Era and type: the Southwest Urban Renewal rebuild of the 1960s-70s, a concrete-framed modernist hotel. White
// concrete piers and light-grey spandrels frame ribbons of glass, a stone base sits on the street, the lobby is a
// single storey on the C Street (north) face under a marquee, and the tower steps back as it rises.
// Lidar roof heights (3x3 median, from the footprint) snap to three tiers: 14 (core, 4 storeys), 11 (wings, 3 storeys)
// and 3 (the one-storey lobby). Storeys are 3 blocks (slab, window band, spandrel). The tower's outer ring stands at
// 11 and its second ring at 12, so it steps back in two tiers. Every cell is solid from y 0 up to its ground, and each
// storey carries a full slab across the footprint, so every block stands on a block below or on the slab's walls.
// Interiors are air behind the glass (one cell in), with a few glowstone lamps on the floor slab behind windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC74770.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC74770.nbt";

const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inF = (x, z) => F.has(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const shell = (x, z) => DIRS.some(([dx, dz]) => !inF(x + dx, z + dz));

// Palette
const FRAME = "white_concrete";         // piers, parapets, the door head beam
const SLAB = "light_gray_concrete";     // floor slabs, spandrels, cornices, the marquee
const BASE = "stone_bricks";            // foundation and the street-level plinth
const GLASS = "glass_pane";
const DECK = "smooth_stone";            // roof deck (interior)
const DOOR = "dark_oak_door";
const LAMP = "glowstone";
const LANTERN = "lantern";
const PLANT = "iron_block";             // roof plant, sparingly

// Smoothed roof: median of the footprint cells in the 3x3 around each cell (lidar noise and 0-1 gaps drop out).
const smooth = new Map();
for (const c of F.values()) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = F.get(key(c.x + dx, c.z + dz)); if (n) vals.push(n.r);
  }
  vals.sort((a, b) => a - b);
  smooth.set(key(c.x, c.z), vals[vals.length >> 1]);
}
// Tiers: 14 blocks for the core, 11 for the wings, 3 for the one-storey lobby.
const tierOf = (h) => (h >= 13 ? 14 : h >= 9 ? 11 : 3);

// Distance in cells from the outside (1 = shell). The tower's rings step down: ring 1 to 11, ring 2 to 12.
const dist = new Map();
let frontier = [];
for (const c of F.values()) if (shell(c.x, c.z)) { dist.set(key(c.x, c.z), 1); frontier.push(c); }
for (let d = 1; frontier.length; d++) {
  const next = [];
  for (const c of frontier) for (const [dx, dz] of DIRS) {
    const k = key(c.x + dx, c.z + dz); const n = F.get(k);
    if (n && !dist.has(k)) { dist.set(k, d + 1); next.push(n); }
  }
  frontier = next;
}
const top = new Map();
for (const c of F.values()) {
  const k = key(c.x, c.z); let T = c.r < 6 ? 3 : tierOf(smooth.get(k));   // the lobby's raw 3 is not smoothed into its neighbours
  const d = dist.get(k);
  if (T === 14 && d === 1) T = 11;
  if (T === 14 && d === 2) T = 12;
  top.set(k, T);
}

// Entrance: the C Street lobby front (north face, the one-storey tier), the door at the middle of the lobby.
const lobbyFront = [...F.values()].filter((c) => !inF(c.x, c.z - 1) && c.r < 6);
lobbyFront.sort((a, b) => a.x - b.x);
const door = lobbyFront[Math.floor(lobbyFront.length / 2)];
if (!door) throw new Error("no one-storey lobby front on the north face");
const DX = door.x, DZ = door.z;

// A box 26 x 26 x 36 (y 0..25 covers the 14-block roof with room for the roof plant and marquee).
const g = new Voxels([26, 26, 36]);

for (const c of F.values()) {
  const k = key(c.x, c.z), T = top.get(k), G = c.g, sh = shell(c.x, c.z);
  const N = Math.max(1, Math.floor((T - G - 1) / 3));          // storeys below the top course
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < G; y++) g.set(c.x, y, c.z, BASE);
  for (let y = G; y < T; y++) {
    if (y === T - 1) { g.set(c.x, y, c.z, sh ? FRAME : DECK); continue; }      // parapet or roof deck
    const s = Math.floor((y - G) / 3), r = (y - G) % 3;
    if (s >= N) { g.set(c.x, y, c.z, SLAB); continue; }                       // cornice course above the storeys
    if (r === 0) { g.set(c.x, y, c.z, sh && s === 0 ? BASE : SLAB); continue; } // storey slab (base course at street)
    if (!sh) continue;                                                         // interior: air behind the glass
    if (r === 2) { g.set(c.x, y, c.z, SLAB); continue; }                       // spandrel below the next slab
    // r = 1: the window band. Piers at the corners and every third cell; glass elsewhere.
    const onNS = !inF(c.x, c.z - 1) || !inF(c.x, c.z + 1), onEW = !inF(c.x - 1, c.z) || !inF(c.x + 1, c.z);
    const pier = (onNS && onEW) || (onNS && c.x % 3 === 0) || (onEW && c.z % 3 === 0);
    if (pier) { g.set(c.x, y, c.z, FRAME); continue; }
    g.set(c.x, y, c.z, GLASS);
    // A warm light in some windows: glowstone on the floor slab in the air gap behind the glass.
    const inX = !inF(c.x - 1, c.z) ? c.x + 1 : !inF(c.x + 1, c.z) ? c.x - 1 : c.x;
    const inZ = !inF(c.x, c.z - 1) ? c.z + 1 : !inF(c.x, c.z + 1) ? c.z - 1 : c.z;
    const room = inX !== c.x ? inF(inX, c.z) && !shell(inX, c.z) : inF(c.x, inZ) && !shell(c.x, inZ);
    if (room && (c.x * 7 + c.z * 13 + y) % 9 === 0) g.set(inX !== c.x ? inX : c.x, y, inX !== c.x ? c.z : inZ, LAMP);
  }
  // Roof: plant on the core top and small units on the wings, each standing on the roof deck.
  if (T === 14 && dist.get(k) >= 4 && c.x % 5 === 2 && c.z % 5 === 2) {
    for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      if (top.get(key(c.x + dx, c.z + dz)) === 14) g.set(c.x + dx, 14, c.z + dz, PLANT);
    }
    g.set(c.x, 15, c.z, SLAB);
  }
  if (T === 11 && dist.get(k) >= 2 && c.x % 8 === 1 && c.z % 8 === 1) {        // one roof unit to a wing, not a scatter
    for (const [dx, dz] of [[0, 0], [1, 0]]) if (top.get(key(c.x + dx, c.z + dz)) === 11) g.set(c.x + dx, 11, c.z + dz, PLANT);
  }
}

// Lobby marquee over the entrance: a slab on the lobby parapet, a head beam under it, a hanging lantern, and the door.
for (let x = DX - 2; x <= DX + 2; x++) if (inF(x, DZ)) g.set(x, 3, DZ, SLAB);
g.set(DX, 2, DZ, FRAME);
g.set(DX, 0, DZ, DOOR, { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(DX, 1, DZ, DOOR, { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(DX, 2, DZ, LANTERN, { hanging: "true" });
// Dark glass over the lobby doors on either side, so the entrance reads as the one lit bay of the street front.
for (const x of [DX - 1, DX + 1]) if (inF(x, DZ)) { g.set(x, 1, DZ, GLASS); g.set(x, 0, DZ, BASE); }

g.save(OUT);
console.log("saved", OUT, "blocks", g.count(), "lobby door", DX, DZ);
