// Part: chevet, south side and flyers. Flyers from every nave and choir pier (south z 66 -> clerestory z 48, north z 8 -> z 26),
// the six chevet radial flyers (pier top r 30 y 38 -> apse wall plate r 11 y 44), pinnacles on every pier top, gargoyles
// at y 36, the transept gables with their north and south roses and portals, and the apse-eave balustrade.
// Writes only into air (vocab helpers refuse anything an earlier part built), so the shell's walls stay as they are.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { flyer, pinnacle, gargoyle, roseWindow, portal } from "../vocab.mjs";

// nave and choir piers: the first x of each 2-wide pier (6 long in z: z 64..69 south, 4..10 north)
const NAVE_PIERS = [31, 40, 49, 58, 67, 76];
const CHOIR_PIERS = [113, 122, 131, 140];
const SOUTH = { from: 66, wall: 48 };           // pier centre z 66 -> clerestory wall z 48
const NORTH = { from: 8, wall: 26 };            // mirror about the main axis z 37

// chevet: seven radial bays; piers sit at the six angles between the chapels (0 = due east)
const CENTRE = [150, 37];
const CHEVET_PIER_ANGLES = [-72, -54, -18, 18, 54, 72];

// A radial flyer for the chevet: a curve of stair cells from the pier top (r 30, y 38) to the apse wall plate (r 11, y 44),
// steep off the pier and level into the wall (quarter-sine rise). Each path cell gets an upside-down stair soffit at the
// arc height and an upright stair coping above it, facing the apse centre. Air below the arc. Cells the shell already
// built (the pier top at y 38, the apse wall at r 10..11) are skipped: the flyer springs from them, it never replaces them.
const isAir = (g, x, y, z) => !g.inBounds(x, y, z) || /(^|:)(cave_)?air$/.test(g.blockAt(x, y, z));

function radialFlyer(g, angle, r0 = 30, r1 = 11, y0 = 38, y1 = 44) {
  const rad = (angle * Math.PI) / 180;
  const n = (r0 - r1) * 2;
  const seen = new Set();
  for (let i = 0; i <= n; i++) {
    const r = r0 - ((r0 - r1) * i) / n;
    const x = Math.round(CENTRE[0] + r * Math.cos(rad));
    const z = Math.round(CENTRE[1] + r * Math.sin(rad));
    if (seen.has(`${x},${z}`)) continue;
    seen.add(`${x},${z}`);
    const y = Math.round(y0 + (y1 - y0) * Math.sin((i / n) * Math.PI / 2));
    const dx = CENTRE[0] - x, dz = CENTRE[1] - z;
    const facing = Math.abs(dx) >= Math.abs(dz) ? (dx > 0 ? "east" : "west") : (dz > 0 ? "south" : "north");
    if (isAir(g, x, y, z)) g.set(x, y, z, ...B.stairs("smooth_sandstone", facing, "top"));
    if (isAir(g, x, y + 1, z)) g.set(x, y + 1, z, ...B.stairs("smooth_sandstone", facing, "bottom"));
  }
}

const at = (angle, r) => [
  Math.round(CENTRE[0] + r * Math.cos((angle * Math.PI) / 180)),
  Math.round(CENTRE[1] + r * Math.sin((angle * Math.PI) / 180)),
];

export function build(g) {
  // ---- nave and choir flyers, both sides: pier top y 38 to the clerestory wall at y 43 ----
  for (const x0 of [...NAVE_PIERS, ...CHOIR_PIERS]) {
    flyer(g, [x0, 38, SOUTH.from], [x0, 43, SOUTH.wall], "z");
    flyer(g, [x0, 38, NORTH.from], [x0, 43, NORTH.wall], "z");
  }

  // ---- pinnacles on every nave and choir pier (tops y 43 nave, y 44 choir) ----
  for (const x0 of NAVE_PIERS) {
    pinnacle(g, x0, SOUTH.from, 39, 5);
    pinnacle(g, x0, NORTH.from, 39, 5);
  }
  for (const x0 of CHOIR_PIERS) {
    pinnacle(g, x0, SOUTH.from, 39, 6);
    pinnacle(g, x0, NORTH.from, 39, 6);
  }

  // ---- chevet: six radial flyers, a pinnacle and a gargoyle on each chevet pier ----
  for (const a of CHEVET_PIER_ANGLES) {
    radialFlyer(g, a);
    const [px, pz] = at(a, 30);
    pinnacle(g, px, pz, 39, 6);
    const [gx, gz] = at(a, 34);
    gargoyle(g, gx, 36, gz, a > 0 ? "south" : "north");
  }

  // ---- transept gables: roses centred (95, 34), portals x 92..98 y 3..17 ----
  roseWindow(g, [95, 34, 69], "south", 7, true);
  portal(g, 95, 69, 7, 14, "south", { y0: 3 });
  pinnacle(g, 95, 68, 57, 4);

  roseWindow(g, [95, 34, 1], "north", 7, true);
  portal(g, 95, 1, 7, 14, "north", { y0: 3 });
  pinnacle(g, 95, 2, 57, 4);

  // ---- apse-eave balustrade: a pierced sandstone_wall ring on the r 11 line at y 46 ----
  for (let a = -90; a <= 90; a += 3) {
    const [x, z] = at(a, 11);
    if (x >= 150) g.set(x, 46, z, ...B.wall("sandstone"));
  }
}
