import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// No record for this parcel, so the building is a two-storey concrete commercial block
// (1990s Xinyi-district frontage): white concrete walls, gray base, red-tile cornice,
// light-blue glass grid, a shopfront with a door and hanging lantern on the north (street) side,
// a flat roof with a parapet, and a rooftop water tank and AC unit.
// Storeys: ground at y 0-4, upper at y 5-9, parapet to y 10 (roof about 11 blocks above lowest ground).

const ID = "OSMw538414161";
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 21, H = 23, D = 20;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));
const groundOf = (x, z) => ground.get(key(x, z));
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const isCorner = (x, z) => (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));
// true when the wall runs along x (its z-neighbour is outside the footprint)
const runsAlongX = (x, z) => !has(x, z - 1) || !has(x, z + 1);

const minZ = Math.min(...cells.map(([, z]) => z));
const frontCells = cells.filter(([x, z]) => z === minZ && isEdge(x, z)).map(([x]) => x).sort((a, b) => a - b);
const doorX = frontCells.length ? frontCells[Math.floor(frontCells.length / 2)] : null;

const inB = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
const put = (x, y, z, name, props) => {
  if (!inB(x, y, z)) return;
  if (props) g.set(x, y, z, name, props);
  else g.set(x, y, z, name);
};

const BODY_TOP = 10;   // parapet block row (roof surface at y 10)
const FLOOR_2 = 5;     // upper storey slab / storey line
const ROOF = 9;        // roof deck row, cornice band on edges

const paneProps = (x, z) => runsAlongX(x, z)
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };

// Pass 1: foundations, floor slabs, walls and openings
for (const [x, z, gr] of cells) {
  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const edge = isEdge(x, z);

  // floor slabs at ground, storey line and roof deck (only above this cell's ground)
  if (gr <= BODY_TOP) {
    put(x, gr, z, "smooth_stone");
    if (FLOOR_2 > gr) put(x, FLOOR_2, z, "smooth_stone");
    if (ROOF > gr) put(x, ROOF, z, "light_gray_concrete");
  }

  if (!edge) continue;

  const corner = isCorner(x, z);
  const bay = runsAlongX(x, z) ? x : z;
  const pattern = !corner && bay % 3 !== 0;
  const front = z === minZ;

  for (let y = gr; y <= BODY_TOP; y++) {
    if (y === 0) { put(x, y, z, "gray_concrete"); continue; }
    if (y === BODY_TOP) { put(x, y, z, "white_concrete"); continue; }          // parapet
    if (y === ROOF) { put(x, y, z, "red_terracotta"); continue; }             // cornice band
    if (y === FLOOR_2) { put(x, y, z, "smooth_stone"); continue; }            // storey line
    if (y === 4) { put(x, y, z, "white_concrete"); continue; }                // ground lintel

    if (y <= 3) {
      if (front) {
        if (x === doorX) {
          if (y === 1) { put(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
          if (y === 2) { put(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
          if (y === 3) { put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" }); continue; }
        }
        if (pattern || !corner) {
          if (x % 3 !== 0 || corner) { put(x, y, z, "glass"); continue; }
        }
        put(x, y, z, "white_concrete");
      } else {
        if (pattern && y >= 2) { put(x, y, z, "light_blue_stained_glass_pane", paneProps(x, z)); }
        else put(x, y, z, "white_concrete");
      }
      continue;
    }

    // upper storey, y 6..8
    if (pattern) {
      if (y === 6) { put(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" }); continue; }
      put(x, y, z, "light_blue_stained_glass_pane", paneProps(x, z));
    } else {
      put(x, y, z, "white_concrete");
    }
  }
}

// Pass 2: warm light behind some upper windows (glowstone in the air gap, inside the footprint)
for (const [x, z, gr] of cells) {
  if (!isEdge(x, z) || gr > 6) continue;
  const bay = runsAlongX(x, z) ? x : z;
  if (isCorner(x, z) || bay % 3 === 0) continue;
  const inward = [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]]
    .find(([nx, nz]) => has(nx, nz) && !isEdge(nx, nz));
  if (!inward) continue;
  if ((x * 5 + z * 3) % 4 === 0) put(inward[0], 7, inward[1], "glowstone");
}

// Pass 3: roof equipment on interior roof cells
const interiorCells = cells.filter(([x, z, gr]) => !isEdge(x, z) && gr <= ROOF);
const cx = Math.round(cells.reduce((s, [x]) => s + x, 0) / cells.length);
const cz = Math.round(cells.reduce((s, [, z]) => s + z, 0) / cells.length);
const tankCells = [[cx - 1, cz - 1], [cx, cz - 1], [cx - 1, cz], [cx, cz]];
const tankOk = tankCells.every(([x, z]) => has(x, z) && !isEdge(x, z) && groundOf(x, z) <= ROOF);
if (tankOk) {
  for (const [x, z] of tankCells) {
    put(x, 10, z, "white_concrete");
    put(x, 11, z, "white_concrete");
    put(x, 12, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}
const acCell = interiorCells.find(([x, z]) => !(tankOk && tankCells.some(([tx, tz]) => tx === x && tz === z)) && (x + z) % 5 === 0)
  || interiorCells.find(([x, z]) => !(tankOk && tankCells.some(([tx, tz]) => tx === x && tz === z)));
if (acCell) put(acCell[0], 10, acCell[1], "iron_block");

g.save(`${DIR}/${ID}.nbt`);
