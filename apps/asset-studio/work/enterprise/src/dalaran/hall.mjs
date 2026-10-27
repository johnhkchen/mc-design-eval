// Dalaran look study: one hall in the kingdom's own shell family, to prove the look before its module set is cut.
// A stone platform with steps, red lacquered columns (stripped mangrove), white walls (calcite) behind a front gallery,
// lattice windows, a dark beam with bracket sets (upside-down stairs) under deep eaves, and a violet tiled hipped roof
// (purpur) whose four corners turn up, a ridge with end ornaments. Authored with the front to the south (+z).
//   node src/dalaran/hall.mjs [W] [D] out.nbt        (W, D odd; the walls' footprint, the gallery in front)
import { Grid } from "../grid.mjs";

const COL = "stripped_mangrove_log[axis=y]", WALL = "calcite", BEAM = (a) => `dark_oak_log[axis=${a}]`;
const PLAT = "polished_andesite", PLAT_EDGE = (f) => `andesite_stairs[facing=${f},half=bottom,shape=straight,waterlogged=false]`;
const TILE = (f, half = "bottom", shape = "straight") => `purpur_stairs[facing=${f},half=${half},shape=${shape},waterlogged=false]`;
const BRACKET = (f) => `dark_oak_stairs[facing=${f},half=top,shape=straight,waterlogged=false]`;
const LATTICE = (f) => `dark_oak_trapdoor[facing=${f},half=bottom,open=true,powered=false,waterlogged=false]`;
const LANTERN = "lantern[hanging=true,waterlogged=false]";

