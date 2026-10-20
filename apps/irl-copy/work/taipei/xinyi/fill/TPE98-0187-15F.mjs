import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE98-0187-15F: Xinyi-district office/mixed-use tower, built 2009.
// Lidar roof ~55 blocks above lowest ground: 11 storeys of 5 blocks,
// plant penthouse, parapet and mast on top.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE98-0187-15F";
const W = 55, H = 67, D = 21;
const STOREY = 5;
const ROOF = 55;        // roof slab y (11 storeys x 5)
const PARAPET_TOP = 57;
const PH_BASE = 56;     // penthouse walls 56..59
const PH_ROOF = 60;
const MAST_BASE = 61;   // lightning rod 61..66

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, g] of cells) ground.set(`${x},${z}`, g);
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

function faceInfo(x, z) {
  const n = !has(x, z - 1), s = !has(x, z + 1);
  const w = !has(x - 1, z), e = !has(x + 1, z);
  return { n, s, w, e, perim: n || s || w || e, corner: (n || s) && (w || e) };
}

// Cell one step inward (and optionally two) from an exposed face.
function inward(x, z, info, steps = 1) {
  let dx = 0, dz = 0;
  if (info.n) dz = 1;
  else if (info.s) dz = -1;
  else if (info.w) dx = 1;
  else if (info.e) dx = -1;
  return [x + dx * steps, z + dz * steps];
}

// Street entrance: the z-min face cell nearest the middle of the long front.
const EX_TARGET = Math.floor(W / 2);
let ex = null, ez = null;
for (const [x, z] of cells) {
  if (!faceInfo(x, z).n) continue;
  if (ex === null || Math.abs(x - EX_TARGET) < Math.abs(ex - EX_TARGET)) { ex = x; ez = z; }
}

// Outer-layer block for a non-recessed perimeter cell at height y.
function facadeBlock(x, z, y, info) {
  const b = Math.floor(y / STOREY);
  const r = y % STOREY;
  const along = (info.n || info.s) ? x : z;
  const onEntranceFace = info.n && z === ez && Math.abs(x - ex) <= 2;
  const entrancePier = info.n && z === ez && Math.abs(x - ex) <= 1;

  if (b === 0) {
    if (r === 0) return ["stone_bricks"];
    if (r === 4) {
      if (onEntranceFace) return ["stone_brick_slab", { type: "top", waterlogged: "false" }];
      return ["white_concrete"];
    }
    if (info.corner || along % 3 === 0 || entrancePier) return ["stone_bricks"];
    return ["stone_bricks"];
  }
  if (r === 0) return ["light_gray_concrete"];
  if (r === 4) return ["white_concrete"];
  return ["white_concrete"]; // piers and corners stand proud of the recessed glass
}

// Whether a window bay on this perimeter cell at height y is recessed.
function isWindowBay(x, z, y, info) {
  const r = y % STOREY;
  if (r < 1 || r > 3) return false;
  if (y >= ROOF) return false;
  if (info.corner) return false;
  const along = (info.n || info.s) ? x : z;
  if (along % 3 === 0) return false;
  if (info.n && z === ez && Math.abs(x - ex) <= 1) return false; // entrance pier zone
  return true;
}

function glassFor(y) {
  const b = Math.floor(y / STOREY);
  if (b === 0) return "light_blue_stained_glass";
  return b % 2 === 0 ? "light_blue_stained_glass" : "cyan_stained_glass";
}

for (const [x, z, gr] of cells) {
  const info = faceInfo(x, z);

  // Foundation up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y <= PARAPET_TOP; y++) {
    if (y === ROOF) {
      put(x, y, z, info.perim ? "quartz_block" : "light_gray_concrete");
      continue;
    }
    if (y > ROOF) {
      if (info.perim) put(x, y, z, y === PARAPET_TOP ? "quartz_block" : "white_concrete");
      continue;
    }

    if (info.perim) {
      if (isWindowBay(x, z, y, info)) {
        // Recess the glass one block behind the piers, if the cell behind is interior.
        const [ix, iz] = inward(x, z, info, 1);
        const inner = has(ix, iz) && !faceInfo(ix, iz).perim && gAt(ix, iz) <= y;
        if (inner) {
          put(ix, y, iz, glassFor(y));
          const r = y % STOREY;
          const b = Math.floor(y / STOREY);
          const along = (info.n || info.s) ? x : z;
          if (b > 0 && r === 2 && along % 6 === 1) {
            const [jx, jz] = inward(x, z, info, 2);
            if (has(jx, jz) && !faceInfo(jx, jz).perim && gAt(jx, jz) <= y) {
              put(jx, y, jz, "glowstone");
            }
          }
          continue; // outer cell stays open: the window sits in a reveal
        }
        put(x, y, z, glassFor(y));
        continue;
      }
      const [id, props] = facadeBlock(x, z, y, info);
      put(x, y, z, id, props);
    } else if (y % STOREY === 0) {
      put(x, y, z, "light_gray_concrete"); // storey floor slab; interior air elsewhere
    }
  }
}

// Entrance: door on the street face, flanked by stone piers, lit lantern under the lintel.
if (ex !== null) {
  const gr = gAt(ex, ez);
  put(ex, gr, ez, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(ex, gr + 1, ez, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Warm light hanging from the lintel above the door.
  if (gr + 2 <= 3) put(ex, 3, ez, "lantern", { hanging: "true", waterlogged: "false" });
  // Glow inside the recessed shopfront flanking the entrance.
  const [ix, iz] = inward(ex - 3, ez, faceInfo(ex - 3, ez), 1);
  if (has(ix, iz) && gAt(ix, iz) <= 1) put(ix, 1, iz, "glowstone");
}

// Roof plant penthouse, inset from the edges, with louvred walls.
const PX0 = 6, PX1 = W - 7, PZ0 = 5, PZ1 = D - 6;
for (let x = PX0; x <= PX1; x++) {
  for (let z = PZ0; z <= PZ1; z++) {
    if (!has(x, z)) continue;
    const edge = x === PX0 || x === PX1 || z === PZ0 || z === PZ1;
    put(x, PH_ROOF, z, "light_gray_concrete");
    if (!edge) continue;
    const along = (x === PX0 || x === PX1) ? z : x;
    for (let y = PH_BASE; y <= PH_BASE + 3; y++) {
      if ((y === 57 || y === 58) && along % 2 === 0) {
        put(x, y, z, "iron_bars", { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" });
      } else {
        put(x, y, z, "white_concrete");
      }
    }
  }
}

// Antenna mast on the penthouse.
const mx = Math.floor(W / 2), mz = Math.floor(D / 2);
for (let y = MAST_BASE; y < H; y++) {
  put(mx, y, mz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
