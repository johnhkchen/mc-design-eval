// One block on the Pike Place Market hill, c. 1915: a twelve-storey brick and cream terracotta commercial loft with
// shops on its street floor, the Economy Building's sort of block (the record says the roof sits 68 blocks above the
// lowest ground, so the era is the 1910s Seattle office-loft, not the one-to-four-storey market sheds around it).
// Ground floor: dark oak stallboards, shop glass with frames, brick piers and a cream lintel band. Three entrances
// (the Arcade door on the west face, one on the north and one on the east), each a door with a transom, a hanging
// lantern and a dark oak canopy. Upper storeys: a cream string course on every storey line (y = 5 + 5k), a sill,
// two rows of glass with a pale frame, a lintel, and brick piers every fourth block. Corners are cream quoins. The
// cornice is a cream band at 65 under a brick parapet with a stone cap, so the top is at 68. Downhill cells (ground 0)
// show a lower storey below the shop line: a granite base, glass windows and a string course at y 4.
// Interiors are hollow: a floor slab per storey, air behind the glass, and a lantern standing in some windows.
// Roof: gravel over a deck, with a wooden water tower on legs, a stone penthouse, and two brick flues.
// Each footprint cell is filled from y 0 to its own ground, so nothing floats on the slope.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/seattle/pike-place/fill";
const cells = JSON.parse(readFileSync(`${HERE}/SEA1270132734.cells.json`, "utf8"));   // [x, z, ground] per footprint cell

const SIZE = [40, 80, 79];
const TOP = 67;             // top block of the parapet cap; the roof is 68 above the lowest ground
const ROOF = 65;            // cornice and roof deck line (a storey line: 5 + 5 * 12)
const SHOP = 5;             // the shop storey floor; storey lines run 5 + 5k above it
const G = new Map(cells.map(([x, z, g]) => [`${x},${z}`, g]));
const has = (x, z) => G.has(`${x},${z}`);

const faces = (x, z) => [
  !has(x - 1, z) && "W", !has(x + 1, z) && "E", !has(x, z - 1) && "N", !has(x, z + 1) && "S",
].filter(Boolean);
const along = (f, x, z) => (f === "W" || f === "E" ? z : x);       // position along a facade
const inward = { W: [1, 0], E: [-1, 0], N: [0, 1], S: [0, -1] };
const doorFacing = { W: "east", E: "west", N: "south", S: "north" }; // a door faces out of its wall

// The wall cells, each with its ground and its exposed faces (corners have two).
const walls = cells.map(([x, z, g]) => ({ x, z, g, faces: faces(x, z) })).filter((w) => w.faces.length);

// Entrances: the wanted facade position, or the nearest single-face wall cell to it.
const ENTRANCES = [["W", 39], ["N", 20], ["E", 12]];
const entrance = new Map();   // "x,z" -> { w, f, du, u0 }
for (const [f, want] of ENTRANCES) {
  let u0 = null;
  for (let d = 0; d <= 12 && u0 === null; d++) {
    for (const u of [want + d, want - d]) if (walls.some((w) => w.faces.length === 1 && w.faces[0] === f && along(f, w.x, w.z) === u)) { u0 = u; break; }
  }
  for (const du of [-1, 0, 1]) {
    const w = walls.find((c) => c.faces.length === 1 && c.faces[0] === f && along(f, c.x, c.z) === u0 + du);
    if (w) entrance.set(`${w.x},${w.z}`, { w, f, du, u0 });
  }
}

const g = new Voxels(SIZE);
const B = (name, state) => [name, state];
const slab = (name, type) => B(name, { type, waterlogged: "false" });
const BRICK = B("bricks"), CREAM = B("smooth_sandstone"), GRANITE = B("polished_granite");
const GLASS = B("glass_pane"), FRAME = B("smooth_quartz"), STALL = B("dark_oak_planks");
const SILL = slab("smooth_sandstone_slab", "top"), LINTEL = slab("smooth_sandstone_slab", "bottom");
const CANOPY = slab("dark_oak_slab", "bottom");
const CAP = slab("stone_brick_slab", "top");
const LANTERN = B("lantern", { hanging: "false", waterlogged: "false" });
const HANG = B("lantern", { hanging: "true", waterlogged: "false" });

