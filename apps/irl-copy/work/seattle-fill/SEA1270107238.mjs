// Ride the Duck HQ, 516 Broad St (1963): 2-storey industrial-commercial block on the Broad St (north) face.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const ID = "SEA1270107238";
const BOX = [473, 96, 488, 114];
const [X0, Z0] = [BOX[0], BOX[1]];
const W = 16, D = 19, HEIGHT = 15, HMAX = HEIGHT + 6;

const manifest = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/out/seattle/space-needle/manifest.json", "utf8"));
const bld = manifest.buildings.find((b) => b.id === ID);
if (!bld) throw new Error("building not in manifest");
const FP = new Set(bld.footprint.map(([x, z]) => `${x - X0},${z - Z0}`));
const inFP = (x, z) => FP.has(`${x},${z}`);

const g = new Voxels([W, HMAX, D]);
const put = (x, y, z, id, st) => g.set(x, y, z, id, st);

function outwardOf(x, z) {
  const o = [];
  if (!inFP(x, z - 1)) o.push("N");
  if (!inFP(x, z + 1)) o.push("S");
  if (!inFP(x - 1, z)) o.push("W");
  if (!inFP(x + 1, z)) o.push("E");
  return o;
}

const doorCells = [];
const cells = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (inFP(x, z)) cells.push([x, z]);

// Foundation under the whole footprint; interior floor slab at y6, flat roof membrane at y13.
for (const [x, z] of cells) {
  put(x, 0, z, "gray_concrete");
}

for (const [x, z] of cells) {
  const outs = outwardOf(x, z);
  if (outs.length === 0) {
    put(x, 6, z, "light_gray_concrete");
    put(x, 13, z, "gray_concrete");
    continue;
  }
  const dir = outs.includes("N") ? "N" : outs.includes("E") ? "E" : outs.includes("S") ? "S" : "W";
  const street = dir === "N" || dir === "E"; // the Broad St face and the storefront side
  const corner = outs.length >= 2;
  const u = dir === "N" || dir === "S" ? x : z;
  const pier = corner || u % 4 === 0;

  // Ground floor, y1-5.
  for (let y = 1; y <= 5; y++) {
    let id = "light_gray_concrete";
    if (y === 1) id = "gray_concrete"; // base course
    const garage = dir === "N" && x >= 2 && x <= 9;
    const storefront = dir === "E" && y >= 2 && y <= 4 && z >= 3 && z <= 12;
    const entrance = dir === "N" && x === 12;
    if (garage) {
      // Garage bay: dark frame lintel, yellow jambs, roll-door panels (light concrete with iron-bar slots) and a glass transom.
      if (y === 5) id = "gray_concrete";
      else if (x === 2 || x === 9) id = "yellow_concrete";
      else if (y === 4) id = "glass";
      else id = x % 2 === 0 ? "iron_bars" : "light_gray_concrete";
    } else if (storefront) {
      id = z % 3 === 0 ? "light_gray_concrete" : "glass"; // storefront with mullions
    } else if (!entrance && y >= 1) {
      // Every other exterior wall: pilasters every 4 blocks, a 2-high window/louvre band between them.
      if (pier) id = "white_concrete";
      else if (y === 2 || y === 3) id = street ? "glass_pane" : "iron_bars";
    }
    put(x, y, z, id);
  }
  if (dir === "N" && x === 12) doorCells.push([x, z]);

  // Sign band: yellow with a blue stripe and a green line, on the street faces.
  put(x, 6, z, street ? "yellow_concrete" : "white_concrete");
  put(x, 7, z, street ? "blue_concrete" : "white_concrete");
  put(x, 8, z, street ? "green_concrete" : "white_concrete");

  // Upper storey: ribbon windows between piers, spandrels above and below.
  put(x, 9, z, pier ? (corner ? "light_gray_concrete" : "white_concrete") : "glass");
  put(x, 10, z, pier ? (corner ? "light_gray_concrete" : "white_concrete") : "glass");
  put(x, 11, z, "white_concrete");
  put(x, 12, z, "smooth_stone_slab", { type: "top", waterlogged: "false" }); // cornice

  // Parapet with coping.
  put(x, 13, z, "white_concrete");
  put(x, 14, z, "light_gray_concrete");
}

// Entrance door on the north face.
for (const [x, z] of doorCells) {
  put(x, 1, z, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, 2, z, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
}
// Plain service door on the back (west) wall.
put(0, 1, 9, "oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
put(0, 2, 9, "oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });

// Rooftop units: two HVAC boxes on the flat roof, one with a vent cap.
const hvac = [[[4, 5], [5, 5], [6, 5], [4, 6], [5, 6], [6, 6]], [[9, 10], [10, 10], [9, 11], [10, 11]]];
for (const box of hvac) {
  for (const [x, z] of box) {
    if (!inFP(x, z) || outwardOf(x, z).length) continue;
    put(x, 14, z, "light_gray_concrete");
  }
}
put(5, 15, 5, "iron_block");
put(9, 15, 10, "iron_trapdoor", { facing: "north", half: "bottom", open: "true", powered: "false" });

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/seattle-fill/SEA1270107238.nbt");
console.log(`saved ${ID} size [${W},${HEIGHT},${D}] cells ${cells.length}`);
