// P5 peristyle garden (plan.md PARTS 5; elements E11..E16, E12 columns, E24 colonnade lamps).
// The column rectangle x10..25, z34..42 (18 columns, smooth_stone stylobate at y1, smooth_quartz architrave at y6),
// the walkway doorways on x=6 and x=29, the open court x11..24, z35..41 (lawn, gravel ring, corner plants,
// two parterre beds, the fountain), four statues, four quartz-stair benches and the twelve colonnade hang lamps.
// Writes only into cells that no earlier part filled: a cell P1..P4 built is kept as they built it and listed in the log.
import { fileURLToPath } from "node:url";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import {
  SMOOTH_STONE, SMOOTH_QUARTZ, GRASS_BLOCK, GRAVEL, ROSE_BUSH, LILAC,
  column, doorway, gardenBed, fountain, statue, hangLamp,
  COLONNADE_COLUMNS, COLONNADE_HANG_LAMPS, COLONNADE_BENCHES, COLONNADE_STATUES, COURT_STATUES,
  COURT_CORNER_ROSES, COURT_CORNER_LILACS, GARDEN_BEDS, GARDEN_COURT, FOUNTAIN,
} from "../vocab.mjs";

// The footprint this part may touch (x6..29 covers the doorways and walkway; y0..6 covers the ground to the architrave).
const AREA = { x0: 6, x1: 29, y0: 0, y1: 6, z0: 31, z1: 45 };

/** The view handed to the vocab helpers: a set() that skips any cell that was already filled when this part started. */
function onlyNew(g) {
  const earlier = new Set();
  for (let x = AREA.x0; x <= AREA.x1; x++) for (let y = AREA.y0; y <= AREA.y1; y++) for (let z = AREA.z0; z <= AREA.z1; z++) {
    if (g.blockAt(x, y, z) !== "minecraft:air") earlier.add(`${x},${y},${z}`);
  }
  const skipped = [];
  const view = {
    blockAt: (x, y, z) => g.blockAt(x, y, z),
    set(x, y, z, block, state, nbt) {
      if (earlier.has(`${x},${y},${z}`)) { skipped.push(`${x},${y},${z}`); return; }
      g.set(x, y, z, block, state, nbt);
    },
  };
  return { view, skipped };
}

// A plain span helper, inclusive.
const span = (a, b) => Array.from({ length: Math.abs(b - a) + 1 }, (_, i) => Math.min(a, b) + i);

/** A two-block double plant (rose_bush, lilac) at y2..3 on a plantable cell. */
function doublePlant(v, x, z, block) {
  v.set(x, 2, z, block, { half: "lower" });
  v.set(x, 3, z, block, { half: "upper" });
}

export function build(g) {
  const { view: v, skipped } = onlyNew(g);
  const rect = { x0: 10, z0: 34, x1: 25, z1: 42 };
  const onRect = (x, z) => x === rect.x0 || x === rect.x1 || z === rect.z0 || z === rect.z1;

  // Stylobate (y1) and architrave (y6) along the column rectangle.
  for (const x of span(rect.x0, rect.x1)) for (const z of span(rect.z0, rect.z1)) {
    if (!onRect(x, z)) continue;
    v.set(x, 1, z, SMOOTH_STONE);
    v.set(x, 6, z, SMOOTH_QUARTZ);
  }
  for (const [x, z] of COLONNADE_COLUMNS) column(v, x, z);

  // The walkway doorways on x=6 and x=29 (the tablinum south pilasters at z=31 are P1's).
  doorway(v, 6, 35, "z", "east");
  doorway(v, 6, 41, "z", "east");
  doorway(v, 29, 35, "z", "west");
  doorway(v, 29, 41, "z", "west");

  // Garden court ground: lawn everywhere, gravel on the ring, grass under the corner plants (plantable).
  const { x0, z0, x1, z1 } = GARDEN_COURT;
  const corner = (x, z) => (x === x0 || x === x1) && (z === z0 || z === z1);
  for (const x of span(x0, x1)) for (const z of span(z0, z1)) {
    const ring = x === x0 || x === x1 || z === z0 || z === z1;
    v.set(x, 1, z, ring && !corner(x, z) ? GRAVEL : GRASS_BLOCK);
  }
  for (const b of GARDEN_BEDS) gardenBed(v, b.x0, b.z0, b.x1, b.z1, b.flowers);
  fountain(v, FOUNTAIN.x0, FOUNTAIN.z0, FOUNTAIN.x1, FOUNTAIN.z1);
  for (const [x, z] of COURT_CORNER_ROSES) doublePlant(v, x, z, ROSE_BUSH);
  for (const [x, z] of COURT_CORNER_LILACS) doublePlant(v, x, z, LILAC);
  for (const [x, z] of COURT_STATUES) statue(v, x, z, 8);

  // Walkway: statues at the corners, quartz-stair benches facing the court (back to the walkway wall), hang lamps.
  for (const [x, z] of COLONNADE_STATUES) statue(v, x, z, 8);
  for (const [x, z] of COLONNADE_BENCHES) {
    const facing = z < GARDEN_COURT.z0 ? "north" : "south";
    v.set(x, 2, z, ...B.stairs("quartz", facing, "bottom"));
  }
  for (const [x, z] of COLONNADE_HANG_LAMPS) hangLamp(v, x, z);

  if (skipped.length) console.log(`P5 peristyle: kept ${skipped.length} earlier-part cells: ${skipped.join("; ")}`);
}
