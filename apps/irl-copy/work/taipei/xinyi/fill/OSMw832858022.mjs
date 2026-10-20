import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise two-storey commercial block, c. 1980s Taipei: white tiled walls,
// quartz frames, ribbon glazing, granite-look plinth, flat roof with plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw832858022";
const W = 17, H = 23, D = 21;

const L1 = 5;     // first-floor slab level (storey line)
const DECK = 10;  // roof deck / cornice level
const ROOF = 11;  // parapet top (about 11 blocks above lowest ground)
const CX = Math.floor(W / 2); // entrance column on the front (north) face

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, g] of cells) ground.set(`${x},${z}`, g);

const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const faceOf = (x, z) =>
  !has(x, z - 1) ? "N" : !has(x, z + 1) ? "S" : !has(x - 1, z) ? "W" : "E";

const g = new Voxels([W, H, D]);

// Pass 1: foundations, interior floor slabs, roof deck, facade.
for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (!isEdge(x, z)) {
    // Interior: floor slab per storey and roof deck; air between (no interiors).
    if (gr <= L1) g.set(x, L1, z, "smooth_stone");
    g.set(x, DECK, z, "light_gray_concrete");
    continue;
  }

  // Exterior wall ring.
  const face = faceOf(x, z);
  const front = face === "N";
  const k = face === "N" || face === "S" ? x : z; // position along the face
  const isDoorCol = front && x === CX;
  const doorOK = gr + 1 <= L1 - 1;

  // Roof deck and cornice sit on the wall ring.
  g.set(x, DECK, z, "smooth_quartz");
  g.set(x, ROOF, z, "smooth_quartz"); // parapet

  for (let y = gr; y < DECK; y++) {
    let b;
    if (y === gr) {
      // Plinth at street level; the door column opens into the lobby instead.
      if (isDoorCol && doorOK) {
        g.set(x, y, z, "dark_oak_door", {
          facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      b = "polished_andesite";
    } else if (y <= L1 - 1) {
      // Ground storey: shopfront glazing, lintel on top.
      if (y === L1 - 1) {
        if (isDoorCol && doorOK && y <= gr + 1) {
          // door upper half handled below
        }
        b = "light_gray_concrete";
      } else {
        b = k % 3 === 0 ? "smooth_quartz" : "glass_pane";
      }
      if (isDoorCol && doorOK && y === gr + 1) {
        g.set(x, y, z, "dark_oak_door", {
          facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
    } else if (y === L1) {
      b = "light_gray_concrete"; // storey line
    } else if (y <= 8) {
      // Upper storey ribbon windows with quartz mullions.
      b = k % 3 === 0 ? "smooth_quartz" : "glass_pane";
    } else {
      // Sill / spandrel band (y = 9).
      b = k % 3 === 0 ? "smooth_quartz" : "light_gray_concrete";
    }
    g.set(x, y, z, b);
  }

  // Warm light behind some upper windows (interior cell just inside the glass).
  if (k % 6 === 1) {
    const [ix, iz] =
      face === "N" ? [x, z + 1] : face === "S" ? [x, z - 1] : face === "W" ? [x + 1, z] : [x - 1, z];
    if (has(ix, iz) && !isEdge(ix, iz)) g.set(ix, 7, iz, "glowstone");
  }
}

// Lobby lantern just inside the entrance, on the ground floor.
if (has(CX, 1) && gAt(CX, 0) !== undefined && gAt(CX, 0) + 1 <= L1 - 1) {
  const gr = gAt(CX, 1);
  g.set(CX, gr, 1, "lantern", { hanging: "false" });
}

// Pass 2: roof plant on the roof deck (every cell checked against the footprint).
const roofBox = (x0, x1, z0, z1, y0, y1, block) => {
  for (let x = x0; x <= x1; x++)
    for (let z = z0; z <= z1; z++)
      if (has(x, z))
        for (let y = y0; y <= y1; y++) g.set(x, y, z, block);
};

// Water tank on the back-left corner, with a lightning rod.
roofBox(2, 4, 15, 17, ROOF, ROOF + 2, "white_concrete");
roofBox(2, 4, 15, 17, ROOF + 3, ROOF + 3, "smooth_stone");
if (has(3, 16)) g.set(3, ROOF + 4, 16, "lightning_rod", { facing: "up" });

// Two AC / plant units on the back-right.
roofBox(11, 12, 3, 4, ROOF, ROOF, "iron_block");
roofBox(14, 15, 3, 4, ROOF, ROOF, "iron_block");

g.save(`${DIR}/${ID}.nbt`);
