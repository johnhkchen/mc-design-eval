import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001605";
const W = 12, H = 25, D = 5;

// Read footprint cells: [x, z, ground, roof]
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : (raw.cells || raw.footprint || []);
const cells = list
  .map((c) => Array.isArray(c)
    ? { x: c[0], z: c[1], g: c[2], r: c[3] }
    : { x: c.x, z: c.z, g: c.ground ?? c.g, r: c.roof ?? c.r })
  .filter((c) => Number.isFinite(c.x) && Number.isFinite(c.z) && c.x >= 0 && c.x < W && c.z >= 0 && c.z < D);

const at = new Map();
for (const c of cells) at.set(`${c.x},${c.z}`, c);
const has = (x, z) => at.has(`${x},${z}`);

// One flat roof height from the lidar median (clean tier, no noise)
const roofs = cells.map((c) => c.r).sort((a, b) => a - b);
const medRoof = roofs[Math.floor(roofs.length / 2)] ?? 13;
const R = Math.max(8, Math.min(20, Math.round(medRoof)));

const g = new Voxels([W, H, D]);
const set = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props); else g.set(x, y, z, id);
};

// Door column on the street face (z = 0 side) — centred on the front
const DOOR_X = 5;

for (const c of cells) {
  const { x, z } = c;
  const gr = Math.max(0, Math.min(R - 4, Math.round(c.g)));

  const front = !has(x, z - 1);   // outward -z
  const back = !has(x, z + 1);    // outward +z
  const west = !has(x - 1, z);    // outward -x
  const east = !has(x + 1, z);    // outward +x
  const isExt = front || back || west || east;
  const frontBack = front || back;

  // Inward offset toward the interior, for lights behind windows
  const ix = west ? 1 : east ? -1 : 0;
  const iz = front ? 1 : back ? -1 : 0;

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) set(x, y, z, "stone_bricks");

  for (let y = gr; y < R; y++) {
    const rel = y - gr;
    const st = Math.floor(rel / 2);   // storey index (2-block storeys)
    const off = rel % 2;              // 0 = floor/sill band, 1 = window course

    // Cornice course under the parapet, parapet on exterior, roof deck inside
    if (y === R - 1) {
      if (isExt) set(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
      else set(x, y, z, "smooth_stone");
      continue;
    }
    if (y === R - 2 && isExt) {
      set(x, y, z, "stone_bricks");
      continue;
    }

    // Interior: floor slab per storey, air behind glass
    if (!isExt) {
      if (off === 0) set(x, y, z, "smooth_stone");
      continue;
    }

    // Exterior walls: brownstone ground floor, brick above, stone sill bands
    let id;
    if (off === 0) {
      id = st === 0 ? "brown_terracotta" : "stone_bricks";
    } else {
      id = st === 0 ? "brown_terracotta" : "bricks";
    }

    // Window bays: piers every third column, never at corners
    const i = frontBack ? x : z;
    const extent = frontBack ? W : D;
    const isWin = i > 0 && i < extent - 1 && i % 3 !== 0;

    if (off === 1) {
      if (front && st === 0) {
        // Shopfront: glass across the street face, except the door bay
        if (x >= 1 && x <= W - 2 && Math.abs(x - DOOR_X) > 1) id = "glass_pane";
      } else if (isWin) {
        id = "glass_pane";
      }
    }

    // Entrance: brownstone surround at the door, dark oak door, stone lintel above
    if (front && st === 0) {
      if (x === DOOR_X && rel === 0) {
        set(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (x === DOOR_X && rel === 1) {
        set(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (Math.abs(x - DOOR_X) === 1 && off === 0) id = "stone_bricks"; // door jambs
      if (x >= DOOR_X - 1 && x <= DOOR_X + 1 && rel === 2) id = "stone_bricks"; // lintel
    }

    set(x, y, z, id);

    // Warm lights on a fixed pattern: upper storeys, one bay in three, behind glass
    if (off === 1 && id === "glass_pane" && st >= 1 && frontBack && (i === 4 || i === 7) && st % 2 === 1) {
      const lx = x + ix, lz = z + iz;
      if (has(lx, lz)) set(lx, y, lz, "shroomlight");
    }
  }
}

// Rooftop chimneys on two footprint cells
for (const [cx, cz] of [[2, 1], [9, 3]]) {
  if (!has(cx, cz)) continue;
  for (let y = R; y <= R + 2; y++) set(cx, y, cz, "bricks");
}

g.save(`${DIR}/${ID}.nbt`);
