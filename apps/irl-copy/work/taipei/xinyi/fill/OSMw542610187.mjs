import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542610187";
const W = 12, H = 23, D = 15;

// Two-storey 1980s Xinyi shophouse-block: stone base, white-concrete frame,
// shopfront at street level (+z side), ribbon windows above, red cornice,
// flat roof deck at y=10 (11 blocks above lowest ground).
const ROOF_Y = 10;
const FLOOR_Y = 5;      // storey line / upper floor slab
const SHOP_LINTEL_Y = 4;
const CORNICE_Y = 9;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const minG = Math.min(...raw.map(c => c[2]));
const ground = new Map();
for (const [x, z, gr] of raw) ground.set(`${x},${z}`, Math.round(gr - minG));

const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const edge = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);

const cellsList = [...ground.keys()].map(k => k.split(",").map(Number));
const cx = cellsList.reduce((a, c) => a + c[0], 0) / cellsList.length;
const cz = cellsList.reduce((a, c) => a + c[1], 0) / cellsList.length;
const maxZ = Math.max(...cellsList.map(c => c[1]));

// Entrance: street-side (max z) edge cell nearest the centre line.
let door = null;
for (const [x, z] of cellsList) {
  if (z !== maxZ) continue;
  if (!door || Math.abs(x - cx) < Math.abs(door[0] - cx)) door = [x, z];
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const isPier = (x, z) => (x + z) % 3 === 0;
const isDoor = (x, z) => door && door[0] === x && door[1] === z;

// Pass 1: foundations, floors, walls, storeys, roof.
for (const [x, z] of cellsList) {
  const gr = gAt(x, z);
  const e = edge(x, z);

  // Foundation fill from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "cobblestone");

  for (let y = gr; y <= ROOF_Y; y++) {
    // Roof deck / coping.
    if (y === ROOF_Y) {
      if (e) put(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
      else put(x, y, z, "smooth_stone");
      continue;
    }

    // Upper floor slab and string course.
    if (y === FLOOR_Y) {
      put(x, y, z, "smooth_stone");
      continue;
    }

    // Ground-floor storey (y < FLOOR_Y).
    if (y < FLOOR_Y) {
      if (!e) {
        if (y === gr) put(x, y, z, "smooth_stone"); // interior floor slab
        continue;
      }
      if (y === gr) { put(x, y, z, "stone_bricks"); continue; } // plinth course
      if (isDoor(x, z)) {
        const rel = y - gr;
        if (rel === 1) {
          put(x, y, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
          continue;
        }
        if (rel === 2) {
          put(x, y, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
          continue;
        }
        if (rel === 3) {
          put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
          continue;
        }
      }
      if (y === SHOP_LINTEL_Y) { put(x, y, z, "white_concrete"); continue; }
      if (isPier(x, z)) put(x, y, z, "smooth_quartz");
      else put(x, y, z, "glass");
      continue;
    }

    // Upper storey (FLOOR_Y < y < ROOF_Y).
    if (!e) continue; // air gap behind glass
    if (y === CORNICE_Y) { put(x, y, z, "red_concrete"); continue; }
    if (y === 6 || y === 8) { put(x, y, z, "white_concrete"); continue; }
    // y === 7: window row
    if (isPier(x, z)) put(x, y, z, "white_concrete");
    else put(x, y, z, "glass_pane", { east: "false", north: "false", south: "false", west: "false", waterlogged: "false" });
  }
}

// Pass 2: warm light in some upper-storey windows (shroomlight just behind the glass).
for (const [x, z] of cellsList) {
  if (!edge(x, z) || isPier(x, z) || (x + z) % 6 !== 1) continue;
  const sx = Math.sign(cx - x) || 0;
  const sz = Math.sign(cz - z) || 0;
  const cands = [[x + sx, z], [x, z + sz]];
  for (const [nx, nz] of cands) {
    if (has(nx, nz) && !edge(nx, nz) && gAt(nx, nz) <= 7) {
      put(nx, 7, nz, "shroomlight");
      break;
    }
  }
}

// Pass 3: roof equipment and a lightning rod.
const interior = cellsList.filter(([x, z]) => !edge(x, z));
if (interior.length) {
  const [ix, iz] = interior[Math.floor(interior.length / 2)];
  put(ix, ROOF_Y + 1, iz, "iron_block");
  if (interior.length > 1) {
    const [jx, jz] = interior[0];
    if (!(jx === ix && jz === iz)) put(jx, ROOF_Y + 1, jz, "iron_block");
  }
}
const corner = cellsList.reduce((best, c) =>
  (c[0] + c[1] < best[0] + best[1] ? c : best));
put(corner[0], ROOF_Y + 1, corner[1], "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

g.save(`${DIR}/${ID}.nbt`);
