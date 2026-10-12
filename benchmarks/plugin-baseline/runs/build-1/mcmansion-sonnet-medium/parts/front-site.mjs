// Front site (P5): street, curb and sidewalk; the driveway with its joints; the lawn with short grass; the front walk and its
// edging; foundation shrub beds, the turret shrub and the flower strip; two lamp posts; the mailbox; the young tree.
// Plan: "OUTDOOR ROOMS" and "SITE"; elements 17-20 and 31-33. Ground and street cells stay writable (the grass base is ours).
// Writes into cells an earlier part owns are skipped here, so runParts never counts them as REFUSED.
import { B, MULCH, LEAVES, FLOWER_LEAVES, lampPost, youngTree } from "../vocab.mjs";

// Footprints the earlier parts build (plan.md "SITE" and "RESERVED"): portico (P4), main block (P1), east wing and turret
// (P1), garage wing (P2), and the entry landing slab at y=1 (P4).
const OWNED = [
  { x0: 22, x1: 31, z0: 7, z1: 10, y0: 0, y1: 9 },
  { x0: 18, x1: 35, z0: 11, z1: 25, y0: 0, y1: 9 },
  { x0: 35, x1: 42, z0: 12, z1: 24, y0: 0, y1: 9 },
  { x0: 38, x1: 42, z0: 8, z1: 12, y0: 0, y1: 9 },
  { x0: 1, x1: 17, z0: 7, z1: 24, y0: 0, y1: 9 },
  { x0: 24, x1: 29, z0: 6, z1: 6, y0: 1, y1: 1 },
];
const owned = (x, y, z) => OWNED.some((o) => x >= o.x0 && x <= o.x1 && z >= o.z0 && z <= o.z1 && y >= o.y0 && y <= o.y1);
const put = (g, x, y, z, ...pair) => { if (!owned(x, y, z)) g.set(x, y, z, ...pair); };
const persistent = { persistent: "true" };

// The front walk and its edging, the lawn and the flower strip (plan OUTDOOR ROOMS).
const WALK = { x0: 26, x1: 27, z0: 3, z1: 6 };
const inWalk = (x, z) => x >= WALK.x0 && x <= WALK.x1 && z >= WALK.z0 && z <= WALK.z1;
const FLOWER_ROW = { z: 5, spans: [[19, 23], [30, 34]] };
const TREE = { x0: 34, x1: 38, z0: 3, z1: 7 };
const hash = (x, z) => ((x * 73856093) ^ (z * 83492791)) >>> 0;

function street(g) {
  for (let x = 0; x <= 43; x++) {
    put(g, x, 0, 0, "gray_concrete");
    put(g, x, 0, 1, "polished_andesite");
    put(g, x, 0, 2, "smooth_stone");
  }
}

function driveway(g) {
  for (let x = 2; x <= 17; x++) for (let z = 2; z <= 6; z++) put(g, x, 0, z, "light_gray_concrete");
  for (let x = 2; x <= 17; x++) put(g, x, 0, 4, "stone");
  for (let z = 2; z <= 6; z++) put(g, 9, 0, z, "stone");
}

function lawn(g) {
  for (let x = 18; x <= 43; x++) for (let z = 3; z <= 6; z++) put(g, x, 0, z, "grass_block");
  for (let x = 36; x <= 43; x++) put(g, x, 0, 7, "grass_block");
  // one blade in twelve, never on the walk or in the tree's footprint (set first; later pieces overwrite their own cells)
  for (let x = 18; x <= 43; x++) for (let z = 3; z <= 7; z++) {
    if (inWalk(x, z) || (z === 7 && x < 36)) continue;
    if (x >= TREE.x0 && x <= TREE.x1 && z >= TREE.z0 && z <= TREE.z1) continue;
    if (hash(x, z) % 12 === 0) put(g, x, 1, z, "short_grass");
  }
}

function walk(g) {
  for (let x = WALK.x0; x <= WALK.x1; x++) for (let z = WALK.z0; z <= WALK.z1; z++) put(g, x, 0, z, "stone_bricks");
  // edging slabs at x25 and x28, every other cell (z3 and z5), so z=6 stays clear of the entry landing
  for (const x of [25, 28]) for (const z of [3, 5]) put(g, x, 1, z, ...B.slab("stone_brick", "bottom"));
}

function flowerStrip(g) {
  const cycle = ["poppy", "allium", "peony", "rose_bush"];
  for (const [a, b] of FLOWER_ROW.spans) for (let x = a; x <= b; x++) {
    put(g, x, 0, FLOWER_ROW.z, MULCH);
    const kind = cycle[(x - a) % cycle.length];
    if (kind === "peony" || kind === "rose_bush") {
      put(g, x, 1, FLOWER_ROW.z, kind, { half: "lower" });
      put(g, x, 2, FLOWER_ROW.z, kind, { half: "upper" });
    } else put(g, x, 1, FLOWER_ROW.z, kind);
  }
}

// A foundation shrub: azalea 3 wide x 1 deep x 2 high on a mulch strip at z9..10; the middle top is a flowering crown.
// The shrub row is z9, not z10: P4's ground-floor window sills sit at z10 y1, so a z10 shrub would hit them.
const SHRUB_Z = 9;
function bed(g, x0, flower) {
  for (let x = x0 - 1; x <= x0 + 3; x++) for (let z = 9; z <= 10; z++) put(g, x, 0, z, MULCH);
  for (let x = x0; x <= x0 + 2; x++) for (let y = 1; y <= 2; y++) put(g, x, y, SHRUB_Z, LEAVES, persistent);
  if (flower) put(g, x0 + 1, 2, SHRUB_Z, FLOWER_LEAVES, persistent);
}

function turretShrub(g) {
  for (const [x, z] of [[37, 7], [37, 8], [36, 8]]) put(g, x, 0, z, MULCH);
  for (let y = 1; y <= 2; y++) put(g, 37, y, 8, LEAVES, persistent);
}

function mailbox(g) {
  put(g, 21, 1, 3, ...B.fence("dark_oak"));
  put(g, 21, 2, 3, ...B.trapdoor("iron", "north", "bottom", false));
}

export function build(g) {
  street(g);
  driveway(g);
  lawn(g);
  walk(g);
  flowerStrip(g);
  bed(g, 19, false);
  bed(g, 32, true);
  bed(g, 35, true);
  turretShrub(g);
  lampPost(g, 24, 4);
  lampPost(g, 29, 4);
  // sidewalk lamps at the two street corners, where the lot's outer edge was dark (light 0)
  lampPost(g, 1, 2);
  lampPost(g, 40, 2);
  mailbox(g);
  youngTree(g);
}
