// A single-storey 1920s-30s brick shop on a stone base, Mt Eden / Newton street edge: the lidar gives a flat roof at 6
// blocks (about 5 m) over the whole footprint, so one tier, no setbacks. Brick walls on a stone base course, a stone
// storey line and cornice, a parapet to 7 blocks, glazed bays on two of every three cells with brick piers between,
// a dark timber shopfront with a door on the street face, warm glowstone in some panes, and a plant box on the roof.
// Walls are a shell: interiors stay air behind the glass, with a floor at y 0 and the roof deck at y 5.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095570519.nbt";
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095570519.cells.json", "utf8"));

const key = (x, z) => `${x},${z}`;
const roofOf = new Map(), groundOf = new Map();
for (const [x, z, g0, roof] of cells) { roofOf.set(key(x, z), roof); groundOf.set(key(x, z), g0); }
const has = (x, z) => roofOf.has(key(x, z));
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const exposed = (x, z) => Object.keys(DIRS).filter((d) => !has(x + DIRS[d][0], z + DIRS[d][1]));
const boundary = (x, z) => exposed(x, z).length > 0;

// the street front: the side with the most exposed cells
const count = { N: 0, S: 0, E: 0, W: 0 };
for (const [x, z] of [...roofOf.keys()].map((k) => k.split(",").map(Number))) if (boundary(x, z)) for (const d of exposed(x, z)) count[d]++;
const front = Object.keys(count).reduce((a, b) => (count[b] > count[a] ? b : a));
const frontCells = [...roofOf.keys()].map((k) => k.split(",").map(Number)).filter(([x, z]) => exposed(x, z).includes(front));
const alongU = (x, z) => (front === "N" || front === "S" ? x : z);
const frontU = frontCells.map(([x, z]) => alongU(x, z)).sort((a, b) => a - b);
const doorU = frontU[Math.floor(frontU.length / 2)];
const doorCell = frontCells.find(([x, z]) => alongU(x, z) === doorU);

const g = new Voxels([8, 19, 8]);
// a pane on a north/south wall joins east and west; on an east/west wall, north and south
const paneState = (d) => (d === "N" || d === "S"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
const lit = (x, y, z) => y === 2 && (x * 7 + z * 3) % 6 === 0;   // one pane in six, on the lower glass, glows warm
const facing = { N: "north", S: "south", E: "east", W: "west" };
const isDoor = (x, z) => x === doorCell[0] && z === doorCell[1];

for (const [x, z] of [...roofOf.keys()].map((k) => k.split(",").map(Number))) {
  const deck = roofOf.get(key(x, z)) - 1;   // y 5: roof deck and ceiling
  const edge = boundary(x, z);

  // y 0: floor everywhere, a stone base course on the edge
  g.set(x, 0, z, edge ? "stone_bricks" : "smooth_stone");
  if (!edge) {
    // interior: air above the floor (no interiors), roof deck over it
    g.set(x, deck, z, "smooth_stone");
    continue;
  }

  const faces = exposed(x, z);
  const onFront = faces.includes(front);
  const primary = faces[0];                  // a corner cell takes its first exposed face for its panes
  const bay = alongU(x, z) % 3 !== 0;        // two glazed cells, one brick pier, along each wall

  for (let y = 1; y <= 4; y++) {
    let block = "bricks", state;
    if (y === 4) block = onFront ? "dark_oak_planks" : "stone_bricks";          // storey line / shopfront fascia
    else if (onFront && y === 1) block = "dark_oak_planks";                     // shopfront bulkhead
    else if (onFront && (y === 2 || y === 3)) {
      block = "glass_pane"; state = paneState(front);
      if (lit(x, y, z) && !isDoor(x, z)) block = "glowstone", state = undefined;
    } else if (y === 1) block = bay ? "stone_bricks" : "bricks";               // sill course under the windows
    else if (bay && primary) {                                                  // window bay, two storeys-worth of glass
      block = "glass_pane"; state = paneState(primary);
      if (lit(x, y, z)) block = "glowstone", state = undefined;
    }
    g.set(x, y, z, block, state);
  }
  // cornice: stone at the deck level along the edge, parapet bricks above it to 7 blocks
  g.set(x, deck, z, "stone_bricks");
  g.set(x, deck + 1, z, "bricks");
}

// the entrance: a door on the middle of the front, two blocks high, on the sill course
if (doorCell) {
  const [x, z] = doorCell;
  g.set(x, 1, z, "dark_oak_door", { facing: facing[front], half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, 2, z, "dark_oak_door", { facing: facing[front], half: "upper", hinge: "left", open: "false", powered: "false" });
}

// roof plant: a 2 x 2 light grey box on the deck, set in from the parapet
for (const [x, z] of [[3, 4], [4, 4], [3, 5], [4, 5]]) if (has(x, z)) g.set(x, 6, z, "light_gray_concrete");

const r = g.save(OUT);
console.log(JSON.stringify({ front, doorU, blocks: r.blocks, palette: r.palette }));
