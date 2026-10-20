// Openings and trim (plan.md OPENINGS, RESERVED): every glass_pane window, door, shutter, door hood, porch, colonnade,
// the arch heads over the hall's door and arcade, the belfry with its bells, the rose window and the barracks gallery
// floors. Writes only into air (the shells leave openings open); a cell an earlier part filled is refused and reported.
import { window, door, shutter, door_hood, porch_posts, colonnade, belfry, mission_parapet } from "../vocab.mjs";

const M = (n) => `minecraft:${n}`;

// a spruce floor cell; the shells part already lays the porch and gallery floors, so a cell it has is left as it is
const floor = (g, x, y, z) => { const c = g.get(x, y, z); if (!c || !/spruce_planks$/.test(c.block)) g.set(x, y, z, M("spruce_planks")); };

// a run of fence posts or rails; each one's connections follow its neighbours (two passes, so every cell sees the rest)
function fences(g, cells, wood) {
  const block = M(`${wood}_fence`);
  for (const [x, y, z] of cells) g.set(x, y, z, block, { north: "false", east: "false", south: "false", west: "false", waterlogged: "false" });
  const solid = (x, y, z) => { const c = g.get(x, y, z); return !!c && !/air$/.test(c.block); };
  for (const [x, y, z] of cells) g.set(x, y, z, block, {
    north: String(solid(x, y, z - 1)), south: String(solid(x, y, z + 1)),
    east: String(solid(x + 1, y, z)), west: String(solid(x - 1, y, z)), waterlogged: "false",
  });
}

// plot 0 front porch: spruce deck at y0 over the ground course, posts at x1 and x5, rail on x2 and x4 (x3 is the way in)
function porch0(g) {
  for (let x = 1; x <= 5; x++) for (let z = 6; z <= 7; z++) floor(g, x, 0, z);
  // a bottom brick slab at y3 over each porch lantern (x2, x4, z6): the lanterns hang from it. Not over the entrance column
  // (x3): a slab there walls off the way in
  for (const x of [2, 4]) g.set(x, 3, 6, "minecraft:brick_slab", { type: "bottom", waterlogged: "false" });
  fences(g, [[1, 1, 7], [1, 2, 7], [5, 1, 7], [5, 2, 7], [2, 1, 7], [4, 1, 7]], "birch");
}

// plot 0 family house: south door, windows on all four faces, gable windows (the chimney's hearth is the chimney part's)
function house0(g) {
  door(g, [3, 1, 5], "south", "birch");
  for (const [x, y] of [[2, 2], [4, 2], [2, 4], [4, 4]]) {
    window(g, [x, y, 5], "south");
    window(g, [x, y, 1], "north");
  }
  window(g, [3, 6, 5], "south");
  window(g, [3, 6, 1], "north");
  window(g, [1, 2, 3], "west");
  window(g, [1, 4, 3], "west");
  window(g, [5, 4, 2], "east");
}

// plot 1 duplex: two front doors under granite hoods, the Mission parapet on the bay, windows front, back and ends
function duplex(g) {
  door(g, [10, 1, 8], "south", "dark_oak");
  door(g, [15, 1, 8], "south", "dark_oak");
  door_hood(g, [10, 3, 9], "south");
  door_hood(g, [15, 3, 9], "south");
  mission_parapet(g, [11, 6, 9]);
  for (const y of [2, 4]) {
    window(g, [11, y, 9], "south");
    window(g, [14, y, 9], "south");
    for (const x of [10, 11, 14, 15]) window(g, [x, y, 1], "north");
  }
  window(g, [10, 4, 8], "south");
  window(g, [15, 4, 8], "south");
  for (const z of [3, 6]) for (const y of [2, 4]) {
    window(g, [9, y, z], "west");
    window(g, [16, y, z], "east");
  }
}

// plot 2 garage: double door on the south, side door on the east, one window each on the west and north
function garage(g) {
  door(g, [20, 1, 4], "south", "birch", { double: true });
  door(g, [22, 1, 2], "east", "birch");
  window(g, [19, 2, 2], "west");
  window(g, [21, 2, 1], "north");
}

