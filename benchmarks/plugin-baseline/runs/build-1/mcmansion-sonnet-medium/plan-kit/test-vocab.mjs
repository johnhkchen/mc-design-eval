// Calls every vocab helper once on the full site grid (the helpers use absolute site coordinates) and checks cells.
import * as V from "./vocab.mjs";

const g = new V.Grid(V.SITE_SIZE, { dataVersion: V.DATA_VERSION });
g.fill([0, 0, 0], [43, 0, 31], V.GRASS);
const name = (x, y, z) => g.blockAt(x, y, z).replace("minecraft:", "");
const state = (x, y, z) => g.get(x, y, z)?.state ?? {};

let failed = 0;
const check = (label, ok) => { if (!ok) failed++; console.log(`${ok ? "ok  " : "FAIL"} ${label}`); };
const expect = (label, x, y, z, block, extra = {}) => {
  const got = name(x, y, z);
  const st = state(x, y, z);
  const stateOk = Object.entries(extra).every(([k, v]) => st[k] === v);
  check(`${label} (${x},${y},${z}) = ${block}${Object.keys(extra).length ? " " + JSON.stringify(extra) : ""}`
    + (got === block && stateOk ? "" : `  got ${got} ${JSON.stringify(st)}`), got === block && stateOk);
};

// wallBlock is pure
const veneer = new Set(V.VENEER_MIX.map((v) => v[0]));
const wb = (face, x, y, z) => V.wallBlock(face, x, y, z)[0];
check("wallBlock: plinth stone_bricks at y0", wb("north", 20, 0, 11) === "stone_bricks");
check("wallBlock: belt smooth_quartz at y5", wb("east", 35, 5, 15) === "smooth_quartz");
check("wallBlock: veneer on the north plane y2", veneer.has(wb("north", 20, 2, 11)));
check("wallBlock: siding on a side plane y2", wb("east", 35, 2, 15) === "birch_planks");

V.carriageDoor(g, 3);
V.carriageDoor(g, 8);
V.carriageDoor(g, 13);
V.lampPost(g, 7, 6);
V.lampPost(g, 12, 6);
V.quoins(g);
V.shutterCells(g);
expect("quoins: corner column", 18, 5, 11, "quartz_block");
expect("quoins: neighbour even y", 41, 6, 24, "quartz_block");
expect("quoins: neighbour odd y", 41, 7, 24, "birch_planks");
expect("shutters: strip west of office", 19, 2, 11, "black_concrete");
expect("shutters: strip east of office", 22, 4, 11, "black_concrete");
expect("shutters: none above window", 19, 5, 11, "air");

// archWindow: a 2-wide window at x20..21 y2..4 on z=11
V.archWindow(g, 20, 21, 2, 4, 11, "north");
expect("archWindow: glass body", 20, 3, 11, "glass_pane");
expect("archWindow: west springer", 20, 4, 11, "quartz_stairs", { facing: "west", half: "top" });
expect("archWindow: east springer", 21, 4, 11, "quartz_stairs", { facing: "east", half: "top" });
expect("archWindow: sill on outside plane", 20, 1, 10, "quartz_slab", { type: "top" });
expect("archWindow: hood on outside plane", 21, 5, 10, "quartz_slab", { type: "bottom" });

// archWindow: one wide puts a slab at the top
V.archWindow(g, 40, 40, 2, 4, 8, "north");
expect("archWindow 1-wide: top slab", 40, 4, 8, "quartz_slab", { type: "top" });

// archOpening on a west-face window (turret) and an east-face window (wing)
V.archOpening(g, V.OPENINGS.find((o) => o.name === "turret west low"));
expect("archOpening west: glass", 38, 3, 10, "glass_pane");
expect("archOpening west: sill on x=37", 37, 1, 10, "quartz_slab", { type: "top" });
V.archOpening(g, V.OPENINGS.find((o) => o.name === "family east low"));
expect("archOpening east: glass", 42, 3, 15, "glass_pane");
expect("archOpening east: hood on x=43", 43, 5, 15, "quartz_slab", { type: "bottom" });

