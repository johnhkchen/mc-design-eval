// The Lordaeron stone wall kit (town tier). Every piece is 7 thick (z 0 outside/north .. 6 inside/south), the curtain
// on z 1..5 centred on the wall's line, the run along x; 4 foundation layers (ground = 4). Detail by default: a battered
// plinth, masonry varied by a hash (cracked and mossy stone among the brick), a corbelled string course, arrow loops, a
// machicolated parapet with merlons, a lit wall-walk with a rail on the town side. Towers and the gatehouse carry stairs
// up to the walk from a door on the town side.
import { Grid } from "../grid.mjs";

const G = 4, WALK = 11;                     // ground row; the wall-walk's surface layer (feet at WALK + 1)
const stoneAt = (x, y, z) => { const h = (x * 73856093) ^ (y * 19349663) ^ (z * 83492791); const k = ((h % 13) + 13) % 13; return k === 0 ? "cracked_stone_bricks" : k === 1 ? "mossy_stone_bricks" : "stone_bricks"; };
const ST = (f, half = "bottom") => `stone_brick_stairs[facing=${f},half=${half},shape=straight,waterlogged=false]`;
const SLAB = (t = "bottom") => `stone_brick_slab[type=${t},waterlogged=false]`;
const WALLB = (up = true, ew = "low") => `stone_brick_wall[east=${ew},north=none,south=none,up=${up},waterlogged=false,west=${ew}]`;
const LANTERN = "lantern[hanging=false,waterlogged=false]", HANG = "lantern[hanging=true,waterlogged=false]";

function foundation(g, x0, x1, z0, z1) { for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) for (let y = 0; y < G; y++) g.set(x, y, z, y === G - 1 ? "stone_bricks" : "cobblestone"); }

/** One column of curtain at local x (the run's position for the merlon rhythm). */
function curtainColumn(g, x, xr = x) {
  for (let z = 1; z <= 5; z++) for (let y = G; y <= WALK; y++) g.set(x, y, z, stoneAt(xr, y, z));
  foundation(g, x, x, 0, 6);
  g.set(x, G, 0, ST("south")); g.set(x, G, 6, ST("north"));                                            // the batter at the foot, both sides
  g.set(x, 8, 0, ST("south", "top"));                                                                    // the string course, corbelled
  if (xr % 4 === 2) { g.set(x, 7, 1, "iron_bars[east=true,north=false,south=false,waterlogged=false,west=true]"); }   // an arrow loop
  // the parapet: corbels (machicolations) under a projecting outer parapet, merlons every other column
  g.set(x, WALK, 0, ST("south", "top"));
  g.set(x, WALK + 1, 0, stoneAt(xr, WALK + 1, 0));
  g.set(x, WALK + 2, 0, xr % 2 === 0 ? stoneAt(xr, WALK + 2, 0) : SLAB());
  if (xr % 2 === 0) g.set(x, WALK + 3, 0, SLAB());
  for (let z = 1; z <= 4; z++) for (let y = WALK + 1; y <= WALK + 3; y++) g.set(x, y, z, "air");        // the walk, 2+ clear
  g.set(x, WALK + 1, 5, WALLB(xr % 4 === 0));                                                          // the town-side rail
  if (xr % 4 === 0) g.set(x, WALK + 2, 5, LANTERN);                                                    // a lamp every 4 on the rail
  if (xr % 4 === 1) { for (let y = G; y <= 8; y++) g.set(x, y, 6, stoneAt(xr, y, 6)); g.set(x, 9, 6, ST("south")); }   // a buttress on the town side
  else if (xr % 4 === 3) g.set(x, 7, 5, "iron_bars[east=true,north=false,south=false,waterlogged=false,west=true]");      // a loop to the town
}

export function curtain(len, off = 0) { const g = new Grid([len, WALK + 4, 7]); for (let x = 0; x < len; x++) curtainColumn(g, x, x + off); return g; }

