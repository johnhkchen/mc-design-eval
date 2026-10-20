import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC1078986";
const W = 6, D = 18, HGT = 26;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = new Map();
for (const c of raw) {
  const [x, z, g, r] = Array.isArray(c) ? c : [c.x, c.z, c.ground, c.roof];
  cells.set(`${x},${z}`, { x, z, g: Math.max(0, Math.round(g)), r });
}
const has = (x, z) => cells.has(`${x},${z}`);

// Roof: lidar median, smoothed to one flat parapet line for the whole block.
const roofs = [...cells.values()].map((c) => c.r).sort((a, b) => a - b);
const TOP = Math.round(roofs[Math.floor(roofs.length / 2)] ?? 14);
const CORN = TOP - 2;            // cornice corbel row; roof deck sits here too
const FLOORS = [3, 6, 9];        // floor slab rows (1 block) above ground storey
const WIN_ROWS = [4, 5, 7, 8, 10, 11];

const g = new Voxels([W, HGT, D]);

function facadeSpec(x, y, z, corner, edgeX, g0) {
  const pier = corner || (edgeX && z % 3 === 0);
  if (y === 0) return ["stone_bricks"];
  if (y === 1) {
    // solid shopfront kickplate: door opening, otherwise dark wood panels
    if (x === 2 && z === 0 && g0 <= 1) {
      return ["oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }];
    }
    if (pier) return ["stripped_dark_oak_log", { axis: "y" }];
    return ["dark_oak_planks"];
  }
  if (y === 2) {
    if (x === 2 && z === 0 && g0 <= 1) {
      return ["oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }];
    }
    if (pier) return ["stripped_dark_oak_log", { axis: "y" }];
    return ["glass_pane"];
  }
  if (FLOORS.includes(y)) return ["smooth_stone"];
  if (y === CORN) return ["smooth_stone"];
  if (y === CORN + 1) return ["stone_brick_slab", { type: "bottom", waterlogged: "false" }];
  if (corner) return ["stone_bricks"];
  if (WIN_ROWS.includes(y) && ((edgeX ? z : x + z) % 2 === 0)) return ["glass_pane"];
  return ["bricks"];
}

function put(x, y, z, spec) {
  if (!spec) return;
  if (spec[1]) g.set(x, y, z, spec[0], spec[1]);
  else g.set(x, y, z, spec[0]);
}

// Main massing: foundation, shell, floors, roof.
for (const cell of cells.values()) {
  const { x, z, g: g0 } = cell;
  const perimeter = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
  const edgeX = x === 0 || x === W - 1;
  const corner = edgeX && (z === 0 || z === D - 1);

  for (let y = 0; y < TOP; y++) {
    if (y < g0) { g.set(x, y, z, "stone_bricks"); continue; }
    if (!perimeter) {
      if (y === 0) g.set(x, y, z, "smooth_stone");
      else if (FLOORS.includes(y)) g.set(x, y, z, "spruce_planks");
      else if (y === CORN) g.set(x, y, z, "blackstone");
      continue;
    }
    put(x, y, z, facadeSpec(x, y, z, corner, edgeX, g0));
  }
}

// Warm lights behind some interior window bays (interior cells only).
for (const cell of cells.values()) {
  const { x, z, g: g0 } = cell;
  const interior = has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1);
  if (!interior || z % 6 !== 2) continue;
  for (const y of [4, 7, 10]) {
    if (y < g0) continue;
    if (x === 1) g.set(x, y, z, "glowstone");
    if (x === 4) g.set(x, y, z, "shroomlight");
  }
}

// Roof equipment: two brick chimneys with stone caps.
for (const [cx, cz] of [[2, 4], [3, 13]]) {
  if (!has(cx, cz)) continue;
  for (let y = CORN + 1; y <= CORN + 3; y++) g.set(cx, y, cz, "bricks");
  g.set(cx, CORN + 4, cz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
