// Way 912170784, Eden Terrace / Mt Eden edge: a three-storey Edwardian brick commercial block on a corner, the
// lidar roof at 11 blocks with a parapet to 12. The ground cells on the north-west corner sit one block higher, so
// they get a stone foundation; the south face is the downhill shopfront with a central door under a green fascia.
// Walls are a one-block shell (the footprint's outer ring); the interior is air with a slab per storey and a roof
// deck, so every floor and roof stands on the walls. Windows are glass panes with white lintels and stone sills.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912170784.cells.json", "utf8"));

const FOOT = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inF = (x, z) => FOOT.has(`${x},${z}`);
// one flat tier for the whole block: the lidar roof is uniform here, so the tallest cell sets it
const TOP = Math.max(...cells.map(([, , , roof]) => roof));    // 11: the top block's row; the parapet cap sits on it
const DECK = TOP - 1;                                          // the roof deck row, under the cornice

const BRICK = "bricks", PLINTH = "stone_bricks", TRIM = "smooth_stone", CORNER = "stone_bricks";
const CORNICE = "stone_bricks", CAP = "smooth_stone", LINTEL = "white_concrete", AWNING = "green_terracotta";
const GLASS = "glass_pane", ROOF = "stone", FOUNDATION = "stone", FLOOR = "smooth_stone";
const LAMP = "glowstone", PLANT = "iron_block";
const STOREY_LINES = [4, 8];   // the floor slabs and the string courses above them
const DOOR_X = 3, DOOR_Z = 8;  // the entrance on the south (downhill) face, between two shop bays

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const outward = (x, z) => Object.keys(DIRS).filter((d) => !inF(x + DIRS[d][0], z + DIRS[d][1]));
// an upper-storey or ground bay on a plain face: every other cell along the face, corners are piers
const bay = (x, z, face) => (face === "N" || face === "S" ? x : z) % 2 === 1;

const g = new Voxels([6, 24, 9]);
const glass = [];   // pane cells, connected to their neighbours once the wall is in place
const lamps = [];   // warm lights in the air behind some windows

for (const [x, z, gr, r] of cells) {
  // foundation under the cell's ground, then the floor slab at the ground line
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUNDATION);
  g.set(x, gr, z, FLOOR);
  for (const y of STOREY_LINES) g.set(x, y, z, FLOOR);   // interior floor slabs (perimeter overwritten below)
  g.set(x, DECK, z, ROOF);                                // roof deck over the interior
  const faces = outward(x, z), corner = faces.length >= 2;
  if (!faces.length) continue;                            // interior: air with the slabs above
  const face = faces[0];

  for (let y = gr; y <= TOP; y++) {
    let b = BRICK, state;
    if (y === gr) b = PLINTH;
    else if (y === 4 || y === 8) b = TRIM;
    else if (y === 10) b = CORNICE;
    else if (y === TOP) b = CAP;
    if (corner && y > gr && y !== 4 && y !== 8 && y !== 10 && y !== TOP) b = CORNER;

    if (!corner && y > gr && y < 10) {
      const isS = face === "S";
      if (y <= 2 && isS && (x === 2 || x === 4)) { b = GLASS; }                       // shopfront panes
      else if (y <= 2 && bay(x, z, face) && !isS) { b = GLASS; }
      else if (y === 3 && isS && x >= 1 && x <= 5) b = AWNING;
      else if ((y === 5 || y === 6) && bay(x, z, face)) b = GLASS;
      else if (y === 7 && bay(x, z, face)) b = LINTEL;
      else if (y === 9 && bay(x, z, face)) b = GLASS;
    }
    if (b === GLASS) {
      // a pane connects along its face to the wall cells beside it, never out into the air
      const along = face === "N" || face === "S" ? ["east", "west"] : ["north", "south"];
      const [da, db] = along.map((k) => (k === "east" ? [1, 0] : k === "west" ? [-1, 0] : k === "north" ? [0, -1] : [0, 1]));
      const conn = { north: "false", south: "false", east: "false", west: "false" };
      if (inF(x + da[0], z + da[1])) conn[along[0]] = "true";
      if (inF(x + db[0], z + db[1])) conn[along[1]] = "true";
      state = { ...conn };
      glass.push([x, y, z]);
      g.set(x, y, z, GLASS, state);
    } else {
      g.set(x, y, z, b);
    }
  }
}

// the entrance: a two-block oak door in the middle of the south shopfront, its wall cell turned into the doorway
g.set(DOOR_X, 1, DOOR_Z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(DOOR_X, 2, DOOR_Z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });

// warm light behind the shopfront glass and in some upper windows (in the air inside the shell)
g.set(2, 1, 7, LAMP);
g.set(4, 1, 7, LAMP);
for (const [x, y, z] of glass) {
  if (y < 5 || (x * 7 + z * 3 + y) % 4 !== 0) continue;
  const f = outward(x, z);
  if (!f.length) continue;
  const [ix, iz] = [x - DIRS[f[0]][0], z - DIRS[f[0]][1]];
  if (inF(ix, iz) && outward(ix, iz).length === 0) g.set(ix, y, iz, LAMP);
}

// roof plant on the deck: two plain units, standing on the deck row (the air above it is the roof's top)
g.set(2, TOP, 4, PLANT);
g.set(3, TOP, 6, PLANT);

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912170784.nbt");