// Blind arcading on a face: piers stand on the face's plane, the panels between are recessed one block, each under an
// arch head (an upside-down stair at the panel's top) and over a sill course. `at(u, d)` maps a position along the face
// (u) and a depth (d: 0 the plane, 1 behind it) to (x, z); piers at both ends and every `bay` along.
function arcade(g, at, len, y0, y1, bay = 3) {
  for (let u = 0; u < len; u++) {
    const pier = u === 0 || u === len - 1 || u % bay === 0;
    for (let y = y0; y <= y1; y++) {
      const [x, z] = at(u, 0), [xi, zi] = at(u, 1);
      g.set(xi, y, zi, stoneAt(xi, y, zi));
      if (pier) g.set(x, y, z, (y - y0) % 4 === 3 ? "chiseled_stone_bricks" : stoneAt(x, y, z));
      else if (y === y1) g.set(x, y, z, `stone_brick_stairs[facing=${at.inward},half=top,shape=straight,waterlogged=false]`);   // the arch head
      else if (y === y0) g.set(x, y, z, SLAB("bottom"));                                                                        // the sill course (a half slab: no mob spawns on it)
      else if ((y - y0) % 4 === 2) g.set(x, y, z, "iron_bars[east=true,north=true,south=true,waterlogged=false,west=true]");      // a loop in each panel
      else g.set(x, y, z, "air");
    }
  }
}

/** A square tower: x0..x0+6, z0..6. The outer ring (x0/x0+6, z0/z6) is the arcade's plane; walls on the next ring;
 *  a newel stair winds round the 3 x 3 core up to the walk; doors onto the walk both sides; a corbelled, crenellated top. */
