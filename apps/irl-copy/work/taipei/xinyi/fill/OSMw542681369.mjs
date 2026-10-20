import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw542681369";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 12, H = 23, D = 12;
const g = new Voxels([W, H, D]);

// Footprint lookup and per-cell ground (normalised so the lowest ground is y 0).
const key = (x, z) => `${x},${z}`;
const groundMap = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  groundMap.set(key(x, z), gr);
  minG = Math.min(minG, gr);
}
const inF = (x, z) => groundMap.has(key(x, z));
const isEdge = (x, z) =>
  [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !inF(x + dx, z + dz));

const ROOF_Y = 11;          // parapet top
const DECK_Y = 10;          // roof deck / cornice line
const STOREY_Y = 5;         // floor slab / storey line
const FRONT_Z = Math.max(...cells.map(([, z]) => z));

const put = (x, y, z, block, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

const doorProps = (half, x) => ({
  facing: "south",
  half,
  hinge: x === 5 ? "left" : "right",
  open: "false",
  powered: "false",
});

const glassCells = []; // for later light placement

// Pass 1: foundations and interior cores.
for (const [x, z, gr] of cells) {
  const gg = Math.min(DECK_Y, gr - minG);
  for (let y = 0; y < gg; y++) put(x, y, z, "stone_bricks");
  if (!isEdge(x, z)) {
    for (let y = gg; y <= STOREY_Y; y++) put(x, y, z, "stone");
    put(x, DECK_Y, z, "gray_concrete");
  }
}

// Pass 2: perimeter walls, shopfront, upper storey, cornice, parapet.
for (const [x, z, gr] of cells) {
  if (!isEdge(x, z)) continue;
  const gg = Math.min(DECK_Y, gr - minG);
  const front = z === FRONT_Z;
  const isDoorCell = front && (x === 5 || x === 6);
  const mullion = (x + z) % 3 === 0;

  for (let y = gg; y <= ROOF_Y; y++) {
    if (y === gg) {
      put(x, y, z, "polished_andesite");                 // base course
    } else if (y === STOREY_Y) {
      put(x, y, z, "polished_andesite");                 // storey line
    } else if (y === DECK_Y) {
      put(x, y, z, "polished_andesite");                 // cornice
    } else if (y === ROOF_Y) {
      put(x, y, z, "white_concrete");                    // parapet
    } else if (y < STOREY_Y) {
      // Ground storey: shopfront with door and canopy.
      if (isDoorCell && y === gg + 1) {
        put(x, y, z, "dark_oak_door", doorProps("lower", x));
      } else if (isDoorCell && y === gg + 2) {
        put(x, y, z, "dark_oak_door", doorProps("upper", x));
      } else if (front && x >= 4 && x <= 7 && y === gg + 3) {
        put(x, y, z, "dark_oak_slab", { type: "top", waterlogged: "false" }); // canopy lip
      } else if (mullion && !isDoorCell) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "glass");
      }
    } else {
      // Upper storey: spandrels at 6 and 9, glazing between.
      if (y === 6 || y === 9 || mullion) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "light_blue_stained_glass");
        glassCells.push([x, y, z]);
      }
    }
  }
}

// Pass 3: warm lights on the floor slab behind some upper glazing.
for (const [x, , z] of glassCells) {
  if ((x + z) % 4 !== 1) continue;
  const inward = [[1, 0], [-1, 0], [0, 1], [0, -1]]
    .map(([dx, dz]) => [x + dx, z + dz])
    .find(([nx, nz]) => inF(nx, nz) && !isEdge(nx, nz));
  if (inward) put(inward[0], 6, inward[1], "glowstone");
}

// Pass 4: roof plant on the deck, away from the edge.
for (const [x, z] of cells.map(([cx, cz]) => [cx, cz])) {
  if (isEdge(x, z)) continue;
  if (x >= 4 && x <= 7 && z >= 4 && z <= 6) {
    put(x, ROOF_Y, z, "light_gray_concrete");
    put(x, ROOF_Y + 1, z, "light_gray_concrete");
  }
}

g.save(`${dir}/${id}.nbt`);
