// P2 garage wing shell: the x1..17 z7..24 block. Walls y1..9 (plinth y0, belt y5 and frieze y9, stone veneer on the
// front y1..4, siding elsewhere), the garage and mudroom floors, the y5 slab under the bonus room, the y9 ceiling, the
// z=18 ground partition, the four garage corner quoins and the bonus-window shutters. Every opening of the block stays
// air. vocab's quoins() and shutterCells() also reach the main block's corners, which P1 owns, so those are done here.
import { GARAGE, OPENINGS, SIDING, TRIM, SHUTTER, INTERIOR_WALL, wallBlock } from "../vocab.mjs";

const { x0, x1, z0, z1 } = GARAGE;                  // x1..17, z7..24, y0..9
const GARAGE_FLOOR = "light_gray_concrete";
const MUDROOM_FLOOR = "stone_bricks";
const BONUS_FLOOR = "spruce_planks";
const PLATE = "birch_planks";
const PARTITION_Z = 18;
const key = (x, y, z) => `${x},${y},${z}`;

export function build(g) {
  // Every OPENINGS cell inside the block is air: walls, quoins and shutters skip them.
  const air = new Set();
  for (const o of OPENINGS) {
    for (let x = o.x[0]; x <= o.x[1]; x++) for (let y = o.y[0]; y <= o.y[1]; y++) for (let z = o.z[0]; z <= o.z[1]; z++) {
      if (x >= x0 && x <= x1 && z >= z0 && z <= z1) air.add(key(x, y, z));
    }
  }
  const put = (x, y, z, ...pair) => { if (!air.has(key(x, y, z))) g.set(x, y, z, ...pair); };

  // Outer ring: the front (z7) and back (z24) rows, the west (x1) and east (x17) columns, y0..9.
  // The veneer wraps round the front corners onto the side walls for three cells (z8..10), as wallBlock's caller rule.
  const ring = [];
  for (let x = x0; x <= x1; x++) ring.push([x, z0, "north"], [x, z1, "south"]);
  for (let z = z0 + 1; z < z1; z++) ring.push([x0, z, "west"], [x1, z, "east"]);
  for (const [x, z, face] of ring) {
    const wrap = (x === x0 || x === x1) && z <= z0 + 3;
    for (let y = 0; y <= 9; y++) put(x, y, z, ...wallBlock(wrap ? "north" : face, x, y, z));
  }

  // Floors at y0: garage concrete z8..17, mudroom stone brick z18..23. y5 is the bonus floor and the garage and mudroom
  // ceiling; y9 is the bonus ceiling under the top plate.
  for (let x = x0 + 1; x < x1; x++) for (let z = z0 + 1; z < z1; z++) {
    put(x, 0, z, z < PARTITION_Z ? GARAGE_FLOOR : MUDROOM_FLOOR);
    put(x, 5, z, BONUS_FLOOR);
    put(x, 9, z, PLATE);
  }

  // Ground partition z=18 (y1..4) between garage and mudroom; the mudroom door (15,1..2,18) is air.
  for (let x = x0 + 1; x < x1; x++) for (let y = 1; y <= 4; y++) put(x, y, PARTITION_Z, INTERIOR_WALL);

  // Corner quoins for the four garage corners, as vocab's quoins() lays them: corner column y1..9 quartz, neighbour
  // cells alternate quartz (even y) and siding (odd y); y5 and y9 are the bands; the front veneer (y1..4) is kept.
  const QUOINS = [
    { c: [x0, z0], n: [[x0 + 1, z0, "north"], [x0, z0 + 1, "west"]] },
    { c: [x1, z0], n: [[x1 - 1, z0, "north"], [x1, z0 + 1, "east"]] },
    { c: [x0, z1], n: [[x0 + 1, z1, "south"], [x0, z1 - 1, "west"]] },
    { c: [x1, z1], n: [[x1 - 1, z1, "south"]] },
  ];
  for (const { c: [cx, cz], n } of QUOINS) {
    for (let y = 1; y <= 9; y++) put(cx, y, cz, TRIM);
    for (const [nx, nz, f] of n) {
      for (let y = 1; y <= 9; y++) {
        if (y === 5 || y === 9) continue;
        if (f === "north" && y <= 4) continue;
        put(nx, y, nz, y % 2 === 0 ? TRIM : SIDING);
      }
    }
  }

  // Black shutter strips beside the shuttered bonus-room windows on the front (x3, 6, 8, 11, 13, 16; y6..8). Applied
  // after the quoins so the strip at x16 wins over the quoin neighbour.
  for (const o of OPENINGS) {
    if (!o.sh || o.x[0] < x0 || o.x[1] > x1) continue;
    for (let y = o.y[0]; y <= o.y[1]; y++) {
      put(o.x[0] - 1, y, o.z[0], SHUTTER);
      put(o.x[1] + 1, y, o.z[0], SHUTTER);
    }
  }
}
