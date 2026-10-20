import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: 14 x 7 footprint, roof about 11 blocks above lowest ground.
// Reading: a two-storey 1980s commercial block on Xinyi-style streets.
// White concrete body, stone-brick piers, a glass shopfront under a red sign band,
// a window grid above, a smooth-stone cornice and a parapet with a rooftop plant box.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542682873";
const W = 14, H = 23, D = 7;
const ROOF_Y = 11; // top course of the parapet (relative to lowest ground)

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const footprint = new Map();
for (const [x, z, gr] of cells) footprint.set(key(x, z), gr);
const has = (x, z) => footprint.has(key(x, z));
const minG = Math.min(...cells.map((c) => c[2]));

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Door: on the north (lowest-z) street edge, roughly a third of the way along.
const northCells = cells
  .filter(([x, z]) => !has(x, z - 1))
  .map(([x, z]) => x)
  .sort((a, b) => a - b);
const doorX = northCells.length ? northCells[Math.floor(northCells.length / 3)] : -1;
const doorZ = cells.find(([x, z]) => x === doorX && !has(x, z - 1))?.[1] ?? -1;
const doorFacing = "south";

for (const [x, z, gr] of cells) {
  const yg = gr - minG;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < yg; y++) put(x, y, z, "stone_bricks");

  const missW = !has(x - 1, z), missE = !has(x + 1, z);
  const missN = !has(x, z - 1), missS = !has(x, z + 1);
  const edge = missW || missE || missN || missS;
  const corner = (missW || missE) && (missN || missS);
  // Panes run along the face they sit on.
  const alongX = missN || missS;
  const u = alongX ? x : z;
  const pier = corner || u % 3 === 0;
  const isDoor = x === doorX && z === doorZ;

  const paneProps = alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  for (let y = yg; y <= ROOF_Y; y++) {
    if (!edge) {
      // Interior: floor slabs per storey, roof deck, plant box, no air-filled glazing gaps.
      if (y === 0) put(x, y, z, "polished_andesite");
      else if (y === 5) put(x, y, z, "smooth_stone");
      else if (y === 10) put(x, y, z, "gray_concrete");
      else if (y === 7 && z === 1 && x % 4 === 2) put(x, y, z, "glowstone"); // lamp behind glass
      else if (y >= 11 && y <= 12 && x >= 5 && x <= 8 && z >= 2 && z <= 4) {
        put(x, y, z, "light_gray_concrete");
      }
      continue;
    }

    if (y <= 4) {
      // Ground floor: shopfront.
      if (isDoor && y <= 1) {
        put(x, y, z, "dark_oak_door", {
          facing: doorFacing,
          half: y === 0 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (y === 0) {
        put(x, y, z, "polished_andesite");
      } else if (y === 4) {
        put(x, y, z, pier ? "stone_bricks" : "red_concrete");
      } else {
        put(x, y, z, pier ? "stone_bricks" : "glass");
      }
    } else if (y <= 9) {
      // Upper storey: window grid.
      if (y === 5) put(x, y, z, pier ? "white_concrete" : "smooth_stone");
      else if (y === 9) put(x, y, z, "light_gray_concrete");
      else put(x, y, z, pier ? "white_concrete" : "glass_pane", pier ? undefined : paneProps);
    } else if (y === 10) {
      put(x, y, z, "smooth_stone"); // cornice
    } else if (y === ROOF_Y) {
      put(x, y, z, "white_concrete"); // parapet
    }
  }

  // Roof deck inside the parapet sits on the cornice line.
  if (!edge && ROOF_Y >= 10) put(x, 10, z, "gray_concrete");
}

// Upper door half sits above the lower door half.
g.save(`${DIR}/${ID}.nbt`);
