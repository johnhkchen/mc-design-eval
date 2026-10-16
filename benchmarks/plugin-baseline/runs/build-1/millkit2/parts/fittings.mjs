// Part: Windows, doors and porches: every opening in plan OPENINGS, shutters, porch posts and rails (porch_run), tapered
// posts, front steps, the porch sign and the porch lanterns. Builds only into air; the porch roofs belong to Roofs.
import { B, shutter } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import {
  window as win,
  porch_run,
  front_steps,
  shutter_pair,
  hanging_lantern,
} from "../vocab.mjs";

// A single door (both halves) facing out of its wall; skipped unless both cells are air.
function door(g, x, y, z, facing, wood, hinge = "left") {
  if (!g.isAir(x, y, z) || !g.isAir(x, y + 1, z)) return;
  g.set(x, y, z, ...B.door(wood, facing, "lower", hinge));
  g.set(x, y + 1, z, ...B.door(wood, facing, "upper", hinge));
}

// A double door at x, x+1 (hinges mirrored). No step slab: every porch deck already sits at y 2, so the door's
// threshold is the deck and a slab at the door's base would block the walk.
function double(g, x, y, z, facing, wood) {
  door(g, x, y, z, facing, wood, "left");
  door(g, x + 1, y, z, facing, wood, "right");
}

// A tapered porch post (vocab's tapered_post writes pillar ids that are off palette): brick base, brick wall, log cap.
function taperedPost(g, x, y, z) {
  if (g.isAir(x, y, z)) g.set(x, y, z, "bricks", {});
  if (g.isAir(x, y + 1, z)) g.set(x, y + 1, z, "brick_wall", { up: "true" });
  if (g.isAir(x, y + 2, z)) g.set(x, y + 2, z, "stripped_pale_oak_log", { axis: "y" });
}

// A porch sign on the deck: palette has only the standing spruce_sign (hanging_sign writes an off-palette hanging id), so it
// stands on the deck (y 2) just inside the street edge, facing north, clear of the door's walk. Writes only into air.
function porch_sign(g, text, x, y, z) {
  if (!g.isAir(x, y, z) || g.isAir(x, y - 1, z)) return;
  g.set(x, y, z, ...B.sign("spruce", String(text).split("\n"), { wall: false, rotation: 8, dataVersion: g.dataVersion }));
}

// A slatted vent: a closed trapdoor set in the gable cell (the wall plane itself). Open, it would float: the void behind it is not built wall.
function louvre(g, x, y, z, facing, wood) {
  if (!g.isAir(x, y, z)) return;
  g.set(x, y, z, ...B.trapdoor(wood, facing, "bottom", false));
}

