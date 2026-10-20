import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1339999082";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 11 x 9, roof about 7 blocks above lowest ground: a two-storey
// low commercial block in the Taipei tiled-facade idiom of the 1960s-80s.
const W = 11, H = 19, D = 9;
const g = new Voxels([W, H, D]);

const FOUND = "stone_bricks";      // foundation below each cell's ground
const PLINTH = "polished_andesite"; // base course on the street face
const WALL = "white_terracotta";    // tiled facade
const PIER = "light_gray_concrete"; // mullions / piers between windows
const GLASS = "gray_stained_glass";  // tinted glazing (dusk reads well)
const BAND = "smooth_stone";        // storey line / spandrel
const CORNICE = "smooth_stone";     // parapet cap on perimeter
const ROOFM = "light_gray_concrete"; // roof deck
const FLOOR = "smooth_stone";       // floor slab per storey

const ROOF = 6;   // roof deck layer (roof surface at y=7)
const LINE = 4;   // first-floor slab / storey line
const UPPER = 5;  // upper storey window row
const GROUND_TOP = 3; // top of ground-storey glazing

const ground = new Map();
for (const [x, z, y0] of cells) ground.set(`${x},${z}`, y0);
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

const FACE = {
  north: { dx: 0, dz: -1 },
  south: { dx: 0, dz: 1 },
  west: { dx: -1, dz: 0 },
  east: { dx: 1, dz: 0 },
};

function outwardFacing(x, z) {
  const open = Object.keys(FACE).filter(f => !has(x + FACE[f].dx, z + FACE[f].dz));
  if (open.length === 0) return null;
  return open.includes("south") ? "south" : open[0];
}

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Entrance: middle of the south-facing street frontage.
const southCells = cells
  .filter(([x, z]) => outwardFacing(x, z) === "south")
  .sort((a, b) => a[0] - b[0]);
const entrance = southCells.length ? southCells[Math.floor(southCells.length / 2)] : null;
const ENTRANCE_KEY = entrance ? `${entrance[0]},${entrance[1]}` : null;
const canopyX = entrance ? entrance[0] : -99;

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);

  const face = outwardFacing(x, z);

  if (!face) {
    // Interior cell: floor slab at the storey line and the roof deck. Air between.
    if (gr < LINE) put(x, LINE, z, FLOOR);
    if (gr <= ROOF) {
      put(x, ROOF, z, ROOFM);
      // Roof equipment: a few condenser boxes above the deck.
      if ((x + z) % 4 === 0) put(x, ROOF + 1, z, PIER);
    }
    continue;
  }

  const { dx, dz } = FACE[face];
  const t = (face === "north" || face === "south") ? x : z; // position along the face
  const inX = x - dx, inZ = z - dz;                          // cell just inside
  const hasInside = has(inX, inZ);

  // Plinth course on the street face.
  if (gr < ROOF) put(x, gr, z, PLINTH);

  // Ground storey: shopfront glazing with piers, entrance door and warm light.
  for (let y = gr + 1; y <= GROUND_TOP; y++) {
    if (ENTRANCE_KEY === `${x},${z}`) {
      if (y === gr + 1) put(x, y, z, "dark_oak_door", { facing: face, half: "lower", hinge: "left", open: "false", powered: "false" });
      else if (y === gr + 2) put(x, y, z, "dark_oak_door", { facing: face, half: "upper", hinge: "left", open: "false", powered: "false" });
      else put(x, y, z, PIER);
    } else if (t % 3 === 0) {
      put(x, y, z, PIER);
    } else {
      put(x, y, z, GLASS);
    }
  }
  // Warm glow behind some shopfront glass.
  if (hasInside && gr < 2 && t % 3 === 2 && ENTRANCE_KEY !== `${x},${z}`) {
    put(inX, 2, inZ, "glowstone");
  }

  // Canopy over the entrance and its neighbours (only where the glazing band is free).
  if (entrance && face === "south" && Math.abs(t - canopyX) <= 1 && gr + 3 <= GROUND_TOP) {
    put(x, gr + 3, z, "dark_oak_slab", { type: "top", waterlogged: "false" });
  }

  // First-floor storey line.
  if (gr < LINE) put(x, LINE, z, BAND);

  // Upper storey: window row with piers, some lit from inside.
  if (gr < UPPER) {
    for (let y = UPPER; y === UPPER; y++) {
      if (t % 3 === 0) put(x, y, z, WALL);
      else put(x, y, z, GLASS);
    }
    if (hasInside && t % 3 === 1 && (t + (face === "south" || face === "east" ? 1 : 0)) % 2 === 0) {
      put(inX, UPPER, inZ, "shroomlight");
    }
  }

  // Cornice / parapet cap on the perimeter at roof level.
  if (gr < ROOF) put(x, ROOF, z, CORNICE);
}

g.save(`${DIR}/${ID}.nbt`);
