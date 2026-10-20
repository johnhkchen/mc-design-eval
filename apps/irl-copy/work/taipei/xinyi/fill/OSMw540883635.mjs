import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw540883635";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 7, H = 23, D = 7;
const g = new Voxels([W, H, D]);

// Ground per footprint cell; B is the common floor level (highest cell ground),
// so every storey sits level and lower cells get foundation fill up to B.
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const B = Math.max(...cells.map((c) => c[2]));

const put = (x, y, z, block, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// Articulation (o = offset above floor level B):
//  o 0      ground slab / base course
//  o 1..4   ground storey: shopfront glass, white pillars, lintel band at o 4, entrance on south
//  o 5      first floor slab
//  o 6..9   second storey: sill/head bands at o 6 and 9, light glass between pillars
//  o 10     roof slab
//  o 11     parapet ring, plus two plant blocks on the roof
for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  const edgeX = x === 0 || x === W - 1;
  const edgeZ = z === 0 || z === D - 1;
  const corner = edgeX && edgeZ;
  const edge = edgeX || edgeZ;
  const i = edgeX ? z : x;           // position along the face
  const pillar = corner || i === 1 || i === 5;
  const onSouth = z === D - 1;
  const onNorth = z === 0;

  // Foundation: solid from y 0 up to the floor level under every cell.
  for (let y = 0; y < B; y++) put(x, y, z, "stone_bricks");

  // Floor slabs at o 0, 5, 10 across the whole footprint.
  put(x, B, z, "polished_andesite");
  put(x, B + 5, z, "smooth_stone");
  put(x, B + 10, z, "smooth_stone");

  if (edge) {
    // Ground storey, o 1..4
    for (let o = 1; o <= 4; o++) {
      const y = B + o;
      if (pillar || o === 4) {
        put(x, y, z, "white_concrete");
      } else if (onSouth && x === 3 && o <= 2) {
        if (o === 1) {
          put(x, y, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
        } else {
          put(x, y, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
        }
      } else {
        put(x, y, z, "glass");
      }
    }

    // Second storey, o 6..9
    for (let o = 6; o <= 9; o++) {
      const y = B + o;
      if (pillar || o === 6 || o === 9) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "light_blue_stained_glass");
      }
    }

    // Parapet ring
    put(x, B + 11, z, "white_concrete");
  }
}

// Warm lights behind glass on the north face (interior cells at z = 1)
put(3, B + 2, 1, "glowstone");
put(3, B + 7, 1, "shroomlight");
put(3, B + 2, 1, "glowstone");
put(1, B + 7, 1, "glowstone");

// Roof equipment: two plant blocks and a rod on the roof
put(2, B + 11, 3, "stone_bricks");
put(4, B + 11, 3, "stone_bricks");
put(3, B + 11, 3, "lightning_rod", { facing: "up", powered: "false" });

g.save(`${dir}/${id}.nbt`);
