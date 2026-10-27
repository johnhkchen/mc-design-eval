// Dalaran's courtyard house on a double plot (thread 0010: 2W + 2 wide, 16 deep, plots: 2). Front (south, z 15) to
// the street: a 2-deep forecourt, a white compound wall with a gate pavilion; the main hall across the back behind a
// red-columned gallery; two side wings (a chamber each, two beds); the court open to the sky between them, paved, with
// a flowering tree, a pond and lanterns. Layers 0-1 ground, 2 the ground's surface. Roofs: dalaran's concave hip.
import { Grid } from "../grid.mjs";
import { hipRoof } from "./modules.mjs";

const COL = "stripped_mangrove_log[axis=y]", WALL = "calcite", PLINTH = "polished_andesite", BEAM = (a) => `dark_oak_log[axis=${a}]`;
const LATTICE = (f) => `dark_oak_trapdoor[facing=${f},half=bottom,open=true,powered=false,waterlogged=false]`;
const DOOR = (f, half) => `dark_oak_door[facing=${f},half=${half},hinge=left,open=false,powered=false]`;
const LANTERN = "lantern[hanging=true,waterlogged=false]", LAMP = "lantern[hanging=false,waterlogged=false]";

/** A small building: walls x0..x1, z0..z1, 4 high on a plinth, columns at the corners and every 3, lattice windows,
 *  a door on `doorFace` at `doorAt`, a concave hip roof over it (eave 1). Returns the interior cells. */
function building(g, x0, z0, x1, z1, { doorFace, doorAt }) {
  const faceOf = (x, z) => (z === z1 ? "south" : z === z0 ? "north" : x === x0 ? "west" : "east");
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    g.set(x, 2, z, PLINTH);
    const edge = x === x0 || x === x1 || z === z0 || z === z1;
    if (!edge) { g.set(x, 2, z, "dark_oak_planks"); continue; }
    const along = z === z0 || z === z1 ? x - x0 : z - z0, len = z === z0 || z === z1 ? x1 - x0 : z1 - z0;
    const col = (x === x0 || x === x1) && (z === z0 || z === z1) || along % 3 === 0;
    for (let y = 3; y <= 6; y++) g.set(x, y, z, y === 6 ? BEAM(z === z0 || z === z1 ? "x" : "z") : col ? COL : (y === 4 || y === 5) && along % 3 === 1 && along < len ? LATTICE(faceOf(x, z)) : WALL);
  }
  const [dx, dz] = doorAt; g.set(dx, 3, dz, DOOR(doorFace, "lower")); g.set(dx, 4, dz, DOOR(doorFace, "upper")); g.set(dx, 5, dz, WALL);
  g.paste(hipRoof(x1 - x0 + 3, z1 - z0 + 3), x0 - 1, 7, z0 - 1);
  // the ceiling under the roof, and a lantern in the room
  for (let x = x0 + 1; x < x1; x++) for (let z = z0 + 1; z < z1; z++) for (let y = 3; y <= 6; y++) if (!g.get(x, y, z)) g.set(x, y, z, "air");
  g.set(Math.floor((x0 + x1) / 2), 6, Math.floor((z0 + z1) / 2), LANTERN);
}