// entryDoor and the palladian above it
const entry = V.OPENINGS.find((o) => o.name === "entry");
V.entryDoor(g, entry);
expect("entryDoor: left leaf lower", 26, 1, 11, "dark_oak_door", { half: "lower", facing: "north", hinge: "left" });
expect("entryDoor: right leaf upper", 27, 2, 11, "dark_oak_door", { half: "upper", facing: "north", hinge: "right" });
expect("entryDoor: west springer", 25, 4, 11, "quartz_stairs", { facing: "west" });
expect("entryDoor: east springer", 28, 4, 11, "quartz_stairs", { facing: "east" });
expect("entryDoor: sidelight", 25, 2, 11, "glass_pane");
V.archOpening(g, V.OPENINGS.find((o) => o.name === "palladian front"));
expect("palladian: glass", 26, 7, 11, "glass_pane");

// carriage door bay 1 (x0 = 3)
expect("carriageDoor: panel", 4, 1, 7, "white_concrete");
expect("carriageDoor: bracing trapdoor", 4, 1, 6, "dark_oak_trapdoor", { open: "true", facing: "north" });
expect("carriageDoor: glass band", 4, 3, 7, "glass_pane");
expect("carriageDoor: hood", 3, 4, 6, "quartz_slab", { type: "bottom" });
expect("lampPost: pier", 7, 2, 6, "blackstone_wall");
expect("lampPost: lantern", 7, 4, 6, "lantern");

// portico and column
V.portico(g);
V.column(g, 23, 7);
expect("column: base slab", 23, 1, 7, "quartz_slab", { type: "bottom" });
expect("column: shaft", 23, 5, 7, "quartz_pillar", { axis: "y" });
expect("column: capital", 23, 8, 7, "chiseled_quartz_block");
expect("portico: floor", 22, 0, 7, "stone_bricks");
expect("portico: inlay", 26, 0, 8, "smooth_quartz");
expect("portico: entablature", 26, 9, 7, "quartz_block");
expect("portico: hanging lantern", 26, 8, 8, "lantern", { hanging: "true" });
expect("portico: landing", 24, 1, 6, "stone_brick_slab", { type: "bottom" });

// shrub and young tree
V.shrub(g, 20, 10, { flower: true });
expect("shrub: leaves", 20, 1, 10, "azalea_leaves", { persistent: "true" });
expect("shrub: flowering crown", 21, 2, 10, "flowering_azalea_leaves");
expect("shrub: mulch", 19, 0, 9, "coarse_dirt");
V.youngTree(g);
expect("youngTree: trunk", 36, 1, 5, "oak_log", { axis: "y" });
expect("youngTree: crown", 36, 7, 5, "oak_leaves", { persistent: "true" });
expect("youngTree: stake", 35, 1, 5, "oak_fence");

// deck
V.deck(g);
expect("deck: planks", 20, 1, 27, "spruce_planks");
expect("deck: post", 19, 2, 26, "spruce_log", { axis: "y" });
expect("deck: railing", 20, 2, 31, "spruce_fence");
expect("deck: door step", 26, 1, 26, "spruce_stairs", { facing: "south" });
expect("deck: grill", 31, 2, 28, "cauldron");
expect("deck: AC bars", 36, 1, 26, "iron_bars");
expect("deck: back shrub", 3, 1, 25, "azalea_leaves");

// chimney
V.chimney(g);
expect("chimney: shaft", 40, 8, 26, "stone_bricks");
expect("chimney: andesite course", 40, 6, 26, "andesite");
expect("chimney: cap slab", 40, 14, 26, "stone_brick_slab", { type: "top" });
expect("chimney: pot", 39, 14, 25, "stone_brick_wall");

// roofs (chimney runs last inside roofSpec; the vent is placed after the entry gable)
let roofsOk = true;
try { V.roofSpec(g); } catch (e) { roofsOk = false; console.log(e.stack); }
check("roofSpec: runs without throwing", roofsOk);
expect("roofSpec: entry gable vent", 26, 11, 7, "glass_pane");
let roofCells = 0;
for (let y = 10; y <= 14; y++) for (let x = 17; x <= 43; x++) for (let z = 6; z <= 26; z++) if (name(x, y, z) !== "air") roofCells++;
check(`roofSpec: roof cells placed (${roofCells})`, roofCells > 300);

console.log(failed ? `${failed} check(s) failed` : "all vocab checks passed");
process.exit(failed ? 1 : 0);
