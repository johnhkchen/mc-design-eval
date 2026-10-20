import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 退輔會公務人員訓練班, Xinyi, Taipei. Read as a 1970s-80s government training
// institute: two storeys of cream glazed tile over a stone plinth, a flat roof
// with a parapet, aluminium-framed ribbon windows, a recessed central entrance
// facing north, and a few rooftop mechanical boxes.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw549474967";
const W = 56, H = 24, D = 44;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : raw.cells;

// ---- palette -------------------------------------------------------------
const WALL    = "white_terracotta";   // cream glazed wall tile
const BASE    = "stone_bricks";       // plinth course
const FOUND   = "stone_bricks";       // foundation fill under sloped ground
const CORNICE = "smooth_stone";       // storey lines, cornice, roof deck
const FRAME   = "light_gray_concrete";// aluminium-look window frames
const GLASS   = "light_blue_stained_glass";
const LIGHT   = "glowstone";          // warm lamps behind some glass
const MECH    = "light_gray_concrete";// rooftop mechanical boxes

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// ---- footprint ----------------------------------------------------------
const ground = new Map();
for (const c of list) ground.set(`${c[0]},${c[1]}`, c[2]);
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

const xs = list.map(c => c[0]), zs = list.map(c => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const midX = Math.floor((minX + maxX) / 2);

// Lidar: roof sits about 12 blocks above the lowest ground.
const L  = Math.min(...ground.values());
const F1 = L + 5;      // first floor slab / storey line
const F2 = L + 10;     // second floor slab / cornice / roof deck
const R  = L + 12;     // parapet top

const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const FACE = { "-1,0": "west", "1,0": "east", "0,-1": "north", "0,1": "south" };
const ENTRANCE_FACE = "north";

// ---- build each footprint cell ----------------------------------------
for (const [x, z, gr] of list) {
  const gg = gr;

  // foundation fill from y 0 up to this cell's ground
  for (let y = 0; y < gg; y++) put(x, y, z, FOUND);

  // outward-facing neighbours
  const outs = DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));

  if (outs.length === 0) {
    // interior: floor slabs per storey, air above; roof mechanical boxes
    put(x, gg, z, CORNICE);
    if (F1 >= gg) put(x, F1, z, CORNICE);
    if (F2 >= gg) put(x, F2, z, CORNICE);
    if (x % 9 === 4 && z % 9 === 4 && gg <= F2) {
      for (let y = F2 + 1; y <= R; y++) put(x, y, z, MECH);
    }
    continue;
  }

  // perimeter cell
  const [dx, dz] = outs[0];
  const face = FACE[`${dx},${dz}`];
  const alongX = dx !== 0;              // wall runs along z when facing ±x
  const along = alongX ? z : x;
  const base = alongX ? minZ : minX;
  const a = along - base;
  const pier = ((a % 4) + 4) % 4 === 0;

  const isEntranceCell =
    ENTRANCE_FACE === face && dz === -1 && Math.abs(x - midX) <= 3;
  const isDoorCell = isEntranceCell && x === midX;

  for (let y = gg; y <= R; y++) {
    if (isEntranceCell) {
      if (y === gg) { put(x, y, z, BASE); continue; }
      if (y === gg + 1 || y === gg + 2) {
        if (isDoorCell) {
          put(x, y, z, "oak_door", {
            facing: face,
            half: y === gg + 1 ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          });
        } else {
          put(x, y, z, GLASS);
        }
        continue;
      }
      if (y === gg + 3) { put(x, y, z, CORNICE); continue; }   // lintel
      if (y === gg + 4) { put(x, y, z, WALL); continue; }
    }

    if (y === R)     { put(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" }); continue; }
    if (y === R - 1) { put(x, y, z, WALL); continue; }
    if (y === F2)    { put(x, y, z, CORNICE); continue; }
    if (y === F1)    { put(x, y, z, CORNICE); continue; }
    if (y === gg)    { put(x, y, z, BASE); continue; }

    // window bands
    const upper = y > F1 && y < F2;
    const lo = upper ? F1 + 1 : gg + 1;
    const hi = upper ? F2 - 1 : F1 - 1;
    if (y < lo || y > hi || pier) { put(x, y, z, WALL); continue; }

    if (y === lo || y === hi) {
      put(x, y, z, FRAME);
    } else {
      put(x, y, z, GLASS);
      // warm light in the room behind some windows
      if (((along + y) % 6 + 6) % 6 === 0) {
        const ix = x - dx, iz = z - dz;   // inward cell
        if (has(ix, iz)) put(ix, y, iz, LIGHT);
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
