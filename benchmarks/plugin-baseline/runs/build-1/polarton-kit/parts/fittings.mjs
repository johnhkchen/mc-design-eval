// Part: openings and ways in (P4): glass, doors, shutters, vents and louvres, the wagon and hay doors, the hoist beam,
// lancets, porches, the balcony, and the slab ramps with their landings. Each plot's openings are cut by the vocab
// helpers where they cover the element; the rest (single doors, panes, ramps, the granary dock) are written here.
// Writes go into air only (the shell leaves every opening empty), so a refused cell is a shell or roof conflict.
import { B, shutter } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import {
  doorPair, hoistBeam, lancet, louvre, porchDeep, porchWrap, balcony,
} from "../vocab.mjs";

// Glass panes in one wall plane. Every pane joins its neighbours and the wall beside the window, so each run reads as a
// window: `along` is the axis the wall runs along ("x" for a north or south wall, "z" for an east or west wall).
function win(g, xs, ys, zs, along = "x") {
  const [ka, kb] = along === "x" ? ["east", "west"] : ["south", "north"];
  for (const x of xs) for (const y of ys) for (const z of zs) {
    const st = { north: "false", east: "false", south: "false", west: "false" };
    st[ka] = "true";
    st[kb] = "true";
    g.set(x, y, z, "minecraft:glass_pane", st);
  }
}

// Folded board leaves: open trapdoors in the column x, y0..y1, one cell in front of the wall (z) and lying flat on it.
// The shell owns the wall plane there (jambs, boards, plinth), so the leaves stand clear of it.
function leaf(g, x, y0, y1, z, facing) {
  for (let y = y0; y <= y1; y++) g.set(x, y, z, ...B.trapdoor("spruce", facing, "bottom", true));
}

// One single door, both halves, hinge as given, the same facing on both.
function door(g, x, y, z, facing, mat, hinge = "left") {
  g.set(x, y, z, ...B.door(mat, facing, "lower", hinge));
  g.set(x, y + 1, z, ...B.door(mat, facing, "upper", hinge));
}

// A double door, no transom: two leaves side by side along the wall (x for north/south, z for east/west).
function doorDouble(g, x, y, z, facing, mat, along = "x") {
  const [dx, dz] = along === "x" ? [1, 0] : [0, 1];
  door(g, x, y, z, facing, mat, "left");
  door(g, x + dx, y, z + dz, facing, mat, "right");
}

// The way in: bottom slabs on the ramp row (z), width cells along the front, then the full-block landing (z+1..z+2).
// A porch deck that already serves as the landing is passed as landing: null.
function ramp(g, x0, width, z, slab, landing) {
  for (let i = 0; i < width; i++) g.set(x0 + i, 1, z, ...B.slab(slab, "bottom"));
  if (!landing) return;
  for (let i = 0; i < width; i++) for (const dz of [1, 2]) g.set(x0 + i, 1, z + dz, `minecraft:${landing}`, {});
}

