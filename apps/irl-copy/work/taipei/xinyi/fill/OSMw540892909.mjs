import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540892909";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 20, H = 23, D = 22;
const g = new Voxels([W, H, D]);

// Roof deck sits at y=10 (surface 11 blocks above lowest ground); parapet at y=11.
const DECK = 10;
const PARAPET = 11;

const foot = new Map(); // "x,z" -> ground
for (const [x, z, gr] of cells) {
  foot.set(`${x},${z}`, Math.max(0, Math.min(H - 2, Math.round(gr))));
}
const has = (x, z) => foot.has(`${x},${z}`);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Outward / inward directions for perimeter cells.
const DIRS = [
  { dx: 0, dz: -1, name: "north" },
  { dx: 0, dz: 1, name: "south" },
  { dx: -1, dz: 0, name: "west" },
  { dx: 1, dz: 0, name: "east" },
];

// Door: on the north (min z) face, centred on x = 10.
let doorCell = null;
for (const [x, z] of [...foot.keys()].map((k) => k.split(",").map(Number))) {
  if (x === 10 && (!doorCell || z < doorCell[1])) doorCell = [x, z];
}
const doorKey = doorCell ? `${doorCell[0]},${doorCell[1]}` : null;

for (const [key, gr] of foot) {
  const [x, z] = key.split(",").map(Number);

  // 1. Foundation: solid from y0 up to the cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // 2. Roof deck across the whole footprint.
  if (DECK >= gr) put(x, DECK, z, "stone_bricks");

  // Missing neighbours => perimeter.
  const missing = DIRS.filter((d) => !has(x + d.dx, z + d.dz));
  const isPerim = missing.length > 0;

  if (!isPerim) {
    // Interior: floor slab at the second storey line, air above.
    const floorY = gr + 5;
    if (floorY < DECK) put(x, floorY, z, "smooth_stone");
    // Rooftop plant on a few interior cells.
    if (x >= 5 && x <= 7 && z >= 8 && z <= 10) put(x, PARAPET, z, "iron_block");
    continue;
  }

  const pier = x % 3 === 0 || z % 3 === 0;

  // 3. Facade walls, from ground to deck.
  for (let y = gr; y < DECK; y++) {
    const rel = y - gr;
    let id = "light_gray_concrete";
    let props;

    if (rel === 0) {
      id = "stone_bricks"; // base course
    } else if (rel <= 3) {
      // Ground-floor shopfront.
      id = pier ? "smooth_stone" : "glass";
    } else if (rel === 4) {
      id = "smooth_stone"; // lintel / storey line
    } else if (rel === 5) {
      id = "smooth_stone"; // storey line
    } else if (rel <= 8) {
      if (rel === 6) {
        // sill row: concrete only
        id = pier ? "white_concrete" : "light_gray_concrete";
      } else {
        id = pier ? "white_concrete" : "glass_pane";
      }
    } else if (rel === 9) {
      id = "smooth_stone"; // cornice band below roof
    }

    put(x, y, z, id, props);
  }

  // 4. Parapet on the perimeter.
  if (PARAPET > DECK) put(x, PARAPET, z, "stone_brick_wall");

  // 5. Warm lights behind some upper-floor windows.
  const winY = gr + 7;
  if (winY < DECK && !pier && (x + z) % 6 === 0 && missing.length === 1) {
    const m = missing[0];
    // inward is opposite the missing side
    const ix = x - m.dx, iz = z - m.dz;
    if (has(ix, iz)) put(ix, winY, iz, (x + z) % 12 === 0 ? "glowstone" : "shroomlight");
  }
}

// 6. Entrance on the north face: double-height door with a hanging lantern.
if (doorCell) {
  const [dx, dz] = doorCell;
  const gr = foot.get(doorKey);
  put(dx, gr + 1, dz, "dark_oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(dx, gr + 2, dz, "dark_oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  put(dx, gr + 3, dz, "lantern", { hanging: "true" });
  // Stone threshold step at the door.
  put(dx, gr, dz, "stone_brick_stairs", { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