function tower(g, x0, { corner = false } = {}) {
  const TOP = WALK + 5;
  foundation(g, x0, x0 + 6, 0, 6);
  for (let x = x0; x <= x0 + 6; x++) for (let z = 0; z <= 6; z++) for (let y = G; y <= TOP; y++) g.set(x, y, z, "air");
  // four faces: the arcade (plane on the outer ring, wall on the next)
  const faces = [
    Object.assign((u, d) => [x0 + u, d], { inward: "south" }), Object.assign((u, d) => [x0 + 6 - u, 6 - d], { inward: "north" }),
    Object.assign((u, d) => [x0 + d, 6 - u], { inward: "east" }), Object.assign((u, d) => [x0 + 6 - d, u], { inward: "west" }),
  ];
  for (const f of faces) arcade(g, f, 7, G, TOP - 1);
  for (let x = x0 + 1; x <= x0 + 5; x++) for (let z = 1; z <= 5; z++) if (x === x0 + 1 || x === x0 + 5 || z === 1 || z === 5) g.set(x, G, z, "stone_bricks");
  // floors: the core 3 x 3 at ground, walk and roof; a newel (x0+3, 3) all the way up
  for (let x = x0 + 2; x <= x0 + 4; x++) for (let z = 2; z <= 4; z++) { g.set(x, G, z, "spruce_planks"); g.set(x, WALK, z, "spruce_planks"); g.set(x, TOP, z, "spruce_planks"); }
  for (let y = G + 1; y < TOP; y++) g.set(x0 + 3, y, 3, "stripped_spruce_log[axis=y]");
  // the stair: round the newel from the door's side, 7 rises to the walk floor
  const ring = [[3, 4, "west"], [2, 4, "north"], [2, 3, "north"], [2, 2, "east"], [3, 2, "east"], [4, 2, "south"], [4, 3, "south"]];
  ring.forEach(([dx, z, f], k) => g.set(x0 + dx, G + 1 + k, z, `spruce_stairs[facing=${f},half=bottom,shape=straight,waterlogged=false]`));
  for (const [dx, z] of [[4, 2], [4, 3], [3, 2]]) g.set(x0 + dx, WALK, z, "air");                       // headroom through the walk floor
  g.set(x0 + 4, WALK, 3, `spruce_stairs[facing=south,half=bottom,shape=straight,waterlogged=false]`);
  // the town-side door (south), doors onto the walk on the east and west (z 2..3)
  for (const z of [5, 6]) { g.set(x0 + 3, G + 1, z, "air"); g.set(x0 + 3, G + 2, z, "air"); }
  g.set(x0 + 3, G + 1, 5, "spruce_door[facing=south,half=lower,hinge=left,open=false,powered=false]"); g.set(x0 + 3, G + 2, 5, "spruce_door[facing=south,half=upper,hinge=left,open=false,powered=false]");
  g.set(x0 + 3, G, 6, SLAB("top")); g.set(x0 + 3, G, 5, "stone_bricks");
  for (const x of corner ? [x0 + 5, x0 + 6] : [x0, x0 + 1, x0 + 5, x0 + 6]) for (const z of [2, 3]) { g.set(x, WALK, z, "spruce_planks"); g.set(x, WALK + 1, z, "air"); g.set(x, WALK + 2, z, "air"); }
  if (corner) for (const z of [5, 6]) for (const x of [x0 + 2, x0 + 3]) { g.set(x, WALK, z, "spruce_planks"); g.set(x, WALK + 1, z, "air"); g.set(x, WALK + 2, z, "air"); }
  // the top: corbels all round, merlons over them, a lamp on each corner, light inside
  for (let x = x0; x <= x0 + 6; x++) for (let z = 0; z <= 6; z++) {
    if (!(x === x0 || x === x0 + 6 || z === 0 || z === 6)) continue;
    const inward = z === 0 ? "south" : z === 6 ? "north" : x === x0 ? "east" : "west";
    g.set(x, TOP, z, ST(inward, "top"));                                                              // corbels under the parapet
    g.set(x, TOP + 1, z, (x + z) % 2 === 0 ? stoneAt(x, TOP + 1, z) : SLAB());
  }
  for (let x = x0 + 1; x <= x0 + 5; x++) for (let z = 1; z <= 5; z++) if (!(x >= x0 + 2 && x <= x0 + 4 && z >= 2 && z <= 4)) g.set(x, TOP, z, "spruce_planks");
  for (const [x, z] of [[x0, 0], [x0 + 6, 0], [x0, 6], [x0 + 6, 6]]) g.set(x, TOP + 2, z, LANTERN);
  for (const x of corner ? [x0 + 5] : [x0 + 1, x0 + 5]) g.set(x, WALK + 1, 4, LANTERN);              // lamps by the walk doors
  if (corner) g.set(x0 + 4, WALK + 1, 5, LANTERN);
  g.set(x0 + 2, G + 4, 3, "lantern[hanging=true,waterlogged=false]"); g.set(x0 + 4, WALK + 4, 4, HANG); g.set(x0 + 2, TOP + 1, 2, LANTERN);
}

export function towerPiece() { const g = new Grid([7, WALK + 8, 7]); tower(g, 0); return g; }
export function cornerPiece() { const g = new Grid([7, WALK + 8, 7]); tower(g, 0, { corner: true }); return g; }

