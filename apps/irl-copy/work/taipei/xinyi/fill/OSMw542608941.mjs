import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542608941";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 17 x 23 x 18 volume. Two-storey 1990s Xinyi commercial block: shopfront ground floor,
// one upper storey of glazed bays with white piers, a quartz cornice and parapet, roof plant.
const W = 17, H = 23, D = 18;
const vox = new Voxels([W, H, D]);

const ROOF = 10;      // roof deck at y=10 (top surface 11 blocks above lowest ground)
const FLOOR2 = 5;     // storey line / upper floor slab
const CORNICE = 9;

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), Math.max(0, Math.min(8, Math.round(gr))));
}
const has = (x, z) => ground.has(key(x, z));
const gOf = (x, z) => ground.get(key(x, z));

const put = (x, y, z, block, props) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) vox.set(x, y, z, block, props);
  else vox.set(x, y, z, block);
};

const DIRS = [
  { name: "north", dx: 0, dz: -1 },
  { name: "south", dx: 0, dz: 1 },
  { name: "west", dx: -1, dz: 0 },
  { name: "east", dx: 1, dz: 0 },
];

// Exposed faces per cell
const exposedOf = (x, z) => DIRS.filter((d) => !has(x + d.dx, z + d.dz));

// Entrance: centre of the south-facing street frontage
let southMin = Infinity, southMax = -Infinity;
for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  if (exposedOf(x, z).some((d) => d.name === "south")) {
    southMin = Math.min(southMin, x);
    southMax = Math.max(southMax, x);
  }
}
const doorX = Math.floor((southMin + southMax) / 2);

for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  const gr = gOf(x, z);
  const exposed = exposedOf(x, z);
  const perim = exposed.length > 0;

  // Foundation fill from y=0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Ground floor slab / base course
  put(x, gr, z, perim ? "polished_andesite" : "smooth_stone");

  // Interior upper floor slab where the column is still open below the storey line
  if (!perim && FLOOR2 > gr) put(x, FLOOR2, z, "smooth_stone");

  // Roof deck (interior) / parapet (perimeter)
  put(x, ROOF, z, perim ? "smooth_quartz" : "light_gray_concrete");

  if (!perim) {
    // Roof plant: small air-handling units on a sparse pattern
    if ((x * 3 + z * 5) % 11 === 0 && ROOF > gr) put(x, ROOF + 1, z, "iron_block");
    continue;
  }

  // Facade: use the first exposed face for articulation
  const f = exposed[0];
  const i = f.name === "north" || f.name === "south" ? x : z;
  const inX = x - f.dx, inZ = z - f.dz; // interior neighbour

  for (let y = gr + 1; y <= CORNICE; y++) {
    if (y === CORNICE) {
      put(x, y, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }
    if (y === FLOOR2) {
      put(x, y, z, "white_concrete");
      continue;
    }
    if (y <= 4) {
      // Ground storey: shopfront zone up to gr+3, quartz wall above it
      if (y <= gr + 3) {
        if (f.name === "south" && i === doorX && (y === gr + 1 || y === gr + 2)) {
          const half = y === gr + 1 ? "lower" : "upper";
          put(x, y, z, "dark_oak_door", {
            facing: "south", half, hinge: "left", open: "false", powered: "false",
          });
        } else if (i % 3 === 0) {
          put(x, y, z, "white_concrete");
        } else {
          put(x, y, z, "glass");
        }
      } else {
        put(x, y, z, "smooth_quartz");
      }
      continue;
    }
    // Upper storey: glazed bays between white piers
    if (i % 3 === 0) {
      put(x, y, z, "white_concrete");
    } else {
      put(x, y, z, "light_blue_stained_glass");
      // Warm light behind some upper windows
      if (((i * 7 + y) % 5) === 0 && has(inX, inZ)) {
        put(inX, y, inZ, "glowstone");
      }
    }
  }

  // Hanging lantern just inside the entrance
  if (f.name === "south" && i === doorX && has(inX, inZ)) {
    put(inX, gr + 3, inZ, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

vox.save(`${DIR}/${ID}.nbt`);