export function build(g) {
  // ---- Plot 0: cotton gin (front north, wagon bay and loft at z9) ----
  // Wagon bay: the shell cut the 4-wide clear door (x 4..7, y 1..4) and built its jambs and birch lintel course (y 5).
  // The folded board leaves stand in front of the wall (z 8). The hay door (x 5..6, y 7..8) gets its leaves the same way.
  for (const x of [2, 3, 8, 9]) leaf(g, x, 1, 4, 8, "north");
  for (const x of [4, 7]) leaf(g, x, 7, 8, 8, "north");
  hoistBeam(g, 6, 10, 7, { len: 3 });
  louvre(g, 5, 12, 9, "north", 2);
  // Side windows (x 1 and x 10) and the back of the gin.
  win(g, [1], [2, 3], [11], "z");
  win(g, [10], [2, 3], [11], "z");
  win(g, [1, 10], [8], [11, 14], "z");
  doorPair(g, 5, 1, 16, "south", "spruce_door");
  win(g, [3, 8], [2, 3], [16], "x");

  // ---- Plot 1: schoolhouse (front north) ----
  doorPair(g, 17, 2, 9, "north", "mangrove_door");
  win(g, [15, 20], [3, 4], [10], "z");
  win(g, [17, 18], [9, 10], [12], "x");
  win(g, [13, 22], [3, 4, 5], [13, 15], "z");
  // Outer shutters only: z 12 and z 16 beside the two tall windows on each side; the wall between stays plain.
  for (const [x, face] of [[12, "west"], [23, "east"]]) {
    shutter(g, [x, 3, 12], face, "spruce", { height: 3 });
    shutter(g, [x, 3, 16], face, "spruce", { height: 3 });
  }
  win(g, [17, 18], [5], [17], "x");
  ramp(g, 17, 2, 6, "stone_brick", "stone_bricks");

  // ---- Plot 2: hill farmhouse (front north, body z 10, deep porch z 7..9) ----
  door(g, 29, 2, 10, "north", "dark_oak", "left");
  win(g, [30], [2, 3], [10], "x");
  win(g, [26, 27, 32, 33], [3, 4], [10], "x");
  for (const x of [25, 28, 31, 34]) shutter(g, [x, 3, 9], "north", "mangrove", { height: 2 });
  // The loft window is not cut: the shell closed the gable there (spruce_planks at y 8..9), and earlier parts are locked.
  win(g, [25, 34], [3, 4], [12], "z");
  porchDeep(g, 25, 1, 9, "north", { width: 10, depth: 3 });
  // Kitchen: the body to ell door in the back wall, the ell's west door, the ell's back window and the back gable vent.
  door(g, 31, 2, 14, "south", "dark_oak", "left");
  door(g, 26, 2, 16, "west", "dark_oak", "left");
  win(g, [29, 30], [3, 4], [17], "x");
  louvre(g, 29, 11, 14, "south", 2);
  ramp(g, 29, 2, 6, "mangrove", null);

  // ---- Plot 3: blacksmith (open forge front, shuttered west opening) ----
  shutter(g, [36, 2, 11], "west", "spruce", { height: 2 });
  shutter(g, [36, 2, 13], "west", "spruce", { height: 2 });

  // ---- Plot 4: church (front north, nave z 9..17) ----
  doorPair(g, 52, 2, 9, "north", "spruce_door");
  // The lintel stairs over the door (y 5, x 51..54) are the shell's already (quartz_stairs), so nothing is written there.
  win(g, [52, 53], [11, 12], [9], "x");
  for (const z of [11, 13, 15]) {
    lancet(g, 49, z, 3, 6, { into: "east", material: "stone_brick" });
    lancet(g, 56, z, 3, 6, { into: "west", material: "stone_brick" });
    // The sill is a top slab: a bottom slab would leave the glass floating half a block over air.
    g.set(49, 3, z, ...B.slab("stone_brick", "top"));
    g.set(56, 3, z, ...B.slab("stone_brick", "top"));
  }
  // The altar window (x 52..53, y 9..10, z 17) is not cut: the shell's back wall is closed there.
  // The belfry's four faces stay open (the belfry is the tower's, P2). Louvres there would be open trapdoors with the bell
  // stage's air behind them, so none are hung.
  ramp(g, 52, 3, 6, "stone_brick", "stone_bricks");

  // ---- Plot 5: tobacco barn (front north, tall boards) ----
  door(g, 65, 1, 9, "north", "spruce", "left");
  door(g, 66, 1, 9, "north", "spruce", "right");
  // The door's lintel (y 4) is the shell's stripped_dark_oak_log already: no spruce lintel is laid over it.
  louvre(g, 65, 12, 9, "north", 2);
  louvre(g, 65, 12, 15, "south", 2);
  // Vent slots: the wall columns y 3..9 are open gaps (dark, the leaves seen through them). An open trapdoor in the wall
  // plane would have air behind it, so each tier pole runs through the slot to the wall at both ends instead.
  for (const z of [10, 12, 14]) for (const y of [5, 7, 9]) {
    for (const x of [63, 68]) g.set(x, y, z, "minecraft:stripped_spruce_log", { axis: "x" });
  }
  // the ladder (64, 1..9, 14) hangs on the west wall at z 14, so that slot is boarded where the ladder's back is open
  for (const y of [3, 4, 6, 8]) g.set(63, y, 14, "minecraft:stripped_dark_oak_log", { axis: "y" });

  // ---- Plot 6: corn crib and granary (front north) ----
  // The crib hatch (74, 3..4, 9) is left open by the shell. The bin floor is two above the yard, so a landing of planks
  // runs from the granary dock (x 77) west to x 74 at y 1 (stand y 2); the ladder (hearths part) climbs from (74, 2, 8).
  for (let x = 74; x <= 76; x++) for (let z = 7; z <= 8; z++) g.set(x, 1, z, "minecraft:spruce_planks", {});
  // Granary: double doors at ground, a side window, the raised dock with its rail. The loft door (x 79..80, y 7..8) is
  // not cut: the shell's stripped_oak_log jamb and gable post occupy those cells.
  doorDouble(g, 78, 2, 9, "north", "oak", "x");
  win(g, [82], [3, 4], [12], "z");
  ramp(g, 77, 2, 6, "spruce", null);
  for (let x = 77; x <= 80; x++) for (let z = 7; z <= 8; z++) g.set(x, 1, z, "minecraft:spruce_planks", {});
  for (const z of [7, 8]) g.set(80, 2, z, "minecraft:spruce_fence", { north: "false", east: "false", south: "false", west: "false", waterlogged: "false" });

  // ---- Plot 7: owner's house (front north, wraparound porch, rear balcony) ----
  doorPair(g, 89, 2, 9, "north", "dark_oak_door");
  win(g, [90, 91], [8, 9], [9], "x");
  // The bay glazing (x 86..87, z 8) is the shell's glass_pane already: nothing is laid over it.
  porchWrap(g, { x0: 85, x1: 94, z0: 7, z1: 15, y: 1, gap: [89, 90] });
  win(g, [92], [3, 4, 8, 9], [11, 13], "z");
  win(g, [85], [3, 4, 8, 9], [12], "z");
  win(g, [88], [3, 4], [15], "x");
  doorDouble(g, 86, 7, 15, "south", "dark_oak", "x");
  balcony(g, 85, 6, 16);
  ramp(g, 89, 2, 6, "mangrove", null);
}
