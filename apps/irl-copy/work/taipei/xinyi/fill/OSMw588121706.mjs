// Taipei Xinyi low-rise commercial block, 12 x 32 footprint, three storeys over a shopfront.
// Era: 1980s-90s Taiwanese commercial block. Pale tiled quartz piers, light-blue glass
// bays in aluminium-look frames, stone-band storey lines, a stone cornice and a parapet,
// and a rooftop water tank. Ground floor is a glazed shopfront with a recessed entrance on
// the west (street) face. Warm glowstone sits behind some upper-floor windows.
// Levels: shopfront y gr..4, storey lines at y 5 and 10, storeys 6..9 and 11..14,
// cornice 15, parapet 16, cap 17. Foundation fills from y 0 up to each cell's ground.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw588121706";
const W = 12, H = 29, D = 32;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inFp = (x, z) => ground.has(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const glowPositions = [];
const TANK = (x, z) => (x === 3 || x === 4) && (z === 4 || z === 5);
const FOUNDATION = "stone_bricks";
const PIER = "smooth_quartz";
const PANE = "light_blue_stained_glass_pane";
const SLAB_FLOOR = "light_gray_concrete";
const LINE = "smooth_stone";

for (const [x, z, gr0] of cells) {
  const gr = Math.max(0, Math.min(gr0 | 0, 16));

  const faces = [];
  if (!inFp(x - 1, z)) faces.push("W");
  if (!inFp(x + 1, z)) faces.push("E");
  if (!inFp(x, z - 1)) faces.push("N");
  if (!inFp(x, z + 1)) faces.push("S");
  const perim = faces.length > 0;
  const corner = faces.length > 1;
  const face = faces[0];
  const along = face === "W" || face === "E" ? z : x;
  const pier = corner || along % 3 === 0;
  const entrance = face === "W" && !corner && (along === 15 || along === 16);

  // inward neighbour for a perimeter cell (where glowstone sits behind glass)
  const inward =
    face === "W" ? [x + 1, z] :
    face === "E" ? [x - 1, z] :
    face === "N" ? [x, z + 1] :
    face === "S" ? [x, z - 1] : null;

  for (let y = 0; y <= 17; y++) {
    // foundation: solid from y 0 up to this cell's ground
    if (y < gr) { put(x, y, z, FOUNDATION); continue; }

    if (!perim) {
      // interior: floor slabs at storey lines and roof deck, air otherwise
      if (y === 5 || y === 10 || y === 15) put(x, y, z, SLAB_FLOOR);
      else if ((y === 16 || y === 17) && TANK(x, z)) put(x, y, z, "iron_block");
      continue;
    }

    // perimeter facade
    if (y <= 4) {
      // ground floor shopfront
      if (y === gr && entrance) {
        put(x, y, z, "dark_oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
      } else if (y === gr + 1 && entrance && y <= 4) {
        put(x, y, z, "dark_oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
      } else if (y === gr) {
        put(x, y, z, "stone_bricks");
      } else if (y === 4) {
        put(x, y, z, LINE);
      } else if (entrance) {
        put(x, y, z, PANE);
      } else {
        put(x, y, z, pier ? PIER : PANE);
      }
    } else if (y === 5 || y === 10) {
      put(x, y, z, LINE);
    } else if ((y >= 6 && y <= 9) || (y >= 11 && y <= 14)) {
      // upper storeys: sill, three glazed rows, lintel
      const b0 = y <= 9 ? 6 : 11;
      const rel = y - b0;
      if (rel === 0) put(x, y, z, PIER);
      else if (rel === 4) put(x, y, z, LINE);
      else {
        put(x, y, z, pier ? PIER : PANE);
        if (!pier && rel === 2 && along % 6 === 2 && inward && inFp(inward[0], inward[1])) {
          glowPositions.push([inward[0], y, inward[1]]);
        }
      }
    } else if (y === 15) {
      put(x, y, z, LINE); // cornice band
    } else if (y === 16) {
      put(x, y, z, PIER); // parapet
    } else if (y === 17) {
      put(x, y, z, "smooth_stone_slab", { type: "top", waterlogged: "false" }); // parapet cap
    }
  }
}

// warm light behind upper-floor glass
for (const [x, y, z] of glowPositions) put(x, y, z, "glowstone");

g.save(`${DIR}/${ID}.nbt`);
