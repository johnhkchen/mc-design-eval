// P4 atrium and interior joinery (plan.md PARTS 4): the rain pool and coping, four Tuscan columns with the dark-oak edge beams
// round the compluvium, the two atrium statue niches, every interior doorway on the OPENINGS table, the atrium hung lamps and
// the four corner pots. The quartz pilasters at z=9 and z=22 are built by P1 (shell.mjs), which owns those wall cells.
import {
  ATRIUM_HANG_LAMPS, ATRIUM_POTS, COMPLUVIUM, DARK_OAK_LOG, IMPLUVIUM_COLUMNS, INTERIOR_DOORWAYS, PLANT_CYCLE,
  beamLine, doorway, hangLamp, impluvium, pot, statue, tuscanColumn,
} from "../vocab.mjs";

export function build(g) {
  // Rain pool: water at y1 in the basin, smooth_quartz_slab coping ring at y2.
  impluvium(g);

  // Four Tuscan columns at the compluvium corners, carrying the dark-oak edge beams at y6 round the hole.
  for (const [x, z] of IMPLUVIUM_COLUMNS) tuscanColumn(g, x, z);
  const { x0, z0, x1, z1 } = COMPLUVIUM;
  beamLine(g, x0, z0, x1, z0, DARK_OAK_LOG);
  beamLine(g, x0, z1, x1, z1, DARK_OAK_LOG);
  beamLine(g, x0, z0, x0, z1, DARK_OAK_LOG);
  beamLine(g, x1, z0, x1, z1, DARK_OAK_LOG);

  // Statue niches: the west figure faces east over the pool, the east figure faces west.
  statue(g, 11, 12, 12);
  statue(g, 24, 12, 4);

  // Interior doorways: every wall here runs along z (a wall at x = const), each on its OPENINGS cell.
  for (const [x, z] of INTERIOR_DOORWAYS) doorway(g, x, z, "z");

  // Bronze hung lamps under the atrium ceiling, and the four corner pots (plants cycle through PLANT_CYCLE).
  for (const [x, z] of ATRIUM_HANG_LAMPS) hangLamp(g, x, z);
  ATRIUM_POTS.forEach(([x, z], i) => pot(g, x, z, PLANT_CYCLE[i % PLANT_CYCLE.length]));
}
