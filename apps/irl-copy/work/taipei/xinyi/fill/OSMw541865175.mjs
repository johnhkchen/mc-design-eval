import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541865175";
const W = 16, H = 23, D = 20;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const inside = (x, z) => ground.has(`${x},${z}`);

// Lowest ground under the footprint anchors every level.
const L0 = Math.min(...cells.map((c) => Math.round(c[2])));
const GROUND_TOP = L0 + 5;   // ground storey 0..4, slab at L0+5
const FLOOR2 = L0 + 5;       // second-storey floor slab
const ROOF = L0 + 10;        // roof deck (top surface ~11 blocks above lowest ground)
const PARAPET = L0 + 11;     // parapet ring on the perimeter

// Only ever place blocks on footprint cells, inside the volume.
function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (!inside(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const perimeter = (x, z) =>
  !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);

// Facade identity. Street frontage is the south face (z = D-1).
const isFront = (x, z) => z === D - 1;
const isBack = (x, z) => z === 0;
const isSide = (x, z) => x === 0 || x === W - 1;
const isCorner = (x, z) => (x === 0 || x === W - 1) && (z === 0 || z === D - 1);

// Window bays: piers every third cell on the long faces, 1..14 and 1..18 respectively.
function isWindow(x, z) {
  if (isCorner(x, z)) return false;
  if (isFront(x, z) || isBack(x, z)) return x >= 1 && x <= 14 && x % 3 !== 0;
  if (isSide(x, z)) return z >= 1 && z <= 18 && z % 3 !== 0;
  return false;
}

const glassProps = (x, z) =>
  isFront(x, z) || isBack(x, z)
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };

// Pass 1: foundation, walls, floors, roof.
for (const [x, z, gr] of cells) {
  const gi = Math.round(gr);
  const per = perimeter(x, z);

  // Foundation fills from y=0 up to this cell's ground.
  for (let y = 0; y < gi; y++) put(x, y, z, "stone_bricks");

  // Roof deck and floor slabs run across the whole footprint.
  put(x, ROOF, z, "smooth_stone");
  put(x, FLOOR2, z, "smooth_stone");

  if (!per) {
    // Interior: air gap, floors only (already placed above where applicable).
    continue;
  }

  // Parapet ring on the perimeter, above the roof deck.
  put(x, PARAPET, z, "stone_brick_wall");

  // Base course at the first wall course on this cell.
  if (gi <= ROOF) put(x, gi, z, "stone_bricks");

  for (let y = Math.max(gi + 1, L0); y < ROOF; y++) {
    if (y === FLOOR2) continue; // slab already placed

    const groundStorey = y < GROUND_TOP;

    if (groundStorey) {
      if (isFront(x, z)) {
        // Shopfront band L0+1..L0+3, sign band at L0+4.
        if (y === L0 + 4) {
          put(x, y, z, (x === 3 || x === 11) ? "lantern" : "red_concrete",
            (x === 3 || x === 11) ? { hanging: "false", waterlogged: "false" } : undefined);
        } else if (y >= L0 + 1 && y <= L0 + 3) {
          if (x === 7) {
            if (y === L0 + 1) put(x, y, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
            else if (y === L0 + 2) put(x, y, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
            else put(x, y, z, "white_concrete");
          } else if (x === 0 || x === W - 1) {
            put(x, y, z, "white_concrete");
          } else if (x === 1 || x === 5 || x === 9 || x === 13) {
            put(x, y, z, "dark_oak_planks");
          } else {
            put(x, y, z, "glass_pane", glassProps(x, z));
          }
        } else {
          put(x, y, z, "white_concrete");
        }
      } else if (isWindow(x, z) && y >= L0 + 1 && y <= L0 + 3) {
        put(x, y, z, "glass_pane", glassProps(x, z));
      } else {
        put(x, y, z, "white_concrete");
      }
    } else {
      // Upper storey L0+6..L0+9: sill, two glazed rows, lintel.
      if (isWindow(x, z)) {
        if (y === L0 + 6) put(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
        else if (y === L0 + 7 || y === L0 + 8) put(x, y, z, "glass_pane", glassProps(x, z));
        else put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "white_concrete");
      }
    }
  }
}

// Pass 2: warm light behind some upper-storey glazing.
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (!perimeter(x, z) || !isWindow(x, z)) continue;
  if (((x * 7 + z * 3) % 4) !== 0) continue;
  let ix = x, iz = z;
  if (isFront(x, z)) iz = z - 1;
  else if (isBack(x, z)) iz = z + 1;
  else if (x === 0) ix = x + 1;
  else if (x === W - 1) ix = x - 1;
  if (!inside(ix, iz) || perimeter(ix, iz)) continue;
  put(ix, L0 + 7, iz, "glowstone");
}

// Pass 3: rooftop water tank on the roof deck.
for (let x = 2; x <= 3; x++) {
  for (let z = 2; z <= 3; z++) {
    put(x, ROOF + 1, z, "iron_block");
    put(x, ROOF + 2, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
