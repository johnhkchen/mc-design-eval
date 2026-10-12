// Room: kitchen, inner air box [2,5,26,13,7,29] (plan.md ROOMS). Bright old-house kitchen at the back.
// Focal piece: the range (smoker) against the east party wall under a quartz hood, lit by a lantern on its top.
// Sink (water cauldron) under the back window; barrel counters with quartz tops along the back and east walls;
// pantry barrels on the west wall; a small spruce table with two stair chairs; hanging lanterns over table and sink.
// Keep clear: dining door (7,5..6,25), hall door (12,5..6,25), deck door (7,5..6,30) and the cells in front of them.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { hangLamp } from "../vocab.mjs";

// Add into air only: a cell an earlier part already owns is never overwritten.
const at = (g, x, y, z, block, state) => {
  if (["minecraft:air", "minecraft:cave_air"].includes(g.blockAt(x, y, z))) g.set(x, y, z, block, state);
};

// Barrel counter: a barrel on the floor with a quartz slab top (the slab top reads as the work surface).
const counter = (g, x, z) => {
  at(g, x, 5, z, "barrel", { facing: "up", open: "false" });
  at(g, x, 6, z, ...B.slab("smooth_quartz", "bottom"));
};

export function build(g) {
  // Range: smoker against the east party wall, facing into the room; lantern on its top; quartz hood above.
  at(g, 13, 5, 27, "smoker", { facing: "west", lit: "true" });
  at(g, 13, 6, 27, ...B.lantern(false));
  for (const x of [12, 13]) for (const z of [26, 27, 28]) at(g, x, 7, z, ...B.slab("smooth_quartz", "top"));

  // East counter beside the range.
  counter(g, 13, 28);
  counter(g, 13, 29);

  // Back counter under the window: sink (water cauldron) at (10,5,29) under the window at x10.
  for (const x of [8, 9, 11, 12]) counter(g, x, 29);
  at(g, 10, 5, 29, "water_cauldron", { level: "3" });

  // Pantry on the west party wall: barrel stack with a fern pot on top, and a short counter at the back-west.
  at(g, 2, 5, 26, "barrel", { facing: "up", open: "false" });
  at(g, 2, 5, 27, "barrel", { facing: "up", open: "false" });
  at(g, 2, 6, 27, "barrel", { facing: "up", open: "false" });
  at(g, 2, 7, 27, "potted_fern", {});
  counter(g, 2, 29);
  counter(g, 3, 29);

  // Small table: spruce fence post with a spruce top slab, two stair chairs (north and south of it). The table sits at
  // x5 so the cells west of it (x3..4) stay connected to the rest of the room.
  at(g, 5, 5, 27, ...B.fence("spruce"));
  at(g, 5, 6, 27, ...B.slab("spruce", "top"));
  at(g, 5, 5, 26, ...B.stairs("spruce", "north"));
  at(g, 5, 5, 28, ...B.stairs("spruce", "south"));

  // Hanging lanterns: over the table, mid-room (path), and over the sink.
  hangLamp(g, 5, 7, 27, { drop: 1 });
  hangLamp(g, 7, 7, 27, { drop: 1 });
  hangLamp(g, 10, 7, 27, { drop: 1 });
}
