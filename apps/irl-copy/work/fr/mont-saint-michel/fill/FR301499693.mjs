import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Hôtel - Restaurant Le Mouton Blanc, Mont-Saint-Michel Grande Rue.
// Three storeys: granite plinth, shopfront with a white-wool fascia,
// white-rendered upper walls with simple window bays, storey lines, a
// stone cornice, and a stepped slate roof with slab caps.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499693";
const W = 14, D = 21, HMAX = 30;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, HMAX, D]);

const key = (x, z) => `${x},${z}`;
const cellMap = new Map();
for (const [x, z, gr, rf] of cells) cellMap.set(key(x, z), { x, z, gr, rf });
const inside = (x, z) => cellMap.has(key(x, z));

function put(x, y, z, block, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= HMAX) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// Distance from the outer edge of the footprint (4-neighbour BFS).
const dist = new Map();
const queue = [];
for (const c of cellMap.values()) {
  const edge = !inside(c.x + 1, c.z) || !inside(c.x - 1, c.z) ||
               !inside(c.x, c.z + 1) || !inside(c.x, c.z - 1);
  if (edge) { dist.set(key(c.x, c.z), 0); queue.push(c); }
}
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  const d = dist.get(key(c.x, c.z));
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nk = key(c.x + dx, c.z + dz);
    if (cellMap.has(nk) && !dist.has(nk)) {
      dist.set(nk, d + 1);
      queue.push(cellMap.get(nk));
    }
  }
}

// One clean eave/roof line from the lidar median.
const roofs = cells.map(c => c[3]).sort((a, b) => a - b);
const medianRoof = roofs[Math.floor(roofs.length / 2)];
const Hg = Math.round(medianRoof) - 4;

// Outward normal of an edge cell (first missing neighbour wins at corners).
function normalOf(x, z) {
  if (!inside(x, z - 1)) return [0, -1];
  if (!inside(x, z + 1)) return [0, 1];
  if (!inside(x - 1, z)) return [-1, 0];
  if (!inside(x + 1, z)) return [1, 0];
  return null;
}
const dirName = ([dx, dz]) =>
  dx === 0 ? (dz < 0 ? "north" : "south") : (dx < 0 ? "west" : "east");

function glassProps(n) {
  // Panes connect along the wall they sit in.
  if (n[0] === 0) return { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
  return { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

const alongFace = (x, z, n) => (n[0] === 0 ? x : z);
const faceLen = (n) => (n[0] === 0 ? D : W);

// 1. Foundations, walls, floors, eaves and roof.
for (const c of cellMap.values()) {
  const { x, z, gr } = c;
  const d = dist.get(key(x, z)) ?? 0;

  // Foundation up to the cell's own ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "granite");

  const top = Math.max(gr + 10, Hg);

  if (d === 0) {
    const n = normalOf(x, z);
    const t = alongFace(x, z, n);
    const L = faceLen(n);
    const dn = dirName(n);
    const doorT = t === Math.floor(L / 2) - 1 || t === Math.floor(L / 2);
    const pilaster = t % 4 === 0;

    for (let y = gr; y < top; y++) {
      const rel = y - gr;
      let block = "white_concrete";
      let props;

      if (rel === 0) {
        block = "granite"; // plinth course
      } else if (rel >= 1 && rel <= 4) {
        // Ground floor: shopfront with entrance.
        if (rel <= 2 && doorT) {
          block = "spruce_door";
          props = { facing: dn, half: rel === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" };
        } else if (rel === 4) {
          block = "white_wool"; // sign fascia
        } else if (pilaster) {
          block = "granite";
        } else {
          block = "glass_pane";
          props = glassProps(n);
        }
      } else if (rel === 5 || rel === 10) {
        block = "stone_bricks"; // storey lines
      } else if ((rel >= 6 && rel <= 8) || (rel >= 11 && rel <= 13)) {
        // Upper bays: paired windows between granite pilasters.
        if (pilaster) {
          block = "granite";
        } else {
          block = "glass_pane";
          props = glassProps(n);
        }
      }

      if (y === top - 1) block = "stone_bricks"; // cornice course

      if (props) put(x, y, z, block, props);
      else put(x, y, z, block);
    }

    // Eave: slab sitting on the cornice course.
    put(x, top, z, "deepslate_tile_slab", { type: "bottom", waterlogged: "false" });

    // Warm light behind some upper windows, standing on the storey floor.
    const inward = [-n[0], -n[1]];
    if (t % 8 === 2) {
      const ix = x + inward[0], iz = z + inward[1];
      if (inside(ix, iz) && (dist.get(key(ix, iz)) ?? 0) >= 1) {
        put(ix, gr + 6, iz, "glowstone");
      }
    }
  } else {
    // Interior: floors only, leaving an air gap behind the glass.
    put(x, gr, z, "spruce_planks");
    for (const fy of [gr + 5, gr + 10]) {
      if (fy < top) put(x, fy, z, "spruce_planks");
    }
  }

  // Stepped roof: full tiles up to the last step, slab cap on the top tier.
  if (d >= 1) {
    const steps = Math.min(d, 3);
    for (let k = 0; k < steps; k++) {
      const y = top + k;
      if (k === steps - 1 && k >= 1) {
        put(x, y, z, "deepslate_tile_slab", { type: "bottom", waterlogged: "false" });
      } else {
        put(x, y, z, "deepslate_tiles");
      }
    }
  }
}

// 2. Lantern hung by the door on the street face (roof-level light beside the entrance).
for (const c of cellMap.values()) {
  const d = dist.get(key(c.x, c.z)) ?? 0;
  if (d !== 0) continue;
  const n = normalOf(c.x, c.z);
  const t = alongFace(c.x, c.z, n);
  const L = faceLen(n);
  if (t === Math.floor(L / 2) - 2) {
    const top = Math.max(c.gr + 10, Hg);
    put(c.x, c.gr + 4, c.z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// 3. Chimney stack on the roof.
let chimneyCell = null;
for (const c of cellMap.values()) {
  const d = dist.get(key(c.x, c.z)) ?? 0;
  if (c.x === 4 && d >= 2 && c.z >= 4 && c.z <= 8) {
    chimneyCell = c;
    break;
  }
}
if (chimneyCell) {
  const d = dist.get(key(chimneyCell.x, chimneyCell.z));
  const top = Math.max(chimneyCell.gr + 10, Hg);
  const roofTop = top + Math.min(d, 3);
  for (let k = 0; k < 3; k++) put(chimneyCell.x, roofTop + k, chimneyCell.z, "bricks");
  put(chimneyCell.x, roofTop + 3, chimneyCell.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
