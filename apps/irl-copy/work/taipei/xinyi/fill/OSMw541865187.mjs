import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise commercial block, Xinyi district: two storeys on a stone plinth,
// cream tiled walls, a shopfront ground floor with a glass entrance, glazed
// upper bays, a parapet, and a rooftop plant screen.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541865187";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 21, H = 23, D = 17;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${Math.round(x)},${Math.round(z)}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);
const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const xs = cells.map(c => Math.round(c[0])), zs = cells.map(c => Math.round(c[1]));
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const cx = Math.floor((minX + maxX) / 2);

const TOP = 10;          // roof deck occupies y=10, roof surface at y=11
const LINE = 5;          // storey line / second floor slab
const LINTEL = 4;        // ground-floor head height
const UP_LO = 6, UP_HI = 8;  // upper glazing band
const SPANDREL = 9;

const PANE = "light_blue_stained_glass_pane";
const WALL = "white_concrete";
const BAND = "light_gray_concrete";

// Wall bay analysis: returns the axis a perimeter cell runs along and its bay index.
function bay(x, z) {
  if (has(x - 1, z) && has(x + 1, z)) return { axis: "x", idx: x - minX };
  if (has(x, z - 1) && has(x, z + 1)) return { axis: "z", idx: z - minZ };
  return null; // corners and irregular cells stay solid
}

function paneProps(axis) {
  return axis === "x"
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };
}

// Door: centred on the north (minZ) face, facing outward.
const doorOK = has(cx, minZ) && isPerim(cx, minZ);
const doorBase = doorOK ? gnd(cx, minZ) : null;

for (const [x, z, gc] of cells.map(c => [Math.round(c[0]), Math.round(c[1]), Math.round(c[2])])) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gc; y++) g.set(x, y, z, "stone_bricks");

  const perim = isPerim(x, z);
  const b = perim ? bay(x, z) : null;

  // Ground-floor slab / lobby floor.
  g.set(x, gc, z, perim ? BAND : "smooth_stone");

  // Storey line / upper floor slab across the footprint.
  if (gc <= LINE && !perim) g.set(x, LINE, z, "smooth_stone");

  // Roof deck.
  if (!perim && gc <= TOP) g.set(x, TOP, z, "gray_concrete");

  if (!perim) continue;

  // Perimeter wall column, base band at gc, then bays above.
  for (let y = gc + 1; y <= TOP; y++) {
    let mat = WALL;
    let props = null;

    if (y === LINE) mat = BAND;
    else if (y === LINTEL || y === SPANDREL || y === TOP) mat = WALL;

    const isGroundGlazing = y >= gc + 1 && y <= 3;
    const isUpperGlazing = y >= UP_LO && y <= UP_HI;

    if (b && b.axis && ((isGroundGlazing) || isUpperGlazing)) {
      const pillar = b.idx % 4 === 0 || b.idx % 4 === 3;
      if (!pillar) {
        mat = PANE;
        props = paneProps(b.axis);
        // Warm glowstone in a few upper bays.
        if (isUpperGlazing && y === 7 && b.idx % 8 === 1) mat = "glowstone";
      }
    }

    // Entrance: two-block dark oak door in the middle of the north face.
    if (doorOK && x === cx && z === minZ && (y === gc + 1 || y === gc + 2)) {
      const half = y === gc + 1 ? "lower" : "upper";
      g.set(x, y, z, "dark_oak_door", {
        facing: "north", half, hinge: "left", open: "false", powered: "false",
      });
      continue;
    }

    if (props) g.set(x, y, z, mat, props);
    else g.set(x, y, z, mat);
  }

  // Lantern under the entrance lintel, hanging from the storey slab above.
  if (doorOK && x === cx && z === minZ && gc <= 3) {
    g.set(cx, LINTEL, minZ + 1, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Rooftop plant screen: a low block with a parapet-height cap, sitting on the roof deck.
for (const [x, z, gc] of cells.map(c => [Math.round(c[0]), Math.round(c[1]), Math.round(c[2])])) {
  if (gc > TOP || isPerim(x, z)) continue;
  if (x >= minX + 4 && x <= minX + 7 && z >= minZ + 4 && z <= minZ + 6) {
    g.set(x, TOP + 1, z, "smooth_stone");
    g.set(x, TOP + 2, z, "stone_bricks");
  }
}

g.save(`${DIR}/${ID}.nbt`);
