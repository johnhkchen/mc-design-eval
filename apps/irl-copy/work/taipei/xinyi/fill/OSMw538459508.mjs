import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: 6 x 18 footprint, roof about 11 blocks above lowest ground.
// Reading: a two-storey, c.1970s-80s Taipei low-rise commercial block with a
// tiled/concrete facade, aluminium-framed glass bays, a shopfront ground floor,
// a stone cornice and a parapet, and a flat roof with a small plant box.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538459508";
const W = 6, H = 23, D = 18;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const have = (x, z) => ground.has(key(x, z));

const B = Math.min(...cells.map((c) => c[2]));   // lowest ground
const bx0 = Math.min(...cells.map((c) => c[0]));
const bx1 = Math.max(...cells.map((c) => c[0]));
const bz0 = Math.min(...cells.map((c) => c[1]));
const bz1 = Math.max(...cells.map((c) => c[1]));

const R = B + 10;   // roof slab level (top of storey 2 + cornice)
const P = B + 11;   // parapet / roof top, about 11 blocks above lowest ground
const S2 = B + 5;   // storey 2 floor line
const ENT_Z = Math.round((bz0 + bz1) / 2);

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  const edgeX = x === bx0 || x === bx1;
  const edgeZ = z === bz0 || z === bz1;
  const perim = !have(x - 1, z) || !have(x + 1, z) || !have(x, z - 1) || !have(x, z + 1);
  const corner = edgeX && edgeZ;
  // Bay index along the facade; pillars every third bay, always at corners.
  let pillar;
  if (corner) pillar = true;
  else if (edgeX) pillar = z % 3 === 0;
  else if (edgeZ) pillar = x % 3 === 0;
  else pillar = (x + z) % 3 === 0;

  const isEntrance = edgeX && x === bx0 && z === ENT_Z;

  for (let y = gr; y <= P; y++) {
    if (perim) {
      if (y === P) { put(x, y, z, "white_concrete"); continue; }        // parapet
      if (y === R) { put(x, y, z, "smooth_stone"); continue; }          // cornice
      if (y === S2 || y === B + 9) { put(x, y, z, "light_gray_concrete"); continue; } // floor bands
      if (y <= B + 4) {                                                 // storey 1
        if (isEntrance && y <= gr + 1) {
          if (y === gr) put(x, y, z, "oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
          else put(x, y, z, "oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
          continue;
        }
        if (isEntrance && y === gr + 2) { put(x, y, z, "smooth_stone"); continue; } // lintel/canopy
        if (!pillar && y <= B + 3) { put(x, y, z, "light_blue_stained_glass"); continue; }
        put(x, y, z, "white_concrete");
        continue;
      }
      if (y >= B + 6 && y <= B + 8) {                                   // storey 2
        put(x, y, z, pillar ? "white_concrete" : "light_blue_stained_glass");
        continue;
      }
      put(x, y, z, "white_concrete");
    } else {
      // Interior: floor slabs and roof only, air behind the glass.
      if (y === S2) { put(x, y, z, "stone_bricks"); continue; }
      if (y === R) { put(x, y, z, "gray_concrete"); continue; }
      if ((y === B + 2 || y === B + 7) && z % 3 === 1) { put(x, y, z, "glowstone"); continue; }
    }
  }
}

// Roof equipment: small plant box on the roof, in the middle of the roof.
for (const [x, z] of cells) {
  const perim = !have(x - 1, z) || !have(x + 1, z) || !have(x, z - 1) || !have(x, z + 1);
  if (!perim && x >= bx0 + 2 && x <= bx0 + 3 && z >= bz0 + 5 && z <= bz0 + 7) {
    put(x, R + 1, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
