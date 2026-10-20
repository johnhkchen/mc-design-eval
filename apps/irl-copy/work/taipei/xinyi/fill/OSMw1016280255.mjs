import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280255";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 7, H = 33, D = 21;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground offset
const groundAt = new Map();
for (const [x, z, gr] of cells) groundAt.set(`${x},${z}`, gr);
const has = (x, z) => groundAt.has(`${x},${z}`);

// Bounded setter: silently skips anything outside the volume
function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Pane connection props (glass panes read as continuous curtain wall)
const PANE = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };
const DOOR_LOWER = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" };
const DOOR_UPPER = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" };

// Entrance: a north-facing (lowest z) perimeter cell nearest the middle of the frontage
let doorKey = null;
{
  let best = Infinity;
  for (const [x, z] of cells.map(c => [c[0], c[1]])) {
    if (has(x, z - 1)) continue; // not on north face
    const d = Math.abs(x - 3);
    if (d < best) { best = d; doorKey = `${x},${z}`; }
  }
}

const STOREYS = 4;      // 4 storeys x 5 blocks = 20, roof slab at +20
const STOREY_H = 5;

for (const [x, z, gr] of cells) {
  // Foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  const exp = {
    n: !has(x, z - 1),
    s: !has(x, z + 1),
    w: !has(x - 1, z),
    e: !has(x + 1, z),
  };
  const nExp = Object.values(exp).filter(Boolean).length;
  const perim = nExp > 0;
  const corner = nExp >= 2;
  const isDoor = doorKey === `${x},${z}`;

  for (let k = 0; k < STOREYS; k++) {
    const base = gr + k * STOREY_H;
    const ground = k === 0;

    // Floor slab / base course at storey line
    if (ground && perim) put(x, base, z, "stone_bricks");
    else put(x, base, z, "light_gray_concrete");

    if (!perim) continue; // interior cells: slab only, air gap behind

    if (ground) {
      // Shopfront: glass with dark frame, sign band, white transom
      for (let dy = 1; dy <= 2; dy++) {
        if (isDoor && dy === 1) continue;
        if (isDoor && dy === 2) continue;
        if (corner) put(x, base + dy, z, "stone_bricks");
        else put(x, base + dy, z, "glass_pane", PANE);
      }
      put(x, base + 3, z, corner ? "stone_bricks" : "black_concrete");
      put(x, base + 4, z, "white_concrete");
      if (isDoor) {
        put(x, base + 1, z, "dark_oak_door", DOOR_LOWER);
        put(x, base + 2, z, "dark_oak_door", DOOR_UPPER);
        put(x, base + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      }
    } else {
      // Upper storeys: window band (mullions in light gray, warm lights in some)
      for (let dy = 1; dy <= 3; dy++) {
        if (corner) {
          put(x, base + dy, z, "white_concrete");
          continue;
        }
        const idx = (x + z + dy) % 3;
        if (dy === 2 && (x * 3 + z * 5 + k) % 7 === 0) {
          put(x, base + dy, z, "glowstone");          // lit room behind glass
        } else if (idx === 0) {
          put(x, base + dy, z, "light_gray_concrete"); // mullion
        } else {
          put(x, base + dy, z, "glass_pane", PANE);
        }
      }
      // Spandrel between windows and next storey
      put(x, base + 4, z, "white_concrete");
    }
  }

  // Roof slab at storey 4 line
  const roofY = gr + STOREYS * STOREY_H;
  put(x, roofY, z, "light_gray_concrete");

  if (perim) {
    // Parapet with stone cap
    put(x, roofY + 1, z, "white_concrete");
    put(x, roofY + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Rooftop water tank and plant in the middle of the roof (interior cells only)
for (const [x, z, gr] of cells) {
  if (x < 2 || x > 4 || z < 9 || z > 11) continue;
  const roofY = gr + STOREYS * STOREY_H;
  const isPerim = [!has(x, z - 1), !has(x, z + 1), !has(x - 1, z), !has(x + 1, z)].some(Boolean);
  if (isPerim) continue;
  put(x, roofY + 1, z, "iron_block");
  put(x, roofY + 2, z, "iron_block");
  put(x, roofY + 3, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
