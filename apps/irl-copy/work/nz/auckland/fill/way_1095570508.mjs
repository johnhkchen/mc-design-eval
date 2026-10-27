// A three-storey Auckland commercial block of the 1910s-20s on a corner: brick walls on a stone plinth, a shopfront
// with timber fascia on the street sides (north and west), a stone string course and cornice, a parapet with a
// coping, sash-style glass in brick piers, quoins at the corners, a timber door, and a plant box on the roof.
// The footprint is the cells file; ground is 0 or 1 (each cell's own foundation), roof is 11 (flat: no setbacks).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_1095570508.cells.json`, "utf8"));
const g = new Voxels([11, 24, 10]);

const cellSet = new Set(cells.map(([x, z]) => `${x},${z}`));
const has = (x, z) => cellSet.has(`${x},${z}`);
const NORMAL = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
// the sides of a cell with no footprint cell beyond them: its exterior faces
const exposed = (x, z) => Object.keys(NORMAL).filter((d) => !has(x + NORMAL[d][0], z + NORMAL[d][1]));

const SHOP = (faces) => faces.includes("N") || faces.includes("W");   // street sides: the shopfront

// Storey lines from the roof (11): string course at 4, cornice at 8, parapet 9, coping slab at 10
const STRING = 4, CORNICE = 8, PARAPET = 9, COPING = 10;

const M = {
  plinth: "stone_bricks", floor: "smooth_stone", wall: "bricks", quoin: "stone_bricks",
  string: "smooth_stone", sill: "stone_brick_slab", glass: "glass", fascia: "dark_oak_planks",
  coping: "stone_brick_slab", door: "dark_oak_door", plant: "stone_bricks", lamp: "lantern",
};
const SLAB_BOTTOM = { type: "bottom", waterlogged: "false" };
const DOOR_LOWER = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" };
const DOOR_UPPER = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" };

// The door: the north-facing cell nearest the east end of the north side (corners take the door first)
const northCells = cells.filter(([x, z]) => exposed(x, z).includes("N")).map(([x, z]) => [x, z]);
const doorCell = northCells.sort((a, b) => b[0] - a[0])[0];

// Interior cells (no exterior face) are air between floor slabs; lights go in the air behind some windows
const lights = [];

for (const [x, z, ground, roof] of cells) {
  const faces = exposed(x, z);
  const perim = faces.length > 0;

  // foundation: solid from y 0 up to the cell's ground, so nothing floats on the slope
  for (let y = 0; y < ground; y++) g.set(x, y, z, M.plinth);

  if (!perim) {
    // floor slabs at each storey and a roof deck at the cornice; the air between is the interior
    g.set(x, ground, z, M.floor);
    g.set(x, STRING, z, M.floor);
    g.set(x, CORNICE, z, M.floor);
    continue;
  }

  // perimeter: base course on the ground, then the storeys up to the coping
  g.set(x, ground, z, M.plinth);
  const corner = faces.length >= 2;
  const bayFace = faces[0] === "N" || faces[0] === "S" ? x % 2 === 1 : z % 2 === 1;   // openings on alternate bays
  const shop = SHOP(faces);
  const isDoor = doorCell && doorCell[0] === x && doorCell[1] === z;

  for (let y = ground + 1; y <= COPING; y++) {
    let block = M.wall, state;
    if (isDoor && (y === ground + 1 || y === ground + 2)) {
      block = M.door; state = y === ground + 1 ? DOOR_LOWER : DOOR_UPPER;
    } else if (corner && y !== CORNICE && y !== COPING && (x + y + z) % 2 === 0) {
      block = M.quoin;                                      // corner stones laid in alternate courses, not a solid stone edge
    } else if (y <= 3) {                                    // the ground storey: shopfront or openings
      if (shop && faces.some((d) => d === "N" || d === "W")) {
        if (y === 3) block = M.fascia;
        else if (y <= 2) block = M.glass;
      } else if (bayFace && y <= 2) block = M.glass;
    } else if (y === STRING || y === CORNICE) {
      block = M.string;
    } else if (y === PARAPET) {
      block = M.wall;
    } else if (y === COPING) {
      block = M.coping; state = SLAB_BOTTOM;
    } else if (bayFace) {                                   // upper storeys: sill, then glass in the bay
      if (y === 5) { block = M.sill; state = SLAB_BOTTOM; }
      else if (y === 6 || y === 7) block = M.glass;
    }
    g.set(x, y, z, block, state);
  }

  // a lamp in the air behind some windows (the cell inside the glass)
  for (const d of faces) {
    const inner = [x - NORMAL[d][0], z - NORMAL[d][1]];
    if (!has(inner[0], inner[1]) || exposed(inner[0], inner[1]).length) continue;
    if ((x + z) % 3 === 0 && (d === "N" || d === "S" ? x % 2 === 1 : z % 2 === 1) && ground + 1 <= 3) {
      lights.push([inner[0], 7, inner[1], true]);       // upper storey, hanging from the cornice deck
    }
  }
}

// Shop lamps stand on the ground-floor slab behind the shopfront glass
for (const [x, z, ground] of cells) {
  const faces = exposed(x, z);
  if (!faces.some((d) => d === "N" || d === "W")) continue;
  const inner = faces.includes("N") ? [x, z + 1] : [x + 1, z];
  if (!has(inner[0], inner[1]) || exposed(inner[0], inner[1]).length) continue;
  if ((x + z) % 2 === 0) lights.push([inner[0], ground + 1, inner[1], false]);
}
for (const [x, y, z, hanging] of lights) {
  g.set(x, y, z, M.lamp, { hanging: String(hanging), waterlogged: "false" });
}

// Roof plant: a stone box on the deck, on the interior cells in the middle of the roof
for (const [x, z] of cells) {
  if (exposed(x, z).length) continue;
  if (x >= 4 && x <= 6 && z >= 4 && z <= 5) {
    g.set(x, CORNICE + 1, z, M.plant);
    g.set(x, CORNICE + 2, z, M.plant);
  }
}

g.save(`${DIR}/way_1095570508.nbt`);
