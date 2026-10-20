import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1174690424";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Record-less decision: a two-storey 1980s Xinyi commercial block (about 11 blocks tall),
// pale tiled facade, stone base, shopfront glass on the ground floor, lit upper windows,
// a cornice-like cap, a parapet, a front canopy and rooftop AC plant.
const W = 21, H = 23, D = 18;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, b] of cells) ground.set(key(x, z), b);
const has = (x, z) => ground.has(key(x, z));

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Glass pane whose connection flags follow the wall direction it sits in.
function pane(x, y, z, id, alongX) {
  const p = alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  put(x, y, z, id, p);
}

// Pass 1: per-cell columns.
for (const [x, z, b] of cells) {
  const N = !has(x, z - 1), S = !has(x, z + 1);
  const Wd = !has(x - 1, z), E = !has(x + 1, z);
  const edge = N || S || Wd || E;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");

  // Storey lines and roof deck for every cell.
  put(x, b + 5, z, "smooth_stone");
  put(x, b + 10, z, "smooth_quartz");

  if (!edge) continue; // interior: air between slabs, no interior

  // Base course.
  put(x, b, z, "stone_bricks");

  // Which facade index governs the bay pattern (N/S faces run along x).
  const alongX = N || S;
  const i = alongX ? x : z;
  const open = i % 3 !== 0;            // pillars at every third bay
  const lit = open && i % 6 === 1;     // some upper windows glow

  // Ground floor: shopfront glass with dark oak pillars and lintel.
  if (open) {
    for (let y = b + 1; y <= b + 3; y++) put(x, y, z, "glass");
  } else {
    for (let y = b + 1; y <= b + 3; y++) put(x, y, z, "dark_oak_planks");
  }
  put(x, b + 4, z, open ? "smooth_quartz" : "dark_oak_planks");

  // Upper storey: pale wall, window bays with glass panes or lit glowstone.
  for (let y = b + 6; y <= b + 8; y++) {
    if (open) {
      if (lit && y === b + 7) put(x, y, z, "glowstone");
      else pane(x, y, z, "light_blue_stained_glass_pane", alongX);
    } else {
      put(x, y, z, "smooth_quartz");
    }
  }
  put(x, b + 9, z, "smooth_quartz");

  // Cornice cap and parapet on the perimeter.
  put(x, b + 11, z, "stone_brick_wall");
}

// Pass 2: entrance on the street-side (south) edge, nearest the middle.
let entrance = null;
for (const [x, z, b] of cells) {
  if (has(x, z + 1)) continue;
  if (!entrance || Math.abs(x - 10) < Math.abs(entrance.x - 10)) {
    entrance = { x, z, b };
  }
}
if (entrance) {
  const { x: ex, z: ez, b: eb } = entrance;
  put(ex, eb + 1, ez, "dark_oak_door", {
    facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(ex, eb + 2, ez, "dark_oak_door", {
    facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  put(ex, eb + 3, ez, "glass");
  // Canopy over the entrance, carried on the footprint cells beside it.
  for (const dx of [-1, 0, 1]) {
    if (!has(ex + dx, ez)) continue;
    const cb = ground.get(key(ex + dx, ez));
    put(ex + dx, cb + 4, ez, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Pass 3: rooftop AC plant on two interior-ish roof spots near the centre.
const roofCells = cells.filter(([x, z]) => {
  const N = !has(x, z - 1), S = !has(x, z + 1), Wd = !has(x - 1, z), E = !has(x + 1, z);
  return !(N || S || Wd || E);
});
const centre = { x: 10, z: 8 };
roofCells.sort((a, b) =>
  Math.hypot(a[0] - centre.x, a[1] - centre.z) - Math.hypot(b[0] - centre.x, b[1] - centre.z));
for (const [x, z, b] of roofCells.slice(0, 2)) {
  for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    if (!has(x + dx, z + dz)) continue;
    const cb = ground.get(key(x + dx, z + dz));
    put(x + dx, cb + 11, z + dz, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