// plot 3 shed: one door on the south, a window on each side
function shed(g) {
  door(g, [25, 1, 3], "south", "spruce");
  window(g, [27, 2, 1], "east");
  window(g, [24, 2, 1], "west");
}

// plot 4 barracks: ground and upper windows on the south under the gallery, double doors front and back, end windows,
// and the two-storey colonnade with its spruce floors (ground porch at y0, gallery at y3)
function barracks(g) {
  for (const x of [31, 33, 38, 40]) for (const y of [2, 4]) {
    window(g, [x, y, 9], "south");
    window(g, [x, y, 1], "north");
  }
  for (const x of [35, 36]) window(g, [x, 4, 1], "north");
  door(g, [35, 1, 9], "south", "spruce", { double: true });
  door(g, [35, 4, 9], "south", "spruce", { double: true });
  door(g, [35, 1, 1], "north", "spruce", { double: true });
  for (const z of [3, 5]) for (const y of [2, 4]) {
    window(g, [30, y, z], "west");
    window(g, [41, y, z], "east");
  }
  for (let x = 30; x <= 41; x++) for (let z = 10; z <= 12; z++) {
    floor(g, x, 0, z);
    floor(g, x, 3, z);
  }
  colonnade(g, { xs: [30, 32, 34, 37, 39, 41], z: 12, y0: 1, y1: 5, floorY: 3 });
}

// upside-down stairs as arch heads, facing outward (the same stairs vocab's arch() writes; its jambs are the shell's piers)
function archHeads(g, xs, y, z, face) {
  for (const x of xs) g.set(x, y, z, M("smooth_sandstone_stairs"), { facing: face, half: "top", shape: "straight" });
}

// plot 5 hall: the arched double door with its heads, the arcade's three arch heads, tall front and back windows,
// the rose window (2 x 2 orange pane), aisle and clerestory windows, and the belfry with two bells
function hall(g) {
  door(g, [53, 1, 16], "south", "dark_oak", { double: true });
  archHeads(g, [53, 54], 3, 16, "south");
  archHeads(g, [50, 51, 53, 54, 56, 57], 3, 18, "south");
  for (const y of [2, 3]) {
    window(g, [48, y, 16], "south");
    window(g, [59, y, 16], "south");
    window(g, [50, y, 1], "north");
    window(g, [57, y, 1], "north");
  }
  door(g, [53, 1, 1], "north", "dark_oak", { double: true });
  for (const x of [53, 54]) for (const y of [6, 7]) {
    g.set(x, y, 16, M("orange_stained_glass_pane"), { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
  }
  for (const z of [5, 8, 11]) {
    for (const y of [1, 2]) {
      window(g, [45, y, z], "west");
      window(g, [62, y, z], "east");
    }
    window(g, [47, 5, z], "west");
    window(g, [60, 5, z], "east");
  }
  belfry(g, [52, 8, 16], { face: "south" });
}

// plot 6 officers' house: front and back doors, window pairs on the front, back and sides, the porch columns,
// green shutters flat on the wall beside the front and back windows, and the dormer windows
function officers(g) {
  for (let x = 66; x <= 73; x++) for (let z = 8; z <= 10; z++) floor(g, x, 0, z);
  porch_posts(g, { xs: [66, 68, 71, 73], z: 10, y0: 1, y1: 2, block: "quartz_pillar" });
  door(g, [69, 1, 7], "south", "dark_oak", { double: true });
  door(g, [70, 1, 1], "north", "dark_oak");
  for (const y of [2, 4]) {
    for (const x of [67, 72]) {
      window(g, [x, y, 7], "south");
      window(g, [x, y, 1], "north");
    }
    window(g, [69, y, 7], "south");
    window(g, [70, y, 7], "south");
    for (const z of [2, 6]) {
      window(g, [66, y, z], "west");
      window(g, [73, y, z], "east");
    }
    for (const x of [66, 68, 71, 73]) {
      shutter(g, [x, y, 8], "south", "warped");
      shutter(g, [x, y, 0], "north", "warped");
    }
  }
  window(g, [67, 7, 6], "south");
  window(g, [72, 7, 6], "south");
}

export function build(g) {
  porch0(g);
  house0(g);
  duplex(g);
  garage(g);
  shed(g);
  barracks(g);
  hall(g);
  officers(g);
}
