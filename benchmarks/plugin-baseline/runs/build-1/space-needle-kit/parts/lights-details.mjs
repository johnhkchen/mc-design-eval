// Lights and details (P6): the restaurant tables and the reserved-cell check.
// Runs after parts 1-6, which own every floor, soffit, roof and post. runParts locks those cells (air included), so a
// sea lantern can't be written into any of them from here: the hidden lamps belong to the parts that build those cells.
// Only the tables go in here, on air cells no earlier part set.
import { table, CENTRE } from "../vocab.mjs";

const [CX, CZ] = CENTRE;
const RESERVED_LADDER = { x: 32, z: 34, y0: 2, y1: 221 };          // plan RESERVED: ladder column
const RESERVED_CAR = { x0: 34, x1: 35, z0: 27, z1: 28, y0: 150, y1: 152 }; // gold elevator car

const tally = { tables: 0 };

// Cells that plan.md reserves: a table never goes there.
function reserved(x, y, z) {
  if (x === RESERVED_LADDER.x && z === RESERVED_LADDER.z && y >= RESERVED_LADDER.y0 && y <= RESERVED_LADDER.y1) return true;
  if (x >= RESERVED_CAR.x0 && x <= RESERVED_CAR.x1 && z >= RESERVED_CAR.z0 && z <= RESERVED_CAR.z1
    && y >= RESERVED_CAR.y0 && y <= RESERVED_CAR.y1) return true;
  return false;
}

// Cell at radius r and azimuth θ (degrees clockwise from north) around the axis.
function ringCell(r, deg) {
  const t = (deg * Math.PI) / 180;
  return [Math.round(CX + r * Math.sin(t)), Math.round(CZ - r * Math.cos(t))];
}

export function build(g) {
  // Restaurant tables (plan ROOMS: "tables near glass"): six at r 20, clear of the north doorway lane (θ 0).
  for (const deg of [60, 105, 150, 195, 240, 285]) {
    const [x, z] = ringCell(20, deg);
    if (reserved(x, 213, z) || !g.isAir(x, 213, z) || !g.isAir(x, 214, z)) continue;
    table(g, x, 213, z);
    tally.tables++;
  }

  // Uplights: a ring of sea lanterns set flush in the ground round the legs' feet (r 25, every 10 deg), and a grid of
  // flush ground lamps every 8 over the open plot so no mob spawns on the ground (the ground stays writable).
  let lamps = 0;
  const groundLamp = (x, z) => {
    if (x < 0 || x > 63 || z < 0 || z > 63) return;
    if (g.blockAt(x, 0, z) !== "minecraft:smooth_stone" || !g.isAir(x, 1, z)) return;
    g.set(x, 0, z, "sea_lantern", {});
    lamps++;
  };
  for (let deg = 5; deg < 360; deg += 10) groundLamp(...ringCell(25, deg));
  for (let x = 4; x <= 60; x += 8) for (let z = 4; z <= 60; z += 8) groundLamp(x, z);
  tally.lamps = lamps;

  console.log(`lights-details: ${tally.tables} tables, ${tally.lamps} ground lamps; no sea lanterns (every lamp cell is locked to an earlier part)`);
}