/** The gatehouse: 11 long, a 3-wide passage through x 4..6 under an arch, flanking towers, the walk over the gate. */
export function gatehouse() {
  const g = new Grid([11, WALK + 8, 7]);
  // flanking blocks: x 0..3 and 7..10, as solid towers with stairs on the west one
  for (let x = 0; x <= 10; x++) curtainColumn(g, x);
  for (const x0 of [0, 7]) {
    for (let x = x0; x <= x0 + 3; x++) for (let z = 0; z <= 6; z++) for (let y = G; y <= WALK + 4; y++) g.set(x, y, z, stoneAt(x, y, z));
    arcade(g, Object.assign((u, d) => [x0 + u, d], { inward: "south" }), 4, G + 1, WALK + 3);
    arcade(g, Object.assign((u, d) => [x0 + 3 - u, 6 - d], { inward: "north" }), 4, G + 1, WALK + 3);
    for (let x = x0; x <= x0 + 3; x++) for (let z = 0; z <= 6; z++) if ((x + z) % 2 === 0 && (x === x0 || x === x0 + 3 || z === 0 || z === 6)) g.set(x, WALK + 5, z, SLAB());
    for (const [x, z] of [[x0, 0], [x0 + 3, 0], [x0, 6], [x0 + 3, 6]]) g.set(x, WALK + 5, z, LANTERN);
    g.set(x0 + 1, 7, 0, "iron_bars[east=true,north=false,south=false,waterlogged=false,west=true]");
  }
  // the passage: 3 wide, 4 high, paved, lit, an arch of stairs, a portcullis's teeth hung above the outer mouth
  for (let x = 4; x <= 6; x++) for (let z = 0; z <= 6; z++) { g.set(x, G, z, "cobblestone"); for (let y = G + 1; y <= G + 4; y++) g.set(x, y, z, "air"); }
  for (const z of [0, 6]) { g.set(4, G + 4, z, ST("east", "top")); g.set(6, G + 4, z, ST("west", "top")); g.set(5, G + 5, z, "chiseled_stone_bricks"); }
  for (let x = 4; x <= 6; x++) g.set(x, G + 4, 1, "iron_bars[east=true,north=false,south=false,waterlogged=false,west=true]");
  g.set(5, G + 4, 3, HANG);
  // stairs up inside the west block from a town-side door to the walk
  for (let x = 1; x <= 2; x++) for (let z = 1; z <= 5; z++) for (let y = G + 1; y <= WALK + 3; y++) g.set(x, y, z, "air");
  for (let x = 1; x <= 2; x++) for (let z = 1; z <= 5; z++) g.set(x, G, z, "spruce_planks");
  const run = [[1, 5], [1, 4], [1, 3], [1, 2], [1, 1], [2, 1], [2, 2]];
  run.forEach(([x, z], k) => g.set(x, G + 1 + k, z, `spruce_stairs[facing=${k < 4 ? "north" : k === 4 ? "east" : "south"},half=bottom,shape=straight,waterlogged=false]`));
  g.set(2, G + 1, 6, "spruce_door[facing=south,half=lower,hinge=left,open=false,powered=false]"); g.set(2, G + 2, 6, "spruce_door[facing=south,half=upper,hinge=left,open=false,powered=false]");
  for (const z of [2, 3]) { g.set(3, WALK + 1, z, "air"); g.set(3, WALK + 2, z, "air"); }
  g.set(2, G + 4, 4, HANG); g.set(2, WALK + 2, 3, "air");
  for (let x = 1; x <= 2; x++) for (let z = 1; z <= 4; z++) for (let y = WALK + 1; y <= WALK + 3; y++) g.set(x, y, z, "air");
  for (let x = 1; x <= 2; x++) for (const z of [1, 2, 3, 4, 5]) if (!(x === 2 && z <= 2)) g.set(x, WALK, z, "spruce_planks");
  g.set(1, WALK + 3, 3, HANG);
  return g;
}

export const PIECES = {
  curtain_4: () => curtain(4), curtain_8: () => curtain(8), filler_1: () => curtain(1, 1), filler_2: () => curtain(2), filler_3: () => curtain(3),
  tower_7x7: towerPiece, corner_7x7: cornerPiece, gatehouse_11x7: gatehouse,
};

/** A freestanding watchtower (hall:watchtower): the arcaded stone shaft of a wall tower, a newel stair in two flights
 *  (ground to a mid floor, mid floor to the lookout), and a timber lookout gallery with a rail under a hipped tile roof. */
