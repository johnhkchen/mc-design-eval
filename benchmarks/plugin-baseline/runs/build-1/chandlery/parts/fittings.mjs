// Openings and fittings (plan.md OPENINGS, FACADES, elements.md): the shop bay with its candle shelf, the four doors with
// their steps, the family door hood, the transom and every glazed window, the upper shutters, the window boxes, the
// fascia sign, the hanging sign on its fence arm, and the lantern by the family door. Every write goes only into air:
// the shell and the frame leave these openings open, and a cell an earlier part filled is skipped.
import { bayWindow, doorPair, windowBox, shutterPair, candleCluster } from "../vocab.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// one cell, into air only; nbt (block-entity data, sign text) is passed through when given
function put(g, x, y, z, block, state = {}, nbt) {
  if (!g.isAir(x, y, z)) return;
  if (nbt) g.set(x, y, z, block, state, nbt);
  else g.set(x, y, z, block, state);
}

// a glass pane: plane "z" is a wall in the z plane (north/south face, runs east-west); plane "x" runs north-south
function pane(g, x, y, z, plane) {
  const run = plane === "z"
    ? { north: "false", south: "false", east: "true", west: "true" }
    : { north: "true", south: "true", east: "false", west: "false" };
  put(g, x, y, z, "glass_pane", { ...run, waterlogged: "false" });
}

// glazing for a rectangle of cells on a z-plane wall (x0..x1, y0..y1 at z) or an x-plane wall (z0..z1 at x)
function glazeZ(g, x0, x1, y0, y1, z) {
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) pane(g, x, y, z, "z");
}
function glazeX(g, x, z0, z1, y0, y1) {
  for (let z = z0; z <= z1; z++) for (let y = y0; y <= y1; y++) pane(g, x, y, z, "x");
}

export function build(g) {
  // the shop bay: brick sill at y=1, dark oak posts, glass (connected east-west), fascia at y=5 (plan FACADES)
  bayWindow(g, 9, 13, 1, 7);
  // the bay's candle shelf: a top dark oak slab at y=2 behind the glass, candles standing on it
  for (const x of [10, 11, 12]) put(g, x, 2, 8, "dark_oak_slab", { type: "top", waterlogged: "false" });
  candleCluster(g, 10, 3, 8, "yellow_candle", 3);
  candleCluster(g, 12, 3, 8, "white_candle", 2);

  // doors, both halves each, with their steps: shop and family on the street, back into the lean-to, workshop side
  doorPair(g, 7, 2, 8, "north", "left", "dark_oak");
  doorPair(g, 15, 2, 8, "north", "left", "dark_oak");
  doorPair(g, 16, 2, 17, "south", "left", "dark_oak");
  doorPair(g, 13, 2, 21, "east", "left", "spruce");

  // transom over the shop door, and the stone hood over the family door (its brick at (15,4,8) is the shell's)
  pane(g, 7, 4, 8, "z");
  put(g, 15, 4, 7, "stone_brick_slab", { type: "top", waterlogged: "false" });

  // lantern hung from the jetty sill beam beside the family door
  put(g, 16, 5, 7, "lantern", { hanging: "true", waterlogged: "false" });

  // glazing, every window the plan's OPENINGS table names (upper front windows over the bay first)
  glazeZ(g, 9, 10, 8, 9, 7);
  glazeZ(g, 12, 13, 8, 9, 7);
  glazeZ(g, 15, 16, 8, 9, 17);          // main back window, above the lean-to
  glazeZ(g, 6, 6, 3, 4, 27);            // workshop south gable windows
  glazeZ(g, 12, 12, 3, 4, 27);
  glazeX(g, 17, 8, 9, 8, 9);            // east upper windows
  glazeX(g, 17, 14, 15, 8, 9);
  glazeX(g, 17, 14, 15, 3, 4);          // east ground window, the kitchen
  pane(g, 17, 12, 14, "x");             // east gable window
  glazeX(g, 5, 11, 13, 2, 4);           // west shop window (three wide)
  glazeX(g, 5, 8, 9, 8, 9);             // west upper windows
  glazeX(g, 5, 14, 15, 8, 9);
  pane(g, 5, 12, 14, "x");              // west gable window
  glazeX(g, 5, 20, 21, 2, 4);           // workshop west windows
  glazeX(g, 5, 24, 25, 2, 4);
  glazeX(g, 13, 24, 25, 2, 4);          // workshop east window

  // shutters flanking the upper side windows, set one cell out from the wall at the window's edges (the frame's posts
  // fill the wall-plane flanks); open, lying flat to the wall's face
  shutterPair(g, 18, 8, 8, "east", { width: 2 });
  shutterPair(g, 18, 8, 14, "east", { width: 2 });
  shutterPair(g, 4, 8, 8, "west", { width: 2 });
  shutterPair(g, 4, 8, 14, "west", { width: 2 });

  // window boxes on the front upper windows' sills (dark oak slab tops, pots above)
  windowBox(g, 9, 10, 7, 6);
  windowBox(g, 12, 13, 7, 6);

  // the fascia sign over the bay: a dark oak wall sign on the fascia at (11,5,7), reading out to the street
  const [signBlock, signState, signNbt] = B.sign("dark_oak", ["CHANDLER"], { wall: true, facing: "north", dataVersion: g.dataVersion });
  put(g, 11, 5, 6, signBlock, signState, signNbt);

  // the hanging sign on its arm: two dark oak fences out of the jetty corner, the sign hung under the arm end, a lit
  // candle cluster on top of the arm
  put(g, 5, 6, 6, "dark_oak_fence", { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
  put(g, 5, 6, 5, "dark_oak_fence", { north: "false", south: "true", east: "false", west: "false", waterlogged: "false" });
  const [hangBlock, hangState, hangNbt] = B.sign("dark_oak", ["CANDLES"], { wall: false, hanging: true, rotation: 8, dataVersion: g.dataVersion });
  put(g, 5, 5, 5, hangBlock, { ...hangState, attached: "true" }, hangNbt);
  candleCluster(g, 5, 7, 5, "candle", 3);
}
