import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833604";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 21, H = 23, D = 20;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const edge = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);

// Base level: the highest footprint ground. Everything below it is solid plinth.
const B = Math.max(...cells.map(c => c[2]));

const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p); else g.set(x, y, z, id);
};

// Layout (y relative to B):
//  B      ground slab            B+1..B+4  storey 1 walls (4 rows)
//  B+5    storey 2 floor slab    B+6..B+9  storey 2 walls (4 rows)
//  B+10   roof slab / cornice    B+11      parapet (roof ~11 above base)

// Pass 1: foundation, floor slabs, interior air is left empty.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < B; y++) put(x, y, z, "stone_bricks");
  put(x, B, z, "light_gray_concrete");
  put(x, B + 5, z, "light_gray_concrete");
  put(x, B + 10, z, "gray_concrete");
}

// Pass 2: street-facing and perimeter walls.
// Front is the z = 0 face; the shopfront lives there.
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  if (!edge(x, z)) continue;
  const pier = (x + z) % 3 === 0;
  const front = !has(x, z - 1);

  // Storey 1: shopfront on the front, punched windows elsewhere.
  if (front) {
    const b = B + 1;
    for (let y = b; y <= b + 2; y++) {
      if (pier) put(x, y, z, "white_concrete");
      else put(x, y, z, "glass");
    }
    put(x, B + 4, z, "smooth_stone");
    if (x === 10) {
      put(x, b, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, b + 1, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    }
    if (!pier && x !== 10) {
      // keep glass but show a fascia course above the shopfront
    }
    put(x, B + 3, z, pier ? "white_concrete" : "glass");
  } else {
    storeyWall(x, z, pier, B + 1);
  }

  // Storey 2: window grid on every face.
  storeyWall(x, z, pier, B + 6);

  // Cornice and parapet.
  put(x, B + 10, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  put(x, B + 11, z, "white_concrete");
}

function storeyWall(x, z, pier, b) {
  put(x, b, z, "light_gray_concrete");       // spandrel bottom
  put(x, b + 3, z, "light_gray_concrete");   // spandrel top
  for (const y of [b + 1, b + 2]) {
    put(x, y, z, pier ? "white_concrete" : "light_blue_stained_glass");
  }
}

// Pass 3: rooftop plant room in the middle.
for (let x = 7; x <= 12; x++) {
  for (let z = 7; z <= 11; z++) {
    if (has(x, z) && !edge(x, z)) {
      put(x, B + 11, z, "light_gray_concrete");
      if (x >= 8 && x <= 11 && z >= 8 && z <= 10) put(x, B + 12, z, "iron_block");
    }
  }
}

// Pass 4: warm lights behind some windows (glowstone set back inside the bay).
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  if (!edge(x, z) || !has(x, z - 1) === false && !(has(x, z - 1) === false)) {}
  if (!edge(x, z)) continue;
  if (!has(x, z - 1)) continue; // skip shopfront row for glow
  const dx = has(x + 1, z) && has(x - 1, z) ? 0 : has(x + 1, z) ? 1 : has(x - 1, z) ? -1 : 0;
  const dz = has(x, z + 1) && has(x, z - 1) ? 0 : has(x, z + 1) ? 1 : has(x, z - 1) ? -1 : 0;
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz) || edge(ix, iz)) continue;
  if (((x * 5 + z * 3) % 13) !== 0) continue;
  put(ix, B + 7, iz, "glowstone");
}

// Entrance lanterns inside the lobby.
put(9, B + 1, 1, "lantern", { hanging: "false", waterlogged: "false" });
put(11, B + 1, 1, "lantern", { hanging: "false", waterlogged: "false" });

g.save(`${DIR}/${ID}.nbt`);
