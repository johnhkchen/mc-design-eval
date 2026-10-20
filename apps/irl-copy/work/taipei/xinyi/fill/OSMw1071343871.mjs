import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low commercial block, c. 1980s-90s Taipei: a two-storey concrete shophouse
// with a stone plinth, white rendered walls, a tinted-glass shopfront on the
// street (north) face, pillar-and-window bays on the sides, a cornice,
// a parapet, and rooftop AC units.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343871";
const W = 11, H = 23, D = 24;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const key = (x, z) => `${x},${z}`;
const groundMap = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  groundMap.set(key(x, z), gr);
  minG = Math.min(minG, gr);
}
const has = (x, z) => groundMap.has(key(x, z));

const g = new Voxels([W, H, D]);

const GLASS = "light_blue_stained_glass_pane";
const FRAME = "smooth_quartz";
const WALL = "white_concrete";
const BASE = "stone_bricks";
const FLOOR = "smooth_stone";

const winId = (i) => (i % 2 === 1 ? GLASS : FRAME);

for (const [x, z, groundRaw] of cells) {
  const gr = groundRaw - minG; // this cell's ground, relative to lowest ground

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Ground-floor slab at the cell's ground level.
  g.set(x, gr, z, FLOOR);

  // Missing neighbours = exterior faces.
  const missing = [];
  if (!has(x, z - 1)) missing.push("north");
  if (!has(x, z + 1)) missing.push("south");
  if (!has(x + 1, z)) missing.push("east");
  if (!has(x - 1, z)) missing.push("west");

  if (missing.length === 0) {
    // Interior cell: floor slabs and roof slab only, air in between.
    g.set(x, gr + 5, z, FLOOR);
    g.set(x, gr + 10, z, FLOOR);

    // Warm light behind the street-facing windows (interior cell next to the front wall).
    if (z === 1 && (x === 3 || x === 7)) {
      g.set(x, gr + 2, z, "glowstone");
      g.set(x, gr + 7, z, "glowstone");
    }

    // Rooftop AC units standing on the roof slab.
    if (x % 4 === 2 && z % 6 === 3) {
      g.set(x, gr + 11, z, "iron_block");
    }
    continue;
  }

  // Edge cell: part of the shell.
  const corner =
    (missing.includes("north") || missing.includes("south")) &&
    (missing.includes("east") || missing.includes("west"));
  const face = missing[0];
  const alongX = face === "north" || face === "south";
  const i = alongX ? x : z;
  const L = alongX ? W : D;
  const mid = Math.floor(L / 2);
  const isFront = face === "north" && !corner;

  // Pane connection props so windows read as continuous bands.
  const paneProps = alongX
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  const doorProps = (half) => ({
    facing: "north",
    half,
    hinge: "left",
    open: "false",
    powered: "false",
  });

  for (let rel = 1; rel <= 11; rel++) {
    const y = gr + rel;
    let id = WALL;
    let props;

    if (rel === 11) {
      id = WALL; // parapet
    } else if (rel === 10) {
      id = BASE; // cornice
    } else if (corner) {
      id = FRAME; // full-height pillars at corners
    } else if (rel === 5 || rel === 6 || rel === 9) {
      id = WALL; // storey lines and spandrels
    } else if (isFront) {
      if (rel === 1) {
        if (i === mid) { id = "dark_oak_door"; props = doorProps("lower"); }
        else id = BASE; // plinth
      } else if (rel === 2) {
        if (i === mid) { id = "dark_oak_door"; props = doorProps("upper"); }
        else { id = GLASS; props = paneProps; }
      } else if (rel === 3) {
        id = GLASS; props = paneProps; // shopfront glass / transom
      } else if (rel === 4) {
        id = WALL; // sign band above shopfront
      } else if (rel === 7 || rel === 8) {
        id = winId(i);
        if (id === GLASS) props = paneProps;
      }
    } else {
      if (rel === 1) id = BASE;
      else if (rel === 4) id = WALL;
      else if (rel === 2 || rel === 3 || rel === 7 || rel === 8) {
        id = winId(i);
        if (id === GLASS) props = paneProps;
      }
    }

    g.set(x, y, z, id, props);
  }
}

g.save(`${DIR}/${ID}.nbt`);