export function watchtower() {
  const MID = G + 7, LOOK = MID + 7, g = new Grid([7, LOOK + 9, 7]);
  foundation(g, 0, 6, 0, 6);
  for (let x = 0; x <= 6; x++) for (let z = 0; z <= 6; z++) for (let y = G; y <= LOOK + 8; y++) g.set(x, y, z, "air");
  const faces = [
    Object.assign((u, d) => [u, d], { inward: "south" }), Object.assign((u, d) => [6 - u, 6 - d], { inward: "north" }),
    Object.assign((u, d) => [d, 6 - u], { inward: "east" }), Object.assign((u, d) => [6 - d, u], { inward: "west" }),
  ];
  for (const f of faces) arcade(g, f, 7, G, LOOK - 1);
  for (let x = 1; x <= 5; x++) for (let z = 1; z <= 5; z++) if (x === 1 || x === 5 || z === 1 || z === 5) g.set(x, G, z, "stone_bricks");
  for (let x = 2; x <= 4; x++) for (let z = 2; z <= 4; z++) for (const y of [G, MID, LOOK]) g.set(x, y, z, "spruce_planks");
  for (let y = G + 1; y < LOOK; y++) g.set(3, y, 3, "stripped_spruce_log[axis=y]");                       // the newel
  const ring = [[3, 4, "west"], [2, 4, "north"], [2, 3, "north"], [2, 2, "east"], [3, 2, "east"], [4, 2, "south"], [4, 3, "south"]];
  for (const base of [G, MID]) {
    ring.forEach(([x, z, f], k) => g.set(x, base + 1 + k, z, `spruce_stairs[facing=${f},half=bottom,shape=straight,waterlogged=false]`));
    for (const [x, z] of [[4, 2], [4, 3], [3, 2]]) g.set(x, base + 7, z, "air");
    g.set(4, base + 7, 3, "spruce_stairs[facing=south,half=bottom,shape=straight,waterlogged=false]");
  }
  // the door on the south side
  for (const z of [5, 6]) { g.set(3, G + 1, z, "air"); g.set(3, G + 2, z, "air"); }
  g.set(3, G + 1, 5, "spruce_door[facing=south,half=lower,hinge=left,open=false,powered=false]"); g.set(3, G + 2, 5, "spruce_door[facing=south,half=upper,hinge=left,open=false,powered=false]");
  g.set(3, G, 6, SLAB("bottom")); g.set(3, G + 3, 6, ST("north", "top"));
  // the lookout: the floor carried out to the full 7 x 7 on corbels, a rail, posts and a hipped tile roof
  for (let x = 0; x <= 6; x++) for (let z = 0; z <= 6; z++) {
    const edge = x === 0 || x === 6 || z === 0 || z === 6;
    if (!(x >= 2 && x <= 4 && z >= 2 && z <= 4)) g.set(x, LOOK, z, "spruce_planks");
    if (edge) { g.set(x, LOOK - 1, z, ST(z === 0 ? "south" : z === 6 ? "north" : x === 0 ? "east" : "west", "top")); g.set(x, LOOK + 1, z, "spruce_fence[east=true,north=true,south=true,waterlogged=false,west=true]"); }
  }
  for (const [x, z] of [[0, 0], [6, 0], [0, 6], [6, 6]]) for (let y = LOOK + 1; y <= LOOK + 3; y++) g.set(x, y, z, "dark_oak_log[axis=y]");
  for (let k = 0; k < 4; k++) {
    const lo = k, hi = 6 - k, y = LOOK + 4 + k;
    for (let x = lo; x <= hi; x++) { g.set(x, y, lo, `granite_stairs[facing=south,half=bottom,shape=straight,waterlogged=false]`); g.set(x, y, hi, `granite_stairs[facing=north,half=bottom,shape=straight,waterlogged=false]`); }
    for (let z = lo + 1; z < hi; z++) { g.set(lo, y, z, `granite_stairs[facing=east,half=bottom,shape=straight,waterlogged=false]`); g.set(hi, y, z, `granite_stairs[facing=west,half=bottom,shape=straight,waterlogged=false]`); }
    if (k === 0) for (let x = 1; x < 6; x++) for (let z = 1; z < 6; z++) g.set(x, y, z, "spruce_planks");
  }
  g.set(3, LOOK + 8, 3, "granite_slab[type=bottom,waterlogged=false]");
  // light: inside each flight, the mid floor, the lookout (a lamp on each corner post's foot and under the roof)
  g.set(2, G + 4, 3, HANG); g.set(4, MID + 4, 4, HANG);
  for (const [x, z] of [[1, 1], [5, 1], [1, 5], [5, 5]]) g.set(x, LOOK + 1, z, LANTERN);
  g.set(3, LOOK + 3, 1, HANG);
  return g;
}
