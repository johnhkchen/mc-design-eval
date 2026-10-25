import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499673";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 26, H = 29, D = 17;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, gr, rf] of cells) map.set(key(x, z), { x, z, g: gr, r: rf });

const B = Math.min(...cells.map((c) => c[2]));   // lowest ground under the footprint
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]]; // north, south, west, east

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const isShell = (x, z) => DIRS.some(([dx, dz]) => !map.has(key(x + dx, z + dz)));

// One clean roof tier for the whole block: median lidar roof, smoothed and clamped to 15..17 above datum
const sortedRoofs = cells.map((c) => c[3]).sort((a, b) => a - b);
const medianRoof = sortedRoofs[Math.floor(sortedRoofs.length / 2)];
const TIER = clamp(Math.round(medianRoof), B + 15, B + 17);

for (const [x, z, gnd] of cells) {
  const T = Math.max(TIER, gnd + 6);

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gnd; y++) put(x, y, z, "stone");

  const exp = DIRS.filter(([dx, dz]) => !map.has(key(x + dx, z + dz)));

  if (exp.length === 0) {
    // interior: storey floor slabs, open air between, roof deck on top
    const floors = new Set([Math.max(B, gnd), Math.max(B + 5, gnd), Math.max(B + 10, gnd)]);
    for (const y of floors) if (y <= T - 2) put(x, y, z, "spruce_planks");
    put(x, T - 1, z, "deepslate_tiles");
    // roof plant: sparse single HVAC blocks standing on the roof deck, well inside the edge
    if (x % 7 === 3 && z % 5 === 2 && x > 1 && x < 24 && z > 1 && z < 15) {
      put(x, T, z, "light_gray_concrete");
    }
    continue;
  }

  // shell: facade walls with base course, storey lines, window grid, shopfronts
  for (let y = gnd; y < T; y++) {
    const rel = y - B;
    const k = Math.floor(rel / 5);   // storey index
    const rr = rel % 5;              // row within storey
    let id = "stone_bricks";
    let props;

    if (y === T - 1) {
      id = "smooth_stone";           // parapet coping
    } else if (k >= 3) {
      id = "stone_bricks";           // parapet courses
    } else if (rr === 0) {
      id = "polished_andesite";      // base / string course
    } else if (rr === 4) {
      id = k === 0 ? "dark_oak_planks" : "smooth_stone"; // shopfront fascia / lintel and cornice
    } else if (exp.length >= 2) {
      id = "polished_andesite";      // corner pier
    } else {
      const [dx, dz] = exp[0];
      const idx = dx !== 0 ? z : x;  // position along the exposed face
      if (idx % 3 === 0) {
        id = "polished_andesite";    // pier between bays, contrasting stone for relief
      } else if (k === 0) {
        id = rr === 3 ? "dark_oak_planks" : "glass";   // shopfront glazing with transom
      } else {
        id = "glass_pane";           // upper-floor window panes
        props = dx !== 0
          ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
          : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
      }
      // warm light behind some windows, in the interior air cell
      if (id !== "polished_andesite" && rr === 2 && idx % 6 === 2 && y > gnd) {
        const ix = x - dx, iz = z - dz;
        if (map.has(key(ix, iz)) && !isShell(ix, iz)) {
          put(ix, y, iz, k % 2 ? "shroomlight" : "glowstone");
        }
      }
    }
    put(x, y, z, id, props);
  }
}

// ---- entrance: central door on the street face (z = 0), framed by piers and a lintel ----
const doorCell = map.get(key(13, 0));
if (doorCell) {
  const gnd = doorCell.g;
  const doorProps = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
  // door jamb and hood framing on the street face
  for (const x of [12, 14]) {
    put(x, gnd, 0, "polished_andesite");
    put(x, gnd + 1, 0, "polished_andesite");
    put(x, gnd + 2, 0, "polished_andesite");
  }
  // lintel over the door in a warm stone
  put(13, gnd + 2, 0, "smooth_stone");
  put(13, gnd, 0, "dark_oak_door", doorProps("lower"));
  put(13, gnd + 1, 0, "dark_oak_door", doorProps("upper"));
}

g.save(`${DIR}/${ID}.nbt`);
