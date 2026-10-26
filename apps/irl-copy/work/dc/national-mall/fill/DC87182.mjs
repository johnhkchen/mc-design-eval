import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC87182";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 31, H = 32, D = 23;
const g = new Voxels([W, H, D]);

// Palette: 1970s-80s Washington office block. Limestone-clad base,
// smooth stone floor bands, pale concrete piers, blue-tinted glazing, stone cornice.
const STONE = "stone_bricks";
const BASE = "polished_granite";
const BAND = "smooth_stone";
const PIER = "white_concrete";
const CORNICE = "polished_andesite";
const ROOF = "gray_concrete";
const GLAZE = "light_blue_stained_glass";
const GLAZE_PANE = "light_blue_stained_glass_pane";
const PLANT = "light_gray_concrete";

const key = (x, z) => `${x},${z}`;
const footprint = new Map(cells.map(c => [key(c[0], c[1]), c]));
const inside = (x, z) => x >= 0 && x < W && z >= 0 && z < D;
const has = (x, z) => footprint.has(key(x, z));

// Entrance on the lowest-z edge, centred on the footprint.
const xs = cells.map(c => c[0]);
const xMid = Math.round((Math.min(...xs) + Math.max(...xs)) / 2);
const doorCols = new Set([xMid - 1, xMid]);
const zMin = Math.min(...cells.map(c => c[1]));

const setB = (x, y, z, name, props) => {
  if (!inside(x, z) || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, name, props);
  else g.set(x, y, z, name);
};

// Along-face coordinate: for a face running along x (z-facing), use x;
// for a face running along z (x-facing), use z. Keeps piers vertical.
function faceAxis(x, z) {
  const zFaceExposed = !has(x, z - 1) || !has(x, z + 1);
  return zFaceExposed ? x : z;
}

for (const [x, z, gnd, roof] of cells) {
  const isEdge = [[1, 0], [-1, 0], [0, 1], [0, -1]]
    .some(([dx, dz]) => !has(x + dx, z + dz));

  // Foundation: solid from y0 up to this cell's ground.
  for (let y = 0; y < gnd; y++) setB(x, y, z, STONE);

  const top = Math.max(roof, gnd + 1);   // roof surface at y = top
  const capY = top - 1;                   // top solid course
  const cornY = top - 2;                  // cornice course below the roof edge
  const axis = faceAxis(x, z);
  const onEntranceFace = isEdge && z === zMin;

  for (let y = gnd; y < capY; y++) {
    const k = y - gnd;

    if (!isEdge) {
      // Interior: floor slabs at storey lines, otherwise open air.
      if (k > 0 && k % 3 === 0) setB(x, y, z, BAND);
      continue;
    }

    if (y === cornY) { setB(x, y, z, CORNICE); continue; }

    if (k === 0) {
      setB(x, y, z, BASE);
      continue;
    }

    if (k < 3) {
      // Ground-floor shopfront with entrance on the front face.
      if (onEntranceFace && doorCols.has(x)) {
        const hinge = x === xMid - 1 ? "left" : "right";
        if (k === 1) {
          setB(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge, open: "false", powered: "false" });
        } else {
          setB(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge, open: "false", powered: "false" });
        }
      } else if (onEntranceFace && (x === xMid - 3 || x === xMid + 2) && k === 2) {
        // Entrance pilasters framing the doors, topped by a lantern row
        setB(x, y, z, PIER);
      } else if (axis % 4 === 0) {
        setB(x, y, z, STONE);
      } else {
        setB(x, y, z, GLAZE);
      }
      continue;
    }

    if (k % 3 === 0) {
      setB(x, y, z, BAND);
      continue;
    }

    // Upper-floor window grid: pier columns and glazing
    if (axis % 3 === 0) {
      setB(x, y, z, PIER);
    } else if (((axis * 3 + y) % 29) === 0) {
      setB(x, y, z, "sea_lantern");
    } else {
      setB(x, y, z, GLAZE);
    }
  }

  // Entrance lintel and lantern above the doors
  if (onEntranceFace && doorCols.has(x) && gnd + 3 < capY) {
    setB(x, gnd + 3, z, BASE);
  }
  if (onEntranceFace && x === xMid && gnd + 4 < capY) {
    setB(x, gnd + 4, z, "lantern", { hanging: "true" });
  }

  // Roof slab: stone edge, gray concrete interior
  if (capY >= gnd) {
    setB(x, capY, z, isEdge ? STONE : ROOF);
  }
}

// Single contiguous roof plant block on the tallest interior cells (one penthouse, not scatter)
const interiorTop = cells.filter(c => {
  const [x, z] = c;
  return [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dz]) => has(x + dx, z + dz));
});
if (interiorTop.length) {
  const maxRoof = Math.max(...interiorTop.map(c => c[3]));
  for (const [x, z, gnd, roof] of interiorTop) {
    if (roof === maxRoof && roof + 1 < H) {
      setB(x, roof, z, PLANT);
      setB(x, roof + 1, z, PLANT);
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
