import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. 11 x 18 footprint, roof ~11 blocks above lowest ground.
// Read as a two-storey, early-1990s Taipei commercial block: white-tiled concrete
// frame with pillars, stone base and cornice, tinted shopfronts at street level,
// a dark-planked entrance canopy, and a rooftop plant box.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541374054";
const W = 11, H = 23, D = 18;
const ROOF_DECK = 10;   // solid roof deck (interior) and cornice band (perimeter)
const PARAPET = 11;     // parapet course on the perimeter
const STOREY = 5;       // storey line / first-floor slab

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const gOf = (x, z) => ground.get(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Outward face of a perimeter cell and the index running along that face.
function faceOf(x, z) {
  if (!has(x, z - 1)) return { face: "north", t: x };
  if (!has(x, z + 1)) return { face: "south", t: x };
  if (!has(x - 1, z)) return { face: "west", t: z };
  return { face: "east", t: z };
}

// Entrance: median of the cells on the lowest-z (street) edge.
const zmin = Math.min(...cells.map(([, z]) => z));
const streetXs = cells.filter(([, z]) => z === zmin).map(([x]) => x).sort((a, b) => a - b);
const xc = streetXs[Math.floor(streetXs.length / 2)];

// Wall block for one perimeter cell at height y.
function wallBlock(x, z, gr, y, t, face) {
  const pillar = t % 3 === 0;
  if (y < gr) return null;

  // Entrance: door and canopy on the street face.
  if (z === zmin && face === "north") {
    if (x === xc && y === gr) return { id: "dark_oak_door", props: { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" } };
    if (x === xc && y === gr + 1) return { id: "dark_oak_door", props: { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" } };
    if (Math.abs(x - xc) <= 1 && y === gr + 2) return { id: "dark_oak_planks" };
  }

  if (y === gr) return { id: "stone_bricks" };               // base course
  if (y === 10) return { id: "smooth_stone" };               // cornice
  if (y === PARAPET) return { id: "white_concrete" };        // parapet
  if (y === 9) return { id: "white_concrete" };              // upper spandrel
  if (y >= 6) {                                              // upper windows
    if (pillar) return { id: "white_concrete" };
    const warm = ((t * 5 + y * 3 + (face === "north" || face === "south" ? 1 : 2)) % 6) === 0;
    return { id: warm ? "glowstone" : "light_blue_stained_glass" };
  }
  if (y === STOREY) return { id: "smooth_stone" };            // storey line
  // Ground floor (y < 5): shopfront glass to gr+2, transom band above.
  if (y <= gr + 2) {
    if (pillar) return { id: "white_concrete" };
    const warm = ((t * 7 + y) % 5) === 0;
    return { id: warm ? "glowstone" : "light_blue_stained_glass" };
  }
  return { id: "white_concrete" };                           // transom band
}

for (const [x0, z0] of cells) {
  const x = x0, z = z0;
  const gr = gOf(x, z);

  // Foundation: solid from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (gr >= PARAPET) continue;

  if (isEdge(x, z)) {
    const { face, t } = faceOf(x, z);
    for (let y = gr; y <= PARAPET; y++) {
      const b = wallBlock(x, z, gr, y, t, face);
      if (!b) continue;
      if (b.props) g.set(x, y, z, b.id, b.props);
      else g.set(x, y, z, b.id);
    }
  } else {
    // Interior: floor at ground level, floor slab at the storey line, roof deck.
    if (gr <= STOREY) g.set(x, STOREY, z, "light_gray_concrete");
    g.set(x, gr, z, "light_gray_concrete");
    g.set(x, ROOF_DECK, z, "light_gray_concrete");
  }

  // Edge cells also need a roof deck course under the parapet ring.
  if (isEdge(x, z) && ROOF_DECK > gr) {
    // cornice already placed at ROOF_DECK; nothing extra needed
  }
}

// Rooftop plant box on the deck, interior cells only (sits on the deck at y 10).
for (let x = 3; x <= 7; x++) {
  for (let z = 7; z <= 10; z++) {
    if (!has(x, z) || isEdge(x, z)) continue;
    g.set(x, PARAPET, z, "gray_concrete");
    g.set(x, PARAPET + 1, z, "gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
