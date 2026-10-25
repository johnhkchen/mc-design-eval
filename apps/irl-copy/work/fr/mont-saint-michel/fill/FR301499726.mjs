import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR301499726.cells.json`, "utf8"));

const W = 10, H = 21, D = 7;
const g = new Voxels([W, H, D]);

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const key = (x, z) => `${x},${z}`;

// Footprint lookup
const cmap = new Map();
for (const [x, z, gr, roof] of cells) cmap.set(key(x, z), { gr, roof });
const has = (x, z) => cmap.has(key(x, z));

// Per-cell ground and smoothed roof height (follows lidar, averaged over neighbours)
const info = new Map();
for (const [x, z, grRaw, roofRaw] of cells) {
  const gr = clamp(grRaw, 0, 15);
  let sum = 0, n = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const c = cmap.get(key(x + dx, z + dz));
    if (c) { sum += c.roof; n++; }
  }
  const smooth = n ? sum / n : roofRaw;
  const top = clamp(Math.round(0.5 * roofRaw + 0.5 * smooth), gr + 4, 19);
  info.set(key(x, z), { gr, top });
}

function outwardFaces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  return f;
}

function storeys(gr, top) {
  const nS = Math.max(1, Math.round((top - gr) / 4.5));
  const sh = Math.floor((top - gr) / nS);
  const floors = [];
  for (let k = 1; k < nS; k++) floors.push(gr + k * sh);
  return { sh, floors };
}

// Entrance: ground cell on the southern-most face, nearest the middle
let door = null;
{
  const maxZ = Math.max(...cells.map(c => c[1]));
  const cand = cells.filter(c => c[1] === maxZ).map(c => {
    const i = info.get(key(c[0], c[1]));
    return { x: c[0], z: c[1], gr: i.gr, top: i.top };
  });
  if (cand.length) {
    cand.sort((a, b) => Math.abs(a.x - 4) - Math.abs(b.x - 4));
    door = cand[0];
  }
}

// Chimney cell: an interior cell with the greatest roof height, if any
let chimney = null;
{
  const interior = cells.filter(c => outwardFaces(c[0], c[1]).length === 0);
  const pool = interior.length ? interior : cells;
  let best = null;
  for (const c of pool) {
    const i = info.get(key(c[0], c[1]));
    if (!best || i.top > best.top) best = { x: c[0], z: c[1], top: i.top };
  }
  chimney = best;
}

// Build massing cell by cell
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const { gr, top } = info.get(key(x, z));
  const faces = outwardFaces(x, z);
  const perimeter = faces.length > 0;
  const corner = faces.length >= 2;

  // Foundation
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Ground-floor slab / base course
  g.set(x, gr, z, "polished_andesite");

  const { floors } = storeys(gr, top);
  for (const fl of floors) g.set(x, fl, z, "smooth_stone");

  // Walls: corners get polished pilasters, others rubble stone brick
  for (let y = gr + 1; y < top; y++) {
    if (!perimeter) continue;
    g.set(x, y, z, corner ? "polished_andesite" : "stone_bricks");
  }

  // Cornice course and roof slab
  if (perimeter) g.set(x, top - 1, z, "chiseled_stone_bricks");
  g.set(x, top, z, "smooth_stone");

  // Parapet on the outer edge
  if (perimeter && top + 1 < H) g.set(x, top + 1, z, "stone_brick_wall");
}

// Windows, lamps behind glass
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const faces = outwardFaces(x, z);
  if (!faces.length) continue;
  const { gr, top } = info.get(key(x, z));
  const { floors } = storeys(gr, top);
  const starts = [gr, ...floors];

  for (const face of faces) {
    const zFace = face === "north" || face === "south";
    const t = zFace ? x : z;
    const inward = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] }[face];
    const paneProps = zFace
      ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
      : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

    for (let i = 0; i < starts.length; i++) {
      const fl = starts[i];
      const ceil = i + 1 < starts.length ? starts[i + 1] : top;
      for (let y = fl + 1; y <= ceil - 2; y++) {
        if (door && door.x === x && door.z === z && face === "south" && y <= gr + 2) continue;
        if (t % 3 === 1 && !(corner_(x, z))) {
          g.set(x, y, z, "glass_pane", paneProps);
          if ((t + y + i) % 4 === 0) {
            const ix = x + inward[0], iz = z + inward[1];
            if (has(ix, iz)) g.set(ix, y, iz, "glowstone");
          }
        }
      }
    }
  }
}

function corner_(x, z) { return outwardFaces(x, z).length >= 2; }

// Entrance door and surround on the south face
if (door) {
  const { x, z, gr, top } = door;
  const dProps = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
  g.set(x, gr + 1, z, "oak_door", dProps("lower"));
  g.set(x, gr + 2, z, "oak_door", dProps("upper"));
  if (gr + 3 < top - 1) g.set(x, gr + 3, z, "chiseled_stone_bricks");
}

// Chimney stack on an interior roof
if (chimney) {
  g.set(chimney.x, chimney.top + 1, chimney.z, "bricks");
  g.set(chimney.x, chimney.top + 2, chimney.z, "bricks");
}

g.save(`${DIR}/FR301499726.nbt`);