export function dalaranHall(W = 11, D = 7) {
  const E = 2, G = 2;                                   // eave overhang, gallery depth in front
  const PW = W + 2, PD = D + G + 2;                     // the platform: 1 round the walls and gallery
  const SX = W + 2 * E, SZ = D + G + 2 * E;             // the roof's spread
  const H = 1 + 4 + 1 + Math.ceil(Math.min(SX, SZ) / 2) + 3;
  const g = new Grid([SX, H, SZ + 2]);
  const ox = E, oz = E;                                 // the walls' north-west corner in grid coordinates
  const front = oz + D - 1, galleryZ = front + G;       // the wall's front row; the gallery's front columns
  // the platform: one high, stair-edged, with a flight of steps up the middle of the front
  for (let x = ox - 1; x <= ox + W; x++) for (let z = oz - 1; z <= galleryZ + 1; z++) {
    const edge = x === ox - 1 || x === ox + W || z === oz - 1 || z === galleryZ + 1;
    g.set(x, 0, z, edge ? (z === galleryZ + 1 ? PLAT_EDGE("north") : z === oz - 1 ? PLAT_EDGE("south") : x === ox - 1 ? PLAT_EDGE("east") : PLAT_EDGE("west")) : PLAT);
  }
  const mid = ox + (W >> 1);
  for (let x = mid - 1; x <= mid + 1; x++) g.set(x, 0, galleryZ + 2, "andesite_slab[type=bottom,waterlogged=false]");
  // walls: calcite, columns at the corners and every 2 along the sides, a door at the middle, lattice windows
  for (let x = ox; x < ox + W; x++) for (let z = oz; z <= front; z++) {
    const onWall = x === ox || x === ox + W - 1 || z === oz || z === front;
    if (!onWall) continue;
    const col = (x - ox) % 4 === 0 && (z === oz || z === front) || (z - oz) % 4 === 0 && (x === ox || x === ox + W - 1) || x === ox + W - 1 && (z === oz || z === front) || z === front && (x === ox || x === ox + W - 1);
    for (let y = 1; y <= 4; y++) {
      let s = col ? COL : WALL;
      const along = z === oz || z === front ? x - ox : z - oz;
      if (!col && y >= 2 && y <= 3 && along % 4 === 2) {
        const face = z === front ? "south" : z === oz ? "north" : x === ox ? "west" : "east";
        s = LATTICE(face);
      }
      g.set(x, y, z, s);
    }
  }
  // dark timber framing the plaster: a sill rail at layer 1 between the columns
  for (let x = ox; x < ox + W; x++) for (const z of [oz, front]) if (g.get(x, 1, z) === "minecraft:calcite") g.set(x, 1, z, BEAM("x"));
  for (let z = oz; z <= front; z++) for (const x of [ox, ox + W - 1]) if (g.get(x, 1, z) === "minecraft:calcite") g.set(x, 1, z, BEAM("z"));
  // the door: a dark oak door under a beam, at the middle of the front wall
  g.set(mid, 1, front, "dark_oak_door[facing=south,half=lower,hinge=left,open=false,powered=false]");
  g.set(mid, 2, front, "dark_oak_door[facing=south,half=upper,hinge=left,open=false,powered=false]");
  g.set(mid, 3, front, WALL); g.set(mid, 4, front, WALL);
  // the gallery's front columns, on the wall's column rhythm
  for (let x = ox; x < ox + W; x += 2) for (let y = 1; y <= 4; y++) g.set(x, y, galleryZ, COL);
  // the beam ring at layer 5 over walls and gallery, with brackets stepping out from every column
  for (let x = ox; x < ox + W; x++) { g.set(x, 5, oz, BEAM("x")); g.set(x, 5, front, BEAM("x")); g.set(x, 5, galleryZ, BEAM("x")); }
  for (let z = oz; z <= galleryZ; z++) { g.set(ox, 5, z, BEAM("z")); g.set(ox + W - 1, 5, z, BEAM("z")); }
  for (let x = ox; x < ox + W; x += 2) { g.set(x, 5, oz - 1, BRACKET("south")); g.set(x, 5, galleryZ + 1, BRACKET("north")); }
  for (let z = oz; z <= galleryZ; z += 2) { g.set(ox - 1, 5, z, BRACKET("east")); g.set(ox + W, 5, z, BRACKET("west")); }
  // a lantern hung under the gallery's beam at each bay
  for (let x = ox + 1; x < ox + W - 1; x += 2) g.set(x, 4, galleryZ - 1, LANTERN);
  // the floor inside and the gallery deck
  for (let x = ox + 1; x < ox + W - 1; x++) for (let z = oz + 1; z < front; z++) g.set(x, 0, z, "dark_oak_planks");
  for (let x = ox; x < ox + W; x++) for (let z = front + 1; z <= galleryZ; z++) if (!g.get(x, 1, z)) g.set(x, 0, z, "stripped_dark_oak_wood[axis=x]");
  // the roof: hipped, rings of purpur stairs stepping in from the eave; the eave ring turns up at the corners
  const z0 = 0, z1 = SZ - 1, x0 = 0, x1 = SX - 1;
  // ring k's height in half blocks over the eave: shallow (a half block a ring) for the first rings, then a block a ring
  const RISE = [0, 1, 2, 3, 4, 6, 8, 10, 12, 14, 16, 18, 20];
  for (let k = 0; x0 + k <= x1 - k && z0 + k <= z1 - k; k++) {
    const hh = RISE[k], y = 6 + (hh >> 1), half = hh % 2 === 1;
    const ax = x0 + k, bx = x1 - k, az = z0 + k, bz = z1 - k;
    const set = (x, z, f, shape = "straight") => g.set(x, y, z, half ? "purpur_slab[type=top,waterlogged=false]" : TILE(f, "bottom", shape));
    if (ax === bx || az === bz) {                        // the ridge: a line of purpur with pillar ends and finials
      const yr = y + (half ? 1 : 0);
      for (let x = ax; x <= bx; x++) for (let z = az; z <= bz; z++) g.set(x, yr, z, "purpur_slab[type=bottom,waterlogged=false]");
      g.set(ax, yr, az, "purpur_pillar[axis=y]"); g.set(bx, yr, bz, "purpur_pillar[axis=y]");
      g.set(ax, yr + 1, az, "end_rod[facing=up]"); g.set(bx, yr + 1, bz, "end_rod[facing=up]");
      for (let x = ax; x <= bx; x++) for (let z = az; z <= bz; z++) for (let yy = 6; yy < yr; yy++) if (!g.get(x, yy, z)) g.set(x, yy, z, "purpur_block");
      break;
    }
    for (let x = ax + 1; x < bx; x++) { set(x, az, "south"); set(x, bz, "north"); }
    for (let z = az + 1; z < bz; z++) { set(ax, z, "east"); set(bx, z, "west"); }
    for (const [cx, cz, f] of [[ax, az, "south"], [bx, az, "west"], [ax, bz, "east"], [bx, bz, "north"]]) set(cx, cz, f, "outer_left");
    // the upturned corners: the eave's corner tips lift a block, a stair turned out
    if (k === 0) for (const [cx, cz, f] of [[ax, az, "south"], [bx, az, "west"], [ax, bz, "east"], [bx, bz, "north"]]) g.set(cx, y + 1, cz, TILE(f, "top", "outer_left"));
    // close the roof under the next ring
    for (let x = ax + 1; x < bx; x++) for (let z = az + 1; z < bz; z++) for (let yy = 6; yy <= y; yy++) if (!g.get(x, yy, z)) g.set(x, yy, z, "purpur_block");
  }
  return g;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const a = process.argv.slice(2), out = a.find((s) => s.endsWith(".nbt")) || "out/dalaran/hall.nbt";
  const [W, D] = a.filter((s) => /^\d+$/.test(s)).map(Number);
  const g = dalaranHall(W || 11, D || 7);
  const { mkdirSync } = await import("node:fs"); mkdirSync(out.replace(/[^/]*$/, ""), { recursive: true });
  g.save(out); console.log(out, g.size.join("x"));
}
