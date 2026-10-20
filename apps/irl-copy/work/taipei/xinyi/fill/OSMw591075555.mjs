import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw591075555";
const W = 13, H = 20, D = 8;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const g = new Voxels([W, H, D]);

// Design: two-storey mid-century concrete shophouse, tiled/quartz facade,
// shopfront ground floor, aluminium-framed blue glass, warm lit upper windows,
// stone cornice and a small rooftop plant box. Roof top sits 8 blocks above
// the lowest ground (r = 7 cornice/roof slab, top of block = g + 8).
for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const ns = !has(x, z - 1) || !has(x, z + 1); // exposed on a z-facing face
  const ew = !has(x - 1, z) || !has(x + 1, z); // exposed on an x-facing face
  const perim = ns || ew;
  const corner = ns && ew;
  const pos = corner ? 0 : (ns ? x : z);       // position along the face
  const pier = corner || pos % 3 === 0;        // vertical concrete piers
  const frontDoor = !has(x, z - 1) && x === 6; // entrance on the z=0 street face
  const lit = (r) => r === 5 && ((z === 7 && (x === 4 || x === 8)) || (x === 0 && z === 2));

  // r = 0: base course (perimeter) or ground floor slab (interior)
  g.set(x, gr, z, perim ? "polished_andesite" : "smooth_stone");

  // Storey 1, r = 1..3
  if (perim) {
    if (frontDoor) {
      g.set(x, gr + 1, z, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(x, gr + 2, z, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    } else if (pier) {
      g.set(x, gr + 1, z, "white_concrete");
      g.set(x, gr + 2, z, "white_concrete");
    } else {
      g.set(x, gr + 1, z, "light_blue_stained_glass");
      g.set(x, gr + 2, z, "light_blue_stained_glass");
    }
    // Fascia / sign band over the shopfronts
    g.set(x, gr + 3, z, "gray_concrete");
  }
  // Interior: air gap r = 1..3

  // Storey line / floor slab at r = 4
  g.set(x, gr + 4, z, "smooth_stone");

  // Storey 2, r = 5..6
  if (perim) {
    for (const r of [5, 6]) {
      if (pier) {
        g.set(x, gr + r, z, "white_concrete");
      } else if (r === 5 && lit(r)) {
        g.set(x, gr + r, z, "glowstone");
      } else {
        g.set(x, gr + r, z, "light_blue_stained_glass");
      }
    }
  }
  // Interior: air gap r = 5..6

  // Roof slab / cornice at r = 7
  g.set(x, gr + 7, z, perim ? "stone_bricks" : "smooth_stone");

  // Rooftop plant box on the roof, interior cells only
  if (!perim && x >= 3 && x <= 5 && z >= 2 && z <= 5 && gr + 9 < H) {
    g.set(x, gr + 8, z, "light_gray_concrete");
    g.set(x, gr + 9, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