// The block of one wall cell at height y: the facade pattern, with the entrances overriding the street floor.
function facade(w, y, ent) {
  const { x, z, g: ground, faces: fs } = w;
  const f = fs[0];
  const u = along(f, x, z);
  const pier = u % 4 === 0, mull = u % 4 === 2;
  if (ent && fs.length === 1) {
    if (ent.du === 0) {
      if (y === ground) return B("oak_door", { facing: doorFacing[f], half: "lower", hinge: "left", open: "false", powered: "false" });
      if (y === ground + 1) return B("oak_door", { facing: doorFacing[f], half: "upper", hinge: "left", open: "false", powered: "false" });
      if (y === ground + 2) return GLASS;
      if (y === ground + 3) return HANG;
    }
    if (y === ground + 4) return CANOPY;
    if (ent.du !== 0 && y === ground) return STALL;
    if (ent.du !== 0 && y > ground && y < ground + 4) return GLASS;
  }
  if (fs.length > 1) {                                   // corner quoin: cream, with the base and parapet
    if (y === TOP) return CAP;
    if (y === TOP - 1) return BRICK;
    if (y === ROOF || y === 4 || y === ground) return y === ROOF ? CREAM : GRANITE;
    return CREAM;
  }
  if (y === TOP) return CAP;
  if (y === TOP - 1) return BRICK;
  if (y === ROOF) return CREAM;                          // cornice band
  if (y === ground) return GRANITE;                      // base course follows the grade
  if (y < SHOP) return y === 4 ? GRANITE : pier ? BRICK : mull ? FRAME : GLASS;   // lower storey (downhill)
  if (y === SHOP) return pier ? BRICK : STALL;           // stallboard
  if (y < 10) return y === 9 ? (pier ? BRICK : LINTEL) : pier ? BRICK : mull ? STALL : GLASS;   // shop glass 6-8
  const rel = (y - SHOP) % 5;                            // upper storeys: string, sill, glass, glass, lintel
  if (rel === 0) return CREAM;
  if (rel === 1) return pier ? BRICK : SILL;
  if (rel === 4) return pier ? BRICK : LINTEL;
  return pier ? BRICK : mull ? FRAME : GLASS;
}

// Every footprint cell: foundation to its ground, then either a wall (facade) or the hollow interior.
for (const [x, z, ground] of cells) {
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone");
  const fs = faces(x, z);
  if (fs.length) continue;
  for (let k = 0; k <= 11; k++) g.set(x, SHOP + 5 * k, z, "oak_planks");   // floor slab per storey
  g.set(x, ROOF, z, "stone");                                             // roof deck
  g.set(x, ROOF + 1, z, "gravel");                                        // roof covering
}

// Walls: the facade, then the warm lights set behind some glass (a lantern standing on the floor inside).
for (const w of walls) {
  const ent = entrance.get(`${w.x},${w.z}`);
  const f = w.faces[0];
  const u = along(f, w.x, w.z);
  const [ix, iz] = w.faces.length === 1 ? inward[f] : [0, 0];
  for (let y = w.g; y <= TOP; y++) {
    const [name, state] = facade(w, y, ent) ?? [];
    if (name) g.set(w.x, y, w.z, name, state);
    const glassRow = w.faces.length === 1 && !ent && u % 4 !== 0 && u % 4 !== 2;
    const lightRow = y < 10 ? y === 6 : (y - SHOP) % 5 === 2;
    if (glassRow && lightRow && (u + Math.floor(y / 5)) % 3 === 0) {
      const lx = w.x + ix, lz = w.z + iz, ly = y < 10 ? 6 : y - 1;
      if (has(lx, lz) && !faces(lx, lz).length) g.set(lx, ly, lz, LANTERN[0], LANTERN[1]);
    }
  }
}

// Roof, on top of the gravel: a stone penthouse (glass on its outer faces), a wooden water tower on legs, two flues.
const box = (x0, x1, y0, y1, z0, z1, [name, state]) => {
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) g.set(x, y, z, name, state);
};
box(10, 17, 66, 69, 30, 35, ["stone_bricks"]);
for (let y = 67; y <= 68; y++) for (let x = 10; x <= 17; x++) for (let z = 30; z <= 35; z++) {
  const edge = x === 10 || x === 17 || z === 30 || z === 35;
  if (edge && (x + z) % 2 === 1) g.set(x, y, z, GLASS[0], GLASS[1]);
}
box(10, 17, 70, 70, 30, 35, slab("stone_brick_slab", "bottom"));
for (const x of [4, 8]) for (const z of [66, 70]) box(x, x, 66, 68, z, z, ["oak_fence"]);   // water tower legs
box(4, 8, 69, 72, 66, 70, ["oak_planks"]);
box(4, 8, 73, 73, 66, 70, slab("dark_oak_slab", "bottom"));
for (const x of [30, 34]) box(x, x, 66, 71, 70, 70, ["bricks"]), g.set(x, 72, 70, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

const stats = g.save(`${HERE}/SEA1270132734.nbt`);
console.log(JSON.stringify({ footprint: cells.length, ...stats }));
