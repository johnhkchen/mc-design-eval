import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw538403004";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 15, H = 23, D = 19;
const ROOF = 11;          // parapet top, about 11 blocks above lowest ground
const CORNICE = 10;       // roof slab / cornice level
const LINE = 5;           // storey line between the two storeys
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), Math.max(0, Math.min(H - 2, Math.round(gr))));
}
const inF = (x, z) => ground.has(key(x, z));

// outward normal of a footprint cell: [nx, nz], each -1, 0 or 1
function normal(x, z) {
  const nx = !inF(x - 1, z) ? -1 : (!inF(x + 1, z) ? 1 : 0);
  const nz = !inF(x, z - 1) ? -1 : (!inF(x, z + 1) ? 1 : 0);
  return [nx, nz];
}
const isBoundary = (x, z) => { const [nx, nz] = normal(x, z); return nx !== 0 || nz !== 0; };
const isCorner = (x, z) => { const [nx, nz] = normal(x, z); return nx !== 0 && nz !== 0; };

// position along the wall the cell sits on
const along = (x, z) => { const [, nz] = normal(x, z); return nz !== 0 ? x : z; };

// facing of an outward normal
function facingOf(nx, nz) {
  if (nz === -1) return "north";
  if (nz === 1) return "south";
  if (nx === -1) return "west";
  return "east";
}

// ---- choose the entrance: a non-corner boundary cell on the north (min z) face, near the middle
let door = null;
{
  const cand = cells
    .map(([x, z]) => [x, z])
    .filter(([x, z]) => {
      const [nx, nz] = normal(x, z);
      return nz === -1 && nx === 0;
    });
  if (cand.length) {
    const meanX = cand.reduce((s, [x]) => s + x, 0) / cand.length;
    cand.sort((a, b) => Math.abs(a[0] - meanX) - Math.abs(b[0] - meanX));
    door = cand[0];
  } else {
    const cand2 = cells.map(([x, z]) => [x, z]).filter(([x, z]) => {
      const [nx, nz] = normal(x, z);
      return nx !== 0 && nz === 0;
    });
    if (cand2.length) door = cand2[0];
  }
}

// ---- foundation, floors, walls, roof
for (const [x, z] of cells) {
  const gr = ground.get(key(x, z));
  const [nx, nz] = normal(x, z);
  const boundary = nx !== 0 || nz !== 0;
  const corner = nx !== 0 && nz !== 0;

  // solid foundation from 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // ground floor slab / base course
  g.set(x, gr, z, boundary ? "polished_andesite" : "light_gray_concrete");

  // storey line and roof level
  if (LINE > gr) g.set(x, LINE, z, boundary ? "smooth_quartz" : "light_gray_concrete");
  if (CORNICE > gr) g.set(x, CORNICE, z, boundary ? "smooth_quartz" : "gray_concrete");

  if (!boundary) continue;

  const t = along(x, z);
  for (let y = gr + 1; y <= ROOF; y++) {
    let b;
    if (corner) b = "smooth_quartz";
    else if (y === ROOF) b = "white_concrete";
    else if (y === CORNICE) b = "smooth_quartz";
    else if (y >= 7 && y <= 9) b = t % 3 === 1 ? "light_blue_stained_glass" : "white_concrete";
    else if (y === 6) b = "light_gray_concrete";
    else if (y === LINE) b = "smooth_quartz";
    else if (y === 4) b = "smooth_quartz";            // shopfront lintel
    else b = t % 3 === 0 ? "smooth_quartz" : "cyan_stained_glass"; // shopfront glazing
    if (y === LINE && !corner) b = "smooth_quartz";
    g.set(x, y, z, b);
  }
}

// ---- entrance: door, and a canopy over the door on the same face
if (door) {
  const [dx, dz] = door;
  const gr = ground.get(key(dx, dz));
  const [nx, nz] = normal(dx, dz);
  const facing = facingOf(nx, nz);
  const dt = along(dx, dz);
  g.set(dx, gr + 1, dz, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(dx, gr + 2, dz, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });

  // canopy: stone brick slabs over the entrance, on the wall cells beside the door
  for (const [x, z] of cells) {
    if (!isBoundary(x, z) || isCorner(x, z)) continue;
    const [cnx, cnz] = normal(x, z);
    if (cnx !== nx || cnz !== nz) continue;
    if (Math.abs(along(x, z) - dt) > 1) continue;
    const gr2 = ground.get(key(x, z));
    g.set(x, gr2 + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// ---- warm light behind some upper-storey windows (interior side)
for (const [x, z] of cells) {
  if (!isBoundary(x, z) || isCorner(x, z)) continue;
  const [nx, nz] = normal(x, z);
  const t = along(x, z);
  if (t % 3 !== 1 || t % 2 !== 0) continue;
  if (door && x === door[0] && z === door[1]) continue;
  const ix = x - nx, iz = z - nz;
  if (!inF(ix, iz) || isBoundary(ix, iz)) continue;
  g.set(ix, 8, iz, "glowstone");
}

// ---- roof equipment on the roof slab (interior cells only)
for (const [x, z] of cells) {
  if (isBoundary(x, z)) continue;
  const gr = ground.get(key(x, z));
  if (CORNICE <= gr) continue;
  if (x % 4 === 2 && z % 4 === 2) {
    g.set(x, ROOF, z, "iron_block");
  }
}
// a lightning rod on one interior roof cell
for (const [x, z] of cells) {
  if (isBoundary(x, z)) continue;
  if (x === Math.floor(W / 2) && z === Math.floor(D / 2)) {
    g.set(x, ROOF + 1, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
    break;
  }
}

g.save(`${dir}/${id}.nbt`);
