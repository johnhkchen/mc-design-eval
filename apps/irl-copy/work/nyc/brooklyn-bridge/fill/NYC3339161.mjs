import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const id = "NYC3339161";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 10, H = 16, D = 4;
const g = new Voxels([W, H, D]);

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const inB = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
const put = (x, y, z, id, props) => { if (inB(x, y, z)) g.set(x, y, z, id, props); };

const GLASS_X = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const GLASS_Z = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const SLAB_BOTTOM = { type: "bottom", waterlogged: "false" };
const DOOR_LOWER = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" };
const DOOR_UPPER = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" };

// Front (street) bays: windows in three bays either side of a central entrance.
const FRONT_WIN = new Set([1, 2, 3, 6, 7, 8]);

for (const c of cells) {
  const [x, z, grRaw, rfRaw] = c;
  if (x < 0 || x >= W || z < 0 || z >= D) continue;

  const ground = clamp(Math.round(grRaw), 0, H - 4);
  const roof = clamp(Math.max(Math.round(rfRaw), ground + 3), ground + 3, H);
  const top = roof - 1;

  for (let y = 0; y < ground; y++) put(x, y, z, "stone");

  const perimeter = x === 0 || x === W - 1 || z === 0 || z === D - 1;
  const corner = (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
  const front = (z === 0 || z === D - 1) && !corner;
  const endWall = (x === 0 || x === W - 1) && !corner;

  for (let y = ground; y < roof; y++) {
    const k = y - ground;

    if (perimeter) {
      if (y === top) { put(x, y, z, "stone_bricks"); continue; }   // cornice
      if (corner) { put(x, y, z, "stone_bricks"); continue; }       // corner piers
      if (k === 0) { put(x, y, z, "smooth_stone"); continue; }      // base course

      if (front) {
        // Central entrance on the z=0 street face.
        if (z === 0 && x === 4 && k === 0) { put(x, y, z, "dark_oak_door", DOOR_LOWER); continue; }
        if (z === 0 && x === 4 && k === 1) { put(x, y, z, "dark_oak_door", DOOR_UPPER); continue; }
        if (z === 0 && x === 5 && k === 0) { put(x, y, z, "smooth_stone"); continue; }
        if (z === 0 && x === 5 && k === 1) { put(x, y, z, "glass_pane", GLASS_X); continue; }
        if (z === 0 && (x === 4 || x === 5) && k === 2) { put(x, y, z, "stone_brick_slab", SLAB_BOTTOM); continue; }

        // Window bays: glass at storey row 1, stone lintel above, brick elsewhere.
        if (k === 1 && FRONT_WIN.has(x)) { put(x, y, z, "glass_pane", GLASS_X); continue; }
        if (k === 2 && FRONT_WIN.has(x)) { put(x, y, z, "stone_bricks"); continue; }
        put(x, y, z, "bricks");
        continue;
      }

      if (endWall) {
        if (k === 1 && (z === 1 || z === 2)) { put(x, y, z, "glass_pane", GLASS_Z); continue; }
        if (k === 2 && (z === 1 || z === 2)) { put(x, y, z, "stone_bricks"); continue; }
        put(x, y, z, "bricks");
        continue;
      }
      put(x, y, z, "bricks");
      continue;
    }

    // Interior: roof slab, floor slabs on even rows, air gap behind the glass on odd rows.
    if (y === top) { put(x, y, z, "smooth_stone"); continue; }
    if (k % 2 === 0) { put(x, y, z, "smooth_stone"); continue; }
    if (k === 1 && z === 1 && (x === 2 || x === 7)) { put(x, y, z, "glowstone"); continue; }
    if (k === 1 && z === 2 && x === 6) { put(x, y, z, "glowstone"); continue; }
    // otherwise leave as air
  }
}

g.save(`${dir}/${id}.nbt`);
