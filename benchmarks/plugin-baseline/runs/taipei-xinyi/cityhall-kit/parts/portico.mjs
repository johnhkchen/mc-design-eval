// Part 4: portico and west front. The Shifu Road entrance: a half-step slab ramp at the street edge (x 0..1), a
// paved portico floor and apron at y 1 (grass cells replaced), six quartz columns carrying a smooth_quartz canopy at
// y 13 with a 3-high fascia, sea_lanterns under the canopy, the glass entrance hall at x 19 with its four double
// doors at x 18, the name band and the city emblem on the west face, six flagpoles and lamp posts on the apron.
import {
  SIZE, groundAt, column, canopyLight, lobbyGlass, doubleDoor, slabRamp, nameBand, emblemDisc, lampPost,
  MAIN_DOOR_Z, FLAG_X, FLAG_Z, EMBLEM, ENTRANCE_HALL_Z,
} from "../vocab.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const PORTICO = { x0: 0, x1: 17, z0: 170, z1: 207 };
const COLUMN_Z = [171, 178, 185, 191, 197, 204];
const SMOOTH_QUARTZ = "smooth_quartz";

// writes only into air: an earlier part's block is never replaced
const put = (g, x, y, z, block, state) => { if (g.isAir(x, y, z)) g.set(x, y, z, block, state); };

// apron and portico floor: polished_andesite with light_gray_concrete joints every 4, over the grass at y 1 only
function paveApron(g, zSpans) {
  for (const [za, zb] of zSpans) {
    for (let x = 0; x <= 17; x++) for (let z = za; z <= zb; z++) {
      if (groundAt(x, z) !== 1) continue;
      const joint = x % 4 === 0 || z % 4 === 2;
      g.set(x, 1, z, joint ? "light_gray_concrete" : "polished_andesite");
    }
  }
}

// a flagpole as flagpole() draws it, but with a standing banner (palette.json lists no wall banners): stone base
// y 1..2, iron_bars pole y 3..20, lightning_rod tip y 21, and the flag at y 18 one cell west of the pole (rotation 4 =
// facing west) on a polished_andesite bracket at y 17. Drawn here, not by flagpole(), so no wall banner is ever written.
function flagStand(g, x, z, kind) {
  for (let y = 1; y <= 2; y++) g.set(x, y, z, "polished_andesite");
  for (let y = 3; y <= 20; y++) g.set(x, y, z, "iron_bars");
  g.set(x, 21, z, "lightning_rod", { facing: "up", powered: "false" });
  const bx = x - 1;
  g.set(bx, 17, z, "polished_andesite");
  const banner = kind === "national" ? B.banner("red", [["square_top_left", "blue"]], { wall: false, rotation: 4 })
    : B.banner("white", [], { wall: false, rotation: 4 });
  g.set(bx, 18, z, ...banner);
}

// a double iron door as doubleDoor, but the lower cells may be the M8 grass at y 2 (doubleDoor takes air only)
function doubleDoorOver(g, [x, y, z], facing) {
  const free = (cx, cy, cz) => g.isAir(cx, cy, cz) || (cy === 2 && groundAt(cx, cz) === 2);
  const leaves = [[x, z, "left"], [x, z + 1, "right"]];
  const cells = leaves.flatMap(([lx, lz, hinge]) => [[lx, y, lz, "lower", hinge], [lx, y + 1, lz, "upper", hinge]]);
  if (!cells.every(([cx, cy, cz]) => free(cx, cy, cz))) return 0;
  for (const [cx, cy, cz, half, hinge] of cells) g.set(cx, cy, cz, ...B.door("iron", facing, half, hinge));
  return cells.length;
}

export function build(g) {
  // apron north and south of the portico, then the portico floor between them (all at y 1, over the grass)
  paveApron(g, [[162, 169], [170, 207], [208, 215]]);

  // six 2x2 quartz columns, y 2..12
  for (const z of COLUMN_Z) column(g, 1, z, { y0: 2, y1: 12 });

  // slab ramp after the columns, so the column bases keep their cells (the ramp fills only what is still air)
  slabRamp(g, [0, 2, PORTICO.z0, 1, 2, PORTICO.z1]);

  // canopy: smooth_quartz slab at y 13 over the portico, with a 3-high fascia on the west and the two ends
  for (let x = PORTICO.x0; x <= PORTICO.x1; x++) for (let z = PORTICO.z0; z <= PORTICO.z1; z++) {
    put(g, x, 13, z, SMOOTH_QUARTZ);
  }
  for (let y = 13; y <= 15; y++) {
    for (let z = PORTICO.z0; z <= PORTICO.z1; z++) put(g, PORTICO.x0, y, z, SMOOTH_QUARTZ);
    for (let x = PORTICO.x0; x <= PORTICO.x1; x++) {
      put(g, x, y, PORTICO.z0, SMOOTH_QUARTZ);
      put(g, x, y, PORTICO.z1, SMOOTH_QUARTZ);
    }
  }

  // sea_lanterns recessed in the canopy underside at y 12, every 4 cells
  for (const x of [4, 8, 12, 16]) for (let z = 172; z <= 204; z += 4) canopyLight(g, x, z);

  // the glass entrance hall at x 19 (y 2..12), its sea_lanterns at x 20, and the four double doors at x 18
  // the M8 footing is grass at y 2 (ground 2), so the glass and the door cells may replace that grass
  lobbyGlass(g, [19, 2, ENTRANCE_HALL_Z[0], 19, 12, ENTRANCE_HALL_Z[1]], { over: ["grass_block"] });
  for (const [z] of MAIN_DOOR_Z) doubleDoorOver(g, [18, 2, z], "east");

  // name on the west fascia, centred on z 188.5
  nameBand(g, [0, 14, 188], { face: "west" });

  // city emblem on the M8 west face
  emblemDisc(g, [EMBLEM.x, EMBLEM.y, EMBLEM.z], "west", { r: EMBLEM.r });

  // flagpoles: national (centre) and city (outer) on the north and south aprons
  for (const [kind, i] of [["city", 0], ["national", 1], ["city", 2]]) {
    flagStand(g, FLAG_X[i], FLAG_Z.north, kind);
    flagStand(g, FLAG_X[i], FLAG_Z.south, kind);
  }

  // lamp posts along the apron, north and south
  for (const x of [6, 16]) {
    lampPost(g, x, 2, 168);
    lampPost(g, x, 2, 209);
  }
}
