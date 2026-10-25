import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499735";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 19, H = 31, D = 17;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, gr, roof] of cells) map.set(key(x, z), { gr, roof });

// Flat tier height: median of lidar roof readings.
const roofs = cells.map(c => c[3]).sort((a, b) => a - b);
let R = roofs[Math.floor(roofs.length / 2)];
R = Math.min(H - 4, Math.max(R, 4));

let cx = 0, cz = 0;
for (const [x, z] of cells) { cx += x; cz += z; }
cx /= cells.length; cz /= cells.length;

const has = (x, z) => map.has(key(x, z));
const isEdge = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);
const isCorner = (x, z) => (!has(x + 1, z) || !has(x - 1, z)) && (!has(x, z + 1) || !has(x, z - 1));

const GRAN = "granite";
const BRICK = "stone_bricks";
const CHIS = "chiseled_stone_bricks";
const SLAB = "stone_brick_slab";
const GLASS = "glass_pane";
const LIGHT = "glowstone";

// Pass 1: foundations, interior floors, articulated facades, roof cap.
for (const [x, z, b] of cells) {
  for (let y = 0; y < b; y++) g.set(x, y, z, GRAN);

  if (b >= R) {
    g.set(x, b, z, BRICK);
    continue;
  }

  const edge = isEdge(x, z);
  const corner = isCorner(x, z);

  if (edge) {
    const faceX = (!has(x + 1, z) || !has(x - 1, z));
    // Pilasters: stone-brick columns every fourth cell along the wall, not at corners.
    const pilaster = !corner && (faceX ? (z % 4 === 0) : (x % 4 === 0));
    // Window columns: alternating cells; pilasters take precedence.
    const winCol = !corner && !pilaster && (x + z) % 2 === 1;

    for (let y = b; y < R; y++) {
      const rel = y - b;
      const m = rel % 5;
      if (corner) {
        g.set(x, y, z, m === 0 ? CHIS : BRICK);
      } else if (rel === 0) {
        g.set(x, y, z, BRICK);                       // base course
      } else if (m === 0) {
        g.set(x, y, z, pilaster ? CHIS : BRICK);     // storey string course
      } else if (pilaster) {
        g.set(x, y, z, BRICK);                       // pilaster shaft
      } else if ((m === 2 || m === 3) && winCol) {
        const props = faceX
          ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
          : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
        g.set(x, y, z, GLASS, props);
      } else if (m === 1 && winCol) {
        g.set(x, y, z, SLAB, { type: "bottom", waterlogged: "false" }); // sill
      } else if (m === 4 && winCol) {
        g.set(x, y, z, BRICK);                       // lintel
      } else {
        g.set(x, y, z, GRAN);
      }
    }
    // Corbelled machicolation course just under the parapet.
    if (R - 1 > b && (x + z) % 2 === 0) g.set(x, R - 1, z, CHIS);
  } else {
    for (let rel = 0; b + rel < R; rel += 5) g.set(x, b + rel, z, BRICK);
  }

  g.set(x, R, z, BRICK);

  // Merlons on the outer ring, standing on the roof cap.
  if (edge && (x + z) % 2 === 0) {
    g.set(x, R + 1, z, GRAN);
    g.set(x, R + 2, z, GRAN);
  } else if (edge) {
    g.set(x, R + 1, z, CHIS);
  }
}

// Pass 2: warm light behind some slit windows.
for (const [x, z, b] of cells) {
  if (b >= R || !isEdge(x, z) || isCorner(x, z)) continue;
  if ((x + z) % 4 !== 1) continue;
  const dxs = Math.sign(cx - x), dzs = Math.sign(cz - z);
  const useX = Math.abs(cx - x) >= Math.abs(cz - z);
  const ix = useX ? x + dxs : x;
  const iz = useX ? z : z + dzs;
  if (!has(ix, iz) || isEdge(ix, iz)) continue;
  for (const rel of [2, 3]) {
    const y = b + rel;
    if (y < R) g.set(ix, y, iz, LIGHT);
  }
}

// Pass 3: entrance door on the outer face with a stone lintel and a small canopy.
const faces = [
  { facing: "north", dx: 0, dz: -1 },
  { facing: "south", dx: 0, dz: 1 },
  { facing: "east", dx: 1, dz: 0 },
  { facing: "west", dx: -1, dz: 0 },
];
let door = null;
for (const f of faces) {
  let best = null;
  for (const [x, z, b] of cells) {
    if (b >= R || isCorner(x, z) || !isEdge(x, z)) continue;
    if (has(x + f.dx, z + f.dz)) continue;
    const score = Math.abs(x - cx) + Math.abs(z - cz);
    if (!best || score < best.score) best = { x, z, b, score, facing: f.facing, dx: f.dx, dz: f.dz };
  }
  if (best) { door = best; break; }
}
if (door) {
  const { x, z, b, facing, dx, dz } = door;
  g.set(x, b, z, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, b + 1, z, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(x, b + 2, z, CHIS);
  // Canopy: a slab projecting one block outward at lintel height, supported by the lintel course.
  const ox = x + dx, oz = z + dz;
  if (!has(ox, oz)) g.set(ox, b + 3, oz, SLAB, { type: "top", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
