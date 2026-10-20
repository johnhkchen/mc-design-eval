// Record: no record. Footprint 11 x 22, roof about 11 blocks above lowest ground.
// Read as a two-storey, street-fronted commercial shophouse of the 1960s-80s Taipei
// type: cast-in-place concrete frame with cream painted walls, a light-grey storey line
// at each floor, a stone-clad base, a glazed shopfront with a central door on the street
// (north) face, a parapet roof with a rooftop water tank, and warm light behind some windows.
// Party walls on the long sides stay blank except for a few small openings.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540888795";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 11, H = 23, D = 22;
const g = new Voxels([W, H, D]);

const inside = new Map();
for (const [x, z, gr] of cells) inside.set(`${x},${z}`, gr);
const has = (x, z) => inside.has(`${x},${z}`);
const interior = (x, z) => has(x, z) && has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1);

const put = (x, y, z, block, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

const paneProps = (face) =>
  face === "N" || face === "S"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const ROOF_DECK = 10;   // top of storey two, roof slab
const PARAPET = 11;     // roof edge, about 11 blocks above lowest ground

// Pass 1: foundation, floor slabs, roof deck, walls, windows, door
for (const [x, z, gr] of cells) {
  const gd = Math.min(Math.max(0, gr), 9);

  // foundation fill up to this cell's ground
  for (let y = 0; y < gd; y++) put(x, y, z, "stone_bricks");

  // first-floor ceiling / storey line, and roof deck over the whole footprint
  if (gd < 5) put(x, 5, z, "light_gray_concrete");
  put(x, ROOF_DECK, z, "light_gray_concrete");

  const N = !has(x, z - 1), S = !has(x, z + 1), Wf = !has(x - 1, z), E = !has(x + 1, z);
  if (!(N || S || Wf || E)) continue;

  const face = N ? "N" : S ? "S" : Wf ? "W" : "E";
  const a = face === "N" || face === "S" ? x : z; // position along the facade

  for (let y = gd; y <= ROOF_DECK - 1; y++) {
    if (y === gd) { put(x, y, z, "stone_bricks"); continue; }          // base course
    if (y === 5 || y === ROOF_DECK) { put(x, y, z, "light_gray_concrete"); continue; } // storey line

    const ground = y >= gd + 1 && y <= 3;
    const upper = y >= 7 && y <= 8;
    if (!ground && !upper) { put(x, y, z, "white_concrete"); continue; }

    if (face === "N") {
      if (ground) {
        if (a === 0 || a === 10 || a % 4 === 0) {
          put(x, y, z, "white_concrete");                              // shopfront piers
        } else if (a === 5 && y <= gd + 2) {
          put(x, y, z, "dark_oak_door", {
            facing: "north",
            half: y === gd + 1 ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          });
        } else {
          put(x, y, z, "glass_pane", paneProps(face));                 // shopfront glazing
        }
      } else {
        if (a >= 1 && a <= 9 && a % 3 !== 0) put(x, y, z, "glass_pane", paneProps(face));
        else put(x, y, z, "white_concrete");
      }
    } else {
      if (a % 2 === 1) put(x, y, z, "glass_pane", paneProps(face));
      else put(x, y, z, "white_concrete");
    }
  }

  // parapet on the roof edge
  put(x, PARAPET, z, "white_concrete");
}

// Pass 2: warm light behind some street-front windows (interior air cells only)
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  if (!has(x, z - 1) && interior(x, z + 1)) {
    if (x % 6 === 2) put(x, 7, z + 1, "shroomlight");
    if (x === 3 && !(has(x, z + 2) === false)) { /* keep ground light below */ }
    if (x === 7) put(x, 2, z + 1, "glowstone");
  }
}

// Pass 3: rooftop water tank on the deck, away from the parapet
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  if (x >= 6 && x <= 8 && z >= 3 && z <= 5 && has(x, z)) {
    put(x, PARAPET, z, "light_gray_concrete");
    put(x, PARAPET + 1, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
