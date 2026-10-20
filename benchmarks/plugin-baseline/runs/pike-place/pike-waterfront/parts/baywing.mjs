// Bay Wing (plot 1, 1980): low concrete and glass halls round an empty court, the otter and seal pools on the
// roofs, the Link viewing deck, the underwater dome on the dome hall's roof. Kit-frame coordinates, no turning.
import {
  BAY_HALLS, DOME_HALL, DOME, OTTER_POOL, BAY_SEAL_POOL, LEVELS, groundAt, onFootprint,
  hallBox, ribbon, poolRim, glassDome, pilingRun, doorPair,
} from "../vocab.mjs";

const FLOOR = LEVELS.floor;
const inFoot = (x, z) => onFootprint(x, z);
const OW = { overwrite: true };

// the ring of a mass goes down from its ground to its floor in stone_bricks, so nothing floats
function footRing(g, [x0, z0, x1, z1], floor) {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (!(x === x0 || x === x1 || z === z0 || z === z1)) continue;
    const gr = groundAt(x, z);
    if (gr === null) continue;
    for (let y = gr + 1; y < floor; y++) g.set(x, y, z, "stone_bricks");
  }
}

// hallBox's parapet is a bottom slab, and the iron bars on it would stand half a block over air: the parapet
// course is a full cut_sandstone block instead, so the rail sits on it
function fullParapet(g, [x0, z0, x1, z1], roofY) {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (!(x === x0 || x === x1 || z === z0 || z === z1)) continue;
    if (inFoot(x, z)) g.set(x, roofY + 1, z, "cut_sandstone");
  }
}

export function build(g) {
  const H = BAY_HALLS;
  const halls = [H.N, H.W, H.E, H.S, H.Stail, H.Link];
  for (const h of halls) {
    const rect = [h.x0, h.z0, h.x1, h.z1];
    footRing(g, rect, FLOOR);
    hallBox(g, rect, FLOOR, h.roofY, { clip: inFoot });
    fullParapet(g, rect, h.roofY);
  }

  // the dome hall: the lobe's footprint, walls on its edge, deck on top (the dome sits on that deck)
  const D = DOME_HALL;
  const dome = [124, D.z0, 172, D.z1];
  footRing(g, dome, D.floorY);
  hallBox(g, dome, D.floorY, D.roofY, { clip: inFoot });
  fullParapet(g, dome, D.roofY);

  // west edge pilings: footing to the ground under the footprint strip at x 124..127
  const piles = [];
  for (let x = 124; x <= 127; x++) for (let z = 0; z <= 94; z += 3) if (inFoot(x, z)) piles.push([x, z]);
  pilingRun(g, piles);

  // glazing: outer faces and the faces on the court (the court itself stays empty)
  ribbon(g, "north", 8, 128, 169, 6, 8, OW);      // N hall, outer
  ribbon(g, "south", 11, 136, 155, 6, 8, OW);     // N hall, court
  ribbon(g, "west", 128, 12, 29, 6, 8, OW);       // W hall, outer
  ribbon(g, "east", 133, 12, 29, 6, 8, OW);       // W hall, court
  ribbon(g, "west", 156, 12, 29, 6, 8, OW);       // E hall, court
  ribbon(g, "east", 171, 12, 29, 6, 8, OW);       // E hall, outer
  ribbon(g, "north", 30, 136, 155, 6, 8, OW);     // S hall, court
  ribbon(g, "south", 39, 128, 171, 6, 8, OW);     // S hall, outer
  ribbon(g, "west", 128, 30, 39, 6, 8, OW);       // S hall, outer west
  ribbon(g, "east", 171, 30, 39, 6, 8, OW);       // S hall, outer east
  ribbon(g, "south", 43, 136, 171, 5, 6, OW);     // S tail, outer
  ribbon(g, "east", 171, 40, 43, 5, 6, OW);       // S tail, outer east
  ribbon(g, "west", 156, 45, 61, 5, 6, OW);       // Link, west
  ribbon(g, "east", 173, 44, 61, 5, 6, OW);       // Link, east
  ribbon(g, "south", 61, 156, 173, 5, 6, OW);     // Link, south
  doorPair(g, [173, 5, 50], "east", OW);          // Link door pair

  // roof pools: the otter pool on Hall E, the seal pool on Hall S
  poolRim(g, [OTTER_POOL.x0, OTTER_POOL.z0, OTTER_POOL.x1, OTTER_POOL.z1], 12, 13);
  poolRim(g, [BAY_SEAL_POOL.x0, BAY_SEAL_POOL.z0, BAY_SEAL_POOL.x1, BAY_SEAL_POOL.z1], 12, 13);

  // the underwater dome: its base row is the dome hall's deck (y 10, already laid, so skipped), the glass rises from y 11
  glassDome(g, [DOME.cx, DOME.cy, DOME.cz], DOME.r);
}
