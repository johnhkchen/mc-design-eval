import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542020147";
const W = 8, D = 18, H = 23;

// Two-storey 1970s-80s Xinyi-style commercial block: cream ceramic-tile walls,
// stone-brick base and cornice, grey spandrels, glass shopfront and curtain-wall bays,
// glowing panels on the upper floor, rooftop plant and a parapet.
const SLAB_Y = 5;      // floor between storeys
const SPANDREL_Y = 9;  // head band of upper storey
const ROOF_Y = 10;     // cornice / roof slab
const PARAPET_Y = 11;  // parapet course

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, g] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(g, ROOF_Y - 1)));
}

const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);
const missing = (x, z) => {
  const m = [];
  if (!has(x, z - 1)) m.push("N");
  if (!has(x, z + 1)) m.push("S");
  if (!has(x - 1, z)) m.push("W");
  if (!has(x + 1, z)) m.push("E");
  return m;
};

// window bays: avoid the ends of each face and every third bay (piers)
const isWin = (a, len) => a > 0 && a < len - 1 && a % 3 !== 0;

const g = new Voxels([W, H, D]);

const doorProps = (half) => ({
  facing: "north",
  half,
  hinge: "left",
  open: "false",
  powered: "false",
});

for (const [x, z, gr] of cells) {
  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const m = missing(x, z);
  const perimeter = m.length > 0;

  if (!perimeter) {
    // interior: floor slab per storey, air above (no interior fit-out)
    if (SLAB_Y >= gr) g.set(x, SLAB_Y, z, "smooth_stone");
    g.set(x, ROOF_Y, z, "smooth_stone");
    continue;
  }

  const corner = m.length >= 2;
  const face = m[0];
  const alongNS = face === "N" || face === "S";
  const along = alongNS ? x : z;
  const len = alongNS ? W : D;
  const win = !corner && isWin(along, len);

  for (let y = gr; y <= PARAPET_Y; y++) {
    // shopfront door on the street (north) face
    if (!corner && face === "N" && along === 3 && (y === gr || y === gr + 1) && gr + 1 <= 4) {
      g.set(x, y, z, "oak_door", doorProps(y === gr ? "lower" : "upper"));
      continue;
    }

    let b;
    if (corner) {
      b = y === PARAPET_Y ? "stone_brick_wall" : "stone_bricks";
    } else if (y === gr) {
      b = "stone_bricks";                       // base course
    } else if (y === SLAB_Y || y === SPANDREL_Y) {
      b = "light_gray_concrete";                // floor spandrels
    } else if (y === ROOF_Y) {
      b = "stone_bricks";                       // cornice
    } else if (y === PARAPET_Y) {
      b = "stone_brick_wall";                   // parapet
    } else if (y <= 4) {
      // ground storey: glazed shopfront bays
      b = win ? "glass_pane" : "smooth_quartz";
    } else {
      // upper storey: curtain-wall bays, some lit panels
      if (win && y === 7 && along % 6 === 2) b = "glowstone";
      else if (win) b = "glass_pane";
      else b = "smooth_quartz";
    }
    g.set(x, y, z, b);
  }
}

// rooftop plant and antenna on the roof slab (only where footprint exists)
const roofSet = (x, z, h, id) => {
  if (!has(x, z)) return;
  for (let y = PARAPET_Y + 1; y < PARAPET_Y + 1 + h; y++) g.set(x, y, z, id);
};
roofSet(2, 4, 2, "iron_block");     // AC unit
roofSet(5, 4, 1, "iron_block");     // AC unit
roofSet(3, 12, 2, "light_gray_concrete"); // plant housing
roofSet(4, 15, 2, "lightning_rod"); // antenna

g.save(`${DIR}/${ID}.nbt`);
