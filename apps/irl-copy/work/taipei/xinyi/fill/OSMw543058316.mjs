import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const ID = "OSMw543058316";
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const W = 11, D = 22, H = 29;

// Design record: no tags, so a 1990s-2000s Xinyi mid-rise: 3 storeys of 5 blocks,
// glass-and-white-concrete shopfront base, quartz cornice, parapet to y=17,
// small rooftop plant room and antenna.
const ROOF_DECK = 15;   // solid roof slab under the parapet
const TOP = 17;         // parapet cap top = roof height from lowest ground
const STOREY_LINES = [5, 10];
const GROUND_LINTEL = 4;

const WALL = "white_concrete";
const FRAME = "light_gray_concrete";
const SLAB = "light_gray_concrete";
const QUARTZ = "smooth_quartz";
const GLASS_PANE = "cyan_stained_glass_pane";
const SHOP_GLASS = "glass";
const FOUNDATION = "stone_bricks";
const PLINTH = "polished_andesite";
const ROOF = "smooth_stone";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inside = (x, z) => ground.has(`${x},${z}`);

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const missing = (x, z) =>
  Object.keys(DIRS).filter(k => !inside(x + DIRS[k][0], z + DIRS[k][1]));

const g = new Voxels([W, H, D]);

for (const [x, z, gr0] of cells) {
  const gr = Math.max(0, Math.min(12, Math.round(gr0)));
  const miss = missing(x, z);
  const perim = miss.length > 0;
  const corner = miss.length >= 2;

  // Foundation: solid from 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUNDATION);

  // Ground floor slab.
  g.set(x, gr, z, perim ? PLINTH : SLAB);

  // Storey slabs (floor of each upper storey), solid across the footprint.
  for (const s of STOREY_LINES) {
    if (s > gr) g.set(x, s, z, SLAB);
  }

  // Roof deck (interior) and cornice + parapet (perimeter).
  if (!perim) {
    g.set(x, ROOF_DECK, z, ROOF);
  } else {
    g.set(x, ROOF_DECK, z, QUARTZ);
    g.set(x, TOP - 1, z, QUARTZ);
  }

  if (!perim) continue;

  // Perimeter walls, ground band and storey bands.
  const face = miss[0];
  const [fdx, fdz] = DIRS[face] ?? [0, 0];
  // Inward cell lies opposite the missing neighbour.
  const ix = x - fdx, iz = z - fdz;
  const hasInward = !corner && inside(ix, iz);
  const t = (face === "N" || face === "S") ? x : z; // position along the wall
  const isMull = corner || (t % 3 === 0);
  const isFront = face === "S" && x === 5;          // main entrance

  for (let y = gr + 1; y <= TOP - 2; y++) {
    if (y === 5 || y === 10) continue;              // storey slab row already set
    if (y === ROOF_DECK) continue;

    if (corner) {
      g.set(x, y, z, QUARTZ);
      continue;
    }

    if (y <= GROUND_LINTEL) {
      // Ground-floor shopfront band.
      if (y === GROUND_LINTEL) {
        g.set(x, y, z, QUARTZ);
      } else if (isFront && y === gr + 1) {
        g.set(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      } else if (isFront && y === gr + 2) {
        g.set(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      } else if (isMull) {
        g.set(x, y, z, QUARTZ);
      } else {
        g.set(x, y, z, SHOP_GLASS);
      }
      // Warm glowstone just behind some shopfront glass.
      if (hasInward && y === gr + 2 && !isMull && !isFront && t % 5 === 2) {
        g.set(ix, y, iz, "glowstone");
      }
      continue;
    }

    // Upper storey bands: sill, two window rows, head.
    const S = y < 10 ? 5 : 10;
    const rel = y - S;
    if (rel === 1 || rel === 4) {
      g.set(x, y, z, isMull ? FRAME : WALL);
    } else {
      g.set(x, y, z, isMull ? FRAME : GLASS_PANE);
      if (hasInward && rel === 2 && !isMull && (t + S) % 4 === 0) {
        g.set(ix, y, iz, "shroomlight");
      }
    }
  }
}

// Rooftop plant room and equipment (on the roof deck, interior cells only).
for (let x = 4; x <= 6; x++) {
  for (let z = 9; z <= 12; z++) {
    if (!inside(x, z) || missing(x, z).length) continue;
    g.set(x, 16, z, FRAME);
    g.set(x, 17, z, QUARTZ);
  }
}
for (const [x, z] of [[2, 3], [8, 17]]) {
  if (inside(x, z) && !missing(x, z).length) g.set(x, 16, z, "iron_block");
}
if (inside(5, 10)) {
  g.set(5, 18, 10, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