export function build(g) {
  // ---- plot 0 dogtrot (x 1..10): front porch, two pens, back breezeway step ----
  porch_run(g, 1, 10, 7, [1, 5, 6, 10], "spruce_fence", "spruce_planks", 1, { post: "stripped_oak_log", gap: [5, 6] });
  front_steps(g, 5, 6, 1, 6);
  front_steps(g, 5, 6, 1, 16, { facing: "north" });
  win(g, 2, 4, 9, "north", 1, 2);
  win(g, 9, 4, 9, "north", 1, 2);
  shutter(g, [3, 4, 8], "north", "spruce", { height: 2 });
  shutter(g, [8, 4, 8], "north", "spruce", { height: 2 });
  win(g, 9, 4, 15, "south", 1, 2);
  door(g, 4, 3, 12, "east", "spruce");
  door(g, 7, 3, 12, "west", "spruce");
  win(g, 1, 9, 12, "west", 1, 1);
  win(g, 10, 9, 12, "east", 1, 1);
  hanging_lantern(g, 3, 5, 7);
  hanging_lantern(g, 8, 5, 7);

  // ---- plot 1 camelback (x 15..20): front double door, porch, side and hump windows ----
  porch_run(g, 15, 20, 7, [15, 20], "acacia_fence", "spruce_planks", 1, { post: "stripped_pale_oak_log", gap: [17, 18] });
  double(g, 17, 3, 9, "north", "acacia");
  front_steps(g, 17, 18, 1, 6);
  win(g, 16, 4, 9, "north", 1, 2);
  win(g, 19, 4, 9, "north", 1, 2);
  shutter(g, [15, 4, 8], "north", "mangrove", { height: 2 });
  shutter(g, [20, 4, 8], "north", "mangrove", { height: 2 });
  win(g, 17, 8, 9, "north", 2, 1); // gable vent
  win(g, 17, 10, 13, "north", 2, 1); // hump window over the front roof
  win(g, 15, 4, 11, "west", 1, 2);
  win(g, 15, 4, 16, "west", 1, 2);
  win(g, 20, 4, 11, "east", 1, 2);
  win(g, 20, 4, 16, "east", 1, 2);
  win(g, 15, 9, 16, "west", 1, 2);
  win(g, 20, 9, 14, "east", 1, 2);
  win(g, 20, 9, 16, "east", 1, 2);
  win(g, 17, 4, 17, "south", 2, 2);
  win(g, 17, 9, 17, "south", 2, 2);
  hanging_lantern(g, 16, 5, 7);
  hanging_lantern(g, 19, 5, 7);

  // ---- plot 2 I-house (x 25..34): two-storey porch, 3-bay front, end and back openings ----
  porch_run(g, 25, 34, 7, [25, 28, 31, 34], "pale_oak_fence", "spruce_planks", 2, { post: "stripped_pale_oak_log", gap: [29, 30] });
  double(g, 29, 3, 9, "north", "pale_oak");
  win(g, 29, 5, 9, "north", 2, 1); // transom
  double(g, 29, 8, 9, "north", "pale_oak"); // gallery doors
  front_steps(g, 29, 30, 1, 6);
  for (const y of [4, 9]) {
    for (const x of [27, 32]) {
      win(g, x, y, 9, "north", 1, 2);
      shutter_pair(g, x, y, 9, "north", "warped", { height: 2 });
    }
  }
  for (const x of [25, 34]) {
    const face = x === 25 ? "west" : "east";
    for (const y of [4, 9]) for (const z of [10, 14]) win(g, x, y, z, face, 1, 2);
  }
  door(g, 29, 3, 16, "south", "pale_oak");
  for (const y of [4, 9]) for (const x of [27, 32]) win(g, x, y, 16, "south", 1, 2);
  if (g.isAir(29, 2, 17)) g.set(29, 2, 17, ...B.slab("smooth_quartz", "top")); // back stoop
  hanging_lantern(g, 27, 6, 8);
  hanging_lantern(g, 32, 6, 8);

  // ---- plot 3 pyramid cottage (x 37..46): porch, double door, shuttered front, back door ----
  porch_run(g, 37, 46, 7, [37, 40, 43, 46], "dark_oak_fence", "spruce_planks", 1, { post: "stripped_dark_oak_log", gap: [41, 42] });
  double(g, 41, 3, 9, "north", "mangrove");
  front_steps(g, 41, 42, 1, 6);
  win(g, 39, 4, 9, "north", 1, 2);
  win(g, 44, 4, 9, "north", 1, 2);
  shutter_pair(g, 39, 4, 9, "north", "mangrove", { height: 2 });
  shutter_pair(g, 44, 4, 9, "north", "mangrove", { height: 2 });
  win(g, 37, 4, 11, "west", 1, 2);
  win(g, 37, 4, 15, "west", 1, 2);
  win(g, 46, 4, 11, "east", 1, 2);
  win(g, 46, 4, 15, "east", 1, 2);
  door(g, 41, 3, 17, "south", "mangrove");
  win(g, 39, 4, 17, "south", 1, 2);
  win(g, 44, 4, 17, "south", 1, 2);
  hanging_lantern(g, 39, 5, 7);
  hanging_lantern(g, 44, 5, 7);

  // ---- plot 4 boarding house (x 49..58): long porch, hanging sign, board-and-batten windows ----
  porch_run(g, 49, 58, 7, [49, 52, 55, 58], "spruce_fence", "spruce_planks", 1, { post: "stripped_oak_log", gap: [53, 54] });
  double(g, 53, 3, 9, "north", "spruce");
  front_steps(g, 53, 54, 1, 6);
  win(g, 50, 4, 9, "north", 2, 2);
  win(g, 56, 4, 9, "north", 2, 2);
  win(g, 50, 9, 9, "north", 2, 2);
  win(g, 53, 9, 9, "north", 2, 2);
  win(g, 56, 9, 9, "north", 2, 2);
  porch_sign(g, "BOARDING", 53, 3, 8);
  hanging_lantern(g, 51, 5, 7);
  hanging_lantern(g, 56, 5, 7);
  win(g, 49, 4, 15, "west", 1, 2);
  win(g, 49, 9, 15, "west", 1, 2);
  for (const z of [11, 14]) {
    win(g, 58, 4, z, "east", 1, 2);
    win(g, 58, 9, z, "east", 1, 2);
  }
  door(g, 56, 3, 16, "south", "spruce");
  door(g, 50, 3, 16, "south", "spruce");                  // kitchen yard door by the smoker: the west wing is a through route
  win(g, 51, 4, 16, "south", 1, 2);
  win(g, 53, 4, 16, "south", 1, 2);
  win(g, 51, 9, 16, "south", 1, 2);
  win(g, 56, 9, 16, "south", 1, 2);

  // ---- plot 5 work yard: smokehouse door and gable vent ----
  door(g, 63, 1, 12, "north", "spruce");
  louvre(g, 63, 6, 12, "south", "spruce");

  // ---- plot 7 bungalow (x 85..94): deep porch on tapered posts, brick steps, door, paired windows ----
  for (let x = 85; x <= 94; x++) {
    for (let z = 7; z <= 9; z++) if (g.isAir(x, 2, z)) g.set(x, 2, z, "spruce_planks", {});
    if (g.isAir(x, 6, 7)) g.set(x, 6, 7, "stripped_pale_oak_log", { axis: "x" });
  }
  for (const x of [85, 88, 91, 94]) taperedPost(g, x, 3, 7);
  front_steps(g, 88, 91, 1, 6, { material: "brick" });
  if (g.isAir(87, 1, 6)) g.set(87, 1, 6, "brick_wall", {});
  if (g.isAir(92, 1, 6)) g.set(92, 1, 6, "brick_wall", {});
  door(g, 89, 3, 10, "north", "spruce");
  win(g, 90, 3, 10, "north", 1, 2); // sidelight
  win(g, 86, 4, 10, "north", 2, 2);
  win(g, 92, 4, 10, "north", 2, 2);
  win(g, 85, 4, 15, "west", 2, 2);
  win(g, 94, 4, 15, "east", 2, 2);
  win(g, 94, 4, 12, "east", 1, 2);
  door(g, 88, 3, 17, "south", "spruce");
  win(g, 92, 4, 17, "south", 2, 2);
  louvre(g, 89, 8, 7, "south", "spruce");
  louvre(g, 90, 8, 7, "south", "spruce");
  hanging_lantern(g, 86, 5, 7);
  hanging_lantern(g, 93, 5, 7);
}
