// Imperial Apartments, Auckland (way 482579526): a 1930s reinforced-concrete apartment block. Cream render on a
// volcanic-stone base, three setback tiers on one storey grid (podium to y 21, mid tier 22-33, top 34-50), a flat roof
// with a cornice and a plant room. The lidar roof (median 51) is the record; the odd 33/46 edge cells are noise and
// are flattened into the tiers. Solid foundation below each cell's ground; interiors are air behind 1-block shells.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_482579526.cells.json`, "utf8"));
const W = 18, D = 26, H = 64;
const NB = [[0, -1], [0, 1], [-1, 0], [1, 0]];       // north, south, west, east

const ground = new Int8Array(W * D).fill(-1);
const roofs = [];
for (const [x, z, g, r] of cells) { ground[z * W + x] = g; roofs.push(r); }
roofs.sort((a, b) => a - b);
const TOP = roofs[roofs.length >> 1];                 // roof surface height: the lidar median
const ROW = [0, 22, 34];                             // tier bases: podium, mid, top (on the storey grid)
const SET = [0, 2, 4];                               // setback per tier, in blocks in from the footprint edge
const FL = (y) => y >= 6 && (y - 6) % 4 === 0;       // storey lines every 4 blocks from y 6: floor slab + band

const inF = (x, z) => x >= 0 && z >= 0 && x < W && z < D && ground[z * W + x] >= 0;

// distance in from the footprint edge (edge cells = 1), so setbacks follow the plan's own outline
const dist = new Int16Array(W * D).fill(-1);
const queue = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (inF(x, z) && NB.some(([dx, dz]) => !inF(x + dx, z + dz))) { dist[z * W + x] = 1; queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i], d = dist[z * W + x];
  for (const [dx, dz] of NB) {
    const nx = x + dx, nz = z + dz;
    if (inF(nx, nz) && dist[nz * W + nx] < 0) { dist[nz * W + nx] = d + 1; queue.push([nx, nz]); }
  }
}

const inT = (x, z, k) => inF(x, z) && dist[z * W + x] >= 1 + SET[k];
const edgeOf = (x, z, k) => NB.filter(([dx, dz]) => !inT(x + dx, z + dz, k));   // outward normals of a tier wall cell
const bnd = (x, z, k) => inT(x, z, k) && edgeOf(x, z, k).length > 0;
const nrm = (x, z, k) => edgeOf(x, z, k)[0];

// the entrance: a north-facing ground-storey bay, low on the ground, near the middle of its face
let door = null;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const g = ground[z * W + x];
  if (g < 0 || g > 2 || !bnd(x, z, 0) || x % 3 !== 1) continue;
  const n = nrm(x, z, 0);
  if (n[0] !== 0 || n[1] !== -1) continue;
  const score = Math.abs(x - W / 2) + 3 * g;
  if (!door || score < door.score) door = { x, z, score };
}

const GLASS = (n) => n[0] !== 0
  ? { north: "true", south: "true", east: "false", west: "false" }   // x-facing: panes join along z
  : { north: "false", south: "false", east: "true", west: "true" };   // z-facing: panes join along x

// What stands at x, z, y: [block, state?, tag?]. Tags mark window glass so the lights can go behind it.
function spec(x, z, y) {
  const g = ground[z * W + x];
  if (y < g) return ["stone_bricks"];                 // foundation under the ground
  if (y >= TOP) return null;
  const k = y >= ROW[2] ? 2 : y >= ROW[1] ? 1 : 0;
  if (!inT(x, z, k)) {
    if (k > 0 && inT(x, z, k - 1)) {
      if (y === ROW[k]) return ["light_gray_concrete"];                        // terrace roof of the tier below
      if (y === ROW[k] + 1) {
        if (bnd(x, z, k - 1)) return ["smooth_quartz"];                          // terrace parapet
        if ((x + z) % 3 === 0) return ["flowering_azalea_leaves", { persistent: "true" }];   // pohutukawa-style planting
      }
    }
    return null;
  }
  const bd = bnd(x, z, k);
  if (y === TOP - 1) return bd ? ["quartz_bricks"] : ["light_gray_concrete"];   // roof, with the cornice on its edge
  if (y === TOP - 2 && bd) return ["quartz_bricks"];                            // cornice band
  if (y === g) return bd ? ["polished_andesite"] : ["smooth_stone"];          // base course and ground floor
  if (FL(y)) return bd ? ["quartz_bricks"] : ["smooth_stone"];                // storey line and floor slab
  if (!bd) return null;                                                        // interior air behind the shell
  if (y === 5) return ["quartz_bricks"];                                      // ground storey band
  const n = nrm(x, z, k);
  if (door && x === door.x && z === door.z && (y === g + 1 || y === g + 2)) {
    return ["dark_oak_door", { facing: "north", half: y === g + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
  }
  const along = n[0] !== 0 ? z : x;
  if (along % 3 === 0) return ["quartz_pillar"];                              // Deco fins between bays
  if (y >= 6 && (y - 6) % 4 === 3) return ["smooth_quartz"];                  // spandrel under each window band
  return ["light_blue_stained_glass_pane", GLASS(n), "glass"];
}

const v = new Voxels([W, H, D]);
const specs = new Map();
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inF(x, z)) continue;
  for (let y = 0; y < TOP; y++) {
    const s = spec(x, z, y);
    if (!s) continue;
    v.set(x, y, z, s[0], s[1]);
    if (s[2] === "glass") specs.set(`${x},${y},${z}`, s);
  }
}

// warm light behind some panes: a cell of air just inside the glass, on a hash so the pattern is scattered
let lights = 0;
for (const key of specs.keys()) {
  const [x, y, z] = key.split(",").map(Number);
  const k = y >= ROW[2] ? 2 : y >= ROW[1] ? 1 : 0;
  const h = (x * 5 + z * 7 + y * 3) % 29;
  if (h !== 0 && h !== 11) continue;
  const n = nrm(x, z, k);
  const ix = x - n[0], iz = z - n[1];
  if (!inT(ix, iz, k) || bnd(ix, iz, k) || spec(ix, iz, y)) continue;
  v.set(ix, y, iz, h === 0 ? "glowstone" : "shroomlight");
  lights++;
}

// plant room on the top tier's roof, set into the middle of the top tier
const top = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (inT(x, z, 2) && !bnd(x, z, 2)) top.push([x, z]);
const cx = top.reduce((s, [x]) => s + x, 0) / top.length, cz = top.reduce((s, [, z]) => s + z, 0) / top.length;
for (const [x, z] of top) {
  if (Math.abs(x - cx) > 2.5 || Math.abs(z - cz) > 2) continue;
  v.set(x, TOP, z, "smooth_quartz");
  v.set(x, TOP + 1, z, "smooth_quartz");
  v.set(x, TOP + 2, z, "light_gray_concrete");
}

const out = v.save(`${DIR}/way_482579526.nbt`);
console.log(JSON.stringify({ top: TOP, tierCells: [0, 1, 2].map((k) => cells.filter(([x, z]) => inT(x, z, k)).length), door, lights, ...out }));
