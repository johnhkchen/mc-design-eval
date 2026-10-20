import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. Footprint 27 x 15. Roof about 11 blocks above lowest ground.
// Read as a two-storey, flat-roofed commercial block (about 8 m), built around
// the 1980s-90s Taipei street-front mid-rise type: stone-based shopfront, a
// light concrete frame, and a plain parapet. Storey line at y 5, roof surface at y 11.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1241584059";
const W = 27, H = 23, D = 15;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const ROOF_TOP = 11;   // roof surface sits at y = 11 (cornice occupies y 10)
const BAND = 5;       // storey line / floor slab level
const LINTEL = 4;     // top of shopfront
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const exteriorDirs = (x, z) =>
  Object.keys(DIRS).filter((d) => {
    const [dx, dz] = DIRS[d];
    return !has(x + dx, z + dz);
  });

// Front faces the street side: south if any cell is exposed there, else north.
const southCells = cells.filter(([x, z]) => !has(x, z + 1));
const frontDir = southCells.length ? "south" : "north";
const frontCells = cells.filter(([x, z]) => !has(x + DIRS[frontDir][0], z + DIRS[frontDir][1]));
const meanX = frontCells.reduce((s, c) => s + c[0], 0) / Math.max(1, frontCells.length);
let doorCell = frontCells[0] ? [frontCells[0][0], frontCells[0][1]] : null;
for (const [x, z] of frontCells) {
  if (doorCell && Math.abs(x - meanX) < Math.abs(doorCell[0] - meanX)) doorCell = [x, z];
}

const paneProps = (alongX) =>
  alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const ext = exteriorDirs(x, z);
  const isPerimeter = ext.length > 0;

  for (let y = gr; y < ROOF_TOP; y++) {
    if (!isPerimeter) {
      // Interior: floor slab per storey, roof deck on top, air between.
      if (y === BAND) put(x, y, z, "smooth_stone");
      if (y === ROOF_TOP - 1) put(x, y, z, "gray_concrete");
      continue;
    }

    const isFront = ext.includes(frontDir);
    const face = isFront ? frontDir : ext[0];
    const alongX = face === "north" || face === "south";
    const t = alongX ? x : z;
    const isDoor = isFront && doorCell && x === doorCell[0] && z === doorCell[1];

    if (y === ROOF_TOP - 1) {
      put(x, y, z, "stone_bricks");                       // cornice / parapet course
    } else if (y === BAND) {
      put(x, y, z, "smooth_stone");                       // storey band
    } else if (y === 9) {
      put(x, y, z, "light_gray_concrete");                // upper spandrel
    } else if (y >= 6 && y <= 8) {
      // Upper storey window grid.
      if (t % 4 === 0) put(x, y, z, "light_gray_concrete");
      else if ((t * 7 + y * 3 + x + z) % 13 === 0) put(x, y, z, "shroomlight");
      else put(x, y, z, "glass_pane", paneProps(alongX));
    } else {
      // Ground storey (y < BAND).
      if (isDoor && y <= gr + 1 && gr + 1 < BAND) {
        put(x, y, z, "dark_oak_door", {
          facing: face,
          half: y === gr ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (y === gr) {
        put(x, y, z, "stone_bricks");                     // base course
      } else if (y === LINTEL) {
        put(x, y, z, isFront ? "red_concrete" : "light_gray_concrete");
      } else if (t % 4 === 0) {
        put(x, y, z, "light_gray_concrete");              // shopfront mullion
      } else if (isFront && y === gr + 1 && t % 5 === 2) {
        put(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
      } else {
        put(x, y, z, "glass_pane", paneProps(alongX));
      }
    }
  }
}

// Roof plant: a central mechanical core and a few condenser units.
for (const [x, z, gr] of cells) {
  if (gr > ROOF_TOP - 1) continue;
  const interior = exteriorDirs(x, z).length === 0;
  if (!interior) continue;
  if (x >= 11 && x <= 15 && z >= 5 && z <= 9) {
    for (let y = ROOF_TOP; y <= ROOF_TOP + 2; y++) put(x, y, z, "light_gray_concrete");
  } else if (x % 5 === 1 && z % 4 === 1) {
    put(x, ROOF_TOP, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
