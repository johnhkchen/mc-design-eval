import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no record. Footprint 32 x 7, roof ~7 blocks above lowest ground.
// Read as a one-storey (5-block storey) commercial strip with a shopfront
// front, a 1-block parapet, and rooftop plant. Typical of 1980s-1990s Taipei
// street-front retail: white concrete body, red fascia, glass shopfronts.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1341315573";
const W = 32, H = 19, D = 7;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(H - 9, Math.round(gr))));
}
const inFp = (x, z) => ground.has(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  const gr = ground.get(`${x},${z}`);

  // Exterior faces: a neighbour that is not in the footprint means the face is exposed.
  const faceN = !inFp(x, z - 1); // back
  const faceS = !inFp(x, z + 1); // front, facing the street
  const faceW = !inFp(x - 1, z);
  const faceE = !inFp(x + 1, z);
  const perimeter = faceN || faceS || faceW || faceE;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Levels: floor at gr, storey glass gr+1..gr+3, fascia gr+4, roof slab yc.
  const yc = Math.max(5, gr + 5);
  const top = yc + 1;

  if (perimeter) {
    // Solid envelope column from gr to yc (wall + cornice), parapet at yc+1.
    put(x, gr, z, "stone_bricks"); // base course

    for (let y = gr + 1; y <= yc; y++) {
      let id = "white_concrete";

      if (faceS) {
        // Street front: shopfront storey, pillars and doors.
        const doorCell = x === 5 || x === 26;
        if (y >= gr + 1 && y <= gr + 3) {
          if (doorCell && y <= gr + 2) {
            const half = y === gr + 1 ? "lower" : "upper";
            put(x, y, z, "dark_oak_door", {
              facing: "south", half, hinge: "left", open: "false", powered: "false",
            });
            continue;
          }
          id = x % 4 === 0 ? "polished_andesite" : "glass";
        } else if (y === gr + 4) {
          id = "red_concrete"; // fascia sign band
        } else if (y === yc) {
          id = "smooth_stone"; // cornice
        }
      } else {
        // Sides and back: punched windows in the storey zone.
        const along = faceN || faceS ? x : z;
        if (y >= gr + 1 && y <= gr + 3 && along % 3 !== 0) {
          id = "glass";
        } else if (y === yc) {
          id = "smooth_stone";
        }
      }

      put(x, y, z, id);
    }

    // Parapet with crenel-like piers.
    put(x, top, z, (x + z) % 4 === 0 ? "stone_brick_wall" : "white_concrete");
  } else {
    // Interior: floor slab, air gap, roof slab. No interior fit-out.
    put(x, gr, z, "polished_andesite");
    put(x, yc, z, "gray_concrete");

    // Warm lights behind the shopfront glass and the back windows.
    if (z === D - 2 && x % 8 === 2) put(x, gr + 2, z, "glowstone");
    if (z === 1 && x % 6 === 1) put(x, gr + 2, z, "shroomlight");

    // Roof plant: paired AC condenser blocks and a lightning rod.
    if (x % 9 === 4 && z === 3) {
      put(x, yc + 1, z, "light_gray_concrete");
      put(x, yc + 2, z, "light_gray_concrete");
    }
    if (x % 9 === 4 && z === 2) put(x, yc + 1, z, "iron_block");
    if (x === 15 && z === 3) put(x, yc + 1, z, "lightning_rod");
  }
}

g.save(`${DIR}/${ID}.nbt`);
