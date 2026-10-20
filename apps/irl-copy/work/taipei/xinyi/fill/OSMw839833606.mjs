import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const W = 28, H = 23, D = 28;
const ROOF = 11;               // roof/parapet top, 11 blocks above lowest ground
const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw839833606";

const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));
const minG = Math.min(...cells.map((c) => c[2]));
const g = new Voxels([W, H, D]);

function put(x, y, z, block, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

for (const [x, z, groundRaw] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  // foundation top (first building block) relative to lowest ground
  const b = Math.min(Math.max(groundRaw - minG, 0), 9);

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");

  const ring = Math.min(x, z, 27 - x, 27 - z);
  const onZ = z === 0 || z === 27;
  const onX = x === 0 || x === 27;
  const isCorner = onZ && onX;
  const t = onZ ? x : z;            // position along the face
  const tt = (z <= 1 || z >= 26) ? x : z; // position along the face for ring-1 lighting

  if (ring === 0) {
    // outer shell: shopfronts, two storeys of window grid, cornice, parapet
    for (let y = b; y <= ROOF; y++) {
      if (y <= 4) {
        // ground storey
        if (y === 4) { put(x, y, z, "smooth_quartz"); continue; }
        if (isCorner || t % 4 === 0) { put(x, y, z, "smooth_quartz"); continue; }
        if (onZ && z === 27 && t === 13 && b <= 3) {
          if (y === b) {
            put(x, y, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
          } else if (y === b + 1) {
            put(x, y, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
          } else {
            put(x, y, z, "glass");
          }
          continue;
        }
        put(x, y, z, "glass");
      } else if (y === 5) {
        put(x, y, z, "smooth_stone");        // storey line
      } else if (y <= 8) {
        if (isCorner || t % 3 === 0) put(x, y, z, "white_concrete");   // mullions
        else put(x, y, z, "glass");
      } else if (y === 9) {
        put(x, y, z, "smooth_quartz");       // window head band
      } else if (y === 10) {
        put(x, y, z, "smooth_quartz");       // cornice course
      } else if (y === ROOF) {
        put(x, y, z, "quartz_slab", { type: "bottom", waterlogged: "false" }); // parapet cap
      }
    }
  } else {
    // interior: air behind glass, floor slab at y 5, roof deck at y 10
    if (5 >= b) put(x, 5, z, "smooth_stone");
    if (10 >= b) put(x, 10, z, "gray_concrete");
    // warm lights behind some upper windows
    if (ring === 1 && b <= 7 && tt % 6 === 2) put(x, 7, z, "glowstone");
    // roof equipment and a mast on the roof
    if (ring >= 3) {
      if ((x === 9 || x === 18) && (z === 9 || z === 18)) put(x, 11, z, "iron_block");
      if (x === 14 && z === 14) {
        for (let y = 11; y <= 13; y++) put(x, y, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
      }
    }
  }
}

g.save(`${dir}/${id}.nbt`);