export function courtyardHouse() {
  const W = 22, D = 16, g = new Grid([W, 18, D]);
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) { g.set(x, 0, z, "dirt"); g.set(x, 1, z, "dirt"); g.set(x, 2, z, "grass_block[snowy=false]"); }
  // the compound wall: white plaster on a plinth, a tile coping, round the house's 14 back rows (z 0..13)
  const wallTop = (x, z) => { for (let y = 3; y <= 4; y++) g.set(x, y, z, y === 3 ? PLINTH : WALL); g.set(x, 5, z, "purpur_slab[type=bottom,waterlogged=false]"); };
  for (let x = 0; x < W; x++) { wallTop(x, 0); wallTop(x, 13); }
  for (let z = 0; z <= 13; z++) { wallTop(0, z); wallTop(W - 1, z); }
  // the court: paved, everything inside the wall
  for (let x = 1; x < W - 1; x++) for (let z = 1; z < 13; z++) g.set(x, 2, z, (x + z) % 2 ? "stone_bricks" : "polished_andesite");
  // the main hall across the back (walls x 4..17, z 1..5) behind a gallery of red columns (z 6..7)
  building(g, 4, 1, 17, 5, { doorFace: "south", doorAt: [10, 5] });
  for (let x = 4; x <= 17; x += 3) for (let y = 3; y <= 6; y++) g.set(x, y, 7, COL);
  for (let x = 4; x <= 17; x++) { g.set(x, 6, 7, BEAM("x")); g.set(x, 2, 6, "stripped_dark_oak_wood[axis=x]"); g.set(x, 2, 7, "stripped_dark_oak_wood[axis=x]"); }
  for (let x = 3; x <= 18; x++) for (let z = 6; z <= 8; z++) g.set(x, 7, z, z === 8 ? "purpur_stairs[facing=north,half=bottom,shape=straight,waterlogged=false]" : "purpur_slab[type=top,waterlogged=false]");
  for (const x of [6, 9, 12, 15]) g.set(x, 6, 6, LANTERN);
  // the side wings (walls x 1..5 / 16..20, z 7..11), a chamber each, doors onto the court
  building(g, 1, 8, 6, 12, { doorFace: "east", doorAt: [6, 11] });
  building(g, 15, 8, 20, 12, { doorFace: "west", doorAt: [15, 11] });
  const beds = [];
  // each wing's chamber (interior 4 x 3): two made beds with a gap between, heads to the back wall
  for (const [b1, b2] of [[2, 4], [17, 19]]) for (const bx of [b1, b2]) {
    g.set(bx, 3, 9, "red_bed[facing=north,occupied=false,part=head]"); g.set(bx, 3, 10, "red_bed[facing=north,occupied=false,part=foot]"); beds.push({ head: [bx, 3, 9], foot: [bx, 3, 10] });
  }
  g.set(9, 3, 2, "chest[facing=south,type=single,waterlogged=false]"); g.set(14, 3, 2, "chest[facing=south,type=single,waterlogged=false]");
  // the hall's furniture: a hearth, a table with benches, shelves and a desk
  g.set(5, 3, 2, "furnace[facing=east,lit=false]"); g.set(13, 3, 3, "spruce_fence[east=false,north=false,south=false,waterlogged=false,west=false]"); g.set(13, 4, 3, "spruce_pressure_plate[powered=false]");
  g.set(12, 3, 3, "dark_oak_stairs[facing=east,half=bottom,shape=straight,waterlogged=false]"); g.set(14, 3, 3, "dark_oak_stairs[facing=west,half=bottom,shape=straight,waterlogged=false]");
  for (const x of [6, 7, 15, 16]) g.set(x, 3, 2, "bookshelf");
  g.set(15, 6, 3, LANTERN); g.set(7, 6, 3, LANTERN); g.set(8, 3, 2, "chest[facing=south,type=single,waterlogged=false]");
  // the court: a flowering tree, a pond with lilies, lanterns on posts, potted plants by the doors
  g.set(8, 2, 9, "water"); g.set(9, 2, 9, "water"); g.set(8, 2, 10, "water"); g.set(9, 2, 10, "water");
  g.set(8, 3, 9, "lily_pad"); for (const [x, z] of [[7, 9], [7, 10], [10, 9], [10, 10], [8, 8], [9, 8], [8, 11], [9, 11]]) g.set(x, 2, z, "mossy_stone_bricks");
  g.set(13, 2, 10, "grass_block[snowy=false]");
  for (let y = 3; y <= 5; y++) g.set(13, y, 10, "cherry_log[axis=y]");
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) for (const y of [6, 7]) if (Math.abs(dx) + Math.abs(dz) <= (y === 6 ? 3 : 2) && !(dx === 0 && dz === 0 && y === 6)) { const x = 13 + dx, z = 10 + dz; if (!g.get(x, y, z)) g.set(x, y, z, "cherry_leaves[distance=1,persistent=true,waterlogged=false]"); }
  // lamp posts, off the walking lines (and one in each back corner behind the hall's ends)
  for (const [x, z] of [[11, 8], [12, 11], [2, 4], [19, 4]]) { g.set(x, 3, z, "dark_oak_fence[east=false,north=false,south=false,waterlogged=false,west=false]"); g.set(x, 4, z, LAMP); }
  g.set(7, 3, 12, "potted_azalea_bush"); g.set(14, 3, 12, "potted_azalea_bush");     // by the wing doors, off the way in
  // the gate pavilion in the front wall's middle (x 9..12): red columns, a roofed gateway, a lantern each side
  for (let x = 9; x <= 12; x++) for (let y = 3; y <= 5; y++) g.set(x, y, 13, (x === 9 || x === 12) ? COL : "air");
  for (let x = 9; x <= 12; x++) g.set(x, 2, 13, "polished_andesite");
  for (const x of [9, 12]) for (let y = 3; y <= 5; y++) g.set(x, y, 14, COL);
  g.paste(hipRoof(6, 4), 8, 6, 12);
  g.set(10, 5, 14, LANTERN); g.set(11, 5, 14, LANTERN);
  // the forecourt (z 14..15): a paved approach from the street, lantern posts, the rest a garden strip
  for (let z = 14; z < D; z++) for (const x of [10, 11]) g.set(x, 2, z, "polished_andesite");
  for (const x of [7, 14]) { g.set(x, 3, 15, "dark_oak_fence[east=false,north=false,south=false,waterlogged=false,west=false]"); g.set(x, 4, 15, "dark_oak_fence[east=false,north=false,south=false,waterlogged=false,west=false]"); g.set(x, 5, 15, LAMP); }
  for (let x = 1; x < W - 1; x++) if (x < 7 || x > 14) g.set(x, 3, 14, ["azure_bluet", "allium", "fern", "short_grass"][x % 4]);
  for (const x of [3, 18]) { g.set(x, 3, 15, "dark_oak_fence[east=false,north=false,south=false,waterlogged=false,west=false]"); g.set(x, 4, 15, "dark_oak_fence[east=false,north=false,south=false,waterlogged=false,west=false]"); g.set(x, 5, 15, LAMP); }
  // open ground the walk crosses is air, not void (a void cell reads as unknown and isn't walked)
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) for (let y = 3; y <= 5; y++) if (!g.get(x, y, z)) g.set(x, y, z, "air");
  return { grid: g, meta: { entrances: [{ at: [10, 3, 15], facing: "south", width: 2 }], beds } };
}
