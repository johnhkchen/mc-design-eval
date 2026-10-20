import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280216";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 20, H = 33, D = 19;
const ROOF = 21;                 // roof deck top, about 21 blocks above lowest ground
const SLABS = [5, 10, 15, 20];   // storey floor lines (absolute y)
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(key(x, z), gy);
const has = (x, z) => ground.has(key(x, z));

// Outward normals; a cell is on the facade if one of its four neighbours is outside the footprint.
const NORM = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
function edgeFace(x, z) {
  for (const [f, [dx, dz]] of Object.entries(NORM)) {
    if (!has(x + dx, z + dz)) return f;
  }
  return null;
}

function set(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Pass 1: foundation, floors, walls, windows.
for (const [x, z, gy] of cells) {
  const face = edgeFace(x, z);
  const along = (face === "north" || face === "south") ? x : z;
  const mullion = along % 3 === 0;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gy; y++) set(x, y, z, "stone_bricks");

  for (let y = gy; y <= ROOF; y++) {
    // Base course / ground floor slab at the cell's ground.
    if (y === gy) {
      set(x, y, z, face ? "polished_granite" : "stone_bricks");
      continue;
    }
    // Cornice band at the top of the storey stack.
    if (y === 20) {
      set(x, y, z, face ? "smooth_quartz" : "light_gray_concrete");
      continue;
    }
    // Storey floor slabs (interior and facade alike; they read as storey lines).
    if (SLABS.includes(y)) {
      set(x, y, z, "light_gray_concrete");
      continue;
    }
    // Parapet on the facade.
    if (y === ROOF) {
      if (face) set(x, y, z, "smooth_quartz");
      continue;
    }
    if (!face) continue;

    // Storey base: 0 for the ground storey, otherwise the slab below.
    const sb = y >= 15 ? 15 : y >= 10 ? 10 : y >= 5 ? 5 : 0;
    const r = y - sb;

    if (sb === 0) {
      // Shopfront: stone mullions and glass, lintel band at the top.
      if (r === 4) set(x, y, z, "white_concrete");
      else if (r >= 1 && r <= 3) {
        if (mullion) set(x, y, z, "stone_bricks");
        else set(x, y, z, "light_blue_stained_glass");
      }
    } else {
      // Upper storeys: curtain-wall glass in a white concrete frame.
      if (r === 4) set(x, y, z, "white_concrete");
      else if (r >= 1 && r <= 3) {
        if (mullion) set(x, y, z, "light_gray_concrete");
        else set(x, y, z, "light_blue_stained_glass");
      }
    }
  }
}

// Pass 2: warm lights just behind some upper-storey glass (inside the footprint).
for (const [x, z, gy] of cells) {
  const face = edgeFace(x, z);
  if (!face) continue;
  const along = (face === "north" || face === "south") ? x : z;
  if (along % 3 === 0) continue;
  const [nx, nz] = NORM[face];
  const ix = x - nx, iz = z - nz;
  if (!has(ix, iz) || edgeFace(ix, iz)) continue;
  for (const sb of [5, 10, 15]) {
    if ((along + sb) % 6 !== 0) continue;
    const y = sb + 2;
    if (y <= gy) continue;
    set(ix, y, iz, "glowstone");
  }
}

// Pass 3: entrance on the south facade (fallback: any facade cell), with door and canopy.
const southEdge = cells
  .filter(([x, z]) => edgeFace(x, z) === "south")
  .sort((a, b) => a[0] - b[0]);
const entranceList = southEdge.length
  ? southEdge
  : cells.filter(([x, z]) => edgeFace(x, z)).sort((a, b) => a[0] - b[0]);
if (entranceList.length) {
  const [ex, ez, egy] = entranceList[Math.floor(entranceList.length / 2)];
  const face = edgeFace(ex, ez);
  const hinge = "left";
  const lowY = egy + 1;
  const upY = egy + 2;
  set(ex, lowY, ez, "dark_oak_door", { facing: face, half: "lower", hinge, open: "false", powered: "false" });
  set(ex, upY, ez, "dark_oak_door", { facing: face, half: "upper", hinge, open: "false", powered: "false" });
  // Canopy slab over the entrance, across the door and its neighbours on the facade.
  const canopyY = egy + 3;
  for (const dx of [-1, 0, 1]) {
    const cx = ex + dx;
    if (has(cx, ez) && edgeFace(cx, ez) === face) {
      set(cx, canopyY, ez, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

// Pass 4: roof plant box in the middle of the roof.
for (const [x, z] of cells) {
  if (x < 7 || x > 12 || z < 6 || z > 11) continue;
  if (edgeFace(x, z)) continue;
  set(x, ROOF, z, "light_gray_concrete");
  set(x, ROOF + 1, z, "light_gray_concrete");
  set(x, ROOF + 2, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
