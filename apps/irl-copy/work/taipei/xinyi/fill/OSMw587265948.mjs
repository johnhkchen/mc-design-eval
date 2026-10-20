import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Xinyi mid-rise commercial block, c. 1990s: white and light-grey concrete frame,
// quartz piers, blue-glass strip windows, granite shopfront with a canopy and doors.
// Roofline sits about 21 blocks above the lowest ground (parapet top at y 21).
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw587265948";
const W = 57, D = 18, H = 33;

const FLOORS = [5, 10, 15];   // storey lines, 5 blocks per storey (four storeys)
const ROOF = 19;              // roof deck (cornice on facade)
const PARAPET = 20;           // parapet cap, top of building at y 21

const PANE_X = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_Z = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const DOOR = (half, hinge) => ({ facing: "north", half, hinge, open: "false", powered: "false" });
const SLAB_TOP = { type: "top", waterlogged: "false" };

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const gmap = new Map();
for (const [x, z, gr] of cells) {
  gmap.set(`${x},${z}`, Math.max(0, Math.min(14, Math.round(gr))));
}
const has = (x, z) => gmap.has(`${x},${z}`);
const xmin = Math.min(...cells.map(c => c[0]));
const xmax = Math.max(...cells.map(c => c[0]));
const zmin = Math.min(...cells.map(c => c[1]));
const zmax = Math.max(...cells.map(c => c[1]));

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Pass 1: foundations, floors, facades, interiors, roof
for (const [x, z] of cells) {
  const gr = gmap.get(`${x},${z}`);
  const front = !has(x, z - 1);
  const back = !has(x, z + 1);
  const wend = !has(x - 1, z);
  const eend = !has(x + 1, z);
  const facade = front || back || wend || eend;
  const alongX = front || back;

  // Foundation solid up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Base course / ground floor slab
  put(x, gr, z, facade ? "polished_granite" : "smooth_stone");

  // Storey floor slabs (interior) and storey lines (facade)
  for (const f of FLOORS) {
    if (f > gr && f < ROOF) {
      put(x, f, z, facade ? "light_gray_concrete" : "smooth_stone");
    }
  }

  if (facade) {
    const along = alongX ? x : z;
    const amin = alongX ? xmin : zmin;
    const amax = alongX ? xmax : zmax;
    const pier = (along - amin) % 3 === 0 || along === amax;

    for (let y = gr + 1; y < ROOF; y++) {
      if (y > gr && FLOORS.includes(y)) continue; // storey line already placed

      let fl = gr;
      for (const f of FLOORS) if (f > gr && f <= y) fl = f;
      const r = y - fl;

      if (r === 4) {
        put(x, y, z, "white_concrete"); // transom under next storey line
        continue;
      }

      // Front entrance: double doors on the ground storey, centred
      if (front && (x === 27 || x === 28) && fl === gr && (r === 1 || r === 2)) {
        put(x, y, z, "oak_door", DOOR(r === 1 ? "lower" : "upper", x === 27 ? "left" : "right"));
        continue;
      }

      if (pier) {
        put(x, y, z, "quartz_block");
      } else {
        put(x, y, z, "light_blue_stained_glass_pane", alongX ? PANE_X : PANE_Z);
      }
    }

    // Roof: cornice and parapet ring
    put(x, ROOF, z, "smooth_quartz");
    put(x, PARAPET, z, "smooth_quartz");
  } else {
    // Interior: air above the floor plates; roof deck only
    put(x, ROOF, z, "light_gray_concrete");

    // Rooftop plant units
    const plant =
      (x >= 9 && x <= 11 && z >= 5 && z <= 7) ||
      (x >= 44 && x <= 46 && z >= 9 && z <= 10);
    if (plant) put(x, PARAPET, z, "gray_concrete");
  }
}

// Pass 2: canopy over the entrance (front, ground storey) when it fits under the first storey line
for (const [x, z] of cells) {
  if (z !== zmin) continue;
  const gr = gmap.get(`${x},${z}`);
  const row = gr + 3;
  if (x >= 25 && x <= 30 && row < FLOORS[0]) {
    put(x, row, z, "stone_brick_slab", SLAB_TOP);
    if (has(x, z + 1)) put(x, row, z + 1, "stone_brick_slab", SLAB_TOP);
  }
}

// Pass 3: warm lights behind the glass (interior glowstone one block behind the pane)
for (const [x, z] of cells) {
  const gr = gmap.get(`${x},${z}`);
  const frontRow = z === zmin && x % 9 === 5 && x !== 27 && x !== 28;
  const backRow = z === zmax && x % 9 === 2;
  if (!frontRow && !backRow) continue;
  const lz = frontRow ? zmin + 1 : zmax - 1;
  if (!has(x, lz)) continue;
  const floors = [gr, ...FLOORS.filter(f => f > gr)];
  for (const f of floors) {
    const y = f + 2;
    if (y < ROOF && (f + 2) !== f + 4) put(x, y, lz, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
