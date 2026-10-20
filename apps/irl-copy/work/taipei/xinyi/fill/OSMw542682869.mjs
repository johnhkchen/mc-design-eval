import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no record. Footprint 19 x 6, roof about 11 blocks above lowest ground.
// Read as a two-storey, flat-roofed commercial block of the 1980s Xinyi edge:
// stone plinth, white-tile piers, glazed shopfronts, a red fascia band at street
// level, a stone storey line, and a stone cornice and parapet.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542682869";
const W = 19, H = 23, D = 6;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const groundOf = new Map();
for (const [x, z, gr] of cells) groundOf.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => groundOf.has(`${x},${z}`);

for (const [x, z, graw] of cells) {
  const gr = Math.round(graw);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");

  // Exterior ring vs interior cells.
  const ring = !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));

  // Floor slabs at each storey line (gr+1 ground floor, gr+6 upper floor) and roof (gr+11).
  put(x, gr + 1, z, ring ? "smooth_stone" : "light_gray_concrete");
  put(x, gr + 6, z, ring ? "smooth_stone" : "light_gray_concrete");
  put(x, gr + 11, z, ring ? "smooth_stone" : "gray_concrete");

  if (!ring) {
    // Roof plant on two interior roof cells: a light box with an iron cap.
    if ((x === 4 || x === 13) && z === 2) {
      put(x, gr + 12, z, "light_gray_concrete");
      put(x, gr + 13, z, "iron_block");
    }
    continue;
  }

  // Facade face: first missing neighbour, N = z-, S = z+, W = x-, E = x+.
  let face;
  if (!has(x, z - 1)) face = "N";
  else if (!has(x, z + 1)) face = "S";
  else if (!has(x - 1, z)) face = "W";
  else face = "E";

  const along = (face === "N" || face === "S") ? x : z;
  const L = (face === "N" || face === "S") ? W : D;
  const pier = along % 3 === 0 || along === L - 1;
  const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] }[face];

  // Base course at street level.
  put(x, gr + 2, z, "stone_bricks");

  // Ground storey: shopfront glass between white piers, red fascia band above.
  for (const y of [gr + 3, gr + 4]) put(x, y, z, pier ? "white_concrete" : "glass_pane");
  put(x, gr + 5, z, "red_concrete");

  // Entrance: double-high door centred on the north (z = 0) facade.
  if (face === "N" && along === 9) {
    put(x, gr + 2, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 3, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 4, z, "glass_pane"); // transom
  }

  // Upper storey: stone sill, glass band, white lintel.
  put(x, gr + 7, z, pier ? "white_concrete" : "smooth_stone");
  put(x, gr + 8, z, pier ? "white_concrete" : "glass_pane");
  put(x, gr + 9, z, pier ? "white_concrete" : "glass_pane");
  put(x, gr + 10, z, "white_concrete");

  // Cornice and parapet.
  put(x, gr + 11, z, "smooth_stone");
  put(x, gr + 12, z, "white_concrete");

  // Warm light behind some upper windows: glowstone one block inside the glass.
  if (!pier && along % 6 === 2) {
    const ix = x + inward[0], iz = z + inward[1];
    const innerGr = groundOf.get(`${ix},${iz}`);
    if (innerGr !== undefined && !(has(ix - 1, iz) && has(ix + 1, iz) && has(ix, iz - 1) && has(ix, iz + 1))) {
      // inner cell is interior, so a single light sits in the empty air gap
    }
    if (innerGr !== undefined) put(ix, innerGr + 8, iz, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
