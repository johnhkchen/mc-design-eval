import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name, footprint 6 x 11, roof about 7 blocks above lowest ground.
// Read as a late-1970s/80s two-storey commercial block: white-tiled concrete
// walls, a stone-brick plinth and parapet, a shopfront on the north (z = 0)
// street face, and ribbon windows above. It stands on a foundation so it sits on the slope.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1334984548";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 6, H = 19, D = 11;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const minG = Math.min(...cells.map((c) => c[2]));

// Levels relative to the lowest ground (shared across the slope)
const PLINTH_TOP = 0;          // base course sits at each cell's own ground
const STRING_Y = minG + 3;     // floor slab / string course between storeys
const UPPER_LO = minG + 4;     // upper storey window band
const UPPER_HI = minG + 5;
const ROOF_Y = minG + 6;       // roof deck and parapet (7 blocks total above minG)

const setB = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) setB(x, y, z, "stone_bricks");

  const north = !has(x, z - 1); // street face, z = 0 side
  const south = !has(x, z + 1);
  const west = !has(x - 1, z);
  const east = !has(x + 1, z);
  const perim = north || south || west || east;

  // Interior floors (ground floor slab and upper slab), air elsewhere
  if (!perim) {
    setB(x, gr, z, "smooth_stone");
    setB(x, STRING_Y, z, "smooth_stone");
    setB(x, ROOF_Y, z, "smooth_stone");
    continue;
  }

  // Along-face index for window rhythm
  const along = (north || south) ? x : z;
  const alongMax = (north || south) ? W - 1 : D - 1;
  const windowSpot = along >= 1 && along <= alongMax - 1 && along % 2 === 1;

  for (let y = gr; y <= ROOF_Y; y++) {
    if (y === gr) {
      // Base course
      setB(x, y, z, "polished_andesite");
    } else if (y === ROOF_Y) {
      // Parapet cap
      setB(x, y, z, "stone_brick_wall");
    } else if (y === STRING_Y) {
      // String course between storeys
      setB(x, y, z, "stone_bricks");
    } else if (y < STRING_Y) {
      // Ground floor (shopfront on the north street face)
      if (north) {
        const doorCol = x === 2;
        if (doorCol && y <= minG + 2 && y <= gr + 2) {
          if (y === gr + 1) {
            setB(x, y, z, "dark_oak_door", {
              facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
            });
          } else if (y === gr + 2) {
            setB(x, y, z, "dark_oak_door", {
              facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
            });
          } else {
            setB(x, y, z, "white_concrete");
          }
        } else if (x >= 1 && x <= 4) {
          setB(x, y, z, "glass_pane");
        } else {
          setB(x, y, z, "light_gray_concrete"); // pillars at the corners
        }
      } else {
        setB(x, y, z, "white_concrete");
      }
    } else if (y >= UPPER_LO && y <= UPPER_HI) {
      // Upper storey: ribbon of windows on odd bays, wall between
      if (windowSpot) {
        const lit = north && along === 1 && y === UPPER_LO;
        setB(x, y, z, lit ? "glowstone" : "glass_pane");
      } else {
        setB(x, y, z, "white_concrete");
      }
    } else {
      setB(x, y, z, "white_concrete");
    }
  }
}

// Rooftop roof-deck details: keep the interior roof deck, no extra equipment above the parapet.

g.save(`${DIR}/${ID}.nbt`);
