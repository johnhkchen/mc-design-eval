// P2 Hyatt and Aperture shells (plan.md plots 2 and 3): the Hyatt stepped wedge, south block and west annex with its
// pilotis passage, and Aperture on Fifth with its shopfronts and 5-wide bays. Walls, floor slabs and roofs are laid cell
// by cell from each mass's footprint; windows, bays, shopfronts and doors come from the vocabulary helpers.
import { punchedWindow, apertureBay, shopfront, doorPair, CORE_HYATT, CORE_APERTURE } from "../vocab.mjs";

const WHITE = "white_concrete";
const LIGHT_GRAY = "light_gray_concrete";
const SANDSTONE = "smooth_sandstone";
const BIRCH = "birch_planks";
const GUEST_SLABS = [7, 12, 17, 22, 27, 32];

// Hyatt: the wedge's bays (x0..x1, z0..z1, inclusive), the south block, the west annex (plan.md, FLOORS)
const WEDGE = [[192, 199, 8, 11], [188, 199, 12, 15], [184, 199, 16, 19], [180, 199, 20, 23], [176, 199, 24, 31],
  [172, 199, 32, 35], [168, 199, 36, 39], [164, 199, 40, 47], [168, 199, 48, 55], [176, 199, 56, 63]];
const SOUTH = [[152, 199, 64, 91]];
const ANNEX = [[152, 171, 56, 63]];
const APT = { x0: 201, x1: 248, z0: 2, z1: 51 };

function cellsOf(rects) {
  const s = new Set();
  for (const [x0, x1, z0, z1] of rects) for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) s.add(`${x},${z}`);
  return s;
}

// The outer shell of one mass, cell by cell: a roof slab, the floor slabs over the whole footprint, and walls on the
// cells that touch the outside (wall(x, y, z, faces) gives the block, or null to leave the cell open).
function mass(g, cells, o) {
  const has = (x, z) => cells.has(`${x},${z}`);
  for (const key of cells) {
    const [x, z] = key.split(",").map(Number);
    const faces = [];
    if (!has(x, z - 1)) faces.push("north");
    if (!has(x, z + 1)) faces.push("south");
    if (!has(x - 1, z)) faces.push("west");
    if (!has(x + 1, z)) faces.push("east");
    // The stair core already placed its flights and landings here: its floors and roof stay the stair joiner's.
    const core = o.cores.some((c) => x >= c.x0 && x <= c.x1 && z >= c.z0 && z <= c.z1);
    if (!core) {
      g.set(x, o.roofY, z, o.roofBlock);
      for (const s of o.floors) g.set(x, s, z, BIRCH);
    }
    if (!faces.length) continue;
    for (let y = 1; y <= o.top; y++) {
      if (o.floors.includes(y)) continue;
      const b = o.wall(x, y, z, faces);
      if (b) g.set(x, y, z, b);
    }
  }
}

// Exposed wall cells of a footprint, with the faces each one shows: [x, z, face] per face.
function exposed(cells) {
  const has = (x, z) => cells.has(`${x},${z}`);
  const out = [];
  for (const key of cells) {
    const [x, z] = key.split(",").map(Number);
    if (!has(x, z - 1)) out.push([x, z, "north"]);
    if (!has(x, z + 1)) out.push([x, z, "south"]);
    if (!has(x - 1, z)) out.push([x, z, "west"]);
    if (!has(x + 1, z)) out.push([x, z, "east"]);
  }
  return out;
}

// Hyatt guest walls: a glazed lobby storey (y 1..5), a white band at y 6, then piers of light grey and beige in 4-block
// bays, with a white spandrel on each slab+4 row. Column piers stand in the glazing on the footprint line.
function hyattWall(open) {
  return (x, y, z, faces) => {
    if (open(x, y, z)) return null;
    const alongX = faces.includes("north") || faces.includes("south");
    const along = alongX ? x : z;
    if (y <= 5) return along % 4 === 0 && (faces.includes("north") || faces.includes("south") || faces.includes("east") || faces.includes("west")) ? LIGHT_GRAY : "glass";
    if (y === 6) return WHITE;
    if ((y - 7) % 5 === 4) return WHITE;
    return Math.floor(along / 4) % 2 === 0 ? LIGHT_GRAY : SANDSTONE;
  };
}

// Hyatt openings: the main lobby doors on the court (x 172..175, z 64) and the tip entrance (x 195..196, z 8), y 1..2.
const hyattOpen = (x, y, z) =>
  y <= 2 && ((z === 64 && x >= 172 && x <= 175) || (z === 8 && (x === 195 || x === 196)));

