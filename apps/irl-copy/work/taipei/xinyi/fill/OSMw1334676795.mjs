import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1334676795";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 9, H = 19, D = 7;
const g = new Voxels([W, H, D]);

// Footprint lookup: key "x,z" -> ground height
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.floor(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const groundAt = (x, z) => ground.get(`${x},${z}`);
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const missingNb = (x, z) => NB.filter(([dx, dz]) => !has(x + dx, z + dz)).length;
const isEdge = (x, z) => missingNb(x, z) > 0;
const isCorner = (x, z) => missingNb(x, z) >= 2;
const maxZ = Math.max(...cells.map(([, z]) => z));

const set = (x, y, z, id, props) => g.set(x, y, z, id, props);

const GLASS = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };

for (const [x, z] of cells.map(([cx, cz]) => [cx, cz])) {
  const G0 = groundAt(x, z);
  const edge = isEdge(x, z);
  const corner = isCorner(x, z);
  const doorCell = edge && x === 4 && z === maxZ;

  // Foundation below the cell's own ground
  for (let y = 0; y < G0; y++) set(x, y, z, "stone_bricks");

  // Ground floor slab / plinth course
  set(x, G0, z, edge ? "stone_bricks" : "smooth_stone");

  // Ground storey: shopfront glazing with mullions, door at centre front
  if (edge) {
    if (doorCell) {
      set(x, G0 + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      set(x, G0 + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      set(x, G0 + 3, z, "stone_bricks");
    } else {
      for (let dy = 1; dy <= 3; dy++) {
        if (corner || (x + z) % 2 === 0) {
          set(x, G0 + dy, z, "white_concrete");
        } else {
          set(x, G0 + dy, z, "light_blue_stained_glass_pane", GLASS);
        }
      }
    }
  }

  // Storey slab / lintel band (edge walls) and ceiling slab (interior)
  set(x, G0 + 4, z, edge ? "stone_bricks" : "smooth_stone");

  // Cornice course on the edge, roof deck inside
  set(x, G0 + 5, z, edge ? "stone_brick_slab" : "light_gray_concrete", edge ? { type: "bottom", waterlogged: "false" } : undefined);

  // Parapet ring on the edge
  if (edge) set(x, G0 + 6, z, "white_concrete");

  // Roof equipment: small rooftop plant block on an interior cell
  if (!edge && x === 2 && z === 3) set(x, G0 + 6, z, "iron_block");
}

// Warm light in the room behind some shopfront glass
for (const [x, z] of cells.map(([cx, cz]) => [cx, cz])) {
  if (!isEdge(x, z)) continue;
  const G0 = groundAt(x, z);
  if ((x + z) % 2 === 0) continue; // only glass cells
  if (x === 4 && z === maxZ) continue;
  if ((x * 3 + z) % 5 !== 0) continue;
  for (const [dx, dz] of NB) {
    const nx = x + dx, nz = z + dz;
    if (has(nx, nz) && !isEdge(nx, nz)) {
      set(nx, G0 + 2, nz, "glowstone");
      break;
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