// The annex pilotis passage (x 164..171, z 56..63, y 1..6) is open, with light grey columns at its corners and mid-points.
const annexColumn = (x, z) => (x === 164 || x === 171 || x === 168) && (z === 56 || z === 63);
const annexWall = (x, y, z, faces) => {
  if (y <= 6 && x >= 164 && x <= 171 && z >= 56 && z <= 63) return annexColumn(x, z) ? LIGHT_GRAY : null;
  return hyattWall(() => false)(x, y, z, faces);
};

// Aperture: a ground shopfront along the north wall (its doorways stay air), a white wall above, the residents' door.
const aptWall = (x, y, z, faces) => {
  if (y <= 6 && faces.includes("north")) return null;
  if (y <= 2 && x === APT.x0 && (z === 20 || z === 21)) return null;
  return WHITE;
};

// Windows of a guest or apartment wall: a 2-wide window in each bay of 4, at the storey's slab rows.
function punchWindows(g, cells, storeys) {
  const faceCells = exposed(cells);
  const at = new Set(faceCells.map(([x, z, f]) => `${x},${z},${f}`));
  for (const s of storeys) {
    for (const [x, z, f] of faceCells) {
      const along = f === "north" || f === "south" ? x : z;
      if (along % 4 !== 1) continue;
      const nextKey = f === "north" || f === "south" ? `${x + 1},${z},${f}` : `${x},${z + 1},${f}`;
      if (!at.has(nextKey)) continue;
      punchedWindow(g, { x, z, face: f, slab: s, cut: true });
    }
  }
}

// Aperture bays: each face in 5-wide bays, dark and light alternating by bay and by storey.
function aptBays(g) {
  const { x0, x1, z0, z1 } = APT;
  GUEST_SLABS.forEach((s, si) => {
    let i = 0;
    for (let x = x0; x + 4 <= x1; x += 5, i++) {
      const dark = (i + si) % 2 === 0;
      apertureBay(g, { x, z: z0, face: "north", dark, slab: s, over: [WHITE] });
      apertureBay(g, { x, z: z1, face: "south", dark: !dark, slab: s, over: [WHITE] });
    }
    i = 0;
    for (let z = z0; z + 4 <= z1; z += 5, i++) {
      const dark = (i + si) % 2 === 0;
      apertureBay(g, { x: x0, z, face: "west", dark, slab: s, over: [WHITE] });
      apertureBay(g, { x: x1, z, face: "east", dark: !dark, slab: s, over: [WHITE] });
    }
  });
}

export function build(g) {
  // Hyatt House: the wedge and south block share one footprint; the annex is its own mass.
  const hyatt = cellsOf([...WEDGE, ...SOUTH]);
  mass(g, hyatt, { top: 36, roofY: 37, roofBlock: WHITE, floors: GUEST_SLABS, wall: hyattWall(hyattOpen), cores: [CORE_HYATT] });
  punchWindows(g, hyatt, GUEST_SLABS);
  doorPair(g, { x: 172, y: 1, z: 64, face: "north" });
  doorPair(g, { x: 174, y: 1, z: 64, face: "north" });
  doorPair(g, { x: 195, y: 1, z: 8, face: "north" });

  const annex = cellsOf(ANNEX);
  mass(g, annex, { top: 16, roofY: 17, roofBlock: WHITE, floors: [7, 12], wall: annexWall, cores: [{ x0: 154, x1: 161, z0: 58, z1: 61 }] });
  punchWindows(g, annex, [7, 12]);

  // Aperture on Fifth: one footprint, shopfronts on the north wall, 5-wide bays on every face.
  const apt = cellsOf([[APT.x0, APT.x1, APT.z0, APT.z1]]);
  mass(g, apt, { top: 36, roofY: 37, roofBlock: "gray_concrete", floors: GUEST_SLABS, wall: aptWall, cores: [CORE_APERTURE] });
  shopfront(g, { x0: APT.x0, x1: APT.x1, z: APT.z0, bay: 9, open: [[205, 206], [215, 216], [225, 226], [235, 236], [244, 245]] });
  for (const x of [205, 215, 225, 235, 244]) doorPair(g, { x, y: 1, z: APT.z0, face: "north" });
  doorPair(g, { x: APT.x0, y: 1, z: 20, face: "west" });
  aptBays(g);
}
